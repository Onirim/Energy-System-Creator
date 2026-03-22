// ══════════════════════════════════════════════════════════════
// ENERGY SYSTEM — Module Éditeur de personnage
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
  if (!state.aptitudes)    state.aptitudes    = {};
  if (!state.powers)       state.powers       = [];
  if (!state.traits)       state.traits       = [];
  if (!state.complications)state.complications= [];
  if (!state.tags)         state.tags         = [];
  if (editingId && charTagMap[editingId]) {
    state.tags = charTagMap[editingId]
      .map(tid => allTags.find(tg => tg.id === tid))
      .filter(Boolean);
  }
  populateEditor();
  showView('editor');
}

function populateEditor() {
  document.getElementById('f-name').value    = state.name || '';
  document.getElementById('f-sub').value     = state.subtitle || '';
  document.getElementById('f-rank').value    = state.rank || 5;
  document.getElementById('f-maturity').value= state.maturity || 'adulte';
  const pubCb = document.getElementById('f-public');
  if (pubCb) {
    pubCb.checked = state.is_public || false;
    document.getElementById('public-label').textContent =
      pubCb.checked ? t('share_code_active') : t('share_code_inactive');
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
  document.getElementById('xp-apt-val').textContent  = state.xp_apt  || 0;
  renderTagChips();
  setIllusPreview(state.illustration_url || '', state.illustration_position || 0);
  updatePreview();
  updatePtsDisplay();
  updateAptPtsDisplay();
}

// ── Attributs ─────────────────────────────────────────────────
function changeAttr(attr, delta) {
  const key = {e:'energy',r:'recovery',v:'vigor'}[attr];
  const nv = Math.max(1, state[key] + delta);
  if (attr === 'r' && nv > state.energy) return;
  state[key] = nv;
  document.getElementById('val-'+attr).textContent = nv;
  updatePtsDisplay();
  updatePreview();
}

function calcAttrCost()   { return (state.energy * 2) + (state.recovery * 3) + state.vigor; }
function calcPowersCost() { return (state.powers || []).reduce((s,p) => s + powerCost(p), 0); }
function powerCost(p)     { const m = {'+1':2,'+2':4,'-1':-1,'-2':-2}; return Math.max(1, 3 + (m[p.mod] || 0)); }
function totalCost()      { return calcAttrCost() + calcPowersCost(); }
function maxPts()         { return (RANK_PTS[Math.min(state.rank, 11)] || 39) + (state.xp_hero || 0); }

function updatePtsDisplay() {
  const used = totalCost(), max = maxPts();
  const el = document.getElementById('pts-display');
  el.textContent = `${used} / ${max}`;
  el.className = 'pts-value ' + (used > max ? 'over' : 'ok');
  ['e','r','v'].forEach(a => {
    const costs = {e:2,r:3,v:1};
    const key = {e:'energy',r:'recovery',v:'vigor'}[a];
    document.getElementById('cost-'+a).textContent = `${state[key] * costs[a]} pts`;
  });
}

function updateRankMax() {
  state.rank = parseInt(document.getElementById('f-rank').value);
  updatePtsDisplay();
  updatePreview();
}

// ── Pouvoirs ──────────────────────────────────────────────────
function renderPowers() {
  document.getElementById('powers-list').innerHTML =
    state.powers.map((p, i) => powerEntryHTML(p, i)).join('');
}

function powerEntryHTML(p, i) {
  const typeOpts = POWER_TYPES().map(pt =>
    `<option value="${pt.value}" ${p.type===pt.value?'selected':''}>${pt.label} — ${pt.desc}</option>`
  ).join('');
  const modOpts = MOD_OPTIONS().map(m =>
    `<option value="${m.value}" ${p.mod===m.value?'selected':''}>${m.label}</option>`
  ).join('');
  return `<div class="power-entry" id="pow-${i}">
    <div class="power-entry-header">
      <input type="text" placeholder="${t('editor_power_name_ph')}" value="${esc(p.name||'')}"
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
      <div class="power-cost-display">${powerCost(p)} pts</div>
    </div>
    <div style="margin-top:7px">
      <input type="text" placeholder="${t('editor_power_desc_ph')}"
        style="width:100%;background:var(--bg4);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:12px;padding:5px 8px;outline:none"
        value="${esc(p.desc||'')}" oninput="state.powers[${i}].desc=this.value;updatePreview()"
        onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
    </div>
  </div>`;
}

function addPower()       { state.powers.push({ name:'', type:'offc', mod:'0', desc:'' }); renderPowers(); updatePtsDisplay(); updatePreview(); }
function removePower(i)   { state.powers.splice(i, 1); renderPowers(); updatePtsDisplay(); updatePreview(); }

// ── Aptitudes ─────────────────────────────────────────────────
function renderAptitudes() {
  const grid = document.getElementById('aptitude-grid');
  const aptList = APTITUDES();
  const half = Math.ceil(aptList.length / 2);
  const left = aptList.slice(0, half), right = aptList.slice(half);

  // Reconstruction de la map aptitude traduite → clé FR pour persistance
  const aptKeyMap = {};
  APTITUDES().forEach((label, i) => { aptKeyMap[label] = APTITUDES_KEYS[i]; });

  let rows = '';
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const aptL = left[i], aptR = right[i];
    const keyL = aptL ? APTITUDES_KEYS[i] : null;
    const keyR = aptR ? APTITUDES_KEYS[i + half] : null;
    const cell = (label, frKey) => label ? `<div class="apt-row">
      <div class="apt-name">${label}</div>
      <div class="apt-ctrl">
        <button onclick="changeApt('${frKey}',-1)">−</button>
        <div class="apt-val ${(state.aptitudes[frKey]||0)===0?'zero':''}" id="apt-${frKey.replace(/\s/g,'_')}">${state.aptitudes[frKey]||0}</div>
        <button onclick="changeApt('${frKey}',1)">+</button>
      </div>
    </div>` : '<div></div>';
    rows += cell(aptL, keyL) + '<div class="aptitude-col-sep"></div>' + cell(aptR, keyR);
  }
  grid.innerHTML = rows;
}

