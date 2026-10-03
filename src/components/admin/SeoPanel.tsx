import { useEffect, useMemo, useState } from 'react';

// Pure functions first, so the scoring logic can be reasoned about and
// tested independently of the DOM-watching wiring below.

export interface SeoCheck {
  id: string;
  label: string;
  status: 'ok' | 'warn' | 'error';
  detail?: string;
}

interface ContentIndexEntry {
  title: string;
  url: string;
  text: string;
}

function stripTags(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(text: string): number {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function imagesWithoutAlt(html: string): number {
  const imgs = html.match(/<img[^>]*>/gi) ?? [];
  return imgs.filter((tag) => !/\salt=["'][^"']*["']/.test(tag) || /\salt=["']\s*["']/.test(tag)).length;
}

const STOPWORDS = new Set(
  'le la les un une des de du et en à au aux pour avec sans sur dans par ce cette ces mon ma mes votre vos notre nos est sont être avoir comment pourquoi quoi que qui'.split(' '),
);

function significantWords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-zàâäéèêëïîôöùûüç0-9\s-]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

export function suggestInternalLinks(
  plainText: string,
  existingHrefs: Set<string>,
  index: ContentIndexEntry[],
  currentUrl: string | undefined,
  limit = 5,
): { title: string; url: string }[] {
  const lowerText = plainText.toLowerCase();
  const suggestions: { title: string; url: string }[] = [];
  for (const entry of index) {
    if (entry.url === currentUrl || existingHrefs.has(entry.url)) continue;
    const words = significantWords(entry.title);
    if (words.length === 0) continue;
    const hit = words.some((w) => lowerText.includes(w));
    if (hit) suggestions.push({ title: entry.title, url: entry.url });
    if (suggestions.length >= limit) break;
  }
  return suggestions;
}

export function computeChecks(input: {
  title: string;
  slug: string;
  metaDescription: string;
  excerpt: string;
  contentHtml: string;
}): SeoCheck[] {
  const { title, slug, metaDescription, excerpt, contentHtml } = input;
  const plainText = stripTags(contentHtml);
  const words = wordCount(plainText);
  const checks: SeoCheck[] = [];

  if (!title.trim()) {
    checks.push({ id: 'title', label: 'Titre', status: 'error', detail: 'Le titre est vide.' });
  } else if (title.length > 60) {
    checks.push({ id: 'title', label: 'Titre', status: 'warn', detail: `${title.length} caractères — Google tronque généralement au-delà de 60.` });
  } else if (title.length < 15) {
    checks.push({ id: 'title', label: 'Titre', status: 'warn', detail: `${title.length} caractères — un peu court pour être explicite.` });
  } else {
    checks.push({ id: 'title', label: 'Titre', status: 'ok', detail: `${title.length} caractères.` });
  }

  const effectiveDescription = metaDescription.trim() || excerpt.trim();
  if (!effectiveDescription) {
    checks.push({ id: 'description', label: 'Description', status: 'warn', detail: 'Vide — une description sera générée automatiquement depuis le contenu, mais une description écrite à la main est plus efficace.' });
  } else if (effectiveDescription.length > 160) {
    checks.push({ id: 'description', label: 'Description', status: 'warn', detail: `${effectiveDescription.length} caractères — au-delà de 160, Google la tronque.` });
  } else if (effectiveDescription.length < 70) {
    checks.push({ id: 'description', label: 'Description', status: 'warn', detail: `${effectiveDescription.length} caractères — un peu courte, idéal entre 120 et 160.` });
  } else {
    checks.push({ id: 'description', label: 'Description', status: 'ok', detail: `${effectiveDescription.length} caractères.` });
  }

  if (slug && slug.length > 75) {
    checks.push({ id: 'slug', label: 'Adresse', status: 'warn', detail: `${slug.length} caractères — une adresse plus courte est préférable.` });
  } else {
    checks.push({ id: 'slug', label: 'Adresse', status: 'ok' });
  }

  if (words === 0) {
    checks.push({ id: 'length', label: 'Longueur du contenu', status: 'warn', detail: 'Aucun texte détecté.' });
  } else if (words < 300) {
    checks.push({ id: 'length', label: 'Longueur du contenu', status: 'warn', detail: `${words} mots — un contenu court a moins de chances d'être bien positionné.` });
  } else {
    const minutes = Math.max(1, Math.ceil(words / 200));
    checks.push({ id: 'length', label: 'Longueur du contenu', status: 'ok', detail: `${words} mots, environ ${minutes} min de lecture.` });
  }

  const missingAlt = imagesWithoutAlt(contentHtml);
  if (missingAlt > 0) {
    checks.push({ id: 'alt', label: 'Texte alternatif des images', status: 'warn', detail: `${missingAlt} image(s) sans texte alternatif.` });
  } else if (/<img/i.test(contentHtml)) {
    checks.push({ id: 'alt', label: 'Texte alternatif des images', status: 'ok' });
  }

  const titleWordsInContent = title
    ? significantWords(title).filter((w) => plainText.toLowerCase().includes(w))
    : [];
  if (title && significantWords(title).length > 0 && titleWordsInContent.length === 0) {
    checks.push({ id: 'keyword', label: 'Mots du titre dans le contenu', status: 'warn', detail: 'Aucun mot significatif du titre ne réapparaît dans le texte.' });
  }

  return checks;
}

interface Props {
  /** ids of the fields this panel reads from the surrounding <form>. */
  titleFieldId: string;
  slugFieldId: string;
  metaDescriptionFieldId: string;
  excerptFieldId?: string;
  contentFieldName: string;
  /** Current item's public URL, to exclude self from internal link suggestions. */
  currentUrl?: string;
}

export default function SeoPanel({ titleFieldId, slugFieldId, metaDescriptionFieldId, excerptFieldId, contentFieldName, currentUrl }: Props) {
  const [tick, setTick] = useState(0);
  const [index, setIndex] = useState<ContentIndexEntry[]>([]);

  useEffect(() => {
    fetch('/search-index.json')
      .then((res) => res.json())
      .then((data: { title: string; url: string; text: string }[]) => setIndex(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const form = document.getElementById(titleFieldId)?.closest('form');
    if (!form) return;
    // GutenbergEditor dispatches a bubbling `input` event on its hidden
    // textarea on every block change, so this single listener also catches
    // content edits, not just the plain <input>/<textarea> fields.
    const onInput = () => setTick((t) => t + 1);
    form.addEventListener('input', onInput);
    // SeoPanel and GutenbergEditor are independent client:only islands that
    // hydrate asynchronously; the content textarea may not exist in the DOM
    // yet on SeoPanel's first render. A MutationObserver catches it being
    // inserted, in addition to the `input` listener above (its initial
    // `defaultValue` already holds the real content once it's mounted).
    const observer = new MutationObserver(onInput);
    observer.observe(form, { childList: true, subtree: true });
    return () => {
      form.removeEventListener('input', onInput);
      observer.disconnect();
    };
  }, [titleFieldId]);

  const data = useMemo(() => {
    const title = (document.getElementById(titleFieldId) as HTMLInputElement | null)?.value ?? '';
    const slug = (document.getElementById(slugFieldId) as HTMLInputElement | null)?.value ?? '';
    const metaDescription = (document.getElementById(metaDescriptionFieldId) as HTMLTextAreaElement | null)?.value ?? '';
    const excerpt = excerptFieldId ? ((document.getElementById(excerptFieldId) as HTMLTextAreaElement | null)?.value ?? '') : '';
    const contentField = document.querySelector<HTMLTextAreaElement>(`textarea[name="${contentFieldName}"]`);
    const contentHtml = contentField?.value ?? '';
    return { title, slug, metaDescription, excerpt, contentHtml };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, titleFieldId, slugFieldId, metaDescriptionFieldId, excerptFieldId, contentFieldName]);

  const checks = useMemo(() => computeChecks(data), [data]);

  const linkSuggestions = useMemo(() => {
    const plainText = stripTags(data.contentHtml);
    const existingHrefs = new Set([...data.contentHtml.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1]));
    return suggestInternalLinks(plainText, existingHrefs, index, currentUrl);
  }, [data.contentHtml, index, currentUrl]);

  const counts = { ok: 0, warn: 0, error: 0 };
  for (const c of checks) counts[c.status]++;

  return (
    <div className="seo-panel">
      <div className="seo-panel__summary">
        {counts.error > 0 && <span className="seo-pill seo-pill--error">{counts.error} à corriger</span>}
        {counts.warn > 0 && <span className="seo-pill seo-pill--warn">{counts.warn} à améliorer</span>}
        <span className="seo-pill seo-pill--ok">{counts.ok} ok</span>
      </div>
      <ul className="seo-panel__list">
        {checks.map((c) => (
          <li key={c.id} className={`seo-check seo-check--${c.status}`}>
            <strong>{c.label}</strong>
            {c.detail && <span>{c.detail}</span>}
          </li>
        ))}
      </ul>
      {linkSuggestions.length > 0 && (
        <div className="seo-panel__links">
          <strong>Liens internes suggérés</strong>
          <ul>
            {linkSuggestions.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener">{s.title}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
