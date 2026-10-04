// Server renderers of the `wan/*` site blocks (title, logo, menu, social links, search) used in
// template parts. They output the same markup as the WordPress blocks they stand for, so wp.css
// applies unchanged. Their editor counterparts live in src/components/admin/blocks/site-blocks.tsx.
import type { SiteSettings, SocialLink } from '../settings.ts';
import { sanitizeContentHtml } from '../sanitize.ts';
import { escapeAttr, registerLayoutSupport, wrapperAttributes, type Attrs } from './supports.ts';

/** A block as returned by @wordpress/block-serialization-default-parser. */
export interface ParsedBlock {
  blockName: string | null;
  attrs: Attrs | null;
  innerBlocks: ParsedBlock[];
  innerHTML: string;
  innerContent: (string | null)[];
}

export interface RenderContext {
  settings: SiteSettings;
  /** Path of the page being rendered, to flag the current menu entry. */
  currentPath: string;
  /** Unique number per rendered instance on the page, for element ids. */
  uid: () => number;
}

type Renderer = (attrs: Attrs, ctx: RenderContext, innerBlocks: ParsedBlock[]) => string;

const esc = escapeAttr;
const idSuffix = (n: number) => (n > 1 ? `-${n}` : '');

const SOCIAL_ICONS: Record<SocialLink['service'], string> = {
  linkedin:
    'M19.7,3H4.3C3.582,3,3,3.582,3,4.3v15.4C3,20.418,3.582,21,4.3,21h15.4c0.718,0,1.3-0.582,1.3-1.3V4.3 C21,3.582,20.418,3,19.7,3z M8.339,18.338H5.667v-8.59h2.672V18.338z M7.004,8.574c-0.857,0-1.549-0.694-1.549-1.548 c0-0.855,0.691-1.548,1.549-1.548c0.854,0,1.547,0.694,1.547,1.548C8.551,7.881,7.858,8.574,7.004,8.574z M18.339,18.338h-2.669 v-4.177c0-0.996-0.017-2.278-1.387-2.278c-1.389,0-1.601,1.086-1.601,2.206v4.249h-2.667v-8.59h2.559v1.174h0.037 c0.356-0.675,1.227-1.387,2.526-1.387c2.703,0,3.203,1.779,3.203,4.092V18.338z',
  github:
    'M12,2C6.477,2,2,6.477,2,12c0,4.419,2.865,8.166,6.839,9.489c0.5,0.09,0.682-0.218,0.682-0.484 c0-0.236-0.009-0.866-0.014-1.699c-2.782,0.602-3.369-1.34-3.369-1.34c-0.455-1.157-1.11-1.465-1.11-1.465 c-0.909-0.62,0.069-0.608,0.069-0.608c1.004,0.071,1.532,1.03,1.532,1.03c0.891,1.529,2.341,1.089,2.91,0.833 c0.091-0.647,0.349-1.086,0.635-1.337c-2.22-0.251-4.555-1.111-4.555-4.943c0-1.091,0.39-1.984,1.03-2.682 C6.546,8.54,6.202,7.524,6.746,6.148c0,0,0.84-0.269,2.75,1.025C10.295,6.95,11.15,6.84,12,6.836 c0.85,0.004,1.705,0.114,2.504,0.336c1.909-1.294,2.748-1.025,2.748-1.025c0.546,1.376,0.202,2.394,0.1,2.646 c0.64,0.699,1.026,1.591,1.026,2.682c0,3.841-2.337,4.687-4.565,4.935c0.359,0.307,0.679,0.917,0.679,1.852 c0,1.335-0.012,2.415-0.012,2.741c0,0.269,0.18,0.579,0.688,0.481C19.138,20.161,22,16.416,22,12C22,6.477,17.523,2,12,2z',
  mail: 'M19,5H5c-1.1,0-2,.9-2,2v10c0,1.1.9,2,2,2h14c1.1,0,2-.9,2-2V7c0-1.1-.9-2-2-2zm.5,12c0,.3-.2.5-.5.5H5c-.3,0-.5-.2-.5-.5V9.8l7.5,5.6,7.5-5.6V17zm0-9.1L12,13.6,4.5,7.9V7c0-.3.2-.5.5-.5h14c.3,0,.5.2.5.5v.9z',
  wordpress:
    'M12.158,12.786L9.46,20.625c0.806,0.237,1.657,0.366,2.54,0.366c1.047,0,2.051-0.181,2.986-0.51 c-0.024-0.038-0.046-0.079-0.065-0.124L12.158,12.786z M3.009,12c0,3.559,2.068,6.634,5.067,8.092L3.788,8.341 C3.289,9.459,3.009,10.696,3.009,12z M18.069,11.546c0-1.112-0.399-1.881-0.741-2.48c-0.456-0.741-0.883-1.368-0.883-2.109 c0-0.826,0.627-1.596,1.51-1.596c0.04,0,0.078,0.005,0.116,0.007C16.472,3.904,14.34,3.009,12,3.009 c-3.141,0-5.904,1.612-7.512,4.052c0.211,0.007,0.41,0.011,0.579,0.011c0.94,0,2.396-0.114,2.396-0.114 C7.947,6.93,8.004,7.642,7.52,7.699c0,0-0.487,0.057-1.029,0.085l3.274,9.739l1.968-5.901l-1.401-3.838 C9.848,7.756,9.389,7.699,9.389,7.699C8.904,7.67,8.961,6.93,9.446,6.958c0,0,1.484,0.114,2.368,0.114 c0.94,0,2.397-0.114,2.397-0.114c0.485-0.028,0.542,0.684,0.057,0.741c0,0-0.488,0.057-1.029,0.085l3.249,9.665l0.897-2.996 C17.841,13.284,18.069,12.316,18.069,11.546z M19.889,7.686c0.039,0.286,0.06,0.593,0.06,0.924c0,0.912-0.171,1.938-0.684,3.22 l-2.746,7.94c2.673-1.558,4.47-4.454,4.47-7.771C20.991,10.436,20.591,8.967,19.889,7.686z M12,22C6.486,22,2,17.514,2,12 C2,6.486,6.486,2,12,2c5.514,0,10,4.486,10,10C22,17.514,17.514,22,12,22z',
};

