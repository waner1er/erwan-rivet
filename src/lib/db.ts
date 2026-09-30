import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_DIR, exportContent, syncContent } from './sync.ts';

/** Private, not versioned: SQLite cache of the content + users, sessions and messages. */
export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? 'data');
/** Media are versioned with the content. */
export const UPLOADS_DIR = path.join(CONTENT_DIR, 'uploads');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  format TEXT NOT NULL DEFAULT 'html',
  template TEXT NOT NULL DEFAULT 'default',
  list_type TEXT,
  cover_image TEXT,
  meta_description TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'post',
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  format TEXT NOT NULL DEFAULT 'html',
  template TEXT NOT NULL DEFAULT 'cover',
  cover_image TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  show_toc INTEGER NOT NULL DEFAULT 1,
  meta_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (type, slug)
);
CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

declare global {
  // eslint-disable-next-line no-var
  var __erwanDb: DatabaseSync | undefined;
}

export function getDb(): DatabaseSync {
  if (!globalThis.__erwanDb) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const db = new DatabaseSync(path.join(DATA_DIR, 'site.db'));
    db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    db.exec(SCHEMA);
    syncContent(db);
    globalThis.__erwanDb = db;
  }
  return globalThis.__erwanDb;
}

/** Reloads content/ into the database if it changed on disk (e.g. after a git pull). */
export function syncFromDisk() {
  syncContent(getDb());
}

/** Writes the content tables to content/*.json after a back-office change. */
export function saveToDisk() {
  exportContent(getDb());
}

type Params = Record<string, unknown> | unknown[];

function bind(params?: Params): any[] {
  if (params === undefined) return [];
  return Array.isArray(params) ? params : [params];
}

export function all<T>(sql: string, params?: Params): T[] {
  return getDb().prepare(sql).all(...bind(params)) as T[];
}

export function get<T>(sql: string, params?: Params): T | undefined {
  return getDb().prepare(sql).get(...bind(params)) as T | undefined;
}

export function run(sql: string, params?: Params) {
  return getDb().prepare(sql).run(...bind(params));
}

export function transaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
