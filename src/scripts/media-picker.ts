// Media library dialog shared by the content editor and the cover image fields.
export interface MediaItem {
  id: number;
  path: string;
  filename: string;
  mime: string;
  size: number;
}

let dialog: HTMLDialogElement | null = null;
let onPick: ((item: MediaItem) => void) | null = null;

export async function uploadFiles(files: FileList | File[]): Promise<MediaItem[]> {
  const body = new FormData();
  for (const file of Array.from(files)) body.append('file', file);
  const res = await fetch('/api/admin/media', { method: 'POST', body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Envoi impossible');
  return data;
}

function build(): HTMLDialogElement {
  const el = document.createElement('dialog');
  el.className = 'media-dialog';
  el.innerHTML = `
    <div class="media-dialog__head">
      <strong>Médiathèque</strong>
      <div class="btn-row">
        <label class="btn btn--sm">Envoyer un fichier<input type="file" multiple accept="image/*,.pdf" hidden data-upload></label>
        <input type="search" placeholder="Filtrer…" data-filter style="width:180px">
        <button type="button" class="btn btn--ghost btn--sm" data-close>Fermer</button>
      </div>
    </div>
    <div class="media-dialog__body">
      <p class="muted" data-status>Chargement…</p>
      <div class="media-grid" data-grid></div>
    </div>`;
  document.body.append(el);

  el.querySelector('[data-close]')!.addEventListener('click', () => el.close());
  el.querySelector<HTMLInputElement>('[data-filter]')!.addEventListener('input', (e) => {
    const q = (e.target as HTMLInputElement).value.toLowerCase();
    el.querySelectorAll<HTMLElement>('.media-item').forEach((item) => {
      item.hidden = !item.dataset.name!.includes(q);
    });
  });
  el.querySelector<HTMLInputElement>('[data-upload]')!.addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    const status = el.querySelector<HTMLElement>('[data-status]')!;
    status.hidden = false;
    status.textContent = 'Envoi en cours…';
    try {
      const saved = await uploadFiles(input.files);
      await refresh();
      if (saved.length === 1) pick(saved[0]);
    } catch (err) {
      status.textContent = (err as Error).message;
    }
    input.value = '';
  });
  return el;
}

function pick(item: MediaItem) {
  onPick?.(item);
  dialog?.close();
}

async function refresh() {
  const grid = dialog!.querySelector<HTMLElement>('[data-grid]')!;
  const status = dialog!.querySelector<HTMLElement>('[data-status]')!;
  const res = await fetch('/api/admin/media');
  const items: MediaItem[] = await res.json();
  status.hidden = items.length > 0;
  status.textContent = 'Aucun média pour le moment.';
  grid.replaceChildren(
    ...items.map((item) => {
      const card = document.createElement('div');
      card.className = 'media-item';
      card.dataset.name = item.filename.toLowerCase();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pick';
      btn.title = `Choisir ${item.filename}`;
      if (item.mime.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = item.path;
        img.alt = '';
        img.loading = 'lazy';
        btn.append(img);
      } else {
        btn.textContent = '📄';
      }
      const meta = document.createElement('div');
      meta.className = 'media-item__meta';
      meta.textContent = item.filename;
      btn.append(meta);
      btn.addEventListener('click', () => pick(item));
      card.append(btn);
      return card;
    }),
  );
}

export function openMediaPicker(callback: (item: MediaItem) => void) {
  dialog ??= build();
  onPick = callback;
  dialog.showModal();
  refresh();
}
