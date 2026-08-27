// ═══════════════════════════════════════
// FishMap — Xarita moduli (Yandex Maps JS API 2.1)
// ═══════════════════════════════════════

const MapModule = (() => {
  let _map = null;
  let _pickingMode = false;
  let _pickedCoords = null;
  let _onPickCallback = null;
  let _banner = null;
  let _initPromise = null;
  let _layouts = null;

  // ── Yandex Maps skriptini yuklash ─────
  function loadScript() {
    return new Promise((resolve, reject) => {
      if (window.ymaps) { resolve(); return; }
      const s = document.createElement('script');
      s.src = `https://api-maps.yandex.ru/2.1/?apikey=${CONFIG.YANDEX_API_KEY}&lang=ru_RU`;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Yandex Maps skripti yuklanmadi'));
      document.head.appendChild(s);
    });
  }


  function init() {

    if (_initPromise) return _initPromise;

    _initPromise = new Promise((resolve, reject) => {
      loadScript()
        .then(() => ymaps.ready(() => {
          try {
            if (_map) { resolve(_map); return; }

            _map = new ymaps.Map('map', {
              center: CONFIG.DEFAULT_CENTER,
              zoom: CONFIG.DEFAULT_ZOOM,
              controls: ['zoomControl'],
              suppressMapOpenBlock: true,
            });
            _map.behaviors.enable('scrollZoom');

            document.getElementById('mapLoading').classList.add('hidden');
            resolve(_map);
          } catch (err) {
            reject(err);
          }
        }))
        .catch((err) => {
          document.getElementById('mapLoading').innerHTML =
            '<p style="color:#c0392b;padding:20px;text-align:center;">🗺️ Yandex xaritasi yuklanmadi.<br>Internet aloqasini tekshiring.</p>';
          reject(err);
        });
    });

    return _initPromise;
  }

  function isReady() {
    return _map !== null;
  }


  // Marker: 40x40 kvadrat, -45° burilgan (romb). Element tepa-chap burchagi
  // anchor'da bo'lsa, pin uchi anchor + (20, 48) da bo'ladi.
  // Tip aynan koordinatada turishi uchun: offset = [-20, -48].
  // Shape ham shu moslashuvga mos romb hududini qoplaydi.
  const PIN_OFFSET = [-20, -48];
  const PIN_SHAPE  = { type: 'Rectangle', coordinates: [[-28, -16], [28, 40]] };

  function getLayouts() {
    if (_layouts) return _layouts;
    _layouts = {
      store: ymaps.templateLayoutFactory.createClass(
        '<div class="store-map-marker"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 1.9-1.4L21 8H6.1"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg></div>'
      ),
      free: ymaps.templateLayoutFactory.createClass(
        '<div class="spot-map-marker free"><span>🎣</span></div>'
      ),
      paid: ymaps.templateLayoutFactory.createClass(
        '<div class="spot-map-marker paid"><span>🎣</span></div>'
      ),
      hot: ymaps.templateLayoutFactory.createClass(
        '<div class="spot-map-marker hot"><span>🔥</span></div>'
      ),
    };
    return _layouts;
  }

  function placemarkClickHandler(spot) {
    // Picking rejimida placemark bosilganda batafsil oyna ochilmasin —
    // xarita click eventi orqali joy tanlash davom etsin
    if (_pickingMode) return;
    UI.openSpotDetail(spot);
  }

  function addPlacemark(spot) {
    const esc = Utils.escapeHtml;
    const isStore = spot.kind === 'store';
    const variant = spot.is_hot ? 'hot' : spot.is_paid ? 'paid' : 'free';
    const layouts = getLayouts();

    const placemark = new ymaps.Placemark([spot.lat, spot.lng], {
      hintContent: `${isStore ? '🏪' : '🎣'} ${esc(spot.name)}`,
    }, {
      iconLayout: isStore ? layouts.store : layouts[variant],
      iconOffset: PIN_OFFSET,
      iconShape: PIN_SHAPE,
      hideIconOnBalloonOpen: false,
    });

    placemark.events.add('click', () => placemarkClickHandler(spot));
    _map.geoObjects.add(placemark);
    return placemark;
  }

  function clearPlacemarks() {
    if (_map) _map.geoObjects.removeAll();
    if (_pickingMode) _pickMarker = null; // removeAll belgini ham olib tashlaydi
  }

  function renderSpots(spots) {
    if (!_map) return;
    clearPlacemarks();
    spots.forEach(addPlacemark);
  }


  function goToLocation() {
    if (!navigator.geolocation) {
      UI.showToast('Joylashuv aniqlanmadi', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        Spots.setUserPosition(coords[0], coords[1]);
        if (_map) {
          _map.setCenter(coords, 13);
          document.dispatchEvent(new CustomEvent('fishmap:location', { detail: coords }));
        }
      },
      () => UI.showToast('Joylashuvga ruxsat bermadingiz', 'error'),
    );
  }

  // ── Joy tanlash rejimi ────────────────
  let _pickHandler = null;   // har safar yangi click handler (enable/disable)
  let _pickMarker = null;    // tanlangan joyni ko'rsatuvchi vaqtinchalik belgi

  function removePickMarker() {
    if (_pickMarker && _map) {
      try { _map.geoObjects.remove(_pickMarker); } catch (_) {}
      _pickMarker = null;
    }
  }

  function handlePickEvent(e) {
    if (!_pickingMode) return;
    let coords = null;
    try { coords = e.get('coords'); } catch (_) { coords = null; }
    if (!coords) {
      // Ba'zi hollarda (geo obyekt ustida bosilganda) coords bo'lmasligi mumkin —
      // xarita markaziga qaragandan ko'ra target'ning geometriyasini tekshiramiz
      try {
        const target = e.get('target');
        if (target && target.geometry && typeof target.geometry.getCoordinates === 'function') {
          coords = target.geometry.getCoordinates();
        }
      } catch (_) {}
    }
    if (!coords) return; // koordinata olib bo'lmasa — jim o'tamiz
    _pickedCoords = [coords[0], coords[1]];

    // Tanlangan joyni xaritada belgilab ko'rsatamiz
    removePickMarker();
    _pickMarker = new ymaps.Placemark(_pickedCoords, {}, {
      preset: 'islands#redDotIcon',
      zIndex: 9999,
    });
    _map.geoObjects.add(_pickMarker);

    if (_onPickCallback) _onPickCallback(_pickedCoords);
  }

  function enablePickingMode(callback) {
    if (!_map) {
      UI.showToast('Xarita yuklanmagan — joy tanlab bo\'lmadi', 'error');
      return;
    }
    // Avvalgi rejimni tozalash (ikki marta bosilsa ham toza ishlaydi)
    disablePickingMode();

    _pickingMode = true;
    _pickedCoords = null;
    _onPickCallback = callback;

    _map.container.getElement().style.cursor = 'crosshair';

    // Handler'ni hozir bog'laymiz — init paytidagi eski usul o'rniga
    // (xarita qayta yaratilsa yoki handler yo'qolsa ham ishlaydi)
    _pickHandler = handlePickEvent;
    _map.events.add('click', _pickHandler);

    _banner = document.createElement('div');
    _banner.className = 'picking-mode-banner';
    _banner.textContent = '📍 Xaritada joyni bosing (bekor qilish: Esc)';
    document.querySelector('.map-container').appendChild(_banner);
  }

  function disablePickingMode(keepMarker = false) {
    const wasPicking = _pickingMode;
    _pickingMode = false;
    _onPickCallback = null;

    if (_map && _pickHandler) {
      try { _map.events.remove('click', _pickHandler); } catch (_) {}
      _pickHandler = null;
    }
    if (wasPicking && !keepMarker) removePickMarker();

    if (_map) _map.container.getElement().style.cursor = '';
    if (_banner) {
      _banner.remove();
      _banner = null;
    }
  }

  function getPickedCoords() {
    return _pickedCoords;
  }

  // ── Navigatsiya ───────────────────────
  function flyTo(lat, lng, zoom = 14) {
    if (!_map) return; // xarita yuklanmagan bo'lsa — jim o'tkazamiz
    _map.panTo([lat, lng], { duration: 600 });
    if (_map.getZoom() !== zoom) {
      setTimeout(() => { if (_map) _map.setZoom(zoom); }, 620);
    }
  }

  function refreshViewport() {
    if (_map) _map.container.fitToViewport();
  }

  return {
    init,
    isReady,
    renderSpots,
    addPlacemark,
    goToLocation,
    enablePickingMode,
    disablePickingMode,
    getPickedCoords,
    flyTo,
    refreshViewport,
  };
})();