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

    // 1. Fetch profile name
    let architectName = user.user_metadata?.name || user.email?.split('@')[0] || 'Architect';
    const { data: prof } = await adminClient
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle();

    if (prof?.name) {
      architectName = prof.name;
    }

    // 2. Fetch architect's projects & payments
    let projects: any[] = [];
    const { data: dbProjects } = await adminClient
      .from('projects')
      .select('*, payments(amount, status)')
      .eq('architect_id', user.id)
      .order('created_at', { ascending: false });

    if (dbProjects && dbProjects.length > 0) {
      projects = dbProjects;
    } else {
      // Fallback query via cookieClient
      const { data: cookieProjects } = await cookieClient
        .from('projects')
        .select('*, payments(amount, status)')
        .eq('architect_id', user.id)
        .order('created_at', { ascending: false });
      projects = cookieProjects || [];
    }

    const recentProjects = projects.slice(0, 5);
    const revisionProjects = projects.filter((p: any) => p.status === 'Revision Requested');

    const total = projects.length;
    const completed = projects.filter((p: any) => p.status === 'Closed' || p.status === 'Approved').length;
    const inDesign = projects.filter((p: any) => p.status === 'In Design').length;
    const underReview = projects.filter((p: any) => p.status === 'Under Review').length;

    const invoiced = projects.reduce((sum: number, p: any) => {
      const projectPayments = p.payments || [];
      const projectPaidSum = projectPayments
        .filter((pay: any) => pay.status === 'completed')
        .reduce((paySum: number, pay: any) => paySum + Number(pay.amount), 0);
      return sum + projectPaidSum;
    }, 0);

    return NextResponse.json({
      success: true,
      architectName,
      recentProjects,
      revisionProjects,
      stats: {
        totalProjects: total,
        completedProjects: completed,
        inDesignProjects: inDesign,
        underReviewProjects: underReview,
        totalInvoiced: invoiced
      }
    });

  } catch (err: any) {
    console.error('[GET /api/architect/dashboard] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
