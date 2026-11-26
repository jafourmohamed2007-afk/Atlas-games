/* Ink Heroes — original 2.5D stickman brawler: 40-level story "The Inkfall" + endless zombie mode */
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
    gravemaw: { hp: 1500, spd: 72, dmg: 30, range: 135, size: 2.3, col: '#C2414F', dark: '#4E0E1A', score: 600, wave: 99, boss: true, name: { en: 'GRAVEMAW', fr: 'GRAVEMAW', ar: 'غريفماو' }, tip: { en: 'Boss! Jump over its shockwaves.', fr: 'Boss ! Saute par-dessus ses ondes de choc.', ar: 'زعيم! اقفز فوق موجاته الصادمة.' } },
    // story bosses
    conductor: { hp: 1700, spd: 88, dmg: 28, range: 125, size: 2.1, col: '#2FD8C8', dark: '#0E4A44', score: 800, wave: 99, boss: true, ai: 'conductor', name: { en: 'THE CONDUCTOR', fr: 'LE CONTRÔLEUR', ar: 'المُراقِب' }, tip: { en: 'Charges like a train and calls Dashers aboard!', fr: 'Fonce comme un train et appelle des Sprinteurs !', ar: 'يندفع كالقطار ويستدعي العدّائين!' } },
    hollow: { hp: 1050, spd: 80, dmg: 24, range: 115, size: 1.9, col: '#B06CFF', dark: '#3A1466', score: 600, wave: 99, boss: true, ai: 'hollow', name: { en: 'TWIN HOLLOWS', fr: 'JUMEAUX CREUX', ar: 'التوأمان الفارغان' }, tip: { en: 'Two bosses! Beat one and the other gets ANGRY.', fr: 'Deux boss ! Bats-en un et l’autre devient FURIEUX.', ar: 'زعيمان! اهزم أحدهما فيغضب الآخر.' } },
    mother: { hp: 2400, spd: 46, dmg: 26, range: 125, size: 2.15, col: '#E2D23C', dark: '#6B5E08', score: 1000, wave: 99, boss: true, ai: 'mother', name: { en: 'MOTHER GLOOP', fr: 'MÈRE GLOOP', ar: 'الأم غلوب' }, tip: { en: 'Goo volleys from afar. Get close and hit hard!', fr: 'Salves de gelée de loin. Approche et frappe fort !', ar: 'وابل لزج من بعيد. اقترب واضرب بقوة!' } },
    nullk: { hp: 2600, spd: 250, dmg: 15, range: 78, size: 1.18, col: '#0B0B0B', dark: '#222222', score: 2000, wave: 99, boss: true, ai: 'null', name: { en: 'NULL', fr: 'NULL', ar: 'نَل' }, tip: { en: 'The first drawing. Dashes, teleports, clones!', fr: 'Le premier dessin. Ruées, téléportations, clones !', ar: 'الرسمة الأولى. اندفاع وانتقال ونُسخ!' } },
    nclone: { hp: 150, spd: 230, dmg: 9, range: 70, size: 1, col: '#1A1A1A', dark: '#2A2A2A', score: 80, wave: 99, ai: 'null', clone: true, name: { en: 'Null Sketch', fr: 'Esquisse de Null', ar: 'مسودة نَل' }, tip: { en: 'A rough copy. Hit it fast.', fr: 'Une copie ratée. Frappe vite.', ar: 'نسخة رديئة. اضربها بسرعة.' } }
  };
  var TYPES = ['shuffler', 'dasher', 'gloop', 'biter', 'bruiser', 'popper', 'doorman'];
  var WEAPONS = {
    katana: { melee: true, mult: 1.7, range: 22, uses: 30, col: '#DDE6F0', name: { en: 'KATANA', fr: 'KATANA', ar: 'كاتانا' } },
    axe: { melee: true, mult: 2.3, range: 12, uses: 20, col: '#B0B8C4', name: { en: 'AXE', fr: 'HACHE', ar: 'فأس' } }
  };
  /* ---------------- shop: guns (persisted, equip one) ---------------- */
  var GUNS = {
    sig: { price: 0, name: { en: 'Hero Gun', fr: 'Arme du héros', ar: 'سلاح البطل' } },
    vipers: { price: 250, dmg: 12, pel: 1, rate: 0.11, mag: 24, reload: 1.2, spread: 0.05, spd: 1700, life: 0.6, col: '#FFE58A', look: 'twin', name: { en: 'Twin Vipers', fr: 'Vipères jumelles', ar: 'الأفعيان' } },
    buzz: { price: 450, dmg: 9, pel: 1, rate: 0.07, mag: 40, reload: 1.3, spread: 0.07, spd: 1700, life: 0.55, col: '#FFE58A', look: 'smg', name: { en: 'Buzzsaw SMG', fr: 'Mitraillette Scie', ar: 'رشاش المنشار' } },
    boom: { price: 650, dmg: 9, pel: 7, rate: 0.6, mag: 6, reload: 1.5, spread: 0.2, spd: 1500, life: 0.28, col: '#FFD08A', look: 'shotgun', name: { en: 'Boomstick', fr: 'Tromblon', ar: 'بندقية البوم' } },
    ranger: { price: 900, dmg: 14, pel: 1, rate: 0.1, mag: 30, reload: 1.4, spread: 0.03, spd: 1900, life: 0.7, col: '#FFE58A', look: 'rifle', name: { en: 'Ranger AR', fr: 'Fusil Ranger', ar: 'بندقية رينجر' } },
    longshot: { price: 1200, dmg: 95, pel: 1, rate: 0.95, mag: 5, reload: 1.8, spread: 0, spd: 2800, life: 1.0, pierce: true, col: '#FFFFFF', look: 'sniper', name: { en: 'Longshot Sniper', fr: 'Sniper Longue-Vue', ar: 'قناصة لونغشوت' } },
    thunder: { price: 1600, dmg: 12, pel: 1, rate: 0.06, mag: 100, reload: 2.8, spread: 0.08, spd: 1800, life: 0.65, col: '#FFE58A', look: 'lmg', name: { en: 'Thunder LMG', fr: 'Mitrailleuse Tonnerre', ar: 'رشاش الرعد' } },
    inkjet: { price: 2000, dmg: 24, pel: 1, rate: 0.18, mag: 35, reload: 1.4, spread: 0, spd: 2200, life: 0.6, pierce: true, laser: true, col: '#3EE0FF', look: 'laser', name: { en: 'Inkjet Laser', fr: 'Laser Jet d’encre', ar: 'ليزر الحبر' } },
    frost: { price: 2400, dmg: 11, pel: 1, rate: 0.13, mag: 28, reload: 1.4, spread: 0.04, spd: 1500, life: 0.6, frost: true, col: '#9BE7FF', look: 'frost', name: { en: 'Frost Blaster', fr: 'Blaster Givre', ar: 'المُجمِّد' } },
    hornet: { price: 3000, dmg: 85, pel: 1, rate: 0.85, mag: 6, reload: 2.2, spread: 0, spd: 900, life: 1.2, rocket: true, col: '#FF8A1F', look: 'rocket', name: { en: 'Hornet Rockets', fr: 'Roquettes Frelon', ar: 'صواريخ الدبور' } },
    tesla: { price: 3800, dmg: 20, pel: 1, rate: 0.24, mag: 20, reload: 1.6, spread: 0, spd: 2400, life: 0.5, tesla: true, col: '#C08BFF', look: 'tesla', name: { en: 'Tesla Coil', fr: 'Bobine Tesla', ar: 'ملف تسلا' } }
  };
  var GUN_ORDER = ['sig', 'vipers', 'buzz', 'boom', 'ranger', 'longshot', 'thunder', 'inkjet', 'frost', 'hornet', 'tesla'];
  var GUN_EXTRA = {
    longshot: { en: 'Pierces every zombie in line', fr: 'Transperce tous les zombies alignés', ar: 'يخترق كل الزومبي في الصف' },
    inkjet: { en: 'Piercing laser beam', fr: 'Rayon laser perçant', ar: 'شعاع ليزر خارق' },
    frost: { en: 'Slows and freezes zombies', fr: 'Ralentit et gèle les zombies', ar: 'يبطئ الزومبي ويجمّدهم' },
    hornet: { en: 'Explodes on impact', fr: 'Explose à l’impact', ar: 'ينفجر عند الاصطدام' },
    tesla: { en: 'Lightning jumps to 3 zombies', fr: 'L’éclair touche 3 zombies', ar: 'البرق يقفز إلى 3 زومبي' },
    boom: { en: '7 pellets, short range', fr: '7 plombs, courte portée', ar: '7 طلقات، مدى قصير' },
    thunder: { en: '100-round belt', fr: 'Bande de 100 balles', ar: 'حزام 100 طلقة' }
  };
  /* ---------------- shop: items (consumables) ---------------- */
  var ITEMS = {
    heart: { price: 150, max: 5, col: '#FF3B6B', key: '', name: { en: 'Heart', fr: 'Cœur', ar: 'قلب' }, desc: { en: 'Revive when you fall', fr: 'Te relève quand tu tombes', ar: 'تنهض عندما تسقط' } },
    medkit: { price: 60, max: 9, col: '#22C55E', key: '1', name: { en: 'Medkit', fr: 'Trousse de soin', ar: 'حقيبة إسعاف' }, desc: { en: 'Heal 60% health', fr: 'Soigne 60 % de vie', ar: 'تعالج 60% من الصحة' } },
    grenade: { price: 40, max: 9, col: '#6B8E3A', key: '2', name: { en: 'Grenade', fr: 'Grenade', ar: 'قنبلة يدوية' }, desc: { en: 'Throw a big blast', fr: 'Lance une grosse explosion', ar: 'ارمِ انفجاراً كبيراً' } },
    freeze: { price: 100, max: 9, col: '#38B6FF', key: '3', name: { en: 'Freeze Bomb', fr: 'Bombe glace', ar: 'قنبلة التجميد' }, desc: { en: 'Freeze every zombie 4 s', fr: 'Gèle tous les zombies 4 s', ar: 'تجمّد كل الزومبي 4 ث' } },
    shield: { price: 90, max: 9, col: '#3EE0FF', key: '4', name: { en: 'Shield Bubble', fr: 'Bulle bouclier', ar: 'فقاعة الدرع' }, desc: { en: 'No damage for 8 s', fr: 'Aucun dégât pendant 8 s', ar: 'لا ضرر لمدة 8 ث' } },
    serum: { price: 70, max: 9, col: '#FF3B4E', key: '5', name: { en: 'Rage Serum', fr: 'Sérum de rage', ar: 'مصل الغضب' }, desc: { en: 'Double damage 10 s', fr: 'Dégâts doublés 10 s', ar: 'ضرر مضاعف 10 ث' } },
    turret: { price: 110, max: 9, col: '#FFB020', key: '6', name: { en: 'Auto-Turret', fr: 'Tourelle auto', ar: 'برج آلي' }, desc: { en: 'A gun that fights for 15 s', fr: 'Une tourelle qui tire 15 s', ar: 'برج يقاتل معك 15 ث' } },
    airstrike: { price: 140, max: 9, col: '#FF8A1F', key: '7', name: { en: 'Airstrike', fr: 'Frappe aérienne', ar: 'غارة جوية' }, desc: { en: 'Bombs rain on the screen', fr: 'Pluie de bombes à l’écran', ar: 'قنابل تمطر على الشاشة' } }
  };
  var ITEM_ORDER = ['heart', 'medkit', 'grenade', 'freeze', 'shield', 'serum', 'turret', 'airstrike'];
  function ownedGuns() { var o = K0.store.get('ink:guns', ['sig']); if (!Array.isArray(o)) o = ['sig']; if (o.indexOf('sig') < 0) o.push('sig'); return o; }
  function equippedGun() { var id = K0.store.get('ink:gun', 'sig'); return GUNS[id] && ownedGuns().indexOf(id) >= 0 ? id : 'sig'; }
  function inv() { var o = K0.store.get('ink:items', null); if (!o || typeof o !== 'object') o = { heart: 1, grenade: 2, medkit: 1 }; ITEM_ORDER.forEach(function (k) { o[k] = Math.max(0, Math.min(ITEMS[k].max, Math.floor(o[k] || 0))); }); return o; }
  function saveInv(o) { K0.store.set('ink:items', o); }
  function gunDef(id) { // full stat block for any gun id (sig = the hero's own gun)
    if (id === 'sig') { var g = hero.def.gun; return { dmg: g.dmg, pel: g.pel, rate: g.rate, mag: g.mag, reload: g.reload, spread: g.spread, spd: 1700, life: g.pel > 1 ? 0.3 : 0.7, pierce: g.pierce, col: '#FFE58A', look: g.kind }; }
    return GUNS[id];
  }
  function gunStats(g) { // 0..1 bars for the shop card
    return [Math.min(1, Math.sqrt(g.dmg * g.pel / 95)), Math.min(1, (1 / g.rate) / (1 / 0.06)), Math.min(1, Math.sqrt(g.mag / 100)), Math.min(1, 0.8 / g.reload), Math.min(1, g.spd * g.life / 2800)];
  }
  function gunSfx(K, g) {
    var S = K.synth, look = g.look;
    if (look === 'shotgun') { S.noise(0.22, 0.5, 1800); S.tone(110, 50, 0.18, 'sine', 0.45); }
    else if (look === 'sniper') { S.noise(0.35, 0.45, 5000); S.tone(320, 60, 0.35, 'sawtooth', 0.12); S.tone(1800, 1800, 0.05, 'triangle', 0.05, 0.25); }
    else if (look === 'lmg' || look === 'smg') { S.noise(0.05, 0.28, look === 'lmg' ? 2200 : 4200); S.tone(look === 'lmg' ? 130 : 220, 90, 0.04, 'square', 0.07); }
    else if (look === 'laser') { S.tone(1500, 300, 0.12, 'sawtooth', 0.09); S.tone(2200, 900, 0.08, 'sine', 0.07); }
    else if (look === 'frost') { S.tone(2400, 1200, 0.1, 'triangle', 0.1); S.noise(0.08, 0.12, 8000); }
    else if (look === 'rocket') { S.noise(0.5, 0.35, 900); S.tone(200, 60, 0.4, 'sawtooth', 0.12); }
    else if (look === 'tesla') { S.tone(90, 1400, 0.09, 'sawtooth', 0.1); S.noise(0.12, 0.2, 7000); S.tone(1400, 120, 0.12, 'square', 0.05, 0.05); }
    else if (look === 'twin') { S.noise(0.05, 0.25, 3600); S.tone(260, 110, 0.05, 'square', 0.07); }
    else if (look === 'rifle') { S.noise(0.08, 0.32, 2800); S.tone(170, 70, 0.07, 'square', 0.08); }
    else if (look === 'kunai') { S.noise(0.08, 0.18, 6000); S.tone(900, 400, 0.06, 'triangle', 0.08); }
    else { S.noise(0.07, 0.32, 3200); S.tone(190, 80, 0.06, 'square', 0.08); }
  }
  // gun drawn pointing +x from the grip at (0,0); 1 unit = 1 px at scale s
  function drawGun(c, look, s) {
    c.save(); c.scale(s, s);
    var dark = '#262630', mid = '#3C3C4A', R = function (x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r || 0); else c.rect(x, y, w, h); c.fill(); };
    c.fillStyle = dark; R(-2, -2, 8, 14, 2); // grip
    if (look === 'pistol' || look === 'twin') { c.fillStyle = mid; R(-6, -9, 30, 9, 2); if (look === 'twin') { c.fillStyle = '#B8902A'; R(-6, -9, 30, 3, 1); } }
    else if (look === 'kunai') { c.fillStyle = '#C7CED8'; c.beginPath(); c.moveTo(-4, -6); c.lineTo(22, -3); c.lineTo(-4, 0); c.fill(); c.fillStyle = '#B06CFF'; R(-10, -5, 7, 4, 1); }
    else if (look === 'smg') { c.fillStyle = mid; R(-8, -10, 34, 11, 2); c.fillStyle = dark; R(6, 1, 6, 14, 1); R(24, -7, 10, 4, 1); }
    else if (look === 'shotgun') { c.fillStyle = '#6B4A2A'; R(-22, -8, 18, 9, 3); c.fillStyle = mid; R(-4, -10, 48, 8, 2); R(4, -2, 26, 5, 2); }
    else if (look === 'rifle') { c.fillStyle = dark; R(-22, -9, 18, 10, 2); c.fillStyle = mid; R(-4, -11, 44, 11, 2); R(40, -8, 14, 4, 1); c.fillStyle = dark; R(8, 0, 7, 13, 1); c.fillStyle = '#4ADE80'; R(4, -14, 10, 3, 1); }
    else if (look === 'sniper') { c.fillStyle = '#3A3A28'; R(-26, -8, 22, 9, 3); c.fillStyle = mid; R(-4, -10, 40, 9, 2); R(36, -7, 34, 4, 1); c.fillStyle = dark; R(4, -18, 24, 6, 3); c.fillStyle = '#9BE7FF'; R(26, -17, 3, 4, 1); }
    else if (look === 'lmg') { c.fillStyle = dark; R(-20, -9, 16, 10, 2); c.fillStyle = mid; R(-4, -12, 50, 13, 3); R(46, -8, 18, 5, 1); c.fillStyle = '#5E5E3A'; c.beginPath(); c.arc(14, 6, 9, 0, Math.PI * 2); c.fill(); c.fillStyle = '#B8902A'; for (var i = 0; i < 4; i++) R(8 + i * 4, -15, 2, 4, 1); }
    else if (look === 'laser') { c.fillStyle = '#E6F0FF'; R(-6, -11, 42, 12, 5); c.fillStyle = '#3EE0FF'; c.shadowColor = '#3EE0FF'; c.shadowBlur = 8; R(2, -7, 30, 4, 2); R(36, -8, 8, 6, 2); c.shadowBlur = 0; }
    else if (look === 'frost') { c.fillStyle = '#DDF4FF'; R(-6, -11, 36, 12, 4); c.fillStyle = '#38B6FF'; R(30, -9, 10, 8, 3); c.fillStyle = '#9BE7FF'; c.beginPath(); c.arc(10, -14, 6, 0, Math.PI * 2); c.fill(); }
    else if (look === 'rocket') { c.fillStyle = '#5E7A3A'; R(-26, -14, 64, 14, 6); c.fillStyle = dark; R(-30, -16, 6, 18, 2); R(34, -16, 6, 18, 2); c.fillStyle = '#FF3B4E'; c.beginPath(); c.moveTo(40, -12); c.lineTo(50, -7); c.lineTo(40, -2); c.fill(); }
    else if (look === 'tesla') { c.fillStyle = mid; R(-6, -10, 26, 11, 3); c.fillStyle = '#B87333'; for (var j = 0; j < 4; j++) R(18 + j * 5, -13, 3, 17, 1); c.fillStyle = '#C08BFF'; c.shadowColor = '#C08BFF'; c.shadowBlur = 10; c.beginPath(); c.arc(42, -5, 5, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0; }
    c.restore();
  }
  function drawItemIcon(c, id, x, y, r) {
    var it = ITEMS[id];
    c.fillStyle = it.col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.4, r * 0.4, r * 0.22, -0.5, 0, TAU); c.fill();
    c.fillStyle = '#FFFFFF'; c.strokeStyle = '#FFFFFF'; c.lineCap = 'round'; c.lineWidth = r * 0.16;
    var k = r * 0.5;
    if (id === 'heart') { c.beginPath(); c.moveTo(x, y + k * 0.8); c.bezierCurveTo(x - k * 1.4, y - k * 0.1, x - k * 0.6, y - k * 1.1, x, y - k * 0.35); c.bezierCurveTo(x + k * 0.6, y - k * 1.1, x + k * 1.4, y - k * 0.1, x, y + k * 0.8); c.fill(); }
    else if (id === 'medkit') { c.fillRect(x - k * 0.25, y - k * 0.8, k * 0.5, k * 1.6); c.fillRect(x - k * 0.8, y - k * 0.25, k * 1.6, k * 0.5); }
    else if (id === 'grenade') { c.fillStyle = '#2E3A1C'; c.beginPath(); c.ellipse(x, y + k * 0.15, k * 0.6, k * 0.75, 0, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.fillRect(x - k * 0.2, y - k * 0.9, k * 0.4, k * 0.3); c.beginPath(); c.arc(x + k * 0.35, y - k * 0.8, k * 0.22, 0, TAU); c.stroke(); }
    else if (id === 'freeze') { for (var i = 0; i < 3; i++) { var a = i * Math.PI / 3; c.beginPath(); c.moveTo(x + Math.cos(a) * k, y + Math.sin(a) * k); c.lineTo(x - Math.cos(a) * k, y - Math.sin(a) * k); c.stroke(); } }
    else if (id === 'shield') { c.beginPath(); c.moveTo(x, y - k); c.lineTo(x + k * 0.8, y - k * 0.5); c.quadraticCurveTo(x + k * 0.7, y + k * 0.6, x, y + k); c.quadraticCurveTo(x - k * 0.7, y + k * 0.6, x - k * 0.8, y - k * 0.5); c.closePath(); c.fill(); }
    else if (id === 'serum') { c.fillRect(x - k * 0.2, y - k, k * 0.4, k * 0.5); c.beginPath(); c.moveTo(x - k * 0.2, y - k * 0.5); c.lineTo(x - k * 0.7, y + k * 0.7); c.lineTo(x + k * 0.7, y + k * 0.7); c.lineTo(x + k * 0.2, y - k * 0.5); c.closePath(); c.fill(); }
    else if (id === 'turret') { c.fillRect(x - k * 0.7, y + k * 0.3, k * 1.4, k * 0.5); c.beginPath(); c.arc(x, y + k * 0.1, k * 0.45, Math.PI, 0); c.fill(); c.fillRect(x, y - k * 0.3, k * 0.9, k * 0.25); }
    else if (id === 'airstrike') { c.beginPath(); c.moveTo(x - k, y - k * 0.2); c.lineTo(x + k, y - k * 0.2); c.lineTo(x + k * 0.6, y + k * 0.1); c.lineTo(x - k, y + k * 0.1); c.fill(); c.beginPath(); c.moveTo(x - k * 0.1, y - k * 0.2); c.lineTo(x - k * 0.4, y - k * 0.9); c.lineTo(x + k * 0.1, y - k * 0.2); c.fill(); c.beginPath(); c.arc(x + k * 0.1, y + k * 0.7, k * 0.2, 0, TAU); c.fill(); }
  }
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

  /* ---------------- infinity difficulty: every wave is strictly harder, forever ---------------- */
  function threat(n) {
    var k = n - 1;
    return { hp: 1 + 0.12 * k + 0.004 * k * k, dmg: 1 + 0.05 * k, spd: 1 + Math.min(0.6, 0.022 * k), count: Math.min(60, Math.round(6 + 2.6 * n)),
      maxAlive: Math.min(22, 4 + n), spawn: Math.max(0.25, 1.3 - 0.05 * k), elite: n < 6 ? 0 : Math.min(0.45, 0.04 * (n - 5)),
      special: Math.min(0.85, 0.3 + 0.045 * k), bosses: n % 5 === 0 ? 1 + Math.floor(n / 15) : 0, muts: n >= 15 ? 2 : n >= 6 ? 1 : 0 };
  }
  var MUTS = {
    fast: { en: ['Fast Night', 'Zombies move faster'], fr: ['Nuit rapide', 'Les zombies vont plus vite'], ar: ['ليلة سريعة', 'الزومبي أسرع'] },
    tough: { en: ['Thick Skin', '+40% zombie health'], fr: ['Peau épaisse', '+40 % de vie pour les zombies'], ar: ['جلد سميك', '+40% صحة الزومبي'] },
    horde: { en: ['The Horde', '50% more zombies'], fr: ['La horde', '50 % de zombies en plus'], ar: ['الحشد', 'زومبي أكثر بنسبة 50%'] },
    spitters: { en: ['Goo Rain', 'Lots of Gloops'], fr: ['Pluie de gelée', 'Plein de Gloops'], ar: ['مطر اللزوجة', 'الكثير من غلوب'] },
    boom: { en: ['Pop Party', 'Lots of Poppers'], fr: ['Fête explosive', 'Plein de Pétards'], ar: ['حفلة الانفجارات', 'الكثير من المنفجرين'] },
    redmoon: { en: ['Red Moon', 'More elite zombies'], fr: ['Lune rouge', 'Plus de zombies d’élite'], ar: ['القمر الأحمر', 'زومبي نخبة أكثر'] }
  };
  /* ---------------- STORY MODE: "The Inkfall" — 5 chapters × 8 levels + Nightmare ---------------- */
  // level codes: c = clear all, r = rescue survivors, sNN = survive NN s, dNN = defend the lantern NN s, b = boss; ":mod" = swarm | nogun | elite | dark
  var CHAPTERS = [
    { theme: 'ruins', col: '#FF8A5B', boss: ['gravemaw'], unlock: 'rook', lv: ['c', 'r', 's40', 'c:swarm', 'd45', 'c:nogun', 's50:elite', 'b'], name: { en: 'Smudge Street', fr: 'Rue des Taches', ar: 'شارع البقع' } },
    { theme: 'metro', col: '#2FD8C8', boss: ['conductor'], unlock: 'vex', lv: ['c', 'r:dark', 's45', 'd45', 'c:swarm', 'r:nogun', 's55:dark', 'b'], name: { en: 'Platform Zero', fr: 'Quai Zéro', ar: 'الرصيف صفر' } },
    { theme: 'neon', col: '#FF4FD8', boss: ['hollow', 'hollow'], unlock: 'juno', lv: ['c', 's45:dark', 'r', 'c:elite', 'd50', 'c:swarm', 's55:elite', 'b'], name: { en: 'Neon Erasure', fr: 'Néon Effacé', ar: 'نيون الممحاة' } },
    { theme: 'desert', col: '#FFB020', boss: ['mother'], lv: ['c', 'r', 's50:swarm', 'd50', 'c:nogun', 'r:elite', 's60:dark', 'b'], name: { en: 'Desert of Mistakes', fr: 'Désert des Ratures', ar: 'صحراء الأخطاء' } },
    { theme: 'margin', col: '#E8E8F0', boss: ['nullk'], lv: ['c:elite', 'r:dark', 's55', 'd55:elite', 'c:swarm', 's60:nogun', 'r:swarm', 'b'], name: { en: 'The Margin', fr: 'La Marge', ar: 'الهامش' } }
  ];
  var NLV = CHAPTERS.length * 8;
  // script: key "chapter:level" plays before that level (first time only); "chapter:end" after the boss
  var SCRIPT = {
    '0:0': [['nar', 'Every world is drawn by someone. This one was drawn in ink.', 'Chaque monde est dessiné par quelqu’un. Celui-ci a été dessiné à l’encre.', 'كل عالم يرسمه أحد ما. وهذا العالم رُسم بالحبر.'],
      ['nar', 'Then, one night, the ink began to spill… and everything it touched got SMUDGED.', 'Puis, une nuit, l’encre a commencé à couler… et tout ce qu’elle touchait devenait TACHÉ.', 'ثم في ليلة ما بدأ الحبر ينسكب… وكل ما لمسه أصبح ملطّخاً.'],
      ['kai', 'Uh… why is the mailman eating the mailbox?', 'Euh… pourquoi le facteur mange la boîte aux lettres ?', 'أمم… لماذا يأكل ساعي البريد صندوق البريد؟'],
      ['rook', 'Because he’s Smudged, kid. DUCK!', 'Parce qu’il est taché, petit. BAISSE-TOI !', 'لأنه ملطّخ يا فتى. انخفض!'],
      ['rook', 'Name’s Rook. Stay close and hit anything that drips.', 'Moi c’est Rook. Reste près de moi et frappe tout ce qui dégouline.', 'اسمي روك. ابقَ قريباً واضرب كل ما يقطر.']],
    '0:3': [['kai', 'They keep crawling out of the puddles!', 'Ils sortent sans arrêt des flaques !', 'إنهم يزحفون من البرك بلا توقف!'],
      ['rook', 'Then we follow the puddles to where they start.', 'Alors on remonte les flaques jusqu’à leur source.', 'إذن نتبع البرك إلى حيث تبدأ.']],
    '0:7': [['nar', 'All the puddles flowed into one giant crater…', 'Toutes les flaques coulaient vers un cratère géant…', 'كل البرك كانت تسيل نحو حفرة عملاقة…'],
      ['rook', 'Oh no. That’s not a crater. That’s a MOUTH.', 'Oh non. Ce n’est pas un cratère. C’est une BOUCHE.', 'أوه لا. هذه ليست حفرة. إنها فم!'],
      ['gravemaw', 'GRRRAAAVE… MAAAW…', 'GRRRAAAVE… MAAAW…', 'غرررريف… ماااو…']],
    '0:end': [['kai', 'Rook… the ink is moving. It’s writing something.', 'Rook… l’encre bouge. Elle écrit quelque chose.', 'روك… الحبر يتحرك. إنه يكتب شيئاً.'],
      ['nar', 'Across the street, the spilled ink spelled three words: THE AUTHOR LIED.', 'Sur la route, l’encre renversée formait quatre mots : L’AUTEUR A MENTI.', 'على الطريق، كتب الحبر المسكوب كلمتين: المؤلف كذب.'],
      ['rook', 'Kid… I think we’re drawings.', 'Petit… je crois qu’on est des dessins.', 'يا فتى… أظن أننا مجرد رسومات.'],
      ['kai', 'Then someone is erasing us. Let’s find out who.', 'Alors quelqu’un nous efface. Découvrons qui.', 'إذن هناك من يمحونا. لنكتشف من هو.']],
    '1:0': [['nar', 'Chapter 2. Under the city, the last train is still running.', 'Chapitre 2. Sous la ville, le dernier train roule encore.', 'الفصل 2. تحت المدينة، القطار الأخير ما زال يسير.'],
      ['kai', 'A radio message! “Last train… Platform Zero…”', 'Un message radio ! « Dernier train… Quai Zéro… »', 'رسالة لاسلكية! «القطار الأخير… الرصيف صفر…»'],
      ['vex', 'If you two are done screaming, I could use some help. I’m Vex.', 'Si vous avez fini de crier, j’aurais besoin d’aide. Moi c’est Vex.', 'إن انتهيتما من الصراخ، أحتاج بعض المساعدة. أنا فيكس.'],
      ['vex', 'I hacked the station signal. The ink isn’t coming from the ground. It’s coming from ABOVE.', 'J’ai piraté le signal de la gare. L’encre ne vient pas du sol. Elle vient d’EN HAUT.', 'اخترقت إشارة المحطة. الحبر لا يأتي من الأرض. إنه يأتي من الأعلى!']],
    '1:3': [['rook', 'Why is the train full of Smudged commuters?', 'Pourquoi le train est plein de voyageurs tachés ?', 'لماذا القطار مليء بركّاب ملطّخين؟'],
      ['vex', 'Rush hour. Shoot faster.', 'Heure de pointe. Tire plus vite.', 'ساعة الذروة. أطلق أسرع.']],
    '1:7': [['conductor', 'TICKETS. YOUR TICKETS ARE EXPIRED.', 'BILLETS. VOS BILLETS SONT PÉRIMÉS.', 'التذاكر. تذاكركم منتهية الصلاحية.'],
      ['conductor', '…LIKE YOU.', '…COMME VOUS.', '…مثلكم.']],
    '1:end': [['vex', 'I got a photo from the train roof. Look at the sky.', 'J’ai une photo depuis le toit du train. Regardez le ciel.', 'التقطت صورة من سقف القطار. انظروا إلى السماء.'],
      ['nar', 'Above the clouds hung a giant eraser, rubbing the edge of the city away.', 'Au-dessus des nuages flottait une gomme géante qui effaçait le bord de la ville.', 'فوق الغيوم كانت ممحاة عملاقة تمحو أطراف المدينة.'],
      ['kai', 'Someone up there is erasing the world… one street at a time.', 'Quelqu’un là-haut efface le monde… une rue à la fois.', 'هناك من يمحو العالم من الأعلى… شارعاً بعد شارع.'],
      ['vex', 'Then we climb. I’m coming with you.', 'Alors on grimpe. Je viens avec vous.', 'إذن نصعد. سآتي معكم.']],
    '2:0': [['nar', 'Chapter 3. Neon City, where whole streets glow white… erased.', 'Chapitre 3. Néon City, où des rues entières brillent en blanc… effacées.', 'الفصل 3. مدينة النيون، حيث تتوهج شوارع كاملة بالأبيض… ممحوّة.'],
      ['kai', 'It’s so quiet. Even the zombies here look… unfinished.', 'C’est si calme. Même les zombies ici ont l’air… pas finis.', 'المكان هادئ جداً. حتى الزومبي هنا تبدو… غير مكتملة.'],
      ['juno', 'Because they are. Don’t touch the white. It forgets you.', 'Parce qu’ils le sont. Ne touche pas le blanc. Il t’oublie.', 'لأنها كذلك. لا تلمس البياض. إنه ينساك.'],
      ['juno', 'I’m Juno. And I know who holds the eraser.', 'Je suis Juno. Et je sais qui tient la gomme.', 'أنا جونو. وأعرف من يمسك الممحاة.']],
    '2:3': [['juno', 'His name is NULL. He was the Author’s very first drawing.', 'Il s’appelle NULL. C’était le tout premier dessin de l’Auteur.', 'اسمه نَل. كان أول رسمة رسمها المؤلف.'],
      ['rook', 'So what happened to him?', 'Et qu’est-ce qui lui est arrivé ?', 'وماذا حدث له؟'],
      ['juno', 'The Author didn’t like how he looked. So the Author erased him.', 'L’Auteur n’aimait pas son allure. Alors l’Auteur l’a effacé.', 'لم يعجب المؤلفَ شكلُه. فمحاه.']],
    '2:7': [['hollow', 'WE WERE DRAWN TOGETHER…', 'ON NOUS A DESSINÉS ENSEMBLE…', 'رُسمنا معاً…'],
      ['hollow', '…AND TOGETHER WE WILL END YOU.', '…ET ENSEMBLE, ON VA T’EFFACER.', '…ومعاً سننهيك.']],
    '2:end': [['juno', 'NULL survived in the Margin, the blank edge of the page. There he found the Author’s pen.', 'NULL a survécu dans la Marge, le bord blanc de la page. Là, il a trouvé le stylo de l’Auteur.', 'نجا نَل في الهامش، الحافة البيضاء للصفحة. وهناك وجد قلم المؤلف.'],
      ['juno', 'Every Smudged zombie is a drawing he poured ink on.', 'Chaque zombie taché est un dessin sur lequel il a versé de l’encre.', 'كل زومبي ملطّخ هو رسمة سكب عليها الحبر.'],
      ['kai', 'Then we take the pen back.', 'Alors on reprend le stylo.', 'إذن نستعيد القلم.'],
      ['juno', 'We cross the Desert of Mistakes first. My blade is yours.', 'D’abord, on traverse le Désert des Ratures. Ma lame est à toi.', 'سنعبر صحراء الأخطاء أولاً. نصلي معك.']],
    '3:0': [['nar', 'Chapter 4. The Desert of Mistakes. Every crossed-out line ends up here.', 'Chapitre 4. Le Désert des Ratures. Chaque trait barré finit ici.', 'الفصل 4. صحراء الأخطاء. كل خط مشطوب ينتهي هنا.'],
      ['vex', 'Crumpled pages, broken sketches… this is where the Author threw the bad drawings.', 'Pages froissées, croquis ratés… c’est là que l’Auteur jetait ses mauvais dessins.', 'صفحات مجعّدة ورسومات مكسورة… هنا رمى المؤلف رسوماته السيئة.'],
      ['kai', 'So this is where NULL woke up.', 'Alors c’est ici que NULL s’est réveillé.', 'إذن هنا استيقظ نَل.']],
    '3:3': [['rook', 'Uh, guys? The sand is moving.', 'Euh, les amis ? Le sable bouge.', 'أمم يا رفاق؟ الرمل يتحرك.'],
      ['juno', 'That’s not sand. That’s ink. A LOT of ink.', 'Ce n’est pas du sable. C’est de l’encre. BEAUCOUP d’encre.', 'هذا ليس رملاً. إنه حبر. حبر كثير جداً!']],
    '3:7': [['mother', 'I AM EVERY SPILL. EVERY BLOT. EVERY MISTAKE.', 'JE SUIS CHAQUE TACHE. CHAQUE PÂTÉ. CHAQUE RATURE.', 'أنا كل انسكاب. كل بقعة. كل خطأ.'],
      ['mother', 'I AM HIS MOTHER INK.', 'JE SUIS SON ENCRE MÈRE.', 'أنا حبرُه الأم.']],
    '3:end': [['nar', 'As Mother Gloop melted, a door rose from the dunes. On it, one word: MARGIN →', 'Quand Mère Gloop fondit, une porte surgit des dunes. Dessus, un mot : MARGE →', 'عندما ذابت الأم غلوب، ارتفع باب من الكثبان. عليه كلمة واحدة: الهامش ←'],
      ['juno', 'Past that door there’s nothing. Just paper. And him.', 'Derrière cette porte, il n’y a rien. Juste du papier. Et lui.', 'خلف هذا الباب لا يوجد شيء. ورق فقط. وهو.'],
      ['kai', 'Then let’s finish this page.', 'Alors finissons cette page.', 'إذن لننهِ هذه الصفحة.']],
    '4:0': [['nar', 'Final chapter. The Margin. White paper, forever, in every direction.', 'Dernier chapitre. La Marge. Du papier blanc, à l’infini, dans toutes les directions.', 'الفصل الأخير. الهامش. ورق أبيض بلا نهاية في كل اتجاه.'],
      ['null', 'So the Author drew a hero. How sweet.', 'Alors l’Auteur a dessiné un héros. Comme c’est mignon.', 'إذن رسم المؤلف بطلاً. يا للّطافة.'],
      ['null', 'Look at you, Kai. Same pose. Same lines. You’re my SECOND DRAFT.', 'Regarde-toi, Kai. Même pose. Mêmes traits. Tu es mon DEUXIÈME BROUILLON.', 'انظر إلى نفسك يا كاي. نفس الوقفة. نفس الخطوط. أنت مسودتي الثانية.'],
      ['kai', 'I’m nobody’s draft.', 'Je ne suis le brouillon de personne.', 'لست مسودة أحد.']],
    '4:3': [['null', 'Every zombie you punched was a drawing someone gave up on. Just like me.', 'Chaque zombie que tu frappes est un dessin que quelqu’un a abandonné. Comme moi.', 'كل زومبي ضربته كان رسمة تخلّى عنها أحد. مثلي تماماً.'],
      ['kai', 'Then why are you doing the same thing to them?', 'Alors pourquoi tu leur fais la même chose ?', 'إذن لماذا تفعل بهم الشيء نفسه؟'],
      ['null', 'If I erase the whole book, nobody ever gets thrown away again.', 'Si j’efface tout le livre, plus personne ne sera jamais jeté.', 'إن محوت الكتاب كله، فلن يُرمى أحد بعد اليوم.']],
    '4:7': [['null', 'Enough talk. Let me show you what a FIRST draft can do.', 'Assez parlé. Je vais te montrer ce dont un PREMIER brouillon est capable.', 'كفى كلاماً. سأريك ما تستطيعه المسودة الأولى.']],
    '4:end': [['nar', 'NULL fell. The Author’s pen rolled to Kai’s feet.', 'NULL tomba. Le stylo de l’Auteur roula jusqu’aux pieds de Kai.', 'سقط نَل. وتدحرج قلم المؤلف حتى قدمي كاي.'],
      ['null', 'Go on. Erase me. That’s what the pen is for.', 'Vas-y. Efface-moi. C’est à ça que sert le stylo.', 'هيا. امحني. هذا ما وُجد القلم لأجله.'],
      ['kai', 'No. Nobody deserves to be erased.', 'Non. Personne ne mérite d’être effacé.', 'لا. لا أحد يستحق أن يُمحى.'],
      ['nar', 'Kai didn’t erase. Kai DREW: a new outline around NULL. Finished. Whole.', 'Kai n’effaça pas. Kai DESSINA : un nouveau contour autour de NULL. Fini. Entier.', 'لم يمحُ كاي. بل رسم خطاً جديداً حول نَل. مكتملاً. كاملاً.'],
      ['null', '…Why?', '…Pourquoi ?', '…لماذا؟'],
      ['kai', 'Because you were never a mistake. Just unfinished.', 'Parce que tu n’as jamais été une erreur. Juste inachevé.', 'لأنك لم تكن خطأً أبداً. فقط لم تكتمل.'],
      ['nar', 'Far above, a hand that hadn’t drawn in years picked up a pencil again… and smiled.', 'Tout là-haut, une main qui n’avait pas dessiné depuis des années reprit un crayon… et sourit.', 'وفي الأعلى، أمسكت يدٌ لم ترسم منذ سنوات قلماً من جديد… وابتسمت.'],
      ['nar', 'THE END…? A new page turns. NIGHTMARE MODE unlocked.', 'FIN… ? Une nouvelle page se tourne. MODE CAUCHEMAR débloqué.', 'النهاية…؟ صفحة جديدة تُقلب. فُتح وضع الكابوس.']]
  };
  var THEMES = {
    ruins: { sky: ['#5C3B7A', '#E0775C', '#FFC587'], skyN: ['#0E0820', '#3A1838', '#8A2E3A'], L: ['#8C5A7E', '#5E3B60'], prop: '#3A2440', g: ['#6B4E5E', '#4A3448', '#2A1C2C'], edge: 'rgba(255,200,150,0.35)', grid: 'rgba(0,0,0,0.22)', win: 'rgba(255,190,110,0.55)', bar: '#FFC93C' },
    metro: { sky: ['#06161A', '#0E3036', '#185056'], L: ['#123236', '#0B2326'], prop: '#081A1C', g: ['#6A7478', '#434C50', '#1C2426'], edge: 'rgba(255,214,40,0.9)', grid: 'rgba(0,0,0,0.22)', win: 'rgba(255,240,180,0.75)', bar: '#FFD628' },
    neon: { sky: ['#05031A', '#170A36', '#3A0F4E'], L: ['#1C1446', '#110B2E'], prop: '#0C0820', g: ['#2C2648', '#1A1532', '#0A0816'], edge: 'rgba(255,79,216,0.7)', grid: 'rgba(62,224,255,0.13)', win: 'rgba(62,224,255,0.65)', bar: '#FF4FD8' },
    desert: { sky: ['#2A0E1E', '#B8461E', '#FFB35A'], L: ['#7A3A1E', '#4A1E12'], prop: '#2A120C', g: ['#C98A4A', '#8A5226', '#3A1E10'], edge: 'rgba(255,230,170,0.45)', grid: 'rgba(60,20,0,0.16)', win: '', bar: '#1A0A06' },
    margin: { sky: ['#F1EDE2', '#F6F3EA', '#FBF9F3'], L: ['#DAD4C6', '#C9C2B2'], prop: '#A89E8A', g: ['#ECE7DA', '#E0D9C9', '#CBC2AE'], edge: 'rgba(225,60,60,0.75)', grid: 'rgba(70,110,220,0.2)', win: '', bar: '#E13C3C' }
  };
  var K0, curMut = [], bestWave = 0, storyMode = false, story = null, prog = null, mapCh = 0, mapSel = 0, nmOn = false, cut = null, winInfo = null, storyRetry = null, cages = [], lantern = null, civs = [], theme = 'ruins', zoomK = 1, bkY = 0, trainT = 0, curGun = 'sig', bag = {}, turrets = [], bombs = [], nades = [], shopTab = 'guns', shopPage = 0, shopSel = 0, downT = 0, itemUI = [], adReadyAt = 0, planeT = 0, sc, gyS, camX, hero, zombies, bullets, spits, waves, pickups, parts, decals, allies, banners, mode, wave, queue, spawnT, alive, picked, sel,
    perkOpts, perkSel, hs, slow, combo, comboT, mods, kills, bossRef, tutT, ui, touchUI, held, keys, firstTypes, introT, clearT, seed;

  /* ---------------- helpers ---------------- */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function mix(a, b, t) { var p = function (h, i) { return parseInt(h.slice(i, i + 2), 16); }; var o = '#'; for (var i = 1; i < 7; i += 2) { var v = Math.round(p(a, i) + (p(b, i) - p(a, i)) * t); o += (v < 16 ? '0' : '') + v.toString(16); } return o; }
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
    // 2.5D: a soft highlight down each limb + a lit head make the sticks read as round tubes
    var o = -lw * 0.2 * sc, hl = col === '#FFFFFF' ? null : 'rgba(255,255,255,' + (col === '#111111' || col === '#0B0B0B' ? 0.2 : 0.28) + ')';
    if (hl) {
      c.strokeStyle = hl; c.lineWidth = Math.max(1, lw * 0.3 * sc); c.beginPath();
      [[J.hip, J.neck], [J.hip, J.fk], [J.fk, J.ff], [J.neck, J.fe], [J.fe, J.fh]].forEach(function (p2) { c.moveTo(sx(p2[0][0]) + o, sy(p2[0][1]) + o); c.lineTo(sx(p2[1][0]) + o, sy(p2[1][1]) + o); }); c.stroke();
      var hx = sx(J.head[0]), hy = sy(J.head[1]), r = J.R * sc, hg = c.createRadialGradient(hx - r * 0.4, hy - r * 0.45, r * 0.05, hx, hy, r);
      hg.addColorStop(0, 'rgba(255,255,255,0.4)'); hg.addColorStop(0.5, 'rgba(255,255,255,0.06)'); hg.addColorStop(1, 'rgba(0,0,0,0.18)');
      c.fillStyle = hg; c.beginPath(); c.arc(hx, hy, r, 0, TAU); c.fill();
    }
  }
  // draw something standing at world x, pushed back/forward in depth (dz < 0 = farther, smaller, higher)
  function withDepth(c, x, dz, fn, obj) {
    if (!dz) { if (obj) obj._tf = null; fn(); return; }
    var fx = sx(x), fy = gyS, k = 1 + dz * 0.0045, oy = dz * 0.55 * sc;
    if (obj) obj._tf = [fx, fy, oy, k];
    c.save(); c.translate(fx, fy + oy); c.scale(k, k); c.translate(-fx, -fy); fn(); c.restore();
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
  function setupRun(K) {
    hero = newHero(K); zombies = []; bullets = []; spits = []; pickups = []; parts = []; decals = []; allies = []; banners = [];
    curGun = equippedGun(); bag = inv(); turrets = []; bombs = []; nades = []; planeT = 0;
    waves = []; wave = 0; queue = []; spawnT = 0; hs = 0; slow = 0; combo = 0; comboT = 0; kills = 0; bossRef = null; tutT = 0; firstTypes = {}; introT = 0; clearT = 0;
    mods = { maxHp: 0, melee: 1, rate: 1, mag: 1, vamp: 0, focus: 1, buddy: 0, luck: 1, crit: 0.05 };
    camX = clamp(hero.x - viewW(K) / 2, 0, Math.max(0, AW - viewW(K)));
    hero.ammo = baseMag(); story = null; theme = 'ruins'; cages = []; lantern = null; civs = []; curMut = []; zoomK = 1;
  }
  function startRun(K) { setupRun(K); nextWave(K); }

  /* ---------------- story flow ---------------- */
  function loadProg() {
    var p = K0.store.get('ink:story', null); if (!p || typeof p !== 'object') p = {};
    p.u = clamp(p.u | 0, 0, NLV - 1); p.nu = clamp(p.nu | 0, 0, NLV - 1);
    if (!p.s || typeof p.s !== 'object') p.s = {}; if (!p.n || typeof p.n !== 'object') p.n = {}; p.nm = !!p.nm; return p;
  }
  function saveProg() { K0.store.set('ink:story', prog); }
  function lvDef(idx) { var ci = Math.floor(idx / 8), li = idx % 8, m = /^([crsdb])(\d*)(?::(\w+))?$/.exec(CHAPTERS[ci].lv[li]); return { idx: idx, ci: ci, li: li, o: m[1], t: +m[2] || 0, m: m[3] || '' }; }
  function lvName(d) { return (d.ci + 1) + '-' + (d.li + 1); }
  function comboGoal(d) { return 10 + d.ci * 4 + (d.o === 'b' ? 5 : 0); }
  function unlockedMax(nm) { return nm ? prog.nu : prog.u; }
  function starsOf(idx, nm) { return (nm ? prog.n : prog.s)[idx] || 0; }
  function totalStars(nm) { var t = 0, o = nm ? prog.n : prog.s; for (var k in o) t += o[k] || 0; return t; }
  function bossNames(K, d) { var b = CHAPTERS[d.ci].boss; return L(K, ZT[b[0]].name); }
  function objText(K, d) { return d.o === 'c' ? K.t('oC') : d.o === 'r' ? K.t('oR') : d.o === 's' ? K.t('oS') + ' ' + d.t + 's' : d.o === 'd' ? K.t('oD') + ' · ' + d.t + 's' : K.t('oB') + ': ' + bossNames(K, d); }
  function modText(K, d) { return d.m ? K.t('m_' + d.m) : ''; }
  function storyEff(d, nm) { return 1 + d.ci * 3 + d.li * 0.45 + (nm ? 10 : 0); }
  function curEff() { return story ? story.eff : wave; }
  function pickType(eff) {
    var T = threat(eff), avail = TYPES.filter(function (t) { return ZT[t].wave <= eff + 0.5; });
    if (theme === 'desert' && Math.random() < 0.18) return 'gloop';
    return avail.length > 1 && Math.random() < T.special ? avail[1 + Math.floor(Math.random() * (avail.length - 1))] : 'shuffler';
  }
  function playLevel(K, idx) {
    var d = lvDef(idx), key = d.ci + ':' + d.li, first = !starsOf(idx, nmOn);
    theme = CHAPTERS[d.ci].theme;
    if (SCRIPT[key] && first && !nmOn) playCut(K, SCRIPT[key], function () { startLevel(K, idx); });
    else startLevel(K, idx);
  }
  function startLevel(K, idx) {
    var d = lvDef(idx), ch = CHAPTERS[d.ci];
    setupRun(K); theme = ch.theme; storyRetry = null;
    story = { d: d, nm: nmOn, eff: storyEff(d, nmOn), time: 0, timer: d.t, done: false, winT: 0, maxCombo: 0, dmg: 0, revived: false, bossSpawned: false, n: 0 };
    wave = Math.max(1, Math.round(story.eff)); mode = 'fight'; introT = 2.2; spawnT = 1.4;
    var swarm = d.m === 'swarm' ? 1.5 : 1;
    if (d.o === 'c') { var n = Math.round((13 + d.ci * 4 + d.li * 1.5) * swarm); for (var i = 0; i < n; i++) queue.push(pickType(story.eff)); var nw = TYPES.filter(function (t) { return Math.abs(ZT[t].wave - story.eff) < 0.7; })[0]; if (nw) queue.splice(2, 0, nw); }
    else if (d.o === 'b') { for (var j = 0; j < 6 + d.ci * 2; j++) queue.push(pickType(story.eff)); ch.boss.forEach(function (b, bi) { queue.splice(2 + bi * 2, 0, b); }); }
    else for (var q = 0; q < 4; q++) queue.push(pickType(story.eff));
    if (d.o === 'r') { var nc = d.ci >= 3 ? 4 : 3; var cx0 = [320, AW - 320, 860, AW - 860]; for (var c2 = 0; c2 < nc; c2++) cages.push({ x: cx0[c2], hp: 60 + d.ci * 15, maxHp: 60 + d.ci * 15, freed: false, col: ['#FF8A5B', '#4ADE80', '#FFD43B', '#3EE0FF'][c2], hitT: 0 }); }
    if (d.o === 'd') { lantern = { x: AW / 2 + 120, hp: 300 + d.ci * 80, maxHp: 300 + d.ci * 80, hitT: 0 }; hero.x = AW / 2 - 60; }
    camX = clamp(hero.x - viewW(K) / 2, 0, Math.max(0, AW - viewW(K)));
    if (d.m) banners.push({ t: 3.2, title: modText(K, d), sub: '', col: d.m === 'nogun' ? '#FF8A6A' : d.m === 'dark' ? '#9BE7FF' : '#FFD43B' });
    K.sfx(d.o === 'b' ? 'boss' : 'star');
    K.info(K.t('chapter') + ' ' + lvName(d) + (nmOn ? ' · ' + K.t('nightmare') : ''));
  }
  function bossAlive() { return zombies.some(function (z) { return z.d.boss && !z.dead; }) || queue.some(function (t) { return ZT[t].boss; }); }
  function dissolveAll() { zombies.forEach(function (z) { if (z.dead) return; goo(z.x, -60 * z.d.size, z.d.col, 10, 300); decals.push({ x: z.x, w: 40 * z.d.size, col: z.d.col, t: 6 }); z.dead = true; }); zombies = []; queue = []; spits = []; waves = []; }
  function storyWin(K) {
    if (!story || story.done) return;
    story.done = true; story.winT = 0; dissolveAll(); slow = 0.8; K.confetti(70); K.sfx('reward');
    banners = [{ t: 2, title: K.t('lvClear'), sub: '', col: '#FFE15A' }];
  }
  function storyFail(K, title) {
    if (!story) return endRun(K);
    storyRetry = story.d.idx; mode = 'fight';
    K.gameOver({ title: title || (K.t('failed') + ' · ' + lvName(story.d)) });
  }
  function finishLevel(K) {
    var s = story, d = s.d, nm = s.nm, prev = starsOf(d.idx, nm);
    var st = [true, s.dmg <= hero.maxHp * 0.5 && !s.revived, s.maxCombo >= comboGoal(d)], stars = st.filter(Boolean).length;
    var coins = Math.round((12 + d.ci * 6 + d.li * 2 + (d.o === 'b' ? 40 : 0) + stars * 5) * (prev ? 1 : 2) * (nm ? 1.5 : 1));
    (nm ? prog.n : prog.s)[d.idx] = Math.max(prev, stars);
    if (nm) prog.nu = Math.max(prog.nu, Math.min(NLV - 1, d.idx + 1)); else prog.u = Math.max(prog.u, Math.min(NLV - 1, d.idx + 1));
    var unlock = null, ending = false;
    if (!nm && d.li === 7 && !prev) {
      var u = CHAPTERS[d.ci].unlock, own = owned();
      if (u && own.indexOf(u) < 0) { own.push(u); K.store.set('ink:heroes', own); unlock = u; }
      if (d.idx === NLV - 1) { prog.nm = true; ending = true; coins += 1000; }
    }
    saveProg(); K.addCoins(coins); K.tutorialDone(); K.addScore(200 + 50 * d.idx);
    winInfo = { d: d, nm: nm, st: st, stars: stars, coins: coins, first: !prev, unlock: unlock, ending: ending, t: 0 };
    var key = d.ci + ':end';
    if (d.li === 7 && !prev && SCRIPT[key] && !nm) playCut(K, SCRIPT[key], function () { mode = 'win'; });
    else mode = 'win';
  }
  function nextLevel(K) {
    var d = winInfo.d, nm = winInfo.nm;
    if (d.idx + 1 >= NLV) { goMap(K, d.idx); return; }
    nmOn = nm; mapCh = Math.floor((d.idx + 1) / 8); mapSel = (d.idx + 1) % 8; playLevel(K, d.idx + 1);
  }
  function goMap(K, idx) {
    mode = 'map'; story = null; zombies = []; queue = []; cages = []; lantern = null; civs = []; bossRef = null; banners = []; introT = 0;
    if (idx === undefined || idx === null) idx = Math.min(unlockedMax(nmOn), NLV - 1);
    mapCh = Math.floor(idx / 8); mapSel = idx % 8; theme = CHAPTERS[mapCh].theme; K.sfx('click'); K.info(K.t('storyTitle'));
  }
  function playCut(K, lines, then) { cut = { lines: lines, i: 0, t: 0, then: then }; mode = 'cut'; held = {}; keys = {}; K.sfx('flip'); }
  function cutText(K, ln) { return ln[K.lang === 'fr' ? 2 : K.lang === 'ar' ? 3 : 1]; }
  function cutAdvance(K) {
    if (!cut) return;
    var full = cutText(K, cut.lines[cut.i]).length;
    if (cut.t < full) { cut.t = full; return; }
    cut.i++; cut.t = 0; K.sfx('tick');
    if (cut.i >= cut.lines.length) { var f = cut.then; cut = null; f(); }
  }
  function cutSkip(K) { if (!cut) return; var f = cut.then; cut = null; K.sfx('click'); f(); }
  function hitCage(K, cg, dmg) {
    if (cg.freed) return false;
    cg.hp -= dmg; cg.hitT = 0.12; sparks(cg.x, -70, 5, '#DDE6F0'); K.sfx('block');
    if (cg.hp <= 0) {
      cg.freed = true; K.sfx('reward'); K.shake(5); ftext(cg.x, -170, K.t('freed'), '#4ADE80', 26);
      civs.push({ x: cg.x, y: 0, dir: cg.x < AW / 2 ? -1 : 1, t: 0, col: cg.col, pose: pose('idle', 0) });
      for (var i = 0; i < 4; i++) pickups.push({ k: 'coin', x: cg.x, y: -60, vx: rnd(-200, 200), vy: rnd(-600, -300), t: 0 });
      if (Math.random() < 0.5) pickups.push({ k: 'heart', x: cg.x, y: -60, vx: rnd(-80, 80), vy: -500, t: 0 });
    }
    return true;
  }
  function hurtLantern(K, dmg) {
    if (!lantern || lantern.hp <= 0) return;
    if (K.test && window.__inkGod) return;
    lantern.hp -= dmg; lantern.hitT = 0.15; sparks(lantern.x, -120, 4, '#FFE58A');
    if (lantern.hp <= 0) { lantern.hp = 0; K.sfx('over'); explode(K, lantern.x, -100, 60, 0, null); storyFail(K, K.t('lanternOut')); }
  }
  function storyUpdate(K, dt) {
    var s = story, d = s.d;
    civs.forEach(function (v) { v.t += dt; v.x += v.dir * 260 * dt; v.pose = pose('run', v.t * 12); }); civs = civs.filter(function (v) { return v.x > -100 && v.x < AW + 100; });
    cages.forEach(function (cg) { cg.hitT = Math.max(0, cg.hitT - dt); }); if (lantern) lantern.hitT = Math.max(0, lantern.hitT - dt);
    if (s.done) { s.winT += dt; if (s.winT > 1.7 && mode === 'fight') finishLevel(K); return; }
    s.time += dt; if (combo > s.maxCombo) s.maxCombo = combo;
    var cont = d.o === 'r' || d.o === 's' || d.o === 'd' || (d.o === 'b' && s.bossSpawned && bossAlive() && zombies.length < 3 + d.ci);
    if (cont && queue.length < 2 && introT <= 0.6) queue.push(pickType(s.eff));
    if (d.o === 's' || d.o === 'd') { s.timer -= dt; if (s.timer <= 0) { s.timer = 0; storyWin(K); return; } }
    if (d.o === 'r' && cages.length && cages.every(function (c) { return c.freed; })) { storyWin(K); return; }
    if (d.o === 'c' && !queue.length && !zombies.length && introT <= 0) { storyWin(K); return; }
    if (d.o === 'b' && s.bossSpawned && !bossAlive()) storyWin(K);
  }
  function nextWave(K) {
    wave++; mode = 'fight'; introT = 1.6; K.sfx(wave % 5 === 0 ? 'boss' : 'star');
    var n = wave, T = threat(n), avail = TYPES.filter(function (t) { return ZT[t].wave <= n; });
    curMut = []; var pool = Object.keys(MUTS).sort(function () { return Math.random() - 0.5; });
    for (var mi = 0; mi < T.muts; mi++) curMut.push(pool[mi]);
    var has = function (m) { return curMut.indexOf(m) >= 0; };
    var count = Math.round(T.count * (has('horde') ? 1.5 : 1));
    queue = [];
    for (var i = 0; i < count; i++) {
      var t = 'shuffler', r = Math.random();
      if (has('spitters') && r < 0.35) t = 'gloop';
      else if (has('boom') && r < 0.35) t = 'popper';
      else if (avail.length > 1 && Math.random() < T.special) t = avail[1 + Math.floor(Math.random() * (avail.length - 1))];
      queue.push(t);
    }
    // the newest type always shows up early so its intro appears
    var newest = TYPES.filter(function (t) { return ZT[t].wave === n; })[0]; if (newest) queue.splice(2, 0, newest);
    for (var bi = 0; bi < T.bosses; bi++) queue.splice(Math.floor(queue.length * (bi + 1) / (T.bosses + 2)), 0, 'gravemaw');
    if (curMut.length) banners.push({ t: 3.4, title: curMut.map(function (m) { return (MUTS[m][K.lang] || MUTS[m].en)[0]; }).join(' + '), sub: curMut.map(function (m) { return (MUTS[m][K.lang] || MUTS[m].en)[1]; }).join(' · '), col: '#FF8A6A' });
    spawnT = 1.2;
    for (var b = 0; b < mods.buddy; b++) if (!allies[b] || allies[b].dead) allies[b] = newAlly(K, b);
    K.info('\u221E ' + K.t('wave') + ' ' + wave);
  }
  function newAlly(K, i) { return { x: hero.x - 60 - i * 40, y: 0, vx: 0, vy: 0, face: 1, hp: 90 + wave * 10, maxHp: 90 + wave * 10, pose: pose('idle', 0), animT: 0, atkT: 0, cd: 0, col: ['#22C55E', '#F59E0B'][i % 2], dead: false }; }
  function spawnZombie(K, t) {
    var d = ZT[t], T = threat(curEff()), vw = viewW(K), side = Math.random() < 0.5 ? -1 : 1, x;
    if (t === 'biter' && Math.random() < 0.6) x = clamp(hero.x + side * rnd(220, 380), 40, AW - 40);
    else {
      var lx = camX - 70, rx = camX + vw + 70;
      if (lx < 30) side = 1; else if (rx > AW - 30) side = -1;
      x = clamp(side < 0 ? lx : rx, 30, AW - 30);
      if (Math.abs(x - hero.x) < 260) x = clamp(hero.x - side * 420, 30, AW - 30);
    }
    var tough = curMut.indexOf('tough') >= 0 ? 1.4 : 1, fast = curMut.indexOf('fast') >= 0 ? 1.25 : 1;
    var elite = !d.boss && !d.clone && Math.random() < T.elite + (curMut.indexOf('redmoon') >= 0 ? 0.25 : 0) + (story && story.d.m === 'elite' ? 0.3 : 0);
    var hp = Math.round(d.hp * (d.boss ? 0.6 + 0.4 * T.hp : T.hp) * tough * (elite ? 2.5 : 1));
    var z = { elite: elite, t: t, d: d, x: x, y: 0, vx: 0, vy: 0, face: x < hero.x ? 1 : -1, hp: hp, maxHp: hp, pose: pose('zwalk', 0), animT: rnd(0, 6), atkT: 0, atkHit: false, cd: rnd(0.3, 1.2),
      stun: 0, rise: t === 'biter' ? 0.6 : 0, fuse: 0, shield: d.shield || 0, dmgM: T.dmg * (elite ? 1.5 : 1), spd: d.spd * rnd(0.9, 1.12) * Math.min(1.75, T.spd * fast * (elite ? 1.2 : 1)) * (d.boss ? 1 : 1), bossT: 2, bossAct: null, dz: d.boss ? 0 : rnd(-26, 22) };
    if (elite && !firstTypes.elite) { firstTypes.elite = true; banners.push({ t: 3.2, title: K.t('eliteT'), sub: K.t('eliteS'), col: '#FFD43B' }); }
    zombies.push(z);
    if (!firstTypes[t]) { firstTypes[t] = true; banners.push({ t: 3.2, title: (d.boss ? '' : K.t('newZ') + ' ') + L(K, d.name), sub: L(K, d.tip), col: d.col }); if (d.boss) { K.shake(10); bossRef = z; } }
    if (d.boss) { bossRef = z; K.sfx('boss'); if (story) story.bossSpawned = true; }
    if (Math.random() < 0.3) K.sfx('groan');
  }

  /* ---------------- combat ---------------- */
  function meleeSpec() {
    var h = hero.def, m = h.melee;
    if (hero.melee) { var w = WEAPONS[hero.melee.id]; return { kind: hero.melee.id, dmg: m.dmg.map(function (v) { return Math.max(v, 13) * w.mult; }), range: m.range.map(function (r) { return r + w.range; }), time: m.time.map(function (t) { return t + 0.03; }) }; }
    return m;
  }
  function gunSpec() {
    var g = hero.gun2 ? GUNS[hero.gun2.id] : gunDef(curGun);
    return { mag: g.mag, dmg: g.dmg, rate: g.rate / mods.rate, pel: g.pel, spread: g.spread, reload: (g.reload || 1) / Math.sqrt(mods.rate), pierce: g.pierce, laser: g.laser, rocket: g.rocket,
      frost: g.frost, tesla: g.tesla, spd: g.spd || 1700, life: g.life || 0.7, col: g.col || '#FFE58A', look: g.look };
  }
  function baseMag() { return Math.round(gunDef(curGun).mag * mods.mag); }
  function itemScale() { return 0.6 + 0.4 * threat(Math.max(1, curEff())).hp; }
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
    if (z.dead || z.rise > 0.2 || z.hidden) return false;
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
    K.addScore(Math.round(z.d.score * mult * (z.elite ? 3 : 1) * (1 + (wave - 1) * 0.05)));
    var J = rig(z.pose, z.x, z.y, z.face, z.d.size, z.y >= -1, z.t === 'biter');
    ragdoll(J, z.d.col, dir || -z.face, z.d.size, 10 * z.d.size);
    goo(z.x, -50, z.d.col, 16, 520); decals.push({ x: z.x, w: rnd(30, 60) * z.d.size, col: z.d.col, t: 8 });
    if (z.d.explode) explode(K, z.x, -50 * z.d.size, 140, 60, z);
    if (mods.vamp) hero.hp = Math.min(hero.maxHp, hero.hp + mods.vamp);
    // drops
    var r = Math.random(), coinN = z.d.boss ? 25 : z.d.heavy ? 5 : (r < 0.55 ? (Math.random() < 0.3 ? 2 : 1) : 0); if (z.elite) coinN += 4;
    for (var i = 0; i < coinN; i++) pickups.push({ k: 'coin', x: z.x, y: -40, vx: rnd(-220, 220), vy: rnd(-600, -300), t: 0 });
    if (Math.random() < 0.07) pickups.push({ k: 'heart', x: z.x, y: -40, vx: rnd(-100, 100), vy: -500, t: 0 });
    if (Math.random() < 0.05) pickups.push({ k: 'ink', x: z.x, y: -40, vx: rnd(-100, 100), vy: -500, t: 0 });
    if (Math.random() < (z.d.boss ? 1 : z.d.heavy ? 0.5 : 0.06)) pickups.push({ k: 'crate', x: z.x, y: -60, vx: rnd(-80, 80), vy: -520, t: 0, id: Math.random() < 0.4 ? (Math.random() < 0.5 ? 'katana' : 'axe') : 'gun:' + GUN_ORDER[1 + Math.floor(Math.random() * (GUN_ORDER.length - 1))] });
    if (Math.random() < 0.02 && !hero.rage) pickups.push({ k: 'rage', x: z.x, y: -40, vx: 0, vy: -500, t: 0 });
    if (z.d.boss) {
      bossRef = zombies.filter(function (o) { return o.d.boss && !o.dead; })[0] || null; slow = 1.2; K.confetti(80); K.shake(16); K.sfx('reward'); zoomK = 1.12;
      if (z.t === 'hollow' && bossRef && bossRef.t === 'hollow' && !bossRef.enraged) { bossRef.enraged = true; bossRef.spd *= 1.35; bossRef.dmgM *= 1.3; banners.push({ t: 2.4, title: K.t('twinRage'), sub: '', col: '#FF4FD8' }); K.sfx('boss'); }
    }
    else { hs = Math.max(hs, 0.045); K.sfx('punch'); }
    if (combo > 0 && combo % 25 === 0) { banners.push({ t: 1.6, title: combo + ' ' + K.t('combo') + '!', sub: '', col: '#FFE15A' }); K.sfx('combo'); }
  }
  function chain(K, from, dmg) {
    var cur = from, hitList = [from];
    for (var j = 0; j < 3; j++) {
      var nx = null, nd = 260; zombies.forEach(function (o) { if (o.dead || hitList.indexOf(o) >= 0) return; var d = Math.abs(o.x - cur.x); if (d < nd) { nd = d; nx = o; } });
      if (!nx) break; hitList.push(nx);
      P({ k: 'bolt', x: cur.x, y: -80 * cur.d.size, x2: nx.x, y2: -80 * nx.d.size, vx: 0, vy: 0, g: 0, max: 0.18, col: '#C08BFF', size: 3 });
      hitZombie(K, nx, dmg, nx.x > cur.x ? 1 : -1, 60, 0, 'gun'); cur = nx;
    }
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
    if (hero.shield > 0) { sparks(hero.x, -80, 6, '#3EE0FF'); K.sfx('block'); return; }
    if (hero.specialT > 0 && (hero.specialKind === 'overdrive' || hero.specialKind === 'bladedash')) return;
    hero.hp -= Math.round(dmg); if (story) story.dmg += Math.round(dmg); hero.inv = 0.7; hero.hurtT = 0.28; hero.vx = dir * 340; hero.vy = -260; hero.ground = false;
    hero.atkT = 0; hero.dive = false; combo = 0;
    K.sfx('hit'); K.shake(7); K.flash('#FF3B4E', 0.22); K.haptic(40);
    goo(hero.x, -70, '#111111', 6, 260);
    if (hero.hp <= 0) {
      hero.hp = 0;
      var J = rig(hero.pose, hero.x, hero.y, hero.face, hero.def.size, hero.ground, false);
      ragdoll(J, '#111111', dir, 1, hero.def.lw); hero.dead = true;
      if (bag.heart > 0) { mode = 'down'; downT = 6; held = {}; keys = {}; K.sfx('over'); return; }
      endRun(K);
    }
  }
  function endRun(K) {
    if (story) { storyFail(K); return; }
    mode = 'fight';
    if (wave > bestWave) { bestWave = wave; K.store.set('ink:bestWave', wave); }
    K.gameOver({ title: K.t('reached') + ' ' + wave + (wave >= bestWave ? ' · ' + K.t('record') : '') });
  }
  function reviveHero(K) {
    if (!hero || (!wave && !story)) { startRun(K); return; }
    if (story) { story.revived = true; if (lantern && lantern.hp <= 0) lantern.hp = Math.round(lantern.maxHp * 0.5); }
    hero.dead = false; hero.hp = hero.maxHp; hero.inv = 2.6; hero.y = 0; hero.vy = 0; hero.ground = true; hero.atkT = 0; hero.specialT = 0; hero.specialKind = null; spits = []; waves = [];
    K.sfx('boom'); K.sfx('reward'); ring(hero.x, -60, 380, '#FFFFFF'); ring(hero.x, -60, 220, '#FF3B6B');
    zombies.forEach(function (z) { var d = Math.abs(z.x - hero.x); if (d < 420) hitZombie(K, z, 60 * itemScale(), z.x < hero.x ? -1 : 1, 700, 500, 'boom'); });
    mode = 'fight';
  }
  function useHeart(K) { if (mode !== 'down' || !(bag.heart > 0)) return; bag.heart--; saveInv(bag); reviveHero(K); banners.push({ t: 1.6, title: K.t('revived'), sub: '', col: '#FF3B6B' }); }
  function useItem(K, id) {
    if (mode !== 'fight' || hero.hp <= 0) return;
    if (!(bag[id] > 0)) { K.sfx('wrong'); return; }
    if (id === 'heart') { banners.push({ t: 1.4, title: K.t('heartSaved'), sub: '', col: '#FF3B6B' }); K.sfx('tick'); return; }
    if (id === 'medkit' && hero.hp >= hero.maxHp) { K.sfx('wrong'); ftext(hero.x, -150, K.t('fullHp'), '#FFFFFF', 18); return; }
    bag[id]--; saveInv(bag);
    var m = itemScale(), vw = viewW(K);
    if (id === 'medkit') { var heal = Math.round(hero.maxHp * 0.6); hero.hp = Math.min(hero.maxHp, hero.hp + heal); ftext(hero.x, -150, '+' + heal, '#4ADE80', 26); ring(hero.x, -60, 120, '#4ADE80'); K.sfx('reward'); }
    else if (id === 'grenade') { nades.push({ x: hero.x + hero.face * 20, y: -90, vx: hero.face * 560, vy: -640, t: 0, ang: 0 }); K.sfx('whoosh'); }
    else if (id === 'freeze') { zombies.forEach(function (z) { if (!z.dead) { z.ice = z.d.boss ? 1.6 : 4; z.atkT = 0; } }); K.flash('#9BE7FF', 0.45); K.sfx('star'); ring(hero.x, -60, 500, '#9BE7FF'); }
    else if (id === 'shield') { hero.shield = 8; K.sfx('flip'); }
    else if (id === 'serum') { hero.rage = 10; banners.push({ t: 1.4, title: K.t('rage'), sub: '', col: '#FF3B4E' }); K.sfx('combo'); }
    else if (id === 'turret') { turrets.push({ x: clamp(hero.x + hero.face * 50, 30, AW - 30), t: 15, cd: 0.4, ang: 0, face: hero.face }); K.sfx('reload'); }
    else if (id === 'airstrike') { for (var i = 0; i < 8; i++) bombs.push({ x: camX + vw * (0.06 + i * 0.125) + rnd(-20, 20), y: -760 - i * 80, vy: 600 }); planeT = 1.8; banners.push({ t: 1.4, title: K.t('airstrike'), sub: '', col: '#FF8A1F' }); K.sfx('whoosh'); }
    void m;
  }
  function updateItems(K, dt) {
    hero.shield = Math.max(0, (hero.shield || 0) - dt); planeT = Math.max(0, planeT - dt);
    nades.forEach(function (n) { n.t += dt; n.vy += G * dt; n.x += n.vx * dt; n.y += n.vy * dt; n.ang += dt * 12 * Math.sign(n.vx || 1); if (n.y >= -8) { n.y = -8; n.vy *= -0.35; n.vx *= 0.6; } if (n.t >= 1.1) { n.done = true; explode(K, n.x, -30, 170, 95 * itemScale(), null); } });
    nades = nades.filter(function (n) { return !n.done; });
    bombs.forEach(function (b) { b.vy += 1400 * dt; b.y += b.vy * dt; if (b.y >= -10) { b.done = true; explode(K, b.x, -20, 140, 110 * itemScale(), null); } });
    bombs = bombs.filter(function (b) { return !b.done; });
    turrets.forEach(function (t) {
      t.t -= dt; t.cd -= dt; var tg = nearestZombie(t.x, 650);
      if (tg) { t.face = tg.x > t.x ? 1 : -1; if (t.cd <= 0) { t.cd = 0.16; bullets.push({ x: t.x + t.face * 30, y: -46, vx: t.face * 1800, vy: rnd(-40, 40), dmg: 10 * itemScale(), life: 0.45, hit: [], col: '#FFB020' }); K.synth.noise(0.03, 0.1, 4500); P({ k: 'flash', x: t.x + t.face * 34, y: -46, vx: 0, vy: 0, g: 0, max: 0.05, col: '#FFE58A', size: 9 }); } }
    });
    turrets = turrets.filter(function (t) { return t.t > 0; });
  }
  function fire(K) {
    if (hero.shootCd > 0 || hero.reloadT > 0 || hero.specialT > 0 || mode !== 'fight' || hero.hp <= 0) return;
    if (story && story.d.m === 'nogun') { if (!hero.noGunT) { ftext(hero.x, -160, K0.t('noGun'), '#FF8A6A', 20); K.sfx('wrong'); hero.noGunT = 1; } return; }
    var g = gunSpec();
    if (hero.gun2) { if (hero.gun2.ammo <= 0) { hero.gun2 = null; return; } hero.gun2.ammo--; }
    else { if (hero.ammo <= 0) { reload(K); return; } hero.ammo--; }
    hero.shootCd = g.rate; hero.shootPose = 0.18;
    var hx = hero.x + hero.face * 52 * hero.def.size, hy = -80 * hero.def.size + (hero.y);
    for (var i = 0; i < g.pel; i++) {
      var a = rnd(-g.spread, g.spread);
      bullets.push({ x: hx, y: hy, vx: hero.face * g.spd * Math.cos(a), vy: g.spd * Math.sin(a), dmg: g.dmg, pierce: g.pierce, laser: g.laser, rocket: g.rocket, frost: g.frost, tesla: g.tesla, col: g.col, life: g.life, hit: [] });
    }
    P({ k: 'flash', x: hx + hero.face * 8, y: hy, vx: 0, vy: 0, g: 0, max: 0.06, col: g.col, size: g.rocket ? 22 : g.look === 'sniper' ? 20 : 14 });
    if (!g.laser && !g.rocket && !g.tesla && !g.frost) P({ k: 'casing', x: hero.x + hero.face * 30, y: hy, vx: -hero.face * rnd(80, 180), vy: rnd(-380, -220), g: G, max: 0.8, col: '#FFC93C', size: 3, ang: 0, va: 20 });
    hero.vx -= hero.face * (g.rocket ? 160 : g.look === 'sniper' ? 140 : g.pel > 1 ? 90 : 8);
    gunSfx(K, g); if (g.look === 'sniper' || g.rocket) K.shake(3);
    if (hero.gun2 && hero.gun2.ammo <= 0) { hero.gun2 = null; ftext(hero.x, -150, K.t('empty'), '#FFFFFF', 18); }
    else if (!hero.gun2 && hero.ammo <= 0) reload(K);
  }
  function reload(K) { if (hero.gun2 || hero.reloadT > 0 || hero.ammo >= baseMag()) return; hero.reloadT = gunSpec().reload; K.sfx('reload'); }
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
    h.rage = Math.max(0, h.rage - dt); h.noGunT = Math.max(0, (h.noGunT || 0) - dt); h.shootPose = Math.max(0, (h.shootPose || 0) - dt);
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
        cages.forEach(function (cg) { var dx = (cg.x - h.x) * h.face; if (dx > -20 && dx < range + 40 && hitCage(K, cg, m.dmg[h.step] * mods.melee)) any = true; });
        if (any && fin) zoomK = Math.max(zoomK, 1.045);
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
          h.quakeArmed = false; h.specialKind = null; K.shake(18); zoomK = Math.max(zoomK, 1.06); K.sfx('boom'); ring(h.x, 0, 340, def.acc); ring(h.x, 0, 200, '#FFFFFF');
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
      var hdx = hero.x - z.x, dx = hdx;
      z.tgtL = !!(lantern && lantern.hp > 0 && !d.boss && !d.ranged && !d.ai && Math.abs(lantern.x - z.x) < Math.abs(hdx) + 160);
      if (z.tgtL) dx = lantern.x - z.x;
      var ad = Math.abs(dx);
      if (z.frozen > 0) z.frozen -= dt;
      if (z.ice > 0) { z.ice -= dt; z.vx *= 0.5; }
      else if (z.stun > 0) { z.stun -= dt; }
      else if (z.atkT > 0) {
        z.atkT -= dt;
        if (!z.atkHit && z.atkT < (d.boss ? 0.2 : 0.14)) {
          z.atkHit = true;
          if (d.ranged) { var t2 = 0.9, gS = G * 0.55, y0 = -95; spits.push({ x: z.x + z.face * 20, y: y0, vx: (hero.x - z.x) / t2, vy: (-50 - y0 - 0.5 * gS * t2 * t2) / t2, dmg: d.dmg * z.dmgM, life: 2 }); K.sfx('pop'); }
          else if (z.tgtL) { if (ad < d.range + 40) hurtLantern(K, d.dmg * z.dmgM); }
          else if (ad < d.range + 24 && hero.y > -100 * d.size) hurtHero(K, d.dmg * z.dmgM, dx > 0 ? 1 : -1);
          if (d.boss) { K.shake(8); K.sfx('heavy'); }
        }
        if (z.atkT <= 0) { z.cd = d.ranged ? rnd(1.8, 2.6) : (d.boss ? 1.0 : rnd(0.7, 1.1)); }
      } else if (d.ai === 'null') nullAI(K, z, dt, hdx);
      else if (d.boss) bossAI(K, z, dt, hdx);
      else if (d.explode && z.fuse > 0) { z.fuse -= dt; z.vx *= 0.9; if (z.fuse <= 0) { z.hp = 0; killZombie(K, z, 0); continue; } }
      else {
        z.face = dx > 0 ? 1 : -1; z.cd -= dt;
        var want = 0;
        if (d.ranged) { if (ad > 380) want = z.face; else if (ad < 220) want = -z.face; if (ad < 420 && z.cd <= 0) { z.atkT = 0.6; z.atkHit = false; } }
        else if (ad < d.range) { if (d.explode) { z.fuse = 0.75; K.sfx('tick'); } else if (z.cd <= 0) { z.atkT = d.heavy ? 0.7 : 0.45; z.atkHit = false; } }
        else want = z.face;
        z.vx += (want * z.spd * (z.frozen > 0 ? 0.4 : 1) - z.vx) * Math.min(1, dt * 6);
      }
      z.vy += G * dt; z.x += z.vx * dt; z.y += z.vy * dt;
      if (z.y >= 0) { if (z.vy > 400) { ring(z.x, 0, 30 * d.size, '#FFFFFF'); } z.y = 0; z.vy = 0; }
      if (z.stun > 0) z.vx *= Math.pow(0.05, dt);
      z.x = clamp(z.x, 20, AW - 20);
      // separation
      for (var j = i + 1; j < zombies.length; j++) { var o = zombies[j]; if (o.dead) continue; var sep = 22 * (d.size + o.d.size) / 2, ddx = o.x - z.x; if (Math.abs(ddx) < sep && Math.abs(o.y - z.y) < 60) { var push = (sep - Math.abs(ddx)) * 0.5 * (ddx >= 0 ? 1 : -1); if (!d.boss) z.x -= push * 0.5; if (!o.d.boss) o.x += push * 0.5; } }
      // pose
      var tp;
      if (d.ai === 'null') tp = z.stun > 0.04 ? pose('hurt') : (z.npose || pose('idle', K.time));
      else if (z.stun > 0) tp = pose('zhurt');
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
  function whistle(K) { K.synth.tone(880, 880, 0.22, 'square', 0.06); K.synth.tone(660, 660, 0.3, 'square', 0.05, 0.22); }
  function bossAI(K, z, dt, dx) {
    var ad = Math.abs(dx), ai = z.d.ai; z.bossT -= dt;
    if (z.bossAct === 'charge') {
      z.chargeT -= dt; var wind = ai === 'conductor' ? 0.6 : 0.9;
      if (z.chargeT > wind) { z.vx *= 0.8; if (Math.random() < 0.3) P({ k: 'smoke', x: z.x - z.face * 30, y: -10, vx: -z.face * 100, vy: -60, g: 0, max: 0.4, col: ai === 'conductor' ? '#9FE8E0' : '#C9A27A', size: 14 }); return; }
      z.vx = z.face * (ai === 'conductor' ? 920 : ai === 'hollow' ? 660 : 720); if (Math.abs(hero.x - z.x) < 70 && hero.y > -150) hurtHero(K, 34 * z.dmgM, z.face);
      if (z.chargeT <= 0 || z.x <= 30 || z.x >= AW - 30) {
        z.bossAct = null; z.bossT = 1.4; z.vx = 0; K.shake(6);
        if (ai === 'conductor' && zombies.length < 14) { for (var q = 0; q < 2; q++) spawnZombie(K, 'dasher'); if (!z.called) { z.called = true; banners.push({ t: 1.8, title: K.t('allAboard'), sub: '', col: '#2FD8C8' }); } }
      }
      return;
    }
    if (ai === 'mother') { // keeps her distance and lobs goo volleys, calls her Gloops
      z.face = dx > 0 ? 1 : -1;
      if (z.bossAct === 'pound') { if (z.y >= 0 && z.vy === 0 && z.airborne) { z.airborne = false; z.bossAct = null; z.bossT = 1.6; K.shake(16); K.sfx('boom'); waves.push({ x: z.x, dir: -1, life: 1.1 }, { x: z.x, dir: 1, life: 1.1 }); ring(z.x, 0, 140, '#F4EC7A'); } return; }
      if (z.bossT <= 0) {
        var r2 = Math.random();
        if (ad < z.d.range && r2 < 0.5) { z.atkT = 0.9; z.atkHit = false; }
        else if (r2 < 0.62) { var nv = 4 + (z.hp < z.maxHp * 0.5 ? 2 : 0); for (var v = 0; v < nv; v++) { var t2 = 0.75 + v * 0.12, gS = G * 0.55, y0 = -190, tx = hero.x + (v - nv / 2) * 70; spits.push({ x: z.x + z.face * 40, y: y0, vx: (tx - z.x) / t2, vy: (-40 - y0 - 0.5 * gS * t2 * t2) / t2, dmg: z.d.dmg * z.dmgM * 0.55, life: 2.4 }); } K.sfx('pop'); K.synth.noise(0.3, 0.3, 700); }
        else if (r2 < 0.82 && zombies.length < 14) { for (var g2 = 0; g2 < 2; g2++) spawnZombie(K, 'gloop'); K.sfx('groan'); }
        else { z.bossAct = 'pound'; z.vy = -1000; z.airborne = true; z.vx = clamp(dx, -350, 350); }
        z.bossT = z.hp < z.maxHp * 0.5 ? 1.7 : 2.3; return;
      }
      var want = ad > 560 ? z.face : ad < 260 ? -z.face * 0.6 : 0; z.vx += (want * z.spd - z.vx) * Math.min(1, dt * 4); return;
    }
    if (z.bossAct === 'pound') { if (z.y >= 0 && z.vy === 0 && z.airborne) { z.airborne = false; z.bossAct = null; z.bossT = 1.6; K.shake(16); K.sfx('boom'); waves.push({ x: z.x, dir: -1, life: 1.1 }, { x: z.x, dir: 1, life: 1.1 }); ring(z.x, 0, 120, '#FFFFFF'); } return; }
    z.face = dx > 0 ? 1 : -1;
    if (z.bossT <= 0) {
      var r = Math.random(), cP = ai === 'conductor' ? 0.82 : ai === 'hollow' ? 0.58 : 0.7;
      if (ad < z.d.range && r < 0.45) { z.atkT = 0.9; z.atkHit = false; }
      else if (r < cP) { z.bossAct = 'charge'; z.chargeT = ai === 'conductor' ? 1.5 : 1.9; if (ai === 'conductor') whistle(K); else K.sfx('boss'); }
      else { z.bossAct = 'pound'; z.vy = -1150; z.airborne = true; z.vx = clamp(dx, -400, 400); }
      z.bossT = z.enraged ? 1.5 : 2.2; return;
    }
    z.vx += (z.face * z.spd - z.vx) * Math.min(1, dt * 4);
  }
  // NULL: a dark mirror of the hero — combos, dashes, teleports, and clones in phase 2
  function nullAI(K, z, dt, dx) {
    var d = z.d, ad = Math.abs(dx), sp = z.spd * (z.phase2 ? 1.25 : 1);
    z.st = z.st || 'walk'; z.stT = (z.stT === undefined ? 0.8 : z.stT) - dt;
    if (!d.clone && !z.phase2 && z.hp < z.maxHp * 0.5) {
      z.phase2 = true; z.st = 'tele'; z.stT = 0.45; z.hidden = true; zoomK = 1.08; K.flash('#FFFFFF', 0.4); K.shake(12); K.sfx('boss');
      banners.push({ t: 2.6, title: K.t('phase2'), sub: K.t('phase2s'), col: '#FF3B4E' });
      for (var c = 0; c < 2; c++) { spawnZombie(K, 'nclone'); var cl = zombies[zombies.length - 1]; cl.x = clamp(hero.x + (c ? 300 : -300), 40, AW - 40); glitch(cl.x); }
    }
    if (z.st === 'walk') {
      z.face = dx > 0 ? 1 : -1;
      z.vx += ((ad > d.range * 0.8 ? z.face * sp : 0) - z.vx) * Math.min(1, dt * 8);
      z.npose = Math.abs(z.vx) > 40 ? pose('run', z.animT * 3) : pose('idle', K.time * 2);
      if (z.stT <= 0) {
        var r = Math.random();
        if (ad < d.range + 40 && r < 0.5) { z.st = 'combo'; z.step = 0; z.stT = 0.26; z.hitDone = false; }
        else if (r < 0.75 || d.clone) { z.st = 'wind'; z.stT = d.clone ? 0.5 : 0.35; K.sfx('whoosh'); }
        else { z.st = 'tele'; z.stT = 0.38; z.hidden = true; glitch(z.x); K.synth.tone(1200, 200, 0.2, 'sawtooth', 0.06); }
      }
    } else if (z.st === 'combo') {
      z.vx *= 0.85; z.npose = pose(['jab', 'cross', 'kick'][z.step]);
      if (!z.hitDone && z.stT < 0.14) { z.hitDone = true; K.sfx('whoosh'); if (ad < d.range + 26 && hero.y > -110) hurtHero(K, d.dmg * z.dmgM * (z.step === 2 ? 1.6 : 1), z.face); }
      if (z.stT <= 0) { z.step++; z.hitDone = false; z.stT = 0.26; if (z.step > 2) { z.st = 'walk'; z.stT = z.phase2 ? 0.45 : 0.75; } }
    } else if (z.st === 'wind') {
      z.vx *= 0.8; z.face = dx > 0 ? 1 : -1; z.npose = pose('jump');
      if (z.stT <= 0) { z.st = 'dash'; z.stT = 0.36; z.dashHit = false; }
    } else if (z.st === 'dash') {
      z.vx = z.face * 1150; z.npose = pose('dive');
      if (Math.random() < 0.6) P({ k: 'smoke', x: z.x, y: -70, vx: 0, vy: 0, g: 0, max: 0.25, col: Math.random() < 0.5 ? '#111111' : '#FF3B4E', size: 12 });
      if (!z.dashHit && Math.abs(hero.x - z.x) < 52 && hero.y > -120) { z.dashHit = true; hurtHero(K, d.dmg * z.dmgM * 1.6, z.face); }
      if (z.stT <= 0 || z.x <= 30 || z.x >= AW - 30) { z.st = 'walk'; z.stT = z.phase2 ? 0.5 : 0.85; z.vx = 0; }
    } else if (z.st === 'tele') {
      z.vx = 0;
      if (z.stT <= 0) { z.hidden = false; z.x = clamp(hero.x - hero.face * 110, 40, AW - 40); z.face = hero.x > z.x ? 1 : -1; glitch(z.x); z.st = 'combo'; z.step = 0; z.stT = 0.3; z.hitDone = false; K.synth.tone(200, 1400, 0.15, 'sawtooth', 0.06); }
    }
  }
  function glitch(x) { for (var i = 0; i < 18; i++) P({ k: 'spark', x: x + rnd(-30, 30), y: rnd(-150, -10), vx: rnd(-400, 400), vy: rnd(-200, 200), g: 0, max: rnd(0.15, 0.4), col: ['#FFFFFF', '#111111', '#FF3B4E', '#3EE0FF'][i % 4], size: 3 }); }
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
        if (z.hidden) continue;
        if (Math.abs(z.x - b.x) < 18 * z.d.size + 6 && b.y > top + z.y && b.y < z.y) {
          if (b.rocket) { b.life = 0; explode(K, b.x, b.y, 150, b.dmg, null); break; }
          b.hit.push(z); hitZombie(K, z, b.dmg, b.vx > 0 ? 1 : -1, b.laser ? 60 : 90, 0, 'gun');
          if (b.frost) { z.frozen = Math.max(z.frozen || 0, z.d.boss ? 0.6 : 1.6); goo(z.x, -70, '#BFE9FF', 4, 160); }
          if (b.tesla) chain(K, z, b.dmg * 0.7);
          if (!b.pierce) b.life = 0;
        }
      }
      if (b.life > 0 && b.y > -140) for (var ci2 = 0; ci2 < cages.length; ci2++) { var cg = cages[ci2]; if (!cg.freed && Math.abs(cg.x - b.x) < 34) { hitCage(K, cg, b.dmg * 0.6); if (b.rocket) explode(K, b.x, b.y, 150, b.dmg, null); if (!b.pierce || b.rocket) { b.life = 0; break; } } }
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
        else if (p.k === 'crate') { if (p.id.indexOf('gun:') === 0) { var gid = p.id.slice(4), gg = GUNS[gid]; hero.gun2 = { id: gid, ammo: Math.min(120, Math.round(gg.mag * 2 * mods.mag)) }; banners.push({ t: 1.6, title: K.t('tryGun') + ' ' + L(K, gg.name), sub: K.t('tryGunSub'), col: '#FFC93C' }); } else { var w = WEAPONS[p.id]; hero.melee = { id: p.id, uses: w.uses }; banners.push({ t: 1.4, title: L(K, w.name) + '!', sub: '', col: '#FFC93C' }); } K.sfx('reward'); }
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
  function hsh(k, s) { var v = Math.sin(k * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); }
  function vpX(K) { return K.W / 2; }
  function vpY() { return bkY - 300 * sc; }
  // a building with a visible side + top face receding toward the vanishing point (2.5D)
  function box3(c, K, X, topY, w, h, col, depth) {
    var vx = vpX(K), vy = vpY(), k = depth || 0.07, bot = topY + h;
    var side = X + w < vx ? X + w : X > vx ? X : null;
    if (side !== null) {
      c.fillStyle = mix(col, '#000000', 0.38); c.beginPath();
      c.moveTo(side, topY); c.lineTo(side + (vx - side) * k, topY + (vy - topY) * k); c.lineTo(side + (vx - side) * k, bot + (vy - bot) * k * 0.2); c.lineTo(side, bot); c.closePath(); c.fill();
    }
    if (topY > vy) { c.fillStyle = mix(col, '#FFFFFF', 0.12); c.beginPath(); c.moveTo(X, topY); c.lineTo(X + w, topY); c.lineTo(X + w + (vx - X - w) * k, topY + (vy - topY) * k); c.lineTo(X + (vx - X) * k, topY + (vy - topY) * k); c.closePath(); c.fill(); }
    c.fillStyle = col; c.fillRect(X, topY, w, h);
  }
  function skyline(c, K, T, par, col, hmul, seed, opts) {
    var W = K.W, off = camX * par, step = 120;
    for (var i = -2; i < 40; i++) {
      var k = Math.floor(off / step) + i, rr = hsh(k, seed), X = (i * step - off % step - step) * sc * 0.9;
      if (X > W + 40) break;
      var bh = (90 + rr * 220) * hmul * sc, bw = (80 + rr * 30) * sc, top = bkY - bh;
      if (opts.erase && rr > 0.78) { c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(X, top, bw, bh); c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 2; c.setLineDash([6, 6]); c.strokeRect(X, top, bw, bh); c.setLineDash([]); c.fillStyle = 'rgba(255,190,210,0.7)'; for (var e2 = 0; e2 < 5; e2++) c.fillRect(X + hsh(k, e2) * bw, top + bh * (0.2 + 0.15 * e2), 6 * sc, 3 * sc); continue; }
      if (opts.d3) box3(c, K, X, top, bw, bh, col, 0.05); else { c.fillStyle = col; c.fillRect(X, top, bw, bh); }
      if (opts.broken) { c.fillStyle = col; c.beginPath(); c.moveTo(X, top); c.lineTo(X + bw * 0.3, top - 18 * sc * rr); c.lineTo(X + bw * 0.55, top); c.fill(); }
      if (opts.win) { c.fillStyle = opts.win; for (var wy = top + 14 * sc; wy < bkY - 20 * sc; wy += 26 * sc) for (var wx = 0; wx < 2; wx++) if (hsh(k * 7 + wx, wy) > 0.55) c.fillRect(X + (12 + wx * 34) * sc, wy, 10 * sc, 10 * sc); }
      if (opts.neon && rr > 0.35) { var nc = ['#FF4FD8', '#3EE0FF', '#FFE15A', '#7CFF6B'][k & 3]; c.shadowColor = nc; c.shadowBlur = 16 * sc; c.fillStyle = nc; c.fillRect(X + bw * 0.2, top + bh * 0.2, bw * 0.6, 14 * sc); c.shadowBlur = 0; c.fillStyle = '#0B0820'; c.fillRect(X + bw * 0.26, top + bh * 0.2 + 4 * sc, bw * 0.48, 6 * sc); }
    }
  }
  function drawWorld(c, K) {
    var W = K.W, H = K.H, T = THEMES[theme] || THEMES.ruins, th = theme;
    bkY = gyS - 30 * sc;
    var nt = th !== 'ruins' ? 0 : story ? story.d.li / 7 : mode === 'map' || mode === 'cut' ? 0.3 : Math.min(1, Math.max(0, (wave - 1) / 12));
    if (story && story.nm) nt = 1;
    var sk = T.skyN ? [mix(T.sky[0], T.skyN[0], nt), mix(T.sky[1], T.skyN[1], nt), mix(T.sky[2], T.skyN[2], nt)] : T.sky;
    var g = c.createLinearGradient(0, 0, 0, bkY); g.addColorStop(0, sk[0]); g.addColorStop(0.45, sk[1]); g.addColorStop(1, sk[2]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    var sunX = W * 0.68 - camX * sc * 0.03, sunY = bkY - 150 * sc;
    if (th === 'ruins' || th === 'desert') {
      var sg = c.createRadialGradient(sunX, sunY, 10, sunX, sunY, 260 * sc); sg.addColorStop(0, th === 'desert' ? 'rgba(255,170,80,0.9)' : 'rgba(255,240,190,0.95)'); sg.addColorStop(0.25, 'rgba(255,200,120,0.5)'); sg.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = sg; c.fillRect(0, 0, W, H);
      if (th === 'desert') { c.fillStyle = '#140608'; c.beginPath(); c.arc(sunX, sunY, 58 * sc, 0, TAU); c.fill(); [[18, 70, 9], [-22, 84, 6], [4, 110, 5]].forEach(function (q) { c.beginPath(); c.arc(sunX + q[0] * sc, sunY + (q[1] + (K.time * 30 % 40)) * sc, q[2] * sc, 0, TAU); c.fill(); }); }
      else { c.fillStyle = mix('#FFF1C8', '#FF5A4E', nt); c.beginPath(); c.arc(sunX, sunY, 46 * sc, 0, TAU); c.fill(); }
    }
    if ((th === 'ruins' && nt > 0.3) || th === 'neon') { c.fillStyle = 'rgba(255,255,255,' + (th === 'neon' ? 0.6 : nt * 0.8) + ')'; for (var st = 0; st < 40; st++) c.fillRect((st * 137.5 + 40) % W, (st * 71.3) % (bkY * 0.55), 2, 2); }
    if (th === 'neon') { c.fillStyle = 'rgba(255,79,216,0.22)'; c.beginPath(); c.arc(W * 0.25 - camX * sc * 0.02, bkY * 0.3, 70 * sc, 0, TAU); c.fill(); }
    if (th === 'margin') { // notebook paper: ruled lines + red margin + pencil doodles
      c.strokeStyle = 'rgba(70,110,220,0.22)'; c.lineWidth = 1.5; c.beginPath(); for (var ly = 28; ly < bkY; ly += 24 * sc) { c.moveTo(0, ly); c.lineTo(W, ly); } c.stroke();
      var mxx = (300 - camX * 0.4) * sc; c.strokeStyle = 'rgba(225,60,60,0.55)'; c.lineWidth = 3; c.beginPath(); c.moveTo(mxx, 0); c.lineTo(mxx, H); c.moveTo(mxx + 6, 0); c.lineTo(mxx + 6, H); c.stroke();
      c.strokeStyle = 'rgba(90,80,70,0.35)'; c.lineWidth = 2 * sc;
      for (var dd = -1; dd < 12; dd++) { var kk = Math.floor(camX * 0.5 / 380) + dd, dx0 = (kk * 380 - camX * 0.5) * sc, dy0 = bkY * (0.25 + hsh(kk, 3) * 0.45), rr = 30 * sc * (0.6 + hsh(kk, 5)); if (dx0 > W + 80) break; c.beginPath(); if (hsh(kk, 9) > 0.5) { for (var a = 0; a < 14; a++) { var ang = a * 0.9, rad = rr * a / 14; c.lineTo(dx0 + Math.cos(ang) * rad, dy0 + Math.sin(ang) * rad); } } else { c.save(); c.translate(dx0, dy0); c.rotate(0.2); c.moveTo(-rr, 0); for (var a2 = 0; a2 < 10; a2++) { var a3 = a2 * Math.PI / 5 - Math.PI / 2, r3 = a2 % 2 ? rr * 0.45 : rr; c.lineTo(Math.cos(a3) * r3, Math.sin(a3) * r3); } c.closePath(); c.restore(); } c.stroke(); }
    }
    // far + near background layers
    if (th === 'ruins') { skyline(c, K, T, 0.2, nt > 0 ? mix(T.L[0], '#2A1838', nt) : T.L[0], 1, 3, { broken: true }); skyline(c, K, T, 0.45, nt > 0 ? mix(T.L[1], '#1A0E26', nt) : T.L[1], 0.75, 7, { broken: true, d3: true, win: T.win }); }
    else if (th === 'neon') { skyline(c, K, T, 0.2, T.L[0], 1.5, 4, { erase: true }); skyline(c, K, T, 0.45, T.L[1], 1.05, 8, { d3: true, neon: true, win: T.win, erase: true }); }
    else if (th === 'metro') {
      // tunnel ceiling + tiled back wall + passing train
      c.fillStyle = '#041012'; c.fillRect(0, 0, W, bkY * 0.22); c.fillStyle = '#0A2226'; c.fillRect(0, bkY * 0.22, W, 10 * sc);
      c.strokeStyle = 'rgba(160,230,225,0.08)'; c.lineWidth = 1; c.beginPath(); for (var ty = bkY * 0.24; ty < bkY; ty += 22 * sc) { c.moveTo(0, ty); c.lineTo(W, ty); } var toff = (camX * 0.45 * sc) % (40 * sc); for (var tx = -toff; tx < W; tx += 40 * sc) { c.moveTo(tx, bkY * 0.24); c.lineTo(tx, bkY); } c.stroke();
      var trX = ((trainT * 900) % (AW * 3)) - AW, trSX = (trX - camX * 0.45) * sc, trY = bkY - 120 * sc;
      if (trSX > -1800 * sc && trSX < W) { box3(c, K, trSX, trY, 1600 * sc, 96 * sc, '#1E5A5E', 0.04); c.fillStyle = 'rgba(255,240,180,0.75)'; for (var wi = 0; wi < 20; wi++) c.fillRect(trSX + (30 + wi * 78) * sc, trY + 20 * sc, 46 * sc, 28 * sc); c.fillStyle = '#FFD628'; c.fillRect(trSX, trY + 70 * sc, 1600 * sc, 6 * sc); }
      c.fillStyle = 'rgba(255,214,40,0.5)'; c.font = K.font(40 * sc); c.textAlign = 'center'; c.textBaseline = 'middle'; for (var si = -1; si < 6; si++) { var kz = Math.floor(camX * 0.45 / 700) + si, sxx = (kz * 700 - camX * 0.45) * sc; if (sxx > W + 100) break; c.fillStyle = '#0E2A2E'; K.roundRect(c, sxx - 34 * sc, bkY * 0.32, 68 * sc, 52 * sc, 8 * sc); c.fill(); c.fillStyle = '#FFD628'; c.fillText('0', sxx, bkY * 0.32 + 27 * sc); }
    } else if (th === 'desert') {
      [[0.15, T.L[0], 1, 2], [0.4, T.L[1], 0.6, 5]].forEach(function (Lr) { c.fillStyle = Lr[1]; c.beginPath(); c.moveTo(0, bkY); for (var x = 0; x <= W + 20; x += 20) { var wx = x / sc + camX * Lr[0]; c.lineTo(x, bkY - (80 + 60 * Math.sin(wx / 260 + Lr[3]) + 40 * Math.sin(wx / 97 + Lr[3] * 2)) * Lr[2] * sc); } c.lineTo(W, bkY); c.fill(); });
      // giant pencil stuck in the sand
      var px = (1500 - camX * 0.4) * sc; c.save(); c.translate(px, bkY - 20 * sc); c.rotate(-0.35); c.fillStyle = '#FFC93C'; c.fillRect(-14 * sc, -300 * sc, 28 * sc, 280 * sc); c.fillStyle = '#F4B6A0'; c.fillRect(-14 * sc, -330 * sc, 28 * sc, 30 * sc); c.fillStyle = '#B8B8C0'; c.fillRect(-14 * sc, -304 * sc, 28 * sc, 8 * sc); c.fillStyle = '#E8C9A0'; c.beginPath(); c.moveTo(-14 * sc, -20 * sc); c.lineTo(14 * sc, -20 * sc); c.lineTo(0, 10 * sc); c.fill(); c.restore();
    }
    // mid props (parallax 0.75)
    var off2 = camX * 0.75; c.strokeStyle = T.prop; c.fillStyle = T.prop; c.lineCap = 'round';
    for (var t = -1; t < 30; t++) {
      var k2 = Math.floor(off2 / 260) + t, X2 = ((t * 260) - off2 % 260) * sc, rv = Math.abs(Math.sin(k2 * 3.7)), B = bkY;
      if (X2 > W + 100) break;
      if (th === 'ruins') {
        if (rv < 0.4) { c.lineWidth = 9 * sc; c.beginPath(); c.moveTo(X2, B); c.lineTo(X2 + 6 * sc, B - 170 * sc); c.stroke(); c.lineWidth = 5 * sc; c.beginPath(); c.moveTo(X2 + 4 * sc, B - 110 * sc); c.lineTo(X2 - 40 * sc, B - 150 * sc); c.moveTo(X2 + 6 * sc, B - 140 * sc); c.lineTo(X2 + 46 * sc, B - 185 * sc); c.moveTo(X2 + 6 * sc, B - 165 * sc); c.lineTo(X2 - 18 * sc, B - 200 * sc); c.stroke(); }
        else if (rv < 0.7) { lamp(c, X2, B, 'rgba(255,220,150,0.8)', T.prop); }
        else { K.roundRect(c, X2, B - 46 * sc, 130 * sc, 36 * sc, 10 * sc); c.fill(); c.beginPath(); c.moveTo(X2 + 26 * sc, B - 46 * sc); c.lineTo(X2 + 44 * sc, B - 74 * sc); c.lineTo(X2 + 92 * sc, B - 74 * sc); c.lineTo(X2 + 108 * sc, B - 46 * sc); c.fill(); c.beginPath(); c.arc(X2 + 30 * sc, B - 10 * sc, 14 * sc, 0, TAU); c.arc(X2 + 100 * sc, B - 10 * sc, 14 * sc, 0, TAU); c.fill(); }
      } else if (th === 'metro') {
        if (k2 % 2 === 0) { box3(c, K, X2, bkY * 0.24, 34 * sc, B - bkY * 0.24, '#0C2629', 0.06); c.fillStyle = '#FFD628'; c.fillRect(X2, B - 60 * sc, 34 * sc, 8 * sc); c.fillStyle = T.prop; }
        else if (rv < 0.5) { c.fillRect(X2, B - 34 * sc, 110 * sc, 10 * sc); c.fillRect(X2 + 8 * sc, B - 26 * sc, 8 * sc, 26 * sc); c.fillRect(X2 + 94 * sc, B - 26 * sc, 8 * sc, 26 * sc); }
        var lg2 = c.createRadialGradient(X2 + 17 * sc, bkY * 0.24, 2, X2 + 17 * sc, bkY * 0.24, 120 * sc); lg2.addColorStop(0, 'rgba(180,255,245,0.35)'); lg2.addColorStop(1, 'rgba(180,255,245,0)'); c.fillStyle = lg2; c.fillRect(X2 - 110 * sc, bkY * 0.24, 260 * sc, 140 * sc); c.fillStyle = T.prop;
      } else if (th === 'neon') { if (rv < 0.6) lamp(c, X2, B, ['rgba(255,79,216,0.85)', 'rgba(62,224,255,0.85)'][k2 & 1], T.prop); }
      else if (th === 'desert') { if (rv < 0.5) { paperBall(c, X2, B, (26 + rv * 30) * sc); } else if (rv < 0.65) { c.save(); c.translate(X2, B); c.rotate(0.5); c.fillStyle = '#FFC93C'; c.fillRect(-6 * sc, -90 * sc, 12 * sc, 70 * sc); c.restore(); } }
      else if (th === 'margin') { if (rv < 0.55) { c.strokeStyle = 'rgba(90,80,70,0.55)'; c.lineWidth = 2.5 * sc; c.setLineDash([10 * sc, 7 * sc]); c.strokeRect(X2, B - 110 * sc, 100 * sc, 110 * sc); c.beginPath(); c.moveTo(X2 - 10 * sc, B - 110 * sc); c.lineTo(X2 + 50 * sc, B - 160 * sc); c.lineTo(X2 + 110 * sc, B - 110 * sc); c.stroke(); c.setLineDash([]); } }
    }
    drawFloor(c, K, T);
    // arena walls
    [0, AW].forEach(function (bx, i) { var X = sx(bx); if (X < -200 || X > W + 200) return; var x0 = i ? X : X - 60 * sc; box3(c, K, x0, gyS - 140 * sc, 60 * sc, 140 * sc, th === 'margin' ? '#CFC7B5' : '#2A1C2C', 0.08); c.fillStyle = T.bar; for (var s2 = 0; s2 < 4; s2++) c.fillRect(x0, gyS - 130 * sc + s2 * 34 * sc, 60 * sc, 10 * sc); });
    decals.forEach(function (d) { c.globalAlpha = Math.min(1, d.t / 2) * (d.toxic ? 0.75 : 0.55); c.fillStyle = d.col; c.beginPath(); c.ellipse(sx(d.x), gyS + 2 * sc, d.w * sc, 7 * sc, 0, 0, TAU); c.fill(); c.globalAlpha = 1; });
  }
  function lamp(c, X, B, glow, col) {
    c.lineWidth = 6 * sc; c.strokeStyle = col; c.beginPath(); c.moveTo(X, B); c.lineTo(X, B - 190 * sc); c.lineTo(X + 30 * sc, B - 200 * sc); c.stroke();
    var lg = c.createRadialGradient(X + 30 * sc, B - 190 * sc, 2, X + 30 * sc, B - 190 * sc, 70 * sc); lg.addColorStop(0, glow); lg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = lg; c.fillRect(X - 40 * sc, B - 270 * sc, 140 * sc, 160 * sc); c.fillStyle = col;
  }
  function paperBall(c, X, B, r) { c.fillStyle = '#EDE4D0'; c.strokeStyle = '#8A7A60'; c.lineWidth = 2; c.beginPath(); c.arc(X, B - r * 0.8, r, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.moveTo(X - r * 0.6, B - r); c.lineTo(X, B - r * 0.5); c.lineTo(X + r * 0.5, B - r * 1.2); c.moveTo(X - r * 0.2, B - r * 1.6); c.lineTo(X + r * 0.1, B - r * 0.9); c.stroke(); }
  // perspective floor: depth lines converge on the vanishing point
  function drawFloor(c, K, T) {
    var W = K.W, H = K.H, top = bkY, vx = vpX(K), vy = vpY();
    var gg = c.createLinearGradient(0, top, 0, H); gg.addColorStop(0, T.g[0]); gg.addColorStop(0.2, T.g[1]); gg.addColorStop(1, T.g[2]);
    c.fillStyle = gg; c.fillRect(0, top, W, H - top);
    var kT = (top - vy) / (gyS - vy), kB = (H - vy) / (gyS - vy), step = 200;
    c.strokeStyle = T.grid; c.lineWidth = 2; c.beginPath();
    for (var m = Math.floor(camX / step) - 4; m < (camX + viewW(K)) / step + 4; m++) { var X = sx(m * step); c.moveTo(vx + (X - vx) * kT, top); c.lineTo(vx + (X - vx) * kB, H); }
    for (var i = 1; i < 7; i++) { var y = top + (H - top) * Math.pow(i / 7, 1.7); c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke();
    c.fillStyle = T.edge; c.fillRect(0, top, W, (theme === 'metro' ? 5 : 3) * sc);
    if (theme === 'metro') { var y1 = gyS + (H - gyS) * 0.45, y2 = gyS + (H - gyS) * 0.75; c.fillStyle = 'rgba(0,0,0,0.25)'; for (var sl = Math.floor(camX / 60) - 4; sl < (camX + viewW(K)) / 60 + 4; sl++) { var Xs = sx(sl * 60), a = vx + (Xs - vx) * ((y1 - vy) / (gyS - vy)), b2 = vx + (Xs - vx) * ((y2 - vy) / (gyS - vy)); c.beginPath(); c.moveTo(a - 5, y1 - 4); c.lineTo(a + 5, y1 - 4); c.lineTo(b2 + 7, y2 + 4); c.lineTo(b2 - 7, y2 + 4); c.fill(); } c.fillStyle = '#9AA4A8'; c.fillRect(0, y1 + 6, W, 4); c.fillRect(0, y2 - 8, W, 5); }
    if (theme === 'neon') { for (var r = -1; r < 8; r++) { var kr = Math.floor(camX * 0.45 / 300) + r, rx = (kr * 300 - camX * 0.45) * sc; if (rx > W + 60) break; var rg = c.createLinearGradient(0, gyS, 0, H); var colr = ['rgba(255,79,216,0.25)', 'rgba(62,224,255,0.22)'][kr & 1]; rg.addColorStop(0, colr); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.fillRect(rx, gyS, 40 * sc, H - gyS); } }
    if (theme === 'desert') { c.strokeStyle = 'rgba(90,40,10,0.18)'; c.lineWidth = 2; c.beginPath(); for (var dy = 1; dy < 6; dy++) { var yy = gyS + (H - gyS) * dy / 6; for (var x = 0; x <= W; x += 16) c.lineTo(x, yy + Math.sin((x / sc + camX) / 40 + dy) * 3 * sc); c.moveTo(0, yy + (H - gyS) / 6); } c.stroke(); }
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
    if (h.shield > 0) { var bub = sy(-62 * def.size); c.strokeStyle = 'rgba(62,224,255,' + (h.shield < 2 && Math.floor(h.shield * 8) % 2 ? 0.2 : 0.85) + ')'; c.lineWidth = 4 * sc; c.fillStyle = 'rgba(62,224,255,0.12)'; c.beginPath(); c.arc(sx(h.x), bub, 78 * sc * def.size, 0, TAU); c.fill(); c.stroke(); }
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
      var look = h.gun2 ? GUNS[h.gun2.id].look : gunDef(curGun).look;
      drawGun(c, look, sc * 1.05);
    } else if (kind === 'hammer') { c.fillStyle = '#5A3A22'; c.fillRect(-4 * sc, -3 * sc, 54 * sc, 7 * sc); c.fillStyle = '#7A808C'; c.fillRect(42 * sc, -16 * sc, 24 * sc, 32 * sc); c.fillStyle = h.def.acc; c.fillRect(42 * sc, -16 * sc, 24 * sc, 6 * sc); }
    else if (kind === 'katana') { c.fillStyle = '#111'; c.fillRect(-6 * sc, -3 * sc, 18 * sc, 6 * sc); c.fillStyle = '#E6EEF8'; c.beginPath(); c.moveTo(12 * sc, -3 * sc); c.lineTo(84 * sc, -6 * sc); c.lineTo(90 * sc, 0); c.lineTo(12 * sc, 3 * sc); c.fill(); }
    else if (kind === 'axe') { c.fillStyle = '#6B4A2A'; c.fillRect(-4 * sc, -3 * sc, 58 * sc, 7 * sc); c.fillStyle = '#C7CED8'; c.beginPath(); c.moveTo(40 * sc, -4 * sc); c.quadraticCurveTo(52 * sc, -30 * sc, 66 * sc, -24 * sc); c.lineTo(58 * sc, 4 * sc); c.closePath(); c.fill(); }
    else if (h.def.id === 'vex') { c.fillStyle = '#2E2E2E'; c.fillRect(-2 * sc, -5 * sc, 20 * sc, 8 * sc); }
    c.restore();
  }
  function drawZombie(c, K, z) {
    if (z.hidden) return;
    var d = z.d, s = d.size, crawl = z.t === 'biter', J = rig(z.pose, z.x, z.y, z.face, s, z.y > -2, crawl);
    if (d.ai === 'null') { drawNull(c, K, z, J); return; }
    if (z.rise > 0) { c.save(); c.beginPath(); c.rect(0, 0, K.W, gyS); c.clip(); var off = z.rise / 0.6 * 90 * s * sc; c.translate(0, off); }
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(sx(z.x), gyS + 2 * sc, 30 * s * sc, 6 * sc, 0, 0, TAU); c.fill();
    var lw = (d.boss ? 12 : d.heavy ? 12 : 9) * s;
    var flash = z.stun > 0.18;
    if (z.fuse > 0) { c.shadowColor = '#FF3B4E'; c.shadowBlur = 20 * sc * (0.5 + 0.5 * Math.sin(K.time * 40)); }
    else if (z.elite) { c.shadowColor = '#FFD43B'; c.shadowBlur = (16 + 6 * Math.sin(K.time * 6)) * sc; }
    var zc = z.ice > 0 ? '#CDEFFF' : z.frozen > 0 ? mix(d.col, '#9BE7FF', 0.55) : d.col;
    drawRig(c, J, flash ? '#FFFFFF' : zc, flash ? '#FFFFFF' : (z.ice > 0 ? '#8FD3FF' : d.dark), lw, z.ice > 0 ? '#38B6FF' : z.elite ? '#FFD43B' : '#1A1020');
    c.shadowBlur = 0;
    var hx = sx(J.head[0]), hy = sy(J.head[1]), r = J.R * sc, f = z.face;
    // type features
    if (z.t === 'bruiser' || (d.boss && z.t !== 'mother')) { c.fillStyle = flash ? '#FFF' : d.col; c.strokeStyle = '#1A1020'; c.lineWidth = 3 * sc; var bx = sx((J.hip[0] * 0.55 + J.neck[0] * 0.45)) + f * 8 * s * sc, by = sy((J.hip[1] * 0.55 + J.neck[1] * 0.45)); c.beginPath(); c.arc(bx, by, 17 * s * sc, 0, TAU); c.fill(); c.stroke(); }
    if (z.t === 'popper') { var pb = sy((J.hip[1] + J.neck[1]) / 2), px = sx((J.hip[0] + J.neck[0]) / 2), pr = 26 * s * sc * (1 + (z.fuse > 0 ? 0.15 * Math.sin(K.time * 40) : 0.04 * Math.sin(K.time * 6))); c.fillStyle = flash ? '#FFF' : d.col; c.strokeStyle = '#1A1020'; c.lineWidth = 3 * sc; c.beginPath(); c.arc(px, pb, pr, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#FFD1E8'; [[-0.4, -0.3], [0.3, 0.2], [0.1, -0.55]].forEach(function (q) { c.beginPath(); c.arc(px + q[0] * pr, pb + q[1] * pr, pr * 0.16, 0, TAU); c.fill(); }); }
    if (z.t === 'gloop') { c.fillStyle = '#F4EC7A'; c.strokeStyle = '#1A1020'; c.lineWidth = 2.5 * sc; c.beginPath(); c.arc(sx(J.neck[0]) + f * 6 * sc, sy(J.neck[1]) + 6 * sc, 11 * sc * (1 + 0.1 * Math.sin(K.time * 5)), 0, TAU); c.fill(); c.stroke(); }
    if (z.t === 'mother') { var mbx = sx((J.hip[0] + J.neck[0]) / 2) + f * 10 * sc, mby = sy((J.hip[1] + J.neck[1]) / 2), mr = 27 * s * sc * (1 + 0.05 * Math.sin(K.time * 4)); c.fillStyle = flash ? '#FFF' : d.col; c.strokeStyle = '#1A1020'; c.lineWidth = 4 * sc; c.beginPath(); c.arc(mbx, mby, mr, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#F4EC7A'; for (var dr = 0; dr < 4; dr++) { var ddx = mbx + (dr - 1.5) * mr * 0.45, ddy = mby + mr * 0.7 + ((K.time * 40 + dr * 13) % (24 * sc)); c.beginPath(); c.arc(ddx, ddy, 5 * sc, 0, TAU); c.fill(); } }
    if (z.t === 'hollow') { c.fillStyle = 'rgba(255,255,255,0.85)'; [[0.3, -0.2], [0.65, 0.15]].forEach(function (q) { var tx = lerp(J.hip[0], J.neck[0], q[0]), ty = lerp(J.hip[1], J.neck[1], q[0]); c.fillRect(sx(tx) + q[1] * 30 * sc, sy(ty) - 6 * sc, 16 * sc, 12 * sc); }); }
    if (z.t === 'conductor') { var chx = sx(J.head[0]), chy = sy(J.head[1]), cr2 = J.R * sc; c.fillStyle = '#0E3A44'; c.fillRect(chx - cr2 * 1.1, chy - cr2 * 1.25, cr2 * 2.2, cr2 * 0.7); c.fillStyle = '#FFD628'; c.fillRect(chx - cr2 * 1.1, chy - cr2 * 0.62, cr2 * 2.2, cr2 * 0.18); c.fillStyle = '#0E3A44'; c.fillRect(chx + (f > 0 ? 0 : -cr2 * 1.6), chy - cr2 * 0.62, cr2 * 1.6, cr2 * 0.2); }
    if (d.boss && !d.ai) { c.fillStyle = '#F2E6D8'; for (var sp = 0; sp < 4; sp++) { var t = sp / 3, bxx = sx(lerp(J.hip[0], J.neck[0], t)) - f * 12 * s * sc, byy = sy(lerp(J.hip[1], J.neck[1], t)); c.beginPath(); c.moveTo(bxx, byy - 6 * sc); c.lineTo(bxx - f * 26 * sc, byy - 18 * sc); c.lineTo(bxx, byy + 6 * sc); c.fill(); } }
    // glowing eyes
    var eyeCol = z.t === 'hollow' ? '#FFFFFF' : d.boss ? '#FFE15A' : '#F4FFB0';
    c.shadowColor = d.boss ? eyeCol : '#E8FF5A'; c.shadowBlur = 10 * sc; c.fillStyle = z.t === 'hollow' ? '#05020A' : eyeCol;
    c.beginPath(); c.arc(hx + f * r * 0.35, hy - r * 0.1, r * (z.t === 'hollow' ? 0.27 : 0.2), 0, TAU); c.arc(hx + f * r * 0.75, hy - r * 0.05, r * (z.t === 'hollow' ? 0.22 : 0.15), 0, TAU); c.fill(); c.shadowBlur = 0;
    z._eye = [hx + f * r * 0.5, hy - r * 0.08, r, eyeCol];
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
  function drawNull(c, K, z, J) {
    var d = z.d, s = d.size, flash = z.stun > 0.04;
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(sx(z.x), gyS + 2 * sc, 30 * s * sc, 6 * sc, 0, 0, TAU); c.fill();
    if (Math.random() < (z.phase2 ? 0.35 : 0.15)) { // glitch echoes
      var ox = rnd(-10, 10) * sc; c.save(); c.translate(ox, 0); c.globalAlpha = 0.5; drawRig(c, J, '#FF3B4E', '#FF3B4E', 10 * s, null); c.translate(-2 * ox, 0); drawRig(c, J, '#3EE0FF', '#3EE0FF', 10 * s, null); c.restore(); c.globalAlpha = 1;
    }
    drawRig(c, J, flash ? '#FFFFFF' : d.col, flash ? '#FFFFFF' : d.dark, (d.clone ? 9 : 11) * s, '#F4F1E8');
    var hx = sx(J.head[0]), hy = sy(J.head[1]), r = J.R * sc, f = z.face;
    if (!d.clone) { c.strokeStyle = '#F4F1E8'; c.lineWidth = 3 * sc; c.beginPath(); c.moveTo(hx - f * r * 0.2, hy - r * 0.9); c.lineTo(hx - f * r * 1.6, hy - r * 1.9 + Math.sin(K.time * 9) * 4 * sc); c.stroke(); }
    c.shadowColor = '#FF3B4E'; c.shadowBlur = 14 * sc; c.fillStyle = '#FF3B4E'; c.fillRect(hx + f * r * 0.1 - (f < 0 ? r * 0.8 : 0), hy - r * 0.3, r * 0.8, r * 0.22); c.shadowBlur = 0;
    z._eye = [hx + f * r * 0.5, hy - r * 0.2, r, '#FF3B4E'];
    if (d.clone && z.hp < z.maxHp) { var bw = 40 * sc; c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(sx(z.x) - bw / 2, sy(-150), bw, 5 * sc); c.fillStyle = '#FF3B4E'; c.fillRect(sx(z.x) - bw / 2, sy(-150), bw * Math.max(0, z.hp / z.maxHp), 5 * sc); }
  }
  function drawCage(c, K, cg) {
    var X = sx(cg.x), Y = gyS, w = 70 * sc, h = 124 * sc;
    if (!cg.freed) { // the trapped survivor
      var Jc = rig(pose('idle', K.time * 2 + cg.x), cg.x, 0, 1, 0.85, true, false); drawRig(c, Jc, '#2B2B2B', '#3A3A3A', 9, null);
      c.fillStyle = cg.col; c.fillRect(sx(Jc.head[0]) - Jc.R * sc, sy(Jc.head[1]) - Jc.R * 0.4 * sc, Jc.R * 2 * sc, Jc.R * 0.4 * sc);
      c.fillStyle = cg.hitT > 0 ? '#FFFFFF' : '#5A5A68'; c.fillRect(X - w / 2 - 4 * sc, Y - h - 8 * sc, w + 8 * sc, 10 * sc); c.fillRect(X - w / 2 - 4 * sc, Y - 6 * sc, w + 8 * sc, 8 * sc);
      c.strokeStyle = cg.hitT > 0 ? '#FFFFFF' : '#3A3A46'; c.lineWidth = 5 * sc; c.beginPath(); for (var b = 0; b < 6; b++) { var bx = X - w / 2 + b * w / 5; c.moveTo(bx, Y - h); c.lineTo(bx, Y - 4 * sc); } c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 1.5 * sc; c.beginPath(); for (var b2 = 0; b2 < 6; b2++) { var bx2 = X - w / 2 + b2 * w / 5 - 1.5 * sc; c.moveTo(bx2, Y - h); c.lineTo(bx2, Y - 4 * sc); } c.stroke();
      var bw = 60 * sc; c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(X - bw / 2, Y - h - 24 * sc, bw, 6 * sc); c.fillStyle = '#4ADE80'; c.fillRect(X - bw / 2, Y - h - 24 * sc, bw * cg.hp / cg.maxHp, 6 * sc);
      c.fillStyle = '#FFE15A'; c.font = K.font(18 * sc); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', X, Y - h - 42 * sc + Math.sin(K.time * 6) * 4 * sc);
    } else { c.strokeStyle = '#3A3A46'; c.lineWidth = 5 * sc; c.beginPath(); c.moveTo(X - w / 2, Y - 4 * sc); c.lineTo(X - w / 2 - 20 * sc, Y - 30 * sc); c.moveTo(X + w / 2, Y - 4 * sc); c.lineTo(X + w / 2 + 24 * sc, Y - 20 * sc); c.stroke(); }
  }
  function drawCiv(c, v) { var J = rig(v.pose, v.x, 0, v.dir, 0.85, true, false); drawRig(c, J, '#2B2B2B', '#3A3A3A', 9, null); c.fillStyle = v.col; c.fillRect(sx(J.head[0]) - J.R * sc, sy(J.head[1]) - J.R * 0.4 * sc, J.R * 2 * sc, J.R * 0.4 * sc); }
  function drawLantern(c, K) {
    var L2 = lantern, X = sx(L2.x), Y = gyS, on = L2.hp > 0, fl = 0.85 + 0.15 * Math.sin(K.time * 13) * Math.sin(K.time * 7);
    if (on) { var lg = c.createRadialGradient(X, Y - 150 * sc, 4, X, Y - 150 * sc, 260 * sc); lg.addColorStop(0, 'rgba(255,220,130,' + (0.45 * fl) + ')'); lg.addColorStop(1, 'rgba(255,220,130,0)'); c.fillStyle = lg; c.fillRect(X - 260 * sc, Y - 410 * sc, 520 * sc, 520 * sc); }
    c.fillStyle = '#2A2A36'; c.fillRect(X - 5 * sc, Y - 140 * sc, 10 * sc, 140 * sc); c.fillRect(X - 26 * sc, Y - 8 * sc, 52 * sc, 8 * sc);
    c.fillStyle = L2.hitT > 0 ? '#FFFFFF' : '#3A3A46'; K.roundRect(c, X - 22 * sc, Y - 190 * sc, 44 * sc, 54 * sc, 8 * sc); c.fill();
    c.fillStyle = on ? '#FFE58A' : '#444'; c.shadowColor = '#FFE58A'; c.shadowBlur = on ? 24 * sc * fl : 0; K.roundRect(c, X - 14 * sc, Y - 182 * sc, 28 * sc, 38 * sc, 6 * sc); c.fill(); c.shadowBlur = 0;
    var bw = 90 * sc; c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(X - bw / 2, Y - 212 * sc, bw, 8 * sc); c.fillStyle = L2.hp / L2.maxHp > 0.3 ? '#FFE15A' : '#FF3B4E'; c.fillRect(X - bw / 2, Y - 212 * sc, bw * L2.hp / L2.maxHp, 8 * sc);
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
      else if (p.k === 'bolt') { c.strokeStyle = p.col; c.lineWidth = 4 * sc; c.shadowColor = p.col; c.shadowBlur = 12; c.beginPath(); c.moveTo(X, Y); var X2 = sx(p.x2), Y2 = sy(p.y2); for (var bi = 1; bi < 6; bi++) c.lineTo(X + (X2 - X) * bi / 6 + rnd(-10, 10) * sc, Y + (Y2 - Y) * bi / 6 + rnd(-10, 10) * sc); c.lineTo(X2, Y2); c.stroke(); c.shadowBlur = 0; }
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
      else { c.strokeStyle = b.col || '#FFE58A'; c.lineWidth = (b.tesla || b.frost ? 5 : 3) * sc; c.beginPath(); c.moveTo(sx(b.x), sy(b.y)); c.lineTo(sx(b.x - b.vx * 0.018), sy(b.y - b.vy * 0.018)); c.stroke(); }
    });
    nades.forEach(function (n) { c.save(); c.translate(sx(n.x), sy(n.y)); c.rotate(n.ang); c.fillStyle = '#3B4A22'; c.beginPath(); c.ellipse(0, 0, 9 * sc, 11 * sc, 0, 0, TAU); c.fill(); c.fillStyle = '#C7CED8'; c.fillRect(-3 * sc, -15 * sc, 6 * sc, 5 * sc); c.restore(); if (Math.floor(n.t * 10) % 2) { c.fillStyle = '#FF3B4E'; c.beginPath(); c.arc(sx(n.x), sy(n.y) - 18 * sc, 3 * sc, 0, TAU); c.fill(); } });
    bombs.forEach(function (b) { c.fillStyle = '#2A2A36'; c.beginPath(); c.ellipse(sx(b.x), sy(b.y), 8 * sc, 15 * sc, 0, 0, TAU); c.fill(); c.fillStyle = '#FF8A1F'; c.fillRect(sx(b.x) - 8 * sc, sy(b.y) - 22 * sc, 16 * sc, 5 * sc); });
    turrets.forEach(function (t) { var X = sx(t.x), Y = gyS; c.strokeStyle = '#2A2A36'; c.lineWidth = 4 * sc; c.beginPath(); c.moveTo(X, Y - 30 * sc); c.lineTo(X - 18 * sc, Y); c.moveTo(X, Y - 30 * sc); c.lineTo(X + 18 * sc, Y); c.stroke(); c.fillStyle = '#FFB020'; K.roundRect(c, X - 16 * sc, Y - 52 * sc, 32 * sc, 22 * sc, 6 * sc); c.fill(); c.fillStyle = '#2A2A36'; c.fillRect(X + (t.face > 0 ? 10 : -38) * sc, Y - 46 * sc, 28 * sc, 7 * sc); c.strokeStyle = '#FFFFFF'; c.lineWidth = 3; c.beginPath(); c.arc(X, Y - 70 * sc, 8 * sc, -Math.PI / 2, -Math.PI / 2 + TAU * t.t / 15); c.stroke(); });
    if (planeT > 0) { var px = K.W * (1 - (planeT / 1.8)) * 1.3 - K.W * 0.15, py = gyS * 0.18; c.fillStyle = 'rgba(20,10,30,0.85)'; c.beginPath(); c.moveTo(px + 60, py); c.lineTo(px - 40, py - 10); c.lineTo(px - 60, py - 26); c.lineTo(px - 52, py); c.lineTo(px - 40, py + 10); c.closePath(); c.fill(); c.fillRect(px - 20, py - 4, 30, 30); }
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
    var g = h.gun2 ? h.gun2.ammo : h.ammo, ammoTxt = h.reloadT > 0 ? K.t('reloading') : (h.gun2 ? L(K, GUNS[h.gun2.id].name) + ' ' : '') + g;
    c.fillStyle = 'rgba(20,10,30,0.6)'; K.roundRect(c, 10, top + 58, 150, 24, 10); c.fill();
    c.fillStyle = '#FFE58A'; c.font = K.font(13); c.fillText(ammoTxt + (h.melee ? '  ' + L(K, WEAPONS[h.melee.id].name) + ' ' + h.melee.uses : ''), 18, top + 70);
    // combo
    if (combo >= 3) { var cs = 1 + Math.max(0, comboT - 2.3) * 2; c.save(); c.translate(W / 2, top + (W < 600 ? (bossRef ? 250 : 215) : (bossRef ? 150 : 112))); c.scale(cs, cs); c.textAlign = 'center'; c.font = K.font(34); c.lineWidth = 6; c.strokeStyle = 'rgba(20,10,30,0.8)'; c.strokeText('x' + combo, 0, 0); c.fillStyle = combo >= 25 ? '#FF3B4E' : combo >= 10 ? '#FFE15A' : '#FFFFFF'; c.fillText('x' + combo, 0, 0); c.font = K.font(12); c.fillStyle = '#FFFFFF'; c.fillText(K.t('combo'), 0, 22); c.restore(); }
    // hearts + item bar
    c.fillStyle = 'rgba(20,10,30,0.6)'; K.roundRect(c, 166, top + 58, 52, 24, 10); c.fill();
    drawItemIcon(c, 'heart', 180, top + 70, 9); c.fillStyle = '#FFFFFF'; c.font = K.font(13); c.textAlign = 'left'; c.fillText('x' + (bag.heart || 0), 192, top + 71);
    itemUI = []; var S = touchUI ? 40 : 34, ix = 12;
    ITEM_ORDER.forEach(function (k) {
      if (k === 'heart' || !(bag[k] > 0)) return;
      var cx = ix + S / 2, cy = top + 88 + S / 2;
      c.globalAlpha = 0.95; drawItemIcon(c, k, cx, cy, S / 2); c.globalAlpha = 1;
      c.fillStyle = '#111'; c.beginPath(); c.arc(cx + S * 0.36, cy + S * 0.36, 9, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.font = K.font(11); c.textAlign = 'center'; c.fillText(bag[k], cx + S * 0.36, cy + S * 0.37);
      if (!touchUI) { c.fillStyle = 'rgba(255,255,255,0.8)'; c.font = K.font(10); c.fillText(ITEMS[k].key, cx - S * 0.36, cy - S * 0.36); }
      itemUI.push({ x: ix, y: top + 88, w: S, h: S, id: k }); ix += S + 8;
    });
    // boss bar
    if (bossRef && !bossRef.dead) { var bw2 = Math.min(W - 60, 420), bx2 = (W - bw2) / 2, by2 = top + (W < 600 ? 150 : 92); c.fillStyle = 'rgba(20,10,30,0.7)'; K.roundRect(c, bx2 - 6, by2 - 22, bw2 + 12, 40, 10); c.fill(); c.fillStyle = '#FFFFFF'; c.font = K.font(12); c.textAlign = 'center'; c.fillText(L(K, bossRef.d.name) + (bossRef.enraged ? ' !!' : ''), W / 2, by2 - 10); c.fillStyle = '#3A0F1A'; c.fillRect(bx2, by2, bw2, 10); c.fillStyle = '#FF3B4E'; c.fillRect(bx2, by2, bw2 * Math.max(0, bossRef.hp / bossRef.maxHp), 10); }
    // banners
    var y0 = Math.max(gyS * 0.32, top + (W < 600 ? 160 : 86)) + (bossRef && !bossRef.dead ? (W < 600 ? 40 : 46) : 0);
    banners.forEach(function (b, i) { if (i > 0) return; var a = Math.min(1, b.t * 3, (b.dur || 3) - b.t + 1); c.globalAlpha = Math.max(0, Math.min(1, a)); c.textAlign = 'center'; c.font = K.font(Math.min(36, W / 12)); c.lineWidth = 7; c.strokeStyle = 'rgba(20,10,30,0.85)'; c.strokeText(b.title, W / 2, y0); c.fillStyle = b.col; c.fillText(b.title, W / 2, y0); if (b.sub) { c.font = K.font(Math.min(17, W / 24), 700); if (c.measureText(b.sub).width > W - 24) c.font = K.font(Math.max(10, Math.min(17, W / 24) * (W - 24) / c.measureText(b.sub).width), 700); c.lineWidth = 5; c.strokeText(b.sub, W / 2, y0 + 30); c.fillStyle = '#FFFFFF'; c.fillText(b.sub, W / 2, y0 + 30); } c.globalAlpha = 1; });
    if (story) drawObjective(c, K, top);
    if (introT > 0 && story) { c.globalAlpha = Math.min(1, introT * 2); c.textAlign = 'center'; c.font = K.font(Math.min(56, W / 8)); c.lineWidth = 9; c.strokeStyle = 'rgba(20,10,30,0.9)'; var lt = (story.nm ? K.t('nightmare') + ' ' : '') + lvName(story.d); c.strokeText(lt, W / 2, gyS * 0.42); c.fillStyle = story.nm ? '#FF3B4E' : CHAPTERS[story.d.ci].col; c.fillText(lt, W / 2, gyS * 0.42); c.font = K.font(Math.min(22, W / 17)); c.lineWidth = 6; var ot = objText(K, story.d); c.strokeText(ot, W / 2, gyS * 0.42 + Math.min(46, W / 9)); c.fillStyle = '#FFFFFF'; c.fillText(ot, W / 2, gyS * 0.42 + Math.min(46, W / 9)); c.globalAlpha = 1; }
    else if (introT > 0) { c.globalAlpha = Math.min(1, introT * 2); c.textAlign = 'center'; c.font = K.font(Math.min(64, W / 7)); c.lineWidth = 9; c.strokeStyle = 'rgba(20,10,30,0.9)'; var wt = (wave % 5 === 0 ? K.t('bossWave') + ' · ' : '') + '\u221E ' + K.t('wave') + ' ' + wave; c.strokeText(wt, W / 2, gyS * 0.5); c.fillStyle = wave % 5 === 0 ? '#FF3B4E' : '#FFE15A'; c.fillText(wt, W / 2, gyS * 0.5); c.globalAlpha = 1; }
    // touch controls
    if (touchUI && mode !== 'down') {
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
    } else if (((wave <= 1 && !story) || (story && story.d.idx === 0)) && mode === 'fight') {
      c.font = K.font(13, 700); c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,0.85)';
      c.fillText(K.t('keys'), W / 2, K.H - 14);
    }
    // tutorial hand
    if (K.tutorial && mode === 'fight' && wave === 1 && tutT < 9 && touchUI) { var B2 = btns(K), tb = tutT < 3 ? B2.right : tutT < 6.5 ? B2.atk : B2.shoot, kk = (tutT * 1.5) % 1; K.drawHand(c, tb.x, tb.y, kk > 0.3, Math.min(W, K.H) / 190); }
  }
  function drawObjective(c, K, top) {
    var s = story, d = s.d, W = K.W, txt, frac = -1;
    if (d.o === 'c') txt = K.t('left') + ' ' + (queue.length + zombies.length);
    else if (d.o === 'r') txt = K.t('survivors') + ' ' + cages.filter(function (c2) { return c2.freed; }).length + '/' + cages.length;
    else if (d.o === 's') { txt = K.t('oS') + ' ' + Math.ceil(s.timer) + 's'; frac = s.timer / d.t; }
    else if (d.o === 'd') { txt = K.t('lantern') + ' · ' + Math.ceil(s.timer) + 's'; frac = lantern ? lantern.hp / lantern.maxHp : 0; }
    else txt = bossNames(K, d);
    var w = Math.min(200, W - 226), x = W - w - 10, y = W < 600 ? top : top + 34;
    if (w < 90) { x = 10; y = top + 128; w = 170; }
    c.fillStyle = 'rgba(20,10,30,0.66)'; K.roundRect(c, x, y, w, frac >= 0 ? 40 : 30, 12); c.fill();
    c.fillStyle = CHAPTERS[d.ci].col; c.font = K.font(10, 800); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(lvName(d), x + 10, y + 15);
    c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(14, w / 12)); c.textAlign = 'right'; c.fillText(txt, x + w - 10, y + 15);
    if (frac >= 0) { c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(x + 10, y + 28, w - 20, 6); c.fillStyle = d.o === 'd' ? (frac > 0.3 ? '#FFE15A' : '#FF3B4E') : '#3EE0FF'; c.fillRect(x + 10, y + 28, (w - 20) * Math.max(0, frac), 6); }
    c.textAlign = 'center';
  }
  /* ---------------- hero pick & perk screens ---------------- */
  function drawPick(c, K) {
    var W = K.W, H = K.H; ui = [];
    c.fillStyle = 'rgba(15,8,25,0.72)'; c.fillRect(0, 0, W, H);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = K.font(Math.min(36, W / 11, H / 13)); c.fillStyle = '#FFFFFF'; c.fillText(K.t('choose'), W / 2, K.hudH + Math.min(24, H / 30));
    // mode toggle: STORY | INFINITY
    var py = K.hudH + Math.min(24, H / 30) + Math.min(26, H / 15), ph = Math.min(26, H / 17), pw = Math.min(170, (W - 40) / 2);
    [['story', K.t('story') + ' · ' + totalStars(false) + '\u2605'], ['inf', '\u221E ' + K.t('infShort') + (bestWave ? ' · ' + bestWave : '')]].forEach(function (pp, i) {
      var on = (pp[0] === 'story') === storyMode, x = W / 2 + (i ? 4 : -pw - 4);
      c.fillStyle = on ? (i ? '#FFD43B' : '#FF8A5B') : 'rgba(255,255,255,0.1)'; K.roundRect(c, x, py - ph / 2, pw, ph, ph / 2); c.fill();
      c.fillStyle = on ? '#1A0E00' : '#FFFFFF'; c.font = K.font(Math.min(13, pw / 11, ph * 0.55), 800); c.fillText(pp[1], x + pw / 2, py + 1);
      ui.push({ x: x, y: py - ph / 2 - 4, w: pw, h: ph + 8, act: 'smode', v: pp[0] === 'story' });
    });
    var own = owned(), n = HEROES.length, land = W > H * 1.1, gap = 12, cw, ch, x0, y0;
    if (land) { cw = Math.min(210, (W - 40 - gap * (n - 1)) / n); ch = Math.min(H - K.hudH - 56 - 40 - Math.min(24, H / 30) * 2, cw * 1.55); x0 = (W - (cw * n + gap * (n - 1))) / 2; y0 = K.hudH + Math.min(52, H / 12); }
    else { cw = Math.min(200, (W - 36 - gap) / 2); ch = Math.min((H - K.hudH - 150 - gap) / 2, cw * 1.5); x0 = (W - (cw * 2 + gap)) / 2; y0 = K.hudH + 50; }
    HEROES.forEach(function (h, i) {
      var x = land ? x0 + i * (cw + gap) : x0 + (i % 2) * (cw + gap), y = (land ? y0 : y0 + Math.floor(i / 2) * (ch + gap)) + Math.min(14, H / 30), isSel = sel === i, own2 = own.indexOf(h.id) >= 0;
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
    var bh = Math.min(56, H / 7), tw = Math.min(400, W - 32), bw = tw * 0.62, sw = tw - bw - 10, bx = (W - tw) / 2 + sw + 10, by = H - bh - Math.min(22, H / 25), h0 = HEROES[sel], own3 = own.indexOf(h0.id) >= 0, sx0 = (W - tw) / 2;
    c.fillStyle = 'rgba(0,0,0,0.35)'; K.roundRect(c, sx0, by + 5, sw, bh, 28); c.fill(); c.fillStyle = '#3B82F6'; K.roundRect(c, sx0, by, sw, bh, 28); c.fill();
    c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(20, sw / 5)); c.fillText(K.t('shop'), sx0 + sw / 2, by + bh / 2 + 1);
    ui.push({ x: sx0, y: by, w: sw, h: bh, act: 'shop' });
    c.font = K.font(Math.min(12, W / 34), 700); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillText(K.t('gunLabel') + ': ' + L(K, GUNS[equippedGun()].name) + '   \u2665 x' + (inv().heart || 0), W / 2, by - Math.min(12, H / 40));
    var gr = c.createLinearGradient(bx, by, bx + bw, by); gr.addColorStop(0, own3 ? '#FF3B4E' : '#FFB020'); gr.addColorStop(1, own3 ? '#FF8A1F' : '#FF8A1F');
    c.fillStyle = 'rgba(0,0,0,0.35)'; K.roundRect(c, bx, by + 5, bw, bh, 28); c.fill(); c.fillStyle = gr; K.roundRect(c, bx, by, bw, bh, 28); c.fill();
    c.fillStyle = '#FFFFFF'; c.font = K.font(24); c.fillText(own3 ? (storyMode ? K.t('story') + ' \u25B6' : K.t('fight')) : K.t('unlock') + ' · ' + h0.price, bx + bw / 2, by + bh / 2 + 1);
    ui.push({ x: bx, y: by, w: bw, h: bh, act: 'go' });
  }
  /* ---------------- shop screen ---------------- */
  function shopAct(K) {
    if (shopTab === 'guns') {
      var id = GUN_ORDER[shopSel], g = GUNS[id], own = ownedGuns();
      if (own.indexOf(id) >= 0) { K.store.set('ink:gun', id); curGun = id; K.sfx('reload'); return; }
      if (K.spend(g.price)) { own.push(id); K.store.set('ink:guns', own); K.store.set('ink:gun', id); curGun = id; K.sfx('reward'); K.confetti(40); gunSfx(K, g); }
      else { K.sfx('wrong'); K.toast(K.t('needCoins')); }
    } else {
      var k = ITEM_ORDER[shopSel], it = ITEMS[k], b = inv();
      if (b[k] >= it.max) { K.sfx('wrong'); K.toast(K.t('maxed')); return; }
      if (K.spend(it.price)) { b[k]++; saveInv(b); bag = b; K.sfx('coin'); }
      else { K.sfx('wrong'); K.toast(K.t('needCoins')); }
    }
  }
  function watchAdForCoins(K) {
    if (Date.now() < adReadyAt) { K.toast(K.t('adWait')); return; }
    K.rewarded(function (ok) { if (ok) { K.addCoins(60); adReadyAt = Date.now() + 90000; K.sfx('reward'); K.toast('+60'); } });
  }
  function bar(c, x, y, w, v, col) { c.fillStyle = 'rgba(255,255,255,0.13)'; c.fillRect(x, y, w, 6); c.fillStyle = col; c.fillRect(x, y, w * Math.max(0.04, v), 6); }
  function drawShop(c, K) {
    var W = K.W, H = K.H; ui = [];
    c.fillStyle = 'rgba(12,6,22,0.86)'; c.fillRect(0, 0, W, H);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    var top = K.hudH + 4, list = shopTab === 'guns' ? GUN_ORDER : ITEM_ORDER, ownG = ownedGuns(), eq = equippedGun(), b = inv();
    // header: back, tabs, ad
    c.fillStyle = 'rgba(255,255,255,0.12)'; K.roundRect(c, 10, top, 64, 36, 18); c.fill(); c.fillStyle = '#FFFFFF'; c.font = K.font(14); c.fillText(K.t('back'), 42, top + 18);
    ui.push({ x: 10, y: top, w: 64, h: 36, act: 'back' });
    var tw = Math.min(260, W - 200), tx = (W - tw) / 2;
    ['guns', 'items'].forEach(function (t, i) { var x = tx + i * tw / 2; c.fillStyle = shopTab === t ? '#FFB020' : 'rgba(255,255,255,0.12)'; K.roundRect(c, x + 2, top, tw / 2 - 4, 36, 18); c.fill(); c.fillStyle = shopTab === t ? '#1A0E00' : '#FFFFFF'; c.font = K.font(15); c.fillText(K.t(t), x + tw / 4, top + 18); ui.push({ x: x, y: top, w: tw / 2, h: 36, act: 'tab', tab: t }); });
    var aw = Math.min(110, W - tx - tw - 18), ax = W - aw - 10, ready = Date.now() >= adReadyAt;
    if (aw > 60) { c.fillStyle = ready ? '#22C55E' : 'rgba(255,255,255,0.12)'; K.roundRect(c, ax, top, aw, 36, 18); c.fill(); c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(13, aw / 8)); c.fillText(K.t('adCoins'), ax + aw / 2, top + 18); ui.push({ x: ax, y: top, w: aw, h: 36, act: 'ad' }); }
    if (W > H * 1.1 && H - top < 330) { drawShopCompact(c, K, top, list, ownG, eq, b); return; }
    // cards (4 per page)
    var land = W > H * 1.1, cols = land ? 4 : 2, rows = land ? 1 : 2, gap = 10, y0 = top + 46, availH = H - y0 - 74;
    var cw = Math.min(230, (W - 20 - gap * (cols - 1)) / cols), ch = Math.min(260, (availH - gap * (rows - 1)) / rows), x0 = (W - (cw * cols + gap * (cols - 1))) / 2;
    var pages = Math.ceil(list.length / 4); shopPage = Math.min(shopPage, pages - 1);
    for (var i = 0; i < 4; i++) {
      var idx = shopPage * 4 + i; if (idx >= list.length) break;
      var x = x0 + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + gap), id = list[idx], isSel = idx === shopSel;
      c.fillStyle = isSel ? 'rgba(255,255,255,0.17)' : 'rgba(255,255,255,0.07)'; K.roundRect(c, x, y, cw, ch, 16); c.fill();
      if (isSel) { c.strokeStyle = '#FFB020'; c.lineWidth = 3; c.stroke(); }
      ui.push({ x: x, y: y, w: cw, h: ch, act: 'card', i: idx });
      var fs = Math.min(15, cw / 11, ch / 9);
      if (shopTab === 'guns') {
        var g = gunDef(id), owned = ownG.indexOf(id) >= 0, isEq = eq === id;
        c.fillStyle = '#FFFFFF'; c.font = K.font(fs); c.fillText(id === 'sig' ? L(K, GUNS.sig.name) + ' · ' + L(K, hero.def.name) : L(K, GUNS[id].name), x + cw / 2, y + fs);
        var gy = y + fs * 2 + ch * 0.1; c.save(); c.translate(x + cw / 2 - 30 * Math.min(1.6, cw / 110), gy); drawGun(c, g.look, Math.min(1.6, cw / 110, ch / 90)); c.restore();
        var labels = [K.t('sDmg'), K.t('sRate'), K.t('sMag'), K.t('sReload'), K.t('sRange')], vals = gunStats(g), rowH = Math.min(13, (ch - fs * 2 - ch * 0.22 - 30) / 5.5), sy0 = gy + ch * 0.12;
        c.font = K.font(Math.max(8, Math.min(10, rowH * 0.85)), 700); c.textAlign = K.rtl ? 'right' : 'left';
        labels.forEach(function (lb, li) { var yy = sy0 + li * rowH; c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillText(lb, K.rtl ? x + cw - 8 : x + 8, yy + 3); bar(c, x + cw * 0.46, yy, cw * 0.48, vals[li], ['#FF5A4E', '#FFB020', '#3EE0FF', '#4ADE80', '#B06CFF'][li]); });
        c.textAlign = 'center';
        var dps = Math.round(g.dmg * g.pel / g.rate), extra = GUN_EXTRA[id] ? L(K, GUN_EXTRA[id]) : '';
        c.fillStyle = '#FFE58A'; c.font = K.font(Math.min(11, cw / 16), 800); c.fillText(K.t('dps') + ' ' + dps + (extra && ch > 190 ? '' : ''), x + cw / 2, sy0 + 5 * rowH + 6);
        if (extra && ch > 200) { c.fillStyle = 'rgba(255,255,255,0.75)'; c.font = K.font(Math.min(10, cw / 19), 700); c.fillText(extra, x + cw / 2, sy0 + 5 * rowH + 20); }
        var pt = isEq ? K.t('equipped') : owned ? K.t('owned') : String(g.price === undefined ? GUNS[id].price : GUNS[id].price);
        c.fillStyle = isEq ? '#22C55E' : owned ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)'; K.roundRect(c, x + cw / 2 - 48, y + ch - 30, 96, 22, 11); c.fill();
        if (!owned) K.drawCoin(c, x + cw / 2 - 30, y + ch - 19, 7);
        c.fillStyle = '#FFFFFF'; c.font = K.font(12); c.fillText(pt, x + cw / 2 + (owned ? 0 : 8), y + ch - 18);
      } else {
        var it = ITEMS[id], ir = Math.min(26, ch * 0.16, cw * 0.18);
        drawItemIcon(c, id, x + cw / 2, y + ir + 12, ir);
        c.fillStyle = '#FFFFFF'; c.font = K.font(fs); c.fillText(L(K, it.name), x + cw / 2, y + ir * 2 + 26);
        c.fillStyle = 'rgba(255,255,255,0.75)'; c.font = K.font(Math.min(12, cw / 15), 700); c.fillText(L(K, it.desc), x + cw / 2, y + ir * 2 + 26 + fs + 2);
        c.fillStyle = '#FFE58A'; c.font = K.font(Math.min(12, cw / 14)); c.fillText(K.t('have') + ' ' + b[id] + ' / ' + it.max, x + cw / 2, y + ir * 2 + 26 + fs * 2 + 8);
        c.fillStyle = 'rgba(0,0,0,0.5)'; K.roundRect(c, x + cw / 2 - 40, y + ch - 30, 80, 22, 11); c.fill(); K.drawCoin(c, x + cw / 2 - 22, y + ch - 19, 7);
        c.fillStyle = '#FFFFFF'; c.font = K.font(12); c.fillText(it.price, x + cw / 2 + 8, y + ch - 18);
      }
    }
    // bottom: pages + action
    var by = H - 62, bw = Math.min(260, W - 140), bx = (W - bw) / 2;
    if (pages > 1) [[-1, bx - 54], [1, bx + bw + 10]].forEach(function (pg) { c.fillStyle = 'rgba(255,255,255,0.14)'; K.roundRect(c, pg[1], by, 44, 48, 16); c.fill(); c.fillStyle = '#FFFFFF'; c.font = K.font(22); c.fillText(pg[0] < 0 ? '‹' : '›', pg[1] + 22, by + 23); ui.push({ x: pg[1], y: by, w: 44, h: 48, act: 'page', d: pg[0] }); });
    var label, col = '#FFB020';
    if (shopTab === 'guns') { var gid = GUN_ORDER[shopSel], ow = ownG.indexOf(gid) >= 0; label = eq === gid ? K.t('equipped') : ow ? K.t('equip') : K.t('buy') + ' · ' + GUNS[gid].price; if (eq === gid) col = '#22C55E'; else if (ow) col = '#3B82F6'; }
    else { var iid = ITEM_ORDER[shopSel]; label = b[iid] >= ITEMS[iid].max ? K.t('maxed') : K.t('buy') + ' · ' + ITEMS[iid].price; }
    c.fillStyle = 'rgba(0,0,0,0.35)'; K.roundRect(c, bx, by + 4, bw, 48, 24); c.fill(); c.fillStyle = col; K.roundRect(c, bx, by, bw, 48, 24); c.fill();
    c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(20, bw / 10)); c.fillText(label, W / 2, by + 24);
    ui.push({ x: bx, y: by, w: bw, h: 48, act: 'buy' });
  }
  function gunNumbers(g) { return [String(g.dmg) + (g.pel > 1 ? ' ×' + g.pel : ''), (1 / g.rate).toFixed(1) + '/s', String(g.mag), g.reload.toFixed(1) + ' s', Math.round(g.spd * g.life / 10) + ' m']; }
  function drawShopCompact(c, K, top, list, ownG, eq, b) {
    var W = K.W, H = K.H, y0 = top + 44, bottom = H - 8, lw = Math.min(230, W * 0.36), rh = Math.max(26, Math.min(34, (bottom - y0) / 6)), n = Math.max(3, Math.floor((bottom - y0 - 30) / rh));
    var start = Math.max(0, Math.min(list.length - n, shopSel - Math.floor(n / 2)));
    c.textBaseline = 'middle';
    for (var r = 0; r < n && start + r < list.length; r++) {
      var idx = start + r, id = list[idx], y = y0 + r * rh, isSel = idx === shopSel;
      c.fillStyle = isSel ? '#FFB020' : 'rgba(255,255,255,0.08)'; K.roundRect(c, 10, y + 2, lw, rh - 4, 10); c.fill();
      c.textAlign = 'left'; c.font = K.font(Math.min(14, rh * 0.45)); c.fillStyle = isSel ? '#1A0E00' : '#FFFFFF';
      var nm = shopTab === 'guns' ? (id === 'sig' ? L(K, GUNS.sig.name) : L(K, GUNS[id].name)) : L(K, ITEMS[id].name) + ' (' + b[id] + ')';
      c.fillText(nm, 20, y + rh / 2);
      c.textAlign = 'right'; c.font = K.font(Math.min(12, rh * 0.4));
      var tag = shopTab === 'guns' ? (eq === id ? '✓' : ownG.indexOf(id) >= 0 ? K.t('owned') : GUNS[id].price) : ITEMS[id].price;
      c.fillText(tag, 10 + lw - 10, y + rh / 2);
      ui.push({ x: 10, y: y, w: lw, h: rh, act: 'card', i: idx });
    }
    if (list.length > n) { [[-1, '▲'], [1, '▼']].forEach(function (a, i) { var bx = 10 + i * (lw / 2 + 4), by = y0 + n * rh + 2; c.fillStyle = 'rgba(255,255,255,0.12)'; K.roundRect(c, bx, by, lw / 2 - 4, 26, 10); c.fill(); c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.font = K.font(13); c.fillText(a[1], bx + lw / 4 - 2, by + 13); ui.push({ x: bx, y: by, w: lw / 2 - 4, h: 26, act: 'scroll', d: a[0] * (n - 1) }); }); }
    // detail panel
    var dx = lw + 22, dw = W - dx - 10, dh = bottom - y0;
    c.fillStyle = 'rgba(255,255,255,0.07)'; K.roundRect(c, dx, y0 + 2, dw, dh - 2, 16); c.fill();
    var bw = Math.min(200, dw * 0.42), bh = Math.min(44, dh * 0.24), bx = dx + dw - bw - 12, by = y0 + dh - bh - 10, label, col = '#FFB020';
    c.textAlign = 'left';
    if (shopTab === 'guns') {
      var id2 = GUN_ORDER[shopSel], g = gunDef(id2), ow = ownG.indexOf(id2) >= 0;
      c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(20, dh / 9)); c.fillText(id2 === 'sig' ? L(K, GUNS.sig.name) + ' · ' + L(K, hero.def.name) : L(K, GUNS[id2].name), dx + 14, y0 + 20);
      c.save(); c.translate(dx + dw - 130, y0 + 34); drawGun(c, g.look, Math.min(1.7, dh / 120)); c.restore();
      var labels = [K.t('sDmg'), K.t('sRate'), K.t('sMag'), K.t('sReload'), K.t('sRange')], vals = gunStats(g), nums = gunNumbers(g), rh2 = Math.min(18, (dh - bh - 60) / 5.3), sw = dw - 200;
      c.font = K.font(Math.min(12, rh2 * 0.75), 700);
      labels.forEach(function (lb, li) { var yy = y0 + 42 + li * rh2; c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillText(lb, dx + 14, yy + 3); bar(c, dx + 96, yy, Math.max(60, sw), vals[li], ['#FF5A4E', '#FFB020', '#3EE0FF', '#4ADE80', '#B06CFF'][li]); c.fillStyle = '#FFFFFF'; c.fillText(nums[li], dx + 104 + Math.max(60, sw), yy + 3); });
      c.fillStyle = '#FFE58A'; c.font = K.font(13); c.fillText(K.t('dps') + ' ' + Math.round(g.dmg * g.pel / g.rate) + (GUN_EXTRA[id2] ? ' · ' + L(K, GUN_EXTRA[id2]) : ''), dx + 14, by + bh / 2);
      label = eq === id2 ? K.t('equipped') : ow ? K.t('equip') : K.t('buy') + ' · ' + GUNS[id2].price; if (eq === id2) col = '#22C55E'; else if (ow) col = '#3B82F6';
    } else {
      var k = ITEM_ORDER[shopSel], it = ITEMS[k], ir = Math.min(34, dh * 0.2);
      drawItemIcon(c, k, dx + 14 + ir, y0 + 14 + ir, ir);
      c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(22, dh / 8)); c.fillText(L(K, it.name), dx + 28 + ir * 2, y0 + 14 + ir * 0.6);
      c.fillStyle = 'rgba(255,255,255,0.8)'; c.font = K.font(Math.min(14, dh / 11), 700); c.fillText(L(K, it.desc), dx + 28 + ir * 2, y0 + 14 + ir * 1.4);
      c.fillStyle = '#FFE58A'; c.font = K.font(14); c.fillText(K.t('have') + ' ' + b[k] + ' / ' + it.max, dx + 14, by + bh / 2);
      label = b[k] >= it.max ? K.t('maxed') : K.t('buy') + ' · ' + it.price;
    }
    c.textAlign = 'center';
    c.fillStyle = 'rgba(0,0,0,0.35)'; K.roundRect(c, bx, by + 4, bw, bh, bh / 2); c.fill(); c.fillStyle = col; K.roundRect(c, bx, by, bw, bh, bh / 2); c.fill();
    c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(18, bw / 9)); c.fillText(label, bx + bw / 2, by + bh / 2);
    ui.push({ x: bx, y: by, w: bw, h: bh, act: 'buy' });
  }
  function drawDown(c, K) {
    var W = K.W, H = K.H; ui = [];
    c.fillStyle = 'rgba(30,0,10,0.6)'; c.fillRect(0, 0, W, H);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(30, W / 13)); c.fillText(K.t('reviveQ'), W / 2, H * 0.28);
    var r = Math.min(70, H * 0.13, W * 0.18), cx = W / 2, cy = H * 0.5, pulse = 1 + Math.sin(K.time * 8) * 0.05;
    c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 8; c.beginPath(); c.arc(cx, cy, r * 1.25, 0, TAU); c.stroke();
    c.strokeStyle = '#FF3B6B'; c.beginPath(); c.arc(cx, cy, r * 1.25, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0, downT) / 6); c.stroke();
    c.save(); c.translate(cx, cy); c.scale(pulse, pulse); drawItemIcon(c, 'heart', 0, 0, r); c.restore();
    c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(22, W / 18)); c.fillText(K.t('revive') + ' (x' + bag.heart + ')', cx, cy + r * 1.25 + 30);
    ui.push({ x: cx - r * 1.3, y: cy - r * 1.3, w: r * 2.6, h: r * 2.6 + 40, act: 'revive' });
    c.font = K.font(16, 700); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillText(K.t('giveUp'), cx, H - 50);
    ui.push({ x: cx - 80, y: H - 72, w: 160, h: 44, act: 'giveup' });
  }
  function choosePerks(K) {
    var keys2 = Object.keys(PERKS).filter(function (k) { return !(k === 'buddy' && mods.buddy >= 2) && !(k === 'mend' && hero.hp > hero.maxHp * 0.8); });
    keys2.sort(function () { return Math.random() - 0.5; }); perkOpts = keys2.slice(0, 3); perkSel = 0;
    if (hero.hp < hero.maxHp * 0.45 && perkOpts.indexOf('mend') < 0 && keys2.indexOf('mend') >= 0) perkOpts[2] = 'mend';
  }
  function applyPerk(K, k) {
    if (k === 'iron') { mods.maxHp += 30; hero.maxHp += 30; hero.hp = Math.min(hero.maxHp, hero.hp + 30); }
    else if (k === 'fists') mods.melee *= 1.2; else if (k === 'trigger') mods.rate *= 1.25; else if (k === 'mag') { mods.mag *= 1.5; hero.ammo = baseMag(); }
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
    picked = h.id; K.store.set('ink:hero', h.id); K.sfx('click');
    if (storyMode) goMap(K); else startRun(K);
  }
  /* ---------------- story screens: map, cutscene, results ---------------- */
  function nodePos(K, i) {
    var W = K.W, H = K.H, land = W > H * 1.1, cols = land ? 8 : 4, top = K.hudH + 96, bot = H - (land ? 128 : 170), r = Math.min(land ? 26 : 30, W / (cols * 3.2), (bot - top) / 5);
    var row = Math.floor(i / cols), col = i % cols; if (row % 2) col = cols - 1 - col;
    var rows = Math.ceil(8 / cols), x = W * 0.5 + (col - (cols - 1) / 2) * Math.min((W - 40) / cols, 140), y = top + (bot - top) * (rows === 1 ? 0.5 : (0.25 + row * 0.5)) + (land ? Math.sin(i * 1.4) * (bot - top) * 0.18 : 0);
    return { x: x, y: y, r: r };
  }
  function drawLock(c, x, y, s) { c.fillStyle = '#FFFFFF'; c.strokeStyle = '#FFFFFF'; c.lineWidth = s * 0.25; c.beginPath(); c.arc(x, y - s * 0.3, s * 0.45, Math.PI, 0); c.stroke(); c.fillRect(x - s * 0.6, y - s * 0.3, s * 1.2, s * 0.9); }
  function drawStars3(c, x, y, r, n, gap) { for (var i = 0; i < 3; i++) { c.save(); c.translate(x + (i - 1) * gap, y); c.fillStyle = i < n ? '#FFD43B' : 'rgba(255,255,255,0.2)'; K0.star(c, r); c.restore(); } }
  function drawMap(c, K) {
    var W = K.W, H = K.H, ch = CHAPTERS[mapCh], top = K.hudH + 6, um = unlockedMax(nmOn); ui = [];
    var vg = c.createLinearGradient(0, 0, 0, H); vg.addColorStop(0, 'rgba(10,5,20,0.75)'); vg.addColorStop(0.5, 'rgba(10,5,20,0.35)'); vg.addColorStop(1, 'rgba(10,5,20,0.85)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(255,255,255,0.14)'; K.roundRect(c, 10, top, 70, 34, 17); c.fill(); c.fillStyle = '#FFFFFF'; c.font = K.font(14); c.fillText(K.t('back'), 45, top + 17); ui.push({ x: 10, y: top, w: 70, h: 34, act: 'mback' });
    if (prog.nm) { var nw = Math.min(130, W * 0.3); c.fillStyle = nmOn ? '#FF3B4E' : 'rgba(255,255,255,0.14)'; K.roundRect(c, W - nw - 10, top, nw, 34, 17); c.fill(); c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(13, nw / 9)); c.fillText(K.t('nightmare'), W - nw / 2 - 10, top + 17); ui.push({ x: W - nw - 10, y: top, w: nw, h: 34, act: 'nm' }); }
    c.font = K.font(11, 800); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillText(K.t('storyTitle') + ' · ' + totalStars(nmOn) + '/' + NLV * 3 + '\u2605', W / 2, top + 17);
    var ty = top + 56; c.font = K.font(Math.min(24, W / 16)); c.fillStyle = nmOn ? '#FF3B4E' : ch.col; c.fillText(K.t('chapter') + ' ' + (mapCh + 1) + ' · ' + L(K, ch.name), W / 2, ty);
    [[-1, '\u25C0', 22], [1, '\u25B6', W - 22]].forEach(function (a) { var en = a[0] < 0 ? mapCh > 0 : mapCh < CHAPTERS.length - 1 && um >= (mapCh + 1) * 8; c.fillStyle = en ? '#FFFFFF' : 'rgba(255,255,255,0.2)'; c.font = K.font(22); c.fillText(a[1], a[2], ty); if (en) ui.push({ x: a[2] - 22, y: ty - 22, w: 44, h: 44, act: 'mch', d: a[0] }); });
    // path + nodes
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 4; c.setLineDash([8, 8]); c.beginPath(); for (var i = 0; i < 8; i++) { var p = nodePos(K, i); if (i) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); } c.stroke(); c.setLineDash([]);
    for (var j = 0; j < 8; j++) {
      var q = nodePos(K, j), idx = mapCh * 8 + j, lock = idx > um, stc = starsOf(idx, nmOn), d = lvDef(idx), boss = d.o === 'b', r = q.r * (boss ? 1.25 : 1), isSel = mapSel === j;
      if (isSel) { c.strokeStyle = '#FFFFFF'; c.lineWidth = 3; c.beginPath(); c.arc(q.x, q.y, r + 7 + Math.sin(K.time * 5) * 2, 0, TAU); c.stroke(); }
      c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.arc(q.x, q.y + 4, r, 0, TAU); c.fill();
      c.fillStyle = lock ? '#3A3046' : boss ? '#FF3B4E' : stc ? (nmOn ? '#B0203A' : ch.col) : '#FFFFFF'; c.beginPath(); c.arc(q.x, q.y, r, 0, TAU); c.fill();
      if (lock) drawLock(c, q.x, q.y, r * 0.55);
      else { c.fillStyle = stc || boss ? '#1A0E00' : '#1A0E00'; c.font = K.font(r * (boss ? 0.5 : 0.8)); c.fillText(boss ? K.t('bossWave') : (j + 1), q.x, q.y + 1); }
      if (!lock) drawStars3(c, q.x, q.y + r + 10, Math.max(5, r * 0.26), stc, Math.max(12, r * 0.6));
      ui.push({ x: q.x - r - 6, y: q.y - r - 6, w: 2 * r + 12, h: 2 * r + 26, act: 'node', i: j });
    }
    // level panel + PLAY
    var sd = lvDef(mapCh * 8 + mapSel), slock = sd.idx > um, land = W > H * 1.1, bh = Math.min(54, H / 8), pw = Math.min(520, W - 24), px = (W - pw) / 2, ph = land ? 70 : 104, py = H - ph - bh - 24;
    c.fillStyle = 'rgba(255,255,255,0.09)'; K.roundRect(c, px, py, pw, ph, 16); c.fill();
    c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(18, pw / 20)); c.fillText(lvName(sd) + ' · ' + objText(K, sd), W / 2, py + 18);
    var goals = '\u2605 ' + K.t('star1') + '   \u2605 ' + K.t('star2') + '   \u2605 ' + K.t('star3') + ' ' + comboGoal(sd);
    c.font = K.font(Math.min(12, pw / 40), 700); c.fillStyle = '#FFD43B'; c.fillText(goals, W / 2, py + (land ? 40 : 46));
    if (sd.m) { c.fillStyle = '#FF8A6A'; c.fillText(modText(K, sd), W / 2, py + (land ? 58 : 70)); }
    if (!land) { c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillText(K.t('hero') + ': ' + L(K, heroDef().name) + ' · ' + K.t('gunLabel') + ': ' + L(K, GUNS[equippedGun()].name), W / 2, py + 92); }
    var bw = Math.min(300, W - 40), bx = (W - bw) / 2, by = H - bh - 14;
    c.fillStyle = 'rgba(0,0,0,0.35)'; K.roundRect(c, bx, by + 5, bw, bh, bh / 2); c.fill();
    var gr = c.createLinearGradient(bx, by, bx + bw, by); gr.addColorStop(0, slock ? '#555' : nmOn ? '#B0203A' : '#FF3B4E'); gr.addColorStop(1, slock ? '#444' : '#FF8A1F'); c.fillStyle = gr; K.roundRect(c, bx, by, bw, bh, bh / 2); c.fill();
    c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(24, bw / 9)); c.fillText(slock ? K.t('locked') : K.t('play') + ' ' + lvName(sd), W / 2, by + bh / 2 + 1);
    ui.push({ x: bx, y: by, w: bw, h: bh, act: 'mplay' });
  }
  function wrapText(c, txt, maxW) { var words = txt.split(' '), lines = [], cur = ''; words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; }
  function speakerName(K, who) { if (who === 'nar') return ''; var h = HEROES.filter(function (x) { return x.id === who; })[0]; if (h) return L(K, h.name); var z = ZT[who === 'null' ? 'nullk' : who]; return z ? L(K, z.name) : ''; }
  function drawPortrait(c, K, who, x, gy, size, face) {
    var saveSc = sc, saveCam = camX, saveGy = gyS; sc = size; camX = 0; gyS = gy;
    var h = HEROES.filter(function (q) { return q.id === who; })[0], talk = Math.sin(K.time * 14) * 0.04;
    if (h) { var P0 = pose('idle', K.time * 1.3); P0.hd += talk; P0.fb = 2.0 + Math.sin(K.time * 3) * 0.3; var J = rig(P0, x / sc, 0, face, h.size, true, false); drawRig(c, J, '#111111', '#2B2B2B', h.lw * h.size, null); drawAccessory(c, J, h, face); }
    else { var t = who === 'null' ? 'nullk' : who, d = ZT[t]; if (d) { var size2 = Math.min(1, 1.5 / d.size); sc = size * size2; var z = { d: d, t: t, x: x / sc, y: 0, face: face, hp: 1, maxHp: 1, stun: 0, rise: 0, fuse: 0, shield: 0, pose: d.ai === 'null' ? pose('idle', K.time) : pose('zwalk', K.time * 2), atkT: 0 }; drawZombie(c, K, z); } }
    sc = saveSc; camX = saveCam; gyS = saveGy;
  }
  function drawCut(c, K) {
    var W = K.W, H = K.H, ln = cut.lines[cut.i], who = ln[0], txt = cutText(K, ln), bar = Math.max(26, H * 0.09); ui = [];
    c.fillStyle = 'rgba(8,4,16,0.55)'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#000000'; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
    var hero2 = HEROES.some(function (q) { return q.id === who; }), nar = who === 'nar', land = W > H * 1.1, gy = H - bar - 10, ps = Math.min(H * 0.42, W * 0.6) / 150;
    if (!nar) { var px = hero2 ? W * (land ? 0.22 : 0.3) : W * (land ? 0.78 : 0.7), pf = hero2 ? 1 : -1; c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.ellipse(px, gy, 90 * ps, 14 * ps, 0, 0, TAU); c.fill(); drawPortrait(c, K, who, px, gy, ps, pf); }
    c.font = K.font(Math.min(19, W / 20), 700); var bw = Math.min(W - 32, 560), lines = wrapText(c, txt, bw - 36), lh = Math.min(26, W / 15), bh = lines.length * lh + 34, bx = (W - bw) / 2, by = Math.max(bar, K.hudH + 34) + 14;
    if (nar) { by = H * 0.4 - bh / 2; c.fillStyle = 'rgba(255,240,200,0.94)'; } else c.fillStyle = '#FFFFFF';
    c.fillStyle = nar ? 'rgba(255,240,200,0.94)' : '#FFFFFF'; K.roundRect(c, bx, by, bw, bh, 16); c.fill();
    if (!nar) { var tx = hero2 ? W * (land ? 0.22 : 0.3) : W * (land ? 0.78 : 0.7); c.beginPath(); c.moveTo(clamp(tx - 14, bx + 20, bx + bw - 40), by + bh - 1); c.lineTo(tx, by + bh + 22); c.lineTo(clamp(tx + 14, bx + 40, bx + bw - 20), by + bh - 1); c.fill(); }
    var nm2 = speakerName(K, who);
    if (nm2) { c.font = K.font(13, 800); var tw = c.measureText(nm2).width + 24, tagx = hero2 ? bx + 14 : bx + bw - tw - 14, col = hero2 ? HEROES.filter(function (q) { return q.id === who; })[0].acc : (ZT[who === 'null' ? 'nullk' : who] || {}).col || '#FF3B4E'; c.fillStyle = col === '#0B0B0B' ? '#111111' : col; K.roundRect(c, tagx, by - 12, tw, 24, 12); c.fill(); c.fillStyle = col === '#E2D23C' || col === '#2FD8C8' ? '#111' : '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(nm2, tagx + tw / 2, by); }
    // typewriter
    c.font = K.font(Math.min(19, W / 20), 700); c.fillStyle = nar ? '#3A2A10' : '#111111'; c.textAlign = 'center'; c.textBaseline = 'middle';
    var left = Math.floor(cut.t);
    lines.forEach(function (l, i) { if (left <= 0) return; var part = l.slice(0, left); left -= l.length + 1; c.fillText(part, W / 2, by + 20 + lh / 2 + i * lh - 2); });
    if (cut.t >= txt.length) { c.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(K.time * 5)) + ')'; c.font = K.font(12, 700); c.fillText(K.t('tapNext') + ' \u25B6', W / 2, H - bar / 2); }
    var sky = Math.max(bar / 2, K.hudH + 16); c.fillStyle = 'rgba(0,0,0,0.45)'; K.roundRect(c, W - 92, sky - 15, 82, 30, 15); c.fill(); c.fillStyle = '#FFFFFF'; c.font = K.font(13, 800); c.fillText(K.t('skip') + ' \u23ED', W - 51, sky); ui.push({ x: W - 100, y: sky - 24, w: 100, h: 48, act: 'cskip' });
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.font = K.font(11, 700); c.fillText((cut.i + 1) + ' / ' + cut.lines.length, 40, sky);
  }
  function drawWin(c, K) {
    var W = K.W, H = K.H, w = winInfo, d = w.d; ui = [];
    c.fillStyle = 'rgba(10,5,20,0.78)'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.textBaseline = 'middle';
    var y = K.hudH + Math.min(40, H * 0.07); c.font = K.font(Math.min(40, W / 10)); c.fillStyle = '#FFE15A'; c.fillText(w.ending ? K.t('theEnd') : K.t('lvClear'), W / 2, y);
    c.font = K.font(Math.min(16, W / 24), 800); c.fillStyle = w.nm ? '#FF3B4E' : CHAPTERS[d.ci].col; c.fillText((w.nm ? K.t('nightmare') + ' ' : '') + lvName(d) + ' · ' + L(K, CHAPTERS[d.ci].name), W / 2, y + Math.min(34, H * 0.06));
    var sr = Math.min(36, W / 10, H / 12), sy0 = y + Math.min(34, H * 0.06) + sr * 1.9;
    for (var i = 0; i < 3; i++) { var shown = w.t > 0.3 + i * 0.35, got = w.st[i] && shown, k = shown ? Math.min(1, (w.t - 0.3 - i * 0.35) * 5) : 0; if (shown && !w['s' + i]) { w['s' + i] = true; if (w.st[i]) K.sfx('star'); } c.save(); c.translate(W / 2 + (i - 1) * sr * 2.4, sy0 - (i === 1 ? sr * 0.3 : 0)); c.scale(0.6 + 0.4 * k + (got ? 0.15 * Math.max(0, 1 - (w.t - 0.3 - i * 0.35) * 3) : 0), 0.6 + 0.4 * k); c.fillStyle = got ? '#FFD43B' : 'rgba(255,255,255,0.18)'; K.star(c, sr); c.restore(); }
    var ly = sy0 + sr * 1.5, gl = [K.t('star1'), K.t('star2'), K.t('star3') + ' ' + comboGoal(d)], lh = Math.min(22, H / 26);
    c.font = K.font(Math.min(14, W / 28), 700); gl.forEach(function (g, i) { c.fillStyle = w.st[i] ? '#FFFFFF' : 'rgba(255,255,255,0.45)'; c.fillText((w.st[i] ? '\u2714 ' : '\u2716 ') + g, W / 2, ly + i * lh); });
    var cy = ly + 3 * lh + 10; K.drawCoin(c, W / 2 - 50, cy, 11); c.fillStyle = '#FFE58A'; c.font = K.font(Math.min(22, W / 16)); c.fillText('+' + w.coins, W / 2 + 6, cy + 1); if (w.first) { c.font = K.font(11, 800); c.fillStyle = '#4ADE80'; c.fillText(K.t('firstClear'), W / 2, cy + 22); }
    if (w.unlock || w.ending) { var ut = w.unlock ? L(K, HEROES.filter(function (h) { return h.id === w.unlock; })[0].name) + ' ' + K.t('joins') : K.t('nmUnlocked'), uy = cy + 50; c.fillStyle = 'rgba(255,255,255,0.12)'; K.roundRect(c, W / 2 - Math.min(170, W / 2 - 12), uy - 18, Math.min(340, W - 24), 36, 18); c.fill(); c.fillStyle = w.unlock ? HEROES.filter(function (h) { return h.id === w.unlock; })[0].acc : '#FF3B4E'; c.font = K.font(Math.min(17, W / 22)); c.fillText(ut, W / 2, uy); }
    var bh = Math.min(54, H / 8), bw = Math.min(180, (W - 40) / 2), by = H - bh - 18, last = d.idx + 1 >= NLV;
    [[last ? null : 'wnext', K.t('next') + ' \u25B6', '#FF3B4E'], ['wmap', K.t('map'), '#3B82F6']].forEach(function (b, i) {
      if (!b[0]) return; var bx = last ? (W - bw) / 2 : (i ? W / 2 - bw - 6 : W / 2 + 6);
      c.fillStyle = 'rgba(0,0,0,0.35)'; K.roundRect(c, bx, by + 5, bw, bh, bh / 2); c.fill(); c.fillStyle = b[2]; K.roundRect(c, bx, by, bw, bh, bh / 2); c.fill();
      c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(22, bw / 7)); c.fillText(b[1], bx + bw / 2, by + bh / 2 + 1); ui.push({ x: bx, y: by, w: bw, h: bh, act: b[0] });
    });
  }
  function uiTap(K, u) {
    if (!u) return;
    if (u.act === 'hero') { if (sel === u.i) confirmHero(K); else { sel = u.i; K.sfx('tick'); } }
    else if (u.act === 'go') confirmHero(K);
    else if (u.act === 'perk') { if (perkSel === u.i) applyPerk(K, perkOpts[u.i]); else { perkSel = u.i; K.sfx('tick'); } }
    else if (u.act === 'shop') { mode = 'shop'; shopSel = 0; shopPage = 0; K.sfx('click'); }
    else if (u.act === 'back') { mode = 'pick'; K.sfx('click'); }
    else if (u.act === 'tab') { if (shopTab !== u.tab) { shopTab = u.tab; shopSel = 0; shopPage = 0; K.sfx('click'); } }
    else if (u.act === 'card') { if (shopSel === u.i) shopAct(K); else { shopSel = u.i; K.sfx('tick'); } }
    else if (u.act === 'buy') shopAct(K);
    else if (u.act === 'page') { var n = Math.ceil((shopTab === 'guns' ? GUN_ORDER : ITEM_ORDER).length / 4); shopPage = (shopPage + u.d + n) % n; shopSel = shopPage * 4; K.sfx('tick'); }
    else if (u.act === 'ad') watchAdForCoins(K);
    else if (u.act === 'scroll') { var ln = (shopTab === 'guns' ? GUN_ORDER : ITEM_ORDER).length; shopSel = Math.max(0, Math.min(ln - 1, shopSel + u.d)); K.sfx('tick'); }
    else if (u.act === 'smode') { if (storyMode !== u.v) { storyMode = u.v; K.store.set('ink:mode', storyMode ? 'story' : 'inf'); K.sfx('click'); } }
    else if (u.act === 'mback') { mode = 'pick'; theme = 'ruins'; K.sfx('click'); }
    else if (u.act === 'nm') { nmOn = !nmOn; mapSel = Math.min(mapSel, 7); K.sfx('flip'); }
    else if (u.act === 'mch') { mapCh = clamp(mapCh + u.d, 0, CHAPTERS.length - 1); theme = CHAPTERS[mapCh].theme; mapSel = clamp(unlockedMax(nmOn) - mapCh * 8, 0, 7); K.sfx('tick'); }
    else if (u.act === 'node') { var ni = mapCh * 8 + u.i; if (ni > unlockedMax(nmOn)) { K.sfx('wrong'); K.toast(K.t('locked')); } else if (mapSel === u.i) playLevel(K, ni); else { mapSel = u.i; K.sfx('tick'); } }
    else if (u.act === 'mplay') { var pi = mapCh * 8 + mapSel; if (pi > unlockedMax(nmOn)) { K.sfx('wrong'); K.toast(K.t('locked')); } else playLevel(K, pi); }
    else if (u.act === 'cskip') cutSkip(K);
    else if (u.act === 'wnext') nextLevel(K);
    else if (u.act === 'wmap') goMap(K, Math.min(winInfo.d.idx + 1, unlockedMax(winInfo.nm)));
    else if (u.act === 'revive') useHeart(K);
    else if (u.act === 'giveup') endRun(K);
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
    creator: function (K) { // CREATOR (temporary): all heroes, guns, full items, every story level
      K.store.set('ink:heroes', HEROES.map(function (h) { return h.id; })); K.store.set('ink:guns', Object.keys(GUNS));
      var o = inv(); ITEM_ORDER.forEach(function (k) { o[k] = ITEMS[k].max; }); saveInv(o);
      if (!prog) prog = loadProg(); prog.u = NLV - 1; prog.nu = NLV - 1; prog.nm = true; saveProg();
    },
    id: 'ink-heroes', coinRate: 0.01, noSkins: true, theme: 'dark', mascot: mascot,
    title: { en: 'Ink Heroes', fr: 'Héros d’Encre', ar: 'أبطال الحبر' },
    strings: {
      en: { story: "STORY", infShort: "INFINITY", storyTitle: "THE INKFALL", chapter: "Chapter", play: "PLAY", next: "NEXT", map: "MAP", skip: "Skip", tapNext: "Tap to continue", locked: "Locked", oC: "Defeat every zombie", oR: "Free the survivors", oS: "Survive", oD: "Protect the Ink Lantern", oB: "Defeat", m_swarm: "SWARM: more zombies", m_nogun: "NO GUNS: fists only", m_elite: "ELITE NIGHT: gold zombies", m_dark: "BLACKOUT: stay in the light", star1: "Win", star2: "Keep half your health", star3: "Combo", lvClear: "LEVEL CLEAR!", failed: "Level failed", lanternOut: "The lantern went out", joins: "joins your team!", survivors: "Survivors", left: "Zombies left", lantern: "Lantern", nightmare: "NIGHTMARE", firstClear: "First clear ×2", freed: "FREED!", noGun: "No guns here!", allAboard: "ALL ABOARD!", twinRage: "THE OTHER TWIN IS ANGRY!", phase2: "NULL · PHASE 2", phase2s: "He drew copies of himself!", theEnd: "THE END…?", nmUnlocked: "NIGHTMARE MODE unlocked!", hero: "Hero", tagline: 'A 40-level story and an endless zombie night. Punch, shoot, survive!', choose: 'Choose your hero', fight: 'FIGHT!', unlock: 'Unlock', needCoins: 'Not enough coins yet', wave: 'Wave', bossWave: 'BOSS', cleared: 'Wave cleared!', pickPerk: 'Pick a power-up', combo: 'COMBO', reloading: 'Reloading…', newZ: 'New:', block: 'BLOCK', broken: 'SMASHED!', broke: 'Broken!', empty: 'Empty!', rage: 'RAGE MODE!', overrun: 'Overrun!', reached: 'Fell at wave', record: 'New record!', infinity: 'INFINITY MODE · every wave is harder', bestWave: 'Best wave', eliteT: 'ELITE ZOMBIES!', eliteS: 'Gold glow = tougher, but 3× points and more coins', threat: 'Threat', shop: 'SHOP', guns: 'GUNS', items: 'ITEMS', back: 'Back', buy: 'BUY', equip: 'EQUIP', equipped: 'EQUIPPED', owned: 'OWNED', maxed: 'Full!', have: 'Have', dps: 'DPS', sDmg: 'Damage', sRate: 'Fire rate', sMag: 'Ammo', sReload: 'Reload', sRange: 'Range', adCoins: '+60 · AD', adWait: 'Next ad reward soon', reviveQ: 'You fell! Use a heart?', revive: 'REVIVE', giveUp: 'Give up', revived: 'BACK IN THE FIGHT!', heartSaved: 'Hearts revive you when you fall', fullHp: 'Health is full', airstrike: 'AIRSTRIKE!', tryGun: 'TRY:', tryGunSub: 'Like it? Buy it in the shop', gunLabel: 'Gun', bAtk: 'HIT', bJump: 'JUMP', bShoot: 'FIRE', bSpec: 'POWER', sPow: 'POWER', sSpd: 'SPEED', sHp: 'HEALTH', keys: '←/→ move · W jump · J hit · K fire · L power · R reload' },
      fr: { story: "HISTOIRE", infShort: "INFINI", storyTitle: "LA CHUTE D’ENCRE", chapter: "Chapitre", play: "JOUER", next: "SUIVANT", map: "CARTE", skip: "Passer", tapNext: "Touche pour continuer", locked: "Verrouillé", oC: "Élimine tous les zombies", oR: "Libère les survivants", oS: "Survis", oD: "Protège la Lanterne d’encre", oB: "Bats", m_swarm: "ESSAIM : plus de zombies", m_nogun: "SANS ARMES : poings seulement", m_elite: "NUIT D’ÉLITE : zombies dorés", m_dark: "PANNE : reste dans la lumière", star1: "Gagne", star2: "Garde la moitié de ta vie", star3: "Combo", lvClear: "NIVEAU RÉUSSI !", failed: "Niveau raté", lanternOut: "La lanterne s’est éteinte", joins: "rejoint ton équipe !", survivors: "Survivants", left: "Zombies restants", lantern: "Lanterne", nightmare: "CAUCHEMAR", firstClear: "Première victoire ×2", freed: "LIBÉRÉ !", noGun: "Pas d’armes ici !", allAboard: "EN VOITURE !", twinRage: "L’AUTRE JUMEAU EST FURIEUX !", phase2: "NULL · PHASE 2", phase2s: "Il a dessiné des copies de lui !", theEnd: "FIN… ?", nmUnlocked: "MODE CAUCHEMAR débloqué !", hero: "Héros", tagline: 'Une histoire de 40 niveaux et une nuit zombie sans fin. Frappe, tire, survis !', choose: 'Choisis ton héros', fight: 'COMBAT !', unlock: 'Débloquer', needCoins: 'Pas encore assez de pièces', wave: 'Vague', bossWave: 'BOSS', cleared: 'Vague terminée !', pickPerk: 'Choisis un bonus', combo: 'COMBO', reloading: 'Rechargement…', newZ: 'Nouveau :', block: 'BLOQUÉ', broken: 'BRISÉ !', broke: 'Cassé !', empty: 'Vide !', rage: 'MODE FURIE !', overrun: 'Submergé !', reached: 'Tombé à la vague', record: 'Nouveau record !', infinity: 'MODE INFINI · chaque vague est plus dure', bestWave: 'Meilleure vague', eliteT: 'ZOMBIES D\u2019ÉLITE !', eliteS: 'Lueur dorée = plus coriaces, mais 3× points et plus de pièces', threat: 'Menace', shop: 'BOUTIQUE', guns: 'ARMES', items: 'OBJETS', back: 'Retour', buy: 'ACHETER', equip: 'ÉQUIPER', equipped: 'ÉQUIPÉE', owned: 'ACQUISE', maxed: 'Plein !', have: 'Possédé', dps: 'DPS', sDmg: 'Dégâts', sRate: 'Cadence', sMag: 'Munitions', sReload: 'Recharge', sRange: 'Portée', adCoins: '+60 · PUB', adWait: 'Prochaine récompense bientôt', reviveQ: 'Tu es tombé ! Utiliser un cœur ?', revive: 'REVIVRE', giveUp: 'Abandonner', revived: 'DE RETOUR AU COMBAT !', heartSaved: 'Les cœurs te relèvent quand tu tombes', fullHp: 'Vie au maximum', airstrike: 'FRAPPE AÉRIENNE !', tryGun: 'ESSAIE :', tryGunSub: 'Elle te plaît ? Achète-la en boutique', gunLabel: 'Arme', bAtk: 'FRAPPE', bJump: 'SAUT', bShoot: 'TIR', bSpec: 'POUVOIR', sPow: 'PUISSANCE', sSpd: 'VITESSE', sHp: 'VIE', keys: '←/→ bouger · W sauter · J frapper · K tirer · L pouvoir · R recharger' },
      ar: { story: "القصة", infShort: "لا نهائي", storyTitle: "سقوط الحبر", chapter: "الفصل", play: "العب", next: "التالي", map: "الخريطة", skip: "تخطَّ", tapNext: "المس للمتابعة", locked: "مقفل", oC: "اهزم كل الزومبي", oR: "حرّر الناجين", oS: "انجُ", oD: "احمِ فانوس الحبر", oB: "اهزم", m_swarm: "سرب: زومبي أكثر", m_nogun: "بلا أسلحة: القبضات فقط", m_elite: "ليلة النخبة: زومبي ذهبي", m_dark: "انقطاع الكهرباء: ابقَ في الضوء", star1: "افُز", star2: "احتفظ بنصف صحتك", star3: "كومبو", lvClear: "اكتملت المرحلة!", failed: "فشلت المرحلة", lanternOut: "انطفأ الفانوس", joins: "ينضم إلى فريقك!", survivors: "الناجون", left: "الزومبي المتبقون", lantern: "الفانوس", nightmare: "كابوس", firstClear: "أول فوز ×2", freed: "حُرّر!", noGun: "لا أسلحة هنا!", allAboard: "الكل إلى القطار!", twinRage: "التوأم الآخر غاضب!", phase2: "نَل · المرحلة 2", phase2s: "رسم نسخاً من نفسه!", theEnd: "النهاية…؟", nmUnlocked: "فُتح وضع الكابوس!", hero: "البطل", tagline: 'قصة من 40 مرحلة وليلة زومبي لا تنتهي. اضرب، أطلق، انجُ!', choose: 'اختر بطلك', fight: 'قتال!', unlock: 'افتح', needCoins: 'العملات لا تكفي بعد', wave: 'الموجة', bossWave: 'زعيم', cleared: 'انتهت الموجة!', pickPerk: 'اختر قوة', combo: 'كومبو', reloading: 'إعادة التلقيم…', newZ: 'جديد:', block: 'صدّ', broken: 'تحطّم!', broke: 'انكسر!', empty: 'فارغ!', rage: 'وضع الغضب!', overrun: 'غُمِرت!', reached: 'سقطت في الموجة', record: 'رقم قياسي جديد!', infinity: 'الوضع اللانهائي · كل موجة أصعب', bestWave: 'أفضل موجة', eliteT: 'زومبي النخبة!', eliteS: 'التوهج الذهبي = أقوى لكن 3× نقاط وعملات أكثر', threat: 'الخطر', shop: 'المتجر', guns: 'الأسلحة', items: 'الأدوات', back: 'رجوع', buy: 'شراء', equip: 'تجهيز', equipped: 'مُجهَّز', owned: 'مملوك', maxed: 'ممتلئ!', have: 'لديك', dps: 'ضرر/ث', sDmg: 'الضرر', sRate: 'سرعة الإطلاق', sMag: 'الذخيرة', sReload: 'التلقيم', sRange: 'المدى', adCoins: '+60 · إعلان', adWait: 'المكافأة التالية قريباً', reviveQ: 'سقطت! هل تستخدم قلباً؟', revive: 'انهض', giveUp: 'استسلم', revived: 'عدت إلى القتال!', heartSaved: 'القلوب تُنهضك عندما تسقط', fullHp: 'الصحة ممتلئة', airstrike: 'غارة جوية!', tryGun: 'جرّب:', tryGunSub: 'أعجبك؟ اشتره من المتجر', gunLabel: 'السلاح', bAtk: 'ضرب', bJump: 'قفز', bShoot: 'نار', bSpec: 'قوة', sPow: 'القوة', sSpd: 'السرعة', sHp: 'الصحة', keys: '←/→ تحرك · W قفز · J ضرب · K نار · L قوة · R تلقيم' }
    },
    init: function (K) { K0 = K; if (K.store.get('cur:ink-heroes', null) === null) K.store.set('cur:ink-heroes', K.wallet() || Math.floor(K.store.get('coins', 0) || 0)); /* keep old coins as Ink Drops */ held = {}; keys = {}; ui = []; waves = []; layout(K); picked = K.store.get('ink:hero', 'kai'); bestWave = K.store.get('ink:bestWave', 0) || 0;
      prog = loadProg(); storyMode = K.store.get('ink:mode', 'story') !== 'inf';
      window.addEventListener('touchstart', function () { if (!touchUI) { touchUI = true; layout(K); } }, { passive: true }); },
    resize: function (K) { layout(K); },
    reset: function (K) {
      K0 = K; layout(K); held = {}; keys = {}; touchMap = {}; waves = [];
      var own = owned(); picked = K.store.get('ink:hero', 'kai'); if (own.indexOf(picked) < 0) picked = 'kai';
      sel = Math.max(0, HEROES.map(function (h) { return h.id; }).indexOf(picked));
      hero = newHero(K); zombies = []; bullets = []; spits = []; pickups = []; parts = []; decals = []; allies = []; banners = []; wave = 0; combo = 0; comboT = 0; hs = 0; slow = 0; introT = 0; bossRef = null;
      mods = { maxHp: 0, melee: 1, rate: 1, mag: 1, vamp: 0, focus: 1, buddy: 0, luck: 1, crit: 0.05 };
      camX = clamp(hero.x - viewW(K) / 2, 0, Math.max(0, AW - viewW(K))); mode = 'pick'; queue = []; curGun = equippedGun(); bag = inv(); turrets = []; bombs = []; nades = []; planeT = 0;
      prog = loadProg(); story = null; cut = null; cages = []; lantern = null; civs = []; theme = 'ruins'; zoomK = 1; curMut = [];
      if (storyRetry !== null) { var rIdx = storyRetry; storyRetry = null; goMap(K, rIdx); }
      if (K.test) window.__ink = { hurt: function (n) { hurtHero(K, n, 1); }, spawn: function (t) { spawnZombie(K, t); }, use: function (id) { useItem(K, id); }, fire: function () { fire(K); }, clear: function () { zombies = []; queue = []; }, story: { win: function () { storyWin(K); }, prog: function () { return prog; }, set: function (p) { prog = p; saveProg(); }, start: function (i, nm) { nmOn = !!nm; startLevel(K, i); }, play: function (i) { playLevel(K, i); }, map: function (i) { goMap(K, i); }, killBoss: function (frac) { zombies.forEach(function (z) { if (z.d.boss && !z.dead) { z.hidden = false; if (frac) { z.hp -= z.maxHp * frac; } else { z.hp = 1; hitZombie(K, z, 99999, 1, 0, 0, 'boom'); } } }); }, timer: function (t) { if (story) story.timer = t; }, cages: function () { cages.forEach(function (c) { hitCage(K, c, 9999); }); }, lanternHit: function (n) { hurtLantern(K, n); } }, setGun: function (id) { curGun = id; hero.ammo = baseMag(); hero.reloadT = 0; hero.shootCd = 0; } };
      if (K.test) K.dbg = function () { return { mode: mode, wave: wave, bag: bag, gun: curGun, ammo: hero.ammo, muts: curMut, elites: zombies.filter(function (z) { return z.elite; }).length, threat: [1, 2, 3, 5, 10, 15, 20, 30, 40, 60].map(function (n) { var t = threat(n); t.n = n; return t; }), seen: Object.keys(firstTypes || {}), weapon: (hero.melee && hero.melee.id) || (hero.gun2 && hero.gun2.id) || null, boss: !!bossRef, hero: { x: hero.x, y: hero.y, hp: hero.hp, ink: hero.ink, face: hero.face, ground: hero.ground, ammo: hero.ammo }, zombies: zombies.map(function (z) { return { t: z.t, x: z.x, y: z.y, hp: z.hp, maxHp: z.maxHp, shield: z.shield, atkT: z.atkT, ice: z.ice || 0, frozen: z.frozen || 0 }; }), shieldT: hero.shield || 0, rage: hero.rage, turrets: turrets.length, bombs: bombs.length, nades: nades.length, bullets: bullets.length, waves: waves.map(function (w) { return { x: w.x }; }), kills: kills, perkOpts: perkOpts, sel: sel, queue: queue.length, storyMode: storyMode, theme: theme, mapCh: mapCh, mapSel: mapSel, nmOn: nmOn, cut: cut ? { i: cut.i, n: cut.lines.length, who: cut.lines[cut.i][0] } : null,
          story: story ? { idx: story.d.idx, o: story.d.o, m: story.d.m, timer: story.timer, done: story.done, eff: story.eff, maxCombo: story.maxCombo, dmg: story.dmg, bossSpawned: story.bossSpawned } : null, cages: cages.map(function (c) { return c.freed; }), lantern: lantern ? lantern.hp : null,
          win: winInfo && mode === 'win' ? { stars: winInfo.stars, coins: winInfo.coins, unlock: winInfo.unlock, ending: winInfo.ending } : null, zoom: zoomK, bosses: zombies.filter(function (z) { return z.d.boss; }).map(function (z) { return { t: z.t, hp: z.hp, x: z.x, st: z.st || z.bossAct || null, phase2: !!z.phase2, hidden: !!z.hidden }; }) }; };
    },
    revive: function (K) { reviveHero(K); },
    pointerDown: function (x, y, K, id) {
      if (mode === 'cut') { var cu = uiHit(x, y); if (cu && cu.act === 'cskip') cutSkip(K); else cutAdvance(K); return; }
      if (mode === 'pick' || mode === 'perk' || mode === 'shop' || mode === 'down' || mode === 'map' || mode === 'win') { uiTap(K, uiHit(x, y)); return; }
      for (var ii = 0; ii < itemUI.length; ii++) { var u0 = itemUI[ii]; if (x >= u0.x - 4 && x <= u0.x + u0.w + 4 && y >= u0.y - 4 && y <= u0.y + u0.h + 4) { useItem(K, u0.id); return; } }
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
      if (mode === 'cut') { if (down && !rep) { if (code === 'Escape' || code === 'Backspace') cutSkip(K); else if (code === 'Enter' || code === 'Space' || code === 'KeyJ' || code === 'ArrowRight') cutAdvance(K); } return; }
      if (mode === 'win') { if (down && !rep) { if (code === 'Enter' || code === 'Space' || code === 'KeyJ') { if (winInfo.d.idx + 1 < NLV) nextLevel(K); else goMap(K, winInfo.d.idx); } else if (code === 'Backspace' || code === 'KeyM') goMap(K, Math.min(winInfo.d.idx + 1, unlockedMax(winInfo.nm))); } return; }
      if (mode === 'map') {
        if (!down || rep) return;
        var um = unlockedMax(nmOn);
        if (map[code] === 'left') { mapSel = Math.max(0, mapSel - 1); K.sfx('tick'); }
        else if (map[code] === 'right') { if (mapCh * 8 + mapSel + 1 <= um) mapSel = Math.min(7, mapSel + 1); K.sfx('tick'); }
        else if (code === 'KeyQ' || code === 'PageUp') uiTap(K, mapCh > 0 ? { act: 'mch', d: -1 } : null);
        else if (code === 'KeyE' || code === 'PageDown') uiTap(K, mapCh < CHAPTERS.length - 1 && um >= (mapCh + 1) * 8 ? { act: 'mch', d: 1 } : null);
        else if (code === 'KeyN' && prog.nm) uiTap(K, { act: 'nm' });
        else if (code === 'Enter' || code === 'Space' || code === 'KeyJ') uiTap(K, { act: 'mplay' });
        else if (code === 'Backspace' || code === 'Escape') uiTap(K, { act: 'mback' });
        return;
      }
      if (mode === 'pick') {
        if (!down || rep) return;
        if (code === 'KeyT' || code === 'Tab') { uiTap(K, { act: 'smode', v: !storyMode }); return; }
        if (map[code] === 'left') { sel = (sel + HEROES.length - 1) % HEROES.length; K.sfx('tick'); }
        else if (map[code] === 'right') { sel = (sel + 1) % HEROES.length; K.sfx('tick'); }
        else if (/^Digit[1-4]$/.test(code)) { sel = +code.slice(5) - 1; K.sfx('tick'); }
        else if (code === 'Enter' || code === 'Space' || code === 'KeyJ') confirmHero(K);
        else if (code === 'KeyS' || code === 'KeyB') { mode = 'shop'; shopSel = 0; shopPage = 0; K.sfx('click'); }
        return;
      }
      if (mode === 'down') { if (down && !rep) { if (code === 'Enter' || code === 'Space' || code === 'KeyH') useHeart(K); else if (code === 'Backspace') endRun(K); } return; }
      if (mode === 'shop') {
        if (!down || rep) return;
        var list = shopTab === 'guns' ? GUN_ORDER : ITEM_ORDER;
        if (map[code] === 'left' || code === 'ArrowUp') { shopSel = (shopSel + list.length - 1) % list.length; shopPage = Math.floor(shopSel / 4); K.sfx('tick'); }
        else if (map[code] === 'right' || code === 'ArrowDown') { shopSel = (shopSel + 1) % list.length; shopPage = Math.floor(shopSel / 4); K.sfx('tick'); }
        else if (code === 'KeyQ' || code === 'KeyE') { shopTab = shopTab === 'guns' ? 'items' : 'guns'; shopSel = 0; shopPage = 0; K.sfx('click'); }
        else if (code === 'Enter' || code === 'Space') shopAct(K);
        else if (code === 'Backspace' || code === 'KeyB') { mode = 'pick'; K.sfx('click'); }
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
      else { var dk = /^(Digit|Numpad)([1-7])$/.exec(code); if (dk) ITEM_ORDER.forEach(function (k) { if (ITEMS[k].key === dk[2]) useItem(K, k); }); }
    },
    update: function (dt, K) {
      if (held.atkFlash) held.atkFlash = Math.max(0, held.atkFlash - dt);
      if (mode === 'down') { downT -= dt; updateParts(dt); if (downT <= 0) endRun(K); return; }
      trainT += dt; zoomK += (1 - zoomK) * Math.min(1, dt * 3.5);
      if (mode === 'cut' && cut) { cut.t += dt * 48; updateParts(dt); return; }
      if (mode === 'win' && winInfo) winInfo.t += dt;
      if (mode !== 'fight') { updateParts(dt); return; }
      if (slow > 0) { slow -= dt; dt *= 0.3; }
      if (hs > 0) { hs -= dt; updateParts(dt * 0.2); return; }
      tutT += dt; introT = Math.max(0, introT - dt);
      if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }
      banners.forEach(function (b) { b.t -= dt; }); banners = banners.filter(function (b) { return b.t > 0; });
      updateHero(K, dt); if (!K.isPlaying()) return;
      updateZombies(K, dt); if (!K.isPlaying()) return;
      updateAllies(K, dt); updateItems(K, dt); updateProjectiles(K, dt); if (!K.isPlaying()) return;
      updatePickups(K, dt); updateParts(dt);
      // spawning
      var aliveN = zombies.length, TT = threat(curEff()), maxAlive = TT.maxAlive + (story && story.d.m === 'swarm' ? 4 : 0), spM = story && (story.d.o === 's' || story.d.o === 'd') ? 0.8 : 1;
      if (story && story.done) { /* level won: no more spawns */ }
      else if (queue.length && introT <= 0.6) { spawnT -= dt; if (spawnT <= 0 && aliveN < maxAlive) { spawnZombie(K, queue.shift()); spawnT = TT.spawn * spM * rnd(0.6, 1.3); } }
      if (story) { storyUpdate(K, dt); }
      else if (!queue.length && !zombies.length && introT <= 0) {
        clearT += dt;
        if (clearT > 1.2) { clearT = 0; K.addScore(100 * wave); K.addCoins(2 + Math.floor(wave / 2)); K.tutorialDone(); hero.ammo = baseMag(); hero.reloadT = 0; choosePerks(K); mode = 'perk'; K.sfx('reward'); }
      } else clearT = 0;
      if (!K.isPlaying()) return;
      // camera
      var vw = viewW(K), tx = clamp(hero.x - vw / 2 + hero.face * vw * 0.08, 0, Math.max(0, AW - vw));
      camX += (tx - camX) * Math.min(1, dt * 5);
    },
    idle: function (dt) { if (parts) updateParts(dt); },
    draw: function (c, K, state) {
      if (!hero) return;
      if (mode === 'map') theme = CHAPTERS[mapCh].theme;
      var W = K.W, H = K.H, zc = zoomK > 1.002, hxS = sx(hero.x), hyS = gyS - 70 * sc;
      if (zc) { c.save(); c.translate(hxS, hyS); c.scale(zoomK, zoomK); c.translate(-hxS, -hyS); }
      drawWorld(c, K);
      if (mode === 'pick') { if (zc) c.restore(); drawPick(c, K); return; }
      if (mode === 'shop') { if (zc) c.restore(); drawShop(c, K); return; }
      if (mode === 'map') { if (zc) c.restore(); drawMap(c, K); return; }
      // depth-sorted actors (2.5D): farther = drawn first, smaller and higher
      var items = [];
      zombies.forEach(function (z) { items.push([z.dz || 0, z.x, function () { drawZombie(c, K, z); }, z]); });
      allies.forEach(function (a) { if (a && !a.dead) items.push([-14, a.x, function () { drawAlly(c, a); }, null]); });
      cages.forEach(function (cg) { items.push([-20, cg.x, function () { drawCage(c, K, cg); }, null]); });
      civs.forEach(function (v) { items.push([-24, v.x, function () { drawCiv(c, v); }, null]); });
      if (lantern) items.push([-30, lantern.x, function () { drawLantern(c, K); }, null]);
      items.push([0.5, hero.x, function () { drawHero(c, K); }, null]);
      items.sort(function (a, b) { return a[0] - b[0]; });
      if (mode !== 'cut') items.forEach(function (it) { withDepth(c, it[1], it[0] === 0.5 ? 0 : it[0], it[2], it[3]); });
      drawPickups(c, K);
      drawParts(c, K);
      // blackout levels: only the light around the hero (and the lantern) cuts through
      if (story && story.d.m === 'dark' && mode !== 'cut') {
        var lr = 165 * sc, dg = c.createRadialGradient(hxS, hyS, lr * 0.25, hxS, hyS, lr * 1.25); dg.addColorStop(0, 'rgba(3,0,10,0)'); dg.addColorStop(0.55, 'rgba(3,0,10,0.55)'); dg.addColorStop(1, 'rgba(3,0,10,0.93)');
        c.fillStyle = dg; c.fillRect(-W, -H, W * 3, H * 3);
        zombies.forEach(function (z) { var e = z._eye; if (!e || z.hidden || z.dead) return; var X = e[0], Y = e[1], tf = z._tf; if (tf) { X = tf[0] + (X - tf[0]) * tf[3]; Y = tf[1] + tf[2] + (Y - tf[1]) * tf[3]; } c.fillStyle = e[3]; c.shadowColor = e[3]; c.shadowBlur = 10; c.beginPath(); c.arc(X - e[2] * 0.18, Y, Math.max(2, e[2] * 0.16), 0, TAU); c.arc(X + e[2] * 0.22, Y + 1, Math.max(1.6, e[2] * 0.12), 0, TAU); c.fill(); c.shadowBlur = 0; });
      }
      if (zc) c.restore();
      // vignette + nightmare tint
      var vg = c.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.45, Math.max(W, H) * 0.78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, theme === 'margin' ? 'rgba(60,40,20,0.22)' : 'rgba(0,0,0,0.42)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
      if (story && story.nm) { c.fillStyle = 'rgba(120,0,20,0.16)'; c.fillRect(0, 0, W, H); }
      if (mode === 'cut') { drawCut(c, K); return; }
      if (mode === 'win') { drawWin(c, K); return; }
      drawHud(c, K);
      if (mode === 'perk') drawPerks(c, K);
      if (mode === 'down') drawDown(c, K);
    }
  });
})();