function changeApt(frKey, delta) {
  const nv = Math.max(0, (state.aptitudes[frKey] || 0) + delta);
  state.aptitudes[frKey] = nv;
  const el = document.getElementById(`apt-${frKey.replace(/\s/g,'_')}`);
  if (el) { el.textContent = nv; el.className = `apt-val ${nv===0?'zero':''}`; }
  updateAptPtsDisplay(); updatePreview();
}

function calcAptPts() {
  return Object.values(state.aptitudes||{}).reduce((s,v)=>s+v,0)
       + (state.traits||[]).reduce((s,tr)=>s+(tr.bonus||1),0);
}

function updateAptPtsDisplay() {
  const used = calcAptPts();
  const max  = MATURITY_PTS[state.maturity || 'adulte'] + (state.xp_apt || 0);
  const el   = document.getElementById('apt-pts-display');
  el.textContent = `${used} / ${max}`;
  el.className = `val ${used > max ? 'over' : 'ok'}`;
}

// ── Traits ────────────────────────────────────────────────────
function renderTraits() {
  document.getElementById('traits-list').innerHTML = (state.traits||[]).map((tr,i) => `
    <div class="trait-row">
      <input class="trait-name" type="text" placeholder="${t('editor_trait_name_ph')}" value="${esc(tr.name||'')}"
        oninput="state.traits[${i}].name=this.value;updatePreview()">
      <div class="trait-bonus">
        <button style="width:22px;height:22px;border-radius:3px;background:var(--bg4);border:1px solid var(--border);color:var(--text2);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center" onclick="changeTrait(${i},-1)">−</button>
        <div class="trait-bonus-val">+${tr.bonus||1}</div>
        <button style="width:22px;height:22px;border-radius:3px;background:var(--bg4);border:1px solid var(--border);color:var(--text2);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center" onclick="changeTrait(${i},1)">+</button>
        <span style="font-size:10px;color:var(--text3);margin-left:2px">${tr.bonus||1} pt${(tr.bonus||1)>1?'s':''}</span>
      </div>
      <button class="rm-btn" onclick="removeTrait(${i})">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
        </svg>
      </button>
    </div>`).join('');
}

function addTrait()          { state.traits.push({ name:'', bonus:1 }); renderTraits(); updateAptPtsDisplay(); updatePreview(); }
function removeTrait(i)      { state.traits.splice(i,1); renderTraits(); updateAptPtsDisplay(); updatePreview(); }
function changeTrait(i,delta){ state.traits[i].bonus = Math.max(1,(state.traits[i].bonus||1)+delta); renderTraits(); updateAptPtsDisplay(); updatePreview(); }

// ── Expérience ────────────────────────────────────────────────
function changeXP(type, delta) {
  const key  = type === 'hero' ? 'xp_hero' : 'xp_apt';
  const elId = type === 'hero' ? 'xp-hero-val' : 'xp-apt-val';
  state[key] = Math.max(0, (state[key] || 0) + delta);
  document.getElementById(elId).textContent = state[key];
  if (type === 'hero') updatePtsDisplay(); else updateAptPtsDisplay();
  updatePreview();
}

