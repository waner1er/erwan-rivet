# Documentation du CMS

Ce site est un CMS maison construit en Astro, pensé pour reproduire l'expérience d'édition de WordPress (back-office, éditeur Gutenberg) sans dépendre de WordPress lui-même. Cette documentation couvre l'usage au quotidien (partie fonctionnelle) et le fonctionnement interne (partie technique).

---

## 1. Partie fonctionnelle — utiliser le back-office

### 1.1 Connexion

Le back-office est accessible sur `/admin`. Connexion avec un email et un mot de passe créés via la commande `npm run admin:create -- <email> <mot-de-passe> [nom]` (mot de passe de 12 caractères minimum). Le mot de passe est stocké hashé (scrypt), jamais en clair.

### 1.2 Contenus

Le site distingue deux familles de contenu :

- **Pages** (`/admin/pages`) : contenu statique (Accueil, Mon Parcours, Contact, Politique de confidentialité…). Chaque page a une adresse (`slug`), un gabarit (voir ci-dessous), et un statut (Publiée / Brouillon).
- **Articles et contenus typés** (`/admin/posts`) : quatre types distincts, chacun avec sa propre liste dans le menu — **Articles du blog**, **Réalisations**, **Travaux en entreprise**, **Projets personnels**. Chaque type a sa propre adresse de base (ex. `/realisation/...`, `/projets-personnels/...`) et peut être catégorisé/tagué (les catégories et tags sont réservés aux Articles du blog).

Champs communs à une page/un article :
- **Titre**, **Adresse** (slug, généré automatiquement depuis le titre si laissé vide)
- **Contenu** : édité avec l'éditeur Gutenberg (voir § 1.3)
- **Image à la une / de bannière**
- **Description SEO** (`meta_description`) : si laissée vide, une description est générée automatiquement depuis le contenu
- **Statut** : Publié / Brouillon — un brouillon n'est jamais visible sur le site public ni listé dans le sitemap, le flux RSS ou le fichier `llms.txt`
- **Date de publication** (articles) : une date future programme la publication

**Gabarits de page** : Standard (contenu seul), Avec bannière (titre + image en tête), Libre (plein écran, sans conteneur), Accueil du blog, Liste de contenus (affiche automatiquement tous les articles d'un type donné).

**Gabarits d'article** : Bannière (titre sur l'image) ou Classique (grand titre + image).

### 1.3 L'éditeur de contenu (Gutenberg)

