import { NextResponse } from 'next/server';
import { createClient as createCookieClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

export async function GET(request: Request) {
  try {
    const cookieClient = await createCookieClient();
    const adminClient = getSupabaseAdmin();

    let user: any = null;
    const { data: sessionData } = await cookieClient.auth.getSession();
    if (sessionData?.session?.user) {
      user = sessionData.session.user;
    } else {
      const { data: userData } = await cookieClient.auth.getUser();
      user = userData?.user;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let projects: any[] = [];

    // Query projects for architect or admin
    const { data: adminProjects } = await adminClient
      .from('projects')
      .select('id, project_id_serial, project_name, client_name, area_sq_ft, payment_status, status, site_location, created_at, project_notes, architect_id')
      .eq('architect_id', user.id)
      .order('created_at', { ascending: false });

    if (adminProjects && adminProjects.length > 0) {
      projects = adminProjects;
    } else {
      const { data: cookieProjects } = await cookieClient
        .from('projects')
        .select('id, project_id_serial, project_name, client_name, area_sq_ft, payment_status, status, site_location, created_at, project_notes, architect_id')
        .eq('architect_id', user.id)
        .order('created_at', { ascending: false });
      projects = cookieProjects || [];
    }

    return NextResponse.json({
      success: true,
      projects
    });

  } catch (err: any) {
    console.error('[GET /api/projects] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
