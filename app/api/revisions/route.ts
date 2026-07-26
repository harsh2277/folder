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

    const { data: revData } = await adminClient
      .from('revision_requests')
      .select('*, projects!project_id(id, project_name, project_id_serial, client_name)')
      .order('created_at', { ascending: false });

    let finalRevisions = revData || [];
    if (!revData || revData.length === 0) {
      const { data: fallbackRev } = await adminClient
        .from('revision_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: allProjects } = await adminClient
        .from('projects')
        .select('id, project_name, project_id_serial, client_name');

      finalRevisions = (fallbackRev || []).map((r: any) => {
        const matched = (allProjects || []).find((p: any) => p.id === r.project_id);
        return {
          ...r,
          projects: matched ? {
            id: matched.id,
            project_name: matched.project_name,
            project_id_serial: matched.project_id_serial,
            client_name: matched.client_name
          } : null
        };
      });
    }

    return NextResponse.json({
      success: true,
      revisions: finalRevisions || []
    });

  } catch (err: any) {
    console.error('[GET /api/revisions] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
