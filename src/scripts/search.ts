// Client-side search over /search-index.json (works on static hosting).
export interface SearchEntry {
  title: string;
  url: string;
  excerpt: string;
  thumbnail: string | null;
  typeLabel: string;
  text: string;
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

let index: Promise<(SearchEntry & { _title: string; _text: string })[]> | null = null;

function loadIndex(url: string) {
  index ??= fetch(url)
    .then((res) => (res.ok ? res.json() : []))
    .then((entries: SearchEntry[]) => entries.map((e) => ({ ...e, _title: normalize(e.title), _text: normalize(e.text) })))
    .catch(() => {
      index = null;
      return [];
    });
  return index;
}

/** Every word of the query must appear; title matches rank first. */
export async function search(indexUrl: string, query: string, limit = 8): Promise<SearchEntry[]> {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const entries = await loadIndex(indexUrl);
  return entries
    .map((e) => {
      if (!words.every((w) => e._title.includes(w) || e._text.includes(w))) return null;
      const score = words.reduce((s, w) => s + (e._title.includes(w) ? 10 : 0) + (e._text.includes(w) ? 1 : 0), 0);
      return { e, score };
    })
    .filter((r): r is { e: (typeof entries)[number]; score: number } => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ e }) => e);
}
