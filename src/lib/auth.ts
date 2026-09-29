import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { get, run } from './db.ts';

export interface User {
  id: number;
  email: string;
  name: string;
}

export const SESSION_COOKIE = 'er_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

// ---------- Passwords ----------

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algo, saltHex, hashHex] = stored.split('$');
  if (algo !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, { N: 16384, r: 8, p: 1 });
  return timingSafeEqual(expected, actual);
}

// Burned on unknown emails so response time does not reveal whether an account exists.
const DUMMY_HASH = hashPassword(randomBytes(16).toString('hex'));

// ---------- Users ----------

export function createUser(email: string, name: string, password: string): number {
  const res = run('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)', [email.trim().toLowerCase(), name, hashPassword(password)]);
  return Number(res.lastInsertRowid);
}

export function updatePassword(userId: number, password: string) {
  run('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(password), userId]);
  run('DELETE FROM sessions WHERE user_id = ?', [userId]);
}

export function authenticate(email: string, password: string): User | null {
  const row = get<User & { password_hash: string }>('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (!row) {
    verifyPassword(password, DUMMY_HASH);
    return null;
  }
  if (!verifyPassword(password, row.password_hash)) return null;
  return { id: row.id, email: row.email, name: row.name };
}

// ---------- Sessions ----------

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export function createSession(userId: number, cookies: AstroCookies, secure: boolean) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  run('DELETE FROM sessions WHERE expires_at < ?', [Date.now()]);
  run('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)', [hashToken(token), userId, expiresAt]);
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    expires: new Date(expiresAt),
  });
}

export function getSessionUser(cookies: AstroCookies): User | null {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = get<User & { expires_at: number; sid: string }>(
    `SELECT u.id, u.email, u.name, s.expires_at, s.id AS sid FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`,
    [hashToken(token)],
  );
  if (!row || row.expires_at < Date.now()) {
    if (row) run('DELETE FROM sessions WHERE id = ?', [row.sid]);
    return null;
  }
  return { id: row.id, email: row.email, name: row.name };
}

export function destroySession(cookies: AstroCookies) {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) run('DELETE FROM sessions WHERE id = ?', [hashToken(token)]);
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

// ---------- Login throttling (in memory, per IP) ----------

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function isThrottled(key: string): boolean {
  const entry = attempts.get(key);
  return !!entry && entry.resetAt > Date.now() && entry.count >= MAX_ATTEMPTS;
}

export function recordFailedLogin(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count++;
}

export function clearFailedLogins(key: string) {
  attempts.delete(key);
}
