/** Small helpers to read back-office form posts. */
export function text(form: FormData, name: string): string {
  return String(form.get(name) ?? '').trim();
}

export function nullable(form: FormData, name: string): string | null {
  return text(form, name) || null;
}

export function oneOf<T extends string>(form: FormData, name: string, allowed: readonly T[], fallback: T): T {
  const value = text(form, name) as T;
  return allowed.includes(value) ? value : fallback;
}

export function intOrNull(form: FormData, name: string): number | null {
  const n = Number.parseInt(text(form, name), 10);
  return Number.isFinite(n) ? n : null;
}

export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Error && /UNIQUE constraint failed/.test(err.message);
}

export function paramId(raw: string | undefined): number | 'new' | null {
  if (raw === 'new') return 'new';
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}
