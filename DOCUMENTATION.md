# Documentation du CMS

Ce site est un CMS maison construit en Astro. Il reproduit l'expérience d'édition de WordPress (back-office, éditeur Gutenberg, réglages du thème), sans dépendre de WordPress. Le site public est exporté en HTML statique. Le back-office ne tourne qu'en local.

Cette documentation a trois parties :

1. **Fonctionnelle** : utiliser le back-office au quotidien.
2. **Technique** : comment c'est construit.
3. **Écart avec WordPress FSE** : ce qui existe, ce qui manque, ce qui est figé dans le code.

---

## 1. Partie fonctionnelle : utiliser le back-office

### 1.1 Connexion et compte

- Le back-office est sur `/admin`. On le lance en local avec `npm run dev`, il n'est jamais publié en ligne.
- Le premier compte se crée en ligne de commande : `npm run admin:create -- <email> <mot-de-passe> [nom]`. Le mot de passe doit faire au moins 12 caractères. La même commande réinitialise le mot de passe d'un compte existant.
- Les comptes sont propres à chaque poste : ils ne sont pas versionnés.
- **Mon compte** (`/admin/account`) : modifier le nom affiché et changer de mot de passe. Un changement de mot de passe déconnecte toutes les autres sessions.
- Après 5 échecs de connexion depuis la même adresse, les tentatives sont bloquées pendant 15 minutes.

### 1.2 Tableau de bord

`/admin` affiche :

- le nombre d'éléments par type de contenu, de médias et de messages non lus ;
- les 8 contenus modifiés en dernier ;
- des raccourcis « Nouvel article » et « Nouvelle page ».

### 1.3 Pages

Les pages (`/admin/pages`) portent le contenu fixe : Accueil, Mon Parcours, Contact, Politique de confidentialité, pages de liste, etc.

| Champ | Rôle |
|---|---|
| Titre | Obligatoire |
| Adresse (slug) | Générée depuis le titre si vide. La page est servie sur `/adresse/`. Certaines adresses sont réservées : `admin`, `api`, `uploads`, `tag`, `feed`, `recherche`, `css`, `fonts` et les préfixes des contenus typés. |
| Contenu | Éditeur Gutenberg ou Markdown (voir § 1.5) |
| Statut | Publiée ou Brouillon |
| Gabarit | Voir ci-dessous |
| Contenus listés | Uniquement pour le gabarit « Liste de contenus » : Réalisations, Travaux ou Projets |
| Image de bannière | Utilisée par les gabarits avec bannière, et comme image de partage sur les réseaux |
| Description SEO | Générée depuis le contenu si vide |

La page d'accueil a une adresse vide : on ne peut ni changer son adresse ni la supprimer.

**Gabarits de page** (choisis dans une liste, pas éditables depuis le back-office, voir § 3) :

- **Standard** : contenu seul, comme la page d'accueil.
- **Avec bannière** : bannière avec titre et image, puis le contenu.
- **Libre** : contenu en pleine largeur, sans conteneur.
- **Accueil du blog** : titre, introduction (le contenu de la page), puis les articles regroupés par catégorie.
- **Liste de contenus** : bannière, introduction, puis la grille de tous les contenus publiés du type choisi. Les Projets s'affichent en vignettes carrées, les autres types en cartes.

### 1.4 Articles et contenus typés

Quatre types de contenu ont chacun leur entrée dans le menu « Contenus » :

| Type | Adresse publique | Catégories | Tags |
|---|---|---|---|
| Articles du blog | `/adresse/` | oui | oui |
| Réalisations | `/realisation/adresse/` | non | oui |
| Travaux en entreprise | `/travail-en-entrepris/adresse/` | non | oui |
| Projets personnels | `/projets-personnels/adresse/` | non | oui |

Champs en plus de ceux d'une page :

