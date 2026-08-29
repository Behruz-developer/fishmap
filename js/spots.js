// ═══════════════════════════════════════
// FishMap — Baliq tutish joylari (Supabase CRUD)
// ═══════════════════════════════════════

const Spots = (() => {
  let _allSpots = [];
  let _userPos  = null;          // [lat, lng] — masofa hisoblash uchun
  const CACHE_KEY = 'fishmap_spots_cache_v1';

  // ── Oflayn kesh ───────────────────────
  function saveCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        time: Date.now(),
        spots: _allSpots,
      }));
    } catch (e) { /* kvota to'lgan bo'lishi mumkin — muhim emas */ }
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.spots) ? parsed.spots : [];
    } catch (e) {
      return [];
    }
  }

  // ── Barcha joylarni olish ─────────────
  async function fetchAll() {
    // Internet yo'q bo'lsa — keshdan
    if (!Utils.isOnline()) {
      _allSpots = loadCache();
      applyDistances();
      if (_allSpots.length) UI.showToast('📵 Oflayn: saqlangan joylar', '');
      return _allSpots;
    }

    const db = Auth.getClient();
    const { data, error } = await db
      .from('fishing_spots')
      .select('*, profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Joylarni olishda xato:', error.message);
      UI.showToast('Joylarni yuklashda xato', 'error');
      _allSpots = loadCache();   // zaxira sifatida kesh
      applyDistances();
      return _allSpots;
    }

    _allSpots = data || [];
    applyDistances();
    saveCache();
    return _allSpots;
  }

  // ── Yangi joy saqlash ─────────────────
  async function addSpot({ name, type, fish_types, description, depth, lat, lng, is_paid, kind = 'fishing' }) {
    const db   = Auth.getClient();
    const user = Auth.getUser();

    if (!user) { UI.showToast('Avval kiring!', 'error'); return null; }
    if (!Utils.isOnline()) { UI.showToast('📵 Internet yo\'q — saqlab bo\'lmadi', 'error'); return null; }

    const { data, error } = await db
      .from('fishing_spots')
      .insert([{
        name,
        type,
        fish_types,        // text[]
        description,
        depth,
        lat,
        lng,
        is_paid,
        kind,
        rating:    0,
        is_hot:    false,
        user_id:   user.id,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Joy saqlashda xato:', error.message);
      UI.showToast('Saqlashda xato: ' + error.message, 'error');
      return null;
    }

    _allSpots.unshift(data);
    applyDistances();
    saveCache();
    return data;
  }

  // ── Joyni yangilash (faqat admin) ──────
  async function updateSpot(id, fields) {
    const db = Auth.getClient();
    if (!Utils.isOnline()) { UI.showToast("📵 Internet yo'q — saqlab bo'lmadi", 'error'); return null; }

    const { data, error } = await db
      .from('fishing_spots')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Joy yangilashda xato:', error.message);
      UI.showToast('Yangilashda xato: ' + error.message, 'error');
      return null;
    }

    upsertLocal(data);
    return data;
  }

  // ── Joyni o'chirish (faqat admin) ──────
  async function deleteSpot(id) {
    const db = Auth.getClient();
    const { error } = await db
      .from('fishing_spots')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Joy o'chirishda xato:", error.message);
      UI.showToast("O'chirishda xato: " + error.message, 'error');
      return false;
    }

    removeLocal(id);
    return true;
  }

  // ── Masofa ────────────────────────────
  function setUserPosition(lat, lng) {
    _userPos = [lat, lng];
    applyDistances();
  }

  function applyDistances() {
    if (!_userPos) return;
    _allSpots.forEach(s => {
      s._distanceKm = Utils.distanceKm(_userPos[0], _userPos[1], s.lat, s.lng);
    });
  }

  function hasUserPosition() { return _userPos !== null; }

  // ── Filter ───────────────────────────
  function filter({ type, search }) {
    let result = [..._allSpots];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.fish_types || []).some(f => f.toLowerCase().includes(q)) ||
        (s.description || '').toLowerCase().includes(q)
      );
    }

    if (type === 'free')  result = result.filter(s => !s.is_paid);
    if (type === 'paid')  result = result.filter(s =>  s.is_paid);
    if (type === 'top')   result = result.filter(s =>  s.rating >= 4);
    if (type === 'near') {
      // Joylashuv hali ma'lum bo'lmasa — hamma joyni ko'rsatamiz
      // (keyinchalik GPS kelganda yaqinlik bo'yicha saralanadi)
      if (_userPos) result = result.filter(s => s._distanceKm != null);
    }
    if (type === 'sazan') result = result.filter(s => (s.fish_types || []).some(f => f.toLowerCase().includes('sazan')));
    if (type === 'zander')result = result.filter(s => (s.fish_types || []).some(f => f.toLowerCase().includes('zander') || f.toLowerCase().includes('sudak')));
    if (type === 'forel') result = result.filter(s => (s.fish_types || []).some(f => f.toLowerCase().includes('forel')));
    if (type === 'stores') result = result.filter(s => s.kind === 'store');

    // Joylashuv ma'lum bo'lsa — yaqinlik bo'yicha saralash
    if (_userPos) {
      result.sort((a, b) => (a._distanceKm ?? 1e9) - (b._distanceKm ?? 1e9));
    }

    return result;
  }

  function getAll() { return _allSpots; }

  function getById(id) {
    return _allSpots.find(s => String(s.id) === String(id)) || null;
  }

  // ── Realtime yordamchi ────────────────
  function upsertLocal(spot) {
    const i = _allSpots.findIndex(s => String(s.id) === String(spot.id));
    if (i >= 0) _allSpots[i] = { ..._allSpots[i], ...spot };
    else        _allSpots.unshift(spot);
    applyDistances();
    saveCache();
  }

  function removeLocal(id) {
    _allSpots = _allSpots.filter(s => String(s.id) !== String(id));
    saveCache();
  }

  return { fetchAll, addSpot, updateSpot, deleteSpot, filter, getAll, getById,
           setUserPosition, hasUserPosition,
           upsertLocal, removeLocal };
})();
