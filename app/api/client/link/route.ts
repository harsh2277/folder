import { NextResponse } from 'next/server';
import { requireProjectAccess } from '@/utils/supabase/authorize';
import { generateClientToken } from '@/utils/clientLinkToken';

// Issues a signed token for the public client-review link so that
// /client/project/[id] and /api/client/approval can verify the link wasn't
// guessed/enumerated. Only callable by someone with access to the project
// (admin, the owning architect, or the assigned designer).
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const auth = await requireProjectAccess(projectId);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const token = generateClientToken(projectId);
    return NextResponse.json({ success: true, token });
  } catch (err: any) {
    console.error('[client/link] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
