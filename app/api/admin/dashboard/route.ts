import { createClient as createCookieClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

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
    const adminUser = await checkAdminAuth();
    if (!adminUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch designers
    const { data: designers, error: desError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email')
      .eq('role', 'designer');

    if (desError) throw desError;

    // Fetch projects
    const { data: projects, error: projError } = await supabaseAdmin
      .from('projects')
      .select('id, project_id_serial, project_name, client_name, status, created_at, updated_at, area_sq_ft, project_type')
      .order('updated_at', { ascending: false });

    if (projError) throw projError;

    // Fetch payments
    const { data: payments, error: payError } = await supabaseAdmin
      .from('payments')
      .select('amount, status');

    if (payError) throw payError;

    return Response.json({
      designers: designers || [],
      projects: projects || [],
      payments: payments || []
    });
  } catch (err: any) {
    console.error('Admin Dashboard API Error:', err);
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
