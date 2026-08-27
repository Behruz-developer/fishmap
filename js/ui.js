// ═══════════════════════════════════════
// FishMap — UI moduli
// ═══════════════════════════════════════

const UI = (() => {
  let _toastTimer = null;
  let _addMode = 'fishing';
  let _editSpot = null;   // tahrirlanayotgan joy (null bo'lsa — yangi qo'shish)
  const esc = Utils.escapeHtml;
  const storeIcon = (className = '') =>
    `<span class="store-cart-icon ${className}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 1.9-1.4L21 8H6.1"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg></span>`;

  function showToast(msg, type = '') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast ${type}`;
    el.classList.remove('hidden');
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.add('hidden'), 2800);
  }

  // ── Joy kartochkalari (do'kon kartochkasi uslubida) ──
  function renderSpotCards(spots) {
    const row   = document.getElementById('spotsRow');
    const count = document.getElementById('spotCount');

    // Joylar bo'limida do'konlar ko'rsatilmaydi (do'konlar alohida tabda)
    spots = (spots || []).filter(s => s.kind !== 'store');
    count.textContent = `${spots.length} ta joy`;

    if (!spots.length) {
      row.innerHTML = '<div class="spots-empty">🔍 Joy topilmadi</div>';
      return;
    }

    row.innerHTML = spots.map((s) => {
      const dist = s._distanceKm != null ? Utils.formatDistance(s._distanceKm) : null;
      return `
      <div class="store-card spot-card" role="button" tabindex="0" data-id="${esc(s.id)}">
        <div class="store-card-header">
          <div class="store-card-icon-wrap spot-card-icon-wrap">${emojiFor(s.type)}</div>
          <div class="store-card-info">
            <div class="store-card-name">${esc(s.name)}</div>
            <div class="store-card-meta">
              ${dist ? `<span class="store-dist">📍 ${esc(dist)}</span>` : `<span class="store-dist">${esc(s.type || 'Joy')}</span>`}
              <span class="spot-badge ${s.is_paid ? 'badge-paid' : 'badge-free'}">${s.is_paid ? '💰 Pullik' : '🆓 Bepul'}</span>
              ${s.rating ? `<span class="spot-badge badge-rating">⭐ ${esc(s.rating)}</span>` : ''}
            </div>
          </div>
        </div>
        ${s.description ? `<div class="store-card-desc">${esc(s.description)}</div>` : ''}
        <div class="store-card-actions">
          <button class="store-btn spot-btn-map" data-id="${esc(s.id)}" aria-label="Xaritada ko'rish">
            🗺️ Xaritada
          </button>
          <button class="store-btn store-btn-nav spot-btn-nav" data-lat="${esc(s.lat)}" data-lng="${esc(s.lng)}" aria-label="Yo'l ko'rsat">
            🧭 Yo'l
          </button>
        </div>
      </div>`;
    }).join('');
  }

  // ── Batafsil oyna ─────────────────────
  function openSpotDetail(spot) {
    if (!spot) return;
    const isStore = spot.kind === 'store';

    const popupEmoji = document.getElementById('popupEmoji');
    if (isStore) popupEmoji.innerHTML = storeIcon('store-popup-icon');
    else popupEmoji.textContent = emojiFor(spot.type);
    document.getElementById('popupName').textContent  = spot.name || '—';
    document.getElementById('popupDesc').textContent  = spot.description || 'Tavsif yo\'q';

    document.getElementById('popupBadges').innerHTML = isStore
      ? `<span class="spot-badge badge-store">${storeIcon('store-badge-icon')} Baliq ovi do'koni</span>`
      : `
      <span class="spot-badge ${spot.is_paid ? 'badge-paid' : 'badge-free'}">${spot.is_paid ? '💰 Pullik' : '🆓 Bepul'}</span>
      ${spot.rating ? `<span class="spot-badge badge-rating">⭐ ${esc(spot.rating)}</span>` : ''}
      ${spot.is_hot ? '<span class="spot-badge badge-hot">🔥 Mashhur</span>' : ''}
    `;

    const distTxt = spot._distanceKm != null ? Utils.formatDistance(spot._distanceKm) : '—';
    document.getElementById('popupStats').innerHTML = `
      <div class="stat-box">
        <div class="stat-val">${esc(isStore ? '—' : spot.depth || '—')}</div>
        <div class="stat-lbl">${isStore ? 'Do\'kon' : 'Chuqurlik'}</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${esc(spot.type)}</div>
        <div class="stat-lbl">Tur</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${esc(distTxt)}</div>
        <div class="stat-lbl">Masofa</div>
      </div>
    `;

    const fish = spot.fish_types || [];
    const fishEl = document.getElementById('popupFish');
    fishEl.style.display = isStore ? 'none' : '';
    fishEl.innerHTML =
      fish.length
        ? fish.map(f => `<span class="fish-tag">🐟 ${esc(f)}</span>`).join('')
        : '<span style="font-size:13px;color:#aaa">Ma\'lumot yo\'q</span>';

    const author = spot.profiles?.full_name || 'Noma\'lum';
    document.getElementById('popupAuthor').textContent = `➕ Qo'shgan: ${author}`;

    document.getElementById('popupNav').onclick = () => {
      const url = `https://yandex.uz/maps/?rtext=~${encodeURIComponent(spot.lat)},${encodeURIComponent(spot.lng)}&rtt=auto`;
      window.open(url, '_blank', 'noopener');
    };

    // Ob-havo (asinxron — popup ochilishini kutmaydi)
    const weatherEl = document.getElementById('popupWeather');
    weatherEl.style.display = isStore ? 'none' : '';
    if (!isStore) Weather.renderInto(weatherEl, spot.lat, spot.lng);

    MapModule.flyTo(spot.lat, spot.lng);

    document.getElementById('popupOverlay').classList.remove('hidden');
  }

  function closePopupDetail() {
    document.getElementById('popupOverlay').classList.add('hidden');
  }

  function openAddModal(mode = 'fishing', spot = null) {
    _addMode = mode;
    _editSpot = spot;
    const isStore = mode === 'store';
    document.getElementById('addSpotModal').classList.toggle('store-mode', isStore);
    document.getElementById('addModalTitle').textContent =
      spot ? (isStore ? "✏️ Do'konni tahrirlash" : '✏️ Joyni tahrirlash')
           : (isStore ? "Do'kon qo'shish" : "📍 Yangi joy qo'shish");
    document.getElementById('newType').value = spot?.type || (isStore ? "Baliq ovi do'koni" : "Ko'l");

    // Tahrirlash rejimi — maydonlarni to'ldirish
    if (spot) {
      document.getElementById('newName').value  = spot.name || '';
      document.getElementById('newFish').value  = (spot.fish_types || []).join(', ');
      document.getElementById('newDesc').value  = spot.description || '';
      document.getElementById('newDepth').value = spot.depth || '';
      document.getElementById('newPaid').value  = String(!!spot.is_paid);
      const coords = document.getElementById('selectedCoords');
      if (coords) coords.textContent = `${spot.lat}, ${spot.lng}`;
    }
    document.getElementById('addSpotModal').classList.remove('hidden');
  }

  function resetAddForm() {
    document.getElementById('selectedCoords').textContent = 'Hali tanlanmagan';
    document.getElementById('newName').value    = '';
    document.getElementById('newFish').value    = '';
    document.getElementById('newDesc').value    = '';
    document.getElementById('newDepth').value   = '';
    document.getElementById('newPaid').value    = 'false';
  }

  let _pickingActive = false; // picking rejimi kuzatuvi (Esc uchun)

  function cancelPicking() {
    if (!_pickingActive) return;
    _pickingActive = false;
    MapModule.disablePickingMode();
    const btn = document.getElementById('btnPickLocation');
    if (btn) {
      btn.classList.remove('picking');
      btn.textContent = '🗺️ Xaritadan joy tanlash';
    }
    // Modalni qayta ochamiz — foydalanuvchi davom eta oladi
    document.getElementById('addSpotModal').classList.remove('hidden');
  }

  function startPickingLocation() {
    try {
      // Admin paneldan qo'shsa ham xarita ko'rinadigan bo'lsin — xarita tabiga o'tamiz
      if (typeof App !== 'undefined' && App.showMapView) {
        App.showMapView();
      }
      document.getElementById('addSpotModal').classList.add('hidden');

      const btn = document.getElementById('btnPickLocation');
      if (btn) {
        btn.classList.add('picking');
        btn.textContent = '📍 Xaritada bosing...';
      }
      _pickingActive = true;

      MapModule.enablePickingMode((coords) => {
        if (!coords) {
          UI.showToast('Joy tanlanmadi — qayta urinib ko\'ring', 'error');
          return;
        }
        const lat = coords[0].toFixed(5);
        const lng = coords[1].toFixed(5);
        document.getElementById('selectedCoords').textContent = `${lat}, ${lng}`;
        // Belgini saqlab qolamiz — tanlangan joy xaritada ko'rinib tursin
        MapModule.disablePickingMode(true);
        _pickingActive = false;

        if (btn) {
          btn.classList.remove('picking');
          btn.textContent = '🗺️ Xaritadan joy tanlash';
        }

        document.getElementById('addSpotModal').classList.remove('hidden');
      });
    } catch (err) {
      console.error('[PickLocation]', err);
      _pickingActive = false;
      UI.showToast('Joy tanlashda xatolik yuz berdi', 'error');
      document.getElementById('addSpotModal').classList.remove('hidden');
    }
  }

  // Picking paytida Esc — bekor qilish
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cancelPicking();
  });

  function closeAddModal() {
    document.getElementById('addSpotModal').classList.add('hidden');
    MapModule.disablePickingMode();
    _pickingActive = false;
    resetAddForm();
    _addMode = 'fishing';
    _editSpot = null;
  }

  // ── Oflayn/onlayn indikator ───────────
  function setOfflineBanner(offline) {
    let el = document.getElementById('offlineBanner');
    if (offline) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'offlineBanner';
        el.className = 'offline-banner';
        el.textContent = '📵 Internet yo\'q — saqlangan ma\'lumotlar ko\'rsatilmoqda';
        document.body.appendChild(el);
      }
    } else if (el) {
      el.remove();
    }
  }

  function emojiFor(type) {
    const map = { "Ko'l": '🏞️', 'Daryo': '🌊', 'Hovuz': '🌿', 'Suv ombori': '💧' };
    return map[type] || '🎣';
  }

  return { showToast, renderSpotCards, openSpotDetail, closePopupDetail,
           openAddModal, closeAddModal, startPickingLocation, resetAddForm,
           getAddMode: () => _addMode,
           getEditSpot: () => _editSpot,
           setOfflineBanner, emojiFor };
})();
