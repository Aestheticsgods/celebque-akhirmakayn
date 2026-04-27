import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAIL = 'houssamhanzaaiinfo@gmail.com'; // Change to your admin email

function nextNoStore() {
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, no-transform');
  response.headers.set('CDN-Cache-Control', 'no-store');
  response.headers.set('Surrogate-Control', 'no-store');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Vary', 'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept');
  response.headers.set('x-middleware-cache', 'no-cache');
  return response;
}

export async function middleware(request: NextRequest) {
  // Maintenance mode check (except for admin and maintenance toggle page)
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/api') && pathname !== '/ana/hua/mulchi') {
    try {
      const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
      const res = await fetch(`${baseUrl}/api/maintenance`, { next: { revalidate: 0 } });
      const { maintenance } = await res.json();
      if (maintenance) {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
        if (!token || token.email !== ADMIN_EMAIL) {
          return NextResponse.rewrite(new URL('/maintenance-page', request.url));
        }
      }
    } catch (e) {}
  }

  const isGetLikeRequest = request.method === 'GET' || request.method === 'HEAD';
  const secFetchMode = request.headers.get('sec-fetch-mode');
  const secFetchDest = request.headers.get('sec-fetch-dest');
  const acceptHeader = request.headers.get('accept') ?? '';
  const hasRscParam = request.nextUrl.searchParams.has('_rsc');
  const isRscRequest =
    request.headers.has('rsc') ||
    acceptHeader.includes('text/x-component') ||
    request.headers.has('next-router-state-tree');
  const isPrefetchRequest =
    request.headers.has('next-router-prefetch') ||
    request.headers.get('purpose') === 'prefetch';
  const isDataRequest = request.headers.has('x-nextjs-data');
  const requestCacheControl = request.headers.get('cache-control') || '';
  const isManualRefreshRequest = requestCacheControl.includes('max-age=0');
  const isNavigationByFetchMetadata = secFetchMode === 'navigate' && secFetchDest === 'document';
  const isDocumentRequest = acceptHeader.includes('text/html') && !isRscRequest && !isPrefetchRequest && !isDataRequest;
  const isNavigationRequest =
    isGetLikeRequest && (isNavigationByFetchMetadata || isDocumentRequest);

  // Some browsers/CDN edges can keep serving stale HTML on manual refresh,
  // leading to old chunk filenames and 404s. Add a one-time cache-busting
  // query param only for refresh navigations.
  if (isNavigationRequest && isManualRefreshRequest && !request.nextUrl.searchParams.has('v')) {
    const bustedUrl = request.nextUrl.clone();
    bustedUrl.searchParams.set('v', Date.now().toString(36));
    return NextResponse.redirect(bustedUrl, 307);
  }

  // If a user lands on a URL containing internal Next.js RSC params,
  // clean it so the browser always requests the document payload.
  // Use broad detection: any text/html request with _rsc should be cleaned.
  if (hasRscParam && (isNavigationRequest || acceptHeader.includes('text/html'))) {
    const cleanedUrl = request.nextUrl.clone();
    cleanedUrl.searchParams.delete('_rsc');
    return NextResponse.redirect(cleanedUrl, 307);
  }

  // Avoid auth redirects for internal RSC/prefetch/data requests and non-navigation requests.
  // Redirecting these can cause raw Flight payload text to be shown in the browser.
  if (!isNavigationRequest || isRscRequest || isPrefetchRequest || isDataRequest) {
    return nextNoStore();
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

  return nextNoStore();
}

export const config = {
  matcher: [
    '/((?!api|_next|favicon.ico).*)',
  ],
};
