import { NextResponse } from 'next/server';
import { createClient as createCookieClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

export async function GET() {
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

    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const role = profile?.role;

    let projectFilter: string[] | null = null;
    if (role !== 'admin') {
      const ownerColumn = role === 'designer' ? 'assigned_designer_id' : 'architect_id';
      const { data: scopedProjects } = await adminClient
        .from('projects')
        .select('id')
        .eq(ownerColumn, user.id);
      projectFilter = (scopedProjects || []).map((p: any) => p.id);

      if (projectFilter.length === 0) {
        return NextResponse.json({ success: true, revisions: [] });
      }
    }

    let query = adminClient
      .from('revision_requests')
      .select('*, projects!project_id(id, project_name, project_id_serial, client_name)')
      .order('created_at', { ascending: false });

    if (projectFilter) {
      query = query.in('project_id', projectFilter);
    }

    const { data: revData, error: revError } = await query;
    if (revError) throw revError;

    return NextResponse.json({
      success: true,
      revisions: revData || []
    });

  } catch (err: any) {
    console.error('[GET /api/revisions] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
