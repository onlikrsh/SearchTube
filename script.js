const API_KEY = config.api_key;
const API = 'https://www.googleapis.com/youtube/v3';

const state = {
    query: '',
    filter: '',
    sort: 'relevance',
    pageToken: null,
    scrollY: 0
};

const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('resultsContainer');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const sortSelect = document.getElementById('sortSelect');
const playerSection = document.getElementById('playerSection');
const chips = document.querySelectorAll('.filter-chip');

// --- Utilities ---

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function formatViews(n) {
    n = parseInt(n);
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString();
}

function timeAgo(dateStr) {
    const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    const units = [
        [31536000, 'year'], [2592000, 'month'], [86400, 'day'],
        [3600, 'hour'], [60, 'minute']
    ];
    for (const [sec, label] of units) {
        const count = Math.floor(seconds / sec);
        if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
}

function setView(view) {
    document.body.dataset.view = view;
}

// --- Skeleton Loading ---

function showSkeletons(count = 6) {
    resultsContainer.innerHTML = Array.from({ length: count }, () => `
        <div class="skeleton-card">
            <div class="skeleton skeleton-thumb"></div>
            <div class="skeleton-info">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-meta"></div>
                <div class="skeleton skeleton-desc"></div>
            </div>
        </div>
    `).join('');
}

// --- Search ---

function search(append = false) {
    const query = searchInput.value.trim();
    if (!query) return;

    state.query = query;

    if (!append) {
        state.pageToken = null;
        showSkeletons();
        loadMoreBtn.hidden = true;
    } else {
        loadMoreBtn.textContent = 'Loading...';
        loadMoreBtn.disabled = true;
    }

    setView('results');

    const type = state.filter || 'video,playlist,channel';
    let url = `${API}/search?part=snippet&q=${encodeURIComponent(query)}&type=${type}&order=${state.sort}&maxResults=12&key=${API_KEY}`;
    if (append && state.pageToken) url += `&pageToken=${state.pageToken}`;

    fetch(url)
        .then(r => {
            if (r.status === 403) throw new Error('rate');
            if (!r.ok) throw new Error('api');
            return r.json();
        })
        .then(data => {
            state.pageToken = data.nextPageToken || null;
            const items = data.items || [];

            if (!items.length && !append) return showEmpty();

            const videoIds = items.filter(i => i.id.videoId).map(i => i.id.videoId);
            if (videoIds.length) {
                return fetchStats(videoIds).then(stats => renderResults(items, stats, append));
            }
            renderResults(items, {}, append);
        })
        .catch(showError);
}

function fetchStats(ids) {
    return fetch(`${API}/videos?part=statistics,snippet&id=${ids.join(',')}&key=${API_KEY}`)
        .then(r => r.json())
        .then(data => {
            const map = {};
            (data.items || []).forEach(v => {
                map[v.id] = { views: v.statistics.viewCount, date: v.snippet.publishedAt };
            });
            return map;
        })
        .catch(() => ({}));
}

// --- Render Results ---

function renderResults(items, stats, append) {
    if (!append) resultsContainer.innerHTML = '';

    items.forEach((item, i) => {
        const { snippet, id } = item;
        const card = document.createElement('div');
        card.className = 'result-card';
        card.tabIndex = 0;
        card.style.setProperty('--delay', `${i * 0.05}s`);

        let type = 'video', meta = '', badge = '';

        if (id.videoId) {
            const s = stats[id.videoId];
            if (s) meta = `<div class="meta"><span>${formatViews(s.views)} views</span><span>${timeAgo(s.date)}</span></div>`;
        } else if (id.playlistId) {
            type = 'playlist';
            badge = '<span class="badge">Playlist</span>';
        } else if (id.channelId) {
            type = 'channel';
            badge = '<span class="badge">Channel</span>';
        }

        const thumb = snippet.thumbnails.high?.url || snippet.thumbnails.medium?.url || snippet.thumbnails.default.url;

        card.innerHTML = `
            <div class="thumb"><img src="${thumb}" alt="" loading="lazy"></div>
            <div class="info">
                <div class="title">${esc(snippet.title)}</div>
                <div class="channel">${esc(snippet.channelTitle)} ${badge}</div>
                ${meta}
                <div class="desc">${esc(snippet.description)}</div>
            </div>
        `;

        const handleClick = () => {
            if (type === 'video') {
                openPlayer(id.videoId);
            } else {
                const url = type === 'playlist'
                    ? `https://www.youtube.com/playlist?list=${id.playlistId}`
                    : `https://www.youtube.com/channel/${id.channelId}`;
                window.open(url, '_blank', 'noopener');
            }
        };

        card.addEventListener('click', handleClick);
        card.addEventListener('keydown', e => { if (e.key === 'Enter') handleClick(); });

        resultsContainer.appendChild(card);
    });

    loadMoreBtn.hidden = !state.pageToken;
    loadMoreBtn.textContent = 'Load More';
    loadMoreBtn.disabled = false;
}

// --- Error / Empty States ---

function showEmpty() {
    resultsContainer.innerHTML = `
        <div class="error-state">
            <p>No results found for "${esc(state.query)}".</p>
        </div>
    `;
    loadMoreBtn.hidden = true;
}

function showError(err) {
    const msgs = {
        rate: 'Too many requests. Please wait a moment.',
        api: 'Something went wrong. Please try again.'
    };

    resultsContainer.innerHTML = `
        <div class="error-state">
            <p>${msgs[err.message] || "Couldn't connect. Check your internet and try again."}</p>
            <button onclick="search()">Try again</button>
        </div>
    `;

    loadMoreBtn.hidden = true;
    loadMoreBtn.textContent = 'Load More';
    loadMoreBtn.disabled = false;
}

// --- Player ---

function openPlayer(videoId) {
    state.scrollY = window.scrollY;
    setView('player');
    window.scrollTo(0, 0);

    playerSection.innerHTML = `
        <button class="back-btn" onclick="closePlayer()">&#8592; Back to results</button>
        <div class="player-loading">
            <div class="skeleton" style="width:100%;aspect-ratio:16/9;border-radius:12px"></div>
        </div>
    `;

    fetch(`${API}/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`)
        .then(r => {
            if (!r.ok) throw new Error('api');
            return r.json();
        })
        .then(data => {
            if (!data.items?.length) throw new Error('api');
            renderPlayer(videoId, data.items[0]);
        })
        .catch(() => {
            playerSection.innerHTML = `
                <div class="error-state">
                    <p>Couldn't load video details.</p>
                    <button onclick="closePlayer()">Back to results</button>
                </div>
            `;
        });
}

function renderPlayer(videoId, video) {
    const { snippet, statistics } = video;
    const desc = esc(snippet.description);
    const needsToggle = snippet.description.length > 200;

    playerSection.innerHTML = `
        <button class="back-btn" onclick="closePlayer()">&#8592; Back to results</button>
        <div class="player-wrap">
            <iframe
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowfullscreen
            ></iframe>
        </div>
        <div class="video-info">
            <h2>${esc(snippet.title)}</h2>
            <div class="video-meta">
                <span>${esc(snippet.channelTitle)}</span>
                <span>${formatViews(statistics.viewCount)} views</span>
                <span>${timeAgo(snippet.publishedAt)}</span>
            </div>
            <div class="video-description">
                <p class="desc-text" id="descText">${desc}</p>
                ${needsToggle ? '<button class="show-more-btn" onclick="toggleDesc()">Show more</button>' : ''}
            </div>
        </div>
    `;
}

function toggleDesc() {
    const text = document.getElementById('descText');
    const btn = text.parentElement.querySelector('.show-more-btn');
    const expanded = text.classList.toggle('expanded');
    btn.textContent = expanded ? 'Show less' : 'Show more';
}

function closePlayer() {
    setView('results');
    requestAnimationFrame(() => window.scrollTo(0, state.scrollY));
}

// --- Event Listeners ---

searchInput.addEventListener('input', () => {
    clearBtn.classList.toggle('visible', searchInput.value.length > 0);
});

searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') search();
});

searchBtn.addEventListener('click', () => search());

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.focus();
    clearBtn.classList.remove('visible');
});

loadMoreBtn.addEventListener('click', () => search(true));

chips.forEach(chip => {
    chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.filter = chip.dataset.type;
        if (state.query) search();
    });
});

sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    if (state.query) search();
});
