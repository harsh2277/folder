import { createClient as createCookieClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

export type AppRole = 'admin' | 'architect' | 'designer';

export interface AuthContext {
  userId: string;
  role: AppRole | null;
}

export interface ProjectAuthContext extends AuthContext {
  project: { id: string; architect_id: string | null; assigned_designer_id: string | null };
}

/**
 * Resolves the authenticated user and their role from the profiles table.
 * Role is always read from `profiles`, never from client-editable `user_metadata`.
 * Returns null if there is no valid session.
 */
export async function requireUser(): Promise<AuthContext | null> {
  const cookieClient = await createCookieClient();
  const adminClient = getSupabaseAdmin();

  const { data: { user } } = await cookieClient.auth.getUser();
  if (!user) return null;

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return { userId: user.id, role: (profile?.role as AppRole) || null };
}

/** Like requireUser, but also rejects if the caller's role isn't in `roles`. */
export async function requireRole(roles: AppRole[]): Promise<AuthContext | null> {
  const ctx = await requireUser();
  if (!ctx || !ctx.role || !roles.includes(ctx.role)) return null;
  return ctx;
}

/**
 * Resolves the caller and verifies they may act on the given project:
 * admins may act on any project; architects/designers only on projects
 * they own/are assigned to. Returns null if unauthenticated, unauthorized,
 * or the project doesn't exist.
 */
export async function requireProjectAccess(projectId: string): Promise<ProjectAuthContext | null> {
  const ctx = await requireUser();
  if (!ctx) return null;

  const adminClient = getSupabaseAdmin();
  const { data: project } = await adminClient
    .from('projects')
    .select('id, architect_id, assigned_designer_id')
    .eq('id', projectId)
    .maybeSingle();

  if (!project) return null;

  if (ctx.role === 'admin') return { ...ctx, project };
  if (ctx.role === 'architect' && project.architect_id === ctx.userId) return { ...ctx, project };
  if (ctx.role === 'designer' && project.assigned_designer_id === ctx.userId) return { ...ctx, project };

  return null;
}
