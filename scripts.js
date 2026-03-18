// ══════════════════════════════════════════════════════════════
// ENERGY SYSTEM — Application web avec Supabase
// ══════════════════════════════════════════════════════════════

// ── Données constantes ────────────────────────────────────────
const RANK_PTS = [0,9,17,24,32,39,47,54,62,69,77,84];
const RANK_LABELS = ['','Civils','Flics & Voyous','Agents spéciaux','Mineur','Débutant','Compétent','Reconnu','Puissant','Majeur','Plus puissants sur Terre','Cosmique'];
const MATURITY_PTS = { adolescent:12, adulte:16, veteran:20 };
const APTITUDES = ['Art','Athlétisme','Bagout','Filouterie','Médecine','Nature','Occultisme','Sciences exactes','Sciences humaines','Technologie','Véhicules','Vigilance'];
const POWER_TYPES = [
  { value:'offc', label:'Off-C', desc:'Offensif contact' },
  { value:'offd', label:'Off-D', desc:'Offensif distance' },
  { value:'def',  label:'Def',   desc:'Défensif' },
  { value:'mov',  label:'Mov',   desc:'Mouvement' },
  { value:'sup',  label:'Sup',   desc:'Support' },
];
const MOD_OPTIONS = [
  { value:'0',  label: 'Aucun', cost: 3 },
  { value:'+1', label: '+1',    cost: 5 },
  { value:'+2', label: '+2',    cost: 7 },
  { value:'-1', label: '−1',   cost: 2 },
  { value:'-2', label: '−2',   cost: 1 },
];

// ── État global ───────────────────────────────────────────────
let currentUser = null;
let isAppReady = false;
let chars = {};
let editingId = null;
let state = null;
let allTags = [];
let activeTagFilters = [];
let charTagMap = {};
let followedChars = {};    // { character_id: { ...charData, _owner_name } }
let followedIds = [];      // liste des character_id suivis

// ══════════════════════════════════════════════════════════════
// AUTH — Discord uniquement
// ══════════════════════════════════════════════════════════════