// ── Complications ─────────────────────────────────────────────
function renderComplications() {
  document.getElementById('complications-list').innerHTML = (state.complications||[]).map((c,i) => {
    const label  = typeof c === 'object' ? (c.label||'')  : c;
    const detail = typeof c === 'object' ? (c.detail||'') : '';
    return `<div class="compl-entry">
      <div class="compl-entry-header">
        <input type="text" placeholder="${t('editor_complication_name_ph')}" value="${esc(label)}"
          oninput="setComplLabel(${i}, this.value)">
        <button class="rm-btn" onclick="removeComplication(${i})">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
          </svg>
        </button>
      </div>
      <textarea placeholder="${t('editor_complication_detail_ph')}" oninput="setComplDetail(${i}, this.value)">${esc(detail)}</textarea>
    </div>`;
  }).join('');
  document.getElementById('add-compl-btn').style.display =
    (state.complications||[]).length >= 5 ? 'none' : 'block';
}

function setComplLabel(i, val)  { if (typeof state.complications[i] !== 'object') state.complications[i]={label:'',detail:''}; state.complications[i].label=val; updatePreview(); }
function setComplDetail(i, val) { if (typeof state.complications[i] !== 'object') state.complications[i]={label:'',detail:''}; state.complications[i].detail=val; updatePreview(); }
function addComplication()      { if ((state.complications||[]).length>=5) return; state.complications.push({label:'',detail:''}); renderComplications(); }
function removeComplication(i)  { state.complications.splice(i,1); renderComplications(); updatePreview(); }

// ── Preview ───────────────────────────────────────────────────
function updatePreview() {
  state.name     = document.getElementById('f-name').value;
  state.subtitle = document.getElementById('f-sub').value;
  state.rank     = parseInt(document.getElementById('f-rank').value);
  state.maturity = document.getElementById('f-maturity').value;
  updateAptPtsDisplay();

  const pubCb = document.getElementById('f-public');
  if (pubCb) {
    state.is_public = pubCb.checked;
    document.getElementById('public-label').textContent =
      pubCb.checked ? t('share_code_active') : t('share_code_inactive');
  }
  const scBox = document.getElementById('share-code-box');
  const scVal = document.getElementById('share-code-val');
  if (scBox && scVal) {
    const code = state.share_code || (editingId && chars[editingId]?.share_code) || null;
    if (state.is_public && code) { scVal.textContent = code; scBox.style.display = 'flex'; }
    else scBox.style.display = 'none';
  }

  const used = totalCost(), max = maxPts();
  const ptColor = used > max ? 'var(--offc)' : used === max ? 'var(--accent)' : 'var(--mov)';

  const powHtml = (state.powers||[]).filter(p=>p.name).map(p => {
    const pt = POWER_TYPES().find(x => x.value === p.type);
    const modTag = p.mod && p.mod !== '0' ? `<span class="pow-mod-tag">${p.mod}</span>` : '';
    return `<div class="preview-power">
      <span class="pow-badge ${p.type}">${pt?.label||p.type}</span>
      <div class="pow-body">
        <div class="pow-name">${esc(p.name)}${modTag}</div>
        ${p.desc ? `<div class="pow-desc">${esc(p.desc)}</div>` : ''}
      </div>
      <div class="pow-cost">${powerCost(p)} pts</div>
    </div>`;
  }).join('');

  const aptEntries = Object.entries(state.aptitudes||{}).filter(([,v])=>v>0);
  const aptUsed = calcAptPts();
  const aptMax  = MATURITY_PTS[state.maturity || 'adulte'] + (state.xp_apt || 0);
  const aptPtColor = aptUsed > aptMax ? 'var(--offc)' : aptUsed === aptMax ? 'var(--accent)' : 'var(--mov)';

  // Traduit les clés FR stockées vers la langue active pour l'affichage
  const aptHtml = aptEntries.length ? `
    <div class="preview-section-title">${t('preview_section_aptitudes')} <span style="color:${aptPtColor};font-family:var(--font-mono);font-size:10px;margin-left:4px">${aptUsed} / ${aptMax} pts</span></div>
    <div class="apt-preview-grid">
      ${aptEntries.map(([frKey, val]) => {
        const idx = APTITUDES_KEYS.indexOf(frKey);
        const label = idx >= 0 ? APTITUDES()[idx] : frKey;
        return `<div class="apt-preview-row">
          <span class="name">${label}</span>
          <span class="rank-num">${val}</span>
        </div>`;
      }).join('')}
    </div>` : '';

  const traitsWithName = (state.traits||[]).filter(tr=>tr.name);
  const traitsHtml = traitsWithName.length ? `
    <div class="preview-section-title">${t('preview_section_traits')}</div>
    <div class="trait-preview">
      ${traitsWithName.map(tr=>`<div class="trait-chip">${esc(tr.name)}<span class="bonus">+${tr.bonus}</span></div>`).join('')}
    </div>` : '';

  state.background = document.getElementById('f-background')?.value || state.background || '';
  const complHtml = (state.complications||[]).filter(c=>typeof c==='object'?c.label:c).length ? `
    <div class="preview-section-title">${t('preview_section_complications')}</div>
    <div class="compl-preview">
      ${(state.complications||[]).filter(c=>typeof c==='object'?c.label:c).map(c => {
        const label  = typeof c === 'object' ? c.label  : c;
        const detail = typeof c === 'object' ? c.detail : '';
        return `<div class="compl-chip">${esc(label)}${detail?`<div class="compl-detail">${esc(detail)}</div>`:''}</div>`;
      }).join('')}
    </div>` : '';

  const bgHtml = state.background ? `
    <div class="preview-section-title">${t('preview_section_background')}</div>
    <div class="background-preview">${esc(state.background)}</div>` : '';

  document.getElementById('preview-content').innerHTML = `
    ${state.illustration_url ? `<img class="preview-illus" src="${esc(state.illustration_url)}" style="object-position:center ${state.illustration_position||0}%" onclick="openLightbox('${esc(state.illustration_url)}')" alt="">` : ''}
    <div class="preview-header">
      <div class="preview-name">${esc(state.name) || '—'}</div>
      ${state.subtitle ? `<div class="preview-sub">${esc(state.subtitle)}</div>` : ''}
      <div class="preview-rank-badge">${t('rank_label')}${state.rank}</div>
    </div>
    <div class="preview-section-title">${t('preview_section_attrs')} <span style="color:${ptColor};font-family:var(--font-mono);font-size:10px;margin-left:4px">${used} / ${max} pts</span></div>
    <div class="preview-attrs">
      <div class="preview-attr e">
        <div class="val">${state.energy}</div><div class="lbl">${t('preview_attr_energy')}</div>
        <div class="cost">${state.energy*2} ${t('preview_attr_cost_energy')}</div>
        <div class="pips">${pipRow(state.energy, 'e', 10)}</div>
      </div>
      <div class="preview-attr r">
        <div class="val">${state.recovery}</div><div class="lbl">${t('preview_attr_recovery')}</div>
        <div class="cost">${state.recovery*3} ${t('preview_attr_cost_recovery')}</div>
        <div class="pips">${pipRow(state.recovery, 'r', 10)}</div>
      </div>
      <div class="preview-attr v">
        <div class="val">${state.vigor}</div><div class="lbl">${t('preview_attr_vigor')}</div>
        <div class="cost">${state.vigor} ${t('preview_attr_cost_vigor')}</div>
        <div class="pips">${pipRow(state.vigor, 'v', 10)}</div>
      </div>
    </div>
    ${(state.powers||[]).filter(p=>p.name).length ? `<div class="preview-section-title">${t('preview_section_powers')}</div>${powHtml}` : ''}
    ${aptHtml}${traitsHtml}${complHtml}${bgHtml}
  `;
}

