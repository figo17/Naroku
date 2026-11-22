import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Allow keep-alive API endpoint and public static assets without interception
  if (
    pathname.startsWith('/api/keep-alive') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return supabaseResponse;
  }

  const isProtectedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/guru') ||
    pathname.startsWith('/play') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/beranda');

  // If not authenticated and trying to access protected route -> redirect to /login
  if (!user) {
    if (isProtectedPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Fetch user profile to check role and class_id
  let role = 'murid';
  let classId = null;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, class_id')
      .eq('id', user.id)
      .single();

    if (profile) {
      role = profile.role || 'murid';
      classId = profile.class_id || null;
    }
  } catch (err) {
    // Fallback to default murid role on error
    role = 'murid';
  }

  // Helper function to resolve default home page for a given role/class
  const getRoleHomePage = () => {
    if (role === 'admin') return '/admin';
    if (role === 'guru') return '/guru';
    return '/beranda';
  };

  // Logged-in user visiting /login -> redirect to role home page
  if (pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = getRoleHomePage();
    return NextResponse.redirect(url);
  }

  // Protect /admin routes (admin only)
  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = getRoleHomePage();
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Protect /guru routes (guru only)
  if (pathname.startsWith('/guru')) {
    if (role !== 'guru') {
      const url = request.nextUrl.clone();
      url.pathname = getRoleHomePage();
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Protect /play and /profile (murid with class_id)
  if (pathname.startsWith('/play') || pathname.startsWith('/profile')) {
    if (role !== 'murid') {
      const url = request.nextUrl.clone();
      url.pathname = getRoleHomePage();
      return NextResponse.redirect(url);
    }
    if (!classId) {
      const url = request.nextUrl.clone();
      url.pathname = '/join-class';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Protect /join-class (murid without class_id)
  if (pathname.startsWith('/join-class')) {
    if (role !== 'murid') {
      const url = request.nextUrl.clone();
      url.pathname = getRoleHomePage();
      return NextResponse.redirect(url);
    }
    if (classId) {
      const url = request.nextUrl.clone();
      url.pathname = '/play';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ogg|ico)$).*)',
  ],
};
