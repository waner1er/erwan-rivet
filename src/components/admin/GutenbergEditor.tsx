import { useEffect, useMemo, useRef, useState } from 'react';
import { BlockCanvas, BlockEditorProvider, BlockInspector, Inserter } from '@wordpress/block-editor';
import { SlotFillProvider, Popover } from '@wordpress/components';
import { registerCoreBlocks } from '@wordpress/block-library';
import { parse, rawHandler, serialize, type Block } from '@wordpress/blocks';
import { uploadFiles } from '../../scripts/media-picker.ts';
import { MENU_ITEM_BLOCKS, registerSiteBlocks, SITE_BLOCK_NAMES } from './blocks/site-blocks.tsx';
import { fetchLinkSuggestions } from './link-suggestions.ts';

import '@wordpress/components/build-style/style.css';
import '@wordpress/block-editor/build-style/style.css';
import '@wordpress/block-editor/build-style/content.css';
import '@wordpress/block-library/build-style/common.css';
import '@wordpress/block-library/build-style/style.css';
import '@wordpress/block-library/build-style/editor.css';
import '@wordpress/block-library/build-style/theme.css';

let coreBlocksRegistered = false;
function ensureCoreBlocks() {
  if (coreBlocksRegistered) return;
  registerCoreBlocks();
  registerSiteBlocks();
  coreBlocksRegistered = true;
}

// Core blocks the public site can display: static blocks (their saved HTML is the output) that
// survive src/lib/sanitize.ts, children included (list item, button, column). Left out of the
// inserter, though existing ones still open: WordPress' dynamic blocks (rendered by PHP there),
// media the sanitizer strips (iframe, video, audio, svg, MathML), and blocks relying on
// WordPress itself (accordion and tabs scripts, classic editor, more/page break markers).
const CONTENT_BLOCKS = [
  'core/paragraph', 'core/heading', 'core/list', 'core/list-item', 'core/quote', 'core/pullquote',
  'core/code', 'core/preformatted', 'core/verse', 'core/details', 'core/table', 'core/html', 'core/shortcode',
  'core/image', 'core/gallery', 'core/cover', 'core/media-text', 'core/file',
  'core/buttons', 'core/button', 'core/columns', 'core/column', 'core/group', 'core/separator', 'core/spacer',
];

function allowedBlockTypes(mode: 'content' | 'site'): string[] {
  return mode === 'site' ? [...CONTENT_BLOCKS, ...SITE_BLOCK_NAMES, ...MENU_ITEM_BLOCKS] : CONTENT_BLOCKS;
}

// `content` may hold either the native Gutenberg format (HTML with
// `<!-- wp:... -->` comments) or plain HTML from the previous editor /
// imported WordPress content. `parse` only understands the former; feeding
// it plain HTML yields a single unrecognized "raw html" block instead of
// real blocks, so `rawHandler` is used to guess blocks from plain markup.
function blocksFromContent(content: string): Block[] {
  if (!content.trim()) return [];
  if (content.includes('<!-- wp:')) return parse(content);
  const result = rawHandler({ HTML: content });
  return Array.isArray(result) ? result : [result];
}

interface MediaUploadArgs {
  filesList: File[];
  onFileChange: (media: { id?: number; url: string; alt?: string }[]) => void;
  onError?: (message: string) => void;
}

async function mediaUpload({ filesList, onFileChange, onError }: MediaUploadArgs) {
  try {
    const uploaded = await uploadFiles(filesList);
    onFileChange(uploaded.map((item) => ({ id: item.id, url: item.path, alt: '' })));
  } catch (err) {
    onError?.((err as Error).message);
  }
}

// Loads the public theme CSS so the canvas preview matches the live site
// instead of Gutenberg's generic default look.
const THEME_STYLESHEETS = ['/css/theme-vars.css', '/css/wp.css', '/css/wan-layout.css', '/css/site.css'];

