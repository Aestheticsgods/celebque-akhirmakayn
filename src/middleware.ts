import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const acceptHeader = request.headers.get('accept') ?? '';
  const isDocumentRequest = acceptHeader.includes('text/html');
  const isRscRequest = request.headers.has('rsc') || request.nextUrl.searchParams.has('_rsc');
  const isPrefetchRequest =
    request.headers.has('next-router-prefetch') ||
    request.headers.get('purpose') === 'prefetch';

  // Avoid auth redirects for internal RSC/prefetch/data requests.
  // Redirecting these can cause raw Flight payload text to be shown in the browser.
  if (!isDocumentRequest || isRscRequest || isPrefetchRequest) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  // ❌ Not authenticated & trying to access protected route
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ Authenticated & trying to access auth pages
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next|favicon.ico).*)',
  ],
};
