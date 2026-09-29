import type { APIRoute } from 'astro';
import { destroySession } from '../../lib/auth.ts';

export const POST: APIRoute = ({ cookies, redirect }) => {
  destroySession(cookies);
  return redirect('/admin/login', 303);
};
