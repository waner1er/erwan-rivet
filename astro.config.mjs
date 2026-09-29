// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://erwan-rivet.fr',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'ignore',
  security: { checkOrigin: true },
  vite: {
    ssr: { external: ['node:sqlite'] },
  },
});
