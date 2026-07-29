import { getSupabaseAdmin } from '@/utils/supabase/admin';

export async function POST(request: Request) {
  const { email, redirectTo } = await request.json();

  if (!email || typeof email !== 'string') {
    return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!profile) {
    return Response.json(
      { error: 'No account exists with this email address. Please check the email or sign up.' },
      { status: 404 }
    );
  }

  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ success: true });
}
