var e=null,t=null;async function n(e){let t=new FormData;for(let n of Array.from(e))t.append(`file`,n);let n=await fetch(`/api/admin/media`,{method:`POST`,body:t}),r=await n.json();if(!n.ok)throw Error(r.error??`Envoi impossible`);return r}function r(){let e=document.createElement(`dialog`);return e.className=`media-dialog`,e.innerHTML=`
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
    </div>`,document.body.append(e),e.querySelector(`[data-close]`).addEventListener(`click`,()=>e.close()),e.querySelector(`[data-filter]`).addEventListener(`input`,t=>{let n=t.target.value.toLowerCase();e.querySelectorAll(`.media-item`).forEach(e=>{e.hidden=!e.dataset.name.includes(n)})}),e.querySelector(`[data-upload]`).addEventListener(`change`,async t=>{let r=t.target;if(!r.files?.length)return;let o=e.querySelector(`[data-status]`);o.hidden=!1,o.textContent=`Envoi en cours…`;try{let e=await n(r.files);await a(),e.length===1&&i(e[0])}catch(e){o.textContent=e.message}r.value=``}),e}function i(n){t?.(n),e?.close()}async function a(){let t=e.querySelector(`[data-grid]`),n=e.querySelector(`[data-status]`),r=await(await fetch(`/api/admin/media`)).json();n.hidden=r.length>0,n.textContent=`Aucun média pour le moment.`,t.replaceChildren(...r.map(e=>{let t=document.createElement(`div`);t.className=`media-item`,t.dataset.name=e.filename.toLowerCase();let n=document.createElement(`button`);if(n.type=`button`,n.className=`pick`,n.title=`Choisir ${e.filename}`,e.mime.startsWith(`image/`)){let t=document.createElement(`img`);t.src=e.path,t.alt=``,t.loading=`lazy`,n.append(t)}else n.textContent=`📄`;let r=document.createElement(`div`);return r.className=`media-item__meta`,r.textContent=e.filename,n.append(r),n.addEventListener(`click`,()=>i(e)),t.append(n),t}))}function o(n){e??=r(),t=n,e.showModal(),a()}export{n,o as t};