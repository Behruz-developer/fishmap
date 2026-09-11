// ═══════════════════════════════════════
// FishMap — Profil bo'limi
// ═══════════════════════════════════════

const Profile = (() => {
  let _deferredInstallPrompt = null;
  let _user = null;

  // PWA install event'ni ushlab olish
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredInstallPrompt = e;
    // Header va profil sahifasidagi install tugmalarini ko'rsatish
    // ⚠️ btnInstallPWA (eski header tugmasi) o'chirilgan — faqat btnInstallPWA2 (Profil):
    // document.getElementById('btnInstallPWA')?.classList.remove('hidden');
    document.getElementById('btnInstallPWA2')?.classList.remove('hidden');
  });

  window.addEventListener('appinstalled', () => {
    _deferredInstallPrompt = null;
    // document.getElementById('btnInstallPWA')?.classList.add('hidden');
    document.getElementById('btnInstallPWA2')?.classList.add('hidden');
    UI.showToast('✅ FishMap muvaffaqiyatli o\'rnatildi!', 'success');
  });

  async function triggerInstall() {
    if (!_deferredInstallPrompt) {
      // beforeinstallprompt kelmadi — Android Chrome bo'lsa ham qo'lda,
      // iOS/Safari bo'lsa bosqichma-bosqich yo'riqnoma ko'rsatamiz
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
      if (isStandalone) {
        UI.showToast("Ilova allaqachon o'rnatilgan ✅", 'success');
      } else {
        showInstallGuide(isIOS);
      }
      return;
    }
    _deferredInstallPrompt.prompt();
    const { outcome } = await _deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      _deferredInstallPrompt = null;
    }
  }

  // ── O'rnatish yo'riqnomasi modal (iOS va boshqa brauzerlar uchun) ──
  function showInstallGuide(isIOS) {
    // Eski modal bor bo'lsa — olib tashlaymiz
    document.getElementById('installGuideOverlay')?.remove();

    const isTelegram = /telegram/i.test(navigator.userAgent);
    const overlay = document.createElement('div');
    overlay.id = 'installGuideOverlay';
    overlay.className = 'install-guide-overlay';
    overlay.innerHTML = `
      <div class="install-guide">
        <h3>📲 Ilovani telefonga o'rnatish</h3>
        <p class="ig-sub">Quyidagi 2 ta qadamni bajaring:</p>
        ${isIOS ? `
          ${isTelegram ? `
          <div class="ig-step"><span class="ig-num">1</span><div>Bu oynani yopib, havolani <b>Safari</b> brauzerida oching (Telegram ichida o'rnatib bo'lmaydi)</div></div>
          <div class="ig-step"><span class="ig-num">2</span><div>Safari'da pastdagi <b>Share</b> (kvadrat + strelka) tugmasini bosing → <b>"Add to Home Screen"</b> ni tanlang</div></div>
          ` : `
          <div class="ig-step"><span class="ig-num">1</span><div>Safari'da pastdagi <b>Share</b> (kvadrat + strelka) tugmasini bosing</div></div>
          <div class="ig-step"><span class="ig-num">2</span><div>Ro'yxatdan <b>"Add to Home Screen"</b> ni tanlang → <b>Add</b> ni bosing</div></div>
          `}
        ` : `
          <div class="ig-step"><span class="ig-num">1</span><div>Brauzer menyusini oching ( Chrome'da <b>⋮</b> uch nuqta)</div></div>
          <div class="ig-step"><span class="ig-num">2</span><div><b>"Ilovani o'rnatish"</b> yoki <b>"Add to Home screen"</b> ni tanlang</div></div>
        `}
        <div class="ig-actions">
          ${isTelegram ? `<button type="button" class="ig-btn ig-btn-primary" id="igCopyLink">🔗 Havolani nusxalash</button>` : ''}
          <button type="button" class="ig-btn ${isTelegram ? 'ig-btn-secondary' : 'ig-btn-primary'}" id="igClose">Tushunarli, yopish</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Fon bosilganda yopish
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.getElementById('igClose')?.addEventListener('click', () => overlay.remove());
    document.getElementById('igCopyLink')?.addEventListener('click', async (e) => {
      const button = e.currentTarget;
      try {
        await navigator.clipboard.writeText(window.location.origin);
        button.textContent = '✅ Nusxalandi!';
      } catch (_) {
        UI.showToast('Havola: ' + window.location.origin, '');
      }
      setTimeout(() => { button.textContent = '🔗 Havolani nusxalash'; }, 2000);
    });
  }

  function render(user) {
    if (!user) return;
    _user = user;

    // Avatar
    const avatarEl = document.getElementById('profileAvatarLg');
    if (avatarEl) {
      if (user.user_metadata?.avatar_url) {
        avatarEl.style.backgroundImage = `url(${user.user_metadata.avatar_url})`;
        avatarEl.textContent = '';
      } else {
        const name = user.user_metadata?.full_name || user.email || '?';
        avatarEl.textContent = name[0].toUpperCase();
        avatarEl.style.backgroundImage = '';
      }
    }

    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = user.user_metadata?.full_name || 'Foydalanuvchi';

    const emailEl = document.getElementById('profileEmail');
    if (emailEl) emailEl.textContent = user.email || '';

    // Statistika
    updateStats(user);
  }

  function updateStats(user) {
    if (!user) return;
    const allSpots = Spots.getAll();
    const mySpots  = allSpots.filter(s => s.user_id === user.id && s.kind !== 'store');
    const myStores = allSpots.filter(s => s.user_id === user.id && s.kind === 'store');

    const statSpots  = document.getElementById('statSpots');
    const statStores = document.getElementById('statStores');
    if (statSpots)  statSpots.textContent  = mySpots.length;
    if (statStores) statStores.textContent = myStores.length;
  }

  function init() {
    const user = Auth.getUser();
    render(user);

    // Install tugmasi — doim ko'rinadi (beforeinstallprompt kelmasa ham,
    // bosilganda brauzerga qarab yo'riqnoma ko'rsatiladi)
    document.getElementById('btnInstallPWA2')?.classList.remove('hidden');
    // Install tugmalari
    // ⚠️ btnInstallPWA (yuqori o'ng burchakdagi eski tugma) vaqtinchalik o'chirilgan:
    // document.getElementById('btnInstallPWA')?.addEventListener('click', triggerInstall);
    document.getElementById('btnInstallPWA2')?.addEventListener('click', triggerInstall);

    // Ulashish
    document.getElementById('btnShareApp')?.addEventListener('click', async () => {
      const shareData = {
        title: 'FishMap — Baliq tutish joylari',
        text: 'O\'zbekistondagi baliq tutish joylarini toping va ulashing!',
        url: window.location.href,
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          if (err.name !== 'AbortError') UI.showToast('Ulashishda xato', 'error');
        }
      } else {
        try {
          await navigator.clipboard.writeText(window.location.href);
          UI.showToast('🔗 Havola nusxalandi!', 'success');
        } catch {
          UI.showToast('Brauzer ulashishni qo\'llab-quvvatlamaydi', '');
        }
      }
    });

    // Admin panel (faqat adminlar ko'radi)
    document.getElementById('btnOpenAdmin')?.addEventListener('click', () => {
      App.switchTab('admin');
    });

    // Chiqish tugmasi
    document.getElementById('btnSignOut')?.addEventListener('click', async () => {
      const name = _user?.user_metadata?.full_name || _user?.email || 'Foydalanuvchi';
      if (confirm(`${name}\n\nDasturdan chiqmoqchimisiz?`)) {
        await Auth.signOut();
      }
    });
  }

  // Spots yuklanganidan keyin statistikani yangilash
  function refresh() {
    const user = Auth.getUser();
    if (user) updateStats(user);
  }

  return { init, render, refresh };
})();