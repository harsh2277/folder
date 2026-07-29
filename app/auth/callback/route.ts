import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedRole = searchParams.get('requested_role') || 'architect';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          role: requestedRole,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
          email: data.user.email,
          mobile_number: '',
        });
      }

      const role = profile?.role || requestedRole;
      const name =
        data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || '';

      return NextResponse.redirect(
        `${origin}/auth/welcome?name=${encodeURIComponent(name)}&role=${encodeURIComponent(role)}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
