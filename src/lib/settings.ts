import { all, run } from './db.ts';

export interface MenuItem {
  label: string;
  url: string;
}

export interface SocialLink {
  service: 'linkedin' | 'github' | 'mail' | 'wordpress';
  url: string;
  label: string;
}

export interface SiteSettings {
  siteTitle: string;
  tagline: string;
  logo: string;
  menu: MenuItem[];
  headerSocials: SocialLink[];
  footerSocials: SocialLink[];
  contactEmail: string;
  /** External form service used on static hosting, e.g. https://api.web3forms.com/submit. Empty = built-in /api/contact. */
  contactFormEndpoint: string;
  /** Access key sent as `access_key` (Web3Forms). */
  contactFormAccessKey: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: 'Erwan RIVET',
  tagline: 'Développeur web',
  logo: '/uploads/2025/11/o5pj34njugay8omksrgy.jpeg',
  menu: [
    { label: 'Mon Parcours', url: '/mon-parcours/' },
    { label: 'Développement web', url: '/developpement-web/' },
    { label: 'Réalisations', url: '/realisations/' },
    { label: 'Travaux-en-entreprise', url: '/travaux-en-entreprise/' },
    { label: 'Projets personnels', url: '/projets-personnels/' },
    { label: 'Contact', url: '/contact/' },
    { label: 'Blog', url: '/blog/' },
  ],
  headerSocials: [
    { service: 'linkedin', url: 'https://www.linkedin.com/in/erwan-rivet/', label: 'LinkedIn' },
    { service: 'github', url: 'https://github.com/waner1er', label: 'GitHub' },
    { service: 'mail', url: 'mailto:riveterwan8@gmail.com', label: 'E-mail' },
  ],
  footerSocials: [
    { service: 'linkedin', url: 'https://www.linkedin.com/in/erwan-rivet/', label: 'LinkedIn' },
    { service: 'github', url: 'https://github.com/waner1er', label: 'GitHub' },
    { service: 'wordpress', url: 'https://profiles.wordpress.org/waner1er/', label: 'WordPress' },
  ],
  contactEmail: 'riveterwan8@gmail.com',
  contactFormEndpoint: '',
  contactFormAccessKey: '',
};

export function getSettings(): SiteSettings {
  const rows = all<{ key: string; value: string }>('SELECT key, value FROM settings');
  const stored = Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)]));
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(values: Partial<SiteSettings>) {
  for (const [key, value] of Object.entries(values)) {
    run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, JSON.stringify(value)]);
  }
}
