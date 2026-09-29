# erwan-rivet.fr — Astro

Reproduction du site WordPress erwan-rivet.fr en Astro (SSR, Node) avec un back office.

## Démarrage

Node 22.13 ou plus récent est requis (`node:sqlite` intégré).

```sh
npm install
npm run import:css      # extrait le CSS d'origine depuis ../erwan-rivet.fr vers public/css/wp.css
npm run import:wp -- --reset   # importe pages, contenus, taxonomies et médias dans data/
npm run admin:create -- vous@exemple.fr "un-mot-de-passe-long" "Erwan RIVET"
npm run dev             # http://localhost:4321 — back office sur /admin
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

`data/` (base SQLite et médias) n'est pas versionné : pensez à le sauvegarder.

## Hébergement Node (alternative)

```sh
npm run build
SITE_URL=https://erwan-rivet.fr DATA_DIR=/chemin/persistant npm start
```

`DATA_DIR` (par défaut `./data`) contient la base SQLite `site.db` et le dossier `uploads/`. Il doit être persistant et sauvegardé.

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
