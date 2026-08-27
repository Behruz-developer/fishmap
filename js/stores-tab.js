// ═══════════════════════════════════════
// FishMap — Do'konlar bo'limi
// ═══════════════════════════════════════

const StoresTab = (() => {
  let _currentSort = 'distance';
  let _searchQuery = '';

  // ── Render ────────────────────────────
  function render() {
    const list = document.getElementById('storesList');
    const count = document.getElementById('storesCount');
    if (!list) return;

    // Faqat do'konlarni olish
    let stores = Spots.getAll().filter(s => s.kind === 'store');

    // Qidirish
    if (_searchQuery) {
      const q = _searchQuery.toLowerCase();
      stores = stores.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      );
    }

    // Saralash
    if (_currentSort === 'distance') {
      stores = stores.sort((a, b) => (a._distanceKm ?? 1e9) - (b._distanceKm ?? 1e9));
    } else if (_currentSort === 'name') {
      stores = stores.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    count.textContent = `${stores.length} ta do'kon`;

    if (!stores.length) {
      list.innerHTML = `
        <div class="stores-empty">
          <div class="stores-empty-icon">🏪</div>
          <div class="stores-empty-title">${_searchQuery ? 'Do\'kon topilmadi' : 'Do\'konlar yo\'q'}</div>
          <div class="stores-empty-sub">${_searchQuery ? 'Boshqa so\'z bilan qidiring' : 'Hozircha do\'kon qo\'shilmagan'}</div>
        </div>
      `;
      return;
    }

    const esc = Utils.escapeHtml;
    list.innerHTML = stores.map(store => {
      const dist = store._distanceKm != null ? Utils.formatDistance(store._distanceKm) : null;
      const hasPhone = store.description && store.description.match(/\+?\d[\d\s\-()]{7,}/);
      const phone = hasPhone ? hasPhone[0].trim() : null;

      return `
        <div class="store-card" data-id="${esc(store.id)}">
          <div class="store-card-header">
            <div class="store-card-icon-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 1.9-1.4L21 8H6.1"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
            </div>
            <div class="store-card-info">
              <div class="store-card-name">${esc(store.name)}</div>
              <div class="store-card-meta">
                ${dist ? `<span class="store-dist">📍 ${esc(dist)}</span>` : ''}
                <span class="store-badge-label">Do'kon</span>
              </div>
            </div>
          </div>
          ${store.description ? `<div class="store-card-desc">${esc(store.description)}</div>` : ''}
          <div class="store-card-actions">
            <button class="store-btn store-btn-map" data-id="${esc(store.id)}" aria-label="Xaritada ko'rish">
              🗺️ Xaritada
            </button>
            ${phone ? `<a class="store-btn store-btn-call" href="tel:${esc(phone)}" aria-label="Qo'ng'iroq">📞 Qo'ng'iroq</a>` : ''}
            <button class="store-btn store-btn-nav" data-lat="${esc(store.lat)}" data-lng="${esc(store.lng)}" aria-label="Yo'l ko'rsat">
              🧭 Yo'l
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ── Event handlers ────────────────────
  function bindEvents() {
    const list = document.getElementById('storesList');
    const searchInput = document.getElementById('storesSearch');
    const sortBtns = document.querySelectorAll('.stores-sort-btn');

    searchInput?.addEventListener('input', () => {
      _searchQuery = searchInput.value.trim();
      render();
    });

    sortBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sortBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _currentSort = btn.dataset.sort;
        render();
      });
    });

    list?.addEventListener('click', e => {
      // Xaritada ko'rish
      const mapBtn = e.target.closest('.store-btn-map');
      if (mapBtn) {
        const store = Spots.getById(mapBtn.dataset.id);
        if (store) {
          // Xarita tabiga o'tish (xarita ko'rinishida) va flyTo
          App.showMapView();
          setTimeout(() => {
            if (MapModule.isReady()) MapModule.flyTo(store.lat, store.lng, 16);
            UI.openSpotDetail(store);
          }, 100);
        }
        return;
      }

      // Yo'l ko'rsatish
      const navBtn = e.target.closest('.store-btn-nav');
      if (navBtn) {
        const url = `https://yandex.uz/maps/?rtext=~${encodeURIComponent(navBtn.dataset.lat)},${encodeURIComponent(navBtn.dataset.lng)}&rtt=auto`;
        window.open(url, '_blank', 'noopener');
        return;
      }

      // Kartochkaga bosish → detail
      const card = e.target.closest('.store-card');
      if (card && !e.target.closest('button, a')) {
        const store = Spots.getById(card.dataset.id);
        if (store) UI.openSpotDetail(store);
      }
    });
  }

  function init() {
    bindEvents();
    render();
  }

  // Spots yangilanganda qayta render qilish
  function refresh() {
    render();
  }

  return { init, refresh };
})();
