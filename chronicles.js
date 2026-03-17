// ══════════════════════════════════════════════════════════════
// ENERGY SYSTEM — Module Chroniques
// Dépendances : sb, currentUser, showToast, esc  (définis dans scripts.js)
//               marked  (CDN chargé dans index.html)
// ══════════════════════════════════════════════════════════════

// ── État ──────────────────────────────────────────────────────
let chronicles      = {};   // { id: { ...data } }  — propres chroniques
let followedChronicles = {}; // { id: { ...data, _owner_name } }
let followedChrIds  = [];
let editingChrId    = null;
let chrState        = null;  // chronique en cours d'édition

// ══════════════════════════════════════════════════════════════
// CHARGEMENT
// ══════════════════════════════════════════════════════════════

async function loadChroniclesFromDB() {
  const { data, error } = await sb
    .from('chronicles')
    .select('id, title, content, is_public, share_code, updated_at')
    .eq('user_id', currentUser.id)
    .order('updated_at', { ascending: false });
  if (error) { console.error('Erreur chargement chroniques:', error); return; }
  chronicles = {};
  (data || []).forEach(row => { chronicles[row.id] = { ...row }; });

  await loadFollowedChroniclesFromDB();
}

async function loadFollowedChroniclesFromDB() {
  const { data: followed } = await sb
    .from('followed_chronicles')
    .select('chronicle_id')
    .eq('user_id', currentUser.id);
  followedChrIds = (followed || []).map(r => r.chronicle_id);
  if (!followedChrIds.length) { followedChronicles = {}; return; }

  const { data } = await sb
    .from('chronicles')
    .select('id, title, content, is_public, share_code, updated_at, profiles(username)')
    .in('id', followedChrIds)
    .eq('is_public', true);

  followedChronicles = {};
  (data || []).forEach(row => {
    followedChronicles[row.id] = {
      ...row,
      _followed: true,
      _owner_name: row.profiles?.username || '?',
    };
  });
}

// ══════════════════════════════════════════════════════════════
// SAUVEGARDE / SUPPRESSION
// ══════════════════════════════════════════════════════════════

async function saveChronicleToDB() {
  if (!chrState.title.trim()) { alert('Donnez un titre à la chronique.'); return; }

  const payload = {
    user_id:   currentUser.id,
    title:     chrState.title.trim(),
    content:   chrState.content,
    is_public: chrState.is_public || false,
  };

  const isValidUUID = editingChrId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingChrId);

  let result;
  if (isValidUUID) {
    result = await sb.from('chronicles').update(payload)
      .eq('id', editingChrId).select('id, share_code').single();
  } else {
    editingChrId = null;
    result = await sb.from('chronicles').insert(payload)
      .select('id, share_code').single();
  }

  if (result.error) {
    console.error('Erreur sauvegarde chronique:', result.error);
    showToast('Erreur lors de la sauvegarde.');
    return;
  }

  editingChrId = result.data.id;
  chrState.share_code = result.data.share_code;
  chronicles[editingChrId] = { ...chrState, id: editingChrId };

  // Affiche le share_code si public
  updateChrShareCodeBox();
  showToast('Chronique sauvegardée !');
}

async function deleteChroniclFromDB(id) {
  const title = chronicles[id]?.title || 'cette chronique';
  if (!confirm(`Supprimer "${title}" ?`)) return;
  const { error } = await sb.from('chronicles').delete().eq('id', id);
  if (error) { showToast('Erreur lors de la suppression.'); return; }
  delete chronicles[id];
  renderChroniclesList();
}

// ══════════════════════════════════════════════════════════════
// ABONNEMENT
// ══════════════════════════════════════════════════════════════

async function followChrByCode(code) {
  if (!code.trim()) return;
  const clean = code.trim().toUpperCase();
  const { data, error } = await sb
    .from('chronicles')
    .select('id, title, user_id, is_public')
    .eq('share_code', clean)
    .eq('is_public', true)
    .single();
  if (error || !data) { showToast('Code introuvable ou chronique non publique.'); return; }
  if (data.user_id === currentUser.id) { showToast('C\'est votre propre chronique !'); return; }
  if (followedChrIds.includes(data.id)) { showToast('Vous suivez déjà cette chronique.'); return; }

  const { error: insertError } = await sb
    .from('followed_chronicles')
    .insert({ user_id: currentUser.id, chronicle_id: data.id });
  if (insertError) { showToast('Erreur lors de l\'abonnement.'); return; }

  followedChrIds.push(data.id);
  await loadFollowedChroniclesFromDB();
  document.getElementById('chr-follow-input').value = '';
  renderChroniclesList();
  showToast(`"${data.title}" ajouté à vos chroniques !`);
}

