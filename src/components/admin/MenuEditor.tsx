import { useEffect, useMemo, useRef, useState } from 'react';
import { BlockCanvas, BlockEditorProvider, Inserter } from '@wordpress/block-editor';
import { SlotFillProvider, Popover } from '@wordpress/components';
import { registerCoreBlocks } from '@wordpress/block-library';
import { createBlock, type Block } from '@wordpress/blocks';

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
  coreBlocksRegistered = true;
}

export interface MenuItem {
  label: string;
  url: string;
}

// Edited here as a flat list of core/navigation-link blocks — not wrapped in
// core/navigation, which actively tries to create/load a wp_navigation
// entity via @wordpress/core-data (an API this project doesn't run). The
// link block itself has no such dependency, so this stays safe while still
// giving the real drag-and-drop block editing experience.
function blocksFromItems(items: MenuItem[]): Block[] {
  return items.map((item) => createBlock('core/navigation-link', { label: item.label, url: item.url, kind: 'custom' }));
}

function itemsFromBlocks(blocks: Block[]): MenuItem[] {
  return blocks
    .filter((b) => b.name === 'core/navigation-link')
    .map((b) => ({ label: String(b.attributes.label ?? ''), url: String(b.attributes.url ?? '') }))
    .filter((item) => item.label && item.url);
}

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

interface Props {
  fieldName: string;
  initialItems: MenuItem[];
}

export default function MenuEditor({ fieldName, initialItems }: Props) {
  ensureCoreBlocks();
  const [blocks, setBlocks] = useState<Block[]>(() => blocksFromItems(initialItems));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const themeStyles = useThemeEditorStyles();
  const settings = useMemo(() => ({}), []);

  function persist(next: Block[]) {
    setBlocks(next);
    const textarea = textareaRef.current;
    if (!textarea) return;
    const items = itemsFromBlocks(next);
    textarea.value = JSON.stringify(items);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  return (
    <div className="gutenberg-editor menu-editor">
      <SlotFillProvider>
        <BlockEditorProvider value={blocks} onInput={persist} onChange={persist} settings={settings}>
          <div className="gutenberg-editor__toolbar">
            <Inserter />
            <span className="menu-editor__hint">Ajoutez des blocs « Lien » pour chaque entrée du menu.</span>
          </div>
          <BlockCanvas height="240px" styles={themeStyles} />
        </BlockEditorProvider>
        <Popover.Slot />
      </SlotFillProvider>
      <textarea ref={textareaRef} name={fieldName} defaultValue={JSON.stringify(itemsFromBlocks(blocks))} hidden readOnly />
    </div>
  );
}
