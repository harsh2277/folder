import { createClient as createCookieClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const designerUser = await checkDesignerAuth();
    if (!designerUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { id } = await params;

    // Self-healing check for project-assets bucket
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const hasBucket = buckets?.some(b => b.name === 'project-assets');
      if (!hasBucket) {
        await supabaseAdmin.storage.createBucket('project-assets', {
          public: true
        });
      }
    } catch (e) {
      console.error('Error ensuring project-assets bucket exists:', e);
    }

    // Verify that the project is indeed assigned to this designer
    const { data: project, error: projError } = await supabaseAdmin
      .from('projects')
      .select('*, pricing_plans(name)')
      .eq('id', id)
      .eq('assigned_designer_id', designerUser.id)
      .single();

    if (projError || !project) {
      return Response.json({ error: 'Project not found or not assigned to you' }, { status: 404 });
    }

    // Fetch remarks
    const { data: remarks } = await supabaseAdmin
      .from('project_remarks')
      .select('*')
      .eq('project_id', id)
      .maybeSingle();

    // Fetch preferences
    const { data: preferences } = await supabaseAdmin
      .from('project_lighting_preferences')
      .select('preference_name')
      .eq('project_id', id);

    // Fetch files
    const { data: files } = await supabaseAdmin
      .from('project_files')
      .select('*, profiles:uploaded_by(role)')
      .eq('project_id', id);

    // Fetch revisions
    const { data: revisions } = await supabaseAdmin
      .from('revision_requests')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    return Response.json({
      project,
      remarks: remarks || null,
      preferences: preferences || [],
      files: files || [],
      revisions: revisions || []
    });
  } catch (err: any) {
    console.error('Error fetching designer project detail API:', err);
    return Response.json({ error: err.message || 'Failed to fetch details' }, { status: 500 });
  }
}
