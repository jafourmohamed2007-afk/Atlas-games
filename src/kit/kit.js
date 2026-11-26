/* =====================================================================
   Bubzi Kit — shared engine for every Bubzi game (original work)
   Menus, HUD, sound synth, particles, shake, coins, skins, daily bonus,
   EN/FR/AR (+RTL), saved best scores and AD PLACEHOLDERS.
   ===================================================================== */
(function () {
  'use strict';
  var TAU = Math.PI * 2;
  var NS = 'bubzi:';
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(NS + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  var Q = new URLSearchParams(location.search);
  var TEST = Q.has('test');
  var SPEED = Math.max(1, Math.min(10, parseInt(Q.get('speed'), 10) || 1));
  var EMBED = Q.has('embed'); // ?embed hides our own banner (partner portals, or our site which shows its own ad slot)
  var AUTOSTART = Q.has('autostart'); // one-tap play from the website
  var FONT = 'ui-rounded, "Baloo 2", Nunito, "Varela Round", "Arial Rounded MT Bold", "Segoe UI", system-ui, -apple-system, Roboto, Tahoma, sans-serif';

  /* ---------------- i18n ---------------- */
  var STR = {
    en: { play: 'Play', best: 'Best', score: 'Score', coins: 'Coins', paused: 'Paused', resume: 'Resume', restart: 'Restart', home: 'Menu',
      over: 'Game Over', newBest: 'New best!', cont: 'Watch ad to continue', noThanks: 'No thanks', daily: 'Daily bonus', claim: 'Claim',
      claimed: 'Come back tomorrow!', day: 'Day', skins: 'Skins', sound: 'Sound', ad: 'Advertisement', adInter: 'Interstitial ad placeholder',
      adReward: 'Rewarded ad placeholder', adBanner: 'AD PLACEHOLDER · banner 320×50', skip: 'Close', reward: 'Reward unlocked!', select: 'Select',
      selected: 'Selected', back: 'Back', lang: 'Language', earned: 'Coins', playAgain: 'Play again', level: 'Level', lives: 'Lives', time: 'Time',
      notEnough: 'Not enough coins', unlocked: 'Skin unlocked!', moreGames: 'More games', pause: 'Pause', soundOn: 'Sound on', soundOff: 'Sound off' },
    fr: { play: 'Jouer', best: 'Record', score: 'Score', coins: 'Pièces', paused: 'Pause', resume: 'Reprendre', restart: 'Recommencer', home: 'Menu',
      over: 'Partie terminée', newBest: 'Nouveau record !', cont: 'Regarder une pub pour continuer', noThanks: 'Non merci', daily: 'Bonus du jour',
      claim: 'Récupérer', claimed: 'Reviens demain !', day: 'Jour', skins: 'Skins', sound: 'Son', ad: 'Publicité', adInter: 'Emplacement pub interstitielle',
      adReward: 'Emplacement pub récompensée', adBanner: 'EMPLACEMENT PUB · bannière 320×50', skip: 'Fermer', reward: 'Récompense débloquée !',
      select: 'Choisir', selected: 'Choisi', back: 'Retour', lang: 'Langue', earned: 'Pièces', playAgain: 'Rejouer', level: 'Niveau', lives: 'Vies',
      time: 'Temps', notEnough: 'Pas assez de pièces', unlocked: 'Skin débloqué !', moreGames: 'Plus de jeux', pause: 'Pause', soundOn: 'Son activé', soundOff: 'Son coupé' },
    ar: { play: 'العب', best: 'الأفضل', score: 'النقاط', coins: 'العملات', paused: 'إيقاف مؤقت', resume: 'متابعة', restart: 'إعادة', home: 'القائمة',
      over: 'انتهت اللعبة', newBest: 'رقم قياسي جديد!', cont: 'شاهد إعلاناً للمتابعة', noThanks: 'لا شكراً', daily: 'مكافأة اليوم', claim: 'استلم',
      claimed: 'عد غداً!', day: 'يوم', skins: 'الشخصيات', sound: 'الصوت', ad: 'إعلان', adInter: 'مكان إعلان بيني', adReward: 'مكان إعلان بمكافأة',
      adBanner: 'مكان إعلان · بانر 320×50', skip: 'إغلاق', reward: 'حصلت على المكافأة!', select: 'اختر', selected: 'مختار', back: 'رجوع', lang: 'اللغة',
      earned: 'العملات', playAgain: 'العب مجدداً', level: 'المستوى', lives: 'المحاولات', time: 'الوقت', notEnough: 'لا تكفي العملات',
      unlocked: 'تم فتح الشخصية!', moreGames: 'ألعاب أخرى', pause: 'إيقاف', soundOn: 'الصوت يعمل', soundOff: 'الصوت مغلق' }
  };
  var LANGS = ['en', 'fr', 'ar'];

  var SKINS = [
    { id: 'grape', c: '#7B4DFF', d: '#5A2EE8', p: 0, n: { en: 'Grape', fr: 'Raisin', ar: 'عنب' } },
    { id: 'mint', c: '#14C8A0', d: '#0A9475', p: 100, n: { en: 'Mint', fr: 'Menthe', ar: 'نعناع' } },
    { id: 'mango', c: '#FF8A1F', d: '#C25400', p: 150, n: { en: 'Mango', fr: 'Mangue', ar: 'مانجو' } },
    { id: 'gum', c: '#FF5FA2', d: '#D43D80', p: 250, n: { en: 'Bubblegum', fr: 'Chewing-gum', ar: 'علكة' } },
    { id: 'sky', c: '#38B6FF', d: '#1A86CC', p: 400, n: { en: 'Sky', fr: 'Ciel', ar: 'سماء' } },
    { id: 'lemon', c: '#FFD23F', d: '#C99A00', p: 600, n: { en: 'Lemon', fr: 'Citron', ar: 'ليمون' } },
    { id: 'night', c: '#4A3F80', d: '#241B4D', p: 900, n: { en: 'Midnight', fr: 'Minuit', ar: 'ليل' } },
    { id: 'ruby', c: '#E8364F', d: '#A81A30', p: 1400, n: { en: 'Ruby', fr: 'Rubis', ar: 'ياقوت' } }
  ];
  var DAILY = [20, 30, 50, 70, 100, 150, 250];

  /* ---------------- helpers ---------------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function randi(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayDiff(a, b) { return Math.round((Date.parse(b + 'T00:00:00') - Date.parse(a + 'T00:00:00')) / 86400000); }
  function fmt(n) { return Math.floor(n).toLocaleString('en-US'); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  /* ---------------- sound (WebAudio synth, no files) ---------------- */
  var AC = null, master = null, noiseBuf = null, muted = !!store.get('mute', false);
  function audio() {
    if (AC) return AC;
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try { AC = new C(); master = AC.createGain(); master.gain.value = 0.5; master.connect(AC.destination); } catch (e) { AC = null; }
    return AC;
  }
  function unlockAudio() { var a = audio(); if (a && a.state === 'suspended') { try { a.resume(); } catch (e) { } } }
  function tone(f1, f2, dur, type, vol, delay) {
    var a = audio(); if (!a || muted) return;
    var t = a.currentTime + (delay || 0);
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f1, t);
    if (f2 && f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.03);
  }
  function noise(dur, vol, freq, delay) {
    var a = audio(); if (!a || muted) return;
    if (!noiseBuf) { noiseBuf = a.createBuffer(1, Math.floor(a.sampleRate * 0.5), a.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var t = a.currentTime + (delay || 0);
    var s = a.createBufferSource(); s.buffer = noiseBuf;
    var f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 1200;
    var g = a.createGain(); g.gain.setValueAtTime(vol || 0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.03);
  }
  function arp(fs, step, type, vol, dur) { fs.forEach(function (f, i) { tone(f, f, dur || 0.12, type || 'triangle', vol || 0.22, i * step); }); }
  var SFX = {
    click: function () { tone(500, 800, 0.06, 'square', 0.1); },
    pop: function () { tone(320, 900, 0.09, 'sine', 0.35); },
    coin: function () { tone(988, 988, 0.07, 'square', 0.1); tone(1319, 1319, 0.14, 'square', 0.1, 0.07); },
    jump: function () { tone(280, 720, 0.15, 'sine', 0.3); },
    land: function () { tone(170, 90, 0.08, 'sine', 0.3); },
    hit: function () { noise(0.25, 0.45, 900); tone(140, 60, 0.25, 'sawtooth', 0.18); },
    place: function () { tone(230, 160, 0.07, 'triangle', 0.35); },
    clear: function () { arp([523, 659, 784, 1047], 0.06); },
    combo: function () { arp([659, 784, 988, 1319, 1568], 0.05, 'square', 0.1, 0.1); },
    over: function () { tone(440, 110, 0.6, 'triangle', 0.3); tone(330, 82, 0.6, 'sine', 0.2, 0.1); },
    whoosh: function () { noise(0.18, 0.22, 2500); },
    star: function () { arp([1568, 2093, 2637], 0.05, 'triangle', 0.15, 0.08); },
    merge: function () { tone(260, 620, 0.16, 'sine', 0.35); tone(520, 1240, 0.12, 'triangle', 0.12, 0.03); },
    wrong: function () { tone(200, 180, 0.1, 'square', 0.14); tone(150, 140, 0.14, 'square', 0.14, 0.11); },
    flip: function () { tone(400, 1200, 0.25, 'sine', 0.25); },
    tick: function () { tone(1200, 1200, 0.03, 'square', 0.05); },
    eat: function () { tone(600, 1000, 0.06, 'square', 0.1); tone(900, 1400, 0.06, 'sine', 0.15, 0.04); },
    reward: function () { arp([523, 784, 1047, 1568], 0.08, 'triangle', 0.22, 0.18); },
    grab: function () { tone(700, 500, 0.06, 'triangle', 0.25); },
    engine: function () { tone(70, 90, 0.08, 'sawtooth', 0.05); },
    shot: function () { noise(0.07, 0.32, 3200); tone(190, 80, 0.06, 'square', 0.08); },
    punch: function () { tone(140, 55, 0.09, 'sine', 0.45); noise(0.05, 0.22, 1400); },
    heavy: function () { tone(90, 35, 0.18, 'sine', 0.55); noise(0.12, 0.3, 900); },
    boom: function () { noise(0.55, 0.55, 650); tone(95, 30, 0.55, 'sine', 0.45); },
    groan: function () { tone(120 + Math.random() * 40, 70, 0.55, 'sawtooth', 0.05); },
    reload: function () { tone(900, 900, 0.03, 'square', 0.06); tone(620, 620, 0.04, 'square', 0.07, 0.14); },
    block: function () { tone(1300, 900, 0.06, 'triangle', 0.12); noise(0.04, 0.15, 5000); },
    boss: function () { tone(70, 50, 1.1, 'sawtooth', 0.12); tone(105, 70, 1.1, 'sawtooth', 0.08, 0.05); }
  };
  function sfx(n) { if (muted) return; var f = SFX[n]; if (f) { try { f(); } catch (e) { } } }
  function haptic(ms) { if (!muted && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { } } }

  /* ---------------- shared art: Bubzi, coin, hand ---------------- */
  function skin() { var id = store.get('skin', 'grape'); for (var i = 0; i < SKINS.length; i++) if (SKINS[i].id === id) return SKINS[i]; return SKINS[0]; }
  function drawBubzi(ctx, x, y, r, o) {
    o = o || {};
    var sk = skin(), col = o.color || sk.c, dark = o.dark || sk.d, sq = o.squash || 1, mood = o.mood || 'happy';
    var lx = o.lookX || 0, ly = o.lookY || 0;
    ctx.save(); ctx.translate(x, y); if (o.angle) ctx.rotate(o.angle); ctx.scale(1 / sq, sq);
    // leaf sprout
    ctx.fillStyle = o.leaf || '#14C8A0';
    if (col === '#14C8A0') ctx.fillStyle = '#FFC93C';
    ctx.beginPath(); ctx.moveTo(r * 0.05, -r * 0.82); ctx.quadraticCurveTo(r * 0.2, -r * 1.38, r * 0.62, -r * 1.2); ctx.quadraticCurveTo(r * 0.45, -r * 0.86, r * 0.12, -r * 0.8); ctx.fill();
    // body
    ctx.fillStyle = col; ctx.strokeStyle = dark; ctx.lineWidth = Math.max(1.5, r * 0.09);
    ctx.beginPath(); ctx.moveTo(0, -r * 0.88);
    ctx.bezierCurveTo(r * 0.72, -r * 0.88, r * 1.02, -r * 0.3, r * 1.02, r * 0.22);
    ctx.bezierCurveTo(r * 1.02, r * 0.78, r * 0.55, r * 0.98, 0, r * 0.98);
    ctx.bezierCurveTo(-r * 0.55, r * 0.98, -r * 1.02, r * 0.78, -r * 1.02, r * 0.22);
    ctx.bezierCurveTo(-r * 1.02, -r * 0.3, -r * 0.72, -r * 0.88, 0, -r * 0.88);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // shine
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.ellipse(-r * 0.42, -r * 0.45, r * 0.24, r * 0.14, -0.5, 0, TAU); ctx.fill();
    // cheeks
    ctx.fillStyle = 'rgba(255,143,196,0.85)';
    ctx.beginPath(); ctx.ellipse(-r * 0.62, r * 0.32, r * 0.14, r * 0.09, 0, 0, TAU); ctx.ellipse(r * 0.62, r * 0.32, r * 0.14, r * 0.09, 0, 0, TAU); ctx.fill();
    var ex = r * 0.34, ey = -r * 0.02, er = r * 0.24;
    ctx.lineCap = 'round'; ctx.strokeStyle = '#241B4D'; ctx.fillStyle = '#241B4D';
    if (mood === 'sad') {
      ctx.lineWidth = Math.max(1.5, r * 0.1);
      [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.moveTo(s * ex - er * 0.6, ey - er * 0.6); ctx.lineTo(s * ex + er * 0.6, ey + er * 0.6); ctx.moveTo(s * ex + er * 0.6, ey - er * 0.6); ctx.lineTo(s * ex - er * 0.6, ey + er * 0.6); ctx.stroke(); });
      ctx.beginPath(); ctx.arc(0, r * 0.62, r * 0.2, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else if (mood === 'joy') {
      ctx.lineWidth = Math.max(1.5, r * 0.1);
      [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.arc(s * ex, ey + er * 0.3, er * 0.7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(-r * 0.24, r * 0.32); ctx.quadraticCurveTo(0, r * 0.75, r * 0.24, r * 0.32); ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(-ex, ey, er, 0, TAU); ctx.arc(ex, ey, er, 0, TAU); ctx.fill();
      ctx.fillStyle = '#241B4D';
      var px = clamp(lx, -1, 1) * er * 0.4, py = clamp(ly, -1, 1) * er * 0.4;
      ctx.beginPath(); ctx.arc(-ex + px, ey + py, er * 0.52, 0, TAU); ctx.arc(ex + px, ey + py, er * 0.52, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(-ex + px + er * 0.2, ey + py - er * 0.2, er * 0.17, 0, TAU); ctx.arc(ex + px + er * 0.2, ey + py - er * 0.2, er * 0.17, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#241B4D'; ctx.fillStyle = '#241B4D'; ctx.lineWidth = Math.max(1.5, r * 0.09);
      if (mood === 'wow') { ctx.beginPath(); ctx.ellipse(0, r * 0.45, r * 0.13, r * 0.17, 0, 0, TAU); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0, r * 0.3, r * 0.2, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
    }
    ctx.restore();
  }
  function drawCoin(ctx, x, y, r, t) {
    var sx = t === undefined ? 1 : Math.max(0.15, Math.abs(Math.cos(t * 3)));
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1);
    ctx.fillStyle = '#FFC93C'; ctx.strokeStyle = '#E07A00'; ctx.lineWidth = Math.max(1.2, r * 0.18);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FFE58A'; ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.25, r * 0.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#C46A00'; ctx.lineWidth = Math.max(1, r * 0.16); ctx.beginPath(); ctx.moveTo(0, -r * 0.45); ctx.lineTo(0, r * 0.45); ctx.stroke();
    ctx.restore();
  }
  var HAND = null;
  function drawHand(ctx, x, y, pressed, scale) {
    if (!HAND) { try { HAND = new Path2D('M9 2.5a2 2 0 0 1 4 0V12l1-.2a2 2 0 0 1 2.2 1.3l.1.2a2 2 0 0 1 2.7 1.2 2 2 0 0 1 2.5 1.6l.3 3.4a6 6 0 0 1-1.8 4.8L18 26H9.5l-5-6.2a2 2 0 0 1 2.8-2.8L9 18.5Z'); } catch (e) { return; } }
    var s = (scale || 2) * (pressed ? 0.9 : 1);
    ctx.save(); ctx.translate(x - 11 * s, y - 2 * s); ctx.scale(s, s);
    if (pressed) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(11, 2, 7, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#241B4D'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
    ctx.fill(HAND); ctx.stroke(HAND); ctx.restore();
  }
  function bubziSVG(mood, size) {
    if (cfg && cfg.mascot) return cfg.mascot(mood, size);
    var sk = skin(), c = sk.c, d = sk.d, leaf = c === '#14C8A0' ? '#FFC93C' : '#14C8A0';
    var face = mood === 'sad'
      ? '<path d="M18 33l9 8M27 33l-9 8M37 33l9 8M46 33l-9 8" stroke="#241B4D" stroke-width="3.4" stroke-linecap="round"/><path d="M26 52q6-6 12 0" stroke="#241B4D" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : '<circle cx="22.5" cy="37" r="7" fill="#fff"/><circle cx="41.5" cy="37" r="7" fill="#fff"/><circle cx="24" cy="38" r="3.7" fill="#241B4D"/><circle cx="43" cy="38" r="3.7" fill="#241B4D"/><circle cx="25.2" cy="36.6" r="1.3" fill="#fff"/><circle cx="44.2" cy="36.6" r="1.3" fill="#fff"/><path d="M27 46q5 5 10 0" stroke="#241B4D" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
    return '<svg ' + (size ? 'width="' + size + '" height="' + size + '" ' : '') + 'viewBox="0 0 64 64" aria-hidden="true" class="mascot-svg">' +
      '<path d="M32 12C36 4 45 4 46 9C41 9 37 11 34 14" fill="' + leaf + '"/>' +
      '<path d="M32 14C50 14 59 27 59 39C59 52 47 59 32 59C17 59 5 52 5 39C5 27 14 14 32 14Z" fill="' + c + '" stroke="' + d + '" stroke-width="2.5"/>' +
      '<ellipse cx="20" cy="24" rx="7" ry="4" fill="#fff" opacity=".5" transform="rotate(-25 20 24)"/>' +
      '<ellipse cx="13" cy="46" rx="4" ry="2.5" fill="#FF8FC4"/><ellipse cx="51" cy="46" rx="4" ry="2.5" fill="#FF8FC4"/>' + face + '</svg>';
  }
  var ICON = {
    pause: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx="2"/><rect x="14" y="4" width="5" height="16" rx="2"/></svg>',
    soundOn: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9Z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    soundOff: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9Z" fill="currentColor"/><path d="M16 9l6 6M22 9l-6 6"/></svg>',
    play: '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>',
    coin: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#FFC93C" stroke="#E07A00" stroke-width="2"/><path d="M12 7v10" stroke="#C46A00" stroke-width="2.2" stroke-linecap="round"/></svg>',
    gift: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12M12 9c-2-4-6-4-6-1.5S12 9 12 9Zm0 0c2-4 6-4 6-1.5S12 9 12 9Z"/></svg>',
    shirt: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M8 3 3 6l2 5 2-1v11h10V10l2 1 2-5-5-3a4 4 0 0 1-8 0Z"/></svg>',
    tv: '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="3" fill="#fff"/><path d="M10 9v6l5-3Z" fill="#0A9475"/></svg>',
    redo: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/></svg>',
    home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/></svg>',
    grid: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>'
  };

  /* shared art helpers (used by the key-art renderer) */
  window.BubziArt = { drawBubzi: drawBubzi, drawCoin: drawCoin, star: function (c, r) { star(c, r); }, roundRect: roundRect };

  /* ===================================================================
     ADS — every network call lives here. All are PLACEHOLDERS.
     =================================================================== */
  var Ads = {
    /* ===== AD PLACEHOLDER: INTERSTITIAL (shown between rounds) =====
       Replace the body with your network call and call done() when it closes:
         GameDistribution: gdsdk.showAd('interstitial').then(done, done)
         Poki:             PokiSDK.commercialBreak().then(done)
         CrazyGames:       CrazyGames.SDK.ad.requestAd('midgame', { adFinished: done, adError: done })
         AdinPlay / AdSense H5: adBreak({ type: 'next', adBreakDone: done })                       */
    interstitial: function (done) { placeholderAd('interstitial', done); },
    /* ===== AD PLACEHOLDER: REWARDED ("watch ad to continue") =====
       Call done(true) ONLY when the reward is earned, done(false) if skipped/failed:
         GameDistribution: gdsdk.showAd('rewarded').then(()=>done(true), ()=>done(false))
         Poki:             PokiSDK.rewardedBreak().then(ok => done(ok))
         CrazyGames:       CrazyGames.SDK.ad.requestAd('rewarded', { adFinished: ()=>done(true), adError: ()=>done(false) })
         AdSense H5:       adBreak({ type: 'reward', beforeReward: s => s(), adViewed: ()=>done(true), adDismissed: ()=>done(false) }) */
    rewarded: function (done) { placeholderAd('rewarded', done); },
    /* Portal lifecycle hooks (Poki: PokiSDK.gameplayStart/Stop, CrazyGames: SDK.game.gameplayStart/Stop) */
    gameplayStart: function () { }, gameplayStop: function () { }, loadingFinished: function () { }
  };

  /* =================================================================== */
  var K = {
    W: 1, H: 1, hudH: 74, time: 0, dt: 0, score: 0, coinsRound: 0, round: 0, revived: false, tutorial: false, lang: 'en', rtl: false, test: TEST,
    store: store, clamp: clamp, lerp: lerp, rand: rand, randi: randi, pick: pick, fmt: fmt, roundRect: roundRect, TAU: TAU, FONT: FONT,
    sfx: sfx, haptic: haptic, drawBubzi: drawBubzi, drawCoin: drawCoin, drawHand: drawHand, skin: skin
  };
  var state = 'boot', game = null, cfg = null, canvas, ctx, stage, dpr = 1, ui = {}, parts = [], shakeMag = 0, flashA = 0, flashC = '#fff',
    dyingT = 0, overInfo = null, bonusPaid = 0, roundsSinceAd = 0, ptrs = {};

  K.font = function (px, w) { return (w || 800) + ' ' + Math.round(px) + 'px ' + FONT; };
  K.t = function (k) {
    var g = cfg && cfg.strings;
    return (g && g[K.lang] && g[K.lang][k]) || STR[K.lang][k] || (g && g.en && g.en[k]) || STR.en[k] || k;
  };
  K.addScore = function (n) { K.score += n; updateHud(true); };
  K.setScore = function (n) { if (n !== K.score) { K.score = n; updateHud(true); } };
  K.addCoins = function (n, x, y) {
    if (n <= 0) return;
    store.set('coins', wallet() + n); K.coinsRound += n; updateHud(false);
    if (x !== undefined) { floatText(x, y, '+' + n, '#FFC93C', 22); sfx('coin'); }
  };
  K.wallet = function () { return wallet(); };
  K.spend = function (n) { if (wallet() < n) return false; store.set('coins', wallet() - n); updateHud(false); return true; };
  K.info = function (txt) { if (ui.info && ui.info.textContent !== txt) ui.info.textContent = txt; };
  K.tutorialDone = function () { if (K.tutorial) { K.tutorial = false; store.set('tut:' + cfg.id, true); } };
  K.gameOver = function (o) {
    if (state !== 'playing') return;
    overInfo = o || {}; state = 'dying'; dyingT = 0.9; Ads.gameplayStop();
    sfx('over'); haptic(90); K.shake(10); K.tutorialDone();
  };
  K.isPlaying = function () { return state === 'playing'; };
  K.toast = toast;

  /* ---------------- particles ---------------- */
  function burst(x, y, color, n, spd, size) {
    n = n || 12; spd = spd || 220;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU, s = spd * (0.35 + Math.random() * 0.8);
      parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - spd * 0.3, g: 700, life: 0, max: 0.45 + Math.random() * 0.5,
        color: Array.isArray(color) ? color[i % color.length] : color, size: (size || 5) * (0.6 + Math.random() * 0.8), kind: Math.random() < 0.3 ? 'star' : 'dot', rot: Math.random() * 6 });
    }
    if (parts.length > 700) parts.splice(0, parts.length - 700);
  }
  function floatText(x, y, txt, color, size) { parts.push({ x: x, y: y, vx: 0, vy: -80, g: 0, life: 0, max: 0.9, color: color || '#fff', size: size || 26, kind: 'text', txt: String(txt) }); }
  function confetti(n) {
    var cs = ['#7B4DFF', '#FF8A1F', '#14C8A0', '#FF5FA2', '#FFC93C', '#38B6FF'];
    for (var i = 0; i < (n || 70); i++) parts.push({ x: rand(0, K.W), y: rand(-60, -5), vx: rand(-70, 70), vy: rand(80, 260), g: 160, life: 0, max: rand(1.6, 2.6), color: pick(cs), size: rand(5, 9), kind: 'rect', rot: rand(0, 6), vr: rand(-8, 8) });
  }
  K.burst = burst; K.floatText = floatText; K.confetti = confetti;
  K.shake = function (m) { shakeMag = Math.max(shakeMag, m); };
  K.flash = function (c, a) { flashC = c || '#fff'; flashA = Math.max(flashA, a || 0.35); };
  function star(ctx, r) { ctx.beginPath(); for (var i = 0; i < 10; i++) { var rr = i % 2 ? r * 0.45 : r, a = i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
  K.star = star;
  function updateParts(dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life += dt;
      if (p.life >= p.max) { parts.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vr) p.rot += p.vr * dt;
    }
  }
  function drawParts(c) {
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i], a = 1 - p.life / p.max;
      c.globalAlpha = Math.max(0, Math.min(1, p.kind === 'text' ? a * 1.6 : a));
      c.fillStyle = p.color;
      if (p.kind === 'text') {
        c.font = K.font(p.size * (1 + 0.25 * Math.max(0, 1 - p.life * 6))); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineWidth = 5; c.strokeStyle = 'rgba(36,27,77,0.85)'; c.lineJoin = 'round'; c.strokeText(p.txt, p.x, p.y); c.fillText(p.txt, p.x, p.y);
      } else if (p.kind === 'star') { c.save(); c.translate(p.x, p.y); c.rotate(p.rot + p.life * 4); star(c, p.size * 1.3); c.restore(); }
      else if (p.kind === 'rect') { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); c.restore(); }
      else { c.beginPath(); c.arc(p.x, p.y, p.size * (0.4 + a * 0.6), 0, TAU); c.fill(); }
    }
    c.globalAlpha = 1;
  }

  /* ---------------- wallet / daily / skins ---------------- */
  function wallet() { var c = store.get('coins', 0); return typeof c === 'number' && isFinite(c) && c >= 0 ? Math.floor(c) : 0; }
  function dailyInfo() {
    var s = store.get('daily', null), t = today();
    if (!s || typeof s.last !== 'string' || !(s.streak >= 1)) return { can: true, day: 1, streak: 0 };
    var diff = dayDiff(s.last, t);
    if (!isFinite(diff)) return { can: true, day: 1, streak: 0 };
    if (diff <= 0) return { can: false, day: s.streak, streak: s.streak };
    if (diff === 1) return { can: true, day: (s.streak % 7) + 1, streak: s.streak % 7 };
    return { can: true, day: 1, streak: 0 };
  }
  function ownedSkins() { var o = store.get('skins', ['grape']); if (!Array.isArray(o)) o = ['grape']; if (o.indexOf('grape') < 0) o.push('grape'); return o; }

  /* ---------------- DOM ---------------- */
  function el(tag, attrs, html) { var e = document.createElement(tag); if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); if (html !== undefined) e.innerHTML = html; return e; }
  function $(id) { return document.getElementById(id); }
  function toast(msg) {
    var old = stage.querySelector('.toast'); if (old) old.remove();
    var t = el('div', { 'class': 'toast', role: 'status' }); t.textContent = msg; stage.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 1600);
  }
  function soundBtnHTML() { return muted ? ICON.soundOff : ICON.soundOn; }
  function refreshSoundBtns() {
    [$('bSound'), $('bSoundM'), $('bSoundP')].forEach(function (b) { if (b) { b.innerHTML = soundBtnHTML(); b.setAttribute('aria-label', K.t(muted ? 'soundOff' : 'soundOn')); b.setAttribute('aria-pressed', muted ? 'false' : 'true'); } });
  }
  function toggleSound() { muted = !muted; store.set('mute', muted); if (!muted) { unlockAudio(); sfx('click'); } refreshSoundBtns(); }

  function buildDom() {
    var app = $('app');
    stage = el('div', { id: 'stage' });
    canvas = el('canvas', { id: 'game', 'aria-label': cfg.title.en, role: 'img' });
    stage.appendChild(canvas);
    var hud = el('div', { 'class': 'hud hidden', id: 'hud' },
      '<button class="btn icon" id="bPause"></button>' +
      '<div class="mid"><span class="best" id="hBest"></span><span class="score" id="hScore" aria-live="polite">0</span><span class="info" id="hInfo"></span></div>' +
      '<div class="side"><span class="pill" id="hCoins">' + ICON.coin + '<b>0</b></span><button class="btn icon" id="bSound"></button></div>');
    stage.appendChild(hud);
    app.appendChild(stage);
    /* ===== AD PLACEHOLDER: BANNER 320x50 — paste your banner tag (AdSense / AdinPlay) inside .slot ===== */
    var banner = el('div', { id: 'banner', 'class': EMBED ? 'off' : '' }, '<div class="slot" id="bannerSlot" role="complementary"></div>');
    app.appendChild(banner);
    ctx = canvas.getContext('2d');
    ui.hud = hud; ui.score = $('hScore'); ui.best = $('hBest'); ui.info = $('hInfo'); ui.coins = $('hCoins').querySelector('b');
    $('bPause').innerHTML = ICON.pause; $('bPause').onclick = function () { sfx('click'); pause(); };
    $('bSound').onclick = toggleSound;
    refreshLabels();
  }
  function refreshLabels() {
    document.documentElement.lang = K.lang; document.documentElement.dir = K.rtl ? 'rtl' : 'ltr';
    $('bPause').setAttribute('aria-label', K.t('pause'));
    $('bannerSlot').textContent = K.t('adBanner');
    refreshSoundBtns(); updateHud(false);
  }
  function setLang(l) {
    if (LANGS.indexOf(l) < 0) l = 'en';
    K.lang = l; K.rtl = l === 'ar'; store.set('lang', l);
    refreshLabels();
    if (game.lang) game.lang(K);
  }
  var lastScoreShown = -1;
  function updateHud(bump) {
    if (!ui.score) return;
    if (K.score !== lastScoreShown) {
      ui.score.textContent = fmt(K.score); lastScoreShown = K.score;
      if (bump && ui.score.animate) { try { ui.score.animate([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 180, easing: 'ease-out' }); } catch (e) { } }
    }
    ui.best.textContent = K.t('best').toUpperCase() + ' ' + fmt(Math.max(bestScore(), K.score));
    ui.coins.textContent = fmt(wallet());
  }
  function bestScore() { var b = store.get('best:' + cfg.id, 0); return typeof b === 'number' && isFinite(b) ? b : 0; }
  function closeScreens() { var s = stage.querySelectorAll('.screen'); for (var i = 0; i < s.length; i++) s[i].remove(); }
  function screen(id, html, dim) { var old = $(id); if (old) old.remove(); var s = el('div', { 'class': 'screen' + (dim ? ' dim' : ''), id: id }, html); stage.appendChild(s); return s; }

  function showMenu() {
    state = 'menu'; closeScreens(); ui.hud.classList.add('hidden'); Ads.gameplayStop();
    var di = dailyInfo();
    var s = screen('menu',
      '<div class="topbar"><a class="brand" target="_top" href="../' + (K.lang === 'en' ? '' : K.lang + '/') + 'index.html" aria-label="Bubzi">' + (cfg.mascot ? '' : bubziSVG('happy', 34)) + '<span>bubzi</span></a>' +
      '<span class="pill">' + ICON.coin + '<b>' + fmt(wallet()) + '</b></span></div>' +
      bubziSVG('happy').replace('class="mascot-svg"', 'class="mascot"') +
      '<h1 class="title">' + esc(cfg.title[K.lang] || cfg.title.en) + '</h1>' +
      '<p class="tag">' + esc(K.t('tagline')) + '</p>' +
      '<button class="btn big" id="bPlay">' + ICON.play + esc(K.t('play')) + '</button>' +
      '<p class="tag">' + esc(K.t('best')) + ': <b>' + fmt(bestScore()) + '</b></p>' +
      '<div class="bottom">' +
      '<button class="btn ghost" id="bDaily">' + ICON.gift + esc(K.t('daily')) + (di.can ? '<span class="dot"></span>' : '') + '</button>' +
      (cfg.noSkins ? '' : '<button class="btn ghost" id="bSkins">' + ICON.shirt + esc(K.t('skins')) + '</button>') +
      '<button class="btn icon" id="bSoundM"></button>' +
      '<select class="lang" id="selLang" aria-label="' + esc(K.t('lang')) + '"><option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option></select>' +
      '</div>');
    $('bPlay').onclick = function () { unlockAudio(); sfx('click'); startRound(); };
    $('bDaily').onclick = function () { sfx('click'); showDaily(); };
    if ($('bSkins')) $('bSkins').onclick = function () { sfx('click'); showSkins(); };
    $('bSoundM').onclick = toggleSound;
    var sel = $('selLang'); sel.value = K.lang;
    sel.onchange = function () { setLang(sel.value); showMenu(); };
    refreshSoundBtns();
    try { $('bPlay').focus({ preventScroll: true }); } catch (e) { }
    return s;
  }
  function showDaily() {
    var di = dailyInfo(), cells = '';
    for (var i = 1; i <= 7; i++) {
      var cls = (i < di.day || (!di.can && i === di.day)) ? 'done' : (di.can && i === di.day ? 'today' : '');
      cells += '<div class="' + cls + '">' + esc(K.t('day')) + ' ' + i + '<b>' + DAILY[i - 1] + '</b></div>';
    }
    screen('daily', '<div class="card"><h2>' + esc(K.t('daily')) + '</h2><div class="days">' + cells + '</div>' +
      '<div class="col">' + (di.can ? '<button class="btn orange big" id="bClaim">' + ICON.coin + esc(K.t('claim')) + ' +' + DAILY[di.day - 1] + '</button>' : '<p>' + esc(K.t('claimed')) + '</p>') +
      '<button class="btn ghost" id="bBack">' + esc(K.t('back')) + '</button></div></div>', true);
    if ($('bClaim')) $('bClaim').onclick = function () {
      var d = dailyInfo(); if (!d.can) return;
      var amt = DAILY[d.day - 1];
      store.set('coins', wallet() + amt); store.set('daily', { last: today(), streak: d.day });
      sfx('reward'); confetti(60); toast('+' + amt + ' ' + K.t('coins')); showMenu();
    };
    $('bBack').onclick = function () { sfx('click'); showMenu(); };
  }
  function showSkins() {
    var owned = ownedSkins(), cur = skin().id, html = '';
    SKINS.forEach(function (s) {
      var own = owned.indexOf(s.id) >= 0;
      html += '<button class="skin' + (s.id === cur ? ' sel' : '') + (own ? '' : ' locked') + '" data-id="' + s.id + '" aria-label="' + esc(s.n[K.lang]) + '">' +
        '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 14C50 14 59 27 59 39C59 52 47 59 32 59C17 59 5 52 5 39C5 27 14 14 32 14Z" fill="' + s.c + '" stroke="' + s.d + '" stroke-width="3"/><circle cx="23" cy="37" r="6" fill="#fff"/><circle cx="41" cy="37" r="6" fill="#fff"/><circle cx="24" cy="38" r="3" fill="#241B4D"/><circle cx="42" cy="38" r="3" fill="#241B4D"/></svg>' +
        '<span>' + esc(s.n[K.lang]) + '</span><span>' + (own ? (s.id === cur ? '✓' : esc(K.t('select'))) : s.p) + '</span></button>';
    });
    screen('skinsScr', '<div class="card"><h2>' + esc(K.t('skins')) + '</h2><span class="pill">' + ICON.coin + '<b>' + fmt(wallet()) + '</b></span><div class="skins">' + html + '</div>' +
      '<button class="btn ghost" id="bBack2" style="width:100%">' + esc(K.t('back')) + '</button></div>', true);
    var btns = stage.querySelectorAll('.skin');
    for (var i = 0; i < btns.length; i++) btns[i].onclick = function () {
      var id = this.getAttribute('data-id'), s = null;
      SKINS.forEach(function (x) { if (x.id === id) s = x; });
      if (!s) return;
      var o = ownedSkins();
      if (o.indexOf(id) >= 0) { store.set('skin', id); sfx('click'); }
      else if (wallet() >= s.p) { store.set('coins', wallet() - s.p); o.push(id); store.set('skins', o); store.set('skin', id); sfx('reward'); confetti(40); toast(K.t('unlocked')); }
      else { sfx('wrong'); toast(K.t('notEnough')); return; }
      showSkins();
    };
    $('bBack2').onclick = function () { sfx('click'); showMenu(); };
  }

  function startRound() {
    closeScreens(); parts.length = 0; ptrs = {};
    K.score = 0; K.coinsRound = 0; K.revived = false; K.round++; bonusPaid = 0; lastScoreShown = -1;
    K.tutorial = !store.get('tut:' + cfg.id, false);
    K.info('');
    game.reset(K);
    ui.hud.classList.remove('hidden');
    updateHud(false);
    state = 'playing'; Ads.gameplayStart();
    var pl = store.get('plays:' + cfg.id, 0); store.set('plays:' + cfg.id, (typeof pl === 'number' ? pl : 0) + 1);
    var rec = store.get('recent', []); if (!Array.isArray(rec)) rec = [];
    rec = rec.filter(function (r) { return r && r.id !== cfg.id; }); rec.unshift({ id: cfg.id, t: Date.now() }); store.set('recent', rec.slice(0, 12));
  }
  function pause() {
    if (state !== 'playing') return;
    state = 'paused'; Ads.gameplayStop(); ptrs = {};
    if (game.pointerCancel) game.pointerCancel(K);
    screen('pauseScr', '<div class="card"><h2>' + esc(K.t('paused')) + '</h2><div class="col">' +
      '<button class="btn big mint" id="bResume">' + ICON.play + esc(K.t('resume')) + '</button>' +
      '<button class="btn" id="bRestart">' + ICON.redo + esc(K.t('restart')) + '</button>' +
      '<div class="row"><button class="btn ghost" id="bHome">' + ICON.home + esc(K.t('home')) + '</button><button class="btn icon" id="bSoundP"></button></div></div></div>', true);
    $('bResume').onclick = function () { sfx('click'); resume(); };
    $('bRestart').onclick = function () { sfx('click'); startRound(); };
    $('bHome').onclick = function () { sfx('click'); showMenu(); };
    $('bSoundP').onclick = toggleSound; refreshSoundBtns();
    try { $('bResume').focus({ preventScroll: true }); } catch (e) { }
  }
  function resume() { if (state !== 'paused') return; closeScreens(); state = 'playing'; Ads.gameplayStart(); }

  function showOver() {
    state = 'over';
    var rate = cfg.coinRate || 0.02;
    var bonus = Math.max(0, Math.floor(K.score * rate) - bonusPaid); bonusPaid += bonus;
    if (bonus > 0) K.addCoins(bonus);
    var best = bestScore(), isNew = K.score > best && K.score > 0;
    if (isNew) { store.set('best:' + cfg.id, K.score); confetti(90); sfx('star'); }
    var canRevive = overInfo.canRevive !== false && typeof game.revive === 'function' && !K.revived;
    screen('overScr', '<div class="card">' + bubziSVG(isNew ? 'happy' : 'sad', 84) + '<h2>' + esc(overInfo.title || K.t('over')) + '</h2>' +
      (isNew ? '<span class="badge">' + esc(K.t('newBest')) + '</span>' : '') +
      '<div class="row"><div class="stat"><b>' + fmt(K.score) + '</b><span>' + esc(K.t('score')) + '</span></div>' +
      '<div class="stat"><b>' + fmt(Math.max(best, K.score)) + '</b><span>' + esc(K.t('best')) + '</span></div>' +
      '<div class="stat"><b>+' + fmt(K.coinsRound) + '</b><span>' + esc(K.t('earned')) + '</span></div></div>' +
      '<div class="col">' + (canRevive ? '<button class="btn mint" id="bCont">' + ICON.tv + esc(K.t('cont')) + '</button>' : '') +
      '<button class="btn big" id="bAgain">' + ICON.redo + esc(K.t('playAgain')) + '</button>' +
      '<button class="btn ghost" id="bMenu">' + ICON.home + esc(K.t('home')) + '</button></div></div>', true);
    if ($('bCont')) $('bCont').onclick = function () {
      sfx('click');
      Ads.rewarded(function (ok) {
        if (!ok || state !== 'over') return;
        closeScreens(); K.revived = true; ptrs = {}; game.revive(K); state = 'playing'; Ads.gameplayStart(); sfx('reward'); updateHud(false);
      });
    };
    $('bAgain').onclick = function () {
      sfx('click'); roundsSinceAd++;
      if (roundsSinceAd >= 2) { roundsSinceAd = 0; Ads.interstitial(function () { startRound(); }); } else startRound();
    };
    $('bMenu').onclick = function () { sfx('click'); showMenu(); };
    updateHud(false);
    try { $('bAgain').focus({ preventScroll: true }); } catch (e) { }
  }

  /* Placeholder ad overlay — remove once a real ad network is connected */
  function placeholderAd(kind, done) {
    var prev = state; state = 'ad';
    var secs = TEST ? 0.2 : (kind === 'rewarded' ? 5 : 3), left = secs, finished = false;
    var s = el('div', { 'class': 'screen', id: 'ad', role: 'dialog', 'aria-label': K.t('ad') },
      '<div class="adbox"><b>AD PLACEHOLDER</b><span>' + esc(K.t(kind === 'rewarded' ? 'adReward' : 'adInter')) + '</span><div class="count" id="adCount">' + Math.ceil(left) + '</div></div>' +
      (kind === 'rewarded' ? '<button class="btn ghost" id="adSkip">' + esc(K.t('skip')) + '</button>' : ''));
    stage.appendChild(s);
    function finish(ok) {
      if (finished) return; finished = true; clearInterval(iv); if (s.parentNode) s.remove();
      state = prev; done(ok);
    }
    var iv = setInterval(function () {
      left -= 0.1; var c = $('adCount'); if (c) c.textContent = Math.max(0, Math.ceil(left));
      if (left <= 0) { if (kind === 'rewarded') toast(K.t('reward')); finish(true); }
    }, 100);
    if ($('adSkip')) $('adSkip').onclick = function () { finish(false); };
  }

  /* ---------------- input ---------------- */
  function pos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function bindInput() {
    canvas.addEventListener('pointerdown', function (e) {
      unlockAudio();
      if (state !== 'playing') return;
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
      var p = pos(e); ptrs[e.pointerId] = { x0: p.x, y0: p.y, swiped: false };
      if (game.pointerDown) game.pointerDown(p.x, p.y, K, e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (state !== 'playing') return;
      var p = pos(e), pt = ptrs[e.pointerId];
      if (pt && !pt.swiped && game.swipe) {
        var dx = p.x - pt.x0, dy = p.y - pt.y0;
        if (Math.sqrt(dx * dx + dy * dy) > 26) { pt.swiped = true; game.swipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'), K); }
      }
      if (game.pointerMove) game.pointerMove(p.x, p.y, K, e.pointerId, !!pt);
    });
    function up(e) {
      var had = !!ptrs[e.pointerId]; delete ptrs[e.pointerId];
      if (state !== 'playing' || !had) return;
      var p = pos(e); if (game.pointerUp) game.pointerUp(p.x, p.y, K, e.pointerId);
    }
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    var GAMEKEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
    window.addEventListener('keydown', function (e) {
      unlockAudio();
      var c = e.code;
      if (state === 'playing') {
        if (c === 'Escape' || c === 'KeyP') { e.preventDefault(); pause(); return; }
        if (GAMEKEYS.indexOf(c) >= 0) e.preventDefault();
        if (game.key) game.key(c, true, K, e.repeat);
      } else if (state === 'paused' && (c === 'Escape' || c === 'KeyP')) { e.preventDefault(); resume(); }
      else if (state === 'menu' && (c === 'Space' || c === 'Enter') && (document.activeElement === document.body || document.activeElement === $('bPlay'))) { e.preventDefault(); sfx('click'); startRound(); }
    });
    window.addEventListener('keyup', function (e) { if (state === 'playing' && game.key) game.key(e.code, false, K, false); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
    window.addEventListener('blur', function () { if (!TEST) pause(); });
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  }
  function resize() {
    var r = stage.getBoundingClientRect();
    var W = Math.max(1, Math.round(r.width)), H = Math.max(1, Math.round(r.height)), nd = Math.min(2.5, window.devicePixelRatio || 1);
    if (W === K.W && H === K.H && nd === dpr && canvas.width) return;
    K.W = W; K.H = H; dpr = nd;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    if (game && game.resize) game.resize(K);
  }

  /* ---------------- loop ---------------- */
  var last = 0;
  function step(dt) {
    K.time += dt; K.dt = dt;
    if (state === 'playing') game.update(dt, K);
    else if (game.idle && (state === 'menu' || state === 'dying')) game.idle(dt, K, state);
    updateParts(dt);
    shakeMag *= Math.pow(0.0015, dt); if (shakeMag < 0.2) shakeMag = 0;
    flashA = Math.max(0, flashA - dt * 2.5);
    if (state === 'dying') { dyingT -= dt; if (dyingT <= 0) showOver(); }
  }
  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, K.W, K.H);
    ctx.save();
    if (shakeMag > 0) ctx.translate(rand(-shakeMag, shakeMag), rand(-shakeMag, shakeMag));
    game.draw(ctx, K, state);
    drawParts(ctx);
    ctx.restore();
    if (flashA > 0) { ctx.globalAlpha = flashA; ctx.fillStyle = flashC; ctx.fillRect(0, 0, K.W, K.H); ctx.globalAlpha = 1; }
  }
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!last) last = ts;
    var raw = Math.min(0.05, Math.max(0, (ts - last) / 1000)); last = ts;
    for (var i = 0; i < SPEED; i++) step(raw);
    render();
  }

  /* ---------------- boot ---------------- */
  window.BubziKit = {
    run: function (g) {
      game = g; cfg = g;
      var l = Q.get('lang') || store.get('lang', null) || (navigator.language || 'en').slice(0, 2).toLowerCase();
      K.lang = LANGS.indexOf(l) >= 0 ? l : 'en'; K.rtl = K.lang === 'ar';
      var th = cfg.theme || Q.get('theme') || store.get('theme', null); if (th === 'dark' || th === 'light') document.documentElement.setAttribute('data-theme', th);
      buildDom(); bindInput(); resize();
      if (game.init) game.init(K);
      game.reset(K);
      showMenu();
      if (AUTOSTART) startRound();
      Ads.loadingFinished();
      requestAnimationFrame(frame);
      window.__bubzi = { K: K, game: game, start: startRound, menu: showMenu, pause: pause, resume: resume,
        over: function () { K.gameOver(); }, state: function () { return state; }, parts: function () { return parts.length; } };
    }
  };
})();