const siteTitle: Renderer = (attrs, { settings, currentPath }) => {
  const tag = attrs.level ? `h${attrs.level}` : 'p';
  const title = esc(settings.siteTitle);
  const current = currentPath === '/' ? ' aria-current="page"' : '';
  const inner = attrs.isLink === false ? title : `<a href="/" rel="home"${current}>${title}</a>`;
  return `<${tag}${wrapperAttributes(attrs, ['wp-block-site-title'])}>${inner}</${tag}>`;
};

const siteLogo: Renderer = (attrs, { settings }) => {
  if (!settings.logo) return '';
  const width = Number(attrs.width) || 0;
  const img = `<img loading="lazy" width="440" height="440" src="${esc(settings.logo)}" class="custom-logo" alt="${esc(settings.siteTitle)}" decoding="async"${width ? ` style="width:${width}px"` : ''} />`;
  const inner = attrs.isLink === false ? img : `<a href="/" class="custom-logo-link" rel="home">${img}</a>`;
  return `<div${wrapperAttributes(attrs, [!width && 'is-default-size', 'wp-block-site-logo'])}>${inner}</div>`;
};

const socialLinks: Renderer = (attrs, { settings }) => {
  const links = attrs.source === 'footer' ? settings.footerSocials : settings.headerSocials;
  const items = links
    .map(
      (link) =>
        `<li class="wp-social-link wp-social-link-${esc(link.service)} wp-block-social-link"><a href="${esc(link.url)}" class="wp-block-social-link-anchor"${link.service === 'mail' ? '' : ' rel="noopener"'}>` +
        `<svg width="24" height="24" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="${SOCIAL_ICONS[link.service] ?? ''}"></path></svg>` +
        `<span class="wp-block-social-link-label screen-reader-text">${esc(link.label)}</span></a></li>`,
    )
    .join('');
  return `<ul${wrapperAttributes(attrs, ['wp-block-social-links', attrs.iconSize && `has-${attrs.iconSize}-icon-size`])}>${items}</ul>`;
};

// Only links that cannot run script: http(s), mail, phone, or relative.
function safeUrl(raw: unknown): string {
  const url = String(raw ?? '').trim();
  return !/^[a-z][a-z0-9+.-]*:/i.test(url) || /^(https?|mailto|tel):/i.test(url) ? url : '#';
}

const SUBMENU_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false"><path d="M1.50002 4L6.00002 8L10.5 4" stroke-width="1.5"></path></svg>';

/** Menu entries: the core/navigation-link and core/navigation-submenu blocks inside a `wan/menu`. */
function menuItems(blocks: ParsedBlock[], currentPath: string): string {
  return blocks
    .map((block) => {
      const a = block.attrs ?? {};
      const url = safeUrl(a.url);
      if (block.blockName !== 'core/navigation-link' && block.blockName !== 'core/navigation-submenu') return '';
      // Labels are rich text (may hold <strong>, <em>...): sanitized like content.
      const label = sanitizeContentHtml(String(a.label ?? ''));
      if (!label) return '';
      const current = url && url !== '/' && currentPath.startsWith(url) ? ' current-menu-item' : '';
      const link =
        `<a class="wp-block-navigation-item__content" href="${esc(url)}"` +
        (currentPath === url ? ' aria-current="page"' : '') +
        (a.opensInNewTab ? ' target="_blank" rel="noopener"' : a.rel ? ` rel="${esc(a.rel)}"` : '') +
        (a.title ? ` title="${esc(a.title)}"` : '') +
        `><span class="wp-block-navigation-item__label">${label}</span></a>`;
      if (block.blockName === 'core/navigation-link') {
        return `<li class="wp-block-navigation-item wp-block-navigation-link${current}${a.className ? ` ${esc(a.className)}` : ''}">${link}</li>`;
      }
      return (
        `<li class="wp-block-navigation-item has-child open-on-hover-click wp-block-navigation-submenu${current}">${link}` +
        `<button aria-label="Sous-menu ${esc(label.replace(/<[^>]+>/g, ''))}" class="wp-block-navigation__submenu-icon wp-block-navigation-submenu__toggle" aria-expanded="false" data-submenu-toggle>${SUBMENU_ICON}</button>` +
        `<ul class="wp-block-navigation__submenu-container wp-block-navigation-submenu">${menuItems(block.innerBlocks, currentPath)}</ul></li>`
      );
    })
    .join('');
}

