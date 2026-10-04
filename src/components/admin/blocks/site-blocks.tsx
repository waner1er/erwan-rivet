// Editor side of the `wan/*` site blocks. They are dynamic: the editor stores their attributes
// and shows a preview rendered by the server renderer (src/lib/blocks/site-blocks.ts) through
// /api/admin/render-block, so the preview is exactly the HTML the site will get. The Menu is the
// exception: its links are inner blocks, edited in place like WordPress' Navigation block.
import { useEffect, useState, type ReactNode } from 'react';
import { getBlockType, registerBlockType, type BlockConfiguration } from '@wordpress/blocks';
import { InnerBlocks, InspectorControls, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { addFilter } from '@wordpress/hooks';
import { PanelBody, RangeControl, SelectControl, Spinner, ToggleControl } from '@wordpress/components';

type Attributes = Record<string, any>;

interface EditProps {
  attributes: Attributes;
  setAttributes: (next: Attributes) => void;
}

// The editor applies color, typography, spacing and alignment to the block wrapper itself, so
// they are left out of the server preview to avoid applying them twice. Layout and gap stay:
// they act on the rendered list (menu, social links), not on the wrapper.
function previewAttributes(attributes: Attributes): Attributes {
  const { align, textColor, backgroundColor, fontSize, fontFamily, style, ...rest } = attributes;
  const blockGap = style?.spacing?.blockGap;
  return blockGap ? { ...rest, style: { spacing: { blockGap } } } : rest;
}

function useServerRender(name: string, attributes: Attributes): string | null {
  const [html, setHtml] = useState<string | null>(null);
  const query = JSON.stringify(previewAttributes(attributes));
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/admin/render-block?name=${encodeURIComponent(name)}&attributes=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data: { html?: string }) => setHtml(data.html ?? ''))
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [name, query]);
  return html;
}

