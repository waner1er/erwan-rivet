import { getCategory, pageUrl, postUrl, type Page, type Post, type Tag } from './content.ts';
import { getSettings, type SiteSettings } from './settings.ts';
import { absoluteUrl } from './url.ts';

type JsonLdGraph = Record<string, unknown>;

/** Normalizes stored dates (SQLite's `YYYY-MM-DD HH:MM:SS`, or already-ISO
 * values imported from WordPress) into real ISO 8601 with a UTC suffix. */
function toIso(date: string): string {
  const withT = date.includes('T') ? date : date.replace(' ', 'T');
  return /[+-]\d\d:\d\d$|Z$/.test(withT) ? withT : `${withT}Z`;
}

const SOCIAL_URLS = (settings: SiteSettings) =>
  [...settings.headerSocials, ...settings.footerSocials]
    .map((s) => s.url)
    .filter((url) => !url.startsWith('mailto:'))
    .filter((url, i, all) => all.indexOf(url) === i);

/** The site author/owner, reused as `author` and `publisher` across pages. */
export function personSchema(site: URL | undefined, origin: string, settings = getSettings()): JsonLdGraph {
  return {
    '@type': 'Person',
    name: settings.siteTitle,
    url: absoluteUrl('/', site, origin),
    image: absoluteUrl(settings.logo, site, origin),
    jobTitle: settings.tagline,
    sameAs: SOCIAL_URLS(settings),
  };
}

export function websiteSchema(site: URL | undefined, origin: string, settings = getSettings()): JsonLdGraph {
  return {
    '@type': 'WebSite',
    name: settings.siteTitle,
    url: absoluteUrl('/', site, origin),
    inLanguage: 'fr-FR',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/recherche/', site, origin)}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbSchema(
  items: { name: string; path: string }[],
  site: URL | undefined,
  origin: string,
): JsonLdGraph {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path, site, origin),
    })),
  };
}

export function articleSchema(
  post: Post,
  opts: {
    tags: Tag[];
    description: string;
    image: string | null;
    site: URL | undefined;
    origin: string;
  },
): JsonLdGraph {
  const settings = getSettings();
  const category = post.category_id ? getCategory(post.category_id) : undefined;
  const url = absoluteUrl(postUrl(post), opts.site, opts.origin);
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    headline: post.title,
    description: opts.description,
    url,
    datePublished: toIso(post.published_at ?? post.created_at),
    dateModified: toIso(post.updated_at),
    inLanguage: 'fr-FR',
    ...(opts.image && { image: absoluteUrl(opts.image, opts.site, opts.origin) }),
    author: personSchema(opts.site, opts.origin, settings),
    publisher: personSchema(opts.site, opts.origin, settings),
    ...(category && { articleSection: category.name }),
    ...(opts.tags.length > 0 && { keywords: opts.tags.map((t) => t.name).join(', ') }),
  };
}

export function pageSchema(
  page: Page,
  opts: { description: string; image: string | null; site: URL | undefined; origin: string },
): JsonLdGraph {
  const url = absoluteUrl(pageUrl(page), opts.site, opts.origin);
  return {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    name: page.title,
    description: opts.description,
    url,
    inLanguage: 'fr-FR',
    dateModified: toIso(page.updated_at),
    ...(opts.image && { image: absoluteUrl(opts.image, opts.site, opts.origin) }),
  };
}

/** Wraps one or more schema.org nodes into a single `@graph` JSON-LD document. */
export function jsonLdGraph(...nodes: JsonLdGraph[]): object {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
