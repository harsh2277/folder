import { createClient as createCookieClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function checkDesignerAuth() {
  const supabase = await createCookieClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'designer') return null;
  return user;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const designerUser = await checkDesignerAuth();
    if (!designerUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 1. Verify project assignment
    const { data: project, error: projError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('assigned_designer_id', designerUser.id)
      .single();

    if (projError || !project) {
      return Response.json({ error: 'Project not found or not assigned to you' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;

    if (!file || !category) {
      return Response.json({ error: 'File and category are required' }, { status: 400 });
    }

    // 2. Upload file to Supabase storage using admin client
    const fileExt = file.name.split('.').pop();
    const filePath = `deliverables/${id}/${category}-${Date.now()}.${fileExt}`;
    
    // Convert File to ArrayBuffer
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from('project-assets')
      .upload(filePath, Buffer.from(buffer), {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 3. Create db record in project_files using admin client
    const { data: fileRecord, error: dbError } = await supabaseAdmin
      .from('project_files')
      .insert({
        project_id: id,
        file_name: file.name,
        file_path: filePath,
        category: category
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return Response.json({ success: true, fileRecord });
  } catch (err: any) {
    console.error('Error handling designer upload API:', err);
    return Response.json({ error: err.message || 'Failed to upload deliverable' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const designerUser = await checkDesignerAuth();
    if (!designerUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { fileId, filePath } = await request.json();

    if (!fileId || !filePath) {
      return Response.json({ error: 'Missing fileId or filePath' }, { status: 400 });
    }

    // 1. Verify project assignment
    const { data: project, error: projError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('assigned_designer_id', designerUser.id)
      .single();

    if (projError || !project) {
      return Response.json({ error: 'Project not found or not assigned to you' }, { status: 404 });
    }

    // 2. Delete file from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('project-assets')
      .remove([filePath]);

    if (storageError) throw storageError;

    // 3. Delete database record
    const { error: dbError } = await supabaseAdmin
      .from('project_files')
      .delete()
      .eq('id', fileId)
      .eq('project_id', id);

    if (dbError) throw dbError;

    return Response.json({ success: true });
  } catch (err: any) {
    console.error('Error handling designer delete API:', err);
    return Response.json({ error: err.message || 'Failed to delete deliverable' }, { status: 500 });
  }
}
