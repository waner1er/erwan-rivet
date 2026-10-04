// Render-time block supports: what WordPress adds to a block's saved HTML when it renders it
// (layout, gap, child sizing, link color). WordPress emits a one-off hashed class per instance
// (`wp-container-core-group-is-layout-<hash>`, `wp-elements-<hash>`) plus a generated <style>.
// Here each per-instance value goes into a CSS custom property on the element, and a generic
// `wan-*` utility from public/css/wan-layout.css applies it — no hash, no generated stylesheet.

export type Attrs = Record<string, any>;

export interface LayoutDefinition {
  /** Layout used when the block has no `layout` attribute (block.json `supports.layout.default`). */
  default: Attrs;
  /** Name in the block-specific class `wp-block-<name>-is-layout-<type>` that wp.css targets. */
  name: string;
}

// Core blocks with `supports.layout`, from @wordpress/block-library's block.json files.
const CORE_LAYOUTS: Record<string, Attrs> = {
  'core/accordion': {},
  'core/accordion-item': {},
  'core/accordion-panel': {},
  'core/buttons': { type: 'flex' },
  'core/column': {},
  'core/columns': { type: 'flex', flexWrap: 'nowrap' },
  'core/comments-pagination': { type: 'flex' },
  'core/cover': {},
  'core/details': {},
  'core/gallery': { type: 'flex' },
  'core/group': {},
  'core/latest-posts': {},
  'core/navigation': { type: 'flex' },
  'core/post-content': {},
  'core/post-template': {},
  'core/query': {},
  'core/query-pagination': { type: 'flex' },
  'core/quote': {},
  'core/social-links': { type: 'flex' },
  'core/tab-list': { type: 'flex', flexWrap: 'wrap' },
  'core/tab-panel': {},
  'core/tabs': {},
  'core/term-template': {},
  'core/terms-query': {},
};