Le contenu est rédigé avec le véritable éditeur par blocs de WordPress (Gutenberg), avec :
- Le bouton **"+"** en haut à gauche du cadre de contenu : ouvre la bibliothèque de blocs (paragraphe, titre, image, liste, citation, colonnes, tableau, code…), avec recherche
- Une **barre d'outils flottante** au survol/sélection d'un bloc : déplacer, dupliquer, changer de type
- Un **panneau de réglages** à droite (dans l'onglet "Bloc") pour ajuster les options du bloc sélectionné (alignement, couleur, taille…)
- Le rendu dans l'éditeur reflète fidèlement le style réel du site (même police, mêmes couleurs)

Un shortcode spécial `[contact-form]` placé n'importe où dans le contenu insère le vrai formulaire de contact du site.

**Important — format du contenu** : l'éditeur enregistre le contenu au format natif de Gutenberg (HTML + commentaires `<!-- wp:... -->`). C'est ce qui permet de rouvrir un article et de retrouver chaque bloc individuellement éditable, plutôt qu'un simple bloc de HTML générique. Du contenu HTML brut sans ces commentaires (ancien contenu non migré, copier-coller externe) reste modifiable mais Gutenberg le regroupe au premier chargement en un bloc générique plutôt que de le décomposer finement.

### 1.4 Le panneau Référencement (SEO)

Sur chaque page/article, une colonne dédiée **"Référencement (SEO)"** s'affiche en temps réel pendant la rédaction, avec un résumé (nombre de points à corriger / à améliorer / ok) et le détail :
- Longueur du titre (idéal : 15 à 60 caractères)
- Longueur de la description (idéal : 120 à 160 caractères)
- Longueur de l'adresse
- Longueur du contenu et temps de lecture estimé
- Images sans texte alternatif
- Présence des mots du titre dans le texte
- **Liens internes suggérés** : détecte quand le titre d'un autre contenu publié est mentionné dans le texte en cours sans lien associé, et propose de l'ajouter

Ce panneau ne fait que conseiller — il n'empêche jamais de publier, et aucune suggestion n'est appliquée automatiquement.

### 1.5 Médias

La médiathèque (`/admin/media`) accepte images (jpg, png, webp, gif, avif, svg) et PDF, 15 Mo maximum par fichier. Les fichiers sont rangés par année/mois (`uploads/2026/01/...`) et réutilisables depuis n'importe quel champ image ou depuis l'éditeur de contenu (bouton "Image" dans l'inserteur de blocs).

### 1.6 Menu de navigation

Dans `/admin/settings`, le menu principal se gère comme du contenu Gutenberg plutôt qu'en texte : chaque entrée est un bloc **Lien** que l'on ajoute, réorganise (glisser-déposer) ou supprime visuellement via le bouton **"+"**, exactement comme dans l'éditeur de contenu. Le champ `URL` du bloc doit pointer vers une adresse du site (ex. `/contact/`).

### 1.7 Le thème (couleurs, tailles, espacements, polices)

Dans `/admin/theme`, avec les véritables contrôles visuels de l'éditeur Gutenberg (pas de champ texte à deviner) :
- **Couleurs** : une pastille cliquable par couleur du thème (fond, texte, 5 accents) ouvre un vrai sélecteur de couleur.
- **Tailles de police** et **Espacements** : un contrôle valeur + unité (px/rem/em) par taille/espacement du thème.
- **Polices** : un menu déroulant par usage (« Texte courant », « Titres ») listant les polices installées sur le site — on choisit, on n'invente pas de valeur CSS.

Chaque panneau est repliable, comme dans l'inspecteur de bloc. "Enregistrer" régénère immédiatement la feuille de style du site. Voir § 2.6 pour le détail technique et les limites (pourquoi les couleurs WordPress "par défaut" proposées dans l'éditeur de contenu ne sont pas réglables ici).

### 1.8 Catégories, tags, réglages, messages

- **Catégories et tags** (`/admin/categories`, `/admin/tags`) : organisation des Articles du blog uniquement.
- **Réglages** (`/admin/settings`) : titre du site, slogan, email de contact, menu de navigation (§ 1.6), liens réseaux sociaux (en-tête et pied de page), configuration du formulaire de contact.
- **Messages** (`/admin/messages`) : messages reçus via le formulaire de contact (uniquement si le site tourne en mode serveur — voir § 2.4).

---

## 2. Partie technique — architecture et fonctionnement

### 2.1 Vue d'ensemble

Le projet est un site Astro, avec deux modes de fonctionnement distincts :

- **Mode serveur** (`npm run dev`, ou un déploiement Node) : tout est rendu dynamiquement, back-office compris. C'est le mode utilisé pour rédiger du contenu.
- **Mode export statique** (`STATIC_EXPORT=1`, utilisé pour le déploiement GitHub Pages) : seules les pages publiques sont générées en HTML/CSS/JS statique au moment du build. Le back-office (`/admin/*`) et l'API (`/api/*`) sont exclus de cet export — ils n'existent que localement, jamais en ligne sur le site public déployé.

Cette séparation garantit que le site livré aux visiteurs est 100 % statique (aucun JavaScript serveur, aucune base de données exposée), pour un score PageSpeed Insights maximal.

### 2.2 Stockage du contenu

Deux couches :
- **`data/site.db`** (SQLite) : la source de vérité. Contient les pages, articles, catégories, tags, médias, réglages, comptes admin et sessions. Chemin configurable via la variable d'environnement `DATA_DIR`.
- **`content/*.json`** : un export du contenu de la base, régénéré automatiquement après chaque sauvegarde réussie dans le back-office. Ces fichiers sont versionnés dans git — c'est ce qui permet de déployer le contenu avec le code, sans transporter la base SQLite elle-même.

Pour forcer une resynchronisation manuelle : `npm run content:export` (base → JSON) ou `npm run content:import` (JSON → base).

### 2.3 Sécurité du contenu

Le HTML de chaque page/article est filtré (bibliothèque `sanitize-html`, voir `src/lib/sanitize.ts`) au moment du rendu public, avec une liste précise de balises/attributs autorisés calibrée sur les blocs Gutenberg. Les scripts, gestionnaires d'événements et styles dangereux (`javascript:`, `expression()`) sont systématiquement retirés, même si un compte admin venait à être compromis.

### 2.4 Formulaire de contact

Deux modes, configurables dans `/admin/settings` :
- **Site en ligne (statique)** : le formulaire envoie les messages via un service externe (Web3Forms). GitHub Pages n'exécute pas de code serveur, donc ce mode est nécessaire pour un déploiement statique.
- **Site en mode serveur (local)** : les messages sont enregistrés directement en base et consultables dans `/admin/messages`.

### 2.5 SEO et visibilité pour les IA génératives (GEO)

Entièrement automatique, sans aucun champ à remplir :
- **Métadonnées** : balises title, meta description, Open Graph, Twitter Card — générées depuis le contenu (avec les valeurs saisies manuellement en priorité).
- **Données structurées (JSON-LD)** : un script `schema.org` est injecté sur chaque page (`Person`, `WebSite`, `BlogPosting`/`WebPage`, `BreadcrumbList`), construit depuis les réglages et les champs déjà renseignés.
- **`/sitemap.xml`**, **`/robots.txt`**, **`/feed.xml`** (RSS) : générés dynamiquement depuis le contenu publié.
- **`/llms.txt`** : résumé du site au format texte, à l'intention des IA génératives (ChatGPT, Claude, Perplexity…), listant les pages et articles publiés avec un court résumé. `robots.txt` autorise explicitement les principaux robots d'IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended…).
- Les articles sont balisés sémantiquement (`<article>`, `<time datetime>`).

