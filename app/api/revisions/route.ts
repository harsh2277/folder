import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';
import { requireUser } from '@/utils/supabase/authorize';

export async function GET() {
  try {
    const auth = await requireUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = getSupabaseAdmin();
    const { role, userId } = auth;

    let projectFilter: string[] | null = null;
    if (role !== 'admin') {
      const ownerColumn = role === 'designer' ? 'assigned_designer_id' : 'architect_id';
      const { data: scopedProjects } = await adminClient
        .from('projects')
        .select('id')
        .eq(ownerColumn, userId);
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
