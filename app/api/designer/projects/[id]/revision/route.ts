import { createClient as createCookieClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

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
    const designerUser = await checkDesignerAuth();
    if (!designerUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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