function pipRow(val, cls, max) {
  return Array.from({length:max}, (_,i) =>
    `<div class="pip ${i < val ? cls : 'empty'}"></div>`
  ).join('');
}

// ── Save / Share ──────────────────────────────────────────────
function saveChar() { saveCharToDB(); }

function shareChar() {
  if (!state.is_public) { showToast(t('toast_share_need_public')); return; }
  const code = state.share_code || (editingId && chars[editingId]?.share_code);
  if (!code) { showToast(t('toast_share_need_save')); return; }
  copyUrl(buildShareUrl('char', code));
}

function copyShareCode() {
  const code = document.getElementById('share-code-val')?.textContent;
  if (!code || code === '—') return;
  navigator.clipboard.writeText(code)
    .then(() => showToast(ti('toast_code_copied', { code })))
    .catch(() => prompt(t('share_code_prompt_short'), code));
}

// ── Mobile tabs ───────────────────────────────────────────────
function switchMobTab(tab) {
  const form    = document.getElementById('editor-form');
  const preview = document.getElementById('preview-panel');
  const btnForm = document.getElementById('mob-tab-form');
  const btnPrev = document.getElementById('mob-tab-preview');
  if (!form || !preview) return;
  if (tab === 'form') {
    form.classList.remove('mob-hidden');    preview.classList.add('mob-hidden');
    btnForm?.classList.add('active');       btnPrev?.classList.remove('active');
  } else {
    form.classList.add('mob-hidden');       preview.classList.remove('mob-hidden');
    btnForm?.classList.remove('active');    btnPrev?.classList.add('active');
  }
}
