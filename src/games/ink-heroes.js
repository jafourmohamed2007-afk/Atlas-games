/* Ink Heroes: Zombie Night — original stickman brawler, endless zombie mode */
(function () {
  'use strict';
  var G = 2400, AW = 2800, TAU = Math.PI * 2;
  var L = function (K, o) { return o[K.lang] || o.en; };

  /* ---------------- heroes ---------------- */
  var HEROES = [
    { id: 'kai', price: 0, acc: '#FF3B4E', hp: 120, spd: 300, jump: 860, size: 1, lw: 11,
      melee: { kind: 'fists', dmg: [12, 14, 28], range: [62, 62, 74], time: [0.24, 0.24, 0.34] },
      gun: { kind: 'pistol', mag: 12, dmg: 15, rate: 0.2, pel: 1, spread: 0.03, reload: 1.0 }, special: 'cyclone',
      name: { en: 'Kai', fr: 'Kai', ar: 'كاي' }, role: { en: 'Shadow Fist', fr: 'Poing de l’ombre', ar: 'قبضة الظل' }, stats: [3, 4, 3],
      sp: { en: 'Cyclone kick', fr: 'Coup cyclone', ar: 'ركلة الإعصار' } },
    { id: 'rook', price: 300, acc: '#FF9F1C', hp: 170, spd: 245, jump: 780, size: 1.1, lw: 13,
      melee: { kind: 'hammer', dmg: [20, 22, 46], range: [84, 84, 98], time: [0.34, 0.34, 0.46] },
      gun: { kind: 'shotgun', mag: 5, dmg: 8, rate: 0.6, pel: 6, spread: 0.18, reload: 1.4 }, special: 'quake',
      name: { en: 'Rook', fr: 'Rook', ar: 'روك' }, role: { en: 'Wrecker', fr: 'Démolisseur', ar: 'المحطِّم' }, stats: [5, 2, 5],
      sp: { en: 'Ground quake', fr: 'Séisme', ar: 'زلزال' } },
    { id: 'vex', price: 600, acc: '#3EE0FF', hp: 100, spd: 330, jump: 900, size: 0.96, lw: 10,
      melee: { kind: 'fists', dmg: [9, 10, 20], range: [58, 58, 68], time: [0.22, 0.22, 0.3] },
      gun: { kind: 'smg', mag: 30, dmg: 9, rate: 0.085, pel: 1, spread: 0.06, reload: 1.2 }, special: 'overdrive',
      name: { en: 'Vex', fr: 'Vex', ar: 'فيكس' }, role: { en: 'Neon Gunner', fr: 'Tireuse néon', ar: 'رامية النيون' }, stats: [4, 4, 2],
      sp: { en: 'Overdrive', fr: 'Surcharge', ar: 'الشحن الأقصى' } },
    { id: 'juno', price: 1000, acc: '#B06CFF', hp: 110, spd: 345, jump: 930, size: 1, lw: 10,
      melee: { kind: 'katana', dmg: [16, 16, 32], range: [80, 80, 92], time: [0.22, 0.22, 0.32] },
      gun: { kind: 'kunai', mag: 8, dmg: 20, rate: 0.28, pel: 1, spread: 0.01, reload: 1.1, pierce: true }, special: 'bladedash',
      name: { en: 'Juno', fr: 'Juno', ar: 'جونو' }, role: { en: 'Night Blade', fr: 'Lame de nuit', ar: 'نصل الليل' }, stats: [5, 5, 2],
      sp: { en: 'Blade dash', fr: 'Ruée de lame', ar: 'اندفاعة النصل' } }
  ];
  /* ---------------- zombies ---------------- */
  var ZT = {
    shuffler: { hp: 45, spd: 58, dmg: 9, range: 54, size: 1, col: '#8DB34E', dark: '#3F5A1E', score: 10, wave: 1, name: { en: 'Shuffler', fr: 'Traînard', ar: 'المتعثّر' }, tip: { en: 'Slow but never stops.', fr: 'Lent mais ne s’arrête jamais.', ar: 'بطيء لكنه لا يتوقف.' } },
    dasher: { hp: 28, spd: 170, dmg: 7, range: 50, size: 0.92, col: '#C3DC3E', dark: '#5C6A12', score: 15, wave: 2, name: { en: 'Dasher', fr: 'Sprinteur', ar: 'العدّاء' }, tip: { en: 'Fast! Meet it with a combo.', fr: 'Rapide ! Accueille-le avec un combo.', ar: 'سريع! استقبله بسلسلة ضربات.' } },
    gloop: { hp: 38, spd: 55, dmg: 11, range: 330, size: 1, col: '#E2D23C', dark: '#6B5E08', score: 20, wave: 3, ranged: true, name: { en: 'Gloop', fr: 'Gloop', ar: 'غلوب' }, tip: { en: 'Spits goo from afar. Don’t stand in the puddles!', fr: 'Crache de la gelée de loin. Évite les flaques !', ar: 'يبصق اللزوجة من بعيد. لا تقف في البرك!' } },
    biter: { hp: 30, spd: 115, dmg: 7, range: 48, size: 0.86, col: '#3FB59A', dark: '#14503F', score: 15, wave: 4, low: true, name: { en: 'Ankle-Biter', fr: 'Mord-Chevilles', ar: 'عضّاض الكاحل' }, tip: { en: 'Ducks under bullets. Kick it!', fr: 'Esquive les balles. Frappe-le !', ar: 'ينخفض تحت الرصاص. اركله!' } },
    bruiser: { hp: 240, spd: 44, dmg: 22, range: 84, size: 1.45, col: '#8A63C9', dark: '#3A2266', score: 50, wave: 5, heavy: true, name: { en: 'Bruiser', fr: 'Cogneur', ar: 'الضخم' }, tip: { en: 'Tough and heavy. Guns and finishers help.', fr: 'Costaud. Tire et utilise tes coups finaux.', ar: 'قوي وثقيل. استخدم السلاح والضربة القاضية.' } },
    popper: { hp: 55, spd: 50, dmg: 30, range: 70, size: 1.15, col: '#F062A8', dark: '#7A1E52', score: 25, wave: 6, explode: true, name: { en: 'Popper', fr: 'Pétard', ar: 'المنفجر' }, tip: { en: 'Explodes! Pop it near other zombies.', fr: 'Il explose ! Fais-le sauter près des autres.', ar: 'ينفجر! فجّره قرب الزومبي الآخرين.' } },
    doorman: { hp: 80, spd: 52, dmg: 12, range: 56, size: 1.05, col: '#5E9BE0', dark: '#1F3F6B', score: 35, wave: 7, shield: 70, name: { en: 'Doorman', fr: 'Portier', ar: 'حامل الباب' }, tip: { en: 'Blocks hits with a car door. Smash it with finishers!', fr: 'Bloque avec une portière. Brise-la avec un coup final !', ar: 'يصدّ الضربات بباب سيارة. حطّمه بالضربة القاضية!' } },
    gravemaw: { hp: 1500, spd: 72, dmg: 30, range: 135, size: 2.3, col: '#C2414F', dark: '#4E0E1A', score: 600, wave: 99, boss: true, name: { en: 'GRAVEMAW', fr: 'GRAVEMAW', ar: 'غريفماو' }, tip: { en: 'Boss! Jump over its shockwaves.', fr: 'Boss ! Saute par-dessus ses ondes de choc.', ar: 'زعيم! اقفز فوق موجاته الصادمة.' } }
  };
  var TYPES = ['shuffler', 'dasher', 'gloop', 'biter', 'bruiser', 'popper', 'doorman'];
  var WEAPONS = {
    katana: { melee: true, mult: 1.7, range: 22, uses: 30, col: '#DDE6F0', name: { en: 'KATANA', fr: 'KATANA', ar: 'كاتانا' } },
    axe: { melee: true, mult: 2.3, range: 12, uses: 20, col: '#B0B8C4', name: { en: 'AXE', fr: 'HACHE', ar: 'فأس' } },
    shotgun2: { gun: { mag: 18, dmg: 9, rate: 0.5, pel: 7, spread: 0.2 }, name: { en: 'SHOTGUN', fr: 'FUSIL À POMPE', ar: 'بندقية' } },
    rifle: { gun: { mag: 80, dmg: 13, rate: 0.095, pel: 1, spread: 0.035 }, name: { en: 'RIFLE', fr: 'FUSIL', ar: 'رشاش' } },
    laser: { gun: { mag: 40, dmg: 22, rate: 0.2, pel: 1, spread: 0, pierce: true, laser: true }, name: { en: 'INK LASER', fr: 'LASER D’ENCRE', ar: 'ليزر الحبر' } },
    rocket: { gun: { mag: 6, dmg: 80, rate: 0.8, pel: 1, spread: 0, rocket: true }, name: { en: 'ROCKETS', fr: 'ROQUETTES', ar: 'صواريخ' } }
  };
  var PERKS = {
    iron: { en: ['Iron Skin', '+30 max HP and heal 30'], fr: ['Peau de fer', '+30 PV max et soin de 30'], ar: ['جلد حديدي', '+30 صحة قصوى وعلاج 30'] },
    fists: { en: ['Heavy Hands', '+20% melee damage'], fr: ['Mains lourdes', '+20 % dégâts au corps à corps'], ar: ['قبضة ثقيلة', '+20% ضرر القتال القريب'] },
    trigger: { en: ['Quick Trigger', '+25% fire rate, faster reload'], fr: ['Gâchette rapide', '+25 % cadence, rechargement rapide'], ar: ['زناد سريع', '+25% سرعة إطلاق وتلقيم أسرع'] },
    mag: { en: ['Big Mag', '+50% magazine size'], fr: ['Gros chargeur', '+50 % de munitions'], ar: ['مخزن كبير', '+50% حجم المخزن'] },
    vamp: { en: ['Ink Thirst', 'Heal 3 HP per kill'], fr: ['Soif d’encre', '3 PV par zombie vaincu'], ar: ['عطش الحبر', 'استعد 3 صحة لكل زومبي'] },
    focus: { en: ['Focus', '+35% special charge'], fr: ['Concentration', '+35 % charge spéciale'], ar: ['تركيز', '+35% شحن الضربة الخاصة'] },
    buddy: { en: ['Call a Buddy', 'A stick buddy fights with you'], fr: ['Appelle un pote', 'Un allié combat avec toi'], ar: ['نادِ صديقاً', 'صديق يقاتل معك'] },
    luck: { en: ['Lucky Coins', '+50% coins'], fr: ['Pièces chanceuses', '+50 % de pièces'], ar: ['عملات الحظ', '+50% عملات'] },
    mend: { en: ['Second Wind', 'Heal 60% HP'], fr: ['Second souffle', 'Soigne 60 % des PV'], ar: ['نفس ثانٍ', 'علاج 60% من الصحة'] },
    crit: { en: ['Crit Eye', '+12% critical hits'], fr: ['Œil critique', '+12 % de coups critiques'], ar: ['عين حاسمة', '+12% ضربات حاسمة'] }
  };

  var K0, sc, gyS, camX, hero, zombies, bullets, spits, waves, pickups, parts, decals, allies, banners, mode, wave, queue, spawnT, alive, picked, sel,
    perkOpts, perkSel, hs, slow, combo, comboT, mods, kills, bossRef, tutT, ui, touchUI, held, keys, firstTypes, introT, clearT, seed;

  /* ---------------- helpers ---------------- */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function owned() { var o = K0.store.get('ink:heroes', ['kai']); return Array.isArray(o) ? o : ['kai']; }
  function heroDef() { return HEROES.filter(function (h) { return h.id === picked; })[0] || HEROES[0]; }
  function layout(K) {
    touchUI = touchUI || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
    gyS = touchUI ? K.H * (K.W > K.H ? 0.74 : 0.76) : K.H * 0.86;
    sc = Math.min(gyS / 330, K.W / 460, 1.45);
  }
  function viewW(K) { return K.W / sc; }
  function sx(x) { return (x - camX) * sc; }
  function sy(y) { return gyS + y * sc; }

  /* ---------------- stick figure rig ---------------- */
  var BASE = { tor: 0.08, hd: 0, ua: 0.5, ub: 1.9, fa: 0.7, fb: 2.2, bt: -0.25, bs: -0.1, ft: 0.3, fs: 0.15 };
  function pose(name, t, o) {
    o = o || {};
    switch (name) {
      case 'idle': return { tor: 0.1 + Math.sin(t * 3) * 0.02, hd: 0.05, ua: 0.55, ub: 2.0, fa: 0.75, fb: 2.25 + Math.sin(t * 3) * 0.05, bt: -0.3, bs: -0.1, ft: 0.32, fs: 0.12 };
      case 'run': { var a = Math.sin(t), c = Math.cos(t); return { tor: 0.28, hd: -0.05, ua: -0.8 * a, ub: -0.8 * a + 1.5, fa: 0.8 * a, fb: 0.8 * a + 1.5, bt: -0.85 * a, bs: -0.85 * a - 0.9 * Math.max(0, -c), ft: 0.85 * a, fs: 0.85 * a - 0.9 * Math.max(0, c) }; }
      case 'jump': return { tor: 0.15, hd: 0, ua: 1.2, ub: 2.4, fa: 1.6, fb: 2.7, bt: 0.2, bs: -0.9, ft: 1.2, fs: 0.1 };
      case 'jab': return { tor: 0.22, hd: 0, ua: 0.6, ub: 2.1, fa: 1.57, fb: 1.57, bt: -0.4, bs: -0.2, ft: 0.4, fs: 0.2 };
      case 'cross': return { tor: 0.34, hd: 0, ua: 1.57, ub: 1.57, fa: 0.8, fb: 2.3, bt: -0.55, bs: -0.3, ft: 0.45, fs: 0.25 };
      case 'kick': return { tor: -0.35, hd: 0.15, ua: -0.6, ub: 0.4, fa: -0.3, fb: 0.6, bt: -0.15, bs: -0.05, ft: 1.75, fs: 1.68 };
      case 'swing1': return { tor: 0.3, hd: 0, ua: 1.2, ub: 1.8, fa: 1.9, fb: 2.3, bt: -0.5, bs: -0.3, ft: 0.4, fs: 0.2 };
      case 'swing2': return { tor: 0.4, hd: 0, ua: 0.9, ub: 1.2, fa: 1.2, fb: 1.0, bt: -0.6, bs: -0.3, ft: 0.5, fs: 0.3 };
      case 'smash': return { tor: 0.55, hd: 0.1, ua: 1.0, ub: 0.9, fa: 1.1, fb: 0.7, bt: -0.7, bs: -0.4, ft: 0.6, fs: 0.4 };
      case 'dive': return { tor: 0.6, hd: 0.1, ua: -0.5, ub: 0.4, fa: 2.4, fb: 2.8, bt: -0.4, bs: -1.0, ft: 0.9, fs: 0.8 };
      case 'shoot': return { tor: 0.12, hd: 0, ua: 1.45, ub: 1.55, fa: 1.57, fb: 1.57, bt: -0.35, bs: -0.15, ft: 0.35, fs: 0.15 };
      case 'hurt': return { tor: -0.45, hd: -0.3, ua: -0.6, ub: 0.8, fa: 2.2, fb: 2.8, bt: -0.2, bs: 0.1, ft: 0.5, fs: 0.2 };
      case 'spin': { var s = Math.sin(t * 30); return { tor: 0.05, hd: 0, ua: 1.6, ub: 1.6, fa: 1.6, fb: 1.6, bt: -1.6 * s, bs: -1.6 * s, ft: 1.6 * s, fs: 1.6 * s }; }
      // zombies
      case 'zwalk': { var z = Math.sin(t); return { tor: 0.32 + (o.lean || 0), hd: 0.35, ua: 1.35 + z * 0.08, ub: 1.5, fa: 1.45 - z * 0.08, fb: 1.62, bt: -0.45 * z, bs: -0.45 * z - 0.35, ft: 0.45 * z, fs: 0.45 * z - 0.1 }; }
      case 'zrun': { var y = Math.sin(t), w = Math.cos(t); return { tor: 0.7, hd: 0.5, ua: -1.0 - y * 0.5, ub: -0.4, fa: 1.0 + y * 0.6, fb: 1.6, bt: -0.95 * y, bs: -0.95 * y - 1.0 * Math.max(0, -w), ft: 0.95 * y, fs: 0.95 * y - 1.0 * Math.max(0, w) }; }
      case 'zatk': { var k = o.k || 0; var up = k < 0.6 ? 2.8 : lerp(2.8, 0.9, (k - 0.6) / 0.4); return { tor: 0.2 + (k > 0.6 ? 0.4 : -0.1), hd: 0.2, ua: up - 0.3, ub: up - 0.2, fa: up, fb: up + 0.1, bt: -0.4, bs: -0.2, ft: 0.4, fs: 0.2 }; }
      case 'zspit': { var q = o.k || 0; return { tor: 0.75 - q * 0.6, hd: 0.6 - q, ua: 0.3, ub: 0.4, fa: 0.4, fb: 0.6, bt: -0.4, bs: -0.2, ft: 0.4, fs: 0.2 }; }
      case 'zcrawl': { var c2 = Math.sin(t); return { tor: 1.4, hd: -0.5, ua: 0.4 + c2 * 0.4, ub: 0.15 + c2 * 0.3, fa: 0.4 - c2 * 0.4, fb: 0.15 - c2 * 0.3, bt: -1.1, bs: -1.55, ft: -0.95, fs: -1.6 }; }
      case 'zhurt': return { tor: -0.3, hd: -0.5, ua: 2.2, ub: 2.6, fa: 2.0, fb: 2.4, bt: -0.3, bs: 0, ft: 0.4, fs: 0.2 };
      case 'zshield': { var r = Math.sin(t); return { tor: 0.15, hd: 0.2, ua: 1.4, ub: 1.4, fa: 1.45, fb: 1.45, bt: -0.35 * r, bs: -0.35 * r - 0.3, ft: 0.35 * r, fs: 0.35 * r - 0.1 }; }
    }
    return BASE;
  }
  function blend(cur, tgt, k) { var o = {}; for (var key in tgt) o[key] = cur && cur[key] !== undefined ? lerp(cur[key], tgt[key], k) : tgt[key]; return o; }
  // compute joint positions (world units). x,y = feet ground point; returns points + front hand info
  function rig(P, x, y, face, s, grounded, crawl) {
    var T = 40 * s, U = 22 * s, Lg = 27 * s, R = 15 * s;
    function d(a, len) { return [Math.sin(a) * face * len, Math.cos(a) * len]; }
    var neck = [Math.sin(P.tor) * face * T, -Math.cos(P.tor) * T];
    var hc = [neck[0] + Math.sin(P.tor + P.hd) * face * (R + 3 * s), neck[1] - Math.cos(P.tor + P.hd) * (R + 3 * s)];
    var bk = d(P.bt, Lg), bf = d(P.bs, Lg), fk = d(P.ft, Lg), ff = d(P.fs, Lg);
    var be = d(P.ua, U), bh = d(P.ub, U), fe = d(P.fa, U), fh = d(P.fb, U);
    var J = { hip: [0, 0], neck: neck, head: hc, bk: bk, bf: [bk[0] + bf[0], bk[1] + bf[1]], fk: fk, ff: [fk[0] + ff[0], fk[1] + ff[1]],
      be: [neck[0] + be[0], neck[1] + be[1]], fe: [neck[0] + fe[0], neck[1] + fe[1]] };
    J.bh = [J.be[0] + bh[0], J.be[1] + bh[1]]; J.fh = [J.fe[0] + fh[0], J.fe[1] + fh[1]];
    var low = Math.max(J.bf[1], J.ff[1]); if (crawl) low = Math.max(low, J.bh[1], J.fh[1]);
    var hipY = grounded ? y - low : y - 54 * s;
    for (var k in J) { J[k] = [x + J[k][0], hipY + J[k][1]]; }
    J.R = R; J.handAng = P.fb; return J;
  }
  function seg(c, a, b) { c.moveTo(sx(a[0]), sy(a[1])); c.lineTo(sx(b[0]), sy(b[1])); }
  function drawRig(c, J, col, back, lw, outline) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    var passes = outline ? [[outline, lw + 4], [null, lw]] : [[null, lw]];
    passes.forEach(function (ps) {
      c.lineWidth = ps[1] * sc;
      c.strokeStyle = ps[0] || back; c.beginPath(); seg(c, J.hip, J.bk); seg(c, J.bk, J.bf); seg(c, J.neck, J.be); seg(c, J.be, J.bh); c.stroke();
      c.strokeStyle = ps[0] || col; c.beginPath(); seg(c, J.hip, J.neck); seg(c, J.hip, J.fk); seg(c, J.fk, J.ff); seg(c, J.neck, J.fe); seg(c, J.fe, J.fh); c.stroke();
      c.fillStyle = ps[0] || col; c.beginPath(); c.arc(sx(J.head[0]), sy(J.head[1]), (J.R + (ps[0] ? 2 : 0)) * sc, 0, TAU); c.fill();
    });
  }

  /* ---------------- particles (world space) ---------------- */
  function P(o) { if (parts.length > 650) parts.shift(); o.life = 0; parts.push(o); return o; }
  function goo(x, y, col, n, spd) { for (var i = 0; i < n; i++) { var a = rnd(-Math.PI, 0), s = rnd(0.3, 1) * (spd || 380); P({ k: 'dot', x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: G * 0.8, max: rnd(0.4, 0.8), col: col, size: rnd(3, 7) }); } }
  function sparks(x, y, n, col) { for (var i = 0; i < n; i++) { var a = rnd(0, TAU), s = rnd(200, 600); P({ k: 'spark', x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 600, max: rnd(0.15, 0.35), col: col || '#FFE58A', size: 3 }); } }
  function ftext(x, y, txt, col, size) { P({ k: 'text', x: x, y: y, vx: rnd(-30, 30), vy: -160, g: 300, max: 0.8, col: col, size: size || 22, txt: txt }); }
  function ring(x, y, r, col) { P({ k: 'ring', x: x, y: y, vx: 0, vy: 0, g: 0, max: 0.35, col: col || '#FFFFFF', size: r }); }
  function ragdoll(J, col, dir, s, lw) {
    [[J.hip, J.neck], [J.hip, J.bk], [J.bk, J.bf], [J.hip, J.fk], [J.fk, J.ff], [J.neck, J.be], [J.be, J.bh], [J.neck, J.fe], [J.fe, J.fh]].forEach(function (pr) {
      var a = pr[0], b = pr[1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      P({ k: 'limb', x: mx, y: my, vx: dir * rnd(80, 380) + rnd(-80, 80), vy: rnd(-650, -250), g: G, max: rnd(1.4, 2), col: col, len: Math.hypot(b[0] - a[0], b[1] - a[1]), ang: Math.atan2(b[1] - a[1], b[0] - a[0]), va: rnd(-14, 14), size: lw });
    });
    P({ k: 'head', x: J.head[0], y: J.head[1], vx: dir * rnd(120, 420), vy: rnd(-800, -400), g: G, max: 1.9, col: col, size: J.R, va: rnd(-10, 10), ang: 0 });
  }

  /* ---------------- run setup ---------------- */
  function newHero(K) {
    var h = heroDef();
    return { def: h, x: AW / 2, y: 0, vx: 0, vy: 0, face: 1, hp: h.hp, maxHp: h.hp, ground: true, pose: pose('idle', 0), animT: 0,
      atkT: 0, atkDur: 0, step: -1, buf: false, comboWin: 0, hitDone: false, dive: false, diveHits: [], shootCd: 0, ammo: h.gun.mag, reloadT: 0,
      ink: 0, specialT: 0, specialKind: null, specTick: 0, hurtT: 0, inv: 0, rage: 0, melee: null, gun2: null, scarf: [], dashes: 0 };
  }
  function startRun(K) {
    hero = newHero(K); zombies = []; bullets = []; spits = []; pickups = []; parts = []; decals = []; allies = []; banners = [];
    waves = []; wave = 0; queue = []; spawnT = 0; hs = 0; slow = 0; combo = 0; comboT = 0; kills = 0; bossRef = null; tutT = 0; firstTypes = {}; introT = 0; clearT = 0;
    mods = { maxHp: 0, melee: 1, rate: 1, mag: 1, vamp: 0, focus: 1, buddy: 0, luck: 1, crit: 0.05 };
    camX = clamp(hero.x - viewW(K) / 2, 0, Math.max(0, AW - viewW(K)));
    nextWave(K);
  }
  function nextWave(K) {
    wave++; mode = 'fight'; introT = 1.6; K.sfx(wave % 5 === 0 ? 'boss' : 'star');
    var n = wave, count = Math.min(46, 5 + n * 3), avail = TYPES.filter(function (t) { return ZT[t].wave <= n; });
    queue = [];
    for (var i = 0; i < count; i++) {
      var t = 'shuffler', r = Math.random();
      if (avail.length > 1 && r > Math.max(0.25, 0.7 - n * 0.05)) t = avail[1 + Math.floor(Math.random() * (avail.length - 1))];
      queue.push(t);
    }
    // the newest type always shows up early so its intro appears
    var newest = TYPES.filter(function (t) { return ZT[t].wave === n; })[0]; if (newest) queue.splice(2, 0, newest);
    if (n % 5 === 0) queue.splice(Math.floor(queue.length / 3), 0, 'gravemaw');
    spawnT = 1.2;
    for (var b = 0; b < mods.buddy; b++) if (!allies[b] || allies[b].dead) allies[b] = newAlly(K, b);
    K.info(K.t('wave') + ' ' + wave);
  }
  function newAlly(K, i) { return { x: hero.x - 60 - i * 40, y: 0, vx: 0, vy: 0, face: 1, hp: 90 + wave * 10, maxHp: 90 + wave * 10, pose: pose('idle', 0), animT: 0, atkT: 0, cd: 0, col: ['#22C55E', '#F59E0B'][i % 2], dead: false }; }
  function spawnZombie(K, t) {
    var d = ZT[t], m = 1 + (wave - 1) * 0.1, vw = viewW(K), side = Math.random() < 0.5 ? -1 : 1, x;
    if (t === 'biter' && Math.random() < 0.6) x = clamp(hero.x + side * rnd(220, 380), 40, AW - 40);
    else {
      var lx = camX - 70, rx = camX + vw + 70;
      if (lx < 30) side = 1; else if (rx > AW - 30) side = -1;
      x = clamp(side < 0 ? lx : rx, 30, AW - 30);
      if (Math.abs(x - hero.x) < 260) x = clamp(hero.x - side * 420, 30, AW - 30);
    }
    var hp = Math.round(d.hp * (d.boss ? 1 + Math.floor(wave / 5 - 1) * 0.35 : m));
    var z = { t: t, d: d, x: x, y: 0, vx: 0, vy: 0, face: x < hero.x ? 1 : -1, hp: hp, maxHp: hp, pose: pose('zwalk', 0), animT: rnd(0, 6), atkT: 0, atkHit: false, cd: rnd(0.3, 1.2),
      stun: 0, rise: t === 'biter' ? 0.6 : 0, fuse: 0, shield: d.shield || 0, dmgM: 1 + (wave - 1) * 0.04, spd: d.spd * rnd(0.9, 1.12) * (1 + Math.min(0.4, wave * 0.02)), bossT: 2, bossAct: null };
    zombies.push(z);
    if (!firstTypes[t]) { firstTypes[t] = true; banners.push({ t: 3.2, title: (d.boss ? '' : K.t('newZ') + ' ') + L(K, d.name), sub: L(K, d.tip), col: d.col }); if (d.boss) { K.shake(10); bossRef = z; } }
    if (d.boss) { bossRef = z; K.sfx('boss'); }
    if (Math.random() < 0.3) K.sfx('groan');
  }

  /* ---------------- combat ---------------- */
  function meleeSpec() {
    var h = hero.def, m = h.melee;
    if (hero.melee) { var w = WEAPONS[hero.melee.id]; return { kind: hero.melee.id, dmg: m.dmg.map(function (v) { return Math.max(v, 13) * w.mult; }), range: m.range.map(function (r) { return r + w.range; }), time: m.time.map(function (t) { return t + 0.03; }) }; }
    return m;
  }
  function gunSpec() {
    var g = hero.gun2 ? WEAPONS[hero.gun2.id].gun : hero.def.gun;
    return { mag: g.mag, dmg: g.dmg, rate: g.rate / mods.rate, pel: g.pel, spread: g.spread, reload: (g.reload || 1) / Math.sqrt(mods.rate), pierce: g.pierce, laser: g.laser, rocket: g.rocket };
  }
  function attack(K) {
    if (mode !== 'fight' || hero.hp <= 0 || hero.specialT > 0) return;
    if (hero.atkT > 0) { hero.buf = true; return; }
    if (!hero.ground) { if (!hero.dive) { hero.dive = true; hero.diveHits = []; hero.vy = 760; hero.vx = hero.face * 420; hero.atkT = 0; K.sfx('whoosh'); } return; }
    var m = meleeSpec();
    // auto-face: if nothing is in front but a zombie is close behind, turn around
    var front = false, behind = null;
    zombies.forEach(function (z) { if (z.dead) return; var dx = (z.x - hero.x) * hero.face; if (dx > -10 && dx < m.range[2] + 30) front = true; else if (dx < 0 && dx > -160 && (!behind || Math.abs(z.x - hero.x) < Math.abs(behind.x - hero.x))) behind = z; });
    if (!front && behind) hero.face = -hero.face;
    hero.step = hero.comboWin > 0 ? (hero.step + 1) % 3 : 0;
    hero.atkT = hero.atkDur = m.time[hero.step]; hero.hitDone = false; hero.buf = false;
    hero.vx = hero.face * (hero.step === 2 ? 220 : 120);
    K.sfx('whoosh');
  }
  function hitZombie(K, z, dmg, dir, kb, ky, src) {
    if (z.dead || z.rise > 0.2) return false;
    var crit = Math.random() < mods.crit && src !== 'boom';
    if (hero.rage > 0) dmg *= 2;
    // Doorman shield blocks frontal hits
    if (z.shield > 0 && dir === -z.face) {
      var breaker = src === 'finisher' || src === 'special' || src === 'dive' || src === 'boom' || src === 'axe';
      z.shield -= breaker ? dmg * 1.5 : dmg * 0.35;
      sparks(z.x + z.face * 24 * z.d.size, -70, 6, '#DDE6F0'); K.sfx('block');
      if (z.shield <= 0) { K.sfx('heavy'); K.shake(6); ftext(z.x, -150, K.t('broken'), '#FFE58A', 24); P({ k: 'door', x: z.x + z.face * 20, y: -70, vx: -dir * -300, vy: -500, g: G, max: 1.6, ang: 0, va: rnd(-8, 8), col: '#9FB4CC', size: 1 }); }
      else { ftext(z.x, -140, K.t('block'), '#DDE6F0', 18); z.vx = dir * 60; return true; }
      if (!breaker) return true;
    }
    if (crit) dmg *= 2;
    dmg = Math.round(dmg);
    z.hp -= dmg; z.stun = z.d.boss ? 0.05 : (z.d.heavy ? 0.12 : 0.28); z.atkT = z.d.boss ? z.atkT : 0;
    var res = z.d.boss ? 0.15 : z.d.heavy ? 0.35 : 1;
    z.vx = dir * kb * res; if (ky && !z.d.boss) z.vy = -ky * res;
    combo++; comboT = 2.6; hero.ink = Math.min(100, hero.ink + dmg * 0.45 * mods.focus);
    goo(z.x, -60 * z.d.size, z.d.col, crit ? 10 : 5, 300);
    ftext(z.x + rnd(-10, 10), -120 * z.d.size, (crit ? '' : '') + dmg, crit ? '#FFE15A' : '#FFFFFF', crit ? 30 : 22);
    if (z.hp <= 0) killZombie(K, z, dir);
    return true;
  }
  function killZombie(K, z, dir) {
    z.dead = true; kills++;
    var mult = 1 + Math.min(2, Math.floor(combo / 10) * 0.25);
    K.addScore(Math.round(z.d.score * mult));
    var J = rig(z.pose, z.x, z.y, z.face, z.d.size, z.y >= -1, z.t === 'biter');
    ragdoll(J, z.d.col, dir || -z.face, z.d.size, 10 * z.d.size);
    goo(z.x, -50, z.d.col, 16, 520); decals.push({ x: z.x, w: rnd(30, 60) * z.d.size, col: z.d.col, t: 8 });
    if (z.d.explode) explode(K, z.x, -50 * z.d.size, 140, 60, z);
    if (mods.vamp) hero.hp = Math.min(hero.maxHp, hero.hp + mods.vamp);
    // drops
    var r = Math.random(), coinN = z.d.boss ? 25 : z.d.heavy ? 5 : (r < 0.55 ? (Math.random() < 0.3 ? 2 : 1) : 0);
    for (var i = 0; i < coinN; i++) pickups.push({ k: 'coin', x: z.x, y: -40, vx: rnd(-220, 220), vy: rnd(-600, -300), t: 0 });
    if (Math.random() < 0.07) pickups.push({ k: 'heart', x: z.x, y: -40, vx: rnd(-100, 100), vy: -500, t: 0 });
    if (Math.random() < 0.05) pickups.push({ k: 'ink', x: z.x, y: -40, vx: rnd(-100, 100), vy: -500, t: 0 });
    if (Math.random() < (z.d.boss ? 1 : z.d.heavy ? 0.5 : 0.06)) pickups.push({ k: 'crate', x: z.x, y: -60, vx: rnd(-80, 80), vy: -520, t: 0, id: Object.keys(WEAPONS)[Math.floor(Math.random() * 6)] });
    if (Math.random() < 0.02 && !hero.rage) pickups.push({ k: 'rage', x: z.x, y: -40, vx: 0, vy: -500, t: 0 });
    if (z.d.boss) { bossRef = null; slow = 1.2; K.confetti(80); K.shake(16); K.sfx('reward'); }
    else { hs = Math.max(hs, 0.045); K.sfx('punch'); }
    if (combo > 0 && combo % 25 === 0) { banners.push({ t: 1.6, title: combo + ' ' + K.t('combo') + '!', sub: '', col: '#FFE15A' }); K.sfx('combo'); }
  }
  function explode(K, x, y, r, dmg, src) {
    K.sfx('boom'); K.shake(12); ring(x, y, r, '#FFE58A'); ring(x, y, r * 0.6, '#FF8A1F');
    for (var i = 0; i < 26; i++) { var a = rnd(0, TAU), s = rnd(100, 520); P({ k: 'smoke', x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 100, g: -100, max: rnd(0.5, 0.9), col: i % 3 ? '#FF8A1F' : '#FFE15A', size: rnd(10, 22) }); }
    zombies.forEach(function (z) { if (z === src || z.dead) return; var dd = Math.abs(z.x - x); if (dd < r) hitZombie(K, z, dmg * (1 - dd / r * 0.5), z.x < x ? -1 : 1, 420, 450, 'boom'); });
    if (src && src.t && Math.abs(hero.x - x) < r * 0.85 && hero.y > -120) hurtHero(K, src.d.dmg * src.dmgM, hero.x < x ? -1 : 1);
  }
  function hurtHero(K, dmg, dir) {
    if (hero.inv > 0 || hero.hp <= 0 || mode !== 'fight') return;
    if (K.test && window.__inkGod) return;
    if (hero.specialT > 0 && (hero.specialKind === 'overdrive' || hero.specialKind === 'bladedash')) return;
    hero.hp -= Math.round(dmg); hero.inv = 0.7; hero.hurtT = 0.28; hero.vx = dir * 340; hero.vy = -260; hero.ground = false;
    hero.atkT = 0; hero.dive = false; combo = 0;
    K.sfx('hit'); K.shake(7); K.flash('#FF3B4E', 0.22); K.haptic(40);
    goo(hero.x, -70, '#111111', 6, 260);
    if (hero.hp <= 0) {
      hero.hp = 0;
      var J = rig(hero.pose, hero.x, hero.y, hero.face, hero.def.size, hero.ground, false);
      ragdoll(J, '#111111', dir, 1, hero.def.lw); hero.dead = true;
      K.gameOver({ title: K.t('overrun') });
    }
  }
  function fire(K) {
    if (hero.shootCd > 0 || hero.reloadT > 0 || hero.specialT > 0 || mode !== 'fight' || hero.hp <= 0) return;
    var g = gunSpec();
    if (hero.gun2) { if (hero.gun2.ammo <= 0) { hero.gun2 = null; return; } hero.gun2.ammo--; }
    else { if (hero.ammo <= 0) { reload(K); return; } hero.ammo--; }
    hero.shootCd = g.rate; hero.shootPose = 0.18;
    var hx = hero.x + hero.face * 52 * hero.def.size, hy = -80 * hero.def.size + (hero.y);
    for (var i = 0; i < g.pel; i++) {
      var a = rnd(-g.spread, g.spread);
      bullets.push({ x: hx, y: hy, vx: hero.face * (g.rocket ? 900 : 1700) * Math.cos(a), vy: 1700 * Math.sin(a), dmg: g.dmg * (hero.def.id === 'vex' ? 1 : 1), pierce: g.pierce, laser: g.laser, rocket: g.rocket, life: 0.7, hit: [] });
    }
    P({ k: 'flash', x: hx + hero.face * 8, y: hy, vx: 0, vy: 0, g: 0, max: 0.06, col: g.laser ? '#3EE0FF' : '#FFE58A', size: g.rocket ? 22 : 14 });
    if (!g.laser && !g.rocket) P({ k: 'casing', x: hero.x + hero.face * 30, y: hy, vx: -hero.face * rnd(80, 180), vy: rnd(-380, -220), g: G, max: 0.8, col: '#FFC93C', size: 3, ang: 0, va: 20 });
    hero.vx -= hero.face * (g.rocket ? 160 : g.pel > 1 ? 90 : 8);
    K.sfx(g.rocket ? 'heavy' : 'shot');
    if (hero.gun2 && hero.gun2.ammo <= 0) { hero.gun2 = null; ftext(hero.x, -150, K.t('empty'), '#FFFFFF', 18); }
    else if (!hero.gun2 && hero.ammo <= 0) reload(K);
  }
  function reload(K) { if (hero.gun2 || hero.reloadT > 0 || hero.ammo >= Math.round(hero.def.gun.mag * mods.mag)) return; hero.reloadT = gunSpec().reload; K.sfx('reload'); }
  function special(K) {
    if (hero.ink < 100 || hero.specialT > 0 || mode !== 'fight' || hero.hp <= 0) return;
    hero.ink = 0; var k = hero.def.special; hero.specialKind = k; hero.atkT = 0; hero.dive = false;
    K.sfx('flip'); K.flash('#FFFFFF', 0.25); ring(hero.x, -60, 120, hero.def.acc);
    if (k === 'cyclone') { hero.specialT = 1.5; hero.specTick = 0; }
    else if (k === 'quake') { hero.specialT = 1.4; hero.vy = -1050; hero.ground = false; hero.quakeArmed = true; }
    else if (k === 'overdrive') { hero.specialT = 2.4; hero.specTick = 0; }
    else if (k === 'bladedash') { hero.specialT = 1.2; hero.dashes = 3; hero.specTick = 0; hero.dashHit = []; }
  }
  function jump(K) {
    if (mode !== 'fight' || hero.hp <= 0) return;
    if (hero.ground) { hero.vy = -hero.def.jump; hero.ground = false; K.sfx('jump'); hero.atkT = 0; }
  }

  /* ---------------- update ---------------- */
  function updateHero(K, dt) {
    var h = hero, def = h.def;
    var left = keys.left || held.left, right = keys.right || held.right, mv = (right ? 1 : 0) - (left ? 1 : 0);
    h.inv = Math.max(0, h.inv - dt); h.hurtT = Math.max(0, h.hurtT - dt); h.comboWin = Math.max(0, h.comboWin - dt); h.shootCd = Math.max(0, h.shootCd - dt);
    h.rage = Math.max(0, h.rage - dt); h.shootPose = Math.max(0, (h.shootPose || 0) - dt);
    if (h.reloadT > 0) { h.reloadT -= dt; if (h.reloadT <= 0) h.ammo = Math.round(def.gun.mag * mods.mag); }
    if ((keys.shoot || held.shoot) && !h.atkT) fire(K);
    var spd = def.spd * (h.atkT > 0 ? 0.25 : 1) * (h.specialKind === 'cyclone' && h.specialT > 0 ? 0.6 : 1);
    if (h.hurtT <= 0 && !h.dive && !(h.specialT > 0 && h.specialKind === 'bladedash')) {
      var tvx = mv * spd; h.vx += (tvx - h.vx) * Math.min(1, dt * (h.ground ? 14 : 5));
      if (mv && h.atkT <= 0 && !h.shootPose) h.face = mv;
    }
    // specials
    if (h.specialT > 0) {
      h.specialT -= dt; h.specTick -= dt;
      if (h.specialKind === 'cyclone' && h.specTick <= 0) {
        h.specTick = 0.11; h.face = -h.face; K.sfx('whoosh');
        zombies.forEach(function (z) { if (!z.dead && Math.abs(z.x - h.x) < 150 && z.y > -200) { z.x += (h.x - z.x) * 0.08; hitZombie(K, z, 9 * mods.melee, z.x < h.x ? -1 : 1, 120, 120, 'special'); } });
      } else if (h.specialKind === 'overdrive' && h.specTick <= 0) {
        h.specTick = 0.05; var side = Math.random() < 0.5 ? 1 : -1;
        bullets.push({ x: h.x + side * 40, y: -80 + rnd(-12, 12), vx: side * 1800, vy: rnd(-60, 60), dmg: 11, life: 0.6, hit: [] }); K.sfx('shot');
      } else if (h.specialKind === 'bladedash' && h.specTick <= 0 && h.dashes > 0) {
        h.dashes--; h.specTick = 0.38; h.dashHit = []; var tgt = nearestZombie(h.x, 700); if (tgt) h.face = tgt.x > h.x ? 1 : -1;
        h.vx = h.face * 1500; K.sfx('whoosh'); ring(h.x, -70, 60, def.acc);
      }
      if (h.specialKind === 'bladedash') {
        h.vx *= Math.pow(0.02, dt);
        zombies.forEach(function (z) { if (!z.dead && h.dashHit.indexOf(z) < 0 && Math.abs(z.x - h.x) < 60) { h.dashHit.push(z); hitZombie(K, z, 38 * mods.melee, h.face, 300, 300, 'special'); P({ k: 'slash', x: z.x, y: -70, vx: 0, vy: 0, g: 0, max: 0.2, col: def.acc, size: 70, ang: rnd(-0.6, 0.6) }); } });
      }
      if (h.specialT <= 0) h.specialKind = h.specialKind === 'quake' && h.quakeArmed ? 'quake' : null;
    }
    // melee timing
    if (h.atkT > 0) {
      h.atkT -= dt; var el = h.atkDur - h.atkT, m = meleeSpec();
      if (!h.hitDone && el > h.atkDur * 0.35) {
        h.hitDone = true; var any = false, fin = h.step === 2, range = m.range[h.step];
        zombies.forEach(function (z) {
          if (z.dead) return; var dx = (z.x - h.x) * h.face;
          if (dx > -14 && dx < range + 16 * z.d.size && z.y > -150) {
            var src = fin ? 'finisher' : (h.melee && h.melee.id === 'axe') ? 'axe' : 'melee';
            if (hitZombie(K, z, m.dmg[h.step] * mods.melee, h.face, fin ? 520 : 160, fin ? 380 : 0, src)) any = true;
          }
        });
        if (any) {
          hs = Math.max(hs, fin ? 0.08 : 0.035); K.sfx(fin || m.kind === 'hammer' || m.kind === 'axe' ? 'heavy' : 'punch'); if (fin) K.shake(5);
          if (h.melee) { h.melee.uses--; if (h.melee.uses <= 0) { h.melee = null; ftext(h.x, -150, K.t('broke'), '#FFFFFF', 18); } }
          P({ k: 'slash', x: h.x + h.face * range * 0.6, y: -78, vx: 0, vy: 0, g: 0, max: 0.14, col: m.kind === 'fists' ? '#FFFFFF' : '#E6F0FF', size: range * 0.9, ang: h.face > 0 ? 0 : Math.PI, face: h.face });
        }
      }
      if (h.atkT <= 0) { h.atkT = 0; h.comboWin = 0.5; if (h.buf) { h.buf = false; attack(K); } }
    }
    // physics
    h.vy += G * dt; h.x += h.vx * dt; h.y += h.vy * dt;
    if (h.dive) zombies.forEach(function (z) { if (!z.dead && h.diveHits.indexOf(z) < 0 && Math.abs(z.x - h.x) < 50 * z.d.size && h.y > -130 * z.d.size) { h.diveHits.push(z); hitZombie(K, z, 24 * mods.melee, h.face, 380, 300, 'dive'); hs = Math.max(hs, 0.05); K.sfx('heavy'); } });
    if (h.y >= 0) {
      if (!h.ground) {
        if (h.dive) { ring(h.x, 0, 60, '#FFFFFF'); K.shake(3); }
        if (h.specialKind === 'quake' && h.quakeArmed) {
          h.quakeArmed = false; h.specialKind = null; K.shake(18); K.sfx('boom'); ring(h.x, 0, 340, def.acc); ring(h.x, 0, 200, '#FFFFFF');
          for (var i = 0; i < 20; i++) P({ k: 'smoke', x: h.x + rnd(-300, 300), y: -10, vx: rnd(-80, 80), vy: rnd(-300, -100), g: 200, max: 0.7, col: '#C9A27A', size: rnd(10, 20) });
          zombies.forEach(function (z) { if (!z.dead && Math.abs(z.x - h.x) < 340) hitZombie(K, z, 75 * mods.melee, z.x < h.x ? -1 : 1, 420, 650, 'special'); });
        }
        K.sfx('land');
      }
      h.y = 0; h.vy = 0; h.ground = true; h.dive = false;
    } else h.ground = false;
    h.x = clamp(h.x, 30, AW - 30);
    // pose
    h.animT += dt * (Math.abs(h.vx) > 40 ? Math.abs(h.vx) / 26 : 3);
    var tp, m2 = meleeSpec();
    if (h.hurtT > 0) tp = pose('hurt');
    else if (h.specialKind === 'cyclone' && h.specialT > 0) tp = pose('spin', h.animT);
    else if (h.specialKind === 'overdrive' && h.specialT > 0) tp = pose('shoot');
    else if (h.dive) tp = pose('dive');
    else if (h.atkT > 0) tp = m2.kind === 'fists' ? pose(['jab', 'cross', 'kick'][h.step]) : pose(['swing1', 'swing2', 'smash'][h.step]);
    else if (h.shootPose > 0) tp = pose('shoot');
    else if (!h.ground) tp = pose('jump');
    else if (Math.abs(h.vx) > 40) tp = pose('run', h.animT);
    else tp = pose('idle', K.time);
    if (h.atkT > 0 && m2.kind !== 'fists') { var pr = 1 - h.atkT / h.atkDur; tp.fb = lerp(2.9, 0.8, Math.min(1, pr * 2)); tp.fa = lerp(2.5, 1.1, Math.min(1, pr * 2)); }
    h.pose = blend(h.pose, tp, 1 - Math.exp(-dt * 26));
    // scarf (Kai) — verlet tail
    if (def.id === 'kai' || def.id === 'juno') {
      var J = rig(h.pose, h.x, h.y, h.face, def.size, h.ground, false), anchor = def.id === 'kai' ? J.neck : [J.head[0] - h.face * 10, J.head[1] - 4];
      if (!h.scarf.length) for (var s = 0; s < 8; s++) h.scarf.push([anchor[0], anchor[1]]);
      h.scarf[0] = [anchor[0], anchor[1]];
      for (var q = 1; q < h.scarf.length; q++) {
        var p0 = h.scarf[q - 1], p1 = h.scarf[q];
        p1[0] += -h.vx * dt * 0.35 - h.face * 18 * dt + Math.sin(K.time * 9 + q) * 0.8; p1[1] += 40 * dt;
        var dx = p1[0] - p0[0], dy = p1[1] - p0[1], dd = Math.hypot(dx, dy) || 1, seg2 = def.id === 'kai' ? 9 : 7;
        p1[0] = p0[0] + dx / dd * seg2; p1[1] = p0[1] + dy / dd * seg2;
      }
    }
  }
  function nearestZombie(x, maxD) { var best = null, bd = maxD; zombies.forEach(function (z) { if (!z.dead && z.rise <= 0) { var d = Math.abs(z.x - x); if (d < bd) { bd = d; best = z; } } }); return best; }
  function updateZombies(K, dt) {
    for (var i = 0; i < zombies.length; i++) {
      var z = zombies[i], d = z.d; if (z.dead) continue;
      z.animT += dt * (d.boss ? 3 : z.t === 'dasher' ? 13 : z.t === 'biter' ? 9 : 4);
      if (z.rise > 0) { z.rise -= dt; if (z.rise > 0) continue; }
      var dx = hero.x - z.x, ad = Math.abs(dx);
      if (z.stun > 0) { z.stun -= dt; }
      else if (z.atkT > 0) {
        z.atkT -= dt;
        if (!z.atkHit && z.atkT < (d.boss ? 0.2 : 0.14)) {
          z.atkHit = true;
          if (d.ranged) { var t2 = 0.9, gS = G * 0.55, y0 = -95; spits.push({ x: z.x + z.face * 20, y: y0, vx: (hero.x - z.x) / t2, vy: (-50 - y0 - 0.5 * gS * t2 * t2) / t2, dmg: d.dmg * z.dmgM, life: 2 }); K.sfx('pop'); }
          else if (ad < d.range + 24 && hero.y > -100 * d.size) hurtHero(K, d.dmg * z.dmgM, dx > 0 ? 1 : -1);
          if (d.boss) { K.shake(8); K.sfx('heavy'); }
        }
        if (z.atkT <= 0) { z.cd = d.ranged ? rnd(1.8, 2.6) : (d.boss ? 1.0 : rnd(0.7, 1.1)); }
      } else if (d.boss) bossAI(K, z, dt, dx);
      else if (d.explode && z.fuse > 0) { z.fuse -= dt; z.vx *= 0.9; if (z.fuse <= 0) { z.hp = 0; killZombie(K, z, 0); continue; } }
      else {
        z.face = dx > 0 ? 1 : -1; z.cd -= dt;
        var want = 0;
        if (d.ranged) { if (ad > 380) want = z.face; else if (ad < 220) want = -z.face; if (ad < 420 && z.cd <= 0) { z.atkT = 0.6; z.atkHit = false; } }
        else if (ad < d.range) { if (d.explode) { z.fuse = 0.75; K.sfx('tick'); } else if (z.cd <= 0) { z.atkT = d.heavy ? 0.7 : 0.45; z.atkHit = false; } }
        else want = z.face;
        z.vx += (want * z.spd - z.vx) * Math.min(1, dt * 6);
      }
      z.vy += G * dt; z.x += z.vx * dt; z.y += z.vy * dt;
      if (z.y >= 0) { if (z.vy > 400) { ring(z.x, 0, 30 * d.size, '#FFFFFF'); } z.y = 0; z.vy = 0; }
      if (z.stun > 0) z.vx *= Math.pow(0.05, dt);
      z.x = clamp(z.x, 20, AW - 20);
      // separation
      for (var j = i + 1; j < zombies.length; j++) { var o = zombies[j]; if (o.dead) continue; var sep = 22 * (d.size + o.d.size) / 2, ddx = o.x - z.x; if (Math.abs(ddx) < sep && Math.abs(o.y - z.y) < 60) { var push = (sep - Math.abs(ddx)) * 0.5 * (ddx >= 0 ? 1 : -1); if (!d.boss) z.x -= push * 0.5; if (!o.d.boss) o.x += push * 0.5; } }
      // pose
      var tp;
      if (z.stun > 0) tp = pose('zhurt');
      else if (z.atkT > 0) tp = d.ranged ? pose('zspit', 0, { k: 1 - z.atkT / 0.6 }) : pose('zatk', 0, { k: 1 - z.atkT / (d.boss ? 0.9 : d.heavy ? 0.7 : 0.45) });
      else if (z.t === 'biter') tp = pose('zcrawl', z.animT);
      else if (z.t === 'dasher') tp = pose('zrun', z.animT);
      else if (z.t === 'doorman' && z.shield > 0) tp = pose('zshield', z.animT);
      else tp = pose('zwalk', z.animT, { lean: z.t === 'gloop' ? 0.35 : 0 });
      if (z.t === 'biter' && z.atkT > 0) { tp.tor = 1.2; }
      z.pose = blend(z.pose, tp, 1 - Math.exp(-dt * 16));
    }
    zombies = zombies.filter(function (z) { return !z.dead; });
  }
  function bossAI(K, z, dt, dx) {
    var ad = Math.abs(dx); z.bossT -= dt;
    if (z.bossAct === 'charge') {
      z.chargeT -= dt; if (z.chargeT > 0.9) { z.vx *= 0.8; if (Math.random() < 0.3) P({ k: 'smoke', x: z.x - z.face * 30, y: -10, vx: -z.face * 100, vy: -60, g: 0, max: 0.4, col: '#C9A27A', size: 14 }); return; }
      z.vx = z.face * 720; if (Math.abs(hero.x - z.x) < 70 && hero.y > -150) hurtHero(K, 34 * z.dmgM, z.face);
      if (z.chargeT <= 0 || z.x <= 30 || z.x >= AW - 30) { z.bossAct = null; z.bossT = 1.4; z.vx = 0; K.shake(6); }
      return;
    }
    if (z.bossAct === 'pound') { if (z.y >= 0 && z.vy === 0 && z.airborne) { z.airborne = false; z.bossAct = null; z.bossT = 1.6; K.shake(16); K.sfx('boom'); waves.push({ x: z.x, dir: -1, life: 1.1 }, { x: z.x, dir: 1, life: 1.1 }); ring(z.x, 0, 120, '#FFFFFF'); } return; }
    z.face = dx > 0 ? 1 : -1;
    if (z.bossT <= 0) {
      var r = Math.random();
      if (ad < z.d.range && r < 0.45) { z.atkT = 0.9; z.atkHit = false; }
      else if (r < 0.7) { z.bossAct = 'charge'; z.chargeT = 1.9; K.sfx('boss'); }
      else { z.bossAct = 'pound'; z.vy = -1150; z.airborne = true; z.vx = clamp(dx, -400, 400); }
      z.bossT = 2.2; return;
    }
    z.vx += (z.face * z.spd - z.vx) * Math.min(1, dt * 4);
  }
  function updateAllies(K, dt) {
    allies.forEach(function (a) {
      if (!a || a.dead) return;
      var t = nearestZombie(a.x, 900), dx = t ? t.x - a.x : hero.x - 70 - a.x, ad = Math.abs(dx);
      a.face = dx > 0 ? 1 : -1; a.cd -= dt; a.atkT = Math.max(0, a.atkT - dt);
      var want = 0;
      if (t && ad < 60) { if (a.cd <= 0) { a.cd = 0.42; a.atkT = 0.24; a.step = ((a.step || 0) + 1) % 2; hitZombie(K, t, 9 + wave, a.face, 140, 0, 'melee'); } }
      else if (ad > 40) want = a.face;
      a.vx += (want * 260 - a.vx) * Math.min(1, dt * 8); a.vy += G * dt; a.x = clamp(a.x + a.vx * dt, 20, AW - 20); a.y = Math.min(0, a.y + a.vy * dt); if (a.y >= 0) a.vy = 0;
      // zombies hit allies
      zombies.forEach(function (z) { if (z.atkT > 0 && z.atkT < 0.14 && !z.allyHit && Math.abs(z.x - a.x) < z.d.range && !z.d.ranged) { z.allyHit = true; a.hp -= z.d.dmg * z.dmgM; if (a.hp <= 0) { a.dead = true; ragdoll(rig(a.pose, a.x, a.y, a.face, 0.95, true), '#222', -a.face, 1, 10); } } if (z.atkT <= 0) z.allyHit = false; });
      a.animT += dt * (Math.abs(a.vx) > 40 ? Math.abs(a.vx) / 26 : 3);
      var tp = a.atkT > 0 ? pose(a.step ? 'cross' : 'jab') : Math.abs(a.vx) > 40 ? pose('run', a.animT) : pose('idle', K.time);
      a.pose = blend(a.pose, tp, 1 - Math.exp(-dt * 24));
    });
  }
  function updateProjectiles(K, dt) {
    bullets.forEach(function (b) {
      b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.rocket) { b.vy += 120 * dt; if (Math.random() < 0.6) P({ k: 'smoke', x: b.x, y: b.y, vx: rnd(-30, 30), vy: rnd(-30, 30), g: -60, max: 0.4, col: '#BBBBBB', size: 8 }); }
      for (var i = 0; i < zombies.length && b.life > 0; i++) {
        var z = zombies[i]; if (z.dead || z.rise > 0 || b.hit.indexOf(z) >= 0) continue;
        var top = z.t === 'biter' ? -62 * z.d.size : -118 * z.d.size;
        if (Math.abs(z.x - b.x) < 18 * z.d.size + 6 && b.y > top + z.y && b.y < z.y) {
          if (b.rocket) { b.life = 0; explode(K, b.x, b.y, 150, b.dmg, null); break; }
          b.hit.push(z); hitZombie(K, z, b.dmg, b.vx > 0 ? 1 : -1, b.laser ? 60 : 90, 0, 'gun');
          if (!b.pierce) b.life = 0;
        }
      }
      if (b.rocket && b.y >= 0 && b.life > 0) { b.life = 0; explode(K, b.x, -10, 150, b.dmg, null); }
    });
    bullets = bullets.filter(function (b) { return b.life > 0 && b.x > -50 && b.x < AW + 50; });
    spits.forEach(function (s) {
      s.life -= dt; s.vy += G * 0.55 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (Math.abs(s.x - hero.x) < 26 && s.y > hero.y - 120 && s.y < hero.y) { s.life = 0; hurtHero(K, s.dmg, s.vx > 0 ? 1 : -1); goo(s.x, s.y, '#E2D23C', 8, 200); }
      if (s.y >= 0 && s.life > 0) { s.life = 0; goo(s.x, -4, '#E2D23C', 6, 160); decals.push({ x: s.x, w: 46, col: '#E2D23C', t: 3, toxic: true }); }
    });
    spits = spits.filter(function (s) { return s.life > 0; });
    waves.forEach(function (w) {
      w.life -= dt; w.x += w.dir * 620 * dt;
      if (Math.random() < 0.7) P({ k: 'smoke', x: w.x, y: -8, vx: 0, vy: rnd(-200, -80), g: 300, max: 0.35, col: '#C9A27A', size: rnd(8, 16) });
      if (!w.hit && Math.abs(w.x - hero.x) < 30 && hero.y > -40) { w.hit = true; hurtHero(K, 24, w.dir); }
    });
    waves = waves.filter(function (w) { return w.life > 0; });
    // toxic puddles
    decals.forEach(function (d) { d.t -= dt; if (d.toxic && Math.abs(d.x - hero.x) < d.w && hero.y > -6) { d.tick = (d.tick || 0) - dt; if (d.tick <= 0) { d.tick = 0.5; hurtHero(K, 5, hero.x < d.x ? -1 : 1); } } });
    decals = decals.filter(function (d) { return d.t > 0; });
  }
  function updatePickups(K, dt) {
    pickups.forEach(function (p) {
      p.t += dt; p.vy += G * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y >= -10) { p.y = -10; p.vy *= -0.35; p.vx *= 0.7; if (Math.abs(p.vy) < 60) p.vy = 0; }
      var dx = hero.x - p.x, dy = (hero.y - 60) - p.y, d = Math.hypot(dx, dy);
      if (p.t > 0.35 && d < 150 && p.k === 'coin') { p.x += dx * dt * 8; p.y += dy * dt * 8; }
      if (p.t > 0.3 && d < 56) {
        p.got = true;
        if (p.k === 'coin') { var v = Math.max(1, Math.round(mods.luck * (Math.random() < 0.5 ? 1 : mods.luck > 1 ? 2 : 1))); K.addCoins(v); K.sfx('coin'); }
        else if (p.k === 'heart') { hero.hp = Math.min(hero.maxHp, hero.hp + 25); ftext(hero.x, -150, '+25', '#4ADE80', 24); K.sfx('reward'); }
        else if (p.k === 'ink') { hero.ink = Math.min(100, hero.ink + 35); ftext(hero.x, -150, '+INK', '#3EE0FF', 22); K.sfx('star'); }
        else if (p.k === 'rage') { hero.rage = 8; banners.push({ t: 1.4, title: K.t('rage'), sub: '', col: '#FF3B4E' }); K.sfx('combo'); }
        else if (p.k === 'crate') { var w = WEAPONS[p.id]; if (w.melee) hero.melee = { id: p.id, uses: w.uses }; else hero.gun2 = { id: p.id, ammo: Math.round(w.gun.mag * mods.mag) }; banners.push({ t: 1.4, title: L(K, w.name) + '!', sub: '', col: '#FFC93C' }); K.sfx('reward'); }
      }
    });
    pickups = pickups.filter(function (p) { return !p.got && p.t < 14; });
  }
  function updateParts(dt) {
    parts.forEach(function (p) {
      p.life += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.va) p.ang += p.va * dt;
      if ((p.k === 'limb' || p.k === 'head' || p.k === 'dot' || p.k === 'casing' || p.k === 'door') && p.y > -2) { p.y = -2; p.vy *= -0.3; p.vx *= 0.55; if (p.va) p.va *= 0.6; if (p.k === 'dot') { p.vx = 0; p.vy = 0; p.g = 0; } }
    });
    parts = parts.filter(function (p) { return p.life < p.max; });
  }

  /* ---------------- drawing ---------------- */
  function drawWorld(c, K) {
    var W = K.W, H = K.H;
    // sky: sunset over ruins
    var g = c.createLinearGradient(0, 0, 0, gyS); g.addColorStop(0, '#5C3B7A'); g.addColorStop(0.45, '#E0775C'); g.addColorStop(1, '#FFC587');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    var sunX = W * 0.68 - camX * sc * 0.03, sunY = gyS - 150 * sc;
    var sg = c.createRadialGradient(sunX, sunY, 10, sunX, sunY, 260 * sc); sg.addColorStop(0, 'rgba(255,240,190,0.95)'); sg.addColorStop(0.25, 'rgba(255,200,120,0.55)'); sg.addColorStop(1, 'rgba(255,200,120,0)');
    c.fillStyle = sg; c.fillRect(0, 0, W, H);
    c.fillStyle = '#FFF1C8'; c.beginPath(); c.arc(sunX, sunY, 46 * sc, 0, TAU); c.fill();
    // ruined skyline layers
    [[0.2, '#8C5A7E', 1.0, 3], [0.45, '#5E3B60', 0.75, 7]].forEach(function (Lr, li) {
      c.fillStyle = Lr[1]; var off = camX * Lr[0];
      for (var i = -2; i < 40; i++) {
        var bx = i * 120 - off % 120 - 120, k = Math.floor(off / 120) + i, hsh = Math.sin(k * 12.9898 + Lr[3]) * 43758.5453, rr = hsh - Math.floor(hsh);
        var bh = (90 + rr * 220) * Lr[2] * sc, bw = (80 + rr * 30) * sc, X = bx * sc * 0.9;
        if (X > W + 40) break;
        c.fillRect(X, gyS - bh, bw, bh);
        // broken tops
        c.beginPath(); c.moveTo(X, gyS - bh); c.lineTo(X + bw * 0.3, gyS - bh - 18 * sc * rr); c.lineTo(X + bw * 0.55, gyS - bh); c.fill();
        if (li === 1) { c.fillStyle = 'rgba(255,190,110,0.55)'; for (var wy = gyS - bh + 14 * sc; wy < gyS - 20 * sc; wy += 26 * sc) if (Math.sin(k * 7 + wy) > 0.4) c.fillRect(X + 14 * sc, wy, 10 * sc, 10 * sc); c.fillStyle = Lr[1]; }
      }
    });
    // mid layer: dead trees, lamp posts, wrecked cars (parallax 0.75)
    var off2 = camX * 0.75;
    c.strokeStyle = '#3A2440'; c.fillStyle = '#3A2440'; c.lineCap = 'round';
    for (var t = -1; t < 30; t++) {
      var k2 = Math.floor(off2 / 260) + t, X2 = ((t * 260) - off2 % 260) * sc, rv = Math.abs(Math.sin(k2 * 3.7));
      if (X2 > W + 100) break;
      if (rv < 0.4) { // dead tree
        c.lineWidth = 9 * sc; c.beginPath(); c.moveTo(X2, gyS); c.lineTo(X2 + 6 * sc, gyS - 170 * sc); c.stroke();
        c.lineWidth = 5 * sc; c.beginPath(); c.moveTo(X2 + 4 * sc, gyS - 110 * sc); c.lineTo(X2 - 40 * sc, gyS - 150 * sc); c.moveTo(X2 + 6 * sc, gyS - 140 * sc); c.lineTo(X2 + 46 * sc, gyS - 185 * sc); c.moveTo(X2 + 6 * sc, gyS - 165 * sc); c.lineTo(X2 - 18 * sc, gyS - 200 * sc); c.stroke();
      } else if (rv < 0.7) { // lamp post
        c.lineWidth = 6 * sc; c.beginPath(); c.moveTo(X2, gyS); c.lineTo(X2, gyS - 190 * sc); c.lineTo(X2 + 30 * sc, gyS - 200 * sc); c.stroke();
        var lg = c.createRadialGradient(X2 + 30 * sc, gyS - 190 * sc, 2, X2 + 30 * sc, gyS - 190 * sc, 60 * sc); lg.addColorStop(0, 'rgba(255,220,150,0.8)'); lg.addColorStop(1, 'rgba(255,220,150,0)');
        c.fillStyle = lg; c.fillRect(X2 - 40 * sc, gyS - 260 * sc, 140 * sc, 140 * sc); c.fillStyle = '#3A2440';
      } else { // wrecked car
        K.roundRect(c, X2, gyS - 46 * sc, 130 * sc, 36 * sc, 10 * sc); c.fill();
        c.beginPath(); c.moveTo(X2 + 26 * sc, gyS - 46 * sc); c.lineTo(X2 + 44 * sc, gyS - 74 * sc); c.lineTo(X2 + 92 * sc, gyS - 74 * sc); c.lineTo(X2 + 108 * sc, gyS - 46 * sc); c.fill();
        c.beginPath(); c.arc(X2 + 30 * sc, gyS - 10 * sc, 14 * sc, 0, TAU); c.arc(X2 + 100 * sc, gyS - 10 * sc, 14 * sc, 0, TAU); c.fill();
      }
    }
    // ground: cracked street
    var gg = c.createLinearGradient(0, gyS, 0, H); gg.addColorStop(0, '#6B4E5E'); gg.addColorStop(0.15, '#4A3448'); gg.addColorStop(1, '#2A1C2C');
    c.fillStyle = gg; c.fillRect(0, gyS, W, H - gyS);
    c.fillStyle = 'rgba(255,200,150,0.35)'; c.fillRect(0, gyS, W, 3 * sc);
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2 * sc;
    for (var m = Math.floor(camX / 300) - 1; m < (camX + viewW(K)) / 300 + 1; m++) { var cx = sx(m * 300); c.beginPath(); c.moveTo(cx, gyS + 8 * sc); c.lineTo(cx + 30 * sc, gyS + 24 * sc); c.lineTo(cx + 18 * sc, gyS + 40 * sc); c.stroke(); c.fillStyle = 'rgba(255,240,200,0.18)'; c.fillRect(sx(m * 300 + 150), gyS + 30 * sc, 60 * sc, 6 * sc); }
    // arena barricades
    [0, AW].forEach(function (bx, i) { var X = sx(bx); if (X < -200 || X > W + 200) return; c.fillStyle = '#2A1C2C'; c.fillRect(i ? X : X - 60 * sc, gyS - 140 * sc, 60 * sc, 140 * sc); c.fillStyle = '#FFC93C'; for (var s2 = 0; s2 < 4; s2++) c.fillRect(i ? X : X - 60 * sc, gyS - 130 * sc + s2 * 34 * sc, 60 * sc, 10 * sc); });
    // decals (ink splats)
    decals.forEach(function (d) { c.globalAlpha = Math.min(1, d.t / 2) * (d.toxic ? 0.75 : 0.55); c.fillStyle = d.col; c.beginPath(); c.ellipse(sx(d.x), gyS + 2 * sc, d.w * sc, 7 * sc, 0, 0, TAU); c.fill(); c.globalAlpha = 1; });
  }
  function drawHero(c, K) {
    var h = hero; if (h.dead) return;
    var def = h.def, J = rig(h.pose, h.x, h.y, h.face, def.size, h.ground, false);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(sx(h.x), gyS + 2 * sc, 34 * sc * (1 + h.y / 600), 7 * sc, 0, 0, TAU); c.fill();
    if (h.inv > 0 && Math.floor(h.inv * 16) % 2) c.globalAlpha = 0.5;
    if (h.rage > 0 || (h.specialT > 0)) { c.shadowColor = h.rage > 0 ? '#FF3B4E' : def.acc; c.shadowBlur = 24 * sc; }
    // scarf / mask tails behind body
    if (h.scarf.length) { c.strokeStyle = def.acc; c.lineCap = 'round'; for (var i = 1; i < h.scarf.length; i++) { c.lineWidth = (def.id === 'kai' ? 9 : 5) * sc * (1 - i / h.scarf.length * 0.6); c.beginPath(); c.moveTo(sx(h.scarf[i - 1][0]), sy(h.scarf[i - 1][1])); c.lineTo(sx(h.scarf[i][0]), sy(h.scarf[i][1])); c.stroke(); } }
    drawRig(c, J, '#111111', '#2B2B2B', def.lw * def.size, null);
    c.shadowBlur = 0;
    drawWeapon(c, J, h);
    drawAccessory(c, J, def, h.face);
    c.globalAlpha = 1;
  }
  function drawAccessory(c, J, def, face) {
    var hx = sx(J.head[0]), hy = sy(J.head[1]), r = J.R * sc;
    if (def.id === 'kai') { c.fillStyle = def.acc; c.fillRect(hx - r, hy - r * 0.45, r * 2, r * 0.42); }
    else if (def.id === 'rook') { c.fillStyle = def.acc; c.beginPath(); c.arc(hx, hy - r * 0.15, r * 1.08, Math.PI, 0); c.fill(); c.fillRect(hx - r * 1.35 * (face > 0 ? 0.6 : 1), hy - r * 0.2, r * 2, r * 0.28); c.fillStyle = '#FFE0A8'; c.fillRect(hx - r * 0.15, hy - r * 1.1, r * 0.3, r * 0.9); }
    else if (def.id === 'vex') { c.fillStyle = '#1B1B1B'; c.fillRect(hx - r * 1.05, hy - r * 0.42, r * 2.1, r * 0.52); c.shadowColor = def.acc; c.shadowBlur = 14 * sc; c.fillStyle = def.acc; c.fillRect(hx + face * r * 0.05 - (face < 0 ? r * 0.9 : 0), hy - r * 0.36, r * 0.9, r * 0.38); c.shadowBlur = 0; }
    else if (def.id === 'juno') { c.fillStyle = def.acc; c.fillRect(hx - r, hy - r * 0.3, r * 2, r * 0.5); c.fillStyle = '#FFFFFF'; c.fillRect(hx + face * r * 0.35 - r * 0.12, hy - r * 0.2, r * 0.3, r * 0.14); }
  }
  function drawWeapon(c, J, h) {
    var hx = sx(J.fh[0]), hy = sy(J.fh[1]), ang = Math.PI / 2 - J.handAng, f = h.face, kind = h.melee ? h.melee.id : h.def.melee.kind;
    var gunOut = h.shootPose > 0 || (h.specialKind === 'overdrive' && h.specialT > 0);
    c.save(); c.translate(hx, hy); c.scale(f, 1); c.rotate(ang);
    if (gunOut && !h.atkT) {
      var g = h.gun2 ? h.gun2.id : h.def.gun.kind, len = { pistol: 22, kunai: 14, smg: 30, shotgun: 40, shotgun2: 46, rifle: 52, laser: 46, rocket: 60 }[g] || 26;
      c.fillStyle = g === 'laser' ? '#3EE0FF' : g === 'rocket' ? '#5E7A3A' : '#2E2E2E'; c.fillRect(-4 * sc, -6 * sc, len * sc, 9 * sc);
      c.fillStyle = '#111'; c.fillRect(0, 0, 7 * sc, 13 * sc);
      if (g === 'rocket') { c.fillStyle = '#FF3B4E'; c.fillRect(len * sc - 6 * sc, -8 * sc, 10 * sc, 13 * sc); }
    } else if (kind === 'hammer') { c.fillStyle = '#5A3A22'; c.fillRect(-4 * sc, -3 * sc, 54 * sc, 7 * sc); c.fillStyle = '#7A808C'; c.fillRect(42 * sc, -16 * sc, 24 * sc, 32 * sc); c.fillStyle = h.def.acc; c.fillRect(42 * sc, -16 * sc, 24 * sc, 6 * sc); }
    else if (kind === 'katana') { c.fillStyle = '#111'; c.fillRect(-6 * sc, -3 * sc, 18 * sc, 6 * sc); c.fillStyle = '#E6EEF8'; c.beginPath(); c.moveTo(12 * sc, -3 * sc); c.lineTo(84 * sc, -6 * sc); c.lineTo(90 * sc, 0); c.lineTo(12 * sc, 3 * sc); c.fill(); }
    else if (kind === 'axe') { c.fillStyle = '#6B4A2A'; c.fillRect(-4 * sc, -3 * sc, 58 * sc, 7 * sc); c.fillStyle = '#C7CED8'; c.beginPath(); c.moveTo(40 * sc, -4 * sc); c.quadraticCurveTo(52 * sc, -30 * sc, 66 * sc, -24 * sc); c.lineTo(58 * sc, 4 * sc); c.closePath(); c.fill(); }
    else if (h.def.id === 'vex') { c.fillStyle = '#2E2E2E'; c.fillRect(-2 * sc, -5 * sc, 20 * sc, 8 * sc); }
    c.restore();
  }
  function drawZombie(c, K, z) {
    var d = z.d, s = d.size, crawl = z.t === 'biter', J = rig(z.pose, z.x, z.y, z.face, s, z.y > -2, crawl);
    if (z.rise > 0) { c.save(); c.beginPath(); c.rect(0, 0, K.W, gyS); c.clip(); var off = z.rise / 0.6 * 90 * s * sc; c.translate(0, off); }
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(sx(z.x), gyS + 2 * sc, 30 * s * sc, 6 * sc, 0, 0, TAU); c.fill();
    var lw = (d.boss ? 12 : d.heavy ? 12 : 9) * s;
    var flash = z.stun > 0.18;
    if (z.fuse > 0) { c.shadowColor = '#FF3B4E'; c.shadowBlur = 20 * sc * (0.5 + 0.5 * Math.sin(K.time * 40)); }
    drawRig(c, J, flash ? '#FFFFFF' : d.col, flash ? '#FFFFFF' : d.dark, lw, '#1A1020');
    c.shadowBlur = 0;
    var hx = sx(J.head[0]), hy = sy(J.head[1]), r = J.R * sc, f = z.face;
    // type features
    if (z.t === 'bruiser' || d.boss) { c.fillStyle = flash ? '#FFF' : d.col; c.strokeStyle = '#1A1020'; c.lineWidth = 3 * sc; var bx = sx((J.hip[0] * 0.55 + J.neck[0] * 0.45)) + f * 8 * s * sc, by = sy((J.hip[1] * 0.55 + J.neck[1] * 0.45)); c.beginPath(); c.arc(bx, by, 17 * s * sc, 0, TAU); c.fill(); c.stroke(); }
    if (z.t === 'popper') { var pb = sy((J.hip[1] + J.neck[1]) / 2), px = sx((J.hip[0] + J.neck[0]) / 2), pr = 26 * s * sc * (1 + (z.fuse > 0 ? 0.15 * Math.sin(K.time * 40) : 0.04 * Math.sin(K.time * 6))); c.fillStyle = flash ? '#FFF' : d.col; c.strokeStyle = '#1A1020'; c.lineWidth = 3 * sc; c.beginPath(); c.arc(px, pb, pr, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#FFD1E8'; [[-0.4, -0.3], [0.3, 0.2], [0.1, -0.55]].forEach(function (q) { c.beginPath(); c.arc(px + q[0] * pr, pb + q[1] * pr, pr * 0.16, 0, TAU); c.fill(); }); }
    if (z.t === 'gloop') { c.fillStyle = '#F4EC7A'; c.strokeStyle = '#1A1020'; c.lineWidth = 2.5 * sc; c.beginPath(); c.arc(sx(J.neck[0]) + f * 6 * sc, sy(J.neck[1]) + 6 * sc, 11 * sc * (1 + 0.1 * Math.sin(K.time * 5)), 0, TAU); c.fill(); c.stroke(); }
    if (d.boss) { c.fillStyle = '#F2E6D8'; for (var sp = 0; sp < 4; sp++) { var t = sp / 3, bxx = sx(lerp(J.hip[0], J.neck[0], t)) - f * 12 * s * sc, byy = sy(lerp(J.hip[1], J.neck[1], t)); c.beginPath(); c.moveTo(bxx, byy - 6 * sc); c.lineTo(bxx - f * 26 * sc, byy - 18 * sc); c.lineTo(bxx, byy + 6 * sc); c.fill(); } }
    // glowing eyes
    c.shadowColor = d.boss ? '#FFE15A' : '#E8FF5A'; c.shadowBlur = 10 * sc; c.fillStyle = d.boss ? '#FFE15A' : '#F4FFB0';
    c.beginPath(); c.arc(hx + f * r * 0.35, hy - r * 0.1, r * 0.2, 0, TAU); c.arc(hx + f * r * 0.75, hy - r * 0.05, r * 0.15, 0, TAU); c.fill(); c.shadowBlur = 0;
    c.strokeStyle = '#1A1020'; c.lineWidth = 2 * sc; c.beginPath(); c.moveTo(hx + f * r * 0.2, hy + r * 0.45); c.lineTo(hx + f * r * 0.8, hy + r * 0.35); c.stroke();
    // doorman's car door
    if (z.t === 'doorman' && z.shield > 0) {
      var dx2 = sx(J.fh[0]) + f * 6 * sc, dy2 = sy(J.fh[1]);
      c.save(); c.translate(dx2, dy2); c.rotate(f * 0.06);
      c.fillStyle = '#9FB4CC'; c.strokeStyle = '#1A1020'; c.lineWidth = 3 * sc; K.roundRect(c, -8 * sc, -70 * sc, 18 * sc, 120 * sc, 6 * sc); c.fill(); c.stroke();
      c.fillStyle = 'rgba(180,230,255,0.8)'; c.fillRect(-4 * sc, -62 * sc, 10 * sc, 36 * sc);
      var cr = 1 - z.shield / d.shield; if (cr > 0.3) { c.strokeStyle = '#1A1020'; c.lineWidth = 2 * sc; c.beginPath(); c.moveTo(-6 * sc, -10 * sc); c.lineTo(4 * sc, 4 * sc); c.lineTo(-2 * sc, 22 * sc); c.stroke(); }
      c.restore();
    }
    if (z.rise > 0) c.restore();
    if (!d.boss && z.hp < z.maxHp) { var bw = 44 * s * sc; c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(sx(z.x) - bw / 2, sy(-150 * s), bw, 5 * sc); c.fillStyle = d.col; c.fillRect(sx(z.x) - bw / 2, sy(-150 * s), bw * Math.max(0, z.hp / z.maxHp), 5 * sc); }
  }
  function drawAlly(c, a) {
    if (!a || a.dead) return;
    var J = rig(a.pose, a.x, a.y, a.face, 0.95, true, false);
    drawRig(c, J, '#1E1E1E', '#333', 10, null);
    c.fillStyle = a.col; c.fillRect(sx(J.head[0]) - J.R * sc, sy(J.head[1]) - J.R * 0.4 * sc, J.R * 2 * sc, J.R * 0.4 * sc);
    var bw = 36 * sc; c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(sx(a.x) - bw / 2, sy(-142), bw, 4 * sc); c.fillStyle = '#4ADE80'; c.fillRect(sx(a.x) - bw / 2, sy(-142), bw * a.hp / a.maxHp, 4 * sc);
  }
  function drawParts(c, K) {
    parts.forEach(function (p) {
      var a = 1 - p.life / p.max, X = sx(p.x), Y = sy(p.y);
      c.globalAlpha = Math.max(0, Math.min(1, p.k === 'limb' || p.k === 'head' || p.k === 'door' ? a * 3 : a));
      if (p.k === 'dot' || p.k === 'smoke') { c.fillStyle = p.col; c.beginPath(); c.arc(X, Y, p.size * sc * (p.k === 'smoke' ? 1 + (1 - a) : 0.5 + a * 0.5), 0, TAU); c.fill(); }
      else if (p.k === 'spark') { c.strokeStyle = p.col; c.lineWidth = 3 * sc; c.beginPath(); c.moveTo(X, Y); c.lineTo(X - p.vx * 0.03 * sc, Y - p.vy * 0.03 * sc); c.stroke(); }
      else if (p.k === 'ring') { c.strokeStyle = p.col; c.lineWidth = 5 * sc * a; c.beginPath(); c.ellipse(X, Y, p.size * sc * (1 - a * 0.9 + 0.1), p.size * sc * 0.35 * (1 - a * 0.9 + 0.1) + (p.y < -5 ? p.size * sc * 0.6 : 0), 0, 0, TAU); c.stroke(); }
      else if (p.k === 'text') { c.font = K.font(p.size * sc * 1.2); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 5; c.strokeStyle = 'rgba(20,10,30,0.85)'; c.strokeText(p.txt, X, Y); c.fillStyle = p.col; c.fillText(p.txt, X, Y); }
      else if (p.k === 'limb') { c.strokeStyle = p.col; c.lineCap = 'round'; c.lineWidth = p.size * sc; c.beginPath(); c.moveTo(X - Math.cos(p.ang) * p.len / 2 * sc, Y - Math.sin(p.ang) * p.len / 2 * sc); c.lineTo(X + Math.cos(p.ang) * p.len / 2 * sc, Y + Math.sin(p.ang) * p.len / 2 * sc); c.stroke(); }
      else if (p.k === 'head') { c.fillStyle = p.col; c.beginPath(); c.arc(X, Y, p.size * sc, 0, TAU); c.fill(); }
      else if (p.k === 'flash') { c.fillStyle = p.col; c.beginPath(); c.arc(X, Y, p.size * sc, 0, TAU); c.fill(); }
      else if (p.k === 'casing') { c.fillStyle = p.col; c.save(); c.translate(X, Y); c.rotate(p.ang); c.fillRect(-3 * sc, -1.5 * sc, 6 * sc, 3 * sc); c.restore(); }
      else if (p.k === 'door') { c.save(); c.translate(X, Y); c.rotate(p.ang); c.fillStyle = p.col; c.fillRect(-9 * sc, -55 * sc, 18 * sc, 110 * sc); c.restore(); }
      else if (p.k === 'slash') { c.strokeStyle = p.col; c.lineWidth = 7 * sc * a; c.lineCap = 'round'; c.beginPath(); var f = p.face || 1; c.arc(X - f * p.size * 0.3 * sc, Y, p.size * 0.6 * sc, f > 0 ? -1.1 : Math.PI - 1.1, f > 0 ? 1.1 : Math.PI + 1.1); c.stroke(); }
    });
    c.globalAlpha = 1;
  }
  function drawPickups(c, K) {
    pickups.forEach(function (p) {
      var X = sx(p.x), Y = sy(p.y) + Math.sin(K.time * 5 + p.x) * 3 * sc, blink = p.t > 11 && Math.floor(p.t * 8) % 2;
      if (blink) return;
      if (p.k === 'coin') K.drawCoin(c, X, Y, 9 * sc, K.time + p.x);
      else if (p.k === 'heart') { c.fillStyle = '#FF3B6B'; var r = 12 * sc; c.beginPath(); c.moveTo(X, Y + r * 0.8); c.bezierCurveTo(X - r * 1.4, Y - r * 0.1, X - r * 0.6, Y - r * 1.1, X, Y - r * 0.35); c.bezierCurveTo(X + r * 0.6, Y - r * 1.1, X + r * 1.4, Y - r * 0.1, X, Y + r * 0.8); c.fill(); }
      else if (p.k === 'ink') { c.fillStyle = '#3EE0FF'; c.shadowColor = '#3EE0FF'; c.shadowBlur = 12 * sc; c.beginPath(); c.arc(X, Y, 10 * sc, 0, TAU); c.fill(); c.shadowBlur = 0; }
      else if (p.k === 'rage') { c.fillStyle = '#FF3B4E'; c.shadowColor = '#FF3B4E'; c.shadowBlur = 14 * sc; c.save(); c.translate(X, Y); K.star(c, 13 * sc); c.restore(); c.shadowBlur = 0; }
      else if (p.k === 'crate') { c.fillStyle = '#8A5A2B'; c.strokeStyle = '#3A220E'; c.lineWidth = 2.5 * sc; K.roundRect(c, X - 18 * sc, Y - 18 * sc, 36 * sc, 36 * sc, 5 * sc); c.fill(); c.stroke(); c.beginPath(); c.moveTo(X - 18 * sc, Y - 18 * sc); c.lineTo(X + 18 * sc, Y + 18 * sc); c.moveTo(X + 18 * sc, Y - 18 * sc); c.lineTo(X - 18 * sc, Y + 18 * sc); c.stroke(); c.fillStyle = '#FFC93C'; c.font = K.font(14 * sc); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', X, Y - 30 * sc); }
    });
    bullets.forEach(function (b) {
      if (b.laser) { c.strokeStyle = '#3EE0FF'; c.lineWidth = 5 * sc; c.shadowColor = '#3EE0FF'; c.shadowBlur = 12 * sc; c.beginPath(); c.moveTo(sx(b.x), sy(b.y)); c.lineTo(sx(b.x - b.vx * 0.04), sy(b.y)); c.stroke(); c.shadowBlur = 0; }
      else if (b.rocket) { c.fillStyle = '#5E7A3A'; c.fillRect(sx(b.x) - 10 * sc, sy(b.y) - 4 * sc, 20 * sc, 8 * sc); c.fillStyle = '#FF8A1F'; c.beginPath(); c.arc(sx(b.x) - (b.vx > 0 ? 12 : -12) * sc, sy(b.y), 5 * sc, 0, TAU); c.fill(); }
      else { c.strokeStyle = '#FFE58A'; c.lineWidth = 3 * sc; c.beginPath(); c.moveTo(sx(b.x), sy(b.y)); c.lineTo(sx(b.x - b.vx * 0.018), sy(b.y - b.vy * 0.018)); c.stroke(); }
    });
    spits.forEach(function (s) { c.fillStyle = '#E2D23C'; c.strokeStyle = '#6B5E08'; c.lineWidth = 2 * sc; c.beginPath(); c.arc(sx(s.x), sy(s.y), 8 * sc, 0, TAU); c.fill(); c.stroke(); });
    waves.forEach(function (w) { c.fillStyle = 'rgba(255,230,170,0.8)'; c.beginPath(); c.moveTo(sx(w.x) - 26 * sc, gyS); c.quadraticCurveTo(sx(w.x), gyS - 46 * sc, sx(w.x) + 26 * sc, gyS); c.fill(); });
  }
  /* ---------------- HUD + touch controls ---------------- */
  function btns(K) {
    var R = clamp(Math.min(K.W, K.H) * 0.085, 30, 46), H = K.H, W = K.W, by = H - R * 1.35;
    return {
      left: { x: R * 1.35, y: by, r: R }, right: { x: R * 3.75, y: by, r: R },
      atk: { x: W - R * 1.55, y: H - R * 1.6, r: R * 1.28 }, jump: { x: W - R * 4.05, y: H - R * 1.15, r: R * 0.95 },
      shoot: { x: W - R * 1.35, y: H - R * 4.25, r: R * 0.95 }, spec: { x: W - R * 3.75, y: H - R * 3.55, r: R * 0.95 }
    };
  }
  function drawHud(c, K) {
    var W = K.W, top = K.hudH + (K.W < 600 ? 22 : 4), h = hero, def = h.def;
    // portrait + bars
    c.fillStyle = 'rgba(20,10,30,0.6)'; K.roundRect(c, 10, top, 190, 52, 14); c.fill();
    c.fillStyle = def.acc; c.beginPath(); c.arc(34, top + 26, 17, 0, TAU); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(34, top + 28, 12, 0, TAU); c.fill();
    var bx = 58, bw = 134;
    c.fillStyle = 'rgba(255,255,255,0.15)'; K.roundRect(c, bx, top + 10, bw, 13, 6); c.fill();
    c.fillStyle = h.hp / h.maxHp > 0.3 ? '#4ADE80' : '#FF3B4E'; K.roundRect(c, bx, top + 10, bw * Math.max(0, h.hp / h.maxHp), 13, 6); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.15)'; K.roundRect(c, bx, top + 29, bw, 10, 5); c.fill();
    c.fillStyle = h.ink >= 100 ? (Math.floor(K.time * 6) % 2 ? '#3EE0FF' : '#FFFFFF') : '#3EE0FF'; K.roundRect(c, bx, top + 29, bw * h.ink / 100, 10, 5); c.fill();
    c.font = K.font(10); c.fillStyle = '#FFFFFF'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(Math.ceil(h.hp) + ' / ' + h.maxHp, bx + 6, top + 17);
    // ammo
    var g = h.gun2 ? h.gun2.ammo : h.ammo, ammoTxt = h.reloadT > 0 ? K.t('reloading') : (h.gun2 ? L(K, WEAPONS[h.gun2.id].name) + ' ' : '') + g;
    c.fillStyle = 'rgba(20,10,30,0.6)'; K.roundRect(c, 10, top + 58, 150, 24, 10); c.fill();
    c.fillStyle = '#FFE58A'; c.font = K.font(13); c.fillText(ammoTxt + (h.melee ? '  ' + L(K, WEAPONS[h.melee.id].name) + ' ' + h.melee.uses : ''), 18, top + 70);
    // combo
    if (combo >= 3) { var cs = 1 + Math.max(0, comboT - 2.3) * 2; c.save(); c.translate(80, top + 122); c.scale(cs, cs); c.textAlign = 'center'; c.font = K.font(34); c.lineWidth = 6; c.strokeStyle = 'rgba(20,10,30,0.8)'; c.strokeText('x' + combo, 0, 0); c.fillStyle = combo >= 25 ? '#FF3B4E' : combo >= 10 ? '#FFE15A' : '#FFFFFF'; c.fillText('x' + combo, 0, 0); c.font = K.font(12); c.fillStyle = '#FFFFFF'; c.fillText(K.t('combo'), 0, 22); c.restore(); }
    // boss bar
    if (bossRef && !bossRef.dead) { var bw2 = Math.min(W - 60, 420), bx2 = (W - bw2) / 2, by2 = top + 92; c.fillStyle = 'rgba(20,10,30,0.7)'; K.roundRect(c, bx2 - 6, by2 - 22, bw2 + 12, 40, 10); c.fill(); c.fillStyle = '#FFFFFF'; c.font = K.font(12); c.textAlign = 'center'; c.fillText(L(K, ZT.gravemaw.name), W / 2, by2 - 10); c.fillStyle = '#3A0F1A'; c.fillRect(bx2, by2, bw2, 10); c.fillStyle = '#FF3B4E'; c.fillRect(bx2, by2, bw2 * Math.max(0, bossRef.hp / bossRef.maxHp), 10); }
    // banners
    var y0 = gyS * 0.32;
    banners.forEach(function (b, i) { if (i > 0) return; var a = Math.min(1, b.t * 3, (b.dur || 3) - b.t + 1); c.globalAlpha = Math.max(0, Math.min(1, a)); c.textAlign = 'center'; c.font = K.font(Math.min(36, W / 12)); c.lineWidth = 7; c.strokeStyle = 'rgba(20,10,30,0.85)'; c.strokeText(b.title, W / 2, y0); c.fillStyle = b.col; c.fillText(b.title, W / 2, y0); if (b.sub) { c.font = K.font(Math.min(17, W / 24), 700); c.lineWidth = 5; c.strokeText(b.sub, W / 2, y0 + 30); c.fillStyle = '#FFFFFF'; c.fillText(b.sub, W / 2, y0 + 30); } c.globalAlpha = 1; });
    if (introT > 0) { c.globalAlpha = Math.min(1, introT * 2); c.textAlign = 'center'; c.font = K.font(Math.min(64, W / 7)); c.lineWidth = 9; c.strokeStyle = 'rgba(20,10,30,0.9)'; var wt = (wave % 5 === 0 ? K.t('bossWave') + ' · ' : '') + K.t('wave') + ' ' + wave; c.strokeText(wt, W / 2, gyS * 0.5); c.fillStyle = wave % 5 === 0 ? '#FF3B4E' : '#FFE15A'; c.fillText(wt, W / 2, gyS * 0.5); c.globalAlpha = 1; }
    // touch controls
    if (touchUI) {
      var B = btns(K), lbl = { atk: K.t('bAtk'), jump: K.t('bJump'), shoot: K.t('bShoot'), spec: K.t('bSpec') }, col = { left: '#FFFFFF', right: '#FFFFFF', atk: '#FF3B4E', jump: '#22C55E', shoot: '#3B82F6', spec: h.ink >= 100 ? '#FFE15A' : '#6B6B7B' };
      Object.keys(B).forEach(function (k) {
        var b = B[k], on = held[k] || (k === 'atk' && held.atkFlash > 0);
        c.globalAlpha = on ? 0.95 : 0.72;
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(b.x, b.y + 4, b.r, 0, TAU); c.fill();
        var gr = c.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.4, 2, b.x, b.y, b.r); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.25, col[k]); gr.addColorStop(1, k === 'left' || k === 'right' ? '#8FA3BF' : col[k]);
        c.fillStyle = k === 'left' || k === 'right' ? 'rgba(160,200,255,0.55)' : gr; c.beginPath(); c.arc(b.x, b.y + (on ? 3 : 0), b.r, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 3; c.stroke();
        c.fillStyle = '#FFFFFF';
        if (k === 'left' || k === 'right') { var dd = k === 'left' ? -1 : 1; c.beginPath(); c.moveTo(b.x + dd * b.r * 0.5, b.y); c.lineTo(b.x - dd * b.r * 0.3, b.y - b.r * 0.45); c.lineTo(b.x - dd * b.r * 0.3, b.y + b.r * 0.45); c.closePath(); c.fill(); }
        else { c.font = K.font(b.r * 0.42); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.4)'; c.strokeText(lbl[k], b.x, b.y + (on ? 3 : 0)); c.fillText(lbl[k], b.x, b.y + (on ? 3 : 0)); }
        if (k === 'spec' && h.ink >= 100) { c.strokeStyle = '#FFE15A'; c.lineWidth = 4; c.beginPath(); c.arc(b.x, b.y, b.r + 6 + Math.sin(K.time * 8) * 3, 0, TAU); c.stroke(); }
        if (k === 'shoot' && h.reloadT > 0) { c.strokeStyle = '#FFFFFF'; c.lineWidth = 4; c.beginPath(); c.arc(b.x, b.y, b.r + 5, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - h.reloadT / gunSpec().reload)); c.stroke(); }
      });
      c.globalAlpha = 1;
    } else if (wave <= 1 && mode === 'fight') {
      c.font = K.font(13, 700); c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,0.85)';
      c.fillText(K.t('keys'), W / 2, K.H - 14);
    }
    // tutorial hand
    if (K.tutorial && mode === 'fight' && wave === 1 && tutT < 9 && touchUI) { var B2 = btns(K), tb = tutT < 3 ? B2.right : tutT < 6.5 ? B2.atk : B2.shoot, kk = (tutT * 1.5) % 1; K.drawHand(c, tb.x, tb.y, kk > 0.3, Math.min(W, K.H) / 190); }
  }
  /* ---------------- hero pick & perk screens ---------------- */
  function drawPick(c, K) {
    var W = K.W, H = K.H; ui = [];
    c.fillStyle = 'rgba(15,8,25,0.72)'; c.fillRect(0, 0, W, H);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = K.font(Math.min(36, W / 11, H / 13)); c.fillStyle = '#FFFFFF'; c.fillText(K.t('choose'), W / 2, K.hudH + Math.min(24, H / 30));
    var own = owned(), n = HEROES.length, land = W > H * 1.1, gap = 12, cw, ch, x0, y0;
    if (land) { cw = Math.min(210, (W - 40 - gap * (n - 1)) / n); ch = Math.min(H - K.hudH - 56 - 40 - Math.min(24, H / 30) * 2, cw * 1.55); x0 = (W - (cw * n + gap * (n - 1))) / 2; y0 = K.hudH + Math.min(52, H / 12); }
    else { cw = Math.min(200, (W - 36 - gap) / 2); ch = Math.min((H - K.hudH - 150 - gap) / 2, cw * 1.5); x0 = (W - (cw * 2 + gap)) / 2; y0 = K.hudH + 50; }
    HEROES.forEach(function (h, i) {
      var x = land ? x0 + i * (cw + gap) : x0 + (i % 2) * (cw + gap), y = land ? y0 : y0 + Math.floor(i / 2) * (ch + gap), isSel = sel === i, own2 = own.indexOf(h.id) >= 0;
      c.fillStyle = isSel ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)'; K.roundRect(c, x, y, cw, ch, 18); c.fill();
      if (isSel) { c.strokeStyle = h.acc; c.lineWidth = 4; c.stroke(); }
      // hero preview
      var saveSc = sc, saveCam = camX, saveGy = gyS, tall = ch > 220; sc = Math.min(cw / 170, ch * (tall ? 0.5 : 0.58) / 140); camX = 0; gyS = y + ch * (tall ? 0.58 : 0.64);
      var P0 = pose(isSel ? 'idle' : 'idle', K.time + i), J = rig(P0, (x + cw / 2) / sc, 0, 1, h.size, true, false);
      c.fillStyle = h.acc + '55'; c.beginPath(); c.ellipse(x + cw / 2, gyS, cw * 0.32, 8, 0, 0, TAU); c.fill();
      if (!own2) c.globalAlpha = 0.55;
      drawRig(c, J, '#111111', '#2B2B2B', h.lw * h.size, null); drawAccessory(c, J, h, 1);
      c.globalAlpha = 1; sc = saveSc; camX = saveCam; gyS = saveGy;
      var ny = tall ? y + ch * 0.68 : y + ch * 0.76; c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(22, cw / 7, ch / 7)); c.fillText(L(K, h.name), x + cw / 2, ny);
      c.fillStyle = h.acc; c.font = K.font(Math.min(13, cw / 12, ch / 11), 700); c.fillText(L(K, h.role), x + cw / 2, ny + Math.min(20, ch / 8));
      // stat pips
      var sy0 = ny + 38; if (tall) [K.t('sPow'), K.t('sSpd'), K.t('sHp')].forEach(function (lb, si) {
        var yy = sy0 + si * 13; if (yy > y + ch - 26) return; c.font = K.font(10, 700); c.fillStyle = 'rgba(255,255,255,0.7)'; c.textAlign = 'left'; c.fillText(lb, x + 12, yy);
        for (var p = 0; p < 5; p++) { c.fillStyle = p < h.stats[si] ? h.acc : 'rgba(255,255,255,0.15)'; c.fillRect(x + cw - 12 - (5 - p) * (cw * 0.09), yy - 4, cw * 0.07, 8); }
        c.textAlign = 'center';
      });
      if (!own2) { c.fillStyle = 'rgba(0,0,0,0.55)'; K.roundRect(c, x + cw / 2 - 46, y + 12, 92, 28, 14); c.fill(); K.drawCoin(c, x + cw / 2 - 26, y + 26, 9); c.fillStyle = '#FFE58A'; c.font = K.font(15); c.fillText(h.price, x + cw / 2 + 10, y + 27); }
      ui.push({ x: x, y: y, w: cw, h: ch, act: 'hero', i: i });
    });
    var bw = Math.min(260, W - 60), bh = Math.min(56, H / 7), bx = (W - bw) / 2, by = H - bh - Math.min(22, H / 25), h0 = HEROES[sel], own3 = own.indexOf(h0.id) >= 0;
    var gr = c.createLinearGradient(bx, by, bx + bw, by); gr.addColorStop(0, own3 ? '#FF3B4E' : '#FFB020'); gr.addColorStop(1, own3 ? '#FF8A1F' : '#FF8A1F');
    c.fillStyle = 'rgba(0,0,0,0.35)'; K.roundRect(c, bx, by + 5, bw, bh, 28); c.fill(); c.fillStyle = gr; K.roundRect(c, bx, by, bw, bh, 28); c.fill();
    c.fillStyle = '#FFFFFF'; c.font = K.font(24); c.fillText(own3 ? K.t('fight') : K.t('unlock') + ' · ' + h0.price, W / 2, by + bh / 2 + 1);
    ui.push({ x: bx, y: by, w: bw, h: bh, act: 'go' });
  }
  function choosePerks(K) {
    var keys2 = Object.keys(PERKS).filter(function (k) { return !(k === 'buddy' && mods.buddy >= 2) && !(k === 'mend' && hero.hp > hero.maxHp * 0.8); });
    keys2.sort(function () { return Math.random() - 0.5; }); perkOpts = keys2.slice(0, 3); perkSel = 0;
    if (hero.hp < hero.maxHp * 0.45 && perkOpts.indexOf('mend') < 0 && keys2.indexOf('mend') >= 0) perkOpts[2] = 'mend';
  }
  function applyPerk(K, k) {
    if (k === 'iron') { mods.maxHp += 30; hero.maxHp += 30; hero.hp = Math.min(hero.maxHp, hero.hp + 30); }
    else if (k === 'fists') mods.melee *= 1.2; else if (k === 'trigger') mods.rate *= 1.25; else if (k === 'mag') { mods.mag *= 1.5; hero.ammo = Math.round(hero.def.gun.mag * mods.mag); }
    else if (k === 'vamp') mods.vamp += 3; else if (k === 'focus') mods.focus *= 1.35; else if (k === 'luck') mods.luck *= 1.5; else if (k === 'crit') mods.crit += 0.12;
    else if (k === 'mend') hero.hp = Math.min(hero.maxHp, hero.hp + hero.maxHp * 0.6);
    else if (k === 'buddy') { mods.buddy = Math.min(2, mods.buddy + 1); }
    K.sfx('reward'); nextWave(K);
  }
  function drawPerks(c, K) {
    var W = K.W, H = K.H; ui = [];
    c.fillStyle = 'rgba(15,8,25,0.72)'; c.fillRect(0, 0, W, H);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFE15A'; c.font = K.font(Math.min(34, W / 11)); c.fillText(K.t('cleared') + ' ' + wave, W / 2, K.hudH + 26);
    c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(18, W / 22), 700); c.fillText(K.t('pickPerk'), W / 2, K.hudH + 58);
    var land = W > H, cw = land ? Math.min(230, (W - 60) / 3) : Math.min(340, W - 40), ch = land ? Math.min(220, H - K.hudH - 120) : Math.min(110, (H - K.hudH - 120) / 3 - 10);
    perkOpts.forEach(function (k, i) {
      var x = land ? (W - (cw * 3 + 24)) / 2 + i * (cw + 12) : (W - cw) / 2, y = land ? K.hudH + 84 : K.hudH + 84 + i * (ch + 12), t = PERKS[k][K.lang] || PERKS[k].en;
      c.fillStyle = perkSel === i ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.09)'; K.roundRect(c, x, y, cw, ch, 18); c.fill();
      if (perkSel === i) { c.strokeStyle = '#FFE15A'; c.lineWidth = 3; c.stroke(); }
      var ix = land ? x + cw / 2 : x + 44, iy = land ? y + ch * 0.32 : y + ch / 2;
      c.fillStyle = ['#FF3B4E', '#FFB020', '#3EE0FF', '#4ADE80', '#B06CFF'][Object.keys(PERKS).indexOf(k) % 5]; c.beginPath(); c.arc(ix, iy, 26, 0, TAU); c.fill();
      c.fillStyle = '#111'; c.font = K.font(24); c.fillText(t[0].charAt(0), ix, iy + 1);
      c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(20, cw / 10)); c.textAlign = land ? 'center' : (K.rtl ? 'right' : 'left');
      var tx = land ? x + cw / 2 : (K.rtl ? x + cw - 84 : x + 84);
      if (K.rtl && !land) { tx = x + cw - 16; ix = x + 44; }
      c.fillText(t[0], tx, land ? y + ch * 0.62 : y + ch / 2 - 12);
      c.font = K.font(Math.min(14, cw / 16), 700); c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillText(t[1], tx, land ? y + ch * 0.62 + 26 : y + ch / 2 + 14);
      c.textAlign = 'center';
      ui.push({ x: x, y: y, w: cw, h: ch, act: 'perk', i: i });
    });
  }
  function uiHit(x, y) { for (var i = ui.length - 1; i >= 0; i--) { var u = ui[i]; if (x >= u.x && x <= u.x + u.w && y >= u.y && y <= u.y + u.h) return u; } return null; }
  function confirmHero(K) {
    var h = HEROES[sel], own = owned();
    if (own.indexOf(h.id) < 0) {
      if (K.spend(h.price)) { own.push(h.id); K.store.set('ink:heroes', own); K.sfx('reward'); K.confetti(40); }
      else { K.sfx('wrong'); K.toast(K.t('needCoins')); }
      return;
    }
    picked = h.id; K.store.set('ink:hero', h.id); K.sfx('click'); startRun(K);
  }
  function uiTap(K, u) {
    if (!u) return;
    if (u.act === 'hero') { if (sel === u.i) confirmHero(K); else { sel = u.i; K.sfx('tick'); } }
    else if (u.act === 'go') confirmHero(K);
    else if (u.act === 'perk') { if (perkSel === u.i) applyPerk(K, perkOpts[u.i]); else { perkSel = u.i; K.sfx('tick'); } }
  }
  function btnAt(K, x, y) { var B = btns(K), best = null; Object.keys(B).forEach(function (k) { var b = B[k]; if (Math.hypot(x - b.x, y - b.y) < b.r * 1.25) best = k; }); return best; }
  function press(K, k, down) {
    if (k === 'left' || k === 'right' || k === 'shoot') held[k] = down;
    if (!down) return;
    if (k === 'atk') { attack(K); held.atkFlash = 0.12; } else if (k === 'jump') jump(K); else if (k === 'spec') special(K); else if (k === 'shoot') fire(K);
  }
  var touchMap = {};
  function mascot(mood, size) {
    return '<svg ' + (size ? 'width="' + size + '" height="' + size + '" ' : '') + 'viewBox="0 0 64 64" aria-hidden="true" class="mascot-svg">' +
      '<circle cx="32" cy="32" r="30" fill="#FF8A5B"/><circle cx="32" cy="32" r="30" fill="url(#g)" opacity=".6"/><defs><radialGradient id="g" cx=".7" cy=".3"><stop offset="0" stop-color="#FFF1C8"/><stop offset="1" stop-color="#FF8A5B" stop-opacity="0"/></radialGradient></defs>' +
      (mood === 'sad' ? '<g stroke="#111" stroke-width="5" stroke-linecap="round" fill="none"><path d="M14 52 L26 44 M26 44 L36 50 M36 50 L50 50 M30 46 L22 36 M30 46 L42 38"/></g><circle cx="52" cy="46" r="7" fill="#111"/>' :
        '<g stroke="#111" stroke-width="5" stroke-linecap="round" fill="none"><path d="M30 26 L28 42 M28 42 L20 56 M28 42 L38 55 M30 28 L44 32 L50 26 M30 28 L20 34 L24 26"/></g><circle cx="32" cy="16" r="8" fill="#111"/><rect x="24" y="13" width="16" height="4" fill="#FF3B4E"/><path d="M24 15 Q14 18 8 12 Q16 22 24 18Z" fill="#FF3B4E"/>') + '</svg>';
  }

  BubziKit.run({
    id: 'ink-heroes', coinRate: 0.01, noSkins: true, theme: 'dark', mascot: mascot,
    title: { en: 'Ink Heroes', fr: 'Héros d’Encre', ar: 'أبطال الحبر' },
    strings: {
      en: { tagline: 'Endless zombie night. Punch, shoot and survive!', choose: 'Choose your hero', fight: 'FIGHT!', unlock: 'Unlock', needCoins: 'Not enough coins yet', wave: 'Wave', bossWave: 'BOSS', cleared: 'Wave cleared!', pickPerk: 'Pick a power-up', combo: 'COMBO', reloading: 'Reloading…', newZ: 'New:', block: 'BLOCK', broken: 'SMASHED!', broke: 'Broken!', empty: 'Empty!', rage: 'RAGE MODE!', overrun: 'Overrun!', bAtk: 'HIT', bJump: 'JUMP', bShoot: 'FIRE', bSpec: 'POWER', sPow: 'POWER', sSpd: 'SPEED', sHp: 'HEALTH', keys: '←/→ move · W jump · J hit · K fire · L power · R reload' },
      fr: { tagline: 'Nuit zombie sans fin. Frappe, tire et survis !', choose: 'Choisis ton héros', fight: 'COMBAT !', unlock: 'Débloquer', needCoins: 'Pas encore assez de pièces', wave: 'Vague', bossWave: 'BOSS', cleared: 'Vague terminée !', pickPerk: 'Choisis un bonus', combo: 'COMBO', reloading: 'Rechargement…', newZ: 'Nouveau :', block: 'BLOQUÉ', broken: 'BRISÉ !', broke: 'Cassé !', empty: 'Vide !', rage: 'MODE FURIE !', overrun: 'Submergé !', bAtk: 'FRAPPE', bJump: 'SAUT', bShoot: 'TIR', bSpec: 'POUVOIR', sPow: 'PUISSANCE', sSpd: 'VITESSE', sHp: 'VIE', keys: '←/→ bouger · W sauter · J frapper · K tirer · L pouvoir · R recharger' },
      ar: { tagline: 'ليلة زومبي لا تنتهي. اضرب وأطلق النار ونجُ!', choose: 'اختر بطلك', fight: 'قتال!', unlock: 'افتح', needCoins: 'العملات لا تكفي بعد', wave: 'الموجة', bossWave: 'زعيم', cleared: 'انتهت الموجة!', pickPerk: 'اختر قوة', combo: 'كومبو', reloading: 'إعادة التلقيم…', newZ: 'جديد:', block: 'صدّ', broken: 'تحطّم!', broke: 'انكسر!', empty: 'فارغ!', rage: 'وضع الغضب!', overrun: 'غُمِرت!', bAtk: 'ضرب', bJump: 'قفز', bShoot: 'نار', bSpec: 'قوة', sPow: 'القوة', sSpd: 'السرعة', sHp: 'الصحة', keys: '←/→ تحرك · W قفز · J ضرب · K نار · L قوة · R تلقيم' }
    },
    init: function (K) { K0 = K; held = {}; keys = {}; ui = []; waves = []; layout(K); picked = K.store.get('ink:hero', 'kai');
      window.addEventListener('touchstart', function () { if (!touchUI) { touchUI = true; layout(K); } }, { passive: true }); },
    resize: function (K) { layout(K); },
    reset: function (K) {
      K0 = K; layout(K); held = {}; keys = {}; touchMap = {}; waves = [];
      var own = owned(); picked = K.store.get('ink:hero', 'kai'); if (own.indexOf(picked) < 0) picked = 'kai';
      sel = Math.max(0, HEROES.map(function (h) { return h.id; }).indexOf(picked));
      hero = newHero(K); zombies = []; bullets = []; spits = []; pickups = []; parts = []; decals = []; allies = []; banners = []; wave = 0; combo = 0; comboT = 0; hs = 0; slow = 0; introT = 0; bossRef = null;
      mods = { maxHp: 0, melee: 1, rate: 1, mag: 1, vamp: 0, focus: 1, buddy: 0, luck: 1, crit: 0.05 };
      camX = clamp(hero.x - viewW(K) / 2, 0, Math.max(0, AW - viewW(K))); mode = 'pick';
      if (K.test) K.dbg = function () { return { mode: mode, wave: wave, seen: Object.keys(firstTypes), weapon: (hero.melee && hero.melee.id) || (hero.gun2 && hero.gun2.id) || null, boss: !!bossRef, hero: { x: hero.x, y: hero.y, hp: hero.hp, ink: hero.ink, face: hero.face, ground: hero.ground, ammo: hero.ammo }, zombies: zombies.map(function (z) { return { t: z.t, x: z.x, y: z.y, hp: z.hp, shield: z.shield, atkT: z.atkT }; }), waves: waves.map(function (w) { return { x: w.x }; }), kills: kills, perkOpts: perkOpts, sel: sel, queue: queue.length }; };
    },
    revive: function (K) {
      hero.dead = false; hero.hp = hero.maxHp; hero.inv = 2.6; hero.y = 0; hero.vy = 0; hero.ground = true; hero.atkT = 0; hero.specialT = 0; hero.specialKind = null; spits = []; waves = [];
      K.sfx('boom'); ring(hero.x, -60, 380, '#FFFFFF');
      zombies.forEach(function (z) { var d = Math.abs(z.x - hero.x); if (d < 420) hitZombie(K, z, 60, z.x < hero.x ? -1 : 1, 700, 500, 'boom'); });
    },
    pointerDown: function (x, y, K, id) {
      if (mode === 'pick' || mode === 'perk') { uiTap(K, uiHit(x, y)); return; }
      if (touchUI) { var b = btnAt(K, x, y); if (b) { touchMap[id] = b; press(K, b, true); return; } }
      // mouse click (or a touch outside the buttons): face that way and attack
      if (!touchUI || y < gyS) { var wx = camX + x / sc; if (hero.atkT <= 0) hero.face = wx > hero.x ? 1 : -1; attack(K); }
    },
    pointerMove: function (x, y, K, id, down) {
      if (!down || !touchMap[id] || mode !== 'fight') return;
      var b = btnAt(K, x, y);
      if ((touchMap[id] === 'left' || touchMap[id] === 'right') && (b === 'left' || b === 'right') && b !== touchMap[id]) { press(K, touchMap[id], false); touchMap[id] = b; press(K, b, true); }
    },
    pointerUp: function (x, y, K, id) { if (touchMap[id]) { press(K, touchMap[id], false); delete touchMap[id]; } },
    pointerCancel: function () { held = {}; touchMap = {}; keys = {}; },
    key: function (code, down, K, rep) {
      var map = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
      if (mode === 'pick') {
        if (!down || rep) return;
        if (map[code] === 'left') { sel = (sel + HEROES.length - 1) % HEROES.length; K.sfx('tick'); }
        else if (map[code] === 'right') { sel = (sel + 1) % HEROES.length; K.sfx('tick'); }
        else if (/^Digit[1-4]$/.test(code)) { sel = +code.slice(5) - 1; K.sfx('tick'); }
        else if (code === 'Enter' || code === 'Space' || code === 'KeyJ') confirmHero(K);
        return;
      }
      if (mode === 'perk') {
        if (!down || rep) return;
        if (map[code] === 'left' || code === 'ArrowUp') { perkSel = (perkSel + 2) % 3; K.sfx('tick'); }
        else if (map[code] === 'right' || code === 'ArrowDown') { perkSel = (perkSel + 1) % 3; K.sfx('tick'); }
        else if (/^Digit[1-3]$/.test(code)) { perkSel = +code.slice(5) - 1; applyPerk(K, perkOpts[perkSel]); }
        else if (code === 'Enter' || code === 'Space' || code === 'KeyJ') applyPerk(K, perkOpts[perkSel]);
        return;
      }
      if (map[code]) { keys[map[code]] = down; return; }
      if (code === 'KeyK' || code === 'KeyX') { keys.shoot = down; if (down && !rep) fire(K); return; }
      if (!down || rep) return;
      if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') jump(K);
      else if (code === 'KeyJ' || code === 'KeyZ' || code === 'Enter') attack(K);
      else if (code === 'KeyL' || code === 'KeyC' || code === 'ShiftLeft') special(K);
      else if (code === 'KeyR') reload(K);
    },
    update: function (dt, K) {
      if (held.atkFlash) held.atkFlash = Math.max(0, held.atkFlash - dt);
      if (mode !== 'fight') { updateParts(dt); return; }
      if (slow > 0) { slow -= dt; dt *= 0.3; }
      if (hs > 0) { hs -= dt; updateParts(dt * 0.2); return; }
      tutT += dt; introT = Math.max(0, introT - dt);
      if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }
      banners.forEach(function (b) { b.t -= dt; }); banners = banners.filter(function (b) { return b.t > 0; });
      updateHero(K, dt); if (!K.isPlaying()) return;
      updateZombies(K, dt); if (!K.isPlaying()) return;
      updateAllies(K, dt); updateProjectiles(K, dt); if (!K.isPlaying()) return;
      updatePickups(K, dt); updateParts(dt);
      // spawning
      var aliveN = zombies.length, maxAlive = Math.min(4 + wave, 14);
      if (queue.length && introT <= 0.6) { spawnT -= dt; if (spawnT <= 0 && aliveN < maxAlive) { spawnZombie(K, queue.shift()); spawnT = Math.max(0.35, 1.3 - wave * 0.05) * rnd(0.6, 1.3); } }
      if (!queue.length && !zombies.length && introT <= 0) {
        clearT += dt;
        if (clearT > 1.2) { clearT = 0; K.addScore(100 * wave); K.addCoins(2 + Math.floor(wave / 2)); K.tutorialDone(); hero.ammo = Math.round(hero.def.gun.mag * mods.mag); hero.reloadT = 0; choosePerks(K); mode = 'perk'; K.sfx('reward'); }
      } else clearT = 0;
      // camera
      var vw = viewW(K), tx = clamp(hero.x - vw / 2 + hero.face * vw * 0.08, 0, Math.max(0, AW - vw));
      camX += (tx - camX) * Math.min(1, dt * 5);
    },
    idle: function (dt) { if (parts) updateParts(dt); },
    draw: function (c, K, state) {
      if (!hero) return;
      drawWorld(c, K);
      if (mode === 'pick') { drawPick(c, K); return; }
      zombies.forEach(function (z) { if (z.t === 'biter') drawZombie(c, K, z); });
      allies.forEach(function (a) { drawAlly(c, a); });
      zombies.forEach(function (z) { if (z.t !== 'biter') drawZombie(c, K, z); });
      drawHero(c, K);
      drawPickups(c, K);
      drawParts(c, K);
      drawHud(c, K);
      if (mode === 'perk') drawPerks(c, K);
    }
  });
})();