async function unfollowChronicle(id) {
  await sb.from('followed_chronicles')
    .delete()
    .eq('user_id', currentUser.id)
    .eq('chronicle_id', id);
  followedChrIds = followedChrIds.filter(i => i !== id);
  delete followedChronicles[id];
  renderChroniclesList();
  showToast('Chronique retirée.');
}

// ══════════════════════════════════════════════════════════════
// RENDU — LISTE
// ══════════════════════════════════════════════════════════════

function renderChroniclesList() {
  const grid   = document.getElementById('chr-grid');
  const empty  = document.getElementById('chr-empty-state');
  const ownKeys      = Object.keys(chronicles);
  const followedKeys = Object.keys(followedChronicles);
  const total = ownKeys.length + followedKeys.length;

  document.getElementById('chr-count-badge').textContent = total ? `(${total})` : '';

  if (!total) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = [
    ...ownKeys.map(id => chrCardHTML(id, chronicles[id], false)),
    ...followedKeys.map(id => chrCardHTML(id, followedChronicles[id], true)),
  ].join('');
}

function chrCardHTML(id, c, isFollowed) {
  // Extrait un aperçu du contenu (première ligne non vide)
  const preview = (c.content || '')
    .replace(/#+\s*/g, '').replace(/\*+/g, '').split('\n')
    .find(l => l.trim()) || '';
  const previewTxt = preview.length > 120 ? preview.slice(0, 120) + '…' : preview;

  const date = c.updated_at
    ? new Date(c.updated_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })
    : '';

  if (isFollowed) {
    return `<div class="chr-card" onclick="openChrReader('${id}')">
      <div class="chr-card-actions">
        <button class="icon-btn danger" onclick="event.stopPropagation();unfollowChronicle('${id}')" title="Se désabonner">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3,4 13,4"/><path d="M5 4V2h6v2M6 7v5M10 7v5"/><path d="M4 4l1 10h6l1-10"/></svg>
        </button>
      </div>
      <div class="chr-card-title">${esc(c.title) || 'Sans titre'}</div>
      <div class="chr-card-preview">${esc(previewTxt)}</div>
      <div class="chr-card-footer">
        <span class="followed-badge">👁 Suivi</span>
        <span class="chr-card-owner">par ${esc(c._owner_name)}</span>
        <span class="chr-card-date">${date}</span>
      </div>
    </div>`;
  }

  const visTag = c.is_public
    ? `<span class="card-visibility public">🔗 Public</span>`
    : `<span class="card-visibility private">🔒 Privée</span>`;

  return `<div class="chr-card" onclick="openChrEditor('${id}')">
    <div class="chr-card-actions">
      <button class="icon-btn" onclick="event.stopPropagation();openChrEditor('${id}')" title="Modifier">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 2l3 3-9 9H2v-3z"/></svg>
      </button>
      <button class="icon-btn danger" onclick="event.stopPropagation();deleteChroniclFromDB('${id}')" title="Supprimer">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3,4 13,4"/><path d="M5 4V2h6v2M6 7v5M10 7v5"/><path d="M4 4l1 10h6l1-10"/></svg>
      </button>
    </div>
    <div class="chr-card-title">${esc(c.title) || 'Sans titre'}</div>
    <div class="chr-card-preview">${esc(previewTxt)}</div>
    <div class="chr-card-footer">
      ${visTag}
      <span class="chr-card-date">${date}</span>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// ÉDITEUR
// ══════════════════════════════════════════════════════════════

function newChronicle() {
  editingChrId = null;
  chrState = { title: '', content: '', is_public: false, share_code: null };
  populateChrEditor();
  showView('chr-editor');
}

function openChrEditor(id) {
  editingChrId = id;
  chrState = { ...chronicles[id] };
  populateChrEditor();
  showView('chr-editor');
}

function populateChrEditor() {
  document.getElementById('chr-f-title').value   = chrState.title || '';
  document.getElementById('chr-f-content').value = chrState.content || '';
  const pub = document.getElementById('chr-f-public');
  pub.checked = chrState.is_public || false;
  document.getElementById('chr-public-label').textContent =
    pub.checked ? 'Publique (abonnement actif)' : 'Privée';
  updateChrPreview();
  updateChrShareCodeBox();
}

function updateChrPreview() {
  chrState.title     = document.getElementById('chr-f-title').value;
  chrState.content   = document.getElementById('chr-f-content').value;
  chrState.is_public = document.getElementById('chr-f-public').checked;
  document.getElementById('chr-public-label').textContent =
    chrState.is_public ? 'Publique (abonnement actif)' : 'Privée';

  const preview = document.getElementById('chr-preview-content');
  const titleHtml = chrState.title
    ? `<h1 class="chr-reader-title">${esc(chrState.title)}</h1>` : '';
  const bodyHtml = chrState.content
    ? marked.parse(chrState.content) : '<p class="chr-empty-preview">Commencez à écrire…</p>';
  preview.innerHTML = titleHtml + `<div class="chr-reader-body">${bodyHtml}</div>`;
  updateChrShareCodeBox();
}

function updateChrShareCodeBox() {
  const box  = document.getElementById('chr-share-code-box');
  const val  = document.getElementById('chr-share-code-val');
  if (!box || !val) return;
  const code = chrState?.share_code ||
    (editingChrId && chronicles[editingChrId]?.share_code) || null;
  if (chrState?.is_public && code) {
    val.textContent = code;
    box.style.display = 'flex';
  } else {
    box.style.display = 'none';
  }
}

function copyChrShareCode() {
  const code = document.getElementById('chr-share-code-val')?.textContent;
  if (!code || code === '—') return;
  navigator.clipboard.writeText(code)
    .then(() => showToast(`Code "${code}" copié !`))
    .catch(() => prompt('Code de partage :', code));
}

function shareChrBtn() {
  if (!chrState?.is_public) {
    showToast('Activez le partage public, puis sauvegardez d\'abord.');
    return;
  }
  const code = chrState?.share_code ||
    (editingChrId && chronicles[editingChrId]?.share_code);
  if (!code) {
    showToast('Sauvegardez d\'abord pour générer le code de partage.');
    return;
  }
  navigator.clipboard.writeText(code)
    .then(() => showToast(`Code "${code}" copié !`))
    .catch(() => prompt('Code de partage :', code));
}

// ── Tabs mobile éditeur ───────────────────────────────────────
function switchChrTab(tab) {
  const form    = document.getElementById('chr-editor-form');
  const preview = document.getElementById('chr-preview-panel');
  const btnF    = document.getElementById('chr-mob-tab-form');
  const btnP    = document.getElementById('chr-mob-tab-preview');
  if (tab === 'form') {
    form.classList.remove('mob-hidden');
    preview.classList.add('mob-hidden');
    btnF?.classList.add('active'); btnP?.classList.remove('active');
  } else {
    form.classList.add('mob-hidden');
    preview.classList.remove('mob-hidden');
    btnF?.classList.remove('active'); btnP?.classList.add('active');
  }
}

// ══════════════════════════════════════════════════════════════
// LECTEUR (vue lecture seule — chroniques suivies)
// ══════════════════════════════════════════════════════════════

function openChrReader(id) {
  const c = followedChronicles[id] || chronicles[id];
  if (!c) return;
  const titleHtml = `<h1 class="chr-reader-title">${esc(c.title)}</h1>`;
  const metaHtml  = c._owner_name
    ? `<div class="chr-reader-meta">par ${esc(c._owner_name)}</div>` : '';
  const bodyHtml  = c.content
    ? marked.parse(c.content) : '';
  document.getElementById('chr-reader-content').innerHTML =
    `<div class="shared-banner">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="3" r="1.5"/><circle cx="4" cy="8" r="1.5"/><circle cx="12" cy="13" r="1.5"/>
        <line x1="5.5" y1="7" x2="10.5" y2="4.3"/><line x1="5.5" y1="9" x2="10.5" y2="11.7"/>
      </svg>
      Chronique partagée — lecture seule
    </div>
    ${titleHtml}${metaHtml}
    <div class="chr-reader-body">${bodyHtml}</div>`;
  showView('chr-reader');
}
