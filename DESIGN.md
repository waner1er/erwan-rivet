---
name: Erwan RIVET
description: Portfolio d'un développeur web PHP, en noir, blanc et gris, à la manière d'un thème minimal de console portable.
colors:
  console-black: "#141414"
  console-black-raised: "#1b1b1b"
  console-black-soft: "#1f1f1f"
  rule-dark: "#2b2b2b"
  ink-white: "#ffffff"
  dim-white: "#a8a8a8"
  console-grey: "#bdbdbd"
  paper-light: "#ffffff"
  paper-light-raised: "#f5f5f5"
  paper-light-soft: "#f2f2f2"
  rule-light: "#dedede"
  ink-black: "#141414"
  dim-black: "#555555"
typography:
  display:
    fontFamily: "Nunito, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2.9rem, 8vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.4vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "clamp(1.35rem, 2.4vw, 1.9rem)"
    fontWeight: 750
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 500
    lineHeight: 1.6
  lead:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "clamp(1.1rem, 1.8vw, 1.3rem)"
    fontWeight: 500
    lineHeight: 1.6
  label:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 600
  code:
    fontFamily: "Fira Code, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "0.9rem"
rounded:
  sm: "4px"
  md: "8px"
  field: "10px"
  panel: "16px"
  band: "28px"
  pill: "999px"
spacing:
  20: "10px"
  30: "20px"
  40: "30px"
  50: "50px"
  60: "70px"
  70: "90px"
  80: "140px"
components:
  button-primary:
    backgroundColor: "{colors.ink-white}"
    textColor: "{colors.console-black}"
    rounded: "{rounded.pill}"
    padding: "0.85rem 1.5rem"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.console-grey}"
    textColor: "{colors.console-black}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink-white}"
    rounded: "{rounded.pill}"
    padding: "0.85rem 1.5rem"
  button-outline-hover:
    backgroundColor: "{colors.ink-white}"
    textColor: "{colors.console-black}"
  cta-band:
    backgroundColor: "{colors.console-grey}"
    textColor: "{colors.console-black}"
    rounded: "{rounded.band}"
  input:
    backgroundColor: "{colors.console-black}"
    textColor: "{colors.ink-white}"
    rounded: "{rounded.field}"
    height: "48px"
  project-thumb:
    backgroundColor: "{colors.console-black-soft}"
    rounded: "{rounded.md}"
  tag:
    textColor: "{colors.dim-white}"
    rounded: "{rounded.pill}"
    padding: "0.2rem 0.7rem"
---

# Design System: Erwan RIVET

## Overview

**Creative North Star: "Le menu de console"**

Le site se lit comme le menu d'une console portable au thème minimal : un fond presque noir, une seule encre blanche, et ce qui n'est pas sélectionné reste en retrait. L'interface ne porte aucune couleur. La couleur appartient au travail et à la personne : le portrait d'Erwan, et les captures de projets qui reprennent leurs vraies couleurs quand on les désigne.

La densité est faible et la lecture calme. De grandes respirations séparent les sections, les éléments sont ouverts et séparés par des filets, jamais enfermés dans des cartes. Le mouvement reste rare : le portrait se révèle par un masque à l'arrivée, les images de projets se révèlent au défilement et reprennent leurs couleurs au survol, et rien ne suit le pointeur.

Rejeté explicitement : le look corporate et froid, le registre « startup tech » (néon sur fond sombre, dégradés, verre, jargon), l'esthétique d'atelier scolaire, la reprise littérale de l'interface de console (barre d'état, menu d'icônes), le fond crème, les effets qui suivent la souris (parallaxe du portrait, boutons aimantés, pastille de curseur) et le bandeau qui défile en boucle.

**Key Characteristics:**
- Noir et blanc pur, gris console pour un seul bandeau ; aucune teinte d'accent.
- Nunito 800 pour les titres, 500 pour le texte.
- Éléments inactifs estompés, élément actif à pleine encre.
- Images de projets en niveaux de gris, en couleur au survol.
- Sombre par défaut, variante claire automatique.

## Colors

Une palette sans teinte : le contraste fait tout le travail, la couleur est laissée aux images.