- **Extrait** : affiché dans les listes. Généré depuis le contenu (25 mots) si vide.
- **Date de publication** : une date future programme la publication. Le contenu reste invisible jusqu'à cette date, sauf en prévisualisation.
- **Gabarit** : *Bannière* (titre sur l'image) ou *Classique* (grand titre puis image).
- **Afficher le sommaire** : sommaire repliable construit automatiquement depuis les titres H2 et H3.
- **Catégorie** (articles du blog uniquement) et **Tags** : cocher des tags existants ou en créer de nouveaux, séparés par des virgules.

Un nouvel article du blog est créé par défaut au format **Markdown** avec le gabarit **Classique**. Les autres types sont créés en HTML (Gutenberg) avec le gabarit Bannière.

En bas de chaque article, des liens mènent vers le contenu précédent et le suivant du même type.

### 1.5 Rédiger le contenu : deux éditeurs

Le champ **Format du contenu** décide de l'éditeur affiché. Il est lu à l'ouverture de la page : après un changement de format, il faut **enregistrer puis rouvrir** le contenu pour changer d'éditeur. Le texte existant n'est pas converti.

#### Format HTML : l'éditeur Gutenberg

C'est le véritable éditeur par blocs de WordPress :

- le bouton **« + »** ouvre la bibliothèque de blocs, avec une recherche ;
- une barre d'outils flottante permet de déplacer, dupliquer ou transformer un bloc ;
- le panneau de droite règle le bloc sélectionné : couleur (texte, fond, liens), taille, police, marges intérieures et extérieures, espacement entre blocs, alignement, mise en page (pile, rangée, grille, largeur du contenu). Les couleurs, tailles, polices et espacements proposés sont ceux du thème (§ 1.11) ;
- l'aperçu utilise les feuilles de style du site, avec les mêmes polices et couleurs ;
- on peut glisser une image dans un bloc Image pour l'envoyer directement dans la médiathèque.

Le contenu est enregistré au format natif de Gutenberg : du HTML accompagné de commentaires `<!-- wp:... -->`. C'est ce qui permet de retrouver chaque bloc éditable séparément à la réouverture. Du HTML brut sans ces commentaires (ancien contenu ou copier-coller) est découpé en blocs au mieux au premier chargement.

Ce que l'éditeur affiche correspond au site public : les réglages de mise en page (pile, rangée, justification, espacement entre blocs, couleur des liens) sont appliqués au rendu par le moteur de blocs (§ 2.4).

**Blocs disponibles.** La bibliothèque ne propose que les blocs que le site sait afficher : paragraphe, titre, liste, citation, code, détails, texte préformaté, citation en exergue, tableau, poésie, image, galerie, couverture, fichier, média et texte, boutons, colonnes, groupe, rangée, pile, grille, séparateur, espacement, code court. Sont retirés de la bibliothèque :

- **les blocs dynamiques de WordPress** (Navigation, Boucle de requête, Derniers articles, Commentaires, etc.) : dans WordPress, c'est le serveur PHP qui produit leur affichage, et ils n'afficheraient rien ici. L'éditeur de site a ses propres blocs dynamiques (§ 1.10) ;
- **les blocs supprimés par le filtre de sécurité** (§ 2.5) : Vidéo, Audio, Playlist, Contenu embarqué (YouTube, etc.), Icônes de réseaux sociaux ;
- **les blocs qui dépendent de WordPress lui-même** : Accordéon et Onglets (scripts de WordPress), Classique (ancien éditeur), Lire la suite et Saut de page.

Un bloc de ces types déjà présent dans un contenu reste ouvrable et modifiable.

#### Format Markdown : l'éditeur source

Il se compose d'une zone de texte et d'un aperçu en direct, avec trois modes : Code, Partagé ou Aperçu. Une barre d'outils insère les éléments courants (titres, gras, lien, liste, citation, code, séparateur, bouton, image depuis la médiathèque, formulaire de contact). Le HTML est accepté au milieu du Markdown.

#### Dans les deux éditeurs

- **Ctrl+S** (ou Cmd+S) enregistre.
- Le navigateur prévient avant de quitter une page qui contient des modifications non enregistrées.
- Le shortcode `[contact-form]`, placé n'importe où, insère le formulaire de contact du site.
- Le bouton **Voir** ouvre le contenu sur le site. Un brouillon est visible en prévisualisation par un administrateur connecté (paramètre `?preview` dans l'URL).

### 1.6 Le panneau Référencement (SEO)

Sur chaque page et article, une colonne « Référencement (SEO) » se met à jour pendant la rédaction. Elle résume le nombre de points à corriger, à améliorer ou corrects, et détaille :

- la longueur du titre (idéal : 15 à 60 caractères) ;
- la longueur de la description (idéal : 120 à 160 caractères) ;
- la longueur de l'adresse ;
- la longueur du contenu et le temps de lecture estimé ;
- les images sans texte alternatif ;
- la présence des mots du titre dans le texte ;
- les **liens internes suggérés** : le panneau signale les autres contenus publiés mentionnés dans le texte sans lien vers eux.

Ce panneau conseille seulement : il n'empêche jamais de publier et ne modifie rien automatiquement.

### 1.7 Médias

La médiathèque (`/admin/media`) accepte les images (jpg, png, webp, gif, avif, svg) et les PDF, 15 Mo maximum par fichier.

- On peut envoyer des fichiers par glisser-déposer.
- Les fichiers sont rangés par année et par mois (`/uploads/2026/01/...`).
- Un bouton copie l'URL d'un fichier.
- Les fichiers sont réutilisables depuis tous les champs image, l'éditeur Gutenberg et la barre d'outils Markdown.
- Supprimer un fichier supprime aussi ses variantes redimensionnées héritées de WordPress (`-300x200`, etc.). Le fichier disparaît alors des contenus qui l'utilisent.

### 1.8 Catégories et tags

- **Catégories** (`/admin/categories`) : propres aux articles du blog. Elles ont un nom, une adresse, une description, une catégorie parente (un seul niveau d'imbrication) et une position qui fixe l'ordre d'affichage. Chaque catégorie a sa page publique : `/categorie/`, ou `/parent/enfant/` pour une sous-catégorie.
- **Tags** (`/admin/tags`) : communs à tous les types de contenu. La page `/tag/adresse/` liste les articles du blog groupés par catégorie, puis les autres contenus portant le tag.

### 1.9 Réglages

Sur `/admin/settings` :

- **Titre du site** et **slogan** : la page d'accueil a pour titre « Titre - Slogan ».
- **E-mail de contact**.
- **Logo / photo** : affiché dans le pied de page et utilisé comme favicon.
- **Réseaux sociaux de l'en-tête** et **du pied de page** : une ligne par entrée, au format `service | url | libellé`. Services disponibles : `linkedin`, `github`, `mail`, `wordpress`. Chaque liste s'affiche là où l'éditeur de site place un bloc **Réseaux sociaux** qui la choisit.
- **Formulaire de contact** : voir § 2.7.

Les menus ne se règlent pas ici : ils se modifient dans l'éditeur de site (§ 1.10).

### 1.10 Éditeur de site : en-tête et pied de page

Sur `/admin/site`, l'**en-tête** et le **pied de page** (les « parties de modèle ») se construisent avec l'éditeur Gutenberg, comme une page. On peut par exemple déplacer la recherche, ajouter un bouton « Me contacter », changer la couleur de fond, ou composer un pied de page en colonnes.

En plus des blocs habituels, la catégorie **Thème** de la bibliothèque propose cinq blocs propres au site :

| Bloc | Affiche | Réglages |
|---|---|---|
| Titre du site | Le titre défini dans les Réglages | Balise (paragraphe, H1…H6), lien vers l'accueil, couleurs, taille, police, marges |
| Logo du site | Le logo défini dans les Réglages | Largeur, lien vers l'accueil, alignement, marges |
| Menu | Ses propres liens, édités directement dans le bloc (voir ci-dessous) | Menu repliable (sur mobile, toujours, jamais), justification, espacement, taille, couleurs |
| Réseaux sociaux | Une des deux listes des Réglages | Liste (en-tête ou pied de page), taille des icônes, style « Logos seuls », espacement, alignement |
| Recherche | La loupe avec résultats pendant la frappe | Marges |

Le titre, le logo et les réseaux sociaux reprennent les valeurs des Réglages : les changer dans les Réglages met à jour l'en-tête et le pied de page sans repasser par l'éditeur de site. Dans l'éditeur, leur aperçu est le HTML exact que le site affichera. Ces blocs ne sont proposés que dans l'éditeur de site, pas dans les pages.

**Modifier un menu** : dans l'en-tête (ou le pied de page), cliquer dans le bloc Menu.

- Le bouton **« + »** à la fin du menu ajoute un lien. Son champ d'adresse propose les pages et articles du site pendant la frappe (par exemple « Accueil » pour la page d'accueil). On peut aussi coller une adresse externe.
- Cliquer sur un lien permet de modifier son libellé et son adresse, de l'ouvrir dans un nouvel onglet, ou de le transformer en **sous-menu** (bouton « Ajouter un sous-menu » de sa barre d'outils). Un sous-menu s'ouvre au survol et au clic sur sa flèche.
- Les liens se déplacent par glisser-déposer ou avec les flèches de la barre d'outils.
- Chaque bloc Menu a ses propres liens : un menu différent dans le pied de page se crée en y ajoutant un autre bloc Menu.

Tant qu'une partie n'a pas été modifiée, elle utilise le **modèle par défaut** (celui d'origine du site). Le bouton **Rétablir le modèle par défaut** annule toutes les modifications d'une partie.

### 1.11 Thème : couleurs, tailles, espacements, polices

Sur `/admin/theme`, avec les contrôles visuels de Gutenberg :

- **Couleurs** : une pastille par couleur du thème (fond, texte, 5 accents) ouvre un sélecteur de couleur.
- **Tailles de police** et **espacements** : une valeur et une unité (px, rem ou em) pour chaque palier.
- **Polices** : un menu déroulant pour le texte courant et un pour les titres, avec les polices installées.

« Enregistrer » régénère immédiatement la feuille de style du site. Les autres réglages (dégradés, ombres, largeurs de contenu, styles de titres, couleurs secondaires) ne se modifient que dans `theme.json` (§ 2.9).

### 1.12 Messages

`/admin/messages` liste les messages reçus par le formulaire de contact quand le site tourne en mode serveur (§ 2.7). On peut les marquer lus ou non lus, y répondre par e-mail ou les supprimer. Le menu affiche le nombre de messages non lus.

### 1.13 Le site public

En plus des pages et articles, le site public propose :

- **Recherche** : une loupe dans l'en-tête affiche des résultats pendant la frappe, et la page `/recherche/?q=...` affiche les résultats complets. La recherche se fait dans le navigateur, avec un index généré au build. Elle fonctionne donc aussi sur l'hébergement statique.
- **Menu mobile** : le menu se replie en bouton « Menu » sur petit écran.
- **Archives** : une page par catégorie et par tag.
- **Anciennes adresses WordPress** : les URL en `.html` (`/page.html`, `/blog/index.html`) redirigent vers la nouvelle adresse.
- **Page 404** : elle est aussi générée en `404.html` pour GitHub Pages.

---

## 2. Partie technique : architecture et fonctionnement

### 2.1 Deux modes de fonctionnement

- **Mode serveur** (`npm run dev`, ou hébergement Node avec `npm run build && npm start`) : tout est rendu à la demande, back-office compris. C'est le mode utilisé pour rédiger.
- **Mode export statique** (`STATIC_EXPORT=1`, utilisé par `npm run deploy`) : seules les routes publiques sont générées en HTML. `/admin/*` et `/api/*` sont exclus de l'export (voir `astro.config.mjs`).

Le site livré aux visiteurs est donc entièrement statique : pas de code serveur ni de base de données exposés.

### 2.2 Organisation du code

| Dossier | Contenu |
|---|---|
| `src/pages/[...path].astro` | Routeur public : il résout une URL en page, article, catégorie ou tag |
| `src/views/` | Gabarits publics (`PageView`, `PostView`, `CategoryView`, `TagView`, `NotFound`) |
| `src/components/` | Parties de modèle (`TemplatePart`), bannière, grilles, sommaire, formulaire de contact |
| `src/components/admin/` | Composants React du back-office : `GutenbergEditor`, `ThemeEditor`, `SeoPanel`, `link-suggestions` (recherche des pages dans le champ de lien), et `blocks/` (blocs « Site » côté éditeur) |
| `src/lib/blocks/` | Moteur de rendu des blocs (§ 2.4) : `render.ts`, `supports.ts`, `site-blocks.ts` |
| `src/layouts/` | `BaseLayout` (site public, balises SEO) et `AdminLayout` |
| `src/lib/` | Accès aux données (`db`, `content`, `settings`, `media`, `template-parts`), synchronisation, authentification, assainissement du HTML, thème, JSON-LD |
| `src/pages/admin/`, `src/pages/api/` | Écrans du back-office et API (envoi de médias, contact, lecture du thème, aperçu des blocs « Site ») |
| `src/scripts/` | Scripts du navigateur : menu mobile, recherche, médiathèque |
| `src/theme/theme.json` | Déclaration du thème |
| `public/css/` | Feuilles de style (§ 2.9) |
| `content/` | Contenu versionné (JSON) et médias (`content/uploads/`) |
| `scripts/` | Outils en ligne de commande (§ 2.11) |

### 2.3 Stockage et synchronisation du contenu

- **`content/*.json` et `content/uploads/`** sont la **source de vérité** et sont versionnés dans git : réglages, pages, catégories, tags, articles, liens articles-tags, liste des médias et parties de modèle modifiées (`template_parts.json`, facultatif : absent, il vaut « aucune partie modifiée »).
- **`data/site.db`** (SQLite, non versionné) est un cache local du contenu. Elle contient aussi les données privées : comptes, sessions et messages.

La synchronisation est automatique :

- chaque modification réussie dans le back-office réécrit `content/*.json` (middleware). Il reste à faire `git add content && git commit` ;
- à chaque requête, un contrôle rapide (date de modification et taille des fichiers) détecte un changement de `content/`, par exemple après un `git pull`, et recharge la base. Le serveur n'a pas besoin d'être redémarré ;
- au premier lancement, la base est créée et remplie depuis `content/`.

Commandes manuelles : `npm run content:export` (base vers JSON) et `npm run content:import` (JSON vers base, écrase la base locale).

Variables d'environnement : `DATA_DIR` (par défaut `./data`) et `CONTENT_DIR` (par défaut `./content`).

### 2.4 Rendu du contenu et moteur de blocs

- **Markdown** : converti en HTML par `marked`, puis assaini.
- **HTML sans commentaires Gutenberg** (ancien contenu) : assaini et affiché tel quel.
- **Contenu Gutenberg** (pages, articles, parties de modèle) : rendu par `src/lib/blocks/render.ts`, l'équivalent de `render_block()` de WordPress. Il lit l'arbre des blocs (`@wordpress/block-serialization-default-parser`), puis :
  - pour un bloc **statique**, garde le HTML enregistré par l'éditeur ;
  - pour un bloc **dynamique** (`wan/*`, § 1.10), appelle son rendu TypeScript dans `site-blocks.ts`, qui produit le même balisage que le bloc WordPress équivalent, pour que `wp.css` s'applique. Le bloc Menu rend lui-même ses blocs intérieurs (`core/navigation-link` et `core/navigation-submenu`), en neutralisant les adresses dangereuses (`javascript:`…) et en assainissant les libellés ;
  - applique les **réglages appliqués au rendu** (`supports.ts`), que WordPress n'enregistre pas dans le HTML : mise en page (flux, contraint, flex, grille), justification, espacement entre blocs, dimensionnement des enfants, couleur des liens.
- WordPress traduit chaque réglage de mise en page en une classe à hachage unique (`wp-container-core-group-is-layout-<hash>`) accompagnée d'une feuille de style générée. Ici, la valeur est posée en propriété CSS personnalisée sur l'élément (`style="--wan-gap:…"`) et appliquée par une classe utilitaire générique de `wan-layout.css` (`wan-gap`, `wan-justify`, `wan-basis`…). Il n'y a pas de hachage et pas de CSS généré.
- Le HTML enregistré est assaini (§ 2.5). La sortie des blocs dynamiques, produite par notre code, est insérée après l'assainissement, car elle contient légitimement des formulaires, boutons et SVG.
- Les blocs dynamiques de WordPress (`core/latest-posts`, etc.) n'ont pas de rendu ici et n'affichent rien. C'est pourquoi ils sont retirés de la bibliothèque (§ 1.5).
- **Sommaire** : les titres H2 et H3 reçoivent un `id` s'ils n'en ont pas, et le sommaire est construit à partir d'eux (`renderWithToc`).
- **Shortcode** : `[contact-form]` est remplacé par le composant formulaire (`Content.astro`).
- Le balisage des gabarits reprend les classes de WordPress (`wp-block-*`), pour que `wp.css` s'applique sans modification.

### 2.5 Sécurité

- **Assainissement du HTML** (`src/lib/sanitize.ts`) au rendu public : une liste blanche de balises et d'attributs, calibrée sur les blocs Gutenberg de texte et de mise en page (y compris les balises sémantiques `section`, `header`, `footer`, `nav`, `main`, `aside` et `article`, choisies dans les réglages d'un groupe). Les scripts, gestionnaires d'événements, `iframe`, `svg` et formulaires sont retirés, ainsi que les styles dangereux (`javascript:`, `expression()`, `@import`). Les liens reçoivent `rel="noopener noreferrer"`. Cette protection tient même si un compte administrateur est compromis.
- **Mots de passe** : hachés avec scrypt et un sel aléatoire. Pour un e-mail inconnu, la vérification prend le même temps que pour un compte existant, ce qui ne révèle pas quels comptes existent.
- **Sessions** : un jeton aléatoire dans un cookie `httpOnly` et `SameSite=Lax`, valable 7 jours. Seule son empreinte SHA-256 est stockée en base.
- **Back-office** : vérification de l'origine des formulaires (`checkOrigin`), réponses `no-store`, `noindex` et `X-Frame-Options: SAMEORIGIN`.
- **Médias** : extensions limitées, 15 Mo maximum, aucun accès hors du dossier `uploads`. Les SVG sont servis avec une CSP qui les isole.

### 2.6 Recherche

`/search-index.json` est généré au build (ou à la demande en mode serveur) à partir des contenus publiés. Le script `src/scripts/search.ts` cherche dans cet index côté navigateur. Le panneau SEO s'appuie sur le même index pour suggérer des liens internes.

### 2.7 Formulaire de contact

Deux modes, configurés dans les Réglages :

- **Site en ligne (statique)** : renseigner une adresse d'envoi externe, par exemple Web3Forms (`https://api.web3forms.com/submit`), et sa clé d'accès. Le formulaire envoie les messages directement à ce service, qui les transfère par e-mail.
- **Mode serveur** (adresse d'envoi vide) : le formulaire envoie vers `/api/contact`, qui enregistre le message dans `/admin/messages`.

Un champ caché piège les robots (honeypot). Le message de confirmation ou d'erreur s'affiche grâce au paramètre `?contact=ok|error` dans l'URL de retour.

### 2.8 SEO et visibilité dans les IA génératives (GEO)

Tout est automatique, sans champ à remplir en plus :

- **Métadonnées** : `title`, meta description, URL canonique, Open Graph et Twitter Card. La valeur saisie à la main est utilisée en priorité, sinon elle est déduite du contenu. Si aucune image n'est définie, la première image du contenu sert d'image de partage.
- **JSON-LD** : un graphe `schema.org` sur chaque page, avec `WebSite`, `Person`, `BlogPosting` ou `WebPage`, et `BreadcrumbList` pour les articles.
- **`/sitemap.xml`**, **`/robots.txt`** et **`/feed.xml`** (RSS des 20 derniers articles du blog).
- **`/llms.txt`** : un résumé texte du site à destination des IA. `robots.txt` autorise explicitement GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.
- Balisage sémantique : `<article>`, `<time datetime>`, lien d'évitement « Aller au contenu ».

Les brouillons et les contenus programmés n'apparaissent nulle part.

### 2.9 Système de thème

Le thème est découplé du contenu et des gabarits :

- **`src/theme/theme.json`** déclare les couleurs (20), les dégradés, les polices, les tailles, les espacements, les ombres, les proportions, les dimensions des boutons, les largeurs de mise en page, la typographie du texte et celle des titres. Il est édité par `/admin/theme` ou à la main.
- **`src/lib/theme.ts`** lit et écrit `theme.json` et génère `public/css/theme-vars.css`. `/admin/theme` et `npm run theme:build` utilisent ce même code, et produisent donc le même résultat.
- **`public/css/theme-vars.css`** (fichier généré, ne pas modifier à la main) contient les variables `--wp--preset--*` et la typographie de base.
- **`public/css/wp.css`** contient les règles génériques des blocs WordPress, extraites du site d'origine (`scripts/extract-css.mjs`).
- **`public/css/wan-layout.css`** contient les utilitaires de mise en page réutilisables. Les classes fixes (`wan-stack-*`, `wan-row-*`, `wan-bleed-*`, `wan-grid-*`) servent aux gabarits Astro. Les classes alimentées par une propriété personnalisée (`wan-gap`, `wan-justify`, `wan-align`, `wan-basis`, `wan-link-color`…) servent au moteur de blocs (§ 2.4). Elles remplacent les classes `wp-container-*-is-layout-<hash>` de WordPress, qu'il ne faut jamais réintroduire.
- **`public/css/site.css`** contient les ajouts propres au projet.

**Ordre de chargement** (`BaseLayout.astro` et `GutenbergEditor.tsx` doivent rester identiques) : `theme-vars.css`, puis `wp.css`, puis `wan-layout.css`, puis `site.css`.

L'éditeur Gutenberg charge `/api/admin/theme.json` pour proposer la palette et les tailles du thème dans les panneaux de blocs. Tout cela ne concerne que le back-office : le site public ne charge que des feuilles de style statiques.

**Remplacer entièrement le thème** est une opération technique : modifier `theme.json` et/ou remplacer `wp.css` et `wan-layout.css`, lancer `npm run theme:build`, puis vérifier visuellement. L'en-tête et le pied de page se modifient dans l'éditeur de site. Les gabarits de page et d'article restent dans les composants Astro (§ 3).

### 2.10 Déploiement

- **GitHub Pages** : `npm run deploy` construit l'export statique et le publie sur la branche `gh-pages`. Par défaut, le site est publié sur `https://waner1er.github.io/erwan-rivet/`. Le script préfixe alors toutes les URL avec `/erwan-rivet` (HTML, CSS et index de recherche).
- **Domaine personnalisé** : `SITE_URL=https://erwan-rivet.fr npm run deploy` (ajoute aussi le fichier `CNAME`).
- **`npm run build:static`** : construit sans publier, dans `dist/client`.
- Le script avertit si `content/` contient des modifications non commitées.
- **Hébergement Node** (alternative) : `npm run build`, puis `SITE_URL=... DATA_DIR=/chemin/persistant npm start`.

### 2.11 Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Site en mode serveur, back-office compris |
| `npm run admin:create -- <email> <mdp> [nom]` | Créer un administrateur ou réinitialiser son mot de passe |
| `npm run theme:build` | Régénérer `theme-vars.css` depuis `theme.json` |
| `npm run content:export` / `content:import` | Forcer la synchronisation entre la base et `content/` |
| `npm run deploy` / `build:static` | Export statique, avec ou sans publication |
| `npm run import:wp -- --reset` | Réimporter le site WordPress aspiré (`../erwan-rivet.fr`). **Écrase le contenu.** |
| `npm run import:css` | Réextraire `wp.css` et les polices depuis le site aspiré |
| `node scripts/import-gutenberg-content.ts` | Import ponctuel du balisage Gutenberg d'origine via l'API REST de WordPress (variables `WP_USER` et `WP_APP_PASSWORD`) |

---

## 3. Écart avec WordPress FSE (état des lieux)

Le CMS reprend la **couche contenu** de WordPress : l'éditeur de blocs, les préréglages `theme.json`, le balisage des blocs et leur rendu, mise en page comprise. Il reprend en partie la **couche site** du Full Site Editing (FSE) : l'en-tête et le pied de page sont des documents en blocs, éditables dans l'éditeur de site. Les gabarits et les menus ne le sont pas encore.

Les blocs de site sont des blocs propres au projet (`wan/*`), pas les blocs officiels de WordPress (`core/navigation`, `core/site-title`…). Les blocs officiels dépendent de l'API REST de WordPress, qui n'existe pas ici. Conséquence : un en-tête copié depuis un vrai WordPress ne s'affiche pas tel quel ici, et inversement.

| Fonction FSE | WordPress | Ici |
|---|---|---|
| Éditeur de blocs pour le contenu | ✅ | ✅ (pages et contenus typés) |
| Préréglages `theme.json` (couleurs, tailles, espacements, polices) | ✅ | ✅ (partiel dans l'admin, complet dans le fichier) |
| Styles globaux (styles par bloc et par élément, variations de style) | ✅ | ❌ |
| **Parties de modèle** (en-tête, pied de page) éditables en blocs | ✅ | ✅ (Éditeur de site, avec les blocs `wan/*`) |
| **Modèles** (single, page, archive, 404, recherche) éditables en blocs | ✅ | ❌ : `src/views/*.astro`, choix parmi une liste fermée |
| Modèles personnalisés créés par l'utilisateur | ✅ | ❌ |
| **Menus** : édités dans l'éditeur de site, sous-menus, recherche des pages | ✅ | ✅ (liens du bloc Menu) |
| Menu réutilisable à plusieurs endroits (entité `wp_navigation`) | ✅ | ❌ : chaque bloc Menu a ses propres liens |
| **Compositions** (patterns) et blocs réutilisables (synchronisés) | ✅ | ❌ |
| Mise en page appliquée au rendu (pile, rangée, grille, espacement, couleur des liens) | ✅ | ✅ (moteur de blocs, § 2.4) |
| Blocs dynamiques | ✅ | ⚠️ seulement les blocs de site : titre, logo, menu, réseaux sociaux, recherche. Pas de boucle de requête ni de derniers articles. |
| Historique et révisions | ✅ | ❌ (seulement l'historique git de `content/`) |

Prochaines étapes envisagées, sur la même base (moteur de blocs et blocs `wan/*`) :

1. ~~Rendu des blocs côté serveur, et en-tête et pied de page en blocs.~~ Fait.
2. ~~Menus : édition dans le bloc Menu, sous-menus, recherche des pages du site.~~ Fait.
3. **Modèles** : article, page, archive, 404 et recherche en blocs (titre, image à la une, contenu, termes, sommaire, liste de contenus), et modèles personnalisés choisis dans le champ « Gabarit ».
