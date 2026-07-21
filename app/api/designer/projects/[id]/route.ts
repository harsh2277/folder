import { createClient as createCookieClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Resolve best available client: cookie session (has user JWT) > admin client
    const cookieClient = await createCookieClient();
    const adminClient = getSupabaseAdmin();

    // Self-healing: ensure project-assets bucket exists (non-critical)
    try {
      const { data: buckets } = await adminClient.storage.listBuckets();
      const hasBucket = buckets?.some(b => b.name === 'project-assets');
      if (!hasBucket) {
        await adminClient.storage.createBucket('project-assets', { public: true });
      }
    } catch (_) {}

    // Try fetching project via cookie session first (user JWT satisfies RLS)
    let project: any = null;
    let remarks: any = null;
    let preferences: any[] = [];
    let files: any[] = [];
    let revisions: any[] = [];

    const { data: cookieProject, error: cookieErr } = await cookieClient
      .from('projects')
      .select('*, pricing_plans(name)')
      .eq('id', id)
      .maybeSingle();

    if (cookieProject) {
      project = cookieProject;
    } else {
      // Fallback to admin client (works if service role key is set)
      const { data: adminProject, error: adminErr } = await adminClient
        .from('projects')
        .select('*, pricing_plans(name)')
        .eq('id', id)
        .maybeSingle();

      if (adminProject) {
        project = adminProject;
      } else {
        console.error('[designer/projects/[id]] Project not found:', cookieErr?.message, adminErr?.message);
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    // Fetch related data — try cookie client, fall back to admin
    const fetchRelated = async (table: string, query: any) => {
      try {
        const { data, error } = await query;
        if (error) throw error;
        return data;
      } catch (_) {
        return null;
      }
    };

    // Remarks
    const { data: remarksData } = await cookieClient
      .from('project_remarks')
      .select('*')
      .eq('project_id', id)
      .maybeSingle();
    remarks = remarksData || null;

    // Preferences
    const { data: prefsData } = await cookieClient
      .from('project_lighting_preferences')
      .select('preference_name')
      .eq('project_id', id);
    preferences = prefsData || [];

    // Files — try cookie session first
    const { data: cookieFiles } = await cookieClient
      .from('project_files')
      .select('*, profiles:uploaded_by(role)')
      .eq('project_id', id);

    if (cookieFiles) {
      files = cookieFiles;
    } else {
      const { data: adminFiles } = await adminClient
        .from('project_files')
        .select('*, profiles:uploaded_by(role)')
        .eq('project_id', id);
      files = adminFiles || [];
    }

    // Revisions
    const { data: revisionsData } = await cookieClient
      .from('revision_requests')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });
    revisions = revisionsData || [];

    return Response.json({
      project,
      remarks,
      preferences,
      files,
      revisions,
    });
  } catch (err: any) {
    console.error('[designer/projects/[id] GET] Error:', err);
    return Response.json({ error: err.message || 'Failed to fetch details' }, { status: 500 });
  }
}
