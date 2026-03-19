// ══════════════════════════════════════════════════════════════
// ENERGY SYSTEM — Module Tags
// Dépendances : sb, currentUser, state, allTags, charTagMap,
//               followedTagMap, followedChars, renderList,
//               showToast, esc  (scripts.js)
// ══════════════════════════════════════════════════════════════

// ── Couleurs prédéfinies ──────────────────────────────────────
const TAG_COLORS = [
  '#e05c5c', '#e07a3a', '#e8c46a', '#5cbf7a',
  '#5c9be0', '#9b7de8', '#e05c9b', '#5cbfbf',
];

function randomTagColor() {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

// ══════════════════════════════════════════════════════════════
// TAGS — Formulaire éditeur personnage
// ══════════════════════════════════════════════════════════════

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
    if (activeItem) activeItem.click();
    else { const val = e.target.value.trim(); if (val) addOrCreateTag(val); }
  } else if (e.key === 'Escape') {
    hideTagAutocomplete();
  } else if (e.key === 'Backspace' && e.target.value === '') {
    if (state.tags && state.tags.length) { state.tags.pop(); renderTagChips(); }
  }
}

function showTagAutocomplete(query) {
  const ac = document.getElementById('tags-autocomplete');
  const q = query.trim().toLowerCase();
  const assigned = (state.tags || []).map(t => t.id);
  const filtered = allTags.filter(t =>
    !assigned.includes(t.id) && (!q || t.name.toLowerCase().includes(q))
  );
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
  let tag = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
  if (!tag) {
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
  const ac   = document.getElementById('tags-autocomplete');
  if (wrap && ac && !wrap.contains(e.target) && !ac.contains(e.target)) hideTagAutocomplete();
});

// ══════════════════════════════════════════════════════════════
// TAGS — Sauvegarde des liaisons
// ══════════════════════════════════════════════════════════════

