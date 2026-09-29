import type { APIRoute } from 'astro';
import { run } from '../../lib/db.ts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const field = (name: string, max: number) => String(form.get(name) ?? '').trim().slice(0, max);
  const back = (status: 'ok' | 'error') => redirect(`/contact/?contact=${status}#contact-form`, 303);

  // Honeypot: bots fill every field. Pretend success.
  if (field('website', 200)) return back('ok');

  const firstName = field('first_name', 100);
  const lastName = field('last_name', 100);
  const email = field('email', 200);
  const message = field('message', 5000);
  if (!firstName || !lastName || !EMAIL_RE.test(email)) return back('error');

  run('INSERT INTO messages (first_name, last_name, email, message) VALUES (?, ?, ?, ?)', [firstName, lastName, email, message]);
  return back('ok');
};
