import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'admin_session';

// Paths that bypass auth check entirely
const PUBLIC_PREFIXES = [
  '/login',
  '/api/auth/',      // all auth API routes: login, logout, me
  '/_next',
  '/favicon',
  '/.well-known',
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow all public paths through
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
