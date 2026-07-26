import { createClient as createCookieClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

async function resolveUserId(): Promise<string | null> {
  try {
    const supabase = await createCookieClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch (_) {}
  return null;
}

async function isAuthorizedForProject(userId: string, projectId: string): Promise<boolean> {
  const adminClient = getSupabaseAdmin();

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.role === 'admin') return true;

  const { data: project } = await adminClient
    .from('projects')
    .select('assigned_designer_id')
    .eq('id', projectId)
    .maybeSingle();

  return project?.assigned_designer_id === userId;
}

/**
 * POST /api/designer/projects/[id]/revision
 * Body: { revisionId: string, designerNotes: string }
 *
 * Designer submits their resolution notes for an approved revision request.
 * Marks the revision as 'completed' and updates project status to 'Ready for Client Review'.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { id } = await params;

    if (!(await isAuthorizedForProject(userId, id))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { revisionId, designerNotes } = body;

    if (!revisionId || !designerNotes?.trim()) {
      return Response.json({ error: 'revisionId and designerNotes are required' }, { status: 400 });
    }

    // Verify the revision belongs to this project and is in 'approved' state
    const { data: revision, error: fetchErr } = await supabaseAdmin
      .from('revision_requests')
      .select('id, project_id, status, description')
      .eq('id', revisionId)
      .eq('project_id', id)
      .single();

    if (fetchErr || !revision) {
      return Response.json({ error: 'Revision request not found' }, { status: 404 });
    }

    if (revision.status !== 'approved') {
      return Response.json({ error: 'This revision has not been approved by admin yet' }, { status: 400 });
    }

    const updatedDescription = `${revision.description || ''}\n\n=== DESIGNER_RESOLUTION ===\n${designerNotes.trim()}`;

    // Append designer notes inline — status stays 'approved' (constraint only allows pending/approved/declined)
    // Resolved state is detected in UI by parsing the DESIGNER_RESOLUTION separator in description
    const { error: revErr } = await supabaseAdmin
      .from('revision_requests')
      .update({ description: updatedDescription })
      .eq('id', revisionId);

    if (revErr) throw revErr;

    // Move project status forward to Ready for Client Review
    const { error: projErr } = await supabaseAdmin
      .from('projects')
      .update({ status: 'Ready for Client Review' })
      .eq('id', id);

    if (projErr) throw projErr;

    return Response.json({ success: true });
  } catch (err: any) {
    console.error('Error submitting designer revision notes:', err);
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
