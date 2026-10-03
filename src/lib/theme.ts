import fs from 'node:fs';
import path from 'node:path';

export interface NamedToken {
  slug: string;
  name: string;
}

export interface ThemeColor extends NamedToken {
  color: string;
}

export interface ThemeGradient extends NamedToken {
  gradient: string;
}

export interface ThemeFontFamily extends NamedToken {
  fontFamily: string;
}

export interface ThemeSize {
  slug: string;
  name?: string;
  size: string;
}

export interface ThemeShadow extends NamedToken {
  shadow: string;
}

export interface ThemeAspectRatio {
  slug: string;
  ratio: string;
}

export interface HeadingSize {
  size?: string;
  sizeSlug?: string;
  fontWeight?: string;
  letterSpacing?: string;
  textTransform?: string;
}

export interface Theme {
  colors: ThemeColor[];
  gradients: ThemeGradient[];
  fontFamilies: ThemeFontFamily[];
  fontSizes: ThemeSize[];
  spacing: ThemeSize[];
  shadows: ThemeShadow[];
  aspectRatios: ThemeAspectRatio[];
  buttonDimensions: ThemeSize[];
  layout: {
    contentSize: string;
    wideSize: string;
    blockGap: string;
    rootPadding: { top: string; right: string; bottom: string; left: string };
  };
  body: {
    backgroundColorSlug: string;
    textColorSlug: string;
    fontFamilySlug: string;
    fontSizeSlug: string;
    fontWeight: string;
    letterSpacing: string;
    lineHeight: string;
  };
  headings: {
    fontFamilySlug: string;
    fontWeight: string;
    letterSpacing: string;
    lineHeight: string;
    sizes: Record<string, HeadingSize>;
  };
}

const THEME_PATH = path.resolve('src/theme/theme.json');
const OUT_PATH = path.resolve('public/css/theme-vars.css');

export function readTheme(): Theme {
  return JSON.parse(fs.readFileSync(THEME_PATH, 'utf8'));
}

export function writeTheme(theme: Theme) {
  fs.writeFileSync(THEME_PATH, JSON.stringify(theme, null, 2) + '\n');
}

function presetDecls<T extends { slug: string }>(prefix: string, items: T[], valueKey: keyof T): string {
  return items.map((item) => `--wp--preset--${prefix}--${item.slug}: ${String(item[valueKey])};`).join('');
}

/** Builds the theme-vars.css text from a Theme object (pure, no filesystem access). */
export function renderThemeCss(theme: Theme): string {
  const rootDecls = [
    presetDecls('aspect-ratio', theme.aspectRatios, 'ratio'),
    presetDecls('color', theme.colors, 'color'),
    presetDecls('gradient', theme.gradients, 'gradient'),
    presetDecls('font-size', theme.fontSizes, 'size'),
    presetDecls('font-family', theme.fontFamilies, 'fontFamily'),
    presetDecls('spacing', theme.spacing, 'size'),
    presetDecls('shadow', theme.shadows, 'shadow'),
  ].join('');

  const fontFamily = (slug: string) => `var(--wp--preset--font-family--${slug})`;
  const colorVar = (slug: string) => `var(--wp--preset--color--${slug})`;
  const fontSizeVar = (slug: string) => `var(--wp--preset--font-size--${slug})`;

  const lines: string[] = [];
  lines.push('/* Generated from src/theme/theme.json by src/lib/theme.ts. Do not edit by hand. */');
  lines.push(`:root{${rootDecls}}`);
  lines.push(`.wp-block-button{${presetDecls('dimension', theme.buttonDimensions, 'size')}}`);
  lines.push(`:root { --wp--style--global--content-size: ${theme.layout.contentSize};--wp--style--global--wide-size: ${theme.layout.wideSize}; }`);
  lines.push(`:root { --wp--style--block-gap: ${theme.layout.blockGap}; }`);
  const rp = theme.layout.rootPadding;
  lines.push(
    `body{background-color: ${colorVar(theme.body.backgroundColorSlug)};color: ${colorVar(theme.body.textColorSlug)};font-family: ${fontFamily(theme.body.fontFamilySlug)};font-size: ${fontSizeVar(theme.body.fontSizeSlug)};font-weight: ${theme.body.fontWeight};letter-spacing: ${theme.body.letterSpacing};line-height: ${theme.body.lineHeight};--wp--style--root--padding-top: ${rp.top};--wp--style--root--padding-right: ${rp.right};--wp--style--root--padding-bottom: ${rp.bottom};--wp--style--root--padding-left: ${rp.left};}`,
  );
  lines.push(
    `h1, h2, h3, h4, h5, h6{font-family: ${fontFamily(theme.headings.fontFamilySlug)};font-weight: ${theme.headings.fontWeight};letter-spacing: ${theme.headings.letterSpacing};line-height: ${theme.headings.lineHeight};}`,
  );
  for (const [tag, h] of Object.entries(theme.headings.sizes)) {
    const size = h.sizeSlug ? fontSizeVar(h.sizeSlug) : h.size;
    const extra = [
      h.fontWeight && `font-weight: ${h.fontWeight};`,
      h.letterSpacing && `letter-spacing: ${h.letterSpacing};`,
      h.textTransform && `text-transform: ${h.textTransform};`,
    ]
      .filter(Boolean)
      .join('');
    lines.push(`${tag}{font-size: ${size};${extra}}`);
  }
  return lines.join('\n') + '\n';
}

/** Regenerates public/css/theme-vars.css from the current theme.json on disk. */
export function buildThemeCss(theme: Theme = readTheme()): void {
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, renderThemeCss(theme));
}
