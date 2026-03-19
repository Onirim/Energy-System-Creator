// ══════════════════════════════════════════════════════════════
// ENERGY SYSTEM — Module Documents
// Dépendances : sb, currentUser, showToast, esc,
//               compressImage, deleteStorageFile  (scripts.js)
//               marked  (CDN)
// ══════════════════════════════════════════════════════════════

// ── État ──────────────────────────────────────────────────────
let documents         = {};  // { id: { ...doc } }
let followedDocuments = {};  // { id: { ...doc, _owner_name } }
let followedDocIds    = [];
let editingDocId      = null;
let docState          = null;

// ══════════════════════════════════════════════════════════════
// CHARGEMENT
// ══════════════════════════════════════════════════════════════

async function loadDocumentsFromDB() {
  const { data, error } = await sb
    .from('documents')
    .select('id, title, content, is_public, share_code, illustration_url, illustration_position, updated_at')
    .eq('user_id', currentUser.id)
    .order('updated_at', { ascending: false });
  if (error) { console.error('Erreur chargement documents:', error); return; }
  documents = {};
  (data || []).forEach(r => { documents[r.id] = { ...r }; });
  await loadFollowedDocumentsFromDB();
}

async function loadFollowedDocumentsFromDB() {
  const { data: followed } = await sb
    .from('followed_documents')
    .select('document_id')
    .eq('user_id', currentUser.id);
  followedDocIds = (followed || []).map(r => r.document_id);
  if (!followedDocIds.length) { followedDocuments = {}; return; }

  const { data } = await sb
    .from('documents')
    .select('id, title, content, is_public, share_code, illustration_url, illustration_position, updated_at, user_id')
    .in('id', followedDocIds)
    .eq('is_public', true);

  const ownerIds = [...new Set((data || []).map(r => r.user_id))];
  let ownerMap = {};
  if (ownerIds.length) {
    const { data: profiles } = await sb.from('profiles').select('id, username').in('id', ownerIds);
    (profiles || []).forEach(p => { ownerMap[p.id] = p.username; });
  }

  followedDocuments = {};
  (data || []).forEach(r => {
    followedDocuments[r.id] = { ...r, _followed: true, _owner_name: ownerMap[r.user_id] || '?' };
  });
}

// ══════════════════════════════════════════════════════════════
// CRUD
// ══════════════════════════════════════════════════════════════

async function saveDocumentToDB() {
  if (!docState.title.trim()) { alert('Donnez un titre au document.'); return; }
  const payload = {
    user_id:               currentUser.id,
    title:                 docState.title.trim(),
    content:               docState.content,
    is_public:             docState.is_public || false,
    illustration_url:      docState.illustration_url || '',
    illustration_position: docState.illustration_position || 0,
  };
  const isUUID = editingDocId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingDocId);

  let result;
  if (isUUID) {
    result = await sb.from('documents').update(payload)
      .eq('id', editingDocId).select('id, share_code').single();
  } else {
    editingDocId = null;
    result = await sb.from('documents').insert(payload).select('id, share_code').single();
  }
  if (result.error) { showToast('Erreur lors de la sauvegarde.'); return; }

  editingDocId = result.data.id;
  docState.share_code = result.data.share_code;
  documents[editingDocId] = { ...docState, id: editingDocId };
  updateDocShareCodeBox();
  showToast('Document sauvegardé !');
}

async function deleteDocumentFromDB(id) {
  const title = documents[id]?.title || 'ce document';
  if (!confirm(`Supprimer "${title}" ?`)) return;
  const illustrationUrl = documents[id]?.illustration_url || '';
  const { error } = await sb.from('documents').delete().eq('id', id);
  if (error) { showToast('Erreur lors de la suppression.'); return; }
  delete documents[id];
  if (illustrationUrl) await deleteStorageFile(illustrationUrl);
  renderDocumentsList();
  showView('documents');
}

// ══════════════════════════════════════════════════════════════
// ABONNEMENT
// ══════════════════════════════════════════════════════════════

