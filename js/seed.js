// ═══════════════════════════════════════
// FishMap — Seed (koordinatalardan joy qo'shish)
// seed.html bilan ishlatiladi. Nomlar Yandex Geocoder'dan
// avtomatik olinadi, hammasi bepul (is_paid=false) qo'shiladi.
// ═══════════════════════════════════════

const SUPABASE_URL = 'https://hbwhwcfyhjylcyobtlbd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DiqCLLoNhB54ODK7BEsxhA_bXeGPRMA';
const YANDEX_KEY   = '9c463b20-156b-4dbf-a40a-782f2b3e4c20';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser = null;

const $ = id => document.getElementById(id);
const status = (msg, cls = '') => {
  $('status').innerHTML += `<div class="${cls}">${msg}</div>`;
};

// ── Sessiya ────────────────────────────
db.auth.getSession().then(({ data }) => {
  if (data.session) setUser(data.session.user);
});

db.auth.onAuthStateChange((_e, session) => {
  if (session) setUser(session.user);
});

function setUser(user) {
  currentUser = user;
  $('btnLogin').style.display = 'none';
  $('btnAdd').style.display = 'block';
  $('btnLogout').style.display = 'block';
  status(`✅ Kirildi: ${user.email}`, 'ok');
}

$('btnLogin').addEventListener('click', async () => {
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href },
  });
  if (error) status('Kirishda xato: ' + error.message, 'err');
});

$('btnLogout').addEventListener('click', async () => {
  await db.auth.signOut();
  location.reload();
});

// ── Geokodlash (kordinata → eng yaqin joy nomi) ──
async function reverseGeocode(lat, lng) {
  const attempts = ['kind=locality', ''];
  for (const kind of attempts) {
    try {
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_KEY}&format=json&geocode=${lng},${lat}&lang=uz_UZ&results=1${kind ? '&' + kind : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      const members = data?.response?.GeoObjectCollection?.featureMember;
      if (members?.length) {
        const md = members[0].GeoObject.metaDataProperty?.GeocoderMetaData;
        const addr = md?.AddressDetails?.Country?.AdministrativeArea?.SubAdministrativeArea;
        const name = addr?.Locality?.LocalityName || addr?.SubAdministrativeAreaName || members[0].GeoObject.name;
        if (name) return name;
      }
    } catch (_) {}
  }
  return null;
}

// ── Admin tekshiruv ────────────────────
async function isAdminUser() {
  const { data } = await db
    .from('admin_users')
    .select('user_id')
    .eq('user_id', currentUser.id)
    .maybeSingle();
  return !!data;
}

// ── Qo'shish ───────────────────────────
$('btnAdd').addEventListener('click', async () => {
  if (!currentUser) { status('Avval kiring!', 'err'); return; }
  $('status').innerHTML = '';
  $('btnAdd').disabled = true;

  if (!(await isAdminUser())) {
    status("❌ Siz admin emassiz — joy qo'shish faqat admin uchun", 'err');
    $('btnAdd').disabled = false;
    return;
  }

  const lines = $('coords').value.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) { status('Koordinatalar kiritilmadi', 'err'); $('btnAdd').disabled = false; return; }

  status(`${lines.length} ta joy qo'shilmoqda...`);
  let added = 0, failed = 0;

  for (const line of lines) {
    // Format: lat, lng  yoki  lat, lng, Joy nomi
    const parts = line.split(',').map(p => p.trim());
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    const givenName = parts.slice(2).join(',').trim(); // vergul bo'lsa ham nom sifatida qabul qilinadi

    if (isNaN(lat) || isNaN(lng)) {
      status(`⚠️ Noto'g'ri qator: "${line}" — o'tkazib yuborildi`, 'err');
      failed++;
      continue;
    }

    let finalName;
    if (givenName) {
      // Nom qo'lda berilgan — geokodlash shart emas
      finalName = givenName;
    } else {
      const name = await reverseGeocode(lat, lng);
      finalName = name ? `${name} atrofidagi joy` : `Joy (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
    }

    const { error } = await db.from('fishing_spots').insert([{
      name: finalName,
      type: "Ko'l",
      fish_types: ['Sazan', 'Oq amur', 'Laqqa'],
      description: '',
      depth: '',
      lat, lng,
      is_paid: false,
      kind: 'fishing',
      rating: 0,
      user_id: currentUser.id,
    }]);

    if (error) {
      status(`❌ ${lat}, ${lng} — xato: ${error.message}`, 'err');
      failed++;
    } else {
      status(`✅ ${finalName} (${lat}, ${lng})`, 'ok');
      added++;
    }
  }

  status(`🏁 Tayyor: ${added} qo'shildi, ${failed} xato`, added ? 'ok' : 'err');
  $('btnAdd').disabled = false;
});