function ServerPreview({ name, attributes, empty }: { name: string; attributes: Attributes; empty: string }) {
  const html = useServerRender(name, attributes);
  if (html === null) return <Spinner />;
  // Inline style: the preview lives in the canvas iframe, which does not load admin.css.
  if (!html) return <p style={{ margin: 0, padding: '0.75rem', border: '1px dashed currentColor', opacity: 0.6, fontSize: '0.85rem' }}>{empty}</p>;
  // Clicks go to the block wrapper (selection), not to the previewed links and fields.
  return <div style={{ pointerEvents: 'none' }} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Entries of a Menu: WordPress' own link and submenu blocks. */
export const MENU_ITEM_BLOCKS = ['core/navigation-link', 'core/navigation-submenu'];

// Those blocks may only live in core/navigation, which needs the WordPress REST API: allow them in
// our Menu too. Runs before registerCoreBlocks() since this module is imported first.
addFilter('blocks.registerBlockType', 'wan/menu-items', (settings: { parent?: string[] }, name: string) =>
  MENU_ITEM_BLOCKS.includes(name) ? { ...settings, parent: [...(settings.parent ?? []), 'wan/menu'] } : settings,
);

function MenuEdit(props: EditProps) {
  const justify = props.attributes.layout?.justifyContent ?? 'left';
  const blockProps = useBlockProps({ className: `wp-block-navigation items-justified-${justify}` });
  const innerBlocksProps = useInnerBlocksProps(
    { className: `wp-block-navigation__container items-justified-${justify} wp-block-navigation` },
    {
      allowedBlocks: MENU_ITEM_BLOCKS,
      // "+" adds a link straight away and opens its URL field, as in WordPress.
      defaultBlock: { name: 'core/navigation-link', attributes: { kind: 'custom' } },
      directInsert: true,
      orientation: 'horizontal',
      renderAppender: InnerBlocks.ButtonBlockAppender,
    },
  );
  return (
    <>
      <InspectorControls>
        <PanelBody title="Réglages">
          <SelectControl
            __nextHasNoMarginBottom
            label="Menu repliable"
            help="Sur petit écran, les liens se replient derrière un bouton « Menu »."
            value={props.attributes.overlayMenu ?? 'mobile'}
            options={[
              { label: 'Sur mobile', value: 'mobile' },
              { label: 'Toujours', value: 'always' },
              { label: 'Jamais', value: 'never' },
            ]}
            onChange={(overlayMenu) => props.setAttributes({ overlayMenu })}
          />
        </PanelBody>
      </InspectorControls>
      <nav {...blockProps}>
        <ul {...innerBlocksProps} />
      </nav>
    </>
  );
}

interface SiteBlock {
  name: string;
  title: string;
  description: string;
  icon: string;
  attributes: BlockConfiguration['attributes'];
  // Untyped: the @types package lags behind Gutenberg's supports (font family, layout...).
  supports: Record<string, unknown>;
  styles?: BlockConfiguration['styles'];
  empty: string;
  controls?: (props: EditProps) => ReactNode;
  /** Custom editor instead of the server preview. */
  edit?: (props: EditProps) => ReactNode;
}

const LINK_TOGGLE = (label: string) => (props: EditProps) => (
  <ToggleControl
    __nextHasNoMarginBottom
    label={label}
    checked={props.attributes.isLink !== false}
    onChange={(isLink) => props.setAttributes({ isLink })}
  />
);

const BLOCKS: SiteBlock[] = [
  {
    name: 'wan/site-title',
    title: 'Titre du site',
    description: 'Le titre défini dans Réglages.',
    icon: 'admin-site-alt3',
    attributes: { level: { type: 'number', default: 0 }, isLink: { type: 'boolean', default: true } },
    supports: {
      html: false,
      align: ['wide', 'full'],
      color: { text: true, background: true, link: true },
      typography: { fontSize: true, lineHeight: true, __experimentalFontFamily: true, __experimentalFontWeight: true },
      spacing: { padding: true, margin: true },
    },
    empty: 'Aucun titre défini dans Réglages.',
    controls: (props) => (
      <>
        <SelectControl
          __nextHasNoMarginBottom
          label="Balise"
          value={String(props.attributes.level ?? 0)}
          options={[{ label: 'Paragraphe', value: '0' }, ...[1, 2, 3, 4, 5, 6].map((n) => ({ label: `Titre ${n}`, value: String(n) }))]}
          onChange={(value) => props.setAttributes({ level: Number(value) })}
        />
        {LINK_TOGGLE('Lien vers l’accueil')(props)}
      </>
    ),
  },
  {
    name: 'wan/site-logo',
    title: 'Logo du site',
    description: 'Le logo défini dans Réglages.',
    icon: 'format-image',
    attributes: { width: { type: 'number' }, isLink: { type: 'boolean', default: true } },
    supports: { html: false, align: ['left', 'center', 'right'], spacing: { margin: true } },
    empty: 'Aucun logo défini dans Réglages.',
    controls: (props) => (
      <>
        <RangeControl
          __nextHasNoMarginBottom
          label="Largeur (px)"
          min={40}
          max={600}
          allowReset
          value={props.attributes.width}
          onChange={(width) => props.setAttributes({ width })}
        />
        {LINK_TOGGLE('Lien vers l’accueil')(props)}
      </>
    ),
  },
  {
    name: 'wan/menu',
    title: 'Menu',
    description: 'Un menu de liens : ajoutez-les avec « + », réorganisez-les, ajoutez des sous-menus.',
    icon: 'menu',
    attributes: {
      overlayMenu: { type: 'string', default: 'mobile' },
      overlayBackgroundColor: { type: 'string' },
      overlayTextColor: { type: 'string' },
      ariaLabel: { type: 'string' },
    },
    supports: {
      html: false,
      color: { text: true, background: true },
      typography: { fontSize: true },
      spacing: { blockGap: true, margin: true, padding: true },
      layout: { allowSwitching: false, allowInheriting: false, allowVerticalAlignment: false, allowSizingOnChildren: true, default: { type: 'flex' } },
    },
    empty: '',
    edit: MenuEdit,
  },
  {
    name: 'wan/social-links',
    title: 'Réseaux sociaux',
    description: 'Les liens réseaux sociaux définis dans Réglages.',
    icon: 'share',
    attributes: { source: { type: 'string', default: 'header' }, iconSize: { type: 'string' } },
    supports: {
      html: false,
      align: ['left', 'center', 'right'],
      spacing: { blockGap: ['horizontal', 'vertical'], margin: true, padding: true },
      layout: { allowSwitching: false, allowInheriting: false, allowVerticalAlignment: false, default: { type: 'flex' } },
    },
    styles: [
      { name: 'default', label: 'Par défaut', isDefault: true },
      { name: 'logos-only', label: 'Logos seuls' },
    ],
    empty: 'Aucun réseau dans cette liste (Réglages).',
    controls: (props) => (
      <>
        <SelectControl
          __nextHasNoMarginBottom
          label="Liste"
          value={props.attributes.source ?? 'header'}
          options={[
            { label: 'Réseaux (en-tête)', value: 'header' },
            { label: 'Réseaux (pied de page)', value: 'footer' },
          ]}
          onChange={(source) => props.setAttributes({ source })}
        />
        <SelectControl
          __nextHasNoMarginBottom
          label="Taille des icônes"
          value={props.attributes.iconSize ?? ''}
          options={[
            { label: 'Par défaut', value: '' },
            { label: 'Petite', value: 'small' },
            { label: 'Normale', value: 'normal' },
            { label: 'Grande', value: 'large' },
            { label: 'Très grande', value: 'huge' },
          ]}
          onChange={(iconSize) => props.setAttributes({ iconSize: iconSize || undefined })}
        />
      </>
    ),
  },
  {
    name: 'wan/search',
    title: 'Recherche',
    description: 'Loupe et résultats de recherche pendant la frappe.',
    icon: 'search',
    attributes: {},
    supports: { html: false, spacing: { margin: true } },
    empty: '',
  },
];

export const SITE_BLOCK_NAMES = BLOCKS.map((b) => b.name);

let registered = false;

export function registerSiteBlocks() {
  if (registered) return;
  registered = true;
  for (const block of BLOCKS) {
    if (getBlockType(block.name)) continue;
    registerBlockType(block.name, {
      apiVersion: 3,
      title: block.title,
      description: block.description,
      category: 'theme',
      icon: block.icon as BlockConfiguration['icon'],
      attributes: block.attributes,
      supports: block.supports,
      styles: block.styles,
      edit: block.edit ?? function Edit(props: EditProps) {
        const blockProps = useBlockProps();
        return (
          <>
            {block.controls && (
              <InspectorControls>
                <PanelBody title="Réglages">{block.controls(props)}</PanelBody>
              </InspectorControls>
            )}
            <div {...blockProps}>
              <ServerPreview name={block.name} attributes={props.attributes} empty={block.empty} />
            </div>
          </>
        );
      },
      // The menu keeps its links as inner blocks; the others store attributes only.
      save: block.edit ? () => <InnerBlocks.Content /> : () => null,
    } as unknown as BlockConfiguration);
  }
}