async function doDiscordLogin() {
  const btn = document.getElementById('btn-discord');
  const errEl = document.getElementById('discord-error');
  errEl.classList.remove('show');
  btn.disabled = true;
  btn.innerHTML = `<span style="opacity:0.7">Redirection vers Discord…</span>`;
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: 'https://onirim.github.io/Energy-System/'
    }
  });
  if (error) {
    errEl.textContent = 'Erreur de connexion Discord : ' + error.message;
    errEl.classList.add('show');
    btn.disabled = false;
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg> Se connecter avec Discord`;
  }
  // Si succès : Supabase redirige vers Discord puis revient sur le site,
  // onAuthStateChange capte le SIGNED_IN au retour.
}

async function doLogout() {
  toggleUserMenu(false);
  await sb.auth.signOut();
  // onAuthStateChange gère la suite
}

function toggleUserMenu(force) {
  const dd = document.getElementById('user-dropdown');
  const isOpen = dd.classList.contains('open');
  dd.classList.toggle('open', force !== undefined ? force : !isOpen);
}

// Ferme le menu si clic en dehors
document.addEventListener('click', e => {
  const wrap = document.getElementById('user-menu-wrap');
  if (wrap && !wrap.contains(e.target)) toggleUserMenu(false);
});

function updateUserUI(user) {
  if (!user) return;
  // Discord fournit le username dans user_metadata.full_name ou custom_claims
  const username = user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.user_metadata?.username
    || user.email?.split('@')[0]
    || 'Joueur';
  const initial = username.charAt(0).toUpperCase();
  document.getElementById('user-avatar').textContent = initial;
  document.getElementById('user-label').textContent = username;
  document.getElementById('dd-username').textContent = username;
  document.getElementById('dd-email').textContent = user.email || '';
}

// ══════════════════════════════════════════════════════════════
// SUPABASE — Lecture / Écriture
// ══════════════════════════════════════════════════════════════

async function loadCharsFromDB() {
  const { data, error } = await sb
    .from('characters')
    .select('id, name, rank, is_public, share_code, data, updated_at')
    .eq('user_id', currentUser.id)
    .order('updated_at', { ascending: false });
  if (error) { console.error('Erreur chargement:', error); return; }
  chars = {};
  (data || []).forEach(row => {
    chars[row.id] = {
      ...row.data,
      name: row.name,
      rank: row.rank,
      is_public: row.is_public,
      share_code: row.share_code,
      _db_id: row.id,
    };
  });
  await loadTagsFromDB();
  await loadFollowedCharsFromDB();
}

async function saveCharToDB() {
  if (!state.name.trim()) { alert('Veuillez donner un nom au personnage.'); return; }
  setSaveIndicator('saving', 'Enregistrement…');

  const payload = {
    user_id: currentUser.id,
    name: state.name.trim(),
    rank: state.rank,
    is_public: state.is_public || false,
    data: state,
  };

  let result;
  const isValidUUID = editingId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingId);
  if (isValidUUID) {
    result = await sb.from('characters').update(payload).eq('id', editingId).select('id, share_code').single();
  } else {
    if (editingId) editingId = null;
    result = await sb.from('characters').insert(payload).select('id, share_code').single();
  }

  if (result.error) {
    console.error('Erreur sauvegarde:', result.error);
    setSaveIndicator('error', 'Erreur !');
    showToast('Erreur lors de la sauvegarde.');
    return;
  }

  editingId = result.data.id;
  state.share_code = result.data.share_code;
  await saveCharTagsToDB(editingId);
  chars[editingId] = { ...state, _db_id: editingId };
  charTagMap[editingId] = (state.tags || []).map(t => t.id);
  // Affiche le share_code si public
  const scBox = document.getElementById('share-code-box');
  const scVal = document.getElementById('share-code-val');
  if (scBox && scVal && state.is_public && state.share_code) {
    scVal.textContent = state.share_code;
    scBox.style.display = 'flex';
  }
  setSaveIndicator('saved', 'Sauvegardé ✓');
  showToast('Personnage sauvegardé !');
}

async function deleteCharFromDB(id) {
  const name = chars[id]?.name || 'ce personnage';
  if (!confirm(`Supprimer "${name}" ?`)) return;

  // Récupérer les tags du personnage avant suppression
  const tagIds = charTagMap[id] || [];

  const { error } = await sb.from('characters').delete().eq('id', id);
  if (error) { showToast('Erreur lors de la suppression.'); return; }
  delete chars[id];
  delete charTagMap[id];

  // Supprimer les tags qui n'ont plus aucun personnage
  for (const tagId of tagIds) {
    const { count } = await sb
      .from('character_tags')
      .select('*', { count: 'exact', head: true })
      .eq('tag_id', tagId);
    if (count === 0) {
      await sb.from('tags').delete().eq('id', tagId);
      allTags = allTags.filter(t => t.id !== tagId);
    }
  }

  renderList();
}

// ══════════════════════════════════════════════════════════════
// TAGS — Chargement
// ══════════════════════════════════════════════════════════════

async function loadTagsFromDB() {
  const { data: tags } = await sb.from('tags').select('*').eq('user_id', currentUser.id).order('name');
  allTags = tags || [];

  const { data: charTags } = await sb.from('character_tags').select('character_id, tag_id');
  charTagMap = {};
  (charTags || []).forEach(({ character_id, tag_id }) => {
    if (!charTagMap[character_id]) charTagMap[character_id] = [];
    charTagMap[character_id].push(tag_id);
  });
}

// ══════════════════════════════════════════════════════════════
// SUIVI DE PERSONNAGES
// ══════════════════════════════════════════════════════════════

async function loadFollowedCharsFromDB() {
  const { data: followed } = await sb
    .from('followed_characters')
    .select('character_id')
    .eq('user_id', currentUser.id);
  followedIds = (followed || []).map(r => r.character_id);
  if (!followedIds.length) { followedChars = {}; return; }

  const { data: chars_data } = await sb
    .from('characters')
    .select('id, name, rank, is_public, share_code, data, profiles(username)')
    .in('id', followedIds)
    .eq('is_public', true);

  followedChars = {};
  (chars_data || []).forEach(row => {
    followedChars[row.id] = {
      ...row.data,
      name: row.name,
      rank: row.rank,
      is_public: row.is_public,
      share_code: row.share_code,
      _db_id: row.id,
      _followed: true,
      _owner_name: row.profiles?.username || '?',
    };
  });
}

async function followCharByCode(code) {
  if (!code.trim()) return;
  const clean = code.trim().toUpperCase();
  const { data, error } = await sb
    .from('characters')
    .select('id, name, user_id, is_public')
    .eq('share_code', clean)
    .eq('is_public', true)
    .single();
  if (error || !data) { showToast('Code introuvable ou personnage non public.'); return; }
  if (data.user_id === currentUser.id) { showToast('C\'est votre propre personnage !'); return; }
  if (followedIds.includes(data.id)) { showToast('Vous suivez déjà ce personnage.'); return; }
  const { error: insertError } = await sb
    .from('followed_characters')
    .insert({ user_id: currentUser.id, character_id: data.id });
  if (insertError) { showToast('Erreur lors du suivi.'); return; }
  followedIds.push(data.id);
  await loadFollowedCharsFromDB();
  document.getElementById('follow-code-input').value = '';
  renderList();
  showToast(`"${data.name}" ajouté à votre roster !`);
}

async function unfollowChar(charId) {
  await sb.from('followed_characters')
    .delete()
    .eq('user_id', currentUser.id)
    .eq('character_id', charId);
  followedIds = followedIds.filter(id => id !== charId);
  delete followedChars[charId];
  renderList();
  showToast('Personnage retiré du roster.');
}

// ══════════════════════════════════════════════════════════════
// TAGS — Couleurs prédéfinies
// ══════════════════════════════════════════════════════════════

const TAG_COLORS = [
  '#e05c5c', '#e07a3a', '#e8c46a', '#5cbf7a',
  '#5c9be0', '#9b7de8', '#e05c9b', '#5cbfbf',
];

function randomTagColor() {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

// ══════════════════════════════════════════════════════════════
// TAGS — Formulaire éditeur
// ══════════════════════════════════════════════════════════════

// state.tags = [{ id, name, color }, ...] (tags assignés au personnage en cours)

function renderTagChips() {
  const container = document.getElementById('tags-chips-container');
  container.innerHTML = (state.tags || []).map((t, i) => `
    <span class="tag-chip" style="background:${t.color}22;color:${t.color};border:1px solid ${t.color}44">
      ${esc(t.name)}
      <button class="tag-remove" onclick="removeTagFromState(${i})" tabindex="-1">×</button>
    </span>`).join('');
}

function removeTagFromState(i) {
  state.tags.splice(i, 1);
  renderTagChips();
}

function onTagInput(val) {
  showTagAutocomplete(val);
}

function onTagKeydown(e) {
  const ac = document.getElementById('tags-autocomplete');
  const items = ac.querySelectorAll('.tags-autocomplete-item');
  const activeIdx = [...items].findIndex(el => el.classList.contains('active'));

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = activeIdx < items.length - 1 ? activeIdx + 1 : 0;
    items.forEach((el, i) => el.classList.toggle('active', i === next));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = activeIdx > 0 ? activeIdx - 1 : items.length - 1;
    items.forEach((el, i) => el.classList.toggle('active', i === prev));
  } else if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const activeItem = ac.querySelector('.tags-autocomplete-item.active');
    if (activeItem) {
      activeItem.click();
    } else {
      const val = e.target.value.trim();
      if (val) addOrCreateTag(val);
    }
  } else if (e.key === 'Escape') {
    hideTagAutocomplete();
  } else if (e.key === 'Backspace' && e.target.value === '') {
    if (state.tags && state.tags.length) {
      state.tags.pop();
      renderTagChips();
    }
  }
}

function showTagAutocomplete(query) {
  const ac = document.getElementById('tags-autocomplete');
  const q = query.trim().toLowerCase();

  // Tags existants filtrés (non encore assignés)
  const assigned = (state.tags || []).map(t => t.id);
  const filtered = allTags.filter(t =>
    !assigned.includes(t.id) && (!q || t.name.toLowerCase().includes(q))
  );

  // Option "Créer" si la valeur ne correspond pas exactement à un tag existant
  const exactMatch = allTags.find(t => t.name.toLowerCase() === q);
  const showCreate = q && !exactMatch;

  if (!filtered.length && !showCreate) { ac.style.display = 'none'; return; }

  ac.innerHTML = [
    ...filtered.map(t => `
      <div class="tags-autocomplete-item" onclick="selectExistingTag('${t.id}')">
        <span class="dot" style="background:${t.color}"></span>
        ${esc(t.name)}
      </div>`),
    showCreate ? `
      <div class="tags-autocomplete-item" onclick="addOrCreateTag('${esc(query.trim())}')">
        <span class="dot" style="background:${randomTagColor()}"></span>
        ${esc(query.trim())}
        <span class="new-hint">Créer</span>
      </div>` : ''
  ].join('');

  ac.style.display = 'block';
}

function hideTagAutocomplete() {
  document.getElementById('tags-autocomplete').style.display = 'none';
}

function selectExistingTag(tagId) {
  const tag = allTags.find(t => t.id === tagId);
  if (!tag) return;
  if (!state.tags) state.tags = [];
  if (!state.tags.find(t => t.id === tagId)) {
    state.tags.push(tag);
    renderTagChips();
  }
  document.getElementById('tag-text-input').value = '';
  hideTagAutocomplete();
}

async function addOrCreateTag(name) {
  name = name.trim();
  if (!name) return;

  // Vérifie si le tag existe déjà chez cet utilisateur
  let tag = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());

  if (!tag) {
    // Crée le tag en base
    const color = randomTagColor();
    const { data, error } = await sb.from('tags')
      .insert({ user_id: currentUser.id, name, color })
      .select().single();
    if (error) { showToast('Erreur création tag.'); return; }
    tag = data;
    allTags.push(tag);
    allTags.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (!state.tags) state.tags = [];
  if (!state.tags.find(t => t.id === tag.id)) {
    state.tags.push(tag);
    renderTagChips();
  }

  document.getElementById('tag-text-input').value = '';
  hideTagAutocomplete();
}

// Ferme l'autocomplete si clic en dehors
document.addEventListener('click', e => {
  const wrap = document.getElementById('tags-input-wrap');
  const ac = document.getElementById('tags-autocomplete');
  if (wrap && ac && !wrap.contains(e.target) && !ac.contains(e.target)) {
    hideTagAutocomplete();
  }
});

// ══════════════════════════════════════════════════════════════
// TAGS — Sauvegarde des liaisons
// ══════════════════════════════════════════════════════════════

async function saveCharTagsToDB(charId) {
  if (!charId) return;
  const newTagIds = (state.tags || []).map(t => t.id);
  const oldTagIds = charTagMap[charId] || [];

  const toAdd = newTagIds.filter(id => !oldTagIds.includes(id));
  const toRemove = oldTagIds.filter(id => !newTagIds.includes(id));

  if (toRemove.length) {
    await sb.from('character_tags')
      .delete()
      .eq('character_id', charId)
      .in('tag_id', toRemove);

    // Supprimer les tags qui n'ont plus aucun personnage
    for (const tagId of toRemove) {
      const { count } = await sb
        .from('character_tags')
        .select('*', { count: 'exact', head: true })
        .eq('tag_id', tagId);
      if (count === 0) {
        await sb.from('tags').delete().eq('id', tagId);
        allTags = allTags.filter(t => t.id !== tagId);
      }
    }
  }
  if (toAdd.length) {
    await sb.from('character_tags')
      .insert(toAdd.map(tag_id => ({ character_id: charId, tag_id })));
  }

  charTagMap[charId] = newTagIds;
}

// ══════════════════════════════════════════════════════════════
// TAGS — Filtre roster
// ══════════════════════════════════════════════════════════════

function renderRosterFilters() {
  const bar = document.getElementById('roster-filters');
  const list = document.getElementById('filter-tags-list');
  const clearBtn = document.getElementById('filter-clear-btn');

  if (!allTags.length) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';

  list.innerHTML = allTags.map(t => {
    const active = activeTagFilters.includes(t.id);
    return `<button class="filter-tag ${active ? 'active' : ''}"
      style="background:${t.color}18;color:${t.color}"
      onclick="toggleTagFilter('${t.id}')">${esc(t.name)}</button>`;
  }).join('');

  clearBtn.style.display = activeTagFilters.length ? 'inline-block' : 'none';
}

function toggleTagFilter(tagId) {
  const idx = activeTagFilters.indexOf(tagId);
  if (idx >= 0) activeTagFilters.splice(idx, 1);
  else activeTagFilters.push(tagId);
  renderRosterFilters();
  renderList();
}

function clearTagFilters() {
  activeTagFilters = [];
  renderRosterFilters();
  renderList();
}

function setSaveIndicator(state, msg) {
  const el = document.getElementById('save-indicator');
  el.textContent = msg;
  el.className = `save-indicator show ${state}`;
  if (state === 'saved') setTimeout(() => el.classList.remove('show'), 3000);
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════

async function init() {
  // Timeout de sécurité : si rien ne répond en 5s, on affiche la connexion
  const safetyTimer = setTimeout(() => {
    console.warn('ES: timeout auth — affichage écran connexion');
    onSignedOut();
  }, 5000);

  try {
    console.log('ES: vérification session…');
    const { data: { session }, error } = await sb.auth.getSession();
    console.log('ES: getSession →', session ? 'session trouvée' : 'pas de session', error || '');
    clearTimeout(safetyTimer);
    if (session?.user) {
      await onSignedIn(session.user);
    } else {
      onSignedOut();
    }
  } catch(e) {
    console.error('ES: erreur init →', e);
    clearTimeout(safetyTimer);
    onSignedOut();
  }

  // Écoute les changements ultérieurs (login / logout)
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && !isAppReady) {
      // Seulement si on n'est pas déjà dans l'app (retour OAuth Discord)
      await onSignedIn(session.user);
    } else if (event === 'SIGNED_OUT') {
      isAppReady = false;
      onSignedOut();
    }
    // TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION → ignorés
  });
}

async function onSignedIn(user) {
  currentUser = user;
  updateUserUI(currentUser);
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('loading-overlay').classList.add('active');
  document.getElementById('app').style.display = 'flex';
  await loadCharsFromDB();
  await loadChroniclesFromDB();
  document.getElementById('loading-overlay').classList.remove('active');
  isAppReady = true;
  renderList();
  showView('list');
}

function onSignedOut() {
  currentUser = null;
  chars = {};
  document.getElementById('loading-overlay').classList.remove('active');
  document.getElementById('auth-screen').classList.add('active');
  document.getElementById('app').style.display = 'none';
}

// ══════════════════════════════════════════════════════════════
// VUES
// ══════════════════════════════════════════════════════════════

function showView(view) {
  const views = ['list','editor','shared','chronicles','chr-detail','chr-editor','entry-editor','entry-reader'];
  views.forEach(v => {
    document.getElementById('view-' + v)?.classList.toggle('active', v === view);
  });

  const inChronicles = ['chronicles','chr-detail','chr-editor','entry-editor','entry-reader'].includes(view);
  const inPersonnages = ['list','editor','shared'].includes(view);
  document.getElementById('nav-list').classList.toggle('active', inPersonnages);
  document.getElementById('nav-chronicles').classList.toggle('active', inChronicles);

  document.getElementById('share-btn').style.display     = view === 'editor'     ? 'flex' : 'none';
  document.getElementById('chr-share-btn').style.display = view === 'chr-editor' ? 'flex' : 'none';

  const si = document.getElementById('save-indicator');
  if (si) si.classList.remove('show');

  if (view === 'editor')       switchMobTab('form');
  if (view === 'list')         renderList();
  if (view === 'chronicles')   renderChroniclesList();
  if (view === 'entry-editor') switchEntryTab('form');
}

function showSharedChar(data) {
  const rankLabel = RANK_LABELS[data.rank] || '';
  const barMax = 10;

  const powHtml = (data.powers||[]).filter(p=>p.name).map(p => {
    const t = POWER_TYPES.find(t=>t.value===p.type);
    const modTag = p.mod && p.mod !== '0' ? `<span class="pow-mod-tag">${p.mod}</span>` : '';
    const cost = (() => { const m = {'+1':2,'+2':4,'-1':-1,'-2':-2}; return Math.max(1, 3+(m[p.mod]||0)); })();
    return `<div class="preview-power">
      <span class="pow-badge ${p.type}">${t?.label||p.type}</span>
      <div class="pow-body">
        <div class="pow-name">${esc(p.name)}${modTag}</div>
        ${p.desc ? `<div class="pow-desc">${esc(p.desc)}</div>` : ''}
      </div>
      <div class="pow-cost">${cost} pts</div>
    </div>`;
  }).join('');

  const aptEntries = Object.entries(data.aptitudes||{}).filter(([,v])=>v>0);
  const aptUsedS = Object.values(data.aptitudes||{}).reduce((s,v)=>s+v,0) + (data.traits||[]).reduce((s,t)=>s+(t.bonus||1),0);
  const aptMaxS = MATURITY_PTS[data.maturity || 'adulte'] + (data.xp_apt || 0);
  const aptPtColorS = aptUsedS > aptMaxS ? 'var(--offc)' : aptUsedS === aptMaxS ? 'var(--accent)' : 'var(--mov)';
  const aptHtml = aptEntries.length ? `
    <div class="preview-section-title">Aptitudes <span style="color:${aptPtColorS};font-family:var(--font-mono);font-size:10px;margin-left:4px">${aptUsedS} / ${aptMaxS} pts</span></div>
    <div class="apt-preview-grid">
      ${aptEntries.map(([name, val]) => `
        <div class="apt-preview-row">
          <span class="name">${name}</span>
          <span class="rank-num">${val}</span>
        </div>`).join('')}
    </div>` : '';

  const traitsWithName = (data.traits||[]).filter(t=>t.name);
  const traitsHtml = traitsWithName.length ? `
    <div class="preview-section-title">Traits</div>
    <div class="trait-preview">
      ${traitsWithName.map(t=>`<div class="trait-chip">${esc(t.name)}<span class="bonus">+${t.bonus}</span></div>`).join('')}
    </div>` : '';

  const complHtml = (data.complications||[]).filter(c => typeof c === 'object' ? c.label : c).length ? `
    <div class="preview-section-title">Complications</div>
    <div class="compl-preview">
      ${(data.complications||[]).filter(c => typeof c === 'object' ? c.label : c).map(c => {
        const label = typeof c === 'object' ? c.label : c;
        const detail = typeof c === 'object' ? c.detail : '';
        return `<div class="compl-chip">${esc(label)}${detail ? `<div class="compl-detail">${esc(detail)}</div>` : ''}</div>`;
      }).join('')}
    </div>` : '';

  const bgHtml = data.background ? `
    <div class="preview-section-title">Background</div>
    <div class="background-preview">${esc(data.background)}</div>` : '';

  document.getElementById('shared-content').innerHTML = `
    <div class="shared-banner">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="3" r="1.5"/><circle cx="4" cy="8" r="1.5"/><circle cx="12" cy="13" r="1.5"/>
        <line x1="5.5" y1="7" x2="10.5" y2="4.3"/><line x1="5.5" y1="9" x2="10.5" y2="11.7"/>
      </svg>
      Personnage partagé — consultation uniquement
    </div>
    ${data.illustration_url ? `<img class="preview-illus" src="${esc(data.illustration_url)}" style="object-position:center ${data.illustration_position||0}%" onclick="openLightbox('${esc(data.illustration_url)}')" alt="Illustration">` : ''}

    <div class="preview-header">
      <div class="preview-name">${esc(data.name) || '—'}</div>
      ${data.subtitle ? `<div class="preview-sub">${esc(data.subtitle)}</div>` : ''}
      <div class="preview-rank-badge">Rang ${data.rank}</div>
    </div>

    <div class="preview-section-title">Attributs</div>
    <div class="preview-attrs">
      <div class="preview-attr e">
        <div class="val">${data.energy}</div>
        <div class="lbl">Énergie</div>
        <div class="pips">${pipRow(data.energy, 'e', barMax)}</div>
      </div>
      <div class="preview-attr r">
        <div class="val">${data.recovery}</div>
        <div class="lbl">Récupération</div>
        <div class="pips">${pipRow(data.recovery, 'r', barMax)}</div>
      </div>
      <div class="preview-attr v">
        <div class="val">${data.vigor}</div>
        <div class="lbl">Vigueur</div>
        <div class="pips">${pipRow(data.vigor, 'v', barMax)}</div>
      </div>
    </div>

    ${(data.powers||[]).filter(p=>p.name).length ? `<div class="preview-section-title">Pouvoirs</div>${powHtml}` : ''}
    ${aptHtml}
    ${traitsHtml}
    ${complHtml}
    ${bgHtml}
  `;

  showView('shared');
}

function switchMobTab(tab) {
  const form = document.getElementById('editor-form');
  const preview = document.getElementById('preview-panel');
  const btnForm = document.getElementById('mob-tab-form');
  const btnPreview = document.getElementById('mob-tab-preview');
  if (!form || !preview) return;
  if (tab === 'form') {
    form.classList.remove('mob-hidden');
    preview.classList.add('mob-hidden');
    btnForm && btnForm.classList.add('active');
    btnPreview && btnPreview.classList.remove('active');
  } else {
    form.classList.add('mob-hidden');
    preview.classList.remove('mob-hidden');
    btnForm && btnForm.classList.remove('active');
    btnPreview && btnPreview.classList.add('active');
  }
}

// ══════════════════════════════════════════════════════════════
// LISTE
// ══════════════════════════════════════════════════════════════

function renderList() {
  renderRosterFilters();
  let keys = Object.keys(chars);

  // Filtre AND : garde uniquement les personnages ayant TOUS les tags actifs
  if (activeTagFilters.length) {
    keys = keys.filter(id => {
      const tids = charTagMap[id] || [];
      return activeTagFilters.every(fid => tids.includes(fid));
    });
  }

  document.getElementById('list-count-badge').textContent = keys.length ? `(${keys.length})` : '';
  const grid = document.getElementById('char-grid');
  const empty = document.getElementById('empty-state');

  const followedKeys = Object.keys(followedChars);
  const allKeys = [...keys, ...followedKeys];
  const total = Object.keys(chars).length + followedKeys.length;
  document.getElementById('list-count-badge').textContent = total ? `(${total})` : '';

  if (!allKeys.length) { grid.innerHTML = ''; empty.style.display = 'flex'; return; }
  empty.style.display = 'none';
  grid.innerHTML = [
    ...keys.map(id => cardHTML(id, chars[id])),
    ...followedKeys.map(id => cardHTML(id, followedChars[id], true)),
  ].join('');
}

function cardHTML(id, c, isFollowed = false) {
  const rankLabel = RANK_LABELS[c.rank] || 'Inconnu';
  const pwrTags = (c.powers||[]).map(p =>
    `<span class="card-power-tag" style="${powerTagStyle(p.type)}">${POWER_TYPES.find(t=>t.value===p.type)?.label||p.type}</span>`
  ).join('');

  if (isFollowed) {
    return `<div class="char-card" onclick="showSharedChar(followedChars['${id}'])">
      ${c.illustration_url ? `<img class="card-illus" src="${esc(c.illustration_url)}" style="object-position:center ${c.illustration_position||0}%" onclick="event.stopPropagation();openLightbox('${esc(c.illustration_url)}')" alt="">` : ''}
      <div class="card-actions">
        <button class="icon-btn danger" onclick="event.stopPropagation();unfollowChar('${id}')" title="Ne plus suivre">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3,4 13,4"/><path d="M5 4V2h6v2M6 7v5M10 7v5"/><path d="M4 4l1 10h6l1-10"/></svg>
        </button>
      </div>
      <div class="card-name">${esc(c.name) || 'Sans nom'}</div>
      <div class="card-sub">${esc(c.subtitle) || ''}</div>
      <div class="card-rank">Rang ${c.rank}</div>
      <div class="card-attrs">
        <div class="card-attr e"><div class="val">${c.energy||1}</div><div class="lbl">Énergie</div></div>
        <div class="card-attr r"><div class="val">${c.recovery||1}</div><div class="lbl">Récup.</div></div>
        <div class="card-attr v"><div class="val">${c.vigor||1}</div><div class="lbl">Vigueur</div></div>
      </div>
      <div class="card-powers">${pwrTags}</div>
      <div class="followed-badge">👁 Suivi</div>
      <div class="card-followed-owner">par ${esc(c._owner_name)}</div>
    </div>`;
  }

  const visTag = c.is_public
    ? `<span class="card-visibility public">🔗 Public</span>`
    : `<span class="card-visibility private">🔒 Privé</span>`;
  const cardTags = (charTagMap[id] || []).map(tid => {
    const t = allTags.find(x => x.id === tid);
    return t ? `<span class="tag-chip" style="background:${t.color}22;color:${t.color};border:1px solid ${t.color}44">${esc(t.name)}</span>` : '';
  }).join('');
  return `<div class="char-card" onclick="editChar('${id}')">
    ${c.illustration_url ? `<img class="card-illus" src="${esc(c.illustration_url)}" style="object-position:center ${c.illustration_position||0}%" onclick="event.stopPropagation();openLightbox('${esc(c.illustration_url)}')" alt="">` : ''}
    <div class="card-actions">
      <button class="icon-btn" onclick="event.stopPropagation();editChar('${id}')" title="Modifier">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 2l3 3-9 9H2v-3z"/></svg>
      </button>
      <button class="icon-btn danger" onclick="event.stopPropagation();deleteCharFromDB('${id}')" title="Supprimer">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3,4 13,4"/><path d="M5 4V2h6v2M6 7v5M10 7v5"/><path d="M4 4l1 10h6l1-10"/></svg>
      </button>
    </div>
    <div class="card-name">${esc(c.name) || 'Sans nom'}</div>
    <div class="card-sub">${esc(c.subtitle) || ''}</div>
    <div class="card-rank">Rang ${c.rank}</div>
    <div class="card-attrs">
      <div class="card-attr e"><div class="val">${c.energy||1}</div><div class="lbl">Énergie</div></div>
      <div class="card-attr r"><div class="val">${c.recovery||1}</div><div class="lbl">Récup.</div></div>
      <div class="card-attr v"><div class="val">${c.vigor||1}</div><div class="lbl">Vigueur</div></div>
    </div>
    <div class="card-powers">${pwrTags}</div>
    ${cardTags ? `<div class="card-tags">${cardTags}</div>` : ''}
    ${visTag}
  </div>`;
}

function powerTagStyle(type) {
  const styles = {
    offc: 'background:rgba(224,92,92,0.15);color:#e05c5c;',
    offd: 'background:rgba(224,122,58,0.15);color:#e07a3a;',
    def:  'background:rgba(92,155,224,0.15);color:#5c9be0;',
    mov:  'background:rgba(92,191,122,0.15);color:#5cbf7a;',
    sup:  'background:rgba(155,125,232,0.15);color:#9b7de8;',
  };
  return styles[type] || '';
}

// ══════════════════════════════════════════════════════════════
// ÉDITEUR
// ══════════════════════════════════════════════════════════════

function freshState() {
  return {
    name:'', subtitle:'', rank:5, maturity:'adulte',
    energy:1, recovery:1, vigor:1,
    is_public: false, illustration_url: '', illustration_position: 0,
    xp_hero: 0, xp_apt: 0, tags: [],
    powers:[], aptitudes:{}, traits:[], complications:[], background:'',
  };
}

function newChar() {
  editingId = null;
  state = freshState();
  populateEditor();
  showView('editor');
}

function editChar(id, dataOverride) {
  editingId = id;
  const src = dataOverride || (id ? chars[id] : null) || freshState();
  state = JSON.parse(JSON.stringify(src));
  if (!state.aptitudes) state.aptitudes = {};
  if (!state.powers) state.powers = [];
  if (!state.traits) state.traits = [];
  if (!state.complications) state.complications = [];
  if (!state.tags) state.tags = [];
  // Restaure les objets tag complets depuis allTags
  if (editingId && charTagMap[editingId]) {
    state.tags = charTagMap[editingId]
      .map(tid => allTags.find(t => t.id === tid))
      .filter(Boolean);
  }
  populateEditor();
  showView('editor');
}

function populateEditor() {
  document.getElementById('f-name').value = state.name || '';
  document.getElementById('f-sub').value = state.subtitle || '';
  document.getElementById('f-rank').value = state.rank || 5;
  document.getElementById('f-maturity').value = state.maturity || 'adulte';
  const pubCb = document.getElementById('f-public');
  if (pubCb) {
    pubCb.checked = state.is_public || false;
    document.getElementById('public-label').textContent = pubCb.checked ? 'Public (lien de partage actif)' : 'Privé';
  }
  const scBox = document.getElementById('share-code-box');
  const scVal = document.getElementById('share-code-val');
  if (scBox && scVal) {
    const code = state.share_code || (editingId && chars[editingId]?.share_code) || null;
    if (state.is_public && code) { scVal.textContent = code; scBox.style.display = 'flex'; }
    else scBox.style.display = 'none';
  }
  document.getElementById('val-e').textContent = state.energy;
  document.getElementById('val-r').textContent = state.recovery;
  document.getElementById('val-v').textContent = state.vigor;
  renderPowers();
  renderAptitudes();
  renderTraits();
  renderComplications();
  const bgField = document.getElementById('f-background');
  if (bgField) bgField.value = state.background || '';
  document.getElementById('xp-hero-val').textContent = state.xp_hero || 0;
  document.getElementById('xp-apt-val').textContent = state.xp_apt || 0;
  renderTagChips();
  setIllusPreview(state.illustration_url || '', state.illustration_position || 0);
  updatePreview();
  updatePtsDisplay();
  updateAptPtsDisplay();
}

// ── Attributes ────────────────────────────────────────────────
function changeAttr(attr, delta) {
  const key = {e:'energy',r:'recovery',v:'vigor'}[attr];
  const cur = state[key];
  const nv = Math.max(1, cur + delta);
  if (attr === 'r' && nv > state.energy) return;
  state[key] = nv;
  document.getElementById('val-'+attr).textContent = nv;
  updatePtsDisplay();
  updatePreview();
}

function calcAttrCost() {
  return (state.energy * 2) + (state.recovery * 3) + (state.vigor * 1);
}
function calcPowersCost() {
  return (state.powers || []).reduce((s,p) => s + powerCost(p), 0);
}
function powerCost(p) {
  const modCosts = {'+1':2,'+2':4,'-1':-1,'-2':-2};
  return Math.max(1, 3 + (modCosts[p.mod] || 0));
}
function totalCost() { return calcAttrCost() + calcPowersCost(); }
function maxPts() { return (RANK_PTS[Math.min(state.rank, 11)] || 39) + (state.xp_hero || 0); }

function updatePtsDisplay() {
  const used = totalCost();
  const max = maxPts();
  const el = document.getElementById('pts-display');
  el.textContent = `${used} / ${max}`;
  el.className = 'pts-value ' + (used > max ? 'over' : 'ok');
  ['e','r','v'].forEach(a => {
    const key = {e:'energy',r:'recovery',v:'vigor'}[a];
    const costs = {e:2,r:3,v:1};
    document.getElementById('cost-'+a).textContent = `${state[key] * costs[a]} pts`;
  });
}

function updateRankMax() {
  state.rank = parseInt(document.getElementById('f-rank').value);
  updatePtsDisplay();
  updatePreview();
}

// ── Powers ────────────────────────────────────────────────────
function renderPowers() {
  const container = document.getElementById('powers-list');
  container.innerHTML = state.powers.map((p, i) => powerEntryHTML(p, i)).join('');
}

function powerEntryHTML(p, i) {
  const typeOpts = POWER_TYPES.map(t =>
    `<option value="${t.value}" ${p.type===t.value?'selected':''}>${t.label} — ${t.desc}</option>`
  ).join('');
  const modOpts = MOD_OPTIONS.map(m =>
    `<option value="${m.value}" ${p.mod===m.value?'selected':''}>${m.label}</option>`
  ).join('');
  const cost = powerCost(p);
  return `<div class="power-entry" id="pow-${i}">
    <div class="power-entry-header">
      <input type="text" placeholder="Nom du pouvoir" value="${esc(p.name||'')}"
        oninput="state.powers[${i}].name=this.value;updatePreview()">
      <button class="rm-btn" onclick="removePower(${i})">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
        </svg>
      </button>
    </div>
    <div class="power-entry-footer">
      <select onchange="state.powers[${i}].type=this.value;updatePreview()">${typeOpts}</select>
      <select class="mod-select" onchange="state.powers[${i}].mod=this.value;updatePtsDisplay();updatePreview()">${modOpts}</select>
      <div class="power-cost-display">${cost} pts</div>
    </div>
    <div style="margin-top:7px">
      <input type="text" placeholder="Description courte (optionnelle)" style="width:100%;background:var(--bg4);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:12px;padding:5px 8px;outline:none" value="${esc(p.desc||'')}" oninput="state.powers[${i}].desc=this.value;updatePreview()" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
    </div>
  </div>`;
}

function addPower() {
  state.powers.push({ name:'', type:'offc', mod:'0', desc:'' });
  renderPowers(); updatePtsDisplay(); updatePreview();
}
function removePower(i) {
  state.powers.splice(i, 1);
  renderPowers(); updatePtsDisplay(); updatePreview();
}

// ── Aptitudes ─────────────────────────────────────────────────
function renderAptitudes() {
  const grid = document.getElementById('aptitude-grid');
  const half = Math.ceil(APTITUDES.length / 2);
  const left = APTITUDES.slice(0, half);
  const right = APTITUDES.slice(half);
  const rowCount = Math.max(left.length, right.length);
  let rows = '';
  for (let i = 0; i < rowCount; i++) {
    const aptL = left[i], aptR = right[i];
    const valL = aptL ? (state.aptitudes[aptL] || 0) : null;
    const valR = aptR ? (state.aptitudes[aptR] || 0) : null;
    const leftCell = aptL ? `<div class="apt-row">
      <div class="apt-name">${aptL}</div>
      <div class="apt-ctrl">
        <button onclick="changeApt('${aptL}',-1)">−</button>
        <div class="apt-val ${valL===0?'zero':''}" id="apt-${aptL.replace(/\s/g,'_')}">${valL}</div>
        <button onclick="changeApt('${aptL}',1)">+</button>
      </div>
    </div>` : '<div></div>';
    const rightCell = aptR ? `<div class="apt-row">
      <div class="apt-name">${aptR}</div>
      <div class="apt-ctrl">
        <button onclick="changeApt('${aptR}',-1)">−</button>
        <div class="apt-val ${valR===0?'zero':''}" id="apt-${aptR.replace(/\s/g,'_')}">${valR}</div>
        <button onclick="changeApt('${aptR}',1)">+</button>
      </div>
    </div>` : '<div></div>';
    rows += leftCell + '<div class="aptitude-col-sep"></div>' + rightCell;
  }
  grid.innerHTML = rows;
}

function changeApt(apt, delta) {
  const cur = state.aptitudes[apt] || 0;
  const nv = Math.max(0, cur + delta);
  state.aptitudes[apt] = nv;
  const el = document.getElementById(`apt-${apt.replace(/\s/g,'_')}`);
  if (el) { el.textContent = nv; el.className = `apt-val ${nv===0?'zero':''}`; }
  updateAptPtsDisplay(); updatePreview();
}

function calcAptPts() {
  const aptSum = Object.values(state.aptitudes||{}).reduce((s,v)=>s+v,0);
  const traitSum = (state.traits||[]).reduce((s,t)=>s+(t.bonus||1),0);
  return aptSum + traitSum;
}

function updateAptPtsDisplay() {
  const used = calcAptPts();
  const max = MATURITY_PTS[state.maturity || 'adulte'] + (state.xp_apt || 0);
  const el = document.getElementById('apt-pts-display');
  el.textContent = `${used} / ${max}`;
  el.className = `val ${used > max ? 'over' : 'ok'}`;
}

// ── Traits ────────────────────────────────────────────────────
function renderTraits() {
  const container = document.getElementById('traits-list');
  container.innerHTML = (state.traits||[]).map((t,i) => `
    <div class="trait-row">
      <input class="trait-name" type="text" placeholder="Nom du trait" value="${esc(t.name||'')}"
        oninput="state.traits[${i}].name=this.value;updatePreview()">
      <div class="trait-bonus">
        <button style="width:22px;height:22px;border-radius:3px;background:var(--bg4);border:1px solid var(--border);color:var(--text2);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center" onclick="changeTrait(${i},-1)">−</button>
        <div class="trait-bonus-val">+${t.bonus||1}</div>
        <button style="width:22px;height:22px;border-radius:3px;background:var(--bg4);border:1px solid var(--border);color:var(--text2);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center" onclick="changeTrait(${i},1)">+</button>
        <span style="font-size:10px;color:var(--text3);margin-left:2px">${t.bonus||1} pt${(t.bonus||1)>1?'s':''}</span>
      </div>
      <button class="rm-btn" onclick="removeTrait(${i})">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
        </svg>
      </button>
    </div>`).join('');
}

function addTrait() {
  state.traits.push({ name:'', bonus:1 });
  renderTraits(); updateAptPtsDisplay(); updatePreview();
}
function removeTrait(i) {
  state.traits.splice(i,1);
  renderTraits(); updateAptPtsDisplay(); updatePreview();
}
function changeTrait(i, delta) {
  const t = state.traits[i];
  const nv = Math.max(1, (t.bonus||1) + delta);
  t.bonus = nv;
  renderTraits(); updateAptPtsDisplay(); updatePreview();
}

// ── Expérience ────────────────────────────────────────────────
function changeXP(type, delta) {
  const key = type === 'hero' ? 'xp_hero' : 'xp_apt';
  const elId = type === 'hero' ? 'xp-hero-val' : 'xp-apt-val';
  state[key] = Math.max(0, (state[key] || 0) + delta);
  document.getElementById(elId).textContent = state[key];
  if (type === 'hero') updatePtsDisplay();
  else updateAptPtsDisplay();
  updatePreview();
}
function renderComplications() {
  const container = document.getElementById('complications-list');
  container.innerHTML = (state.complications||[]).map((c,i) => {
    const label = typeof c === 'object' ? (c.label||'') : c;
    const detail = typeof c === 'object' ? (c.detail||'') : '';
    return `
    <div class="compl-entry">
      <div class="compl-entry-header">
        <input type="text" placeholder="Nom de la complication" value="${esc(label)}"
          oninput="setComplLabel(${i}, this.value)">
        <button class="rm-btn" onclick="removeComplication(${i})">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
          </svg>
        </button>
      </div>
      <textarea placeholder="Détails (optionnel)" oninput="setComplDetail(${i}, this.value)">${esc(detail)}</textarea>
    </div>`;
  }).join('');
  document.getElementById('add-compl-btn').style.display = (state.complications||[]).length >= 5 ? 'none' : 'block';
}

function setComplLabel(i, val) {
  if (typeof state.complications[i] !== 'object') state.complications[i] = { label: '', detail: '' };
  state.complications[i].label = val;
  updatePreview();
}
function setComplDetail(i, val) {
  if (typeof state.complications[i] !== 'object') state.complications[i] = { label: '', detail: '' };
  state.complications[i].detail = val;
  updatePreview();
}

function addComplication() {
  if ((state.complications||[]).length >= 5) return;
  state.complications.push({ label:'', detail:'' });
  renderComplications();
}
function removeComplication(i) {
  state.complications.splice(i,1);
  renderComplications(); updatePreview();
}

// ── Preview ───────────────────────────────────────────────────
function updatePreview() {
  state.name = document.getElementById('f-name').value;
  state.subtitle = document.getElementById('f-sub').value;
  state.rank = parseInt(document.getElementById('f-rank').value);
  state.maturity = document.getElementById('f-maturity').value;
  const pubCb = document.getElementById('f-public');
  if (pubCb) {
    state.is_public = pubCb.checked;
    document.getElementById('public-label').textContent = pubCb.checked ? 'Public (lien de partage actif)' : 'Privé';
  }
  const scBox = document.getElementById('share-code-box');
  const scVal = document.getElementById('share-code-val');
  if (scBox && scVal) {
    const code = state.share_code || (editingId && chars[editingId]?.share_code) || null;
    if (state.is_public && code) { scVal.textContent = code; scBox.style.display = 'flex'; }
    else scBox.style.display = 'none';
  }
  const used = totalCost(); const max = maxPts();
  const ptColor = used > max ? 'var(--offc)' : used === max ? 'var(--accent)' : 'var(--mov)';

  const powHtml = (state.powers||[]).filter(p=>p.name).map(p => {
    const t = POWER_TYPES.find(t=>t.value===p.type);
    const modTag = p.mod && p.mod !== '0' ? `<span class="pow-mod-tag">${p.mod}</span>` : '';
    const cost = powerCost(p);
    return `<div class="preview-power">
      <span class="pow-badge ${p.type}">${t?.label||p.type}</span>
      <div class="pow-body">
        <div class="pow-name">${esc(p.name)}${modTag}</div>
        ${p.desc ? `<div class="pow-desc">${esc(p.desc)}</div>` : ''}
      </div>
      <div class="pow-cost">${cost} pts</div>
    </div>`;
  }).join('');

  const aptEntries = Object.entries(state.aptitudes||{}).filter(([,v])=>v>0);
  const aptUsed = calcAptPts();
  const aptMax = MATURITY_PTS[state.maturity || 'adulte'] + (state.xp_apt || 0);
  const aptPtColor = aptUsed > aptMax ? 'var(--offc)' : aptUsed === aptMax ? 'var(--accent)' : 'var(--mov)';
  const aptHtml = aptEntries.length ? `
    <div class="preview-section-title">Aptitudes <span style="color:${aptPtColor};font-family:var(--font-mono);font-size:10px;margin-left:4px">${aptUsed} / ${aptMax} pts</span></div>
    <div class="apt-preview-grid">
      ${aptEntries.map(([name, val]) => `
        <div class="apt-preview-row">
          <span class="name">${name}</span>
          <span class="rank-num">${val}</span>
        </div>`).join('')}
    </div>` : '';

  const traitsWithName = (state.traits||[]).filter(t=>t.name);
  const traitsHtml = traitsWithName.length ? `
    <div class="preview-section-title">Traits</div>
    <div class="trait-preview">
      ${traitsWithName.map(t=>`<div class="trait-chip">${esc(t.name)}<span class="bonus">+${t.bonus}</span></div>`).join('')}
    </div>` : '';

  state.background = document.getElementById('f-background')?.value || state.background || '';

  const complHtml = (state.complications||[]).filter(c => typeof c === 'object' ? c.label : c).length ? `
    <div class="preview-section-title">Complications</div>
    <div class="compl-preview">
      ${(state.complications||[]).filter(c => typeof c === 'object' ? c.label : c).map(c => {
        const label = typeof c === 'object' ? c.label : c;
        const detail = typeof c === 'object' ? c.detail : '';
        return `<div class="compl-chip">${esc(label)}${detail ? `<div class="compl-detail">${esc(detail)}</div>` : ''}</div>`;
      }).join('')}
    </div>` : '';

  const bgHtml = state.background ? `
    <div class="preview-section-title">Background</div>
    <div class="background-preview">${esc(state.background)}</div>` : '';

  const barMax = 10;

  document.getElementById('preview-content').innerHTML = `
    ${state.illustration_url ? `<img class="preview-illus" src="${esc(state.illustration_url)}" style="object-position:center ${state.illustration_position||0}%" onclick="openLightbox('${esc(state.illustration_url)}')" alt="Illustration">` : ''}
    <div class="preview-header">
      <div class="preview-name">${esc(state.name) || '—'}</div>
      ${state.subtitle ? `<div class="preview-sub">${esc(state.subtitle)}</div>` : ''}
      <div class="preview-rank-badge">Rang ${state.rank}</div>
    </div>

    <div class="preview-section-title">Attributs <span style="color:${ptColor};font-family:var(--font-mono);font-size:10px;margin-left:4px">${used} / ${max} pts</span></div>
    <div class="preview-attrs">
      <div class="preview-attr e">
        <div class="val">${state.energy}</div>
        <div class="lbl">Énergie</div>
        <div class="cost">${state.energy*2} pts de héros</div>
        <div class="pips">${pipRow(state.energy, 'e', barMax)}</div>
      </div>
      <div class="preview-attr r">
        <div class="val">${state.recovery}</div>
        <div class="lbl">Récupération</div>
        <div class="cost">${state.recovery*3} pts de héros</div>
        <div class="pips">${pipRow(state.recovery, 'r', barMax)}</div>
      </div>
      <div class="preview-attr v">
        <div class="val">${state.vigor}</div>
        <div class="lbl">Vigueur</div>
        <div class="cost">${state.vigor*1} pts de héros</div>
        <div class="pips">${pipRow(state.vigor, 'v', barMax)}</div>
      </div>
    </div>

    ${(state.powers||[]).filter(p=>p.name).length ? `<div class="preview-section-title">Pouvoirs</div>${powHtml}` : ''}
    ${aptHtml}
    ${traitsHtml}
    ${complHtml}
    ${bgHtml}
  `;
}

function pipRow(val, cls, max) {
  return Array.from({length:max}, (_,i) =>
    `<div class="pip ${i < val ? cls : 'empty'}"></div>`
  ).join('');
}

// ── Illustration ──────────────────────────────────────────────
function illusZoneClick() {
  if (!state.illustration_url) document.getElementById('illus-input').click();
}

function setIllusPreview(url, position) {
  const img = document.getElementById('illus-preview-img');
  const placeholder = document.getElementById('illus-placeholder');
  const zone = document.getElementById('illus-zone');
  const sliderWrap = document.getElementById('illus-slider-wrap');
  const slider = document.getElementById('illus-pos-slider');
  const pos = position !== undefined ? position : (state.illustration_position || 0);
  if (url) {
    img.src = url;
    img.style.display = 'block';
    img.style.objectPosition = `center ${pos}%`;
    placeholder.style.display = 'none';
    zone.classList.add('has-image');
    sliderWrap.classList.add('visible');
    slider.value = pos;
  } else {
    img.src = '';
    img.style.display = 'none';
    placeholder.style.display = 'flex';
    zone.classList.remove('has-image');
    sliderWrap.classList.remove('visible');
    slider.value = 0;
  }
}

function updateIllusPosition(val) {
  state.illustration_position = parseInt(val);
  // Met à jour l'aperçu dans la zone d'upload
  const img = document.getElementById('illus-preview-img');
  if (img) img.style.objectPosition = `center ${val}%`;
  // Met à jour la preview en temps réel
  const previewImg = document.querySelector('#preview-content .preview-illus');
  if (previewImg) previewImg.style.objectPosition = `center ${val}%`;
}

function openLightbox(url) {
  const lb = document.getElementById('lightbox');
  document.getElementById('lightbox-img').src = url;
  lb.classList.add('open');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}
// Fermer avec Échap
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

async function uploadIllustration(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) {
    showToast('Image trop lourde (max 3 Mo).');
    return;
  }

  document.getElementById('illus-uploading').classList.add('active');

  // On utilise l'editingId Supabase si disponible (UUID valide),
  // sinon un identifiant temporaire uniquement pour le nom du fichier.
  // On ne touche PAS à editingId — c'est saveCharToDB qui le définit.
  const fileId = editingId || ('tmp_' + Date.now());
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${currentUser.id}/${fileId}.${ext}`;

  const { error } = await sb.storage
    .from('character-illustrations')
    .upload(path, file, { upsert: true, contentType: file.type });

  document.getElementById('illus-uploading').classList.remove('active');

  if (error) {
    showToast('Erreur upload : ' + error.message);
    return;
  }

  const { data } = sb.storage
    .from('character-illustrations')
    .getPublicUrl(path);

  state.illustration_url = data.publicUrl;
  state.illustration_position = 0;
  setIllusPreview(state.illustration_url, 0);
  updatePreview();
  showToast('Illustration ajoutée !');
  // Reset input pour permettre de re-sélectionner le même fichier
  input.value = '';
}

