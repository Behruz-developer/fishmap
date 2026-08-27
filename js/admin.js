// ═══════════════════════════════════════
// FishMap — Admin panel
// Qo'llanmalarni Supabase'ga qo'shish/boshqarish
// ═══════════════════════════════════════

const Admin = (() => {
  let _isAdmin = false;

  // ── Admin holatini tekshirish va UI'ni sozlash ──
  async function init() {
    _isAdmin = await Auth.isAdmin();

    // Admin tugmalarini ko'rsatish/yashirish
    document.getElementById('btnOpenAdmin')?.classList.toggle('hidden', !_isAdmin);
    document.querySelector('.nav-item[data-tab="admin"]')?.classList.toggle('hidden', !_isAdmin);

    if (!_isAdmin) return;

    bindEvents();
  }

  function bindEvents() {
    // Admin tab ichidagi sub-tablar
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.adminTab;
        document.getElementById('adminTabNew').classList.toggle('hidden', tab !== 'new');
        document.getElementById('adminTabList').classList.toggle('hidden', tab !== 'list');
        document.getElementById('adminTabSpots').classList.toggle('hidden', tab !== 'spots');
        if (tab === 'list') renderGuidesList();
        if (tab === 'spots') renderSpotsList();
      });
    });

    // Saqlash
    document.getElementById('adminSaveGuide')?.addEventListener('click', saveGuide);

    // Ro'yxat amallari (delegatsiya)
    document.getElementById('adminGuidesList')?.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.admin-item-delete');
      if (delBtn) {
        deleteGuide(delBtn.dataset.id, delBtn.dataset.name);
        return;
      }
      const viewBtn = e.target.closest('.admin-item-view');
      if (viewBtn) {
        App.switchTab('guide');
        Guides.openDetail(viewBtn.dataset.id);
      }
    });

    // ── Joylar & do'konlar boshqaruvi ──
    // Qo'shish tugmalari — mavjud modal oynani ochadi (faqat admin ko'radi)
    document.getElementById('adminAddSpotBtn')?.addEventListener('click', () => {
      UI.resetAddForm();
      UI.openAddModal('fishing');
    });
    document.getElementById('adminAddStoreBtn')?.addEventListener('click', () => {
      UI.resetAddForm();
      UI.openAddModal('store');
    });

    // Joylar ro'yxati amallari (delegatsiya)
    document.getElementById('adminSpotsList')?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.admin-item-edit');
      if (editBtn) {
        const spot = Spots.getById(editBtn.dataset.id);
        if (spot) {
          UI.openAddModal(spot.kind === 'store' ? 'store' : 'fishing', spot);
        }
        return;
      }
      const delBtn = e.target.closest('.admin-item-delete');
      if (delBtn) {
        deleteSpotById(delBtn.dataset.id, delBtn.dataset.name);
        return;
      }
      const viewBtn = e.target.closest('.admin-item-view');
      if (viewBtn) {
        const spot = Spots.getById(viewBtn.dataset.id);
        if (spot) {
          App.showMapView();
          setTimeout(() => UI.openSpotDetail(spot), 100);
        }
      }
    });
  }

  // ── Saqlash ───────────────────────────
  async function saveGuide() {
    const name     = document.getElementById('adminFishName').value.trim();
    const emoji    = document.getElementById('adminFishEmoji').value.trim() || '🐟';
    const sciName  = document.getElementById('adminFishSci').value.trim();
    const diff     = document.getElementById('adminFishDifficulty').value;
    const avgW     = document.getElementById('adminFishAvgWeight').value.trim();
    const maxW     = document.getElementById('adminFishMaxWeight').value.trim();
    const desc     = document.getElementById('adminFishDesc').value.trim();
    const habitat  = document.getElementById('adminFishHabitat').value.trim();
    const videosRaw = document.getElementById('adminFishVideos').value.trim();

    if (!name) { UI.showToast('Baliq nomini kiriting', 'error'); return; }

    // Video havolalari (har satr bitta URL)
    const videos = videosRaw
      .split('\n')
      .map(v => v.trim())
      .filter(Boolean)
      .slice(0, 10)
      .map(url => ({ url }));

    // Slug generatsiya (lotin harflari bilan)
    const slug = 'custom-' + Date.now().toString(36);

    const btn = document.getElementById('adminSaveGuide');
    btn.disabled = true;
    btn.textContent = '⏳ Saqlanmoqda...';

    const { error } = await Auth.getClient()
      .from('fish_guides')
      .insert({
        slug,
        name,
        emoji,
        sci_name: sciName || null,
        difficulty: diff,
        avg_weight: avgW || null,
        max_weight: maxW || null,
        description: desc || null,
        habitats_desc: habitat || null,
        habitats: ['lake', 'river', 'pond'], // umumiy — keyin tahrirlanadi
        videos,
      });

    btn.disabled = false;
    btn.textContent = '✅ Supabase\'ga saqlash';

    if (error) {
      console.error('[Admin]', error);
      UI.showToast('Xatolik: ' + (error.message || 'saqlanmadi'), 'error');
      return;
    }

    UI.showToast('✅ Qo\'llanma saqlandi!', 'success');
    clearForm();
    // Qo'llanmalarni qayta yuklash
    Guides.loadFromDb();
    renderGuidesList();
  }

  function clearForm() {
    ['adminFishName', 'adminFishSci', 'adminFishAvgWeight', 'adminFishMaxWeight',
     'adminFishDesc', 'adminFishHabitat', 'adminFishVideos'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('adminFishEmoji').value = '';
  }

  // ── Mavjudlar ro'yxati ────────────────
  async function renderGuidesList() {
    const list = document.getElementById('adminGuidesList');
    if (!list) return;

    list.innerHTML = '<div class="stores-loading"><div class="loading-spinner"></div><p>Yuklanmoqda...</p></div>';

    try {
      const { data, error } = await Auth.getClient()
        .from('fish_guides')
        .select('id, slug, name, emoji, difficulty, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data?.length) {
        list.innerHTML = `
          <div class="stores-empty">
            <div class="stores-empty-icon">📋</div>
            <div class="stores-empty-title">Hozircha bo'sh</div>
            <div class="stores-empty-sub">Supabase'da qo'llanma yo'q — yangi qo'shing</div>
          </div>`;
        return;
      }

      const diffLabel = { beginner: 'Oson', intermediate: 'O\'rta', advanced: 'Murakkab' };
      list.innerHTML = data.map(g => `
        <div class="admin-guide-item">
          <span class="admin-item-emoji">${g.emoji || '🐟'}</span>
          <div class="admin-item-info">
            <div class="admin-item-name">${Utils.escapeHtml(g.name)}</div>
            <div class="admin-item-meta">${diffLabel[g.difficulty] || 'Oson'} · ${new Date(g.created_at).toLocaleDateString('uz-UZ')}</div>
          </div>
          <button class="admin-item-btn admin-item-view" data-id="${Utils.escapeAttr(g.slug || g.id)}" title="Ko'rish">👁️</button>
          <button class="admin-item-btn admin-item-delete" data-id="${g.id}" data-name="${Utils.escapeAttr(g.name)}" title="O'chirish">🗑️</button>
        </div>
      `).join('');
    } catch (err) {
      console.error('[Admin]', err);
      list.innerHTML = '<div class="guide-empty">⚠️ Yuklashda xatolik. fish_guides jadvali yaratilganini tekshiring.</div>';
    }
  }

  async function deleteGuide(id, name) {
    if (!confirm(`"${name}" qo'llanmasini o'chirishni tasdiqlaysizmi?`)) return;
    const { error } = await Auth.getClient()
      .from('fish_guides')
      .delete()
      .eq('id', id);

    if (error) {
      UI.showToast('O\'chirishda xatolik', 'error');
      return;
    }
    UI.showToast('🗑️ O\'chirildi', 'success');
    Guides.loadFromDb();
    renderGuidesList();
  }

  // ── Joylar & do'konlar ro'yxati ──────
  async function renderSpotsList() {
    const list = document.getElementById('adminSpotsList');
    if (!list) return;

    list.innerHTML = '<div class="stores-loading"><div class="loading-spinner"></div><p>Yuklanmoqda...</p></div>';

    try {
      const spots = Spots.getAll();
      if (!spots.length) {
        list.innerHTML = `
          <div class="stores-empty">
            <div class="stores-empty-icon">📍</div>
            <div class="stores-empty-title">Hozircha bo'sh</div>
            <div class="stores-empty-sub">Joy yoki do'kon qo'shilmagan — yuqoridagi tugmalar bilan qo'shing</div>
          </div>`;
        return;
      }

      const esc = Utils.escapeHtml;
      list.innerHTML = spots.map(s => {
        const isStore = s.kind === 'store';
        return `
        <div class="admin-guide-item">
          <span class="admin-item-emoji">${isStore ? '🏪' : UI.emojiFor(s.type)}</span>
          <div class="admin-item-info">
            <div class="admin-item-name">${esc(s.name)}</div>
            <div class="admin-item-meta">${isStore ? "Do'kon" : esc(s.type || 'Joy')} · ⭐ ${esc(s.rating || 0)}</div>
          </div>
          <button class="admin-item-btn admin-item-view" data-id="${esc(s.id)}" title="Xaritada ko'rish">👁️</button>
          <button class="admin-item-btn admin-item-edit" data-id="${esc(s.id)}" title="Tahrirlash">✏️</button>
          <button class="admin-item-btn admin-item-delete" data-id="${esc(s.id)}" data-name="${esc(s.name)}" title="O'chirish">🗑️</button>
        </div>`;
      }).join('');
    } catch (err) {
      console.error('[Admin]', err);
      list.innerHTML = '<div class="guide-empty">⚠️ Yuklashda xatolik.</div>';
    }
  }

  async function deleteSpotById(id, name) {
    if (!confirm(`"${name}"ni o'chirishni tasdiqlaysizmi?`)) return;
    const ok = await Spots.deleteSpot(id);
    if (!ok) return;
    UI.showToast("🗑️ O'chirildi", 'success');
    App.applyFilter();
    StoresTab.refresh();
    Profile.refresh();
    renderSpotsList();
  }

  // Spots o'zgarganda (qo'shish/tahrirlash) ro'yxatni yangilash
  function refreshSpots() {
    if (document.getElementById('adminTabSpots') &&
        !document.getElementById('adminTabSpots').classList.contains('hidden')) {
      renderSpotsList();
    }
  }

  return { init, refreshSpots };
})();