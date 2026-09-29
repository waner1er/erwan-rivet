// Builds the public site as static HTML and publishes it to the `gh-pages` branch for GitHub Pages.
// Usage: npm run deploy                         (URL from SITE_URL, default below)
//        SITE_URL=https://erwan-rivet.fr npm run deploy
//        npm run deploy -- --no-push            (build only, output in dist/client)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SITE_URL = (process.env.SITE_URL ?? 'https://waner1er.github.io/erwan-rivet').replace(/\/$/, '');
const BRANCH = process.env.DEPLOY_BRANCH ?? 'gh-pages';
const PUSH = !process.argv.includes('--no-push');
const OUT = path.resolve('dist/client');

const site = new URL(SITE_URL);
const base = site.pathname.replace(/\/$/, ''); // '' or '/erwan-rivet'
const isCustomDomain = !site.hostname.endsWith('.github.io');

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
}

// 1. Static build
console.log(`\n▶ Build statique pour ${SITE_URL}\n`);
fs.rmSync('dist', { recursive: true, force: true });
sh('npx', ['astro', 'build'], { env: { ...process.env, STATIC_EXPORT: '1', SITE_URL } });

// 2. Prefix root-relative URLs when the site lives in a sub-path (https://user.github.io/repo/)
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

if (base) {
  const prefix = (u) => (u.startsWith('/') && !u.startsWith('//') && !u.startsWith(`${base}/`) ? base + u : u);
  let count = 0;
  for (const file of walk(OUT)) {
    const ext = path.extname(file);
    if (!['.html', '.css', '.json'].includes(ext)) continue;
    let text = fs.readFileSync(file, 'utf8');
    const before = text;
    if (ext === '.html') {
      text = text
        .replace(/(\s(?:href|src|action|poster|data-index-url)=")([^"]*)"/g, (_, attr, u) => `${attr}${prefix(u)}"`)
        .replace(/(\ssrcset=")([^"]*)"/g, (_, attr, set) => `${attr}${set.split(',').map((part) => part.trim().replace(/^\S+/, prefix)).join(', ')}"`);
    }
    if (ext === '.html' || ext === '.css') {
      text = text.replace(/url\((['"]?)(\/[^'")]*)\1\)/g, (_, q, u) => `url(${q}${prefix(u)}${q})`);
    }
    if (ext === '.json') {
      text = text.replace(/"(url|thumbnail)":"(\/[^"]*)"/g, (_, key, u) => `"${key}":"${prefix(u)}"`);
    }
    if (text !== before) {
      fs.writeFileSync(file, text);
      count++;
    }
  }
  console.log(`\n▶ Préfixe ${base} appliqué à ${count} fichiers`);
}

// 3. GitHub Pages extras: no Jekyll (it would hide the _astro folder), custom domain
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
if (isCustomDomain) fs.writeFileSync(path.join(OUT, 'CNAME'), `${site.hostname}\n`);

const pages = walk(OUT).filter((f) => f.endsWith('.html')).length;
console.log(`▶ ${pages} pages HTML générées dans dist/client`);

// The built-in /api/contact endpoint does not exist on static hosting.
const contactHtml = path.join(OUT, 'contact', 'index.html');
if (fs.existsSync(contactHtml) && /action="[^"]*\/api\/contact"/.test(fs.readFileSync(contactHtml, 'utf8'))) {
  console.warn('\n⚠ Formulaire de contact non configuré : renseignez un service (Web3Forms) dans Admin → Réglages, sinon les envois échoueront en ligne.');
}

if (!PUSH) process.exit(0);

// 4. Publish dist/client as the only commit of the gh-pages branch
const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gh-pages-'));
fs.cpSync(OUT, tmp, { recursive: true });
// No shell for git: arguments with spaces (commit message) must stay intact on Windows.
const git = (...args) => sh('git', args, { cwd: tmp, shell: false });
const author = (key) => execFileSync('git', ['config', key], { encoding: 'utf8' }).trim();

git('init', '-q', '-b', BRANCH);
git('config', 'user.name', author('user.name'));
git('config', 'user.email', author('user.email'));
git('add', '-A');
git('commit', '-q', '-m', `Déploiement du ${new Date().toLocaleString('fr-FR')}`);
console.log(`\n▶ Publication sur ${remote} (branche ${BRANCH})`);
git('push', '-q', '--force', remote, `${BRANCH}:${BRANCH}`);
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\n✔ En ligne dans une minute environ : ${SITE_URL}/`);
