/**
 * Absolute URL of a site path, keeping the path of the configured site
 * (e.g. https://waner1er.github.io/erwan-rivet + /blog/ → https://waner1er.github.io/erwan-rivet/blog/).
 */
export function absoluteUrl(path: string, site: URL | undefined, fallbackOrigin: string): string {
  const base = new URL(site ? site.href.replace(/\/?$/, '/') : `${fallbackOrigin}/`);
  return new URL(path.replace(/^\//, ''), base).href;
}

/**
 * Changes on every build (and dev server start): appended to the static stylesheet URLs so that,
 * after a deploy, browsers and the GitHub Pages CDN never serve a stale copy of the CSS.
 */
export const ASSET_VERSION = Date.now().toString(36);
