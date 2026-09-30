# erwan-rivet.fr — Astro

Reproduction du site WordPress erwan-rivet.fr en Astro (SSR, Node) avec un back office.

## Démarrage (nouveau poste)

Node 22.13 ou plus récent est requis (`node:sqlite` intégré).

```sh
git clone https://github.com/waner1er/erwan-rivet.git && cd erwan-rivet
npm install
npm run admin:create -- vous@exemple.fr "un-mot-de-passe-long" "Erwan RIVET"
npm run dev             # http://localhost:4321 — back office sur /admin
```

La base locale est créée et remplie automatiquement depuis `content/` au premier lancement.

## Où est le contenu ?

| Dossier | Versionné | Contient |
| --- | --- | --- |
| `content/*.json` | oui | pages, articles, réalisations, travaux, projets, catégories, tags, réglages, liste des médias |
| `content/uploads/` | oui | images et fichiers |
| `data/site.db` | non | copie locale du contenu, comptes admin, sessions, messages de contact |

- Chaque enregistrement dans l'admin met à jour `content/` : il suffit ensuite de `git add content && git commit && git push`.
- Après un `git pull`, le site recharge `content/` tout seul, même si le serveur tourne déjà.
- `npm run content:export` / `npm run content:import` forcent la synchronisation dans un sens ou dans l'autre.
- Le compte admin est propre à chaque poste (`npm run admin:create`).

Réimporter depuis le scrap WordPress (écrase le contenu) :

```sh
npm run import:css
npm run import:wp -- --reset
```

## Mise en ligne sur GitHub Pages

Le back office tourne en local ; le site public est exporté en HTML statique et publié sur la branche `gh-pages`.

1. Modifier le contenu en local : `npm run dev`, puis http://localhost:4321/admin
2. Publier : `npm run deploy`

Le site est publié sur `https://waner1er.github.io/erwan-rivet/` par défaut. Pour un domaine personnalisé :

```sh
SITE_URL=https://erwan-rivet.fr npm run deploy   # ajoute aussi le fichier CNAME
```

`npm run build:static` génère `dist/client` sans publier.

Sur un hébergement statique :

- la recherche utilise `search-index.json`, généré au build ;
- le formulaire de contact passe par un service externe (Web3Forms), à configurer dans Admin → Réglages ;
- les brouillons et le back office ne sont pas publiés.

Le contenu publié est celui de `content/` sur le poste qui lance le déploiement : commitez-le pour le partager.

## Hébergement Node (alternative)

```sh
npm run build
SITE_URL=https://erwan-rivet.fr DATA_DIR=/chemin/persistant npm start
```

`DATA_DIR` (par défaut `./data`) contient la base SQLite `site.db` ; `CONTENT_DIR` (par défaut `./content`) le contenu versionné et les médias.

## Organisation

- `src/pages/[...path].astro` : routeur public (pages, articles, réalisations, travaux, projets, catégories, tags).
- `src/views/` : gabarits reprenant le balisage WordPress pour que `public/css/wp.css` s'applique tel quel.
- `src/pages/admin/` : back office (pages, contenus, catégories, tags, médias, messages, réglages, compte).
- `src/lib/` : base de données, contenus, authentification, médias.
- `scripts/` : import du scrap WordPress, extraction CSS, création d'administrateur.

## Contenus

- Format HTML ou Markdown, au choix pour chaque contenu.
- `[contact-form]` dans une page insère le formulaire de contact. Les messages arrivent dans Admin → Messages.
- Les titres H2/H3 génèrent le sommaire automatiquement.
- Un brouillon peut être prévisualisé une fois connecté, avec `?preview` dans l'URL.
