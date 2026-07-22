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

    // Try fetching profile with cookie client first, then admin client fallback
    let profile: any = null;

    const { data: cookieProf } = await cookieClient
      .from('profiles')
      .select('id, name, email, role, mobile_number, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (cookieProf) {
      profile = cookieProf;
    } else {
      const { data: adminProf } = await adminClient
        .from('profiles')
        .select('id, name, email, role, mobile_number, created_at')
        .eq('id', user.id)
        .maybeSingle();
      profile = adminProf;
    }

    if (!profile) {
      // Fallback profile object if DB row doesn't exist yet
      profile = {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: user.user_metadata?.role || 'architect',
        mobile_number: user.phone || ''
      };
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      profile
    });
  } catch (err: any) {
    console.error('[GET /api/profile] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
