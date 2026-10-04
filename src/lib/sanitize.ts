import sanitizeHtml from 'sanitize-html';

// Whitelist calibrated on the HTML actually produced by WordPress/Gutenberg
// blocks (wp-block-*), so admin-authored content keeps rendering as-is while
// script/iframe/event-handler injection is stripped.
const ALLOWED_TAGS = [
  'a', 'abbr', 'article', 'aside', 'b', 'blockquote', 'br', 'caption', 'cite',
  'code', 'del', 'details', 'div', 'em', 'figcaption', 'figure', 'footer',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'img', 'ins', 'kbd',
  'li', 'main', 'mark', 'nav', 'ol', 'p', 'pre', 'q', 's', 'section', 'small',
  'span', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot',
  'th', 'thead', 'time', 'tr', 'u', 'ul',
];

const GLOBAL_ATTRS = ['class', 'id', 'style', 'title', 'aria-hidden', 'aria-label', 'aria-expanded', 'role'];

const ALLOWED_ATTRS: sanitizeHtml.IOptions['allowedAttributes'] = {
  '*': [...GLOBAL_ATTRS, 'data-*'],
  a: ['href', 'target', 'rel', 'download'],
  img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding', 'fetchpriority'],
  time: ['datetime'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan', 'scope'],
};

// `style` is kept (Gutenberg relies heavily on inline styles for spacing,
// colors, background images, CSS vars...), but any value that could smuggle
// script execution (url(javascript:...), expression(), @import) is dropped.
const UNSAFE_STYLE_VALUE = /url\s*\(\s*['"]?\s*javascript:|expression\s*\(|@import/i;

function sanitizeStyleAttr(style: string): string {
  return style
    .split(';')
    .filter((decl) => !UNSAFE_STYLE_VALUE.test(decl))
    .join(';');
}

export function sanitizeContentHtml(html: string): string {
  const clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: true,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
    },
  });
  return clean.replace(/\sstyle="([^"]*)"/g, (_full, style: string) => ` style="${sanitizeStyleAttr(style)}"`);
}
