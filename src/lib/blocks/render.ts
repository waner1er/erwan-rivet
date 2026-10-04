// Server-side block rendering, WordPress' render_block(): walks the Gutenberg block tree,
// keeps the saved HTML of static blocks, renders dynamic blocks (src/lib/blocks/site-blocks.ts)
// and applies render-time supports (src/lib/blocks/supports.ts).
import { randomBytes } from 'node:crypto';
import { parse } from '@wordpress/block-serialization-default-parser';
import { sanitizeContentHtml } from '../sanitize.ts';
import { SITE_BLOCKS, type ParsedBlock, type RenderContext } from './site-blocks.ts';
import { applySupports, type Attrs } from './supports.ts';

export type { RenderContext };

export function isDynamicBlock(name: string): boolean {
  return name in SITE_BLOCKS;
}

/**
 * Renders one dynamic block, supports included. Its output is trusted (built by our code);
 * a block with inner blocks (the menu and its links) renders them itself.
 */
export function renderDynamicBlock(name: string, attrs: Attrs, ctx: RenderContext, innerBlocks: ParsedBlock[] = []): string {
  const render = SITE_BLOCKS[name];
  return render ? applySupports(name, attrs, render(attrs, ctx, innerBlocks)) : '';
}

/**
 * Renders Gutenberg block markup to HTML. Stored HTML is sanitized like any content; dynamic
 * block output is not (it legitimately holds forms, buttons and SVG), so it is swapped in for
 * placeholder tokens after sanitizing.
 */
export function renderBlocks(content: string, ctx: RenderContext): string {
  const dynamic: string[] = [];
  const token = `wanblock${randomBytes(6).toString('hex')}`;

  const render = (block: ParsedBlock): string => {
    if (!block.blockName) return block.innerHTML;
    const attrs = block.attrs ?? {};
    if (isDynamicBlock(block.blockName)) {
      dynamic.push(renderDynamicBlock(block.blockName, attrs, ctx, block.innerBlocks));
      return `${token}x${dynamic.length - 1}x`;
    }
    let i = 0;
    const html = block.innerContent.map((chunk) => (chunk === null ? render(block.innerBlocks[i++]) : chunk)).join('');
    return applySupports(block.blockName, attrs, html);
  };

  const html = (parse(content) as ParsedBlock[]).map(render).join('');
  return sanitizeContentHtml(html).replace(new RegExp(`${token}x(\\d+)x`, 'g'), (_m, n: string) => dynamic[Number(n)] ?? '');
}