async function saveCharTagsToDB(charId) {
  if (!charId) return;
  const newTagIds = (state.tags || []).map(t => t.id);
  const oldTagIds = charTagMap[charId] || [];
  const toAdd    = newTagIds.filter(id => !oldTagIds.includes(id));
  const toRemove = oldTagIds.filter(id => !newTagIds.includes(id));

  if (toRemove.length) {
    await sb.from('character_tags')
      .delete().eq('character_id', charId).in('tag_id', toRemove);
    for (const tagId of toRemove) {
      const { count } = await sb.from('character_tags')
        .select('*', { count: 'exact', head: true }).eq('tag_id', tagId);
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

async function saveFollowedCharTagsToDB(charId, newTagIds) {
  const oldTagIds = followedTagMap[charId] || [];
  const toAdd    = newTagIds.filter(id => !oldTagIds.includes(id));
  const toRemove = oldTagIds.filter(id => !newTagIds.includes(id));
  if (toRemove.length) {
    await sb.from('followed_character_tags')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('character_id', charId)
      .in('tag_id', toRemove);
  }
  if (toAdd.length) {
    await sb.from('followed_character_tags')
      .insert(toAdd.map(tag_id => ({ user_id: currentUser.id, character_id: charId, tag_id })));
  }
  followedTagMap[charId] = newTagIds;
}

// ══════════════════════════════════════════════════════════════
// TAGS — Filtre roster
// ══════════════════════════════════════════════════════════════

function renderRosterFilters() {
  const bar      = document.getElementById('roster-filters');
  const list     = document.getElementById('filter-tags-list');
  const clearBtn = document.getElementById('filter-clear-btn');
  const hasFollowed = Object.keys(followedChars).length > 0;
  const hasFilters  = allTags.length || hasFollowed;
  if (!hasFilters) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  const followedBtn = hasFollowed ? `
    <button class="filter-tag ${filterFollowed ? 'active' : ''}"
      style="background:rgba(155,125,232,0.12);color:var(--sup)"
      onclick="toggleFollowedFilter()">👁 Suivi</button>` : '';
  list.innerHTML = followedBtn + allTags.map(t => {
    const active = activeTagFilters.includes(t.id);
    return `<button class="filter-tag ${active ? 'active' : ''}"
      style="background:${t.color}18;color:${t.color}"
      onclick="toggleTagFilter('${t.id}')">${esc(t.name)}</button>`;
  }).join('');
  clearBtn.style.display = (activeTagFilters.length || filterFollowed) ? 'inline-block' : 'none';
}

function toggleFollowedFilter() {
  filterFollowed = !filterFollowed;
  renderRosterFilters();
  renderList();
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
  filterFollowed = false;
  renderRosterFilters();
  renderList();
}

// ══════════════════════════════════════════════════════════════
// TAGS — Personnages suivis (modale)
// ══════════════════════════════════════════════════════════════

let editingFollowedId = null;

function editFollowedTags(charId) {
  editingFollowedId = charId;
  const c = followedChars[charId];
  const tags = (followedTagMap[charId] || [])
    .map(tid => allTags.find(t => t.id === tid)).filter(Boolean);
  renderFollowedTagChips(charId, tags);
  document.getElementById('followed-tag-modal-name').textContent = c?.name || '';
  document.getElementById('followed-tag-modal').style.display = 'flex';
  document.getElementById('followed-tag-input').value = '';
  document.getElementById('followed-tag-autocomplete').style.display = 'none';
}

function closeFollowedTagModal() {
  document.getElementById('followed-tag-modal').style.display = 'none';
  editingFollowedId = null;
}

function renderFollowedTagChips(charId, tags) {
  const container = document.getElementById('followed-tag-chips');
  const list = tags || (followedTagMap[charId] || [])
    .map(tid => allTags.find(t => t.id === tid)).filter(Boolean);
  container.innerHTML = list.map(t => `
    <span class="tag-chip" style="background:${t.color}22;color:${t.color};border:1px solid ${t.color}44">
      ${esc(t.name)}
      <button class="tag-remove" onclick="removeFollowedTag('${charId}','${t.id}')" tabindex="-1">×</button>
    </span>`).join('');
}

async function removeFollowedTag(charId, tagId) {
  followedTagMap[charId] = (followedTagMap[charId] || []).filter(id => id !== tagId);
  await sb.from('followed_character_tags')
    .delete()
    .eq('user_id', currentUser.id)
    .eq('character_id', charId)
    .eq('tag_id', tagId);
  renderFollowedTagChips(charId);
  renderList();
}

async function addFollowedTag(name) {
  name = name.trim();
  if (!name || !editingFollowedId) return;
  let tag = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
  if (!tag) {
    const color = randomTagColor();
    const { data, error } = await sb.from('tags')
      .insert({ user_id: currentUser.id, name, color })
      .select().single();
    if (error) { showToast('Erreur création tag.'); return; }
    tag = data;
    allTags.push(tag);
    allTags.sort((a, b) => a.name.localeCompare(b.name));
  }
  const charId = editingFollowedId;
  if (!(followedTagMap[charId] || []).includes(tag.id)) {
    if (!followedTagMap[charId]) followedTagMap[charId] = [];
    followedTagMap[charId].push(tag.id);
    await sb.from('followed_character_tags')
      .insert({ user_id: currentUser.id, character_id: charId, tag_id: tag.id });
    renderFollowedTagChips(charId);
    renderRosterFilters();
    renderList();
  }
  document.getElementById('followed-tag-input').value = '';
  document.getElementById('followed-tag-autocomplete').style.display = 'none';
}

function onFollowedTagInput(val) {
  const ac = document.getElementById('followed-tag-autocomplete');
  const q = val.trim().toLowerCase();
  const assigned = followedTagMap[editingFollowedId] || [];
  const filtered = allTags.filter(t => !assigned.includes(t.id) && (!q || t.name.toLowerCase().includes(q)));
  const exactMatch = allTags.find(t => t.name.toLowerCase() === q);
  const showCreate = q && !exactMatch;
  if (!filtered.length && !showCreate) { ac.style.display = 'none'; return; }
  ac.innerHTML = [
    ...filtered.map(t => `
      <div class="tags-autocomplete-item" onclick="selectFollowedTag('${t.id}')">
        <span class="dot" style="background:${t.color}"></span>${esc(t.name)}
      </div>`),
    showCreate ? `
      <div class="tags-autocomplete-item" onclick="addFollowedTag('${esc(val.trim())}')">
        <span class="dot" style="background:${randomTagColor()}"></span>${esc(val.trim())}
        <span class="new-hint">Créer</span>
      </div>` : ''
  ].join('');
  ac.style.display = 'block';
}

async function selectFollowedTag(tagId) {
  const tag = allTags.find(t => t.id === tagId);
  if (!tag || !editingFollowedId) return;
  const charId = editingFollowedId;
  if (!(followedTagMap[charId] || []).includes(tag.id)) {
    if (!followedTagMap[charId]) followedTagMap[charId] = [];
    followedTagMap[charId].push(tag.id);
    const { error } = await sb.from('followed_character_tags')
      .insert({ user_id: currentUser.id, character_id: charId, tag_id: tag.id });
    if (error) {
      followedTagMap[charId] = followedTagMap[charId].filter(id => id !== tag.id);
      showToast('Erreur lors de l\'ajout du tag.');
      return;
    }
    renderFollowedTagChips(charId);
    renderRosterFilters();
    renderList();
  }
  document.getElementById('followed-tag-input').value = '';
  document.getElementById('followed-tag-autocomplete').style.display = 'none';
}

function onFollowedTagKeydown(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const ac = document.getElementById('followed-tag-autocomplete');
    const active = ac.querySelector('.tags-autocomplete-item.active');
    if (active) active.click();
    else { const v = e.target.value.trim(); if (v) addFollowedTag(v); }
  } else if (e.key === 'Escape') {
    document.getElementById('followed-tag-autocomplete').style.display = 'none';
  }
}
