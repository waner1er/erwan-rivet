import { useState } from 'react';
import { Button, ColorIndicator, ColorPicker, Dropdown, PanelBody, SelectControl, __experimentalUnitControl as UnitControl } from '@wordpress/components';

import '@wordpress/components/build-style/style.css';

interface ColorEntry {
  slug: string;
  name: string;
  color: string;
}

interface SizeEntry {
  slug: string;
  name?: string;
  size: string;
}

interface FontEntry {
  slug: string;
  name: string;
  fontFamily: string;
}

interface FontRole {
  slug: string;
  label: string;
  fontFamilySlug: string;
}

interface Props {
  colors: ColorEntry[];
  fontSizes: SizeEntry[];
  spacing: SizeEntry[];
  /** The site's installed font library — fixed, not editable here (see § Polices in theme.json). */
  fontFamilies: FontEntry[];
  /** Which installed font each role (body text, headings…) currently uses. */
  fontRoles: FontRole[];
}

export default function ThemeEditor({ colors: initialColors, fontSizes: initialFontSizes, spacing: initialSpacing, fontFamilies, fontRoles: initialFontRoles }: Props) {
  const [colors, setColors] = useState(initialColors);
  const [fontSizes, setFontSizes] = useState(initialFontSizes);
  const [spacing, setSpacing] = useState(initialSpacing);
  const [fontRoles, setFontRoles] = useState(initialFontRoles);

  function updateColor(slug: string, color: string) {
    setColors((prev) => prev.map((c) => (c.slug === slug ? { ...c, color } : c)));
  }
  function updateFontSize(slug: string, size: string | number | undefined) {
    if (size === undefined) return;
    setFontSizes((prev) => prev.map((f) => (f.slug === slug ? { ...f, size: String(size) } : f)));
  }
  function updateSpacing(slug: string, size: string | undefined) {
    if (size === undefined) return;
    setSpacing((prev) => prev.map((s) => (s.slug === slug ? { ...s, size } : s)));
  }
  function updateFontRole(slug: string, fontFamilySlug: string) {
    setFontRoles((prev) => prev.map((r) => (r.slug === slug ? { ...r, fontFamilySlug } : r)));
  }

  return (
    <form method="post" className="theme-editor">
      <input type="hidden" name="colors" value={JSON.stringify(colors)} />
      <input type="hidden" name="fontSizes" value={JSON.stringify(fontSizes)} />
      <input type="hidden" name="spacing" value={JSON.stringify(spacing)} />
      <input type="hidden" name="fontRoles" value={JSON.stringify(fontRoles)} />

      <PanelBody title="Couleurs" initialOpen>
        {colors.map((c) => (
          <div className="theme-editor__row" key={c.slug}>
            <span className="theme-editor__row-label">{c.name}</span>
            <Dropdown
              popoverProps={{ placement: 'left-start' }}
              renderToggle={({ isOpen, onToggle }) => (
                <Button onClick={onToggle} aria-expanded={isOpen} className="theme-editor__swatch">
                  <ColorIndicator colorValue={c.color} />
                  <code>{c.color}</code>
                </Button>
              )}
              renderContent={() => (
                <ColorPicker color={c.color} onChange={(value) => updateColor(c.slug, value)} enableAlpha={false} />
              )}
            />
          </div>
        ))}
      </PanelBody>

      <PanelBody title="Tailles de police" initialOpen={false}>
        {fontSizes.map((f) => (
          <div className="theme-editor__row" key={f.slug}>
            <span className="theme-editor__row-label">{f.name}</span>
            <UnitControl value={f.size} onChange={(v) => updateFontSize(f.slug, v)} units={[{ value: 'px', label: 'px' }, { value: 'rem', label: 'rem' }, { value: 'em', label: 'em' }]} />
          </div>
        ))}
      </PanelBody>

      <PanelBody title="Espacements" initialOpen={false}>
        {spacing.map((s) => (
          <div className="theme-editor__row" key={s.slug}>
            <span className="theme-editor__row-label">Espacement {s.slug}</span>
            <UnitControl value={s.size} onChange={(v) => updateSpacing(s.slug, v)} units={[{ value: 'px', label: 'px' }, { value: 'rem', label: 'rem' }]} />
          </div>
        ))}
      </PanelBody>

      <PanelBody title="Polices" initialOpen={false}>
        <p className="theme-editor__hint">Choisissez, pour chaque usage, l’une des polices installées sur le site.</p>
        {fontRoles.map((role) => (
          <SelectControl
            key={role.slug}
            label={role.label}
            value={role.fontFamilySlug}
            onChange={(v) => updateFontRole(role.slug, v)}
            options={fontFamilies.map((f) => ({ value: f.slug, label: f.name }))}
          />
        ))}
      </PanelBody>

      <div className="theme-editor__actions">
        <Button variant="primary" type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}
