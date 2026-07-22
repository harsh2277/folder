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

    // 1. Fetch project IDs assigned to user
    const { data: projects } = await adminClient
      .from('projects')
      .select('id')
      .eq('architect_id', user.id);

    const projectIds = projects?.map((p: any) => p.id) || [];
    let payments: any[] = [];

    if (projectIds.length > 0) {
      const { data: payData } = await adminClient
        .from('payments')
        .select('*, projects(project_name, client_name, project_id_serial, area_sq_ft, pricing_plans(name, base_price_per_sq_ft))')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });
      payments = payData || [];
    }

    return NextResponse.json({
      success: true,
      payments
    });

  } catch (err: any) {
    console.error('[GET /api/payments] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
