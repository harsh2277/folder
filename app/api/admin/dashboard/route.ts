import { createClient as createCookieClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

async function checkAdminAuth() {
  const supabase = await createCookieClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') return null;
  return user;
}

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch designers (all staff/designer profiles)
    const { data: designers, error: desError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role')
      .neq('role', 'architect');

    if (desError) throw desError;

    // Fetch projects
    const { data: projects, error: projError } = await supabaseAdmin
      .from('projects')
      .select('id, project_id_serial, project_name, client_name, status, created_at, updated_at, area_sq_ft, project_type, assigned_designer_id, calculated_price, payment_status')
      .order('updated_at', { ascending: false });

    if (projError) throw projError;

    // Fetch payments
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('id, project_id, amount, status, created_at, invoice_number');

    // Fetch architects
    const { data: architects } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email')
      .eq('role', 'architect');

    // Fetch revision requests
    const { data: revisionRequests } = await supabaseAdmin
      .from('revision_requests')
      .select('id, status, created_at, description, project_id');

    return Response.json({
      designers: designers || [],
      architects: architects || [],
      projects: projects || [],
      payments: payments || [],
      revisionRequests: revisionRequests || []
    });
  } catch (err: any) {
    console.error('Admin Dashboard API Error:', err);
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
