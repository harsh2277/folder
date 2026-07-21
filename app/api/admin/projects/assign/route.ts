import { createClient as createCookieClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

export async function POST(request: Request) {
  try {
    const { projectId, designerId, status } = await request.json();

    if (!projectId) {
      return Response.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (designerId) updateFields.assigned_designer_id = designerId;

    // Try admin client first (service role key bypass RLS)
    const supabaseAdmin = getSupabaseAdmin();
    const { data: updatedProject, error: adminError } = await supabaseAdmin
      .from('projects')
      .update(updateFields)
      .eq('id', projectId)
      .select()
      .single();

    if (!adminError && updatedProject) {
      return Response.json({ success: true, project: updatedProject });
    }

    // Fallback: use authenticated cookie session (admin user's JWT can bypass RLS)
    console.warn('[assign] Admin client failed, trying cookie session:', adminError?.message);
    const supabaseCookie = await createCookieClient();
    const { data: cookieProject, error: cookieError } = await supabaseCookie
      .from('projects')
      .update(updateFields)
      .eq('id', projectId)
      .select()
      .single();

    if (cookieError) {
      console.error('[assign] Cookie session also failed:', cookieError);
      // Return success anyway — the client-side will apply the update optimistically
      return Response.json({ 
        success: false, 
        warning: 'DB update may have failed due to RLS. Please add service role key.',
        error: cookieError.message 
      });
    }

    return Response.json({ success: true, project: cookieProject });
  } catch (err: any) {
    console.error('Error in /api/admin/projects/assign:', err);
    return Response.json({ error: err.message || 'Failed to update project assignment' }, { status: 500 });
  }
}
