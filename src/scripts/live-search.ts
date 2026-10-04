// Live search of the `wan/search` block: results while typing, from /search-index.json.
import { search, type SearchEntry as Result } from './search.ts';

document.querySelectorAll<HTMLElement>('[data-live-search]').forEach((root) => {
  const toggle = root.querySelector<HTMLButtonElement>('[data-ls-toggle]')!;
  const input = root.querySelector<HTMLInputElement>('[data-ls-input]')!;
  const spinner = root.querySelector<HTMLElement>('[data-ls-spinner]')!;
  const panel = root.querySelector<HTMLElement>('[data-ls-panel]')!;
  const list = root.querySelector<HTMLUListElement>('[data-ls-results]')!;
  const empty = root.querySelector<HTMLElement>('[data-ls-empty]')!;
  let seq = 0;
  let timer: number | undefined;

  const setOpen = (open: boolean) => {
    root.classList.toggle('is-open', open);
    panel.hidden = !open;
    input.setAttribute('aria-expanded', String(open));
  };
  const setExpanded = (expanded: boolean) => {
    root.classList.toggle('is-expanded', expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    if (expanded) input.focus();
  };
  const setLoading = (loading: boolean) => {
    root.classList.toggle('is-loading', loading);
    spinner.hidden = !loading;
  };

  function render(results: Result[]) {
    list.replaceChildren(
      ...results.map((r) => {
        const li = document.createElement('li');
        li.className = 'erwan-live-search__result';
        li.setAttribute('role', 'option');
        const a = document.createElement('a');
        a.className = 'erwan-live-search__link';
        a.href = r.url;
        if (r.thumbnail) {
          const img = document.createElement('img');
          img.className = 'erwan-live-search__thumb';
          img.src = r.thumbnail;
          img.alt = '';
          img.loading = 'lazy';
          a.append(img);
        }
        const body = document.createElement('span');
        body.className = 'erwan-live-search__body';
        for (const [cls, text] of [
          ['title', r.title],
          ['type', r.typeLabel],
          ['excerpt', r.excerpt],
        ]) {
          const span = document.createElement('span');
          span.className = `erwan-live-search__${cls}`;
          span.textContent = text;
          body.append(span);
        }
        a.append(body);
        li.append(a);
        return li;
      }),
    );
    empty.hidden = results.length > 0;
    setOpen(true);
  }

  async function runSearch(query: string) {
    const current = ++seq;
    setLoading(true);
    try {
      const data = await search(root.dataset.indexUrl!, query);
      if (current === seq) render(data);
    } finally {
      if (current === seq) setLoading(false);
    }
  }

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    const query = input.value.trim();
    if (query.length < 2) {
      seq++;
      setLoading(false);
      setOpen(false);
      return;
    }
    timer = window.setTimeout(() => runSearch(query), 120);
  });
  input.addEventListener('focus', () => {
    if (list.children.length && input.value.trim().length >= 2) setOpen(true);
  });
  toggle.addEventListener('click', () => setExpanded(!root.classList.contains('is-expanded')));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setExpanded(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target as Node)) {
      setOpen(false);
      if (!input.value) setExpanded(false);
    }
  });
});
