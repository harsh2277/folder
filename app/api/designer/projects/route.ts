import { createClient as createCookieClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

export async function GET(request: Request) {
  try {
    const cookieClient = await createCookieClient();
    const adminClient = getSupabaseAdmin();

    const { data: { user } } = await cookieClient.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = user.id;
    let designerName = 'Designer';

    const { data: profile } = await adminClient
      .from('profiles')
      .select('name, role')
      .eq('id', effectiveUserId)
      .maybeSingle();
    if (profile?.name) designerName = profile.name;

    const role = profile?.role;

    const selectCols = 'id, project_id_serial, project_name, client_name, area_sq_ft, payment_status, status, created_at, assigned_designer_id';

    let query = adminClient.from('projects').select(selectCols).order('created_at', { ascending: false });

    // Only admins may see every project; designers only see projects assigned to them
    if (role !== 'admin') {
      query = query.eq('assigned_designer_id', effectiveUserId);
    }

    const { data: projects, error } = await query;
    if (error) throw error;

    return Response.json({
      projects: projects || [],
      currentUserId: effectiveUserId,
      designerName,
    });
  } catch (err: any) {
    console.error('[designer/projects GET] Error:', err);
    return Response.json({ error: err.message || 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieClient = await createCookieClient();
    const adminClient = getSupabaseAdmin();

    const { data: { user } } = await cookieClient.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, status } = body;

    if (!projectId || !status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the caller is an admin or the designer assigned to this project
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const role = profile?.role;

    const { data: project } = await adminClient
      .from('projects')
      .select('assigned_designer_id')
      .eq('id', projectId)
      .maybeSingle();

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    if (role !== 'admin' && project.assigned_designer_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let updatedProject: any = null;

    // Try cookieClient first (passes RLS with user JWT)
    const { data: cData } = await cookieClient
      .from('projects')
      .update({ status })
      .eq('id', projectId)
      .select()
      .maybeSingle();

    if (cData) {
      updatedProject = cData;
    } else {
      // Fallback to adminClient
      const { data: aData } = await adminClient
        .from('projects')
        .update({ status })
        .eq('id', projectId)
        .select()
        .maybeSingle();

      updatedProject = aData;
    }

    return Response.json({
      success: true,
      project: updatedProject || { id: projectId, status }
    });
  } catch (err: any) {
    console.error('[designer/projects POST] Error:', err);
    return Response.json({ error: err.message || 'Failed to update project status' }, { status: 500 });
  }
}
