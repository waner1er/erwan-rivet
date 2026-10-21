// Mobile overlay of the `wan/menu` block: open/close the menu dialog.
document.querySelectorAll<HTMLElement>('[data-nav]').forEach((nav) => {
  const container = nav.querySelector<HTMLElement>('[data-nav-container]');
  const openBtn = nav.querySelector<HTMLButtonElement>('[data-nav-open]');
  const closeBtn = nav.querySelector<HTMLButtonElement>('[data-nav-close]');
  if (!container) return;

  function setOpen(open: boolean, moveFocus = true) {
    container!.classList.toggle('has-modal-open', open);
    container!.classList.toggle('is-menu-open', open);
    document.documentElement.classList.toggle('has-modal-open', open);
    openBtn?.setAttribute('aria-expanded', String(open));
    const dialog = container!.querySelector('.wp-block-navigation__responsive-dialog');
    if (open) {
      dialog?.setAttribute('role', 'dialog');
      dialog?.setAttribute('aria-modal', 'true');
      if (moveFocus) closeBtn?.focus();
    } else {
      dialog?.removeAttribute('role');
      dialog?.removeAttribute('aria-modal');
      if (moveFocus) openBtn?.focus();
    }
  }

  openBtn?.addEventListener('click', () => setOpen(true));
  container.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  closeBtn?.addEventListener('click', () => setOpen(false));
  // The burger is shown up to 900px (site.css): widening past it while the menu is open brings
  // back the classic menu, so the full-screen one closes and the page scrolls again.
  const desktop = window.matchMedia('(min-width: 901px)');
  desktop.addEventListener('change', (e) => {
    if (e.matches && container.classList.contains('is-menu-open')) setOpen(false, false);
  });
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && container.classList.contains('is-menu-open')) setOpen(false);
  });
});

// Submenus open on hover (CSS) and on click of their arrow, for touch screens and keyboards.
document.querySelectorAll<HTMLButtonElement>('[data-submenu-toggle]').forEach((toggle) => {
  const close = () => toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', () => toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true')));
  toggle.parentElement?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      close();
      toggle.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!toggle.parentElement?.contains(e.target as Node)) close();
  });
});
