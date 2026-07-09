import { createClient as createCookieClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client using the secret role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function checkDesignerAuth() {
  const supabase = await createCookieClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'designer') return null;
  return user;
}

export async function GET(request: Request) {
  try {
    const designerUser = await checkDesignerAuth();
    if (!designerUser) {
      return Response.json({ error: 'Unauthorized: Designer role required' }, { status: 401 });
    }

    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('id, project_id_serial, project_name, client_name, area_sq_ft, payment_status, status, created_at')
      .eq('assigned_designer_id', designerUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return Response.json({ projects });
  } catch (err: any) {
    console.error('Error fetching designer projects:', err);
    return Response.json({ error: err.message || 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const designerUser = await checkDesignerAuth();
    if (!designerUser) {
      return Response.json({ error: 'Unauthorized: Designer role required' }, { status: 401 });
    }

    const { projectId, status } = await request.json();
    if (!projectId || !status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: updatedProject, error } = await supabaseAdmin
      .from('projects')
      .update({ status })
      .eq('id', projectId)
      .eq('assigned_designer_id', designerUser.id)
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, project: updatedProject });
  } catch (err: any) {
    console.error('Error updating project status:', err);
    return Response.json({ error: err.message || 'Failed to update project status' }, { status: 500 });
  }
}