async function followDocByCode(code) {
  if (!code.trim()) return;
  const clean = code.trim().toUpperCase();
  const { data, error } = await sb
    .from('documents')
    .select('id, title, user_id, is_public')
    .eq('share_code', clean).eq('is_public', true).single();
  if (error || !data) { showToast('Code introuvable ou document non public.'); return; }
  if (data.user_id === currentUser.id) { showToast('C\'est votre propre document !'); return; }
  if (followedDocIds.includes(data.id)) { showToast('Vous suivez déjà ce document.'); return; }
  const { error: err } = await sb.from('followed_documents')
    .insert({ user_id: currentUser.id, document_id: data.id });
  if (err) { showToast('Erreur lors de l\'abonnement.'); return; }
  followedDocIds.push(data.id);
  await loadFollowedDocumentsFromDB();
  document.getElementById('doc-follow-input').value = '';
  renderDocumentsList();
  showToast(`Abonné à "${data.title}" !`);
}

async function unfollowDocument(id) {
  await sb.from('followed_documents').delete().eq('user_id', currentUser.id).eq('document_id', id);
  followedDocIds = followedDocIds.filter(i => i !== id);
  delete followedDocuments[id];
  renderDocumentsList();
  showToast('Abonnement supprimé.');
}

// ══════════════════════════════════════════════════════════════
// RENDU — LISTE
// ══════════════════════════════════════════════════════════════

function renderDocumentsList() {
  const grid  = document.getElementById('doc-grid');
  const empty = document.getElementById('doc-empty-state');
  const ownKeys      = Object.keys(documents);
  const followedKeys = Object.keys(followedDocuments);
  const total = ownKeys.length + followedKeys.length;
  document.getElementById('doc-count-badge').textContent = total ? `(${total})` : '';
  if (!total) { grid.innerHTML = ''; empty.style.display = 'flex'; return; }
  empty.style.display = 'none';
  grid.innerHTML = [
    ...ownKeys.map(id    => docCardHTML(id, documents[id], false)),
    ...followedKeys.map(id => docCardHTML(id, followedDocuments[id], true)),
  ].join('');
}

