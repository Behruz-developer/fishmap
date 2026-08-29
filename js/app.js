// ═══════════════════════════════════════
// FishMap — Asosiy dastur (v2 — PWA)
// ═══════════════════════════════════════

const App = (() => {
  let _currentFilter = { type: 'all', search: '' };
  let _activeTab = 'map';

  function currentFilter() { return _currentFilter; }

  async function start() {
    registerServiceWorker();
    watchConnection();

    Auth.init();

    document.getElementById('btnGoogleLogin')
      .addEventListener('click', () => Auth.signInWithGoogle());

    let appAlreadyStarted = false;

    Auth.listenAuthChanges(async (event, user) => {
      if (event === 'SIGNED_IN' && user) {
        Auth.showMainApp(user);
        if (!appAlreadyStarted) {
          appAlreadyStarted = true;
          await initApp(user);
        }
      } else {
        appAlreadyStarted = false;
        Auth.showLoginScreen();
      }
    });

    const existingUser = await Auth.checkExistingSession();
    if (existingUser) {
      Auth.showMainApp(existingUser);
      // Listener (INITIAL_SESSION) allaqachon ishga tushirgan bo'lishi mumkin —
      // ikki marta init bo'lishining oldini olamiz (xarita 2 marta yaratilmasin)
      if (!appAlreadyStarted) {
        appAlreadyStarted = true;
        await initApp(existingUser);
      }
    } else {
      Auth.showLoginScreen();
    }
  }

  async function initApp(user) {
    // Xarita yuklanmasa ham ilova ishlashda davom etsin
    let mapOk = true;
    try {
      await MapModule.init();
    } catch (err) {
      mapOk = false;
      console.error('[Map]', err);
      UI.showToast('Xarita yuklanmadi — ro\'yxat rejimida ishlaymiz', 'error');
    }

    // Joylashuvni jimgina so'rash
    requestQuietLocation();

    const spots = await Spots.fetchAll();
    if (mapOk) MapModule.renderSpots(spots);
    UI.renderSpotCards(Spots.filter(_currentFilter));

    // Modulllarni ishga tushirish
    Guides.init();
    StoresTab.init();
    Admin.init();
    Profile.init();
    Profile.render(user);

    bindEvents(mapOk);
    bindTabNavigation(mapOk);

    // ── Admin nazorati ──
    // ⚠️ VAQTINCHALIK O'CHIRILDI: xaritadagi FAB tugmalar DOMdan olib tashlangan
    // (index.html'da izohda). Qayta yoqish uchun quyidagi blokni tiklang:
    //
    // const isAdminUser = await Auth.isAdmin();
    // const addSpotButton  = document.getElementById('btnAddSpot');
    // const addStoreButton = document.getElementById('btnAddStore');
    // addSpotButton.classList.toggle('hidden', !isAdminUser);
    // addStoreButton.classList.toggle('hidden', !isAdminUser);

    setupRealtimeSync();

    // Deep link (URL hash)
    const hash = location.hash.replace('#', '');
    if (['map', 'guide', 'stores', 'profile', 'admin'].includes(hash)) {
      switchTab(hash, mapOk);
    }

    // Deep link: manifest shortcut "?action=add" → joy qo'shish oynasi
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      UI.resetAddForm();
      UI.openAddModal('fishing');
      // URLni tozalash — refresh'da yana ochilib qolmasin
      history.replaceState(null, '', location.pathname + location.hash);
    }
  }

  // ── Tab navigatsiyasi ─────────────────
  function bindTabNavigation(mapOk) {
    document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
      item.addEventListener('click', () => {
        // Xarita tabiga qaytganda standart — xarita ko'rinishi
        if (item.dataset.tab === 'map') setContentView('map');
        switchTab(item.dataset.tab, mapOk);
      });
    });
  }

  // ── Ko'rinish: xarita yoki joylar ro'yxati ──
  function setContentView(view) {
    const mainApp = document.getElementById('mainApp');
    const isMap = view === 'map';
    mainApp.classList.toggle('map-only-view', isMap);
    mainApp.classList.toggle('spots-only-view', !isMap);
    localStorage.setItem('fishmap-content-view', isMap ? 'map' : 'spots');
    if (isMap && MapModule.isReady()) {
      requestAnimationFrame(() => MapModule.refreshViewport());
    }
    syncNav();
  }

  // ── Nav tugmalari holatini sinxronlash ──
  // "Xarita" va "Joylar" bir xil tab — qaysi biri aktivini ko'rinish aniqlaydi
  function syncNav() {
    const view = localStorage.getItem('fishmap-content-view') === 'spots' ? 'spots' : 'map';
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
      let active;
      if (item.dataset.viewMode) {
        active = (_activeTab === 'map' && view === 'spots');
      } else if (item.dataset.tab === 'map') {
        active = (_activeTab === 'map' && view === 'map');
      } else {
        active = (_activeTab === item.dataset.tab);
      }
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
  }

  // Do'konlar va boshqa bo'limlardan xaritaga qaytish uchun
  function showMapView() {
    switchTab('map');
    setContentView('map');
  }

  function switchTab(tabName, mapOk) {
    const validTabs = ['map', 'guide', 'stores', 'profile', 'admin'];
    if (!validTabs.includes(tabName)) return;

    _activeTab = tabName;

    // Tab panellarni ko'rsatish/yashirish
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabName}`);
      pane.classList.toggle('hidden', pane.id !== `tab-${tabName}`);
    });

    // Nav tugmalarini yangilash
    syncNav();

    // URL hashni yangilash (back navigation uchun)
    history.replaceState(null, '', `#${tabName}`);

    // Xarita viewportini yangilash (tab ko'ringanda)
    if (tabName === 'map') {
      requestAnimationFrame(() => MapModule.refreshViewport());
    }

    // Do'konlar tabiga o'tganda refresh
    if (tabName === 'stores') {
      StoresTab.refresh();
    }
  }

  // ── Asosiy event'lar ─────────────────
  function bindEvents(mapOk) {
    document.getElementById('fabLocation')
      .addEventListener('click', MapModule.goToLocation);

    const spotsRow = document.getElementById('spotsRow');
    const mainApp  = document.getElementById('mainApp');
    const viewButtons   = document.querySelectorAll('[data-view-mode]');
    const layoutButtons = document.querySelectorAll('[data-spot-layout]');

    const setSpotLayout = (layout) => {
      const isList = layout === 'list';
      mainApp.classList.toggle('cards-only-view', !isList);
      mainApp.classList.toggle('list-only-view', isList);
      spotsRow.classList.toggle('list-view', isList);
      layoutButtons.forEach(button => {
        const active = button.dataset.spotLayout === layout;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      localStorage.setItem('fishmap-spot-layout', layout);
    };

    setContentView(localStorage.getItem('fishmap-content-view') || 'map');
    setSpotLayout(localStorage.getItem('fishmap-spot-layout') || 'cards');

    // "Joylar" tugmasi — xarita tabini ro'yxat ko'rinishida ochadi
    viewButtons.forEach(button => button.addEventListener('click', () => {
      switchTab('map', mapOk);
      setContentView(button.dataset.viewMode);
    }));
    layoutButtons.forEach(button => button.addEventListener('click', () => {
      setSpotLayout(button.dataset.spotLayout);
    }));

    // Joylashuv aniqlangach
    document.addEventListener('fishmap:location', () => applyFilter());

    // Qidirish
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');

    searchInput.addEventListener('input', () => {
      const val = searchInput.value.trim();
      searchClear.classList.toggle('hidden', !val);
      _currentFilter.search = val;
      applyFilter();
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.classList.add('hidden');
      _currentFilter.search = '';
      applyFilter();
    });

    document.getElementById('filterWrap')
      .addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        _currentFilter.type = chip.dataset.filter;

        // "Yaqin" filtrida joylashuv hali ma'lum bo'lmasa — GPS so'raymiz
        if (chip.dataset.filter === 'near' && !Spots.hasUserPosition()) {
          UI.showToast('📍 Sizga yaqin joylar uchun joylashuvingiz aniqlanmoqda...', '');
          MapModule.goToLocation();
        }

        applyFilter();
      });

    // GPS topilganda — "Yaqin" filtr aktiv bo'lsa ro'yxatni yangilaymiz
    document.addEventListener('fishmap:location', () => {
      if (_currentFilter.type === 'near') applyFilter();
    });

    // Spot kartochkalari: event delegation
    spotsRow.addEventListener('click', (e) => {
      // "Xaritada" tugmasi — xarita ko'rinishiga o'tish va joyga flyTo
      const mapBtn = e.target.closest('.spot-btn-map');
      if (mapBtn) {
        const spot = Spots.getById(mapBtn.dataset.id);
        if (spot) {
          showMapView();
          setTimeout(() => {
            if (MapModule.isReady()) MapModule.flyTo(spot.lat, spot.lng, 16);
            UI.openSpotDetail(spot);
          }, 100);
        }
        return;
      }

      // "Yo'l" tugmasi — Yandex navigatsiya
      const navBtn = e.target.closest('.spot-btn-nav');
      if (navBtn) {
        const url = `https://yandex.uz/maps/?rtext=~${encodeURIComponent(navBtn.dataset.lat)},${encodeURIComponent(navBtn.dataset.lng)}&rtt=auto`;
        window.open(url, '_blank', 'noopener');
        return;
      }

      // Kartochkaga bosish → detail
      const card = e.target.closest('.spot-card');
      if (card && !e.target.closest('button, a')) {
        UI.openSpotDetail(Spots.getById(card.dataset.id));
      }
    });
    spotsRow.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.spot-card');
      if (!card) return;
      e.preventDefault();
      UI.openSpotDetail(Spots.getById(card.dataset.id));
    });

    // ⚠️ ESKI FUNKSIYA (hamma user joy qo'sha olardi) — hozircha o'chirilgan, admin uchun pastda.
    // Qayta yoqish uchun shu blokni izohdan chiqaring va admin tekshiruvidagi
    // addSpotButton.classList.toggle('hidden', !isAdminUser) satrini olib tashlang:
    //
    // document.getElementById('btnAddSpot')
    //   .addEventListener('click', () => {
    //     UI.resetAddForm();
    //     UI.openAddModal('fishing');
    //   });

    // ⚠️ VAQTINCHALIK O'CHIRILDI: xaritadagi FAB tugmalar DOMdan olib tashlangan —
    // qo'shish FAQAT Admin panel orqali (adminAddSpotBtn / adminAddStoreBtn).
    // Qayta yoqish uchun index.html'dagi FAB bloki bilan birga shu joylarni tiklang:
    //
    // document.getElementById('btnAddSpot')
    //   .addEventListener('click', () => {
    //     UI.resetAddForm();
    //     UI.openAddModal('fishing');
    //   });
    //
    // document.getElementById('btnAddStore')
    //   .addEventListener('click', () => {
    //     UI.resetAddForm();
    //     UI.openAddModal('store');
    //   });

    document.getElementById('btnPickLocation')
      .addEventListener('click', UI.startPickingLocation);

    document.getElementById('closeAddModal')
      .addEventListener('click', UI.closeAddModal);

    document.getElementById('cancelAddSpot')
      .addEventListener('click', UI.closeAddModal);

    document.getElementById('saveSpot')
      .addEventListener('click', saveNewSpot);

    document.getElementById('popupClose')
      .addEventListener('click', UI.closePopupDetail);

    document.getElementById('popupOverlay')
      .addEventListener('click', (e) => {
        if (e.target === document.getElementById('popupOverlay'))
          UI.closePopupDetail();
      });

    // Escape — ochiq oynani yopish
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!document.getElementById('popupOverlay').classList.contains('hidden')) {
        UI.closePopupDetail();
      } else if (!document.getElementById('addSpotModal').classList.contains('hidden')) {
        UI.closeAddModal();
      } else if (!document.getElementById('guideModal').classList.contains('hidden')) {
        Guides.closeDetail();
      }
    });
  }

  // ── Joylashuv ─────────────────────────
  function requestQuietLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        Spots.setUserPosition(pos.coords.latitude, pos.coords.longitude);
        applyFilter();
        StoresTab.refresh();
        Profile.refresh();
      },
      () => { /* rad etsa — masofasiz davom etamiz */ },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }

  function applyFilter() {
    const filtered = Spots.filter(_currentFilter);
    if (MapModule.isReady()) MapModule.renderSpots(filtered);
    UI.renderSpotCards(filtered);
  }

  // ── Joy saqlash ───────────────────────
  async function saveNewSpot() {
    const name  = document.getElementById('newName').value.trim();
    const fish  = document.getElementById('newFish').value.trim();
    const desc  = document.getElementById('newDesc').value.trim();
    const depth = document.getElementById('newDepth').value.trim();
    const paid  = document.getElementById('newPaid').value === 'true';
    const type  = document.getElementById('newType').value;
    const kind  = UI.getAddMode() === 'store' ? 'store' : 'fishing';
    const coords = MapModule.getPickedCoords();

    if (!name)            { UI.showToast('Joy nomi kiritilmagan!', 'error'); return; }
    if (name.length > 80) { UI.showToast('Joy nomi juda uzun (maks. 80 belgi)', 'error'); return; }
    if (desc.length > 500){ UI.showToast('Tavsif juda uzun (maks. 500 belgi)', 'error'); return; }
    // Koordinata tekshiruvi pastda — tahrirlash rejimida eski koordinata ishlatiladi

    const btn = document.getElementById('saveSpot');
    btn.disabled = true;
    btn.textContent = '⏳ Saqlanmoqda...';

    const editSpot = UI.getEditSpot();

    // Tahrirlash rejimida yangi koordinata tanlanmasa — eski koordinata qoladi
    const finalCoords = coords || (editSpot ? [editSpot.lat, editSpot.lng] : null);
    if (!finalCoords)  { UI.showToast('Xaritada joyni belgilang!', 'error'); btn.disabled = false; btn.textContent = '✅ Saqlash'; return; }

    const payload = {
      name,
      type,
      fish_types:  kind === 'store' ? [] : fish ? fish.split(',').map(f => f.trim()).filter(Boolean).slice(0, 10) : [],
      description: desc,
      depth:       kind === 'store' ? null : depth || null,
      lat:         finalCoords[0],
      lng:         finalCoords[1],
      is_paid:     kind === 'store' ? false : paid,
      kind,
    };

    let spot;
    if (editSpot) {
      spot = await Spots.updateSpot(editSpot.id, payload);
    } else {
      spot = await Spots.addSpot(payload);
    }

    btn.disabled = false;
    btn.textContent = '✅ Saqlash';

    if (spot) {
      UI.closeAddModal();
      UI.showToast(
        editSpot
          ? '✅ Muvaffaqiyatli yangilandi!'
          : (kind === 'store' ? "✅ Do'kon muvaffaqiyatli qo'shildi!" : "✅ Joy muvaffaqiyatli qo'shildi!"),
        'success'
      );
      applyFilter();
      StoresTab.refresh();
      Profile.refresh();
      Admin.refreshSpots();
    }
  }

  // ── Realtime: INSERT / UPDATE / DELETE ──
  function setupRealtimeSync() {
    const db = Auth.getClient();
    db
      .channel('fishing_spots_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'fishing_spots' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            Spots.removeLocal(payload.old?.id);
          } else {
            const spot = payload.new;
            const isNew = !Spots.getById(spot.id);
            Spots.upsertLocal(spot);
            if (isNew && payload.eventType === 'INSERT') {
              UI.showToast(`📍 Yangi joy: ${spot.name}`, 'success');
            }
          }
          applyFilter();
          StoresTab.refresh();
          Profile.refresh();
          Admin.refreshSpots();
        }
      )
      .subscribe();
  }

  // ── PWA Service Worker ────────────────
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('[PWA] Service worker faol:', reg.scope))
        .catch(err => console.warn('[PWA] SW ro\'yxatdan o\'tmadi:', err));
    });
  }

  function watchConnection() {
    const update = () => UI.setOfflineBanner(!navigator.onLine);
    window.addEventListener('online',  () => { update(); UI.showToast('🌐 Internet qaytdi', 'success'); });
    window.addEventListener('offline', update);
    update();
  }

  return { start, currentFilter, applyFilter, switchTab, showMapView };
})();

document.addEventListener('DOMContentLoaded', App.start);
