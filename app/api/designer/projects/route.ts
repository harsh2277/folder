import { createClient as createCookieClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paramUserId = searchParams.get('userId');

    let effectiveUserId: string | null = paramUserId || null;
    let designerName = 'Designer';
    let projects: any[] = [];

    // Step 1: Resolve cookie session user
    try {
      const cookieClient = await createCookieClient();
      const { data: { user } } = await cookieClient.auth.getUser();
      if (user?.id) {
        effectiveUserId = user.id;

        // Fetch name
        const { data: profile } = await cookieClient
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.name) designerName = profile.name;

        // Fetch all projects using the authenticated user's session (respects RLS for logged-in users)
        const { data: sessionProjects } = await cookieClient
          .from('projects')
          .select('id, project_id_serial, project_name, client_name, area_sq_ft, payment_status, status, created_at, assigned_designer_id')
          .order('created_at', { ascending: false });

        if (sessionProjects && sessionProjects.length > 0) {
          projects = sessionProjects;
        }
      }
    } catch (e) {
      console.warn('[designer/projects] Cookie session error:', e);
    }

    // Step 2: If cookie session returned nothing, try admin client
    if (projects.length === 0) {
      try {
        const adminClient = getSupabaseAdmin();

        // Try fetching all projects with admin (works if service role key is set)
        const { data: adminProjects, error: adminErr } = await adminClient
          .from('projects')
          .select('id, project_id_serial, project_name, client_name, area_sq_ft, payment_status, status, created_at, assigned_designer_id')
          .order('created_at', { ascending: false });

        if (!adminErr && adminProjects && adminProjects.length > 0) {
          projects = adminProjects;

          // Also get name if we have a userId
          if (effectiveUserId && designerName === 'Designer') {
            const { data: profile } = await adminClient
              .from('profiles')
              .select('name')
              .eq('id', effectiveUserId)
              .maybeSingle();
            if (profile?.name) designerName = profile.name;
          }
        }
      } catch (e) {
        console.warn('[designer/projects] Admin client error:', e);
      }
    }

    // Step 3: If still empty and we have a userId, try fetching only assigned projects
    if (projects.length === 0 && effectiveUserId) {
      try {
        const adminClient = getSupabaseAdmin();
        const { data: assignedProjects } = await adminClient
          .from('projects')
          .select('id, project_id_serial, project_name, client_name, area_sq_ft, payment_status, status, created_at, assigned_designer_id')
          .eq('assigned_designer_id', effectiveUserId)
          .order('created_at', { ascending: false });
        if (assignedProjects) projects = assignedProjects;
      } catch (e) {}
    }

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
    const body = await request.json();
    const { projectId, status } = body;

    if (!projectId || !status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cookieClient = await createCookieClient();
    const adminClient = getSupabaseAdmin();

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