function useThemeEditorStyles() {
  const [styles, setStyles] = useState<{ css: string }[]>([]);
  useEffect(() => {
    let cancelled = false;
    Promise.all(THEME_STYLESHEETS.map((href) => fetch(href).then((res) => res.text()))).then((sheets) => {
      if (!cancelled) setStyles(sheets.map((css) => ({ css })));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return styles;
}

interface ThemeJson {
  colors: { slug: string; name: string; color: string }[];
  gradients: { slug: string; name: string; gradient: string }[];
  fontFamilies: { slug: string; name: string; fontFamily: string }[];
  fontSizes: { slug: string; name?: string; size: string }[];
  spacing: { slug: string; name?: string; size: string }[];
  layout: { contentSize: string; wideSize: string };
}

// So the block inserter/inspector offer the theme's actual palette and type
// scale instead of Gutenberg's generic defaults (vivid-red, luminous-amber...).
function useThemeEditorSettings() {
  const [theme, setTheme] = useState<ThemeJson | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/theme.json')
      .then((res) => res.json())
      .then((data: ThemeJson) => {
        if (!cancelled) setTheme(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return theme;
}

interface Props {
  /** Name of the hidden <textarea> kept in sync, so the surrounding <form> submits unchanged. */
  fieldName: string;
  initialValue: string;
  /** "site" (template parts) also offers the site blocks: title, logo, menu, social links, search. */
  mode?: 'content' | 'site';
}

export default function GutenbergEditor({ fieldName, initialValue, mode = 'content' }: Props) {
  ensureCoreBlocks();
  const [blocks, setBlocks] = useState<Block[]>(() => blocksFromContent(initialValue));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const theme = useThemeEditorSettings();
  const settings = useMemo(
    () => ({
      mediaUpload,
      __experimentalFetchLinkSuggestions: fetchLinkSuggestions,
      allowedBlockTypes: allowedBlockTypes(mode),
      ...(theme && {
        // The modern block-editor reads per-block color/typography panels from
        // `__experimentalFeatures.color.palette.theme` (theme.json's own shape),
        // not the flat `colors`/`fontSizes` props — those are a legacy fallback
        // consumed by a different, narrower set of components. Without this,
        // blocks render with no Color panel at all. See
        // store/get-block-settings.js's PATHS_WITH_OVERRIDE handling.
        // Layout, gap and link color are applied at render time by src/lib/blocks/supports.ts.
        __experimentalFeatures: {
          useRootPaddingAwareAlignments: true,
          layout: { contentSize: theme.layout.contentSize, wideSize: theme.layout.wideSize },
          color: {
            palette: { theme: theme.colors.map(({ slug, name, color }) => ({ slug, name, color })) },
            gradients: { theme: theme.gradients.map(({ slug, name, gradient }) => ({ slug, name, gradient })) },
            custom: true,
            customGradient: true,
            link: true,
          },
          typography: {
            fontSizes: { theme: theme.fontSizes.map(({ slug, name, size }) => ({ slug, name: name ?? slug, size })) },
            fontFamilies: { theme: theme.fontFamilies.map(({ slug, name, fontFamily }) => ({ slug, name, fontFamily })) },
            customFontSize: true,
            lineHeight: true,
          },
          spacing: {
            padding: true,
            margin: true,
            blockGap: true,
            units: ['px', 'em', 'rem', 'vh', 'vw', '%'],
            spacingSizes: { theme: theme.spacing.map(({ slug, name, size }) => ({ slug, name: name ?? slug, size })) },
          },
          dimensions: { minHeight: true },
        },
      }),
    }),
    [theme, mode],
  );
  const themeStyles = useThemeEditorStyles();

  function persist(next: Block[]) {
    setBlocks(next);
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.value = serialize(next);
    // The surrounding admin form only tracks unsaved changes and Ctrl+S via
    // native `input` events, which programmatic `.value` writes don't fire.
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  return (
    <div className="gutenberg-editor">
      <SlotFillProvider>
        <BlockEditorProvider value={blocks} onInput={persist} onChange={persist} settings={settings}>
          <div className="gutenberg-editor__toolbar">
            <Inserter />
          </div>
          <div className="gutenberg-editor__body">
            <BlockCanvas height="60vh" styles={themeStyles} />
            <div className="gutenberg-editor__sidebar">
              <BlockInspector />
            </div>
          </div>
        </BlockEditorProvider>
        <Popover.Slot />
      </SlotFillProvider>
      <textarea ref={textareaRef} name={fieldName} defaultValue={serialize(blocks)} hidden readOnly />
    </div>
  );
}