const menu: Renderer = (attrs, { currentPath, uid }, innerBlocks) => {
  const n = uid();
  const justify = attrs.layout?.justifyContent ?? 'left';
  const overlay: 'mobile' | 'always' | 'never' = attrs.overlayMenu ?? 'mobile';
  const fontClass = attrs.fontSize && `has-${attrs.fontSize}-font-size`;
  const responsive = overlay !== 'never' && 'is-responsive';
  const items = menuItems(innerBlocks, currentPath);
  if (!items) return '';
  const list = `<ul class="${[`wp-block-navigation__container`, fontClass, responsive, `items-justified-${justify}`, 'wp-block-navigation'].filter(Boolean).join(' ')}">${items}</ul>`;
  const nav = (inner: string) =>
    `<nav${wrapperAttributes(attrs, [fontClass, responsive, `items-justified-${justify}`, 'wp-block-navigation'])} aria-label="${esc(attrs.ariaLabel || 'Navigation')}" data-nav>${inner}</nav>`;
  if (overlay === 'never') return nav(list);

  const modal = `modal-nav${idSuffix(n)}`;
  const overlayText = attrs.overlayTextColor ?? 'base';
  const overlayBackground = attrs.overlayBackgroundColor ?? 'contrast';
  const container = [
    'wp-block-navigation__responsive-container',
    overlay === 'always' && 'hidden-by-default',
    `has-text-color has-${overlayText}-color has-background has-${overlayBackground}-background-color`,
  ]
    .filter(Boolean)
    .join(' ');
  return nav(
    `<button aria-haspopup="dialog" class="wp-block-navigation__responsive-container-open${overlay === 'always' ? ' always-shown' : ''}" data-nav-open>Menu</button>` +
      `<div class="${container}" id="${modal}" data-nav-container><div class="wp-block-navigation__responsive-close" tabindex="-1"><div class="wp-block-navigation__responsive-dialog">` +
      `<button class="wp-block-navigation__responsive-container-close" data-nav-close>Fermer</button>` +
      `<div class="wp-block-navigation__responsive-container-content" id="${modal}-content">${list}</div></div></div></div>`,
  );
};

const search: Renderer = (attrs, { uid }) => {
  const s = idSuffix(uid());
  return (
    `<div${wrapperAttributes(attrs, ['erwan-live-search wp-block-erwan-live-search'])} data-live-search data-index-url="/search-index.json">` +
    `<form class="erwan-live-search__form" role="search" method="get" action="/recherche/">` +
    `<button aria-expanded="false" type="button" class="erwan-live-search__toggle" aria-controls="live-search-input${s}" data-ls-toggle><span class="screen-reader-text">Ouvrir la recherche</span>` +
    `<svg class="erwan-live-search__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"></circle><line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line></svg></button>` +
    `<label class="screen-reader-text" for="live-search-input${s}">Rechercher</label>` +
    `<input aria-expanded="false" id="live-search-input${s}" class="erwan-live-search__input" type="search" name="q" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="live-search-panel${s}" placeholder="Rechercher…" data-ls-input />` +
    `<span hidden class="erwan-live-search__spinner" aria-hidden="true" data-ls-spinner></span></form>` +
    `<div hidden id="live-search-panel${s}" class="erwan-live-search__panel" data-ls-panel><ul class="erwan-live-search__results" role="listbox" data-ls-results></ul>` +
    `<p hidden class="erwan-live-search__empty" data-ls-empty>Aucun résultat.</p></div></div>`
  );
};

export const SITE_BLOCKS: Record<string, Renderer> = {
  'wan/site-title': siteTitle,
  'wan/site-logo': siteLogo,
  'wan/social-links': socialLinks,
  'wan/menu': menu,
  'wan/search': search,
};

registerLayoutSupport('wan/social-links', { default: { type: 'flex' }, name: 'social-links' });
registerLayoutSupport('wan/menu', { default: { type: 'flex' }, name: 'navigation' });
