// ═══════════════════════════════════════
// FishMap — Baliq ovlash qo'llanmasi
// Ma'lumotlar: lokal baza + Supabase (admin qo'shganlar)
// ═══════════════════════════════════════

const Guides = (() => {
  // ── Baliq ma'lumotlari bazasi ─────────
  const FISH_DATA = [
    {
      id: 'sazan',
      name: 'Sazan',
      emoji: '🐟',
      sciName: 'Cyprinus carpio',
      habitats: ['lake', 'pond', 'river'],
      difficulty: 'beginner',
      difficultyLabel: 'Oson',
      difficultyColor: '#2D7A4F',
      maxWeight: '30+ kg',
      avgWeight: '1–5 kg',
      description: 'Sazan O\'zbekistondagi eng keng tarqalgan baliq turidir. U ko\'l, hovuz va daryolarda yashaydi. Kuchli va chidamli bo\'lgan sazan yangi boshlovchilar uchun ideal tanlov hisoblanadi.',
      habitats_desc: "Ko'l va hovuzlarning tubiga yaqin, loy va o'simliklar orasida",
      methods: [
        { name: 'Feeder', icon: '🎣', desc: 'Tubiga tashlanadigan og\'ir uqda bilan — eng samarali usul' },
        { name: 'Float (yengil)', icon: '🪝', desc: 'Yengil suzgich bilan o\'simliklar yaqinida' },
        { name: 'Carpfishing', icon: '🏕️', desc: 'Karp uqda va boyle bait bilan tungi ovda' },
      ],
      tackle: {
        rod: '3–3.6 m feeder yoki carp qamish (test: 60–150 g)',
        line: '0.25–0.35 mm monofilament yoki 0.20 mm braid',
        hook: '№ 4–8 (offset yoki carp hook)',
        leader: '0.20–0.25 mm, 30–50 cm fluorocarbon',
      },
      bait: [
        { name: 'Makkajo\'xori', icon: '🌽', tip: 'Iliq mavsumda juda samarali' },
        { name: 'Non bo\'lagi', icon: '🍞', tip: 'Yuza qatlamda ishlaydi' },
        { name: 'Qurt (cherv)', icon: '🪱', tip: 'Bahor va kuzda eng yaxshi natija' },
        { name: 'Boyle bait', icon: '🟤', tip: 'Katta sazanlar uchun maxsus' },
        { name: 'Qovoq', icon: '🎃', tip: 'Iliq suv haroratida samarali' },
        { name: 'Pellet', icon: '⚫', tip: 'Feeder bilan kombinatsiyada' },
      ],
      seasons: [
        { season: 'Bahor', rating: 5, note: 'Aprel–Iyun — tuxum qo\'yadigan vaqt, eng faol davr' },
        { season: 'Yoz', rating: 4, note: 'Ertalab va kechqurun faol, tunda ham ov qilish mumkin' },
        { season: 'Kuz', rating: 4, note: 'Qish oldidan ovqat topadi — yaxshi davr' },
        { season: 'Qish', rating: 2, note: 'Juda sekin, chuqur joylarda uxlaydi' },
      ],
      conditions: {
        temp: '15–25°C (optimal)',
        pressure: 'Barqaror yoki pasayish arafasida',
        wind: 'Yengil shamol (1–5 m/s)',
        water: 'Loylanmagan, o\'simliklar ko\'p joylar',
        time: 'Ertalab 5:00–9:00, kechqurun 18:00–21:00',
      },
      tips: [
        'Ovdan 1–2 kun oldin "prebaiting" (priming) qiling — joy tanlab, mo\'l em tashlang',
        'Sazan suv ostidagi qattiq narsalar yaqinida bo\'lishni yaxshi ko\'radi',
        'Feeder uqdasini 30–60 daqiqada bir marta ko\'taring',
        'Ov joyini sozlamay turib katta shovqin chiqarmang',
        'Katta sazan uchun "hair rig" montaj usulidan foydalaning',
      ],
      videos: [],
    },

    {
      id: 'zander',
      name: 'Zander (Sudak)',
      emoji: '🐠',
      sciName: 'Sander lucioperca',
      habitats: ['lake', 'river'],
      difficulty: 'intermediate',
      difficultyLabel: 'O\'rta',
      difficultyColor: '#F39C12',
      maxWeight: '15 kg',
      avgWeight: '0.5–3 kg',
      description: 'Zander (sudak) O\'zbekistonda mashhur sport baliqlaridan biri. U tez va epchil bo\'lib, katta daryolar va suv omborlarida yashaydi. Spinning bilan ovlash uchun ideal.',
      habitats_desc: "Daryo va suv omborlarining chuqur joylarida, toshli va loyqa tublarda",
      methods: [
        { name: 'Spinning', icon: '🎣', desc: 'Jig va wobler bilan — eng samarali va qiziqarli usul' },
        { name: 'Jig', icon: '⚡', desc: 'Silikon baliqcha va jig boshcha kombinatsiyasi' },
        { name: 'Trolling', icon: '🚣', desc: 'Qayiqdan wobler sudrab ovlash' },
      ],
      tackle: {
        rod: '2.1–2.7 m spinning (test: 7–28 g yoki 10–40 g)',
        line: '0.12–0.16 mm PE/braid (6–10 lb)',
        hook: '№ 1–3/0 jig hook, offset',
        leader: '0.25–0.30 mm fluorocarbon, 30–40 cm (zanjir emas)',
      },
      bait: [
        { name: 'Twister (silikon)', icon: '🐛', tip: 'Rang: oq, sariq, chartreuse — bulutli havoda yaxshi' },
        { name: 'Shad (vibrohvost)', icon: '🐟', tip: '5–9 sm o\'lcham, tabiiy rang — tiniq suvda samarali' },
        { name: 'Wobler (crank)', icon: '🎯', tip: '5–10 sm, suzuvchi/sho\'ng\'uvchi tiplar' },
        { name: 'Tirik baliqcha', icon: '🐠', tip: 'Muhim: mintaqada ruxsat bo\'lsa' },
        { name: 'Jig + pasta', icon: '⚫', tip: 'Qish mavsumida chuqurda samarali' },
      ],
      seasons: [
        { season: 'Bahor', rating: 4, note: 'Mart–Aprel — tuxumdan keyin juda ochko\'z' },
        { season: 'Yoz', rating: 3, note: 'Tong va kechqurun faol, kunduz chuqurroqqa ketadi' },
        { season: 'Kuz', rating: 5, note: 'Oktyabr–Noyabr — yilning eng yaxshi davri' },
        { season: 'Qish', rating: 3, note: 'Muz ostida ham ov qilish mumkin (jig bilan)' },
      ],
      conditions: {
        temp: '10–20°C (optimal), qish: 2–6°C',
        pressure: 'Yuqori va barqaror bosimda faol',
        wind: 'Kuchsiz shamol yoki tinch',
        water: 'Loyqa yoki yashil suv ham to\'sqinlik qilmaydi',
        time: 'Shafaq va qorongu\'sida: 5:00–8:00, 19:00–23:00',
      },
      tips: [
        'Jig boshchani tubga tegizib, keyin sekin ko\'taring — "qadam" harakati',
        'Zander tishli, shuning uchun fluorocarbon lider shart',
        'Toshlar yoki suv o\'tlari yaqinida ko\'proq bo\'ladi',
        'Kechki ovda zander juda faol — zarba kuchli keladi, jihozni mustahkam turing',
        'Spinning ruxsatini tekshiring — ba\'zi suv havzalarida cheklov bor',
      ],
      videos: [],
    },

    {
      id: 'forel',
      name: 'Forel',
      emoji: '🎣',
      sciName: 'Salmo trutta / Oncorhynchus mykiss',
      habitats: ['river'],
      difficulty: 'advanced',
      difficultyLabel: 'Murakkab',
      difficultyColor: '#C0392B',
      maxWeight: '10 kg',
      avgWeight: '200–800 g',
      description: 'Forel toza, sovuq va kislorodga boy suvlarda yashaydi. O\'zbekistonda asosan tog\'li daryolarda, shuningdek maxsus forel fermalarida uchraydi. Ovlash malakasini talab qiladi.',
      habitats_desc: "Tog\'li daryolarning tez va sovuq suvlari, jarliklarning tubida",
      methods: [
        { name: 'Fly Fishing', icon: '🦋', desc: 'Sun\'iy pashshalar bilan — an\'anaviy va eng go\'zal usul' },
        { name: 'Ultralight Spinning', icon: '⚡', desc: 'Kichik wobler va spinner bilan — qulay usul' },
        { name: 'Natural Bait', icon: '🪱', desc: 'Qurt, hasharot, baliqcha bilan — asosiy usul' },
      ],
      tackle: {
        rod: 'UL spinning 1.8–2.4 m (test: 1–7 g) yoki fly rod #3-5',
        line: '0.10–0.14 mm monofilament yoki 0.06–0.08 mm PE',
        hook: '№ 10–14 mayda, ingichka simli',
        leader: '0.12–0.16 mm fluorocarbon, 20–30 cm',
      },
      bait: [
        { name: 'Sun\'iy pashsha', icon: '🦋', tip: 'Fly fishing uchun: mayfly, caddis, midge' },
        { name: 'Kichik spinner', icon: '✨', tip: '№ 0–2, kumush yoki oltin rang' },
        { name: 'Micro-wobler', icon: '🔷', tip: '3–5 sm, chuqur sho\'ng\'uvchi tiplar' },
        { name: 'Qurt', icon: '🪱', tip: 'Bahor toshqinidan keyin eng samarali' },
        { name: 'Hasharot', icon: '🦗', tip: 'Yozda: to\'g\'ri hasharotni tanlang' },
      ],
      seasons: [
        { season: 'Bahor', rating: 5, note: 'Aprel–May — eng faol. Toshqindan keyin ov qiling' },
        { season: 'Yoz', rating: 3, note: 'Ertalab va kechqurun. Issiq kunduz — faol emas' },
        { season: 'Kuz', rating: 4, note: 'Sentyabr–Oktyabr — tuxum qo\'yish oldidan faol' },
        { season: 'Qish', rating: 2, note: 'Juda sekin, chuqur va tinch joylarga boradi' },
      ],
      conditions: {
        temp: '8–16°C (optimal, 20°C dan yuqorida stress)',
        pressure: 'Barqaror bosim yaxshi',
        wind: 'Tinch yoki yengil shamol',
        water: 'Tiniq, toza, kislorodga boy suv',
        time: 'Ertalab tong otishi bilan va kechqurun qorongu\'sida',
      },
      tips: [
        'Soya tarafdan ovlang va imkon qadar jim turing — forel sizni erta sezib qochadi',
        'Suvga soya tashlang, qo\'lingizni suqmang — forel juda ehtiyotkor',
        'Catch & Release: forelni suv ostida ushlab qo\'yvoring — u aziz baliq',
        'Fly fishing uchun avval entomologiya (pashsha turlari) o\'rganing',
        'Toshlar orqasidagi tinch joylarda joylashadi — to\'lqin va girdob chekkasida ov qiling',
      ],
      videos: [],
    },

    {
      id: 'karp',
      name: 'Karp (Ko\'zguli)',
      emoji: '🐡',
      sciName: 'Cyprinus carpio (mirror)',
      habitats: ['lake', 'pond'],
      difficulty: 'intermediate',
      difficultyLabel: 'O\'rta',
      difficultyColor: '#F39C12',
      maxWeight: '40 kg',
      avgWeight: '2–8 kg',
      description: 'Ko\'zguli karp (mirror carp) oddiy sazandan farqli ravishda tanasida faqat bir qancha yirik tangachasi bor. Hovuz va ko\'llarda yashaydi va juda kuchli kurashuvchi.',
      habitats_desc: "Hovuz va ko\'llarning chuqur va loy tubida, suv o\'tlari orasida",
      methods: [
        { name: 'Carpfishing', icon: '🏕️', desc: 'Maxsus karp jihozi bilan tungi ovda — asosiy usul' },
        { name: 'Feeder', icon: '🎣', desc: 'Og\'ir feeder va chum bilan — qulay va samarali' },
        { name: 'Float', icon: '🔵', desc: 'Sirt va o\'rta chuqurlikda yengil usul' },
      ],
      tackle: {
        rod: '3.6–3.9 m Carp rod (test: 2.75–3.5 lb TC)',
        line: '0.30–0.40 mm monofilament yoki 30–35 lb braid',
        hook: '№ 2–6 carp hook (wide gape yoki curve shank)',
        leader: 'Coated braid yoki stiff rig, 25–35 cm',
      },
      bait: [
        { name: 'Boyle bait', icon: '🟤', tip: '16–24 mm, ferment qilingan yoki tabiiy xushbo\'y' },
        { name: 'Pellet', icon: '⚫', tip: '6–16 mm halibut yoki karp pellet — prebaiting bilan' },
        { name: 'Makkajo\'xori', icon: '🌽', tip: 'Cho\'chqaga beriladigan majs + qant — mumkin' },
        { name: 'Tiger nut', icon: '🥜', tip: 'Pishirilgan, maxsus tayyorlangan — juda samarali' },
        { name: 'Wafter', icon: '🟡', tip: 'Suvda suzadi, karp yutishi oson' },
      ],
      seasons: [
        { season: 'Bahor', rating: 4, note: 'May–Iyun — tuxum atrofida juda faol' },
        { season: 'Yoz', rating: 5, note: 'Tunda va ertalab ovlash yaxshi — yilning eng samarali davri' },
        { season: 'Kuz', rating: 4, note: 'Sentyabr–Oktyabr — qish oldidan em yeydi' },
        { season: 'Qish', rating: 1, note: 'Deyarli harakatsiz, ov qiyin' },
      ],
      conditions: {
        temp: '18–25°C (optimal)',
        pressure: 'Barqaror yoki tushib kelayotgan bosim',
        wind: 'Janubiy va g\'arbiy shamol — qulay',
        water: 'Iliq va mo\'tadil, suv o\'tlari ko\'p joy',
        time: 'Kechasi: 22:00–04:00 yoki ertalab: 04:00–08:00',
      },
      tips: [
        '"Spod" (priming fishing) — joyga 2–3 kun oldin prebaiting qiling',
        'Karp bir joyda uzoq turmaydi — ovozga sezgir, jim yuring',
        'Ov tugaganda baliqni qaytarib tashlang — "Catch & Release" karp populyatsiyasini saqlaydi',
        'Alarms (zvuchok) va bite indicator o\'rnatib, dam oling',
        'Hair rig — boyle baitni to\'g\'ri tayyorlang: baliq yutganda ilmoq qulay tutadi',
      ],
      videos: [],
    },

    {
      id: 'som',
      name: 'Som',
      emoji: '🦈',
      sciName: 'Silurus glanis',
      habitats: ['river', 'lake'],
      difficulty: 'advanced',
      difficultyLabel: 'Murakkab',
      difficultyColor: '#C0392B',
      maxWeight: '100+ kg',
      avgWeight: '5–20 kg',
      description: 'Som Yevropa va Osiyodagi eng yirik chuchuk suv baliqlaridan biri. O\'zbekiston daryolarida, ayniqsa Amudaryo va Sirdaryo havzalarida uchraydi. Kecha ovlanadi.',
      habitats_desc: "Katta daryolarning chuqur joylarida, qoldiq va jarlar tagida",
      methods: [
        { name: 'Deadbait', icon: '🐟', desc: 'O\'lik baliqcha bilan tubda — tungi ov' },
        { name: 'Kvok', icon: '🥊', desc: 'O\'ziga xos tovush chiqarib yuz qatlamdan ovlash' },
        { name: 'Spinning (yirik)', icon: '🎣', desc: 'Katta silikon va jig bilan chuqurda' },
      ],
      tackle: {
        rod: '2.7–3.3 m kuchli spinning yoki sea rod (test: 100–200 g)',
        line: '0.50–0.80 mm mono yoki 60–100 lb braid',
        hook: '№ 3/0–6/0 treble yoki circle hook',
        leader: '60–80 lb wire yoki 100 lb mono, 50–80 cm',
      },
      bait: [
        { name: 'Karp yoki rudd (tirik)', icon: '🐟', tip: '200–500 g — katta som uchun ideal' },
        { name: 'O\'lik baliq', icon: '🪣', tip: 'Mazali hid chiqaradi — tunda samarali' },
        { name: 'Qurt (kattaroq)', icon: '🪱', tip: 'Ko\'p qurt bir ilmoqqa — kichik som uchun' },
        { name: 'Baqacha', icon: '🐸', tip: 'Ba\'zi mintaqalarda ruxsat bo\'lsa' },
        { name: 'Silikon shad (yirik)', icon: '🐛', tip: '15–20 sm, qizil yoki qora rang' },
      ],
      seasons: [
        { season: 'Bahor', rating: 3, note: 'Suv isigandan keyin faollashadi' },
        { season: 'Yoz', rating: 5, note: 'Iyul–Avgust — eng faol, tunda ov ajoyib' },
        { season: 'Kuz', rating: 4, note: 'Sentyabr — qish oldidan intensiv ovqatlanadi' },
        { season: 'Qish', rating: 1, note: 'Chuqurda uxlaydi, deyarli tutilmaydi' },
      ],
      conditions: {
        temp: '20–28°C (optimal)',
        pressure: 'Barcha sharoitda, ayniqsa issiq kechalarda',
        wind: 'Kuchli shamol ham to\'sqinlik qilmaydi',
        water: 'Loyqa yoki qorongu\'likda ham yaxshi ko\'radi',
        time: 'Kechasi: 22:00–04:00 — asosiy ov vaqti',
      },
      tips: [
        'Som seshanba va payshanba kechalari faolroq — xalq kuzatishiga ko\'ra',
        'Tutganda juda kuchli — qaytmali katushka va kuchli qamish talab qilinadi',
        'Katta som 30+ kg bo\'lsa — uni yerga olib chiqmang, suvda suratga oling',
        'Kvok usulida suvga urib "plib-plib" tovush chiqaring',
        'Som ovida barmoqlaringizni ehtiyot qiling — ilmoqqa yutsa xavfli bo\'lishi mumkin',
      ],
      videos: [],
    },

    {
      id: 'oq-amur',
      name: 'Oq amur',
      emoji: '🌿',
      sciName: 'Ctenopharyngodon idella',
      habitats: ['lake', 'pond', 'river'],
      difficulty: 'beginner',
      difficultyLabel: 'Oson',
      difficultyColor: '#2D7A4F',
      maxWeight: '45 kg',
      avgWeight: '2–10 kg',
      description: 'Oq amur asosan o\'simliklar bilan oziqlanuvchi yirik baliq. Hovuz va suv omborlarida sun\'iy ko\'paytiriladi. Ovlash nisbatan oson, ammo kuchli kurashadi.',
      habitats_desc: "Hovuz va ko\'llarning o\'simliklar ko\'p qismi, suv o\'tlari yaqinida",
      methods: [
        { name: 'Float', icon: '🔵', desc: 'Uzoq suzgich bilan o\'simliklar yaqiniga tashlash' },
        { name: 'Feeder', icon: '🎣', desc: 'O\'t va o\'simliklar aralashmasidan feeder' },
        { name: 'Sirt ovi', icon: '🌊', desc: 'O\'t yoki mevani sirt suviga tashlash' },
      ],
      tackle: {
        rod: '3–4 m yengil feeder yoki float rod',
        line: '0.25–0.35 mm monofilament',
        hook: '№ 4–8, kuchli simli',
        leader: '0.22–0.28 mm, 40–50 cm',
      },
      bait: [
        { name: 'Ko\'k o\'t', icon: '🌿', tip: 'Uzun yashil o\'t — eng tabiiy va samarali' },
        { name: 'Makkajo\'xori', icon: '🌽', tip: 'Pishiq donlar — hovuzlarda yaxshi' },
        { name: 'Non va bug\'doy', icon: '🍞', tip: 'Yangi non bo\'laklari — klassik usul' },
        { name: 'Rezavor meva', icon: '🍓', tip: 'To\'liq pishgan rezavorlar sirtda samarali' },
        { name: 'O\'simliklar', icon: '🌱', tip: 'Suv o\'ti, salat, karam — tabiiy em' },
      ],
      seasons: [
        { season: 'Bahor', rating: 3, note: 'Iyun boshida faollashadi' },
        { season: 'Yoz', rating: 5, note: 'Iyul–Avgust — o\'simliklar bilan oziqlanadi, eng faol davr' },
        { season: 'Kuz', rating: 3, note: 'Sentyabr — hali faol, oktyabrdan sekinlashadi' },
        { season: 'Qish', rating: 1, note: 'Deyarli faol emas' },
      ],
      conditions: {
        temp: '20–28°C (optimal)',
        pressure: 'Barqaror bosim',
        wind: 'Tinch havo — suv osti o\'tlarni ko\'radi',
        water: 'O\'simliklar ko\'p, tiniq suv',
        time: 'Kunduz: 10:00–16:00, quyoshli kunlar',
      },
      tips: [
        'O\'tni ilmoqqa mustahkam o\'rang — oq amur tortganda sirg\'anib ketmasin',
        'Oq amur ko\'pincha suv sirtiga ko\'tariladi — shu paytda oldindan tashlab qo\'ying',
        'Prebaiting: maydalangan ko\'kat va o\'tlarni ov joyiga oldindan tashlang',
        'Oq amur yashil rangdagi emlarga yaxshi javob beradi',
        'Kuchli jonivor — birinchi marta tortganda reel lentsasini bo\'shatib turing',
      ],
      videos: [],
    },

    {
      id: 'tolstolobik',
      name: 'Tolstolobik',
      emoji: '💧',
      sciName: 'Hypophthalmichthys molitrix',
      habitats: ['lake', 'pond'],
      difficulty: 'intermediate',
      difficultyLabel: 'O\'rta',
      difficultyColor: '#F39C12',
      maxWeight: '50 kg',
      avgWeight: '2–12 kg',
      description: 'Tolstolobik filtrator baliq bo\'lib, suv ichidagi plankton va o\'simlik zarrachalarini yutib oziqlanadi. Ovlash texnikasi o\'ziga xos va qiziqarli.',
      habitats_desc: "Hovuz va suv omborlarining yuza va o\'rta qatlamida, plankton ko\'p joylar",
      methods: [
        { name: 'Keksa usul (pena)', icon: '🫧', desc: 'Sirtdagi ko\'pik va plankton aralashmasi bilan' },
        { name: 'Float (sirtda)', icon: '🔵', desc: 'Juda yengil suzgich bilan yuza qatlamda' },
        { name: 'Feeder (maxsus)', icon: '🎣', desc: 'O\'simlik aralashmali maxsus feeder bilan' },
      ],
      tackle: {
        rod: '3.5–5 m uzun float rod yoki match rod',
        line: '0.20–0.28 mm monofilament',
        hook: '№ 6–10, ingichka simli',
        leader: '0.16–0.20 mm, 30–40 cm',
      },
      bait: [
        { name: 'Mash (bug\'doy) ko\'pigi', icon: '🫧', tip: 'Blenderda maydalanib ko\'piklatilgan — asosiy usul' },
        { name: 'Plankton jelesi', icon: '🟢', tip: 'Quruq plankton + suv + jelatin' },
        { name: 'Kulcha un aralashma', icon: '🌾', tip: 'Tovuq yemi + bug\'doy uni + makkajo\'xori uni aralashmasi' },
        { name: 'Suv yosini', icon: '🟦', tip: 'Sirtda ko\'ringan yashil aralashma' },
      ],
      seasons: [
        { season: 'Bahor', rating: 2, note: 'Suv isiganda plankton ko\'payadi, may oyidan faol' },
        { season: 'Yoz', rating: 5, note: 'Iyun–Avgust — plankton ko\'p, eng faol davr' },
        { season: 'Kuz', rating: 3, note: 'Sentyabr — hali plankton bor, faol' },
        { season: 'Qish', rating: 1, note: 'Chuqurda, plankton yo\'q' },
      ],
      conditions: {
        temp: '22–28°C (optimal)',
        pressure: 'Barqaror, kuchsiz shamol',
        wind: 'Tinch — ko\'pikni ko\'tarmasin',
        water: 'Yashil yoki planktonli suv (akvakultura)',
        time: 'Kunduz 9:00–17:00, quyosh bo\'lganda',
      },
      tips: [
        'Tolstolobik sirtda o\'ynaganini ko\'rsangiz — u yaqinda, darhol tashlang',
        'Ko\'pikni suvga sekin tashlang — shovqin chiqarmang',
        'Uzoq qamish zarur — ov joyi odatda uzoqroqda bo\'ladi',
        'Baliq ko\'tarish kuchli — reel drag\'ni to\'g\'ri sozlang',
        'Hovuz xo\'jayinidan ruxsat oling — maxsus baliq bo\'lishi mumkin',
      ],
      videos: [],
    },

    {
      id: 'laqqa',
      name: 'Laqqa (Pike)',
      emoji: '⚡',
      sciName: 'Esox lucius',
      habitats: ['lake', 'river'],
      difficulty: 'intermediate',
      difficultyLabel: 'O\'rta',
      difficultyColor: '#F39C12',
      maxWeight: '20 kg',
      avgWeight: '0.5–4 kg',
      description: 'Laqqa — yirtqich baliq bo\'lib, eng kuchli va tez xujum qiluvchilardan biri. Spinning bilan ovlash uchun eng qiziqarli baliqlardan hisoblanadi. O\'zbekistonning shimoliy hududlarida uchraydi.',
      habitats_desc: "Ko\'l va sekin oqar daryolarda, suv o\'tlari va to\'siqlar yaqinida yashirinib turadi",
      methods: [
        { name: 'Spinning (wobler)', icon: '🎣', desc: 'Yirik wobler bilan hujum qo\'zg\'atish' },
        { name: 'Spinnerbait', icon: '✨', desc: 'Spinner bilan suv o\'tlari orasida' },
        { name: 'Jerkbait', icon: '💫', desc: 'Jerking harakati bilan — kuchli hujum chaqiradi' },
        { name: 'Deadbait', icon: '🐟', desc: 'O\'lik baliq bilan tubda qo\'yib ketish' },
      ],
      tackle: {
        rod: '2.1–2.7 m medium-heavy spinning (test: 15–60 g)',
        line: '0.25–0.35 mm PE yoki 0.35–0.45 mm mono',
        hook: '№ 1/0–3/0 treble hook',
        leader: 'Wire leader (zanjir): 20–30 cm — SHART (tish kesiladi)',
      },
      bait: [
        { name: 'Yirik wobler (8–15 sm)', icon: '🎯', tip: 'Suv o\'tlari ustida suzuvchi tiplar samarali' },
        { name: 'Spinnerbait', icon: '✨', tip: 'Yashil va sariq ranglar yaxshi ishlaydi' },
        { name: 'Jerkbait', icon: '💫', tip: 'Jerking harakati laqqa hujumini qo\'zg\'atadi' },
        { name: 'Tirik baliqcha', icon: '🐟', tip: 'Float bilan yupqa joyda — samarali' },
      ],
      seasons: [
        { season: 'Bahor', rating: 5, note: 'Mart–Aprel — muz erigandan keyin eng ochko\'z' },
        { season: 'Yoz', rating: 3, note: 'Issiqda chuqurga ketadi, ertalab va kechqurun faol' },
        { season: 'Kuz', rating: 5, note: 'Sentyabr–Noyabr — qishga em to\'planadi, ajoyib davr' },
        { season: 'Qish', rating: 2, note: 'Muz ostida ham tutish mumkin (teshib)' },
      ],
      conditions: {
        temp: '10–18°C (optimal)',
        pressure: 'Bosim tushganda faol',
        wind: 'Kuchli shamol ham to\'sqinlik qilmaydi',
        water: 'O\'simliklar ko\'p, yashirinish joyi bor',
        time: 'Ertalab: 6:00–10:00, kechqurun: 17:00–20:00',
      },
      tips: [
        'Wire leader SHART — laqqa tishli, mono va PE kesib yuboradi',
        'Wobelerni to\'xtatib-yuritib ovlang — laqqa harakatni to\'xtatganda hujum qiladi',
        'Suv o\'tining tashqi qirrasi bo\'ylab tashlang — laqqa ichkaridan poylab turadi',
        'Kuchli hujum qiladi — strikeni kechiktirmang',
        'Laqqa baliqni yutib yuboradi — ilmoqni to\'g\'ri joylang',
      ],
      videos: [],
    },

    {
      id: 'qovoqbaliq',
      name: 'Qovoqbaliq (Leshch)',
      emoji: '🌙',
      sciName: 'Abramis brama',
      habitats: ['lake', 'river', 'pond'],
      difficulty: 'beginner',
      difficultyLabel: 'Oson',
      difficultyColor: '#2D7A4F',
      maxWeight: '6 kg',
      avgWeight: '200–800 g',
      description: 'Qovoqbaliq (leshch) katta va yassi tana shakliga ega. Tubdan oziqlanadi va asosan kech va tunda faol. Yangi boshlovchilar uchun yaxshi baliq.',
      habitats_desc: "Ko\'l va daryolarning loy va qumli tubi, suv o\'tlari yaqinida",
      methods: [
        { name: 'Feeder', icon: '🎣', desc: 'Tubga tashlanadigan feeder — eng samarali' },
        { name: 'Float (chuqur)', icon: '🔵', desc: 'Chuqurlik o\'lchamli suzgich bilan' },
        { name: 'Donka', icon: '⚓', desc: 'Tubda yotadigan oddiy usul' },
      ],
      tackle: {
        rod: '3–3.6 m feeder rod (test: 30–90 g)',
        line: '0.20–0.28 mm monofilament',
        hook: '№ 8–12, ingichka simli',
        leader: '0.14–0.18 mm, 30–40 cm',
      },
      bait: [
        { name: 'Qurt', icon: '🪱', tip: 'Kichik qurt — eng asosiy em' },
        { name: 'Maggot', icon: '⚪', tip: 'Otish (prebaiting) uchun va ilmoqqa' },
        { name: 'Bug\'doy va mash', icon: '🌾', tip: 'Pishirilgan — tayyor priming uchun' },
        { name: 'Non bo\'lagi', icon: '🍞', tip: 'Maydalangan — feeder aralashmasida' },
        { name: 'Pasta (qo\'lda tayyorlangan)', icon: '🟡', tip: 'Un + qurt + mash aralashmasi' },
      ],
      seasons: [
        { season: 'Bahor', rating: 4, note: 'Aprel–May — tuxumdan keyin faol' },
        { season: 'Yoz', rating: 3, note: 'Kech va tunda faol, kunduz qiyin' },
        { season: 'Kuz', rating: 4, note: 'Sentyabr–Oktyabr — em to\'planadi' },
        { season: 'Qish', rating: 2, note: 'Chuqurda, juda sekin' },
      ],
      conditions: {
        temp: '12–20°C (optimal)',
        pressure: 'Barqaror yoki pasayish arafasida',
        wind: 'Kuchsiz shamol',
        water: 'Suv osti o\'tlari ko\'p, loy tub',
        time: 'Kech: 19:00–22:00, tong: 4:00–8:00',
      },
      tips: [
        'Prebaiting: ov joyiga 1–2 kun oldin qurt va maggot tashlang',
        'Qovoqbaliq hid bilan topadi — xushbo\'y priming samarali',
        'Float bilan ovlaganda — suzgich g\'alati harakatlarida darhol strike qiling',
        'Feeder aralashmasida maggot qo\'shing',
        'Kecha ovida ov joyi yaqinida shovqin chiqarmang',
      ],
      videos: [],
    },

    {
      id: 'qizilkoz',
      name: 'Qizilko\'z (Krasnoperka)',
      emoji: '🔴',
      sciName: 'Scardinius erythrophthalmus',
      habitats: ['lake', 'pond', 'river'],
      difficulty: 'beginner',
      difficultyLabel: 'Oson',
      difficultyColor: '#2D7A4F',
      maxWeight: '2 kg',
      avgWeight: '50–300 g',
      description: 'Qizilko\'z (krasnoperka) o\'zining yorqin qizil qanotlari bilan farqlanadi. Ko\'p tarqalgan va tutish oson bo\'lgan baliq bo\'lib, bola baliqchilar uchun ideal tanlov.',
      habitats_desc: "Ko\'l va hovuzlarning sirt qatlamida, suv o\'tlari va qamish orasida",
      methods: [
        { name: 'Float (sirtda)', icon: '🔵', desc: 'Yengil suzgich bilan sirt va o\'rta qatlamda' },
        { name: 'Fly fishing (sodda)', icon: '🦋', desc: 'Kichik sun\'iy hasharot bilan' },
        { name: 'UL Spinning', icon: '⚡', desc: 'Micro-spinner va micro-wobler bilan' },
      ],
      tackle: {
        rod: '3–4 m float rod yoki 1.8–2.1 m UL spinning',
        line: '0.12–0.18 mm monofilament',
        hook: '№ 10–14, ingichka simli',
        leader: '0.10–0.14 mm, 20–30 cm',
      },
      bait: [
        { name: 'Maggot', icon: '⚪', tip: 'Eng yaxshi natija — klassik tanlov' },
        { name: 'Qurt (kichik)', icon: '🪱', tip: 'Kichik qurt bo\'laklari' },
        { name: 'Non bo\'lagi', icon: '🍞', tip: 'Yangi non — yuzada samarali' },
        { name: 'Hasharot', icon: '🦗', tip: 'Yozda suv ustidan tushgan hasharotlar' },
        { name: 'Micro-spinner', icon: '✨', tip: '№ 00–0, kumush yoki oltin' },
      ],
      seasons: [
        { season: 'Bahor', rating: 4, note: 'Aprel–May — suv isib faollashadi' },
        { season: 'Yoz', rating: 5, note: 'Yozning boshidan oxirigacha — eng faol davr' },
        { season: 'Kuz', rating: 3, note: 'Sentyabr — hali aktiv, oktyabrda kamayadi' },
        { season: 'Qish', rating: 1, note: 'Juda sekin, tubga ketadi' },
      ],
      conditions: {
        temp: '18–26°C (optimal)',
        pressure: 'Barqaror bosim',
        wind: 'Tinch havo',
        water: 'Tiniq, suv o\'tlari va qamish bor joy',
        time: 'Kunduz: 9:00–18:00 (quyoshli kunlarda)',
      },
      tips: [
        'Yengil jihozdan foydalaning — kichik baliq, sezgi muhim',
        'Suv o\'tlari qirrasi bo\'ylab tashlang',
        'Bolalar uchun ideal — oson tutiladi, kichik va zararmas',
        'Agar ko\'p tutilsa — bir qismini qaytaring',
        'Float rang o\'zgarganda darhol strike qiling',
      ],
      videos: [],
    },
  ];

  let _allFish      = [...FISH_DATA]; // lokal + Supabase birlashgani
  let _filtered     = [...FISH_DATA];
  let _currentFish  = null;
  let _loadedFromDb = false;

  // ── Supabase'dan admin qo'shgan qo'llanmalarni olish ──
  async function loadFromDb() {
    if (_loadedFromDb) return;
    try {
      const db = Auth.getClient();
      const { data, error } = await db
        .from('fish_guides')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data?.length) return;

      // Supabase yozuvlarini lokal formatga keltirish
      const remote = data.map(normalizeDbRow);
      // Bir xil id bo'lsa — Supabase versiyasi ustun bo'ladi
      const merged = [...remote, ...FISH_DATA.filter(f => !remote.some(r => r.id === f.id))];
      _allFish = merged;
      _loadedFromDb = true;
      applyFilter({ search: '', filter: 'all' });
    } catch (err) {
      console.warn('[Guides] Supabase yuklanmadi:', err);
    }
  }

  function normalizeDbRow(row) {
    return {
      id: row.slug || String(row.id),
      slug: row.slug,
      name: row.name || 'Noma\'lum',
      emoji: row.emoji || '🐟',
      sciName: row.sci_name || '',
      habitats: row.habitats || ['lake'],
      difficulty: row.difficulty || 'beginner',
      difficultyLabel: { beginner: 'Oson', intermediate: 'O\'rta', advanced: 'Murakkab' }[row.difficulty] || 'Oson',
      difficultyColor: { beginner: '#2D7A4F', intermediate: '#F39C12', advanced: '#C0392B' }[row.difficulty] || '#2D7A4F',
      maxWeight: row.max_weight || '—',
      avgWeight: row.avg_weight || '—',
      description: row.description || '',
      habitats_desc: row.habitats_desc || '',
      methods: row.methods || [],
      tackle: row.tackle || { rod: '—', line: '—', hook: '—', leader: '—' },
      bait: row.bait || [],
      seasons: row.seasons || [],
      conditions: row.conditions || {},
      tips: row.tips || [],
      videos: row.videos || [],
      isCustom: true,
    };
  }

  // ── UI: Kartochkalar ──────────────────
  function render(data) {
    const grid = document.getElementById('guideGrid');
    if (!grid) return;

    if (!data.length) {
      grid.innerHTML = '<div class="guide-empty">🔍 Baliq topilmadi</div>';
      return;
    }

    grid.innerHTML = data.map(fish => `
      <div class="guide-card" role="button" tabindex="0" data-fish-id="${Utils.escapeAttr(fish.id)}">
        <div class="guide-card-emoji">${fish.emoji}</div>
        <div class="guide-card-body">
          <div class="guide-card-name">${Utils.escapeHtml(fish.name)}${fish.videos?.length ? ' <span class="guide-video-dot" title="Video bor">▶</span>' : ''}</div>
          <div class="guide-card-sci">${Utils.escapeHtml(fish.sciName)}</div>
          <div class="guide-card-tags">
            <span class="guide-tag" style="background:${fish.difficultyColor}20;color:${fish.difficultyColor}">${Utils.escapeHtml(fish.difficultyLabel)}</span>
            <span class="guide-tag guide-tag-weight">⚖️ ${Utils.escapeHtml(fish.avgWeight)}</span>
          </div>
        </div>
        <div class="guide-card-arrow">›</div>
      </div>
    `).join('');
  }

  function applyFilter({ search = '', filter = 'all' }) {
    let result = [..._allFish];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(f =>
        f.name.toLowerCase().includes(q) ||
        (f.sciName || '').toLowerCase().includes(q) ||
        f.difficultyLabel.toLowerCase().includes(q)
      );
    }

    if (filter === 'lake')     result = result.filter(f => f.habitats.includes('lake'));
    if (filter === 'river')    result = result.filter(f => f.habitats.includes('river'));
    if (filter === 'pond')     result = result.filter(f => f.habitats.includes('pond'));
    if (filter === 'beginner') result = result.filter(f => f.difficulty === 'beginner');
    if (filter === 'advanced') result = result.filter(f => f.difficulty === 'advanced');

    _filtered = result;
    render(result);
  }

  // ── YouTube URL → embed URL ───────────
  function toEmbedUrl(url) {
    if (!url) return null;
    const m = String(url).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
  }

  // ── Detail: ALOHIDA SAHIFA (modal emas) ──
  function openDetail(fishId) {
    const fish = _allFish.find(f => f.id === fishId);
    if (!fish) return;
    _currentFish = fish;

    const esc = Utils.escapeHtml;

    const seasonsHtml = (fish.seasons || []).map(s => {
      const stars = '⭐'.repeat(s.rating) + '☆'.repeat(5 - s.rating);
      return `
        <div class="guide-season-row">
          <span class="guide-season-name">${esc(s.season)}</span>
          <span class="guide-season-stars">${stars}</span>
          <span class="guide-season-note">${esc(s.note)}</span>
        </div>
      `;
    }).join('');

    const methodsHtml = (fish.methods || []).map(m => `
      <div class="guide-method-item">
        <span class="guide-method-icon">${m.icon || '🎣'}</span>
        <div>
          <div class="guide-method-name">${esc(m.name)}</div>
          <div class="guide-method-desc">${esc(m.desc)}</div>
        </div>
      </div>
    `).join('');

    const baitHtml = (fish.bait || []).map(b => `
      <div class="guide-bait-item">
        <span class="guide-bait-icon">${b.icon || '🪱'}</span>
        <div>
          <div class="guide-bait-name">${esc(b.name)}</div>
          <div class="guide-bait-tip">${esc(b.tip)}</div>
        </div>
      </div>
    `).join('');

    const tipsHtml = (fish.tips || []).map(t => `
      <div class="guide-tip-item">💡 ${esc(t)}</div>
    `).join('');

    // Videolar (YouTube embed)
    const videosHtml = (fish.videos || []).map(v => {
      const embed = toEmbedUrl(v.url || v);
      if (!embed) return '';
      return `
        <div class="guide-video-card">
          <div class="guide-video-frame">
            <iframe
              src="${esc(embed)}"
              title="YouTube video — ${esc(fish.name)}"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              referrerpolicy="strict-origin-when-cross-origin"></iframe>
          </div>
          ${v.title ? `<div class="guide-video-title">🎬 ${esc(v.title)}</div>` : ''}
        </div>
      `;
    }).join('');

    const cond = fish.conditions || {};

    document.getElementById('guideDetailBody').innerHTML = `
      <div class="guide-detail-hero">
        <div class="guide-detail-emoji">${fish.emoji}</div>
        <div class="guide-detail-info">
          <div class="guide-detail-name">${esc(fish.name)}</div>
          <div class="guide-detail-sci">${esc(fish.sciName)}</div>
          <div class="guide-detail-badges">
            <span class="guide-tag" style="background:${fish.difficultyColor}20;color:${fish.difficultyColor}">${esc(fish.difficultyLabel)}</span>
            <span class="guide-tag guide-tag-weight">⚖️ max ${esc(fish.maxWeight)}</span>
          </div>
        </div>
      </div>

      <p class="guide-detail-desc">${esc(fish.description)}</p>
      <div class="guide-detail-habitat">📍 ${esc(fish.habitats_desc)}</div>

      ${videosHtml ? `
        <div class="guide-section-card">
          <div class="guide-section-title">🎬 Video qo'llanma</div>
          <div class="guide-videos">${videosHtml}</div>
        </div>
      ` : ''}

      ${methodsHtml ? `
        <div class="guide-section-card">
          <div class="guide-section-title">🎣 Ovlash usullari</div>
          <div class="guide-methods">${methodsHtml}</div>
        </div>
      ` : ''}

      <div class="guide-section-card">
        <div class="guide-section-title">🪝 Jihoz va uskunalar</div>
        <div class="guide-tackle-grid">
          <div class="guide-tackle-item"><span class="gt-icon">🎋</span><div><div class="gt-label">Qamish</div><div class="gt-val">${esc(fish.tackle?.rod || '—')}</div></div></div>
          <div class="guide-tackle-item"><span class="gt-icon">🧵</span><div><div class="gt-label">Ip (line)</div><div class="gt-val">${esc(fish.tackle?.line || '—')}</div></div></div>
          <div class="guide-tackle-item"><span class="gt-icon">🪝</span><div><div class="gt-label">Ilmoq</div><div class="gt-val">${esc(fish.tackle?.hook || '—')}</div></div></div>
          <div class="guide-tackle-item"><span class="gt-icon">🔗</span><div><div class="gt-label">Lider</div><div class="gt-val">${esc(fish.tackle?.leader || '—')}</div></div></div>
        </div>
      </div>

      ${baitHtml ? `
        <div class="guide-section-card">
          <div class="guide-section-title">🥩 O'lja va xo'rak</div>
          <div class="guide-baits">${baitHtml}</div>
        </div>
      ` : ''}

      ${seasonsHtml ? `
        <div class="guide-section-card">
          <div class="guide-section-title">📅 Mavsum baholari</div>
          <div class="guide-seasons">${seasonsHtml}</div>
        </div>
      ` : ''}

      ${cond.temp ? `
        <div class="guide-section-card">
          <div class="guide-section-title">🌡️ Sharoit</div>
          <div class="guide-conditions">
            <div class="guide-cond-item"><span>🌡️</span> <b>Harorat:</b> ${esc(cond.temp)}</div>
            <div class="guide-cond-item"><span>⬇️</span> <b>Bosim:</b> ${esc(cond.pressure || '—')}</div>
            <div class="guide-cond-item"><span>💨</span> <b>Shamol:</b> ${esc(cond.wind || '—')}</div>
            <div class="guide-cond-item"><span>💧</span> <b>Suv:</b> ${esc(cond.water || '—')}</div>
            <div class="guide-cond-item"><span>🕐</span> <b>Vaqt:</b> ${esc(cond.time || '—')}</div>
          </div>
        </div>
      ` : ''}

      ${tipsHtml ? `
        <div class="guide-section-card">
          <div class="guide-section-title">⚡ Pro maslahatlar</div>
          <div class="guide-tips">${tipsHtml}</div>
        </div>
      ` : ''}
    `;

    // Ro'yxatni yashirib, sahifani ko'rsatamiz va tepaga scroll qilamiz
    document.getElementById('guideListView').classList.add('hidden');
    document.getElementById('guideDetailPage').classList.remove('hidden');
    document.getElementById('tab-guide').scrollTop = 0;
  }

  function closeDetail() {
    document.getElementById('guideDetailPage').classList.add('hidden');
    document.getElementById('guideListView').classList.remove('hidden');
    _currentFish = null;
  }

  // ── Init ──────────────────────────────
  function init() {
    render(_allFish);

    const searchInput = document.getElementById('guideSearch');
    const filterBtns  = document.querySelectorAll('[data-guide-filter]');
    let currentFilter = 'all';

    searchInput?.addEventListener('input', () => {
      applyFilter({ search: searchInput.value.trim(), filter: currentFilter });
    });

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.guideFilter;
        applyFilter({ search: searchInput?.value.trim() || '', filter: currentFilter });
      });
    });

    document.getElementById('guideGrid')?.addEventListener('click', e => {
      const card = e.target.closest('.guide-card');
      if (card) openDetail(card.dataset.fishId);
    });
    document.getElementById('guideGrid')?.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.guide-card');
      if (card) { e.preventDefault(); openDetail(card.dataset.fishId); }
    });

    // Orqaga tugmasi (detail sahifadan)
    document.getElementById('guideBackBtn')?.addEventListener('click', closeDetail);

    // Supabase'dan qo'shimcha qo'llanmalarni yuklash (fon rejimida)
    loadFromDb();
  }

  return { init, openDetail, closeDetail, loadFromDb, getAll: () => _allFish };
})();