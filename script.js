// script.js
const GRID_ID = 'grid';
const PLAYER_WRAP_ID = 'playerWrap';
const PLAYER_IFRAME_ID = 'player';
const CLOSE_BTN_ID = 'closePlayer';
const SEARCH_ID = 'search';
const HASH_KEY = 'v'; // #v=FILE_ID

const DRIVE_ID_RE = /^[a-zA-Z0-9_-]{20,}$/; // မမှန်တာ filter

function drivePreviewUrl(id) {
  return `https://drive.google.com/file/d/${id}/preview`;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') node.className = v;
    else if (k === 'dataset') Object.entries(v).forEach(([dk, dv]) => (node.dataset[dk] = dv));
    else if (k in node) node[k] = v;
    else node.setAttribute(k, v);
  });
  children.forEach(c => node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return node;
}

async function loadMovies() {
  try {
    const res = await fetch('movies.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('movies.json must be an array');
    // sanitize + basic sort
    return data
      .filter(m => m && typeof m.title === 'string')
      .map(m => ({
        title: String(m.title || '').trim(),
        year: Number.isFinite(m.year) ? m.year : undefined,
        driveId: String(m.driveId || '').trim(),
        poster: String(m.poster || '').trim(),
        desc: String(m.desc || '').trim(),
      }))
      .sort((a, b) => (b.year || 0) - (a.year || 0) || a.title.localeCompare(b.title));
  } catch (e) {
    showError(`movies.json ကိုဖတ်ရာတွင် ပြဿနာ ဖြစ်ခဲ့ပါတယ် — ${e.message}`);
    return [];
  }
}

function showError(msg) {
  const grid = document.getElementById(GRID_ID);
  grid.innerHTML = '';
  grid.appendChild(el('div', { className: 'card' }, [
    el('div', { className: 'meta' }, [el('h3', {}, ['Error']), el('p', {}, [msg])]),
  ]));
}

function makeCard(movie) {
  const card = el('div', { className: 'card' });

  const img = el('img', {
    alt: movie.title,
    loading: 'lazy',
    src: movie.poster || '',
    onerror: (e) => { e.target.style.display = 'none'; },
  });

  const meta = el('div', { className: 'meta' });
  const h3 = el('h3', {}, [movie.title, movie.year ? ` (${movie.year})` : '']);
  const p = el('p', {}, [movie.desc || '']);
  const btn = el('button', { type: 'button', 'aria-label': `Play ${movie.title}` }, ['▶️ ကြည့်မည်']);

  btn.addEventListener('click', () => play(movie.driveId));
  meta.append(h3, p, btn);
  card.append(img, meta);
  return card;
}

function renderGrid(items) {
  const grid = document.getElementById(GRID_ID);
  grid.innerHTML = '';
  items.forEach(m => grid.appendChild(makeCard(m)));
}

function setPlayerSrc(id) {
  const iframe = document.getElementById(PLAYER_IFRAME_ID);
  iframe.src = id ? drivePreviewUrl(id) : '';
}

function openPlayer() {
  const wrap = document.getElementById(PLAYER_WRAP_ID);
  wrap.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closePlayer() {
  const wrap = document.getElementById(PLAYER_WRAP_ID);
  wrap.classList.add('hidden');
  setPlayerSrc('');
  // clear hash but keep scroll position
  history.pushState('', document.title, window.location.pathname + window.location.search);
}

function play(driveId) {
  if (!DRIVE_ID_RE.test(driveId)) {
    alert('မမှန်ကန်သော Drive ID ဖြစ်နိုင်ပါတယ်');
    return;
  }
  setPlayerSrc(driveId);
  openPlayer();
  // update hash for deep-link
  const url = new URL(window.location);
  url.hash = `${HASH_KEY}=${driveId}`;
  history.pushState({ driveId }, '', url);
}

function setupPlayerControls() {
  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePlayer();
  });
  // overlay click to close (optional: if you wrap iframe)
  document.getElementById(CLOSE_BTN_ID).addEventListener('click', closePlayer);
  // back/forward
  window.addEventListener('popstate', () => {
    const id = parseHashId();
    if (id) { setPlayerSrc(id); openPlayer(); }
    else { closePlayer(); }
  });
}

function parseHashId() {
  if (!location.hash) return '';
  const h = location.hash.replace(/^#/, '');
  const params = new URLSearchParams(h.includes('=') ? h : `${HASH_KEY}=${h}`);
  const id = params.get(HASH_KEY) || '';
  return DRIVE_ID_RE.test(id) ? id : '';
}

function setupSearch(items) {
  const input = document.getElementById(SEARCH_ID);

  const doFilter = () => {
    const q = input.value.toLowerCase().trim();
    const filtered = items.filter(m => m.title.toLowerCase().includes(q));
    renderGrid(filtered);
  };

  let t = null;
  input.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(doFilter, 150); // debounce
  });
}

(async function init() {
  setupPlayerControls();
  const movies = await loadMovies();
  renderGrid(movies);
  setupSearch(movies);

  // If URL has #v=FILE_ID, auto open
  const fromHash = parseHashId();
  if (fromHash) {
    setPlayerSrc(fromHash);
    openPlayer();
  }
})();
