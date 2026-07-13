import { createClient as createCookieClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function checkUserAuth(projectId: string) {
  const supabase = await createCookieClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch profile for role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  // Admin has access to all projects
  if (profile.role === 'admin') {
    return { user, role: 'admin' };
  }

  // Fetch project details to check ownership/assignment
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, architect_id, assigned_designer_id')
    .eq('id', projectId)
    .single();

  if (!project) return null;

  if (profile.role === 'designer' && project.assigned_designer_id === user.id) {
    return { user, role: 'designer' };
  }

  if (profile.role === 'architect' && project.architect_id === user.id) {
    return { user, role: 'architect' };
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
      console.error('Bucket check/creation error:', bucketErr);
    }

    // Upload using supabaseAdmin
    const { error: uploadError } = await supabaseAdmin.storage
      .from('project-assets')
      .upload(filePath, Buffer.from(buffer), {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    // Insert DB record using supabaseAdmin (use mapped DB category)
    const { data: fileRecord, error: dbError } = await supabaseAdmin
      .from('project_files')
      .insert({
        project_id: id,
        uploaded_by: auth.user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: fileExt || '',
        category: dbCategory,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return Response.json({ success: true, fileRecord });
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
