// Link search for Gutenberg's link field (menu links, links in content): suggests the site's
// published pages and posts from /search-index.json, since there is no WordPress REST API here.
interface IndexEntry {
  title: string;
  url: string;
  typeLabel: string;
}

let index: Promise<IndexEntry[]> | null = null;

export async function fetchLinkSuggestions(search: string, { isInitialSuggestions = false, perPage = 20 }: { isInitialSuggestions?: boolean; perPage?: number } = {}) {
  index ??= fetch('/search-index.json').then((res) => res.json() as Promise<IndexEntry[]>);
  const entries = await index;
  const query = search.trim().toLowerCase();
  const matches = query
    ? entries.filter((e) => e.title.toLowerCase().includes(query) || e.url.toLowerCase().includes(query))
    : entries.filter((e) => e.typeLabel === 'Page');
  // `kind: 'custom'` keeps the link a plain URL (no WordPress post id to look up).
  return matches.slice(0, isInitialSuggestions ? 8 : perPage).map((e) => ({
    id: e.url,
    title: e.title,
    url: e.url,
    type: e.typeLabel === 'Page' ? 'page' : 'post',
    kind: 'custom',
  }));
}
