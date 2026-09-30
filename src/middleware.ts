import { defineMiddleware } from 'astro:middleware';
import { getSessionUser, SESSION_COOKIE } from './lib/auth.ts';
import { saveToDisk, syncFromDisk } from './lib/db.ts';

const PUBLIC_ADMIN_PATHS = new Set(['/admin/login', '/admin/login/']);
// Back-office writes that do not touch versioned content.
const NO_EXPORT_PATHS = ['/admin/login', '/admin/logout', '/admin/account', '/admin/messages'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/');

  // Prerendered (static export) pages have no request: nobody is logged in.
  if (context.isPrerendered) {
    context.locals.user = null;
    return next();
  }

  // Picks up content/ changes made outside the app (git pull) before serving anything.
  syncFromDisk();

  // Public pages only need the user for draft previews, so skip the lookup without a cookie.
  context.locals.user = isAdmin || context.cookies.has(SESSION_COOKIE) ? getSessionUser(context.cookies) : null;

  if (!isAdmin) return next();

  if (!context.locals.user && !PUBLIC_ADMIN_PATHS.has(pathname)) {
    if (pathname.startsWith('/api/')) return new Response('Unauthorized', { status: 401 });
    return context.redirect(`/admin/login?next=${encodeURIComponent(pathname + context.url.search)}`);
  }
  const response = await next();

  // Every successful back-office change is written to content/*.json, ready to commit.
  const isWrite = context.request.method !== 'GET' && context.request.method !== 'HEAD';
  if (isWrite && response.status < 400 && !NO_EXPORT_PATHS.some((p) => pathname.startsWith(p))) saveToDisk();

  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  return response;
});
