// ═══════════════════════════════════════
// FishMap — Ob-havo moduli (Open-Meteo, API key kerak emas)
// ═══════════════════════════════════════

const Weather = (() => {
  const CACHE_TTL = 30 * 60 * 1000; // 30 daqiqa
  const _cache = new Map();         // key -> { time, data }

  // WMO ob-havo kodlari → emoji + matn
  const WMO = {
    0:  ['☀️', 'Ochiq'],
    1:  ['🌤️', 'Asosan ochiq'],
    2:  ['⛅', 'Bulutli'],
    3:  ['☁️', 'To\'liq bulutli'],
    45: ['🌫️', 'Tuman'],
    48: ['🌫️', 'Qirov tumani'],
    51: ['🌦️', 'Yengil shivalash'],
    53: ['🌦️', 'Shivalash'],
    55: ['🌧️', 'Kuchli shivalash'],
    61: ['🌦️', 'Yengil yomg\'ir'],
    63: ['🌧️', 'Yomg\'ir'],
    65: ['🌧️', 'Kuchli yomg\'ir'],
    71: ['🌨️', 'Yengil qor'],
    73: ['🌨️', 'Qor'],
    75: ['❄️', 'Kuchli qor'],
    80: ['🌦️', 'Jala'],
    81: ['🌧️', 'Kuchli jala'],
    82: ['⛈️', 'Juda kuchli jala'],
    95: ['⛈️', 'Momaqaldiroq'],
    96: ['⛈️', 'Do\'lli momaqaldiroq'],
    99: ['⛈️', 'Kuchli do\'l'],
  };

  function describe(code) {
    return WMO[code] || ['🌡️', 'Noma\'lum'];
  }

  // Shamol yo'nalishi (gradus → yo'nalish)
  function windDir(deg) {
    const dirs = ['Sh', 'ShSh-Sh', 'Sh-Q', 'Sh-Sh-Q', 'J', 'J-J-G\'', 'J-G\'', 'G\'-J-G\'',
                  'G\'', 'G\'-Sh-G\'', 'Sh-G\'', 'Sh-Sh-G\'', 'Sh', 'Sh', 'Sh', 'Sh'];
    return dirs[Math.round(deg / 45) % 8] || '';
  }

  // ── Baliq ovi uchun sharoit bahosi ────
  // Baliqchilar orasida tarqalgan qoidalar asosida (ilmiy kafolat emas):
  // bosim barqaror/pastroq, shamol yengil, bulutli — yaxshi belgilar.
  function fishingScore({ pressure, wind, code, temp }) {
    let score = 50;

    if (pressure >= 1010 && pressure <= 1020) score += 20;
    else if (pressure < 1000 || pressure > 1030) score -= 15;

    if (wind < 3) score += 10;
    else if (wind < 8) score += 15;
    else if (wind < 15) score -= 5;
    else score -= 25;

    if ([1, 2, 3].includes(code)) score += 10;      // bulutli — yaxshi
    if ([0].includes(code)) score += 0;             // yorqin quyosh — o'rtacha
    if ([95, 96, 99, 82, 65, 75].includes(code)) score -= 30; // bo'ron

    if (temp >= 12 && temp <= 26) score += 10;
    else if (temp < 0 || temp > 35) score -= 20;

    score = Math.max(0, Math.min(100, score));

    let label, emoji;
    if (score >= 70)      { label = 'Ajoyib';  emoji = '🟢'; }
    else if (score >= 50) { label = 'Yaxshi';  emoji = '🟡'; }
    else if (score >= 30) { label = 'O\'rtacha'; emoji = '🟠'; }
    else                  { label = 'Yomon';   emoji = '🔴'; }

    return { score, label, emoji };
  }

  // ── API so'rovi ───────────────────────
  async function fetch7(lat, lng) {
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    const cached = _cache.get(key);
    if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,relative_humidity_2m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=auto&forecast_days=3&wind_speed_unit=ms`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Ob-havo olinmadi');
    const json = await res.json();

    const c = json.current;
    const data = {
      temp:     Math.round(c.temperature_2m),
      code:     c.weather_code,
      wind:     Math.round(c.wind_speed_10m * 10) / 10,
      windDeg:  c.wind_direction_10m,
      pressure: Math.round(c.surface_pressure),
      humidity: c.relative_humidity_2m,
      daily:    (json.daily?.time || []).map((t, i) => ({
        date: t,
        code: json.daily.weather_code[i],
        max:  Math.round(json.daily.temperature_2m_max[i]),
        min:  Math.round(json.daily.temperature_2m_min[i]),
      })),
    };

    _cache.set(key, { time: Date.now(), data });
    return data;
  }

  // ── Popup ichiga render qilish ────────
  async function renderInto(el, lat, lng) {
    if (!el) return;
    el.innerHTML = '<div class="weather-loading">🌡️ Ob-havo yuklanmoqda...</div>';

    if (!Utils.isOnline()) {
      el.innerHTML = '<div class="weather-loading">📵 Oflayn — ob-havo mavjud emas</div>';
      return;
    }

    try {
      const w = await fetch7(lat, lng);
      const [emoji, text] = describe(w.code);
      const fs = fishingScore(w);

      el.innerHTML = `
        <div class="weather-main">
          <div class="weather-now">
            <span class="weather-emoji">${emoji}</span>
            <span class="weather-temp">${w.temp}°</span>
          </div>
          <div class="weather-desc">
            <div class="weather-text">${Utils.escapeHtml(text)}</div>
            <div class="weather-sub">💨 ${w.wind} m/s ${windDir(w.windDeg)} · 🔽 ${w.pressure} hPa · 💧 ${w.humidity}%</div>
          </div>
        </div>
        <div class="fishing-score score-${fs.label === 'Ajoyib' ? 'great' : fs.label === 'Yaxshi' ? 'good' : fs.label === 'Yomon' ? 'bad' : 'mid'}">
          ${fs.emoji} Ov sharoiti: <b>${fs.label}</b> <span class="score-num">${fs.score}/100</span>
        </div>
        <div class="weather-forecast">
          ${w.daily.map((d, i) => {
            const [de] = describe(d.code);
            const label = i === 0 ? 'Bugun' : i === 1 ? 'Ertaga' : 'Indinga';
            return `<div class="fc-day">
                      <div class="fc-lbl">${label}</div>
                      <div class="fc-emoji">${de}</div>
                      <div class="fc-temp">${d.max}° / ${d.min}°</div>
                    </div>`;
          }).join('')}
        </div>
      `;
    } catch (err) {
      console.error('[Weather]', err);
      el.innerHTML = '<div class="weather-loading">⚠️ Ob-havo yuklanmadi</div>';
    }
  }

  return { fetch7, renderInto, describe, fishingScore };
})();
