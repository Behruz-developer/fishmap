// ═══════════════════════════════════════
// FishMap — Autentifikatsiya (Supabase + Google OAuth)
// ═══════════════════════════════════════

const Auth = (() => {
  let _supabase = null;
  let _currentUser = null;

  // Supabase clientini ishga tushirish
  function init() {
    _supabase = supabase.createClient(
      CONFIG.SUPABASE_URL,
      CONFIG.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,    // sessionni localStorage'da saqlash
          autoRefreshToken: true,  // token muddati tugashidan oldin yangilash
          detectSessionInUrl: true // Google redirect'dan qaytgandagi tokenni o'qish
        }
      }
    );
    return _supabase;
  }


  async function signInWithGoogle() {
    const { error } = await _supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error('Login xatosi:', error.message);
      UI.showToast('Kirish xatosi: ' + error.message, 'error');
    }
  }


  async function signOut() {
    await _supabase.auth.signOut();
    _currentUser = null;
    showLoginScreen();
  }


  function getUser() {
    return _currentUser;
  }


  function getClient() {
    return _supabase;
  }

  async function isAdmin() {
    if (!_currentUser) return false;
    const { data, error } = await _supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', _currentUser.id)
      .maybeSingle();
    // Jadval hali yaratilmagan bo'lsa ham oddiy foydalanuvchi oqimi buzilmaydi.
    return !error && Boolean(data);
  }


  async function checkExistingSession() {
    const { data, error } = await _supabase.auth.getSession();
    console.log('[Auth] checkExistingSession natijasi:', data, error);
    if (error) {
      console.error('Session tekshirishda xato:', error.message);
      return null;
    }
    if (data?.session?.user) {
      _currentUser = data.session.user;
      return data.session.user;
    }
    return null;
  }


  function listenAuthChanges(callback) {
    _supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Hodisa:', event, session ? 'session bor' : 'session yo\'q');

      if (session?.user) {
        _currentUser = session.user;
        await saveUserToDB(session.user);
        callback('SIGNED_IN', session.user);
      } else {
        _currentUser = null;
        callback('SIGNED_OUT', null);
      }
    });
  }

  // Foydalanuvchini profiles jadvaliga yozish
  async function saveUserToDB(user) {
    const { error } = await _supabase
      .from('profiles')
      .upsert({
        id:         user.id,
        email:      user.email,
        full_name:  user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        last_seen:  new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) console.error('Profil saqlash xatosi:', error.message);
  }

  // Login ekranini ko'rsatish
  function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
  }

  // Asosiy ekranni ko'rsatish
  function showMainApp(user) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');

    // ⚠️ VAQTINCHALIK O'CHIRILDI: yuqori o'ng burchakdagi avatar DOMdan olib tashlangan
    // (index.html'da izohda). Qayta yoqish uchun shu blokni ham tiking:
    //
    // const avatar = document.getElementById('userAvatar');
    // if (user.user_metadata?.avatar_url) {
    //   avatar.style.backgroundImage = `url(${user.user_metadata.avatar_url})`;
    //   avatar.textContent = '';
    // } else {
    //   const name = user.user_metadata?.full_name || user.email || '?';
    //   avatar.textContent = name[0].toUpperCase();
    // }
    //
    // avatar.onclick = async () => {
    //   const name = user.user_metadata?.full_name || user.email;
    //   if (confirm(`${name}\n\nDasturdan chiqmoqchimisiz?`)) {
    //     await signOut();
    //   }
    // };
  }

  return { init, signInWithGoogle, signOut, getUser, getClient, isAdmin,
           listenAuthChanges, showLoginScreen, showMainApp,
           checkExistingSession };
})();
