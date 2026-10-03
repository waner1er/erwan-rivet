// Regenerates public/css/theme-vars.css from src/theme/theme.json. Shares
// its logic with the /admin/theme page (src/lib/theme.ts), so editing the
// theme from the back office or running this CLI script produce the exact
// same output.
// Usage: node scripts/build-theme-css.mjs
import { buildThemeCss } from '../src/lib/theme.ts';
import fs from 'node:fs';
import path from 'node:path';

buildThemeCss();
const outPath = path.resolve('public/css/theme-vars.css');
console.log(`theme-vars.css: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
