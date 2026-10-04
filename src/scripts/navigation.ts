// Mobile overlay of the `wan/menu` block: open/close the menu dialog.
document.querySelectorAll<HTMLElement>('[data-nav]').forEach((nav) => {
  const container = nav.querySelector<HTMLElement>('[data-nav-container]');
  const openBtn = nav.querySelector<HTMLButtonElement>('[data-nav-open]');
  const closeBtn = nav.querySelector<HTMLButtonElement>('[data-nav-close]');
  if (!container) return;

  function setOpen(open: boolean) {
    container!.classList.toggle('has-modal-open', open);
    container!.classList.toggle('is-menu-open', open);
    document.documentElement.classList.toggle('has-modal-open', open);
    const dialog = container!.querySelector('.wp-block-navigation__responsive-dialog');
    if (open) {
      dialog?.setAttribute('role', 'dialog');
      dialog?.setAttribute('aria-modal', 'true');
      closeBtn?.focus();
    } else {
      dialog?.removeAttribute('role');
      dialog?.removeAttribute('aria-modal');
      openBtn?.focus();
    }
  }

  openBtn?.addEventListener('click', () => setOpen(true));
  closeBtn?.addEventListener('click', () => setOpen(false));
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
