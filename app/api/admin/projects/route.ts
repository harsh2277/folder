import { getSupabaseAdmin } from '@/utils/supabase/admin';
import { requireRole } from '@/utils/supabase/authorize';

export async function GET() {
  try {
    const auth = await requireRole(['admin']);
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('id, project_id_serial, project_name, client_name, area_sq_ft, payment_status, status, site_location, created_at, architect_id, deadline')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return Response.json({ success: true, projects: projects || [] });
  } catch (err: any) {
    console.error('[GET /api/admin/projects] Error:', err);
    return Response.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
