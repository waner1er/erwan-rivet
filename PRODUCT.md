# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences carry equal weight:

- **Freelance clients**: TPE, associations and agencies that already run a WordPress site or a Laravel/Symfony application and need someone to maintain, secure, upgrade or take it over. They are usually not technical and are judging whether they can trust this person with a site they depend on.
- **Recruiters and hiring teams** (CDI): they read the site as a CV and technical showcase, looking for proof of real production work and how problems were solved.

Secondary audience: youth, education and association structures interested in digital-literacy workshops (social networks, cyberbullying, personal data).

## Product Purpose

Personal site of Erwan RIVET, freelance PHP developer. It presents the maintenance offer, the projects delivered (client work and personal projects), the career path and a contact form. Success means a freelance prospect gets in touch, or a recruiter is convinced enough to reach out.

## Positioning

The technician who takes over aging PHP sites and applications (WordPress, Laravel, Symfony) without rewriting everything, **and** who can explain every choice to non-technical people, because he spent nearly twenty years in youth work (animateur, project coordinator, head of a web unit) before coding.

## Operating Context

- Content is written in French and edited through the site's own Gutenberg-based admin (`/admin`), then exported as static HTML to GitHub Pages.
- Project write-ups ("réalisations" and "projets personnels") detail context, problems and technical choices.
- Contact goes through a Web3Forms form; there is no server at runtime on the public site.

## Capabilities and Constraints

- Astro site, statically exported; the public site must stay fast (PageSpeed matters), with no runtime-computed styles.
- Theme decoupled from content: tokens in `src/theme/theme.json`, components in `public/css/site.css`, layout utilities in `public/css/wan-layout.css`. Content lives as Gutenberg blocks in `content/*.json` and must keep rendering after a theme swap.
- Light and dark modes are both supported.
- Pages: Accueil, Mon parcours, Développement web, Réalisations, Projets personnels, Contact, Politique de confidentialité, plus search and single project pages.

## Brand Commitments

- Name shown as "Erwan RIVET".
- Voice: first person, plain French, concrete, no jargon without explanation.
- Lead with Erwan himself (portrait + positioning), framed as a broad web developer ("Développeur web" under his name); maintenance/legacy and pedagogy are the proof underneath, not the headline.
- Keep the existing portrait photo (shown small, in natural colours, alone: no project screenshot over or under it), the existing page copy, and automatic light/dark modes. The light mode is pure white, never cream.
- No effect that follows the pointer (portrait parallax, magnetic buttons, cursor bubble): Erwan finds them odd.
- Must not read as corporate/cold, as "startup tech" (dark neon, gradients, glass, jargon), or as a youth-workshop/school aesthetic that hides the developer.
- Showcase Momentum Conseil first among client work; Woodbrass.com is not representative of the current activity and comes last.
- Visual direction pinned by Erwan (2026-10-27): the aesthetic of the Figma Community file "minimal theme for retroconsoles" (Garlic OS / Onion OS), as a look only, never as a console-interface metaphor. Near-black ground (#141414), white text, inactive items dimmed, light console grey (#bdbdbd), pure black and white with no accent colour, Nunito 700/800. Dark by default, with an automatic light variant. Classic site layout. The earlier teal/ochre exploration is abandoned.
- Wanted on top of it: modern motion with restraint (offset project images, colour coming back on hover, subtle scroll reveals), never overloaded.

## Evidence on Hand

- Real portrait photo of Erwan (home hero).
- Client work with screenshots or logos: Momentum Conseil, La Grande Rouge, Absys, So.bio, Woodbrass.com, Anne Thierrée, GalerieReading, NQT, and this portfolio (`content/uploads/`).
- The generic unDraw illustrations were removed from the pages; no illustration replaces them for now.
- About fifteen personal projects (Bare PHP Stack, CPT Craft, Punk Booking, Wancommerce, CV Generator, Behind the Mask games, etc.), several with generated SVG covers.
- No client testimonials, quotes, ratings, pricing or certifications exist: none may be invented.

## Product Principles

1. Trust before showmanship: a prospect must feel their site is in careful hands.
2. Show the work: real projects and real problems solved are the proof, not claims.
3. Explain simply: every section should read clearly to a non-developer, without talking down to a recruiter.
4. Fast and accessible by default: the site is itself a demonstration of the craft.