Tout ceci est recalculé à chaque build/requête depuis le contenu réel — rien n'est à maintenir à la main, et le contenu existant en bénéficie rétroactivement sans modification.

### 2.6 Système de thème

Le thème visuel est volontairement découplé du contenu et des templates, pour pouvoir être remplacé un jour sans toucher ni à l'un ni à l'autre :

- **`src/theme/theme.json`** : déclare la palette de couleurs, dégradés, polices, tailles, espacements et ombres par nom (pas de valeur codée en dur ailleurs). C'est la source éditable depuis `/admin/theme` (§ 1.7).
- **`src/lib/theme.ts`** : lit/écrit `theme.json` et génère la feuille de style — logique partagée entre la page `/admin/theme` (écriture au clic sur Enregistrer) et le script CLI `npm run theme:build`, pour que les deux produisent toujours exactement le même résultat.
- **`public/css/theme-vars.css`** : généré depuis `theme.json`. Définit les variables CSS (`--wp--preset--*`) et la typographie de base.
- **`public/css/wan-layout.css`** : classes utilitaires de mise en page réutilisables (`wan-stack-*`, `wan-row-*`, `wan-bleed-*`, `wan-grid-*`), qui remplacent les classes générées automatiquement par WordPress (propres à une seule instance, non réutilisables).
- **`public/css/wp.css`** : règles de mise en page génériques issues du thème WordPress d'origine (non spécifiques à une palette ou une police), rarement modifié.

Tout ceci reste 100 % statique au build final — aucun calcul de thème ne s'exécute dans le navigateur du visiteur. Le back-office (admin-only, jamais déployé sur le site public) charge en plus ces mêmes feuilles de style dans l'éditeur de contenu pour que l'aperçu reste fidèle au rendu réel.

**Limite connue** : `/admin/theme` ne couvre que les couleurs/tailles/espacements/polices du thème actif — pas les ~20 couleurs WordPress "par défaut" proposées en plus dans l'éditeur de blocs (rouge vif, orange lumineux…), ni les propriétés avancées (ombres, dégradés, rayons de bordure). Ces valeurs restent modifiables uniquement dans `theme.json` directement.

**Changer les couleurs, tailles, espacements ou polices du thème actuel** : directement depuis `/admin/theme`.

**Remplacer entièrement le thème** (nouvelle structure visuelle) : reste une opération technique, hors back-office — éditer `theme.json` et/ou remplacer `wp.css`/`wan-layout.css`, puis relancer `npm run theme:build`.

### 2.7 Déploiement

- **`npm run deploy`** : build en export statique et publication sur la branche `gh-pages` du dépôt (déploiement GitHub Pages).
- **`npm run build:static`** : identique, sans publier (utile pour vérifier le build localement).
- Avant chaque déploiement, le script avertit si des changements de contenu ne sont pas encore commités dans `content/*.json`.

### 2.8 Scripts utiles

| Commande | Rôle |
|---|---|
| `npm run dev` | Démarre le site en mode serveur (back-office inclus) |
| `npm run admin:create -- <email> <mdp> [nom]` | Crée un administrateur ou réinitialise son mot de passe |
| `npm run theme:build` | Régénère `theme-vars.css` depuis `theme.json` |
| `npm run content:export` / `content:import` | Resynchronise la base SQLite et les fichiers `content/*.json` |
| `npm run deploy` / `build:static` | Déploiement statique (GitHub Pages) |