const layouts = new Map<string, LayoutDefinition>(
  Object.entries(CORE_LAYOUTS).map(([block, def]) => [block, { default: def, name: block.replace(/^core\//, '') }]),
);

export function registerLayoutSupport(block: string, definition: LayoutDefinition) {
  layouts.set(block, definition);
}

/** "var:preset|spacing|30" → "var(--wp--preset--spacing--30)"; other values unchanged. */
export function presetValue(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const str = String(value);
  if (!str) return undefined;
  const m = /^var:preset\|([a-z0-9-]+)\|([a-z0-9-]+)$/i.exec(str);
  return m ? `var(--wp--preset--${m[1]}--${m[2]})` : str;
}

export function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

type Styles = Record<string, string>;

interface Additions {
  classes: string[];
  styles: Styles;
}

const JUSTIFY: Record<string, string> = { left: 'flex-start', right: 'flex-end', center: 'center', 'space-between': 'space-between', stretch: 'stretch' };
const VERTICAL: Record<string, string> = { top: 'flex-start', center: 'center', bottom: 'flex-end', stretch: 'stretch', 'space-between': 'space-between' };
const FALLBACK_GAP = 'var(--wp--style--block-gap, 0.5em)';

function gapValue(raw: unknown, type: string): string | undefined {
  if (raw == null || raw === '') return undefined;
  if (typeof raw !== 'object') return presetValue(raw);
  const { top, left } = raw as { top?: string; left?: string };
  if (type === 'flex' || type === 'grid') {
    if (top == null && left == null) return undefined;
    return `${presetValue(top) ?? FALLBACK_GAP} ${presetValue(left) ?? FALLBACK_GAP}`;
  }
  return presetValue(top);
}

function layoutAdditions(block: string, attrs: Attrs, out: Additions) {
  const def = layouts.get(block);
  if (!def) return;
  const layout: Attrs = attrs.layout ?? def.default;
  const type: string = layout.type ?? (layout.inherit ? 'constrained' : (def.default.type ?? 'default'));
  const slug = type === 'default' ? 'flow' : type;
  const { classes, styles } = out;
  classes.push(`is-layout-${slug}`, `wp-block-${def.name}-is-layout-${slug}`);

  const gap = gapValue(attrs.style?.spacing?.blockGap, type);

  if (type === 'flex') {
    const vertical = layout.orientation === 'vertical';
    if (vertical) classes.push('is-vertical', 'wan-vertical');
    if (layout.justifyContent) classes.push(`is-content-justification-${layout.justifyContent}`);
    if (layout.flexWrap === 'nowrap') classes.push('is-nowrap', 'wan-nowrap');
    // Same mapping as WordPress' wp_get_layout_style(): in a column, the axes swap.
    const justify = vertical ? VERTICAL[layout.verticalAlignment] : JUSTIFY[layout.justifyContent];
    const align = vertical ? (JUSTIFY[layout.justifyContent] ?? 'flex-start') : VERTICAL[layout.verticalAlignment];
    if (justify) {
      classes.push('wan-justify');
      styles['--wan-justify'] = justify;
    }
    if (align) {
      classes.push('wan-align');
      styles['--wan-align'] = align;
    }
    if (gap) {
      classes.push('wan-gap');
      styles['--wan-gap'] = gap;
    }
  } else if (type === 'grid') {
    if (gap) {
      classes.push('wan-gap');
      styles['--wan-gap'] = gap;
    }
    if (layout.columnCount && layout.minimumColumnWidth) {
      classes.push('wan-grid-fit');
      styles['--wan-cols'] = String(layout.columnCount);
      styles['--wan-min'] = layout.minimumColumnWidth;
    } else if (layout.columnCount) {
      classes.push('wan-grid-cols');
      styles['--wan-cols'] = String(layout.columnCount);
    } else {
      classes.push('wan-grid-min');
      styles['--wan-min'] = layout.minimumColumnWidth ?? '12rem';
    }
  } else {
    if (type === 'constrained') {
      classes.push('has-global-padding');
      if (layout.contentSize) {
        classes.push('wan-content-size');
        styles['--wan-content-size'] = layout.contentSize;
      }
      if (layout.wideSize) {
        classes.push('wan-wide-size');
        styles['--wan-wide-size'] = layout.wideSize;
      }
      if (layout.justifyContent === 'left' || layout.justifyContent === 'right') {
        classes.push(`is-content-justification-${layout.justifyContent}`, `wan-constrained-${layout.justifyContent}`);
      }
    }
    if (gap) {
      classes.push('wan-flow-gap');
      styles['--wan-gap'] = gap;
    }
  }
}

/** Sizing of a block inside a flex/grid parent (`style.layout`). */
function childLayoutAdditions(attrs: Attrs, { classes, styles }: Additions) {
  const self = attrs.style?.layout;
  if (!self) return;
  if (self.selfStretch === 'fill') classes.push('wan-grow');
  if (self.selfStretch === 'fixed' && self.flexSize) {
    classes.push('wan-basis');
    styles['--wan-basis'] = self.flexSize;
  }
  if (self.columnSpan) {
    classes.push('wan-col-span');
    styles['--wan-col-span'] = String(self.columnSpan);
  }
  if (self.rowSpan) {
    classes.push('wan-row-span');
    styles['--wan-row-span'] = String(self.rowSpan);
  }
}

function linkColorAdditions(attrs: Attrs, { classes, styles }: Additions) {
  const link = attrs.style?.elements?.link;
  const color = presetValue(link?.color?.text);
  const hover = presetValue(link?.[':hover']?.color?.text);
  if (color) {
    classes.push('wan-link-color');
    styles['--wan-link-color'] = color;
  }
  if (hover) {
    classes.push('wan-link-hover');
    styles['--wan-link-hover'] = hover;
  }
}

const FIRST_TAG = /^(\s*<[a-zA-Z][\w:-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)(\s*\/?>)/;

function mergeAttribute(attrs: string, name: string, update: (current: string) => string): string {
  const re = new RegExp(`(\\s${name}\\s*=\\s*)(?:"([^"]*)"|'([^']*)')`, 'i');
  if (re.test(attrs)) return attrs.replace(re, (_m, prefix: string, dq?: string, sq?: string) => `${prefix}"${escapeAttr(update(dq ?? sq ?? ''))}"`);
  return `${attrs} ${name}="${escapeAttr(update(''))}"`;
}

/** Adds classes and inline declarations to the first element of an HTML fragment. */
export function addToFirstTag(html: string, classes: string[], styles: Styles): string {
  const css = Object.entries(styles)
    .map(([prop, value]) => `${prop}:${value}`)
    .join(';');
  if (classes.length === 0 && !css) return html;
  const m = FIRST_TAG.exec(html);
  if (!m) return html;
  let attrs = m[2];
  if (classes.length) attrs = mergeAttribute(attrs, 'class', (cur) => [...new Set([...cur.split(/\s+/).filter(Boolean), ...classes])].join(' '));
  if (css) attrs = mergeAttribute(attrs, 'style', (cur) => (cur.trim() ? `${cur.trim().replace(/;$/, '')};${css}` : css));
  return m[1] + attrs + m[3] + html.slice(m[0].length);
}

/** Applies every render-time support of `block` to its rendered HTML. */
export function applySupports(block: string, attrs: Attrs, html: string): string {
  const out: Additions = { classes: [], styles: {} };
  layoutAdditions(block, attrs, out);
  childLayoutAdditions(attrs, out);
  linkColorAdditions(attrs, out);
  return addToFirstTag(html, out.classes, out.styles);
}

function boxStyles(prop: 'padding' | 'margin', value: unknown, styles: Styles) {
  if (value == null) return;
  if (typeof value !== 'object') {
    const v = presetValue(value);
    if (v) styles[prop] = v;
    return;
  }
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    const v = presetValue((value as Record<string, unknown>)[side]);
    if (v) styles[`${prop}-${side}`] = v;
  }
}

const TYPOGRAPHY: Record<string, string> = {
  fontSize: 'font-size',
  fontFamily: 'font-family',
  fontWeight: 'font-weight',
  fontStyle: 'font-style',
  lineHeight: 'line-height',
  letterSpacing: 'letter-spacing',
  textTransform: 'text-transform',
  textDecoration: 'text-decoration',
};

/**
 * Class and style attributes for the wrapper of a dynamic block, built from its color,
 * typography, spacing and alignment supports — WordPress' get_block_wrapper_attributes().
 * Returns a string starting with a space, ready to put in an opening tag.
 */
export function wrapperAttributes(attrs: Attrs, baseClasses: (string | false | undefined)[]): string {
  const classes = baseClasses.filter(Boolean) as string[];
  const styles: Styles = {};
  const style: Attrs = attrs.style ?? {};

  if (attrs.className) classes.push(...String(attrs.className).split(/\s+/));
  if (attrs.align) classes.push(`align${attrs.align}`);
  if (attrs.textAlign) classes.push(`has-text-align-${attrs.textAlign}`);

  if (attrs.textColor) classes.push(`has-${attrs.textColor}-color`, 'has-text-color');
  else if (style.color?.text) {
    classes.push('has-text-color');
    styles.color = presetValue(style.color.text)!;
  }
  if (attrs.backgroundColor) classes.push(`has-${attrs.backgroundColor}-background-color`, 'has-background');
  else if (style.color?.background) {
    classes.push('has-background');
    styles['background-color'] = presetValue(style.color.background)!;
  }
  if (style.elements?.link?.color?.text) classes.push('has-link-color');

  if (attrs.fontSize) classes.push(`has-${attrs.fontSize}-font-size`);
  if (attrs.fontFamily) classes.push(`has-${attrs.fontFamily}-font-family`);
  for (const [key, prop] of Object.entries(TYPOGRAPHY)) {
    const v = presetValue(style.typography?.[key]);
    if (v && !(key === 'fontSize' && attrs.fontSize)) styles[prop] = v;
  }

  boxStyles('padding', style.spacing?.padding, styles);
  boxStyles('margin', style.spacing?.margin, styles);

  const css = Object.entries(styles)
    .map(([prop, value]) => `${prop}:${value}`)
    .join(';');
  return ` class="${escapeAttr([...new Set(classes)].join(' '))}"${css ? ` style="${escapeAttr(css)}"` : ''}`;
}
