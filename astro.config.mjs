// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

/**
 * STATIC_EXPORT=1 prerenders every public route to plain HTML (dist/client) for GitHub Pages.
 * The back office (/admin) and the API stay server-only: they are used locally with `npm run dev`.
 * @type {import('astro').AstroIntegration}
 */
const staticExport = {
  name: 'static-export',
  hooks: {
    'astro:route:setup': ({ route }) => {
      if (!process.env.STATIC_EXPORT) return;
      const serverOnly = route.component.startsWith('src/pages/admin/') || route.component.startsWith('src/pages/api/');
      route.prerender = !serverOnly;
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://erwan-rivet.fr',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [staticExport],
  trailingSlash: 'ignore',
  security: { checkOrigin: true },
  vite: {
    ssr: { external: ['node:sqlite'] },
  },
});
