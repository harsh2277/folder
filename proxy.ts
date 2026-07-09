import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: 604800, // 7 days in seconds
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set({ name, value, ...options })
          );
        },
      },
    }
  );

  // Retrieve user session
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Paths requiring protection
  const isProtectedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/architect') ||
    pathname.startsWith('/designer') ||
    pathname === '/';

  // 1. If not authenticated and visiting protected path
  if (!user) {
    if (isProtectedPath && pathname !== '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // 2. If authenticated, fetch profile to verify role redirection
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    // Redirect to dashboard if visiting /login or root /
    if (pathname === '/login' || pathname === '/') {
      const url = request.nextUrl.clone();
      if (role === 'admin') url.pathname = '/admin/dashboard';
      else if (role === 'architect') url.pathname = '/architect/dashboard';
      else if (role === 'designer') url.pathname = '/designer/dashboard';
      else return supabaseResponse;
      return NextResponse.redirect(url);
    }

    // Role-based path access control
    if (pathname.startsWith('/admin') && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = role === 'architect' ? '/architect/dashboard' : '/designer/dashboard';
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/architect') && role !== 'architect') {
      const url = request.nextUrl.clone();
      url.pathname = role === 'admin' ? '/admin/dashboard' : '/designer/dashboard';
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/designer') && role !== 'designer') {
      const url = request.nextUrl.clone();
      url.pathname = role === 'admin' ? '/admin/dashboard' : '/architect/dashboard';
      return NextResponse.redirect(url);
    }
  } catch (err) {
    console.error('Error fetching role in proxy middleware:', err);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