### Primary
- **Encre blanche** (#ffffff, mode sombre) / **Encre noire** (#141414, mode clair) : titres, texte, bouton principal, élément actif de la navigation, soulignés.

### Neutral
- **Noir console** (#141414) : fond du mode sombre.
- **Noir console relevé** (#1b1b1b) : surfaces (formulaire de contact).
- **Noir console doux** (#1f1f1f) : fonds discrets (survol des lignes de l'offre, blocs de code, sommaire, fond des vignettes).
- **Filet sombre** (#2b2b2b) : séparateurs et bordures.
- **Blanc estompé** (#a8a8a8) : texte secondaire, chapôs, métadonnées.
- **Gris console** (#bdbdbd) : fond du bandeau d'appel à l'action en mode sombre ; contour des mots alternés du bandeau des technologies.
- **Blanc papier** (#ffffff), **papier relevé** (#f5f5f5), **papier doux** (#f2f2f2), **filet clair** (#dedede), **noir estompé** (#555555) : équivalents du mode clair, sans aucune teinte chaude.

### Named Rules
**La règle de l'interface muette.** L'interface n'a pas de couleur d'accent. Toute couleur visible vient d'une image (portrait, capture, logo).

**La règle de l'élément sélectionné.** Un seul élément à pleine encre dans un groupe : la page courante dans la navigation, le projet survolé dans une liste (les autres passent à 35 % d'opacité).

## Typography

**Display Font:** Nunito (avec system-ui)
**Body Font:** Nunito (avec system-ui)
**Label/Mono Font:** Fira Code, uniquement pour le code

**Character:** Une seule famille, ronde et franche : graisse 800 très serrée pour les titres, 500 confortable pour la lecture.

### Hierarchy
- **Display** (800, clamp(2.9rem, 8vw, 6rem), 0.9) : nom d'Erwan en tête d'accueil, titres de page.
- **Headline** (800, clamp(2rem, 4.4vw, 3.5rem), 1.05) : titres de section, 20ch maximum.
- **Title** (750, clamp(1.35rem, 2.4vw, 1.9rem), 1.05) : services, projets, sous-parties.
- **Lead** (500, clamp(1.1rem, 1.8vw, 1.3rem), 1.6) : chapô sous un titre, 50ch maximum.
- **Body** (500, 1.0625rem, 1.6) : texte courant, 56ch maximum (Nunito est plus étroite que son « 0 », d'où une mesure en ch plus basse).
- **Label** (600, 0.92rem) : contexte d'un projet (« Freelance », « CDI · Algam »).

### Named Rules
**La règle du titre qui suffit.** Pas de sur-titre en petites capitales au-dessus d'un titre. Une ligne au-dessus d'un titre n'existe que si elle porte une information propre (question d'un bandeau d'appel, lien de retour « ← Réalisation »), en texte normal.

## Layout

Conteneur large de 1180px, contenu à 780px, marges latérales d'au moins 16px. Sections espacées de clamp(4rem, 10vw, 8rem). Plus d'espace au-dessus d'un titre qu'en dessous (1.6em au-dessus, 0.7em en dessous).

L'accueil alterne : héros en deux colonnes (texte, petit portrait de 220px), bandeau pleine largeur des technologies, offre en lignes (titre à gauche, liste à droite), stack en lignes de fiche technique (logo, nom, usage), réalisations en grille de 12 colonnes où l'image change de côté et de position d'un projet à l'autre. Sous 900px tout passe sur une colonne, le portrait tombe à 150px et les images de réalisations gardent un léger décalage (12 %).

## Elevation & Depth

Système entièrement plat. La profondeur vient du décalage des images sur la grille et de l'estompage des éléments inactifs, jamais d'une ombre.

### Named Rules
**La règle du plat.** Aucune ombre, nulle part.

## Shapes

Coins doux et discrets : 8px pour les images, 10px pour les champs, 16px pour le panneau du formulaire, 28px pour le bandeau d'appel. Boutons et étiquettes en pilule. Les regroupements sont faits par des filets de 1px, jamais par des boîtes.

## Components

### Buttons
- **Shape:** pilule (999px), 48px de haut minimum.
- **Primary:** encre pleine (blanc sur noir en sombre, noir sur blanc en clair), texte en contraste, sans glyphe ni icône.
- **Hover / Focus:** passage à l'encre atténuée, sans déplacement ; contour de focus 2px à 4px de distance.
- **Outline:** contour 2px de la couleur du texte, fond transparent, rempli au survol.

### Chips
- **Style:** étiquettes de projet en pilule, filet 1px, texte estompé ; contour et texte à pleine encre au survol.

### Cards / Containers
- **Corner Style:** aucun conteneur pour les éléments de liste : un filet supérieur de 1px.
- **Background:** transparent.
- **Shadow Strategy:** aucune (voir Elevation).
- **Internal Padding:** 1.4rem au-dessus du contenu.

### Inputs / Fields
- **Style:** fond de page, filet 1px, rayon 10px, 48px de haut.
- **Focus:** bordure à pleine encre et halo de 3px à 25 %.

### Navigation
- Nunito 700, page courante à pleine encre et soulignée de 2px, les autres à 60 % jusqu'au survol. Menu plein écran sous 900px, entrées à clamp(1.8rem, 8vw, 2.6rem).

### Liste de réalisations (signature)
Image en niveaux de gris décalée sur la grille, texte de l'autre côté. Au survol, l'image reprend ses couleurs et se recadre, les autres projets s'estompent. Au défilement, l'image se révèle par un masque et dérive légèrement dans son cadre. Sur écran tactile, la couleur revient quand le projet traverse le milieu de l'écran.

### Stack
Une ligne par outil : logo de 28px en niveaux de gris (en couleur au survol), nom, usage. Les autres lignes s'estompent au survol.

### Bandeau des technologies
Liste « PHP · Laravel · … » statique sur toute la largeur, un mot sur deux en contour gris.

## Do's and Don'ts

### Do:
- **Do** garder l'interface en noir, blanc et gris ; laisser la couleur aux images.
- **Do** montrer les images de projets en niveaux de gris et leur rendre la couleur au survol ou au passage au centre de l'écran.
- **Do** montrer le portrait d'Erwan en couleurs naturelles.
- **Do** estomper les éléments non sélectionnés d'un groupe (navigation 60 %, projets 35 %).
- **Do** couper toute animation sous `prefers-reduced-motion: reduce`.

### Don't:
- **Don't** ajouter une couleur d'accent à l'interface.
- **Don't** placer de sur-titre en petites capitales au-dessus d'un titre.
- **Don't** enfermer des éléments de même niveau dans des cartes identiques à bordure et fond.
- **Don't** utiliser d'illustrations génériques (type unDraw), de dégradés, de verre dépoli ni de néon.
- **Don't** reproduire l'interface d'une console (barre d'état, menu d'icônes, raccourcis de manette) : seule l'esthétique est retenue.
- **Don't** faire suivre le pointeur à quoi que ce soit (parallaxe, bouton aimanté, pastille de curseur) ni animer en boucle infinie.
- **Don't** utiliser de glyphes (→, ←, ✓) comme icônes, ni de fond crème ou teinté.
- **Don't** présenter des outils ou services en grille de cartes « icône + titre + texte » identiques.
