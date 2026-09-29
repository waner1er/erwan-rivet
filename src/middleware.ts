import { defineMiddleware } from 'astro:middleware';
import { getSessionUser, SESSION_COOKIE } from './lib/auth.ts';

const PUBLIC_ADMIN_PATHS = new Set(['/admin/login', '/admin/login/']);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/');

  // Public pages only need the user for draft previews, so skip the lookup without a cookie.
  context.locals.user = isAdmin || context.cookies.has(SESSION_COOKIE) ? getSessionUser(context.cookies) : null;

  if (!isAdmin) return next();

  if (!context.locals.user && !PUBLIC_ADMIN_PATHS.has(pathname)) {
    if (pathname.startsWith('/api/')) return new Response('Unauthorized', { status: 401 });
    return context.redirect(`/admin/login?next=${encodeURIComponent(pathname + context.url.search)}`);
  }
  const response = await next();
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  return response;
});
