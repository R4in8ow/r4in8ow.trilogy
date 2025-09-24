async function loadMovies() {
  const res = await fetch('movies.json');
  return await res.json();
}

function makeCard(movie) {
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <img src="${movie.poster || ''}" alt="${movie.title}">
    <div class="meta">
      <h3>${movie.title} ${movie.year ? `(${movie.year})` : ''}</h3>
      <p>${movie.desc || ''}</p>
      <button>▶️ ကြည့်မည်</button>
    </div>
  `;
  div.querySelector('button').addEventListener('click', () => play(movie.driveId));
  return div;
}

function play(driveId) {
  const src = `https://drive.google.com/file/d/${driveId}/preview`;
  const wrap = document.getElementById('playerWrap');
  const iframe = document.getElementById('player');
  iframe.src = src;           // Drive preview ကို iframe နဲ့ embed
  wrap.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closePlayer() {
  const wrap = document.getElementById('playerWrap');
  const iframe = document.getElementById('player');
  iframe.src = ''; // stop loading
  wrap.classList.add('hidden');
}

function setupSearch(items) {
  const input = document.getElementById('search');
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    const filtered = items.filter(m => m.title.toLowerCase().includes(q));
    renderGrid(filtered);
  });
}

function renderGrid(items) {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  items.forEach(m => grid.appendChild(makeCard(m)));
}

document.getElementById('closePlayer').addEventListener('click', closePlayer);

loadMovies().then(movies => {
  renderGrid(movies);
  setupSearch(movies);
});
