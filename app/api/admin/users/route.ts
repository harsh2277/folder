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
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role, mobile_number, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Response.json({ users: users || [] });
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return Response.json({ error: err.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { email, password, name, role, mobileNumber } = await request.json();

    if (!email || !password || !name || !role) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        mobile_number: mobileNumber || '',
      }
    });

    if (createError) throw createError;

    return Response.json({ user: newUser.user });
  } catch (err: any) {
    console.error('Error creating user:', err);
    return Response.json({ error: err.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const adminUser = await checkAdminAuth();
    if (!adminUser) {
      return Response.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { userId, email, name, role, mobileNumber } = await request.json();

    if (!userId || !email || !name || !role) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Update Auth email & metadata
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email,
      user_metadata: {
        name,
        role,
        mobile_number: mobileNumber || '',
      }
    });
    if (authError) throw authError;

    // 2. Update profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        name,
        email,
        role,
        mobile_number: mobileNumber || '',
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    return Response.json({ success: true });
  } catch (err: any) {
    console.error('Error updating user:', err);
    return Response.json({ error: err.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminUser = await checkAdminAuth();
    if (!adminUser) {
      return Response.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { userId } = await request.json();

    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 1. Delete from profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) throw profileError;

    // 2. Delete auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    return Response.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting user:', err);
    return Response.json({ error: err.message || 'Failed to delete user' }, { status: 500 });
  }
}
