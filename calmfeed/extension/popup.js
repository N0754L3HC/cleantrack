const $ = id => document.getElementById(id);
let state = {};

function save(patch) {
  Object.assign(state, patch);
  chrome.storage.local.set(patch);
}

function render() {
  const pro = !!state.pro;
  $('proBadge').classList.toggle('hidden', !pro);
  $('upsell').classList.toggle('hidden', pro);
  $('kwLock').classList.toggle('hidden', pro);
  $('loginLink').classList.toggle('hidden', pro);
  $('manageLink').classList.toggle('hidden', !pro);
  $('enabled').checked = state.enabled !== false;
  $('price').textContent = CALMFEED.PRICE_LABEL;

  const stats = state.stats || {};
  const today = new Date().toISOString().slice(0, 10);
  $('today').textContent = stats.day === today ? stats.today || 0 : 0;
  $('total').textContent = stats.total || 0;

  // Feed health (only shown if the feed was open in the last 30 minutes)
  const h = state.health;
  const hp = $('health');
  if (h && Date.now() - h.at < 30 * 60 * 1000) {
    hp.classList.remove('hidden');
    hp.classList.toggle('ok', h.posts > 0);
    hp.classList.toggle('warn', h.posts === 0);
    hp.textContent = h.posts > 0
      ? `Working: checking ${h.posts} posts on your feed`
      : '⚠ Can\'t see your feed yet. Scroll it a little; if this stays, LinkedIn may have changed.';
  } else {
    hp.classList.add('hidden');
  }

  const filters = { ...CALMFEED.DEFAULTS.filters, ...(state.filters || {}) };
  const ul = $('filters');
  ul.textContent = '';
  for (const f of CALMFEED.FILTERS) {
    const locked = f.pro && !pro;
    const li = document.createElement('li');
    if (locked) li.className = 'locked';
    const lbl = document.createElement('span');
    lbl.className = 'lbl';
    lbl.textContent = f.label;
    if (locked) {
      const lock = document.createElement('span');
      lock.className = 'lock';
      lock.textContent = 'PRO';
      lbl.appendChild(lock);
    }
    const sw = document.createElement('label');
    sw.className = 'switch';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !locked && !!filters[f.id];
    input.addEventListener('change', () => {
      if (locked) { input.checked = false; upgrade(); return; }
      save({ filters: { ...filters, [f.id]: input.checked } });
      render();
    });
    sw.append(input, document.createElement('span'));
    li.append(lbl, sw);
    ul.appendChild(li);
  }

  const chips = $('kwList');
  chips.textContent = '';
  (state.keywords || []).forEach((k, i) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = k;
    const x = document.createElement('button');
    x.textContent = '×';
    x.title = 'Remove';
    x.addEventListener('click', () => {
      const keywords = state.keywords.filter((_, j) => j !== i);
      save({ keywords });
      render();
    });
    chip.appendChild(x);
    chips.appendChild(chip);
  });
}

function upgrade() {
  chrome.runtime.sendMessage({ type: 'upgrade' });
}

$('enabled').addEventListener('change', e => save({ enabled: e.target.checked }));
$('upgradeBtn').addEventListener('click', upgrade);
$('loginLink').addEventListener('click', e => { e.preventDefault(); chrome.runtime.sendMessage({ type: 'login' }); });
$('manageLink').addEventListener('click', e => { e.preventDefault(); upgrade(); });
$('kwForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!state.pro) { upgrade(); return; }
  const v = $('kwInput').value.trim().replace(/^["']|["']$/g, '');
  if (!v) return;
  const keywords = [...(state.keywords || [])];
  if (!keywords.some(k => k.toLowerCase() === v.toLowerCase())) keywords.push(v);
  $('kwInput').value = '';
  save({ keywords });
  render();
});

chrome.storage.local.get(null, d => {
  state = d;
  render();
  // Re-check paid status each time the popup opens (catches new payments and cancellations).
  chrome.runtime.sendMessage({ type: 'sync' }, () => {
    chrome.storage.local.get(['pro'], p => {
      if (!!p.pro !== !!state.pro) { state.pro = p.pro; render(); }
    });
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  for (const k in changes) state[k] = changes[k].newValue;
  if (changes.pro || changes.stats || changes.health) render();
});
