/**
 * Absolute URL of a site path, keeping the path of the configured site
 * (e.g. https://waner1er.github.io/erwan-rivet + /blog/ → https://waner1er.github.io/erwan-rivet/blog/).
 */
export function absoluteUrl(path: string, site: URL | undefined, fallbackOrigin: string): string {
  const base = new URL(site ? site.href.replace(/\/?$/, '/') : `${fallbackOrigin}/`);
  return new URL(path.replace(/^\//, ''), base).href;
}
