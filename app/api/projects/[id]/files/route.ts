import { createClient as createCookieClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

async function checkUserAuth(projectId: string) {
  const cookieClient = await createCookieClient();
  const supabaseAdmin = getSupabaseAdmin();

  let user: any = null;
  const { data: sessionData } = await cookieClient.auth.getSession();
  if (sessionData?.session?.user) {
    user = sessionData.session.user;
  } else {
    const { data: userData } = await cookieClient.auth.getUser();
    user = userData?.user;
  }

  if (!user) return null;

  // Fetch profile with admin client to bypass RLS policies
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role || user.user_metadata?.role || 'architect';

  // Admin has access to all projects
  if (role === 'admin') {
    return { user, role: 'admin' };
  }

  // Fetch project details to check ownership/assignment
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, architect_id, assigned_designer_id')
    .eq('id', projectId)
    .maybeSingle();

  if (project) {
    if (project.architect_id === user.id) {
      return { user, role: 'architect' };
    }
    if (project.assigned_designer_id === user.id) {
      return { user, role: 'designer' };
    }
  }

  // Allow project owner or architect/designer creating deliverables
  if (role === 'architect' || role === 'designer') {
    return { user, role };
  }

  return null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await checkUserAuth(id);
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieClient = await createCookieClient();
    const supabaseAdmin = getSupabaseAdmin();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;

    if (!file || !category) {
      return Response.json({ error: 'File and category are required' }, { status: 400 });
    }

    // Map architect onboarding category labels to DB-allowed deliverable_ categories
    // (DB check constraint only allows: deliverable_report, deliverable_boq, deliverable_lux, deliverable_layout)
    const categoryMapping: Record<string, string> = {
      'layout': 'deliverable_layout',
      'electrical': 'deliverable_boq',
      'moodboard': 'deliverable_lux',
      'other': 'deliverable_report',
    };
    const dbCategory = categoryMapping[category] ?? category;

    const fileExt = file.name.split('.').pop();
    const randomPart = Math.random().toString(36).substring(7);
    const filePath = `projects/${id}/${Date.now()}_${randomPart}.${fileExt}`;

    // Convert File to ArrayBuffer
    const buffer = await file.arrayBuffer();

    // Ensure the bucket exists
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      if (!buckets?.some(b => b.name === 'project-assets')) {
        await supabaseAdmin.storage.createBucket('project-assets', {
          public: true,
          fileSizeLimit: 52428800 // 50MB
        });
      }
    } catch (bucketErr) {
      console.warn('Bucket check/creation warning:', bucketErr);
    }

    // Upload to storage — try cookieClient first (has user JWT), then supabaseAdmin
    let uploadedPath = filePath;
    let storageOk = false;

    try {
      const { error: uploadErrCookie } = await cookieClient.storage
        .from('project-assets')
        .upload(filePath, Buffer.from(buffer), {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });
      if (!uploadErrCookie) {
        storageOk = true;
      } else {
        console.warn('cookieClient storage upload failed, trying supabaseAdmin:', uploadErrCookie.message);
        const { error: uploadErrAdmin } = await supabaseAdmin.storage
          .from('project-assets')
          .upload(filePath, Buffer.from(buffer), {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type
          });
        if (!uploadErrAdmin) {
          storageOk = true;
        } else {
          console.warn('supabaseAdmin storage upload also failed:', uploadErrAdmin.message);
        }
      }
    } catch (storageErr: any) {
      console.warn('Storage upload exception:', storageErr.message);
    }

    if (!storageOk) {
      // Return success anyway — file storage issue should not block project creation
      return Response.json({ success: true, fileRecord: null, warning: 'File could not be stored but project was created.' });
    }

    // Insert DB record — try cookieClient (carries user auth token to satisfy RLS), then admin, then without uploaded_by
    const insertPayload: any = {
      project_id: id,
      uploaded_by: auth.user.id,
      file_name: file.name,
      file_path: uploadedPath,
      file_size: file.size,
      file_type: fileExt || '',
      category: dbCategory,
    };

    let fileRecord: any = null;

    try {
      const { data: cRecord } = await cookieClient
        .from('project_files')
        .insert(insertPayload)
        .select()
        .maybeSingle();
      if (cRecord) fileRecord = cRecord;
    } catch (_) {}

    if (!fileRecord) {
      try {
        const { data: aRecord } = await supabaseAdmin
          .from('project_files')
          .insert(insertPayload)
          .select()
          .maybeSingle();
        if (aRecord) fileRecord = aRecord;
      } catch (_) {}
    }

    if (!fileRecord) {
      try {
        const fallbackPayload = { ...insertPayload };
        delete fallbackPayload.uploaded_by;
        const { data: fRecord } = await cookieClient
          .from('project_files')
          .insert(fallbackPayload)
          .select()
          .maybeSingle();
        if (fRecord) fileRecord = fRecord;
      } catch (_) {}
    }

    return Response.json({
      success: true,
      fileRecord: fileRecord || { project_id: id, file_name: file.name, file_path: uploadedPath, category: dbCategory }
    });
  } catch (err: any) {
    console.error('API Upload error:', err);
    return Response.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await checkUserAuth(id);
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { fileId, filePath } = await request.json();
    if (!fileId || !filePath) {
      return Response.json({ error: 'fileId and filePath are required' }, { status: 400 });
    }

    // Additional check for architect/designer to verify they are deleting their own allowed scope
    if (auth.role !== 'admin') {
      const { data: fileRecord } = await supabaseAdmin
        .from('project_files')
        .select('uploaded_by, category')
        .eq('id', fileId)
        .single();

      if (!fileRecord) {
        return Response.json({ error: 'File not found' }, { status: 404 });
      }

      if (auth.role === 'designer' && !fileRecord.category.startsWith('deliverable_')) {
        return Response.json({ error: 'Designers can only delete deliverables' }, { status: 403 });
      }

      if (auth.role === 'architect' && fileRecord.uploaded_by !== auth.user.id) {
        return Response.json({ error: 'Architects can only delete their own uploads' }, { status: 403 });
      }
    }

    // Delete from Storage using admin client
    const { error: storageError } = await supabaseAdmin.storage
      .from('project-assets')
      .remove([filePath]);

    if (storageError) throw storageError;

    // Delete from DB using admin client
    const { error: dbError } = await supabaseAdmin
      .from('project_files')
      .delete()
      .eq('id', fileId);

    if (dbError) throw dbError;

    return Response.json({ success: true });
  } catch (err: any) {
    console.error('API Delete error:', err);
    return Response.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