async function removeIllustration() {
  if (!state.illustration_url) return;
  // Suppression du fichier dans Storage
  const url = state.illustration_url;
  const pathMatch = url.match(/character-illustrations\/(.+)$/);
  if (pathMatch) {
    await sb.storage.from('character-illustrations').remove([pathMatch[1]]);
  }
  state.illustration_url = '';
  state.illustration_position = 0;
  setIllusPreview('', 0);
  updatePreview();
}

// ── Save ──────────────────────────────────────────────────────
function saveChar() {
  saveCharToDB();
}

// ── Share ─────────────────────────────────────────────────────
function shareChar() {
  if (!state.is_public) {
    showToast('Activez le partage public pour ce personnage, puis sauvegardez d\'abord.');
    return;
  }
  const code = state.share_code || (editingId && chars[editingId]?.share_code);
  if (!code) {
    showToast('Sauvegardez d\'abord le personnage pour générer son code de partage.');
    return;
  }
  navigator.clipboard.writeText(code)
    .then(() => showToast(`Code "${code}" copié dans le presse-papier !`))
    .catch(() => prompt('Code de partage à transmettre :', code));
}

function copyShareCode() {
  const code = document.getElementById('share-code-val')?.textContent;
  if (!code || code === '—') return;
  navigator.clipboard.writeText(code)
    .then(() => showToast(`Code "${code}" copié !`))
    .catch(() => prompt('Code de partage :', code));
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Utils ─────────────────────────────────────────────────────
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Boot ──────────────────────────────────────────────────────
// L'app démarre masquée, init() gère tout via onAuthStateChange
document.getElementById('app').style.display = 'none';
init();