function docCardHTML(id, d, isFollowed) {
  const preview = (d.content || '')
    .replace(/#+\s*/g, '').replace(/\*+/g, '').replace(/!?\[.*?\]\(.*?\)/g, '')
    .split('\n').find(l => l.trim()) || '';
  const previewTxt = preview.length > 180 ? preview.slice(0, 180) + '…' : preview;
  const date = d.updated_at
    ? new Date(d.updated_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })
    : '';

  if (isFollowed) {
    return `<div class="doc-card" onclick="openDocReader('${id}')">
      ${d.illustration_url ? `<img class="card-illus" src="${esc(d.illustration_url)}" style="object-position:center ${d.illustration_position||0}%" onclick="event.stopPropagation();openLightbox('${esc(d.illustration_url)}')" alt="">` : ''}
      <div class="doc-card-actions">
        <button class="icon-btn danger" onclick="event.stopPropagation();unfollowDocument('${id}')" title="Se désabonner">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3,4 13,4"/><path d="M5 4V2h6v2M6 7v5M10 7v5"/><path d="M4 4l1 10h6l1-10"/></svg>
        </button>
      </div>
      <div class="doc-card-title">${esc(d.title) || 'Sans titre'}</div>
      ${previewTxt ? `<div class="doc-card-preview">${esc(previewTxt)}</div>` : ''}
      <div class="doc-card-footer">
        <span class="followed-badge">👁 Suivi</span>
        <span class="doc-card-owner">par ${esc(d._owner_name)}</span>
        <span class="doc-card-date">${date}</span>
      </div>
    </div>`;
  }

  const visTag = d.is_public
    ? `<span class="card-visibility public">🔗 Public</span>`
    : `<span class="card-visibility private">🔒 Privé</span>`;

  return `<div class="doc-card" onclick="openDocEditor('${id}')">
    ${d.illustration_url ? `<img class="card-illus" src="${esc(d.illustration_url)}" style="object-position:center ${d.illustration_position||0}%" onclick="event.stopPropagation();openLightbox('${esc(d.illustration_url)}')" alt="">` : ''}
    <div class="doc-card-actions">
      <button class="icon-btn" onclick="event.stopPropagation();openDocEditor('${id}')" title="Modifier">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 2l3 3-9 9H2v-3z"/></svg>
      </button>
      <button class="icon-btn danger" onclick="event.stopPropagation();deleteDocumentFromDB('${id}')" title="Supprimer">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3,4 13,4"/><path d="M5 4V2h6v2M6 7v5M10 7v5"/><path d="M4 4l1 10h6l1-10"/></svg>
      </button>
    </div>
    <div class="doc-card-title">${esc(d.title) || 'Sans titre'}</div>
    ${previewTxt ? `<div class="doc-card-preview">${esc(previewTxt)}</div>` : ''}
    <div class="doc-card-footer">
      ${visTag}
      <span class="doc-card-date">${date}</span>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// FORMULAIRE ÉDITEUR
// ══════════════════════════════════════════════════════════════

function newDocument() {
  editingDocId = null;
  docState = { title:'', content:'', is_public:false, share_code:null,
               illustration_url:'', illustration_position:0 };
  showView('doc-editor');
  populateDocEditor();
}

function openDocEditor(id) {
  editingDocId = id;
  docState = { ...documents[id] };
  showView('doc-editor');
  populateDocEditor();
}

function populateDocEditor() {
  document.getElementById('doc-f-title').value   = docState.title || '';
  document.getElementById('doc-f-content').value = docState.content || '';
  const pub = document.getElementById('doc-f-public');
  pub.checked = docState.is_public || false;
  document.getElementById('doc-public-label').textContent =
    pub.checked ? 'Public (abonnement actif)' : 'Privé';
  setDocIllusPreview(docState.illustration_url || '', docState.illustration_position || 0);
  updateDocPreview();
  updateDocShareCodeBox();
}

function updateDocForm() {
  docState.title     = document.getElementById('doc-f-title').value;
  docState.content   = document.getElementById('doc-f-content').value;
  docState.is_public = document.getElementById('doc-f-public').checked;
  document.getElementById('doc-public-label').textContent =
    docState.is_public ? 'Public (abonnement actif)' : 'Privé';
  updateDocShareCodeBox();
  updateDocPreview();
}

function updateDocPreview() {
  docState.title   = document.getElementById('doc-f-title').value;
  docState.content = document.getElementById('doc-f-content').value;
  const preview = document.getElementById('doc-preview-content');
  const titleHtml = docState.title
    ? `<h1 class="doc-reader-title">${esc(docState.title)}</h1>` : '';
  const bodyHtml = docState.content
    ? marked.parse(docState.content)
    : '<p class="doc-empty-preview">Commencez à écrire…</p>';
  preview.innerHTML = titleHtml + `<div class="doc-reader-body">${bodyHtml}</div>`;
}

function updateDocShareCodeBox() {
  const box = document.getElementById('doc-share-code-box');
  const val = document.getElementById('doc-share-code-val');
  if (!box || !val) return;
  const code = docState?.share_code ||
    (editingDocId && documents[editingDocId]?.share_code) || null;
  if (docState?.is_public && code) { val.textContent = code; box.style.display = 'flex'; }
  else box.style.display = 'none';
}

function copyDocShareCode() {
  const code = document.getElementById('doc-share-code-val')?.textContent;
  if (!code || code === '—') return;
  navigator.clipboard.writeText(code)
    .then(() => showToast(`Code "${code}" copié !`))
    .catch(() => prompt('Code de partage :', code));
}

function shareDocBtn() {
  if (!docState?.is_public) { showToast('Activez le partage public, puis sauvegardez d\'abord.'); return; }
  const code = docState?.share_code || (editingDocId && documents[editingDocId]?.share_code);
  if (!code) { showToast('Sauvegardez d\'abord pour générer le code.'); return; }
  navigator.clipboard.writeText(code)
    .then(() => showToast(`Code "${code}" copié !`))
    .catch(() => prompt('Code de partage :', code));
}

function switchDocTab(tab) {
  const form    = document.getElementById('doc-editor-form');
  const preview = document.getElementById('doc-preview-panel');
  const btnF    = document.getElementById('doc-mob-tab-form');
  const btnP    = document.getElementById('doc-mob-tab-preview');
  if (tab === 'form') {
    form.classList.remove('mob-hidden'); preview.classList.add('mob-hidden');
    btnF?.classList.add('active');       btnP?.classList.remove('active');
  } else {
    form.classList.add('mob-hidden');    preview.classList.remove('mob-hidden');
    btnF?.classList.remove('active');    btnP?.classList.add('active');
  }
}

// ══════════════════════════════════════════════════════════════
// LECTEUR
// ══════════════════════════════════════════════════════════════

function openDocReader(id) {
  const d = followedDocuments[id] || documents[id];
  if (!d) return;
  const metaHtml = d._owner_name
    ? `<div class="doc-reader-meta">par ${esc(d._owner_name)}</div>` : '';
  const illusHtml = d.illustration_url
    ? `<img class="doc-reader-illus" src="${esc(d.illustration_url)}"
        style="object-position:center ${d.illustration_position||0}%"
        onclick="openLightbox('${esc(d.illustration_url)}')" alt="">` : '';
  document.getElementById('doc-reader-content').innerHTML = `
    <div class="shared-banner">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="3" r="1.5"/><circle cx="4" cy="8" r="1.5"/><circle cx="12" cy="13" r="1.5"/>
        <line x1="5.5" y1="7" x2="10.5" y2="4.3"/><line x1="5.5" y1="9" x2="10.5" y2="11.7"/>
      </svg>
      Document partagé — lecture seule
    </div>
    ${illusHtml}
    <h1 class="doc-reader-title">${esc(d.title)}</h1>
    ${metaHtml}
    <div class="doc-reader-body">${d.content ? marked.parse(d.content) : ''}</div>`;
  showView('doc-reader');
}

// ══════════════════════════════════════════════════════════════
// ILLUSTRATION
// ══════════════════════════════════════════════════════════════

function docIllusZoneClick() {
  if (!docState.illustration_url) document.getElementById('doc-illus-input').click();
}

function setDocIllusPreview(url, position) {
  const img         = document.getElementById('doc-illus-preview-img');
  const placeholder = document.getElementById('doc-illus-placeholder');
  const zone        = document.getElementById('doc-illus-zone');
  const sliderWrap  = document.getElementById('doc-illus-slider-wrap');
  const slider      = document.getElementById('doc-illus-pos-slider');
  const pos = position !== undefined ? position : (docState?.illustration_position || 0);
  if (url) {
    img.src = url; img.style.display = 'block';
    img.style.objectPosition = `center ${pos}%`;
    placeholder.style.display = 'none';
    zone.classList.add('has-image');
    sliderWrap.classList.add('visible'); slider.value = pos;
  } else {
    img.src = ''; img.style.display = 'none';
    placeholder.style.display = 'flex';
    zone.classList.remove('has-image');
    sliderWrap.classList.remove('visible'); slider.value = 0;
  }
}

function updateDocIllusPosition(val) {
  docState.illustration_position = parseInt(val);
  const img = document.getElementById('doc-illus-preview-img');
  if (img) img.style.objectPosition = `center ${val}%`;
}

async function uploadDocIllustration(input) {
  const file = input.files[0];
  if (!file) return;
  if (!currentUser) { showToast('Erreur : utilisateur non connecté.'); return; }
  if (file.size > 3 * 1024 * 1024) { showToast('Image trop lourde (max 3 Mo).'); return; }
  document.getElementById('doc-illus-uploading').classList.add('active');
  const oldUrl = docState.illustration_url || '';
  const fileId = editingDocId || ('tmp_' + Date.now());
  const path   = `${currentUser.id}/doc_${fileId}.jpg`;
  const blob   = await compressImage(file);
  const { error } = await sb.storage
    .from('character-illustrations').upload(path, blob, { upsert:true, contentType:'image/jpeg' });
  document.getElementById('doc-illus-uploading').classList.remove('active');
  if (error) { showToast('Erreur upload : ' + error.message); return; }
  if (oldUrl && !oldUrl.includes(path)) await deleteStorageFile(oldUrl);
  const { data } = sb.storage.from('character-illustrations').getPublicUrl(path);
  docState.illustration_url      = data.publicUrl;
  docState.illustration_position = 0;
  setDocIllusPreview(docState.illustration_url, 0);
  showToast('Illustration ajoutée !');
  input.value = '';
}

async function removeDocIllustration() {
  if (!docState.illustration_url) return;
  await deleteStorageFile(docState.illustration_url);
  docState.illustration_url      = '';
  docState.illustration_position = 0;
  setDocIllusPreview('', 0);
}
