/* NEON OVERDRIVE: VOICE PROTOCOL — single-file cyber-arena survival shooter for Bubzi.
   Everything (boot screen, key box, menus, HUD, upgrade cards, waveform) is drawn on ONE full-viewport <canvas>:
   no HTML buttons, inputs or CSS overlays.
   ElevenLabs: with the player's own key, a live announcer (text-to-speech, eleven_turbo_v2_5, voice "Callum") and three
   generated heavy SFX (/v1/sound-generation). Without a key (BYPASS / OFFLINE SYNTH MODE): the built-in voice pack in
   audio/neon-overdrive/ (made by tools/art/neon/gen-audio.py with the same voice) plus the Web Audio SoundFX synth.
   Loop: requestAnimationFrame with delta time; simulation is frame-rate independent. */
(function () {
  'use strict';

  /* ================================================================ utils */
  var TAU = Math.PI * 2;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function hyp(x, y) { return Math.sqrt(x * x + y * y); }
  function damp(k, dt) { return 1 - Math.exp(-k * dt); }
  function angLerp(a, b, t) { var d = ((b - a + Math.PI * 3) % TAU) - Math.PI; return a + d * t; }
  function fmt(n) { return Math.floor(n).toLocaleString('en-US'); }
  var Q = new URLSearchParams(location.search), TEST = Q.has('test');
  var BASE = 'audio/neon-overdrive/';
  var reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  var Store = {
    get: function (k, d) { try { var v = localStorage.getItem('neon:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('neon:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    del: function (k) { try { localStorage.removeItem('neon:' + k); } catch (e) { /* private mode */ } }
  };
  var LANG = (function () {
    var l = Q.get('lang');
    if (!l) { try { l = JSON.parse(localStorage.getItem('bubzi:lang')); } catch (e) { l = null; } }
    l = String(l || navigator.language || 'en').slice(0, 2).toLowerCase();
    return ['en', 'fr', 'ar'].indexOf(l) >= 0 ? l : 'en';
  })();
  var RTL = LANG === 'ar';

  /* ================================================================ text */
  var STR = {
    en: { sub: 'VOICE PROTOCOL', init: 'NEURAL LINK INITIALIZATION', keyLabel: 'ELEVENLABS API KEY', keyPh: 'Paste (Ctrl+V) or type your key', paste: 'PASTE', connect: 'CONNECT', forget: 'FORGET KEY', bypass: 'BYPASS / OFFLINE SYNTH MODE',
      privacy: 'Your key is saved in this browser only and is sent only to api.elevenlabs.io.', linking: 'LINKING', linked: 'LINK ESTABLISHED', bad: 'LINK REJECTED: INVALID KEY', limit: 'RATE LIMITED: OFFLINE FALLBACK', quota: 'OUT OF CREDITS: OFFLINE FALLBACK', net: 'NO SIGNAL: OFFLINE FALLBACK', short: 'KEY TOO SHORT', clip: 'CLIPBOARD BLOCKED: USE CTRL+V', got: 'KEY RECEIVED', chars: 'chars',
      start: 'START RUN', controls: 'CONTROLS', relink: 'NEURAL LINK', sound: 'SOUND', voice: 'VOICE', on: 'ON', off: 'OFF', best: 'BEST', wave: 'WAVE', score: 'SCORE', integ: 'INTEGRITY', dash: 'DASH', left: 'HOSTILES', cleared: 'CLEARED', choose: 'CHOOSE AN UPGRADE', paused: 'PAUSED', resume: 'RESUME', quit: 'ABANDON RUN', lost: 'SIGNAL LOST', kills: 'KILLS', reboot: 'REBOOT', menu: 'MAIN MENU', newBest: 'NEW RECORD',
      modeLive: 'LIVE · ELEVENLABS', modePack: 'VOICE PACK', modeSynth: 'SYNTH', announcer: 'ANNOUNCER', sfx: 'SFX', sfxLive: 'GENERATED', sfxPack: 'PACK', lv: 'LV', boss: 'OVERMIND', bossWarn: 'BOSS SIGNATURE', back: 'BACK', tx: 'TX', idle: 'IDLE',
      awaiting: 'AWAITING KEY', online: 'ONLINE', offline: 'OFFLINE', rejected: 'REJECTED', kill2: 'DOUBLE KILL', kill3: 'TRIPLE KILL', kill6: 'RAMPAGE', tapHint: 'LEFT THUMB MOVE · RIGHT THUMB AIM + FIRE',
      ctl: ['WASD / ARROWS   move', 'MOUSE   aim        LEFT CLICK   fire', 'SPACE   dash (invulnerable)', '1 2 3   pick upgrade        ESC   pause'],
      ctlT: ['LEFT THUMB   move', 'RIGHT THUMB   aim + fire', 'DASH button   dash (invulnerable)', 'Tap a card to pick an upgrade'],
      u: { multi: ['MULTISHOT', '+1 projectile per shot'], pierce: ['PIERCING ROUNDS', 'Shots pass through +1 enemy'], dash: ['OVERCLOCKED DASH', '-30% cooldown, dash shreds enemies'], rapid: ['HYPER TRIGGER', '+22% fire rate'], boom: ['EXPLOSIVE ROUNDS', 'Shots burst on impact'], heal: ['NANO REPAIR', '+25 max integrity, full repair'], rail: ['RAIL COILS', '+35% damage, faster shots'] } },
    fr: { sub: 'PROTOCOLE VOCAL', init: 'INITIALISATION DU LIEN NEURAL', keyLabel: 'CLÉ API ELEVENLABS', keyPh: 'Colle (Ctrl+V) ou tape ta clé', paste: 'COLLER', connect: 'CONNEXION', forget: 'OUBLIER LA CLÉ', bypass: 'CONTOURNER / MODE SYNTHÉ HORS LIGNE',
      privacy: 'Ta clé reste dans ce navigateur et n’est envoyée qu’à api.elevenlabs.io.', linking: 'CONNEXION', linked: 'LIEN ÉTABLI', bad: 'LIEN REFUSÉ : CLÉ INVALIDE', limit: 'LIMITE ATTEINTE : MODE HORS LIGNE', quota: 'PLUS DE CRÉDITS : MODE HORS LIGNE', net: 'PAS DE SIGNAL : MODE HORS LIGNE', short: 'CLÉ TROP COURTE', clip: 'PRESSE-PAPIERS BLOQUÉ : CTRL+V', got: 'CLÉ REÇUE', chars: 'car.',
      start: 'LANCER', controls: 'COMMANDES', relink: 'LIEN NEURAL', sound: 'SON', voice: 'VOIX', on: 'OUI', off: 'NON', best: 'RECORD', wave: 'VAGUE', score: 'SCORE', integ: 'INTÉGRITÉ', dash: 'DASH', left: 'HOSTILES', cleared: 'TERMINÉE', choose: 'CHOISIS UNE AMÉLIORATION', paused: 'PAUSE', resume: 'REPRENDRE', quit: 'ABANDONNER', lost: 'SIGNAL PERDU', kills: 'ÉLIMINATIONS', reboot: 'REDÉMARRER', menu: 'MENU', newBest: 'NOUVEAU RECORD',
      modeLive: 'DIRECT · ELEVENLABS', modePack: 'PACK VOCAL', modeSynth: 'SYNTHÉ', announcer: 'ANNONCEUR', sfx: 'SFX', sfxLive: 'GÉNÉRÉS', sfxPack: 'PACK', lv: 'NV', boss: 'OVERMIND', bossWarn: 'SIGNATURE DE BOSS', back: 'RETOUR', tx: 'TX', idle: 'VEILLE',
      awaiting: 'EN ATTENTE DE CLÉ', online: 'EN LIGNE', offline: 'HORS LIGNE', rejected: 'REFUSÉ', kill2: 'DOUBLÉ', kill3: 'TRIPLÉ', kill6: 'CARNAGE', tapHint: 'POUCE GAUCHE BOUGER · POUCE DROIT VISER + TIRER',
      ctl: ['ZQSD / FLÈCHES   bouger', 'SOURIS   viser        CLIC GAUCHE   tirer', 'ESPACE   dash (invulnérable)', '1 2 3   amélioration        ÉCHAP   pause'],
      ctlT: ['POUCE GAUCHE   bouger', 'POUCE DROIT   viser + tirer', 'Bouton DASH   dash (invulnérable)', 'Touche une carte pour choisir'],
      u: { multi: ['TIR MULTIPLE', '+1 projectile par tir'], pierce: ['BALLES PERFORANTES', 'Les tirs traversent +1 ennemi'], dash: ['DASH SURCADENCÉ', '-30 % de recharge, le dash déchiquette'], rapid: ['GÂCHETTE HYPER', '+22 % de cadence'], boom: ['BALLES EXPLOSIVES', 'Les tirs explosent à l’impact'], heal: ['NANO-RÉPARATION', '+25 intégrité max, réparation totale'], rail: ['BOBINES RAIL', '+35 % de dégâts, tirs plus rapides'] } },
    ar: { sub: 'بروتوكول الصوت', init: 'تهيئة الرابط العصبي', keyLabel: 'مفتاح ElevenLabs API', keyPh: 'الصق (Ctrl+V) أو اكتب مفتاحك', paste: 'لصق', connect: 'اتصال', forget: 'انسَ المفتاح', bypass: 'تخطٍّ / وضع المُركِّب دون اتصال',
      privacy: 'يُحفظ مفتاحك في هذا المتصفح فقط ولا يُرسل إلا إلى api.elevenlabs.io.', linking: 'جارٍ الربط', linked: 'تم إنشاء الرابط', bad: 'رُفض الرابط: مفتاح غير صالح', limit: 'تجاوز الحد: وضع دون اتصال', quota: 'نفد الرصيد: وضع دون اتصال', net: 'لا إشارة: وضع دون اتصال', short: 'المفتاح قصير جداً', clip: 'الحافظة محظورة: استخدم Ctrl+V', got: 'تم استلام المفتاح', chars: 'حرفاً',
      start: 'ابدأ الجولة', controls: 'التحكم', relink: 'الرابط العصبي', sound: 'الصوت', voice: 'المعلّق', on: 'تشغيل', off: 'إيقاف', best: 'الأفضل', wave: 'الموجة', score: 'النقاط', integ: 'السلامة', dash: 'اندفاع', left: 'الأعداء', cleared: 'انتهت', choose: 'اختر ترقية', paused: 'إيقاف مؤقت', resume: 'استئناف', quit: 'إنهاء الجولة', lost: 'فُقدت الإشارة', kills: 'القتلى', reboot: 'إعادة التشغيل', menu: 'القائمة', newBest: 'رقم قياسي جديد',
      modeLive: 'مباشر · ElevenLabs', modePack: 'حزمة الصوت', modeSynth: 'مُركِّب', announcer: 'المعلّق', sfx: 'المؤثرات', sfxLive: 'مولَّدة', sfxPack: 'حزمة', lv: 'م', boss: 'العقل الأعلى', bossWarn: 'بصمة الزعيم', back: 'رجوع', tx: 'بث', idle: 'خامل',
      awaiting: 'بانتظار المفتاح', online: 'متصل', offline: 'دون اتصال', rejected: 'مرفوض', kill2: 'قتل مزدوج', kill3: 'قتل ثلاثي', kill6: 'هيجان', tapHint: 'الإبهام الأيسر للحركة · الأيمن للتصويب والإطلاق',
      ctl: ['WASD / الأسهم   حركة', 'الفأرة   تصويب        النقر الأيسر   إطلاق', 'المسافة   اندفاع (حصانة)', '1 2 3   اختيار ترقية        ESC   إيقاف'],
      ctlT: ['الإبهام الأيسر   حركة', 'الإبهام الأيمن   تصويب وإطلاق', 'زر الاندفاع   اندفاع (حصانة)', 'المس بطاقة لاختيار الترقية'],
      u: { multi: ['طلقات متعددة', '+1 مقذوف لكل طلقة'], pierce: ['طلقات خارقة', 'الطلقات تخترق عدواً إضافياً'], dash: ['اندفاع فائق', '-30٪ تبريد والاندفاع يمزّق الأعداء'], rapid: ['زناد فائق', '+22٪ سرعة إطلاق'], boom: ['طلقات متفجرة', 'الطلقات تنفجر عند الاصطدام'], heal: ['إصلاح نانوي', '+25 سلامة قصوى وإصلاح كامل'], rail: ['ملفات السكة', '+35٪ ضرر وطلقات أسرع'] } }
  };
  var T = STR[LANG];
  // Announcer lines. Same text as tools/art/neon/lines.json (the built-in pack). DYN = live-only versions with a number.
  var LINES = {
    link: { en: 'Neural link established. Survive.', fr: 'Connexion neurale établie. Survis.', ar: 'تم إنشاء الرابط العصبي. انجُ.' },
    start: { en: 'Arena online. Fight.', fr: 'Arène en ligne. Combats.', ar: 'الساحة متصلة. قاتل.' },
    wave: { en: 'Next wave. Incoming.', fr: 'Vague suivante. En approche.', ar: 'الموجة التالية. إنهم قادمون.' },
    clear: { en: 'Wave cleared. Choose your upgrade.', fr: 'Vague terminée. Choisis ton amélioration.', ar: 'تم تطهير الموجة. اختر ترقيتك.' },
    double: { en: 'Double kill.', fr: 'Double élimination.', ar: 'قتل مزدوج.' },
    triple: { en: 'Triple kill. Brutal.', fr: 'Triple élimination. Brutal.', ar: 'قتل ثلاثي. وحشي.' },
    rampage: { en: 'Rampage. Unstoppable.', fr: 'Carnage total. Rien ne t’arrête.', ar: 'هيجان كامل. لا أحد يوقفك.' },
    boss: { en: 'Warning: Boss signature detected.', fr: 'Alerte : signature de boss détectée.', ar: 'تحذير: تم رصد بصمة الزعيم.' },
    bossdown: { en: 'Boss signature terminated.', fr: 'Signature du boss éliminée.', ar: 'تم القضاء على بصمة الزعيم.' },
    critical: { en: 'System critical.', fr: 'Système critique.', ar: 'النظام في حالة حرجة.' },
    repair: { en: 'Integrity restored.', fr: 'Intégrité restaurée.', ar: 'تمت استعادة السلامة.' },
    upgrade: { en: 'Upgrade installed.', fr: 'Amélioration installée.', ar: 'تم تثبيت الترقية.' },
    dead: { en: 'Signal lost. Neural link severed.', fr: 'Signal perdu. Lien neural rompu.', ar: 'فُقدت الإشارة. انقطع الرابط العصبي.' },
    record: { en: 'New record. Legendary.', fr: 'Nouveau record. Légendaire.', ar: 'رقم قياسي جديد. أسطوري.' }
  };
  var DYN = {
    wave: { en: 'Wave {n}. Incoming.', fr: 'Vague {n}. En approche.', ar: 'الموجة {n}. إنهم قادمون.' },
    clear: { en: 'Wave {n} cleared. Choose your upgrade.', fr: 'Vague {n} terminée. Choisis ton amélioration.', ar: 'تم تطهير الموجة {n}. اختر ترقيتك.' },
    dead: { en: 'Signal lost. Final score: {n}.', fr: 'Signal perdu. Score final : {n}.', ar: 'فُقدت الإشارة. النتيجة النهائية: {n}.' }
  };
  var SFXP = {
    impact: { text: 'heavy sci-fi bass impact, metallic crunch, punchy, short, no music', dur: 1.0 },
    explode: { text: 'deep cyberpunk explosion with electric crackle and sub bass boom, punchy', dur: 1.6 },
    alarm: { text: 'ominous low synth warning horn, sci-fi boss alarm, two long blasts', dur: 2.5 }
  };

  /* ================================================================ colors */
  var C = { bg: '#07070c', cyan: '#2ef9ff', mag: '#ff2bd6', amb: '#ffc23d', lime: '#3dff8b', vio: '#9b5cff', red: '#ff3355', white: '#eafcff', dim: '#5f6b9a', grid: '#1a2150' };
  var RGB = {};
  function rgba(hex, a) {
    var c = RGB[hex]; if (!c) { var n = parseInt(hex.slice(1), 16); c = RGB[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  /* ================================================================ canvas */
  document.documentElement.style.cssText = 'margin:0;height:100%;background:' + C.bg;
  document.body.style.cssText = 'margin:0;height:100%;overflow:hidden;background:' + C.bg + ';touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent';
  var cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;display:block;outline:none;touch-action:none;cursor:none';
  cv.tabIndex = 0; cv.setAttribute('aria-label', 'Neon Overdrive: Voice Protocol'); cv.setAttribute('role', 'application');
  (document.getElementById('app') || document.body).appendChild(cv);
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, DPR = 1, Qual = 1, MAXDPR = 2, Z = 1, U = 1;
  var FONT = '"Rajdhani","Orbitron","Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif', MONO = 'ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace';
  var scanPat = null, vig = null;
  function resize() {
    W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight);
    DPR = Math.min(MAXDPR, window.devicePixelRatio || 1);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    Z = clamp(Math.min(W, H * 1.7) / 1150, 0.52, 1.2); U = clamp(Math.min(W / 620, H / 700), 0.6, 1.3);
    var s = document.createElement('canvas'); s.width = 2; s.height = 4; var sc = s.getContext('2d');
    sc.fillStyle = 'rgba(0,0,0,0.13)'; sc.fillRect(0, 2, 2, 1); scanPat = ctx.createPattern(s, 'repeat');
    vig = document.createElement('canvas'); vig.width = 256; vig.height = 256; var vc = vig.getContext('2d');
    var g = vc.createRadialGradient(128, 128, 80, 128, 128, 182); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
    vc.fillStyle = g; vc.fillRect(0, 0, 256, 256);
  }
  window.addEventListener('resize', resize); resize();
  function glow(col, b) { if (Qual < 0.5) { ctx.shadowBlur = 0; return; } ctx.shadowColor = col; ctx.shadowBlur = b * Qual; }
  function noGlow() { ctx.shadowBlur = 0; }
  function spacing(px) { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; }
  function text(s, x, y, size, col, align, o) {
    o = o || {};
    ctx.font = (o.w || 700) + ' ' + Math.round(size) + 'px ' + (o.mono ? MONO : FONT);
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col;
    if (o.sp) spacing(o.sp);
    if (o.glow) glow(o.gc || col, o.glow);
    if (o.max) { var w = ctx.measureText(s).width; if (w > o.max) { ctx.font = (o.w || 700) + ' ' + Math.max(8, Math.floor(size * o.max / w)) + 'px ' + (o.mono ? MONO : FONT); } }
    ctx.fillText(s, x, y); noGlow(); if (o.sp) spacing(0);
  }
  function chamfer(x, y, w, h, c) {
    ctx.beginPath(); ctx.moveTo(x + c, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h - c); ctx.lineTo(x + w - c, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + c); ctx.closePath();
  }
  function poly(x, y, r, n, rot) { ctx.beginPath(); for (var i = 0; i < n; i++) { var a = rot + i / n * TAU; if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); }
  var GLOWS = {};
  function glowSprite(col) {
    var g = GLOWS[col]; if (g) return g;
    g = document.createElement('canvas'); g.width = g.height = 64; var c = g.getContext('2d'), gr = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, rgba(col, 0.9)); gr.addColorStop(0.25, rgba(col, 0.35)); gr.addColorStop(1, rgba(col, 0)); c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
    return (GLOWS[col] = g);
  }
  function blob(x, y, r, col) { ctx.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2); }

  /* ================================================================ audio core */
  var AC = null, BUS = {}, muted = !!Store.get('mute', false), voiceOn = Store.get('voice', true) !== false;
  function audio() {
    if (AC) { if (AC.state === 'suspended') { try { AC.resume(); } catch (e) { /* ignore */ } } return AC; }
    var Ctor = window.AudioContext || window.webkitAudioContext; if (!Ctor) return null;
    try { AC = new Ctor(); } catch (e) { return null; }
    var comp = AC.createDynamicsCompressor(); comp.threshold.value = -12; comp.knee.value = 8; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
    BUS.master = AC.createGain(); BUS.master.gain.value = muted ? 0 : 0.85; BUS.master.connect(comp); comp.connect(AC.destination);
    BUS.mixAn = AC.createAnalyser(); BUS.mixAn.fftSize = 512; comp.connect(BUS.mixAn);
    BUS.sfx = AC.createGain(); BUS.sfx.gain.value = 0.8; BUS.sfx.connect(BUS.master);
    // announcer chain: radio band, grit, slapback echo; the analyser feeds the HUD waveform
    var hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 140;
    var pk = AC.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 2600; pk.Q.value = 0.9; pk.gain.value = 5;
    var sh = AC.createWaveShaper(); sh.curve = shaper(1.5); sh.oversample = '2x';
    BUS.voice = AC.createGain();
    BUS.voiceAn = AC.createAnalyser(); BUS.voiceAn.fftSize = 1024; BUS.voiceAn.smoothingTimeConstant = 0.55;
    var out = AC.createGain(); out.gain.value = 1.1;
    var dl = AC.createDelay(0.5); dl.delayTime.value = 0.085; var fb = AC.createGain(); fb.gain.value = 0.22; var wet = AC.createGain(); wet.gain.value = 0.18;
    BUS.voice.connect(hp); hp.connect(pk); pk.connect(sh); sh.connect(BUS.voiceAn); BUS.voiceAn.connect(out); out.connect(BUS.master);
    sh.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(BUS.master);
    var nb = AC.createBuffer(1, AC.sampleRate, AC.sampleRate), d = nb.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; BUS.noise = nb;
    Heavy.loadPack(); Voice.preloadPack();
    return AC;
  }
  function shaper(k) { var n = 1024, c = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); } return c; }
  function setMuted(m) { muted = m; Store.set('mute', m); if (BUS.master) BUS.master.gain.setTargetAtTime(m ? 0 : 0.85, AC.currentTime, 0.02); }
  function decode(ab) { return new Promise(function (res, rej) { AC.decodeAudioData(ab, res, rej); }); }
  function blobToBuf(b) { return (b.arrayBuffer ? b.arrayBuffer() : new Response(b).arrayBuffer()).then(decode); }
  function fetchBuf(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error('missing ' + url); return r.arrayBuffer(); }).then(decode); }

  /* ---------------- SoundFX: Web Audio synth (rapid fire, UI, and fallback for every heavy sound) */
  function SoundFX() { this.last = {}; this.voices = 0; }
  SoundFX.prototype.ok = function (name, gap) {
    if (!AC || muted || !BUS.sfx) return false; var t = AC.currentTime;
    if (gap && this.last[name] !== undefined && t - this.last[name] < gap) return false;
    if (this.voices > 30) return false; this.last[name] = t; return true;
  };
  SoundFX.prototype.osc = function (o) {
    var self = this, t = AC.currentTime + (o.at || 0), os = AC.createOscillator(), g = AC.createGain(), node = os;
    os.type = o.type || 'sine'; os.frequency.setValueAtTime(o.f, t);
    if (o.f2) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + (o.sweep || o.dur));
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol, t + (o.a || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    if (o.lp) { var f = AC.createBiquadFilter(); f.type = o.ft || 'lowpass'; f.frequency.value = o.lp; f.Q.value = o.q || 0.7; os.connect(f); node = f; }
    node.connect(g); g.connect(BUS.sfx); os.start(t); os.stop(t + o.dur + 0.03);
    this.voices++; os.onended = function () { self.voices--; };
  };
  SoundFX.prototype.nz = function (o) {
    var self = this, t = AC.currentTime + (o.at || 0), s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = BUS.noise; s.loop = true; f.type = o.ft || 'lowpass'; f.Q.value = o.q || 0.8;
    f.frequency.setValueAtTime(o.f, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol, t + (o.a || 0.003)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    s.connect(f); f.connect(g); g.connect(BUS.sfx); s.start(t, Math.random() * 0.5); s.stop(t + o.dur + 0.03);
    this.voices++; s.onended = function () { self.voices--; };
  };
  SoundFX.prototype.pew = function () { if (!this.ok('pew', 0.045)) return; var f = rnd(1250, 1700); this.osc({ type: 'square', f: f, f2: f * 0.17, dur: 0.09, vol: 0.05, lp: 4200 }); this.osc({ type: 'sawtooth', f: f * 0.5, f2: 110, dur: 0.07, vol: 0.03, lp: 2400 }); };
  SoundFX.prototype.dash = function () { if (!this.ok('dash', 0.08)) return; this.nz({ ft: 'bandpass', f: 500, f2: 3200, dur: 0.24, vol: 0.28, q: 1.3, a: 0.02 }); this.osc({ f: 220, f2: 950, dur: 0.18, vol: 0.07 }); };
  SoundFX.prototype.hit = function () { if (!this.ok('hit', 0.03)) return; this.osc({ type: 'triangle', f: rnd(800, 1000), f2: 280, dur: 0.05, vol: 0.06 }); this.nz({ ft: 'highpass', f: 3000, dur: 0.03, vol: 0.05 }); };
  SoundFX.prototype.pop = function () { if (!this.ok('pop', 0.035)) return; this.osc({ type: 'square', f: rnd(420, 560), f2: 70, dur: 0.13, vol: 0.09, lp: 1900 }); this.nz({ f: 3200, f2: 260, dur: 0.16, vol: 0.13 }); };
  SoundFX.prototype.boom = function (size) {
    if (!this.ok('boom', 0.06)) return;
    if (Heavy.play('explode', 0.55 + 0.4 * size)) return;
    this.osc({ f: 150, f2: 30, dur: 0.65, vol: 0.5 * size + 0.1 }); this.nz({ f: 2600, f2: 120, dur: 0.75, vol: 0.4 * size + 0.1 }); this.osc({ type: 'sawtooth', f: 70, f2: 28, dur: 0.45, vol: 0.14, lp: 420 });
  };
  SoundFX.prototype.impact = function () { if (!this.ok('impact', 0.08)) return; if (Heavy.play('impact', 0.7)) return; this.osc({ f: 210, f2: 42, dur: 0.26, vol: 0.4 }); this.nz({ f: 1600, f2: 200, dur: 0.22, vol: 0.25 }); };
  SoundFX.prototype.hurt = function () { if (!this.ok('hurt', 0.1)) return; this.osc({ type: 'sawtooth', f: 320, f2: 65, dur: 0.3, vol: 0.18, lp: 1500 }); this.nz({ ft: 'bandpass', f: 900, dur: 0.22, vol: 0.18 }); this.impact(); };
  SoundFX.prototype.chime = function () { if (!this.ok('chime', 0.1)) return; var s = this; [880, 1320, 1760, 2640].forEach(function (f, i) { s.osc({ f: f, dur: 0.55, vol: 0.07, at: i * 0.06 }); s.osc({ type: 'triangle', f: f * 2, dur: 0.25, vol: 0.02, at: i * 0.06 }); }); };
  SoundFX.prototype.hover = function () { if (!this.ok('hover', 0.05)) return; this.osc({ f: 2400, dur: 0.03, vol: 0.025 }); };
  SoundFX.prototype.click = function () { if (!this.ok('click', 0.03)) return; this.osc({ type: 'square', f: 1300, f2: 600, dur: 0.05, vol: 0.05, lp: 3200 }); };
  SoundFX.prototype.type = function () { if (!this.ok('type', 0.02)) return; this.osc({ type: 'square', f: rnd(2200, 3600), dur: 0.018, vol: 0.02, lp: 5000 }); };
  SoundFX.prototype.err = function () { if (!this.ok('err', 0.2)) return; this.osc({ type: 'square', f: 220, dur: 0.12, vol: 0.06, lp: 1200 }); this.osc({ type: 'square', f: 180, dur: 0.18, vol: 0.06, lp: 1200, at: 0.13 }); };
  SoundFX.prototype.charge = function () { if (!this.ok('charge', 0.15)) return; this.osc({ f: 260, f2: 1500, dur: 0.95, vol: 0.03, a: 0.25 }); };
  SoundFX.prototype.snipe = function () { if (!this.ok('snipe', 0.05)) return; this.osc({ type: 'sawtooth', f: 2300, f2: 180, dur: 0.17, vol: 0.08, lp: 6000 }); this.nz({ ft: 'highpass', f: 4000, dur: 0.05, vol: 0.08 }); };
  SoundFX.prototype.ring = function () { if (!this.ok('ring', 0.1)) return; this.osc({ type: 'triangle', f: 420, f2: 140, dur: 0.22, vol: 0.08 }); };
  SoundFX.prototype.alarm = function () { if (!this.ok('alarm', 1)) return; if (Heavy.play('alarm', 0.75, 1)) return; var s = this; [0, 0.55].forEach(function (at) { s.osc({ type: 'sawtooth', f: 180, f2: 140, dur: 0.45, vol: 0.12, lp: 900, at: at, a: 0.05 }); }); };
  SoundFX.prototype.pickup = function () { if (!this.ok('pickup', 0.05)) return; this.osc({ f: 600, f2: 1800, dur: 0.15, vol: 0.09 }); this.osc({ type: 'triangle', f: 1200, f2: 2400, dur: 0.12, vol: 0.05, at: 0.06 }); };
  SoundFX.prototype.wave = function () { if (!this.ok('wave', 0.5)) return; this.osc({ type: 'sawtooth', f: 110, f2: 220, dur: 0.6, vol: 0.1, lp: 900, a: 0.05 }); this.osc({ f: 880, dur: 0.4, vol: 0.04, at: 0.3 }); };
  var SFX = new SoundFX();

  /* ---------------- heavy sounds: ElevenLabs generated (live) > built-in pack > synth */
  var Heavy = {
    ids: ['impact', 'explode', 'alarm'], buf: {}, src: {}, state: {},
    loadPack: function () {
      this.ids.forEach(function (id) {
        fetchBuf(BASE + 'sfx_' + id + '.mp3').then(function (b) { if (Heavy.src[id] !== 'live') { Heavy.buf[id] = b; Heavy.src[id] = 'pack'; } }, function () { /* synth stays */ });
      });
    },
    generate: function (key) {
      var p = Promise.resolve();
      this.ids.forEach(function (id) {
        p = p.then(function () {
          Heavy.state[id] = 'gen';
          return XI.sfx(key, SFXP[id].text, SFXP[id].dur).then(blobToBuf).then(function (b) { Heavy.buf[id] = b; Heavy.src[id] = 'live'; Heavy.state[id] = 'ok'; Log.add('sfx.' + id + ' ........ OK', C.lime); },
            function (e) { Heavy.state[id] = 'fail'; Log.add('sfx.' + id + ' ........ ' + (e && e.status ? 'HTTP ' + e.status : 'FAIL') + ' > FALLBACK', C.amb); });
        });
      });
      return p;
    },
    play: function (id, vol, rate) {
      var b = this.buf[id]; if (!b) return false; if (!AC || muted) return true;
      var s = AC.createBufferSource(), g = AC.createGain(); s.buffer = b; s.playbackRate.value = rate || rnd(0.88, 1.12); g.gain.value = vol == null ? 0.9 : vol;
      s.connect(g); g.connect(BUS.sfx); s.start(); return true;
    },
    label: function () { var l = 0, p = 0; this.ids.forEach(function (id) { if (Heavy.src[id] === 'live') l++; else if (Heavy.src[id] === 'pack') p++; }); return l ? T.sfxLive + ' ×' + l : p ? T.sfxPack : T.modeSynth; }
  };

  /* ---------------- ElevenLabs REST client */
  var XI = {
    base: 'https://api.elevenlabs.io/v1', voice: 'N2lVS1w4EtoT3dr4eOWO', model: 'eleven_turbo_v2_5', chars: 0, calls: 0,
    req: function (key, path, body) {
      XI.calls++;
      return fetch(this.base + path, { method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' }, body: JSON.stringify(body) })
        .then(function (r) {
          if (r.ok) return r.blob();
          return r.text().then(function (t) {
            var e = new Error('HTTP ' + r.status); e.status = r.status;
            e.kind = /quota|credit/i.test(t) ? 'quota' : (r.status === 401 || r.status === 403) ? 'bad' : r.status === 429 ? 'limit' : r.status === 402 ? 'quota' : 'net';
            throw e;
          });
        }, function () { var e = new Error('network'); e.kind = 'net'; throw e; });
    },
    tts: function (key, txt) {
      XI.chars += txt.length;
      return this.req(key, '/text-to-speech/' + this.voice + '?output_format=mp3_44100_128', { text: txt, model_id: this.model, language_code: LANG, voice_settings: { stability: 0.35, similarity_boost: 0.8, style: 0.55, use_speaker_boost: true } });
    },
    sfx: function (key, txt, dur) { return this.req(key, '/sound-generation', { text: txt, duration_seconds: dur, prompt_influence: 0.6 }); }
  };

  /* ---------------- Announcer: phrase cache (Blob URLs + decoded buffers), priority queue, never talks over himself */
  var Voice = {
    mode: 'pack', key: '', cache: {}, pack: {}, q: [], busy: false, cur: null, src: null, liveOffUntil: 0, lastErr: '',
    text: function (id, n) { return n != null && DYN[id] && this.mode === 'live' ? DYN[id][LANG].replace('{n}', n) : LINES[id][LANG]; },
    say: function (id, o) {
      o = o || {}; if (!LINES[id]) return;
      var txt = this.text(id, o.n);
      for (var i = 0; i < this.q.length; i++) if (this.q[i].id === id) { this.q[i].text = txt; return; }
      if (this.cur && this.cur.id === id && clock - this.cur.t0 < 0.6) return;
      this.q.push({ id: id, text: txt, pr: o.pr || 1, t: clock, ttl: o.ttl || 3 });
      this.q.sort(function (a, b) { return b.pr - a.pr; }); if (this.q.length > 3) this.q.length = 3;
      this.pump();
    },
    pump: function () {
      var self = this; if (this.busy || !this.q.length) return;
      var it = this.q.shift(); if (clock - it.t > it.ttl) { this.pump(); return; }
      this.busy = true;
      var done = function (buf) {
        if (clock - it.t > it.ttl + 2.5 && it.pr < 4) { self.busy = false; self.pump(); return; }
        if (buf && AC && voiceOn && !muted) self.play(buf, it);
        else self.mute(it, buf ? buf.duration : 1.4); // subtitles + visualizer still run
      };
      if (!voiceOn) { done(null); return; }
      this.clip(it).then(done, function () { done(null); });
    },
    clip: function (it) {
      var self = this, k = LANG + '|' + it.text, c = this.cache[k];
      if (c) return Promise.resolve(c.buf);
      if (this.mode === 'live' && this.key && clock > this.liveOffUntil && AC) {
        return XI.tts(this.key, it.text).then(function (b) { return self.store(k, b); })
          .catch(function (e) { self.fail(e); return self.packClip(it.id); });
      }
      return this.packClip(it.id);
    },
    store: function (k, b) { var url = URL.createObjectURL(b), self = this; return blobToBuf(b).then(function (buf) { self.cache[k] = { url: url, buf: buf }; return buf; }); },
    prewarm: function (ids) {
      var self = this, p = Promise.resolve();
      ids.forEach(function (id) {
        p = p.then(function () { var txt = LINES[id][LANG], k = LANG + '|' + txt; if (self.cache[k] || self.mode !== 'live') return null; return XI.tts(self.key, txt).then(function (b) { return self.store(k, b); }).catch(function (e) { self.fail(e); }); });
      });
    },
    packClip: function (id) {
      var self = this; if (this.pack[id]) return Promise.resolve(this.pack[id]); if (!AC) return Promise.resolve(null);
      return fetchBuf(BASE + 'vo_' + LANG + '_' + id + '.mp3').then(function (b) { self.pack[id] = b; return b; }, function () { return null; });
    },
    preloadPack: function () { var self = this; Object.keys(LINES).forEach(function (id) { self.packClip(id); }); },
    play: function (buf, it) {
      var self = this, s = AC.createBufferSource(); s.buffer = buf; s.connect(BUS.voice);
      this.cur = { id: it.id, text: it.text, t0: clock, dur: buf.duration, real: true }; this.src = s;
      BUS.sfx.gain.setTargetAtTime(0.5, AC.currentTime, 0.05);
      s.onended = function () { if (self.src !== s) return; self.end(); };
      s.start();
    },
    mute: function (it, dur) { var self = this, cur = this.cur = { id: it.id, text: it.text, t0: clock, dur: dur, real: false }; setTimeout(function () { if (self.cur === cur) self.end(); }, dur * 1000); },
    end: function () { var self = this; this.cur = null; this.src = null; this.busy = false; if (BUS.sfx) BUS.sfx.gain.setTargetAtTime(0.8, AC.currentTime, 0.15); setTimeout(function () { self.pump(); }, 140); },
    stop: function () { this.q.length = 0; if (this.src) { var s = this.src; this.src = null; try { s.stop(); } catch (e) { /* ended */ } } this.cur = null; this.busy = false; },
    fail: function (e) {
      this.lastErr = e && e.kind || 'net';
      if (this.lastErr === 'bad') { this.mode = 'pack'; Log.add('elevenlabs.tts ...... ' + T.rejected, C.red); }
      else { this.liveOffUntil = clock + 30; Log.add('elevenlabs.tts ...... ' + (T[this.lastErr] || T.net), C.amb); }
    },
    speaking: function () { return !!this.cur; },
    label: function () { return this.mode === 'live' && clock > this.liveOffUntil ? T.modeLive : Object.keys(this.pack).length ? T.modePack : T.modeSynth; }
  };

  /* ---------------- boot log + link */
  var Log = {
    lines: [], add: function (s, col) { this.lines.push({ s: s, col: col || C.dim, t: clock }); if (this.lines.length > 6) this.lines.shift(); }
  };
  var Link = {
    status: '', col: C.dim, busy: false, t: 0,
    set: function (k, col) { this.status = k; this.col = col || C.dim; this.t = clock; },
    connect: function (key) {
      key = (key || '').trim(); if (this.busy) return;
      if (key.length < 20) { this.set('short', C.red); SFX.err(); return; }
      audio(); this.busy = true; this.set('linking', C.cyan); Log.add('elevenlabs.tts ...... ' + T.linking.toUpperCase(), C.cyan);
      var self = this, txt = LINES.link[LANG];
      XI.tts(key, txt).then(function (b) {
        Store.set('key', key); Voice.key = key; Voice.mode = 'live'; Voice.liveOffUntil = 0;
        return Voice.store(LANG + '|' + txt, b).then(function () {
          self.busy = false; self.set('linked', C.lime); Log.add('elevenlabs.tts ...... ' + T.online, C.lime); SFX.chime();
          Voice.say('link', { pr: 5, ttl: 8 }); Heavy.generate(key); Voice.prewarm(['start', 'double', 'triple', 'critical', 'boss']);
          setTimeout(function () { if (screen === 'boot') go('menu'); }, 1700);
        });
      }).catch(function (e) {
        self.busy = false; var k = e && e.kind || 'net';
        self.set(k, k === 'bad' ? C.red : C.amb); Voice.mode = 'pack'; SFX.err();
        Log.add('elevenlabs.tts ...... ' + (k === 'bad' ? T.rejected : T.offline) + (e && e.status ? ' (HTTP ' + e.status + ')' : ''), k === 'bad' ? C.red : C.amb);
      });
    },
    bypass: function () { audio(); Voice.mode = 'pack'; Voice.key = ''; Log.add('elevenlabs ........ ' + T.offline, C.mag); go('menu'); Voice.say('link', { pr: 5, ttl: 8 }); SFX.chime(); }
  };

  /* ---------------- canvas key box (masked) */
  var KeyBox = {
    val: String(Store.get('key', '') || ''), focus: true, rect: null,
    key: function (e) {
      if (e.ctrlKey || e.metaKey) { if (e.code === 'KeyV') pasteFallback(); return false; }
      if (e.key === 'Backspace') { this.val = this.val.slice(0, -1); SFX.type(); return true; }
      if (e.key === 'Delete') { this.val = ''; SFX.type(); return true; }
      if (e.key === 'Enter') { Link.connect(this.val); return true; }
      if (e.key === 'Escape') { this.focus = false; return true; }
      if (e.key && e.key.length === 1 && /[A-Za-z0-9_\-]/.test(e.key)) { if (this.val.length < 128) this.val += e.key; SFX.type(); return true; }
      return false;
    },
    paste: function (t) { t = String(t || '').trim().replace(/[^A-Za-z0-9_\-]/g, ''); if (!t) return; this.val = t.slice(0, 128); this.focus = true; Link.set('got', C.cyan); SFX.pickup(); }
  };
  var pasted = false;
  document.addEventListener('paste', function (e) {
    if (screen !== 'boot') return; pasted = true; e.preventDefault();
    KeyBox.paste(e.clipboardData && e.clipboardData.getData('text'));
  });
  function pasteFallback() { pasted = false; setTimeout(function () { if (!pasted) readClipboard(); }, 200); }
  function readClipboard() {
    if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { KeyBox.paste(t); }, function () { Link.set('clip', C.amb); });
    else Link.set('clip', C.amb);
  }

  /* ================================================================ UI widgets (all canvas) */
  var UI = {
    list: [], anim: {}, focusId: null, kb: false,
    reg: function (id, x, y, w, h, o) {
      var it = { id: id, x: x, y: y, w: w, h: h, o: o || {} }; this.list.push(it);
      var a = this.anim[id] || (this.anim[id] = { h: 0, p: 0, was: false, born: clock });
      var hov = !it.o.disabled && ((!touchMode && mouse.x >= x && mouse.x <= x + w && mouse.y >= y && mouse.y <= y + h) || (this.kb && this.focusId === id));
      if (hov && !a.was) SFX.hover(); a.was = hov;
      a.h += ((hov ? 1 : 0) - a.h) * damp(14, rdt); a.p = Math.max(0, a.p - rdt * 3.5); a.hov = hov;
      return a;
    },
    btn: function (id, x, y, w, h, label, o) { o = o || {}; var a = this.reg(id, x, y, w, h, o); drawButton(x, y, w, h, label, a, o); return a; },
    hit: function (x, y) { for (var i = this.list.length - 1; i >= 0; i--) { var it = this.list[i]; if (!it.o.disabled && x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h) return it; } return null; },
    fire: function (it) { var a = this.anim[it.id]; if (a) a.p = 1; SFX.click(); if (it.o.on) it.o.on(); },
    nav: function (d) {
      var ids = this.list.filter(function (it) { return !it.o.disabled && !it.o.noNav; }).map(function (it) { return it.id; }); if (!ids.length) return;
      var i = ids.indexOf(this.focusId); i = i < 0 ? 0 : (i + d + ids.length) % ids.length; this.focusId = ids[i]; this.kb = true;
    },
    enter: function () { for (var i = 0; i < this.list.length; i++) if (this.list[i].id === this.focusId && !this.list[i].o.disabled) { this.fire(this.list[i]); return true; } return false; }
  };
  var level = 0, voiceLevel = 0; // sound-reactive feedback (mix RMS / announcer RMS), 0..1
  function drawButton(x, y, w, h, label, a, o) {
    var col = o.col || C.cyan, c = Math.min(14, h * 0.3), k = a.h, dis = o.disabled;
    var born = clamp((clock - a.born) * 4, 0, 1); if (born < 1) { ctx.globalAlpha = born; }
    ctx.save(); ctx.translate(0, -k * 2);
    chamfer(x, y, w, h, c); ctx.fillStyle = rgba(col, (dis ? 0.03 : 0.07) + 0.16 * k + 0.35 * a.p); ctx.fill();
    glow(col, 6 + 18 * k + 14 * level); ctx.lineWidth = 1.5 + k; ctx.strokeStyle = rgba(col, dis ? 0.3 : 0.7 + 0.3 * k); ctx.stroke(); noGlow();
    if (k > 0.04 && !dis) { // scan sweep
      ctx.save(); chamfer(x, y, w, h, c); ctx.clip();
      var sx = x + (((clock * 0.9) % 1.4) - 0.2) * w, gr = ctx.createLinearGradient(sx - 40, 0, sx + 40, 0);
      gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(0.5, rgba(col, 0.28 * k)); gr.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = gr; ctx.fillRect(sx - 40, y, 80, h); ctx.restore();
    }
    ctx.fillStyle = rgba(col, 0.9); ctx.fillRect(x + w - 10, y + 4, 6, 2); ctx.fillRect(x + 4, y + h - 6, 6, 2);
    text(label, x + w / 2, y + h / 2 + 1, o.size || Math.min(h * 0.4, 22 * U), dis ? C.dim : (k > 0.5 ? '#ffffff' : C.white), 'center', { glow: 8 * k + 2, gc: col, sp: 2, max: w - 20 });
    ctx.restore(); ctx.globalAlpha = 1;
  }

  /* ================================================================ input */
  var keys = {}, mouse = { x: -999, y: -999, down: false }, touchMode = !!('ontouchstart' in window) && !(window.matchMedia && matchMedia('(pointer:fine)').matches);
  var sticks = { move: null, aim: null }, dashBtn = { x: 0, y: 0, r: 0 };
  window.addEventListener('keydown', function (e) {
    audio(); keys[e.code] = true;
    if (screen === 'boot' && KeyBox.focus && KeyBox.key(e)) { e.preventDefault(); return; }
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].indexOf(e.code) >= 0) e.preventDefault();
    if (e.repeat) return;
    if (screen === 'play') {
      if (e.code === 'Space' || e.code === 'ShiftLeft') tryDash();
      else if (e.code === 'Escape' || e.code === 'KeyP') go('pause');
      return;
    }
    if (screen === 'upgrade') { var m = /^Digit([1-3])$/.exec(e.code) || /^Numpad([1-3])$/.exec(e.code); if (m) { pickCard(+m[1] - 1); return; } }
    if (e.code === 'Tab' || e.code === 'ArrowDown' || e.code === 'ArrowRight') { UI.nav(e.shiftKey && e.code === 'Tab' ? -1 : 1); return; }
    if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') { UI.nav(-1); return; }
    if (e.code === 'Enter' || e.code === 'Space') { if (UI.enter()) return; }
    if (screen === 'pause' && (e.code === 'Escape' || e.code === 'KeyP')) go('play');
    if (screen === 'boot' && e.code === 'Escape') Link.bypass();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  cv.addEventListener('pointerdown', function (e) {
    audio(); try { cv.focus({ preventScroll: true }); } catch (er) { /* old browsers */ }
    var p = pos(e); touchMode = e.pointerType === 'touch' ? true : e.pointerType === 'mouse' ? false : touchMode;
    mouse.x = p.x; mouse.y = p.y; UI.kb = false;
    var it = UI.hit(p.x, p.y); if (it) { UI.fire(it); e.preventDefault(); return; }
    if (screen === 'boot') { var r = KeyBox.rect; KeyBox.focus = !!(r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h); return; }
    if (screen === 'play' && G && G.p.alive) {
      if (e.pointerType === 'touch') {
        if (hyp(p.x - dashBtn.x, p.y - dashBtn.y) < dashBtn.r * 1.3) { tryDash(); return; }
        var st = { id: e.pointerId, ox: p.x, oy: p.y, x: p.x, y: p.y };
        if (p.x < W * 0.5) { if (!sticks.move) sticks.move = st; } else if (!sticks.aim) sticks.aim = st;
      } else if (e.button === 0) mouse.down = true;
      else if (e.button === 2) tryDash();
    }
    e.preventDefault();
  });
  cv.addEventListener('pointermove', function (e) {
    var p = pos(e); if (e.pointerType !== 'touch') { mouse.x = p.x; mouse.y = p.y; if (UI.kb && (Math.abs(e.movementX) + Math.abs(e.movementY) > 2)) UI.kb = false; }
    ['move', 'aim'].forEach(function (k) { var s = sticks[k]; if (s && s.id === e.pointerId) { s.x = p.x; s.y = p.y; } });
  });
  function release(e) { if (e.pointerType !== 'touch' && e.button === 0) mouse.down = false; ['move', 'aim'].forEach(function (k) { if (sticks[k] && sticks[k].id === e.pointerId) sticks[k] = null; }); }
  cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release);
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('blur', function () { keys = {}; mouse.down = false; sticks.move = sticks.aim = null; if (screen === 'play') go('pause'); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && screen === 'play') go('pause'); });
  function stickVec(s, rad) { if (!s) return null; var dx = s.x - s.ox, dy = s.y - s.oy, d = hyp(dx, dy); if (d > rad) { s.ox = s.x - dx / d * rad; s.oy = s.y - dy / d * rad; dx = s.x - s.ox; dy = s.y - s.oy; d = rad; } return { x: dx / rad, y: dy / rad, m: d / rad }; }

  /* ================================================================ FX: particles, grid shockwaves, shake, hit-stop */
  var parts = [], waves = [], floats = [], trauma = 0, shakeX = 0, shakeY = 0, hitstop = 0, flashA = 0, flashC = '#fff', glitchT = 0;
  function burst(x, y, dir, spread, n, spd, col, size) {
    for (var i = 0; i < n && parts.length < 1000; i++) {
      var a = dir + rnd(-spread / 2, spread / 2), s = spd * rnd(0.3, 1);
      parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: rnd(0.25, 0.6), col: Math.random() < 0.25 ? C.white : col, w: size || rnd(1.5, 3), k: 0, drag: 4 });
    }
  }
  function shards(x, y, r, sides, col, spd) {
    for (var i = 0; i < sides; i++) { var a = i / sides * TAU + rnd(-0.2, 0.2), s = spd * rnd(0.5, 1.1); parts.push({ x: x + Math.cos(a) * r * 0.6, y: y + Math.sin(a) * r * 0.6, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: rnd(0.5, 0.9), col: col, w: r * 0.55, k: 1, rot: rnd(0, TAU), rs: rnd(-12, 12), drag: 2.5 }); }
  }
  function ring(x, y, r0, r1, col, life) { parts.push({ x: x, y: y, vx: 0, vy: 0, life: 0, max: life || 0.4, col: col, r0: r0, r1: r1, k: 2, w: 3, drag: 0 }); }
  function shock(x, y, str, spd, life) { waves.push({ x: x, y: y, t: 0, str: str, spd: spd || 700, life: life || 0.9 }); if (waves.length > 14) waves.shift(); }
  function shake(a) { trauma = Math.min(1, trauma + a * (reduceMotion ? 0.35 : 1)); }
  function stop(s) { if (!TEST) hitstop = Math.max(hitstop, s); }
  function flash(col, a) { flashC = col; flashA = Math.max(flashA, reduceMotion ? a * 0.4 : a); }
  function floatText(x, y, s, col, size) { floats.push({ x: x, y: y, s: s, col: col, size: size || 16, t: 0 }); if (floats.length > 40) floats.shift(); }
  function stepFx(dt) {
    for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.life += dt; if (p.life >= p.max) { parts.splice(i, 1); continue; } var k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.x += p.vx * dt; p.y += p.vy * dt; if (p.rot !== undefined) p.rot += p.rs * dt; }
    for (i = waves.length - 1; i >= 0; i--) { waves[i].t += dt; if (waves[i].t > waves[i].life) waves.splice(i, 1); }
    for (i = floats.length - 1; i >= 0; i--) { floats[i].t += dt; if (floats[i].t > 0.9) floats.splice(i, 1); }
  }
  var DX = 0, DY = 0;
  function disp(x, y) {
    DX = 0; DY = 0;
    for (var i = 0; i < waves.length; i++) {
      var w = waves[i], ex = x - w.x, ey = y - w.y, d = Math.sqrt(ex * ex + ey * ey) + 0.01, k = (d - w.t * w.spd) / 70;
      if (k > -2.6 && k < 2.6) { var f = w.str * Math.exp(-k * k) * (1 - w.t / w.life) * 30; DX += ex / d * f; DY += ey / d * f; }
    }
    if (G && G.p.alive) { var px = x - G.p.x, py = y - G.p.y, pd = Math.sqrt(px * px + py * py) + 0.01; if (pd < 260) { var pf = -9 * Math.exp(-pd * pd / 9000); DX += px / pd * pf; DY += py / pd * pf; } }
  }

  /* ================================================================ game */
  var AW = 2400, AH = 1500;
  var ET = {
    swarmer: { r: 12, hp: 1, spd: 255, col: C.mag, score: 100, dmg: 12, sides: 3 },
    sniper: { r: 17, hp: 3, spd: 150, col: C.amb, score: 250, dmg: 10, sides: 6 },
    splitter: { r: 32, hp: 8, spd: 80, col: C.lime, score: 400, dmg: 18, sides: 8 },
    shard: { r: 16, hp: 2, spd: 185, col: C.lime, score: 120, dmg: 10, sides: 8 },
    boss: { r: 72, hp: 120, spd: 70, col: C.vio, score: 5000, dmg: 25, sides: 12 }
  };
  var UPG = {
    multi: { max: 6, w: 2, ap: function (s) { s.shots++; } },
    pierce: { max: 5, w: 2, ap: function (s) { s.pierce++; } },
    dash: { max: 4, w: 2, ap: function (s) { s.dashCd *= 0.7; s.shred += 3; } },
    rapid: { max: 6, w: 1.4, ap: function (s) { s.rate *= 1.22; } },
    boom: { max: 4, w: 1.2, ap: function (s) { s.boom++; } },
    heal: { max: 99, w: 1, ap: function (s, p) { p.max += 25; p.hp = p.max; p.critical = false; } },
    rail: { max: 5, w: 1.2, ap: function (s) { s.dmg *= 1.35; s.bspd *= 1.1; } }
  };
  var G = null, cam = { x: AW / 2, y: AH / 2 }, best = +Store.get('best', 0) || 0, speedX = 1;
  function newGame() {
    G = { t: 0, phase: 'intro', pt: 0, wave: 0, score: 0, kills: 0, combo: 0, comboT: 0, mult: 1, streak: 0, streakT: -9, tier: 0, lastVO: -99, lastDouble: -99, banner: null,
      p: { x: AW / 2, y: AH / 2, vx: 0, vy: 0, r: 14, hp: 100, max: 100, inv: 1, dashT: 0, cd: 0, fire: 0, aim: 0, trail: [], ghosts: [], hurtT: 0, critical: false, alive: true, dashN: 0, kick: 0 },
      st: { shots: 1, pierce: 0, dashCd: 1.15, shred: 0, rate: 7, boom: 0, dmg: 1, bspd: 980 }, lv: {},
      bullets: [], eb: [], en: [], pick: [], queue: [], spawnT: 0, slow: 1, deadT: 0, cards: null, newBest: false };
    cam.x = G.p.x; cam.y = G.p.y; parts.length = 0; waves.length = 0; floats.length = 0;
    startWave();
  }
  function startWave() {
    var n = ++G.wave; G.phase = 'intro'; G.pt = 0; G.boss = n % 5 === 0; G.queue = buildWave(n); G.spawnT = 0.2;
    G.banner = { s: G.boss ? '⚠ ' + T.bossWarn + ' ⚠' : T.wave + ' ' + n, col: G.boss ? C.red : C.cyan, t: 0 };
    if (G.boss) { Voice.say('boss', { pr: 4, ttl: 6 }); SFX.alarm(); } else Voice.say(n === 1 ? 'start' : 'wave', { n: n, pr: 2, ttl: 4 });
    SFX.wave(); shock(G.p.x, G.p.y, 0.8, 900, 1.2);
  }
  function buildWave(n) {
    var q = [], b = 5 + n * 3.2;
    if (n % 5 === 0) { q.push('boss'); b *= 0.45; }
    while (b > 0) {
      var r = Math.random();
      if (n >= 3 && r < 0.17 + Math.min(0.12, n * 0.01)) { q.push('splitter'); b -= 4; }
      else if (n >= 2 && r < 0.45) { q.push('sniper'); b -= 2.5; }
      else { var g = Math.min(5, 2 + Math.floor(n / 3)); for (var i = 0; i < g; i++) q.push('swarmer'); b -= g; }
    }
    return q;
  }
  function spawnPoint() {
    for (var i = 0; i < 14; i++) { var x = rnd(80, AW - 80), y = rnd(80, AH - 80); if (hyp(x - G.p.x, y - G.p.y) > 460) return { x: x, y: y }; }
    return { x: G.p.x > AW / 2 ? 120 : AW - 120, y: rnd(120, AH - 120) };
  }
  function makeEnemy(type, x, y, warp) {
    var d = ET[type], n = G.wave, hpMul = 1 + (n - 1) * 0.08;
    var e = { type: type, x: x, y: y, vx: 0, vy: 0, r: d.r, hp: type === 'boss' ? d.hp + n * 18 : d.hp * hpMul, spd: d.spd + (type === 'swarmer' ? Math.min(80, n * 3) : 0), col: d.col, sides: d.sides,
      rot: rnd(0, TAU), rs: type === 'splitter' || type === 'shard' ? rnd(0.8, 1.6) * (Math.random() < 0.5 ? -1 : 1) : type === 'boss' ? 0.35 : 0.6, flash: 0, warp: warp ? 0.75 : 0, seed: rnd(0, 100),
      state: 'move', cd: rnd(1.4, 2.6), tel: 0, aim: 0, strafe: Math.random() < 0.5 ? 1 : -1, sT: rnd(1.5, 3), a1: 2, a2: 4, a3: 6, dashId: -1 };
    e.max = e.hp; G.en.push(e); return e;
  }
  function spawnStep(dt) {
    if (!G.queue.length) return;
    G.spawnT -= dt; if (G.spawnT > 0) return;
    var alive = G.en.length; if (alive > 46) { G.spawnT = 0.4; return; }
    var t = G.queue.shift(), sp = spawnPoint();
    if (t === 'boss') { sp = { x: G.p.x < AW / 2 ? AW - 300 : 300, y: AH / 2 }; makeEnemy('boss', sp.x, sp.y, true); G.spawnT = 1.6; return; }
    makeEnemy(t, sp.x, sp.y, true);
    while (t === 'swarmer' && G.queue[0] === 'swarmer' && Math.random() < 0.8) { G.queue.shift(); makeEnemy('swarmer', sp.x + rnd(-50, 50), sp.y + rnd(-50, 50), true); }
    G.spawnT = Math.max(0.32, 1.05 - G.wave * 0.035) * rnd(0.7, 1.3);
  }
  function tryDash() {
    if (!G || screen !== 'play') return; var p = G.p; if (!p.alive || p.cd > 0) return;
    var ix = inX, iy = inY, d = hyp(ix, iy); if (d < 0.2) { ix = Math.cos(p.aim); iy = Math.sin(p.aim); d = 1; }
    ix /= d; iy /= d; p.vx = ix * 1180; p.vy = iy * 1180; p.dashT = 0.16; p.inv = Math.max(p.inv, 0.32); p.cd = G.st.dashCd; p.dashN++;
    SFX.dash(); shake(0.14); burst(p.x, p.y, Math.atan2(-iy, -ix), 1.2, 18, 420, C.cyan); shock(p.x, p.y, 0.35, 600, 0.5);
  }
  var inX = 0, inY = 0;
  function readInput() {
    inX = ((keys.KeyD || keys.ArrowRight) ? 1 : 0) - ((keys.KeyA || keys.ArrowLeft) ? 1 : 0);
    inY = ((keys.KeyS || keys.ArrowDown) ? 1 : 0) - ((keys.KeyW || keys.ArrowUp) ? 1 : 0);
    var mv = stickVec(sticks.move, 60 * U); if (mv && mv.m > 0.12) { inX = mv.x; inY = mv.y; }
    var d = hyp(inX, inY); if (d > 1) { inX /= d; inY /= d; }
  }
  function updatePlayer(dt) {
    var p = G.p, st = G.st; readInput();
    var ACC = 3300, K = 9.6;
    if (p.dashT > 0) { p.dashT -= dt; if (Math.random() < 0.9) p.ghosts.push({ x: p.x, y: p.y, a: p.aim, t: 0 }); }
    else { p.vx += inX * ACC * dt; p.vy += inY * ACC * dt; var k = Math.exp(-K * dt); p.vx *= k; p.vy *= k; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < p.r) { p.x = p.r; p.vx = Math.abs(p.vx) * 0.3; } if (p.x > AW - p.r) { p.x = AW - p.r; p.vx = -Math.abs(p.vx) * 0.3; }
    if (p.y < p.r) { p.y = p.r; p.vy = Math.abs(p.vy) * 0.3; } if (p.y > AH - p.r) { p.y = AH - p.r; p.vy = -Math.abs(p.vy) * 0.3; }
    p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 16) p.trail.shift();
    for (var i = p.ghosts.length - 1; i >= 0; i--) { p.ghosts[i].t += dt; if (p.ghosts[i].t > 0.3) p.ghosts.splice(i, 1); }
    p.inv -= dt; p.hurtT -= dt; p.cd = Math.max(0, p.cd - dt); p.kick = Math.max(0, p.kick - dt * 6);
    // aim + fire
    var firing = false;
    var am = stickVec(sticks.aim, 60 * U);
    if (am && am.m > 0.2) { p.aim = Math.atan2(am.y, am.x); firing = am.m > 0.35; }
    else if (!touchMode) { var mw = toWorld(mouse.x, mouse.y); p.aim = Math.atan2(mw.y - p.y, mw.x - p.x); firing = mouse.down || !!keys.KeyJ; }
    p.fire -= dt;
    if (firing && p.fire <= 0 && G.phase !== 'clear') {
      p.fire = 1 / st.rate; var n = st.shots, spread = n > 1 ? Math.min(0.13, 0.5 / n) : 0;
      for (var s = 0; s < n; s++) {
        var a = p.aim + (s - (n - 1) / 2) * spread + rnd(-0.025, 0.025);
        G.bullets.push({ x: p.x + Math.cos(a) * 18, y: p.y + Math.sin(a) * 18, vx: Math.cos(a) * st.bspd, vy: Math.sin(a) * st.bspd, life: 0.9, pierce: st.pierce, hits: [], dmg: st.dmg });
      }
      p.vx -= Math.cos(p.aim) * 38; p.vy -= Math.sin(p.aim) * 38; p.kick = 1;
      burst(p.x + Math.cos(p.aim) * 20, p.y + Math.sin(p.aim) * 20, p.aim, 0.7, 3, 360, C.cyan, 1.5);
      shake(0.035); SFX.pew();
    }
    // dash shred
    if (p.dashT > 0 && st.shred > 0) G.en.forEach(function (e) { if (e.warp <= 0 && e.dashId !== p.dashN && hyp(e.x - p.x, e.y - p.y) < e.r + p.r + 6) { e.dashId = p.dashN; damage(e, st.shred, Math.atan2(e.y - p.y, e.x - p.x)); } });
  }
  function hurtPlayer(dmg, fx, fy) {
    var p = G.p; if (p.inv > 0 || !p.alive) return false;
    p.hp -= dmg; p.inv = 0.75; p.hurtT = 0.35; glitchT = 0.25;
    var a = Math.atan2(p.y - fy, p.x - fx); p.vx += Math.cos(a) * 420; p.vy += Math.sin(a) * 420;
    shake(0.45); flash(C.red, 0.28); SFX.hurt(); burst(p.x, p.y, a, 1.6, 22, 420, C.red); shock(p.x, p.y, 0.6, 700, 0.6);
    G.combo = 0; G.mult = 1;
    if (!p.critical && p.hp > 0 && p.hp < p.max * 0.3) { p.critical = true; Voice.say('critical', { pr: 3, ttl: 3 }); }
    if (p.hp <= 0) die();
    return true;
  }
  function die() {
    var p = G.p; p.hp = 0; p.alive = false; G.phase = 'dead'; G.deadT = 0; G.slow = 0.25; mouse.down = false;
    shake(1); flash('#ffffff', 0.6); stop(0.08); SFX.boom(1.2);
    for (var i = 0; i < 3; i++) { shock(p.x, p.y, 1.6 - i * 0.4, 600 + i * 300, 1.4); ring(p.x, p.y, 10, 260 + i * 120, i ? C.mag : C.cyan, 0.8 + i * 0.2); }
    burst(p.x, p.y, 0, TAU, 90, 700, C.cyan); shards(p.x, p.y, 20, 10, C.cyan, 500);
    if (G.score > best) { best = G.score; Store.set('best', best); G.newBest = G.score > 0; }
    Voice.q.length = 0; Voice.say('dead', { n: fmt(G.score), pr: 5, ttl: 8 });
    if (G.newBest) Voice.say('record', { pr: 4, ttl: 10 });
  }
  function damage(e, dmg, dir) {
    if (e.dead) return;
    e.hp -= dmg; e.flash = 0.07;
    var kb = e.type === 'boss' ? 20 : 150 / (e.r / 12); e.vx += Math.cos(dir) * kb; e.vy += Math.sin(dir) * kb;
    if (e.hp <= 0) kill(e, dir); else SFX.hit();
  }
  function kill(e, dir) {
    e.dead = true; G.kills++;
    var big = e.type === 'splitter' || e.type === 'boss';
    burst(e.x, e.y, dir, big ? TAU : 2.4, big ? 46 : 16, big ? 560 : 400, e.col);
    shards(e.x, e.y, e.r, e.sides, e.col, big ? 420 : 300);
    ring(e.x, e.y, e.r, e.r * (big ? 5 : 3), e.col, big ? 0.55 : 0.35);
    shock(e.x, e.y, big ? 1.3 : 0.55, big ? 820 : 620, big ? 1 : 0.7);
    shake(big ? 0.45 : 0.12);
    if (big) { stop(0.04); SFX.boom(e.type === 'boss' ? 1.2 : 0.7); } else SFX.pop();
    // combo + score
    G.combo++; G.comboT = 2.2; G.mult = 1 + Math.min(4, Math.floor(G.combo / 6) * 0.5);
    var pts = Math.round(ET[e.type].score * G.mult * (1 + (G.wave - 1) * 0.05)); G.score += pts;
    floatText(e.x, e.y - e.r, '+' + pts, e.col, big ? 22 : 15);
    // multi-kill callouts
    if (G.t - G.streakT < 0.9) G.streak++; else { G.streak = 1; G.tier = 0; } G.streakT = G.t;
    var tier = G.streak >= 6 ? 3 : G.streak >= 3 ? 2 : G.streak >= 2 ? 1 : 0;
    if (tier > G.tier) {
      G.tier = tier;
      if (tier >= 2) { stop(0.04); G.banner = { s: tier === 3 ? T.kill6 : T.kill3, col: tier === 3 ? C.red : C.mag, t: 0, small: true }; }
      if ((tier >= 2 && G.t - G.lastVO > 2.5) || (tier === 1 && G.t - G.lastDouble > 12 && G.t - G.lastVO > 4)) {
        Voice.say(['', 'double', 'triple', 'rampage'][tier], { pr: tier + 1, ttl: 2 }); G.lastVO = G.t; if (tier === 1) G.lastDouble = G.t;
      }
    }
    if (e.type === 'splitter') for (var i = 0; i < 3; i++) { var a = e.rot + i * TAU / 3, s = makeEnemy('shard', e.x + Math.cos(a) * 16, e.y + Math.sin(a) * 16, false); s.vx = Math.cos(a) * 320; s.vy = Math.sin(a) * 320; }
    if (e.type === 'boss') {
      G.slow = 0.3; G.slowT = 0.7; flash('#ffffff', 0.5); Voice.say('bossdown', { pr: 4, ttl: 5 });
      for (var j = 0; j < 3; j++) { shock(e.x, e.y, 1.8 - j * 0.4, 500 + j * 350, 1.5); ring(e.x, e.y, 20, 300 + j * 160, j === 1 ? C.mag : C.vio, 0.9 + j * 0.2); dropHeal(e.x + rnd(-60, 60), e.y + rnd(-60, 60)); }
      G.eb.length = 0;
    }
    var p = G.p, ch = e.type === 'splitter' ? 0.22 : e.type === 'sniper' ? 0.08 : 0.035;
    if (p.hp < p.max && Math.random() < ch) dropHeal(e.x, e.y);
  }
  function dropHeal(x, y) { G.pick.push({ x: x, y: y, t: 0 }); }
  function explodeAt(x, y, r, dmg, skip) {
    ring(x, y, 6, r, C.amb, 0.3); burst(x, y, 0, TAU, 10, 300, C.amb); shock(x, y, 0.35, 500, 0.45); SFX.impact();
    G.en.forEach(function (e) { if (e !== skip && !e.dead && e.warp <= 0 && hyp(e.x - x, e.y - y) < r + e.r) damage(e, dmg, Math.atan2(e.y - y, e.x - x)); });
  }
  function updateEnemies(dt) {
    var p = G.p;
    for (var i = 0; i < G.en.length; i++) {
      var e = G.en[i]; if (e.dead) continue;
      e.rot += e.rs * dt; e.flash -= dt;
      if (e.warp > 0) { e.warp -= dt; if (e.warp <= 0) { burst(e.x, e.y, 0, TAU, 10, 260, e.col); ring(e.x, e.y, e.r * 3, e.r, e.col, 0.25); } continue; }
      var dx = p.x - e.x, dy = p.y - e.y, d = hyp(dx, dy) + 0.01, ux = dx / d, uy = dy / d, tx = 0, ty = 0, steer = 4;
      if (!p.alive) { ux = -ux; uy = -uy; }
      if (e.type === 'swarmer' || e.type === 'shard') {
        var wob = Math.sin(G.t * 5 + e.seed) * 0.45; tx = (ux - uy * wob) * e.spd; ty = (uy + ux * wob) * e.spd; steer = e.type === 'shard' ? 3 : 4.5;
      } else if (e.type === 'splitter') { tx = ux * e.spd; ty = uy * e.spd; steer = 1.5; }
      else if (e.type === 'sniper') {
        e.sT -= dt; if (e.sT < 0) { e.strafe = -e.strafe; e.sT = rnd(1.5, 3); }
        var want = d > 560 ? 1 : d < 380 ? -1 : 0;
        tx = (ux * want - uy * e.strafe * 0.7) * e.spd; ty = (uy * want + ux * e.strafe * 0.7) * e.spd;
        if (e.state === 'move') { e.cd -= dt; if (e.cd <= 0 && d < 900 && p.alive) { e.state = 'aim'; e.tel = 1; e.aim = Math.atan2(dy, dx); SFX.charge(); } }
        else {
          tx *= 0.15; ty *= 0.15; e.tel -= dt;
          if (e.tel > 0.35) e.aim = angLerp(e.aim, Math.atan2(dy, dx), damp(7, dt));
          if (e.tel <= 0) {
            e.state = 'move'; e.cd = rnd(2, 3) - Math.min(0.8, G.wave * 0.04);
            G.eb.push({ x: e.x + Math.cos(e.aim) * 20, y: e.y + Math.sin(e.aim) * 20, vx: Math.cos(e.aim) * 1150, vy: Math.sin(e.aim) * 1150, r: 6, dmg: 20, col: C.amb, life: 2, bolt: true });
            e.vx -= Math.cos(e.aim) * 200; e.vy -= Math.sin(e.aim) * 200; SFX.snipe(); burst(e.x, e.y, e.aim, 0.5, 8, 400, C.amb);
          }
        }
      } else if (e.type === 'boss') {
        var orb = G.t * 0.3, gx = p.x + Math.cos(orb) * 340 - e.x, gy = p.y + Math.sin(orb) * 260 - e.y, gd = hyp(gx, gy) + 0.01;
        tx = gx / gd * e.spd * Math.min(1, gd / 120); ty = gy / gd * e.spd * Math.min(1, gd / 120); steer = 1.2;
        var rage = e.hp < e.max * 0.5;
        e.a1 -= dt; if (e.a1 <= 0) { e.a1 = rage ? 1.8 : 2.6; var nb = rage ? 20 : 14, off = rnd(0, TAU); for (var b = 0; b < nb; b++) { var a = off + b / nb * TAU; G.eb.push({ x: e.x, y: e.y, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, r: 7, dmg: 14, col: C.vio, life: 5 }); } SFX.ring(); ring(e.x, e.y, e.r, e.r * 1.8, C.vio, 0.3); }
        if (rage) { e.a2 -= dt; if (e.a2 <= 0) { e.a2 = 0.11; e.spin = (e.spin || 0) + 0.32; for (var arm = 0; arm < 3; arm++) { var sa = e.spin + arm * TAU / 3; G.eb.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 300, vy: Math.sin(sa) * 300, r: 6, dmg: 12, col: C.mag, life: 4 }); } } }
        e.a3 -= dt; if (e.a3 <= 0) { e.a3 = 7; for (var m = 0; m < 4; m++) { var ma = rnd(0, TAU); makeEnemy('swarmer', e.x + Math.cos(ma) * 110, e.y + Math.sin(ma) * 110, true); } }
      }
      e.vx += (tx - e.vx) * damp(steer, dt); e.vy += (ty - e.vy) * damp(steer, dt);
      e.x = clamp(e.x + e.vx * dt, e.r, AW - e.r); e.y = clamp(e.y + e.vy * dt, e.r, AH - e.r);
      // contact
      if (p.alive && d < e.r + p.r) {
        if (p.dashT > 0 || p.inv > 0) { /* phased through */ }
        else if (hurtPlayer(ET[e.type].dmg, e.x, e.y)) { e.vx -= ux * 300; e.vy -= uy * 300; }
      }
    }
    // separation
    for (i = 0; i < G.en.length; i++) {
      var A = G.en[i]; if (A.dead || A.warp > 0) continue;
      for (var j = i + 1; j < G.en.length; j++) {
        var B = G.en[j]; if (B.dead || B.warp > 0) continue;
        var sx = B.x - A.x, sy = B.y - A.y, rr = A.r + B.r, sd2 = sx * sx + sy * sy;
        if (sd2 < rr * rr && sd2 > 0.01) { var sd = Math.sqrt(sd2), push = (rr - sd) * 0.5, ma2 = A.r * A.r, mb = B.r * B.r, wa = mb / (ma2 + mb), wb = 1 - wa; A.x -= sx / sd * push * wa; A.y -= sy / sd * push * wa; B.x += sx / sd * push * wb; B.y += sy / sd * push * wb; }
      }
    }
    G.en = G.en.filter(function (e) { return !e.dead; });
  }
  function updateBullets(dt) {
    var st = G.st;
    for (var i = G.bullets.length - 1; i >= 0; i--) {
      var b = G.bullets[i]; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
      var out = b.x < 0 || b.x > AW || b.y < 0 || b.y > AH;
      if (out) { // wall sparks along the normal
        var nx = b.x < 0 ? 1 : b.x > AW ? -1 : 0, ny = b.y < 0 ? 1 : b.y > AH ? -1 : 0;
        burst(clamp(b.x, 0, AW), clamp(b.y, 0, AH), Math.atan2(ny || -b.vy * 0.2, nx || -b.vx * 0.2), 1.6, 6, 320, C.cyan, 1.5);
        G.bullets.splice(i, 1); continue;
      }
      if (b.life <= 0) { G.bullets.splice(i, 1); continue; }
      var gone = false;
      for (var j = 0; j < G.en.length; j++) {
        var e = G.en[j]; if (e.dead || e.warp > 0 || b.hits.indexOf(e) >= 0) continue;
        var dx = e.x - b.x, dy = e.y - b.y, rr = e.r + 5;
        if (dx * dx + dy * dy < rr * rr) {
          var dir = Math.atan2(b.vy, b.vx); b.hits.push(e);
          burst(b.x, b.y, dir + Math.PI, 1.3, 6, 300, e.col, 1.6); shake(0.025);
          damage(e, b.dmg, dir);
          if (st.boom) explodeAt(b.x, b.y, 40 + st.boom * 22, b.dmg * 0.5, e);
          if (b.pierce-- <= 0) { gone = true; break; }
        }
      }
      if (gone) G.bullets.splice(i, 1);
    }
    var p = G.p;
    for (i = G.eb.length - 1; i >= 0; i--) {
      var q = G.eb[i]; q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.life <= 0 || q.x < -20 || q.x > AW + 20 || q.y < -20 || q.y > AH + 20) { G.eb.splice(i, 1); continue; }
      if (p.alive && hyp(q.x - p.x, q.y - p.y) < q.r + p.r - 2) {
        if (p.inv > 0 || p.dashT > 0) continue;
        hurtPlayer(q.dmg, q.x - q.vx * 0.05, q.y - q.vy * 0.05); G.eb.splice(i, 1);
      }
    }
  }
  function updatePickups(dt) {
    var p = G.p;
    for (var i = G.pick.length - 1; i >= 0; i--) {
      var k = G.pick[i]; k.t += dt; var dx = p.x - k.x, dy = p.y - k.y, d = hyp(dx, dy) + 0.01, pull = G.phase === 'clear' ? 900 : d < 160 ? 500 : 0;
      if (pull) { k.x += dx / d * pull * dt; k.y += dy / d * pull * dt; }
      if (p.alive && d < p.r + 14) {
        G.pick.splice(i, 1); p.hp = Math.min(p.max, p.hp + 22); SFX.pickup(); floatText(p.x, p.y - 24, '+22', C.lime, 18); ring(p.x, p.y, 10, 60, C.lime, 0.3);
        if (p.critical && p.hp >= p.max * 0.5) { p.critical = false; Voice.say('repair', { pr: 2, ttl: 3 }); }
      } else if (k.t > 14) G.pick.splice(i, 1);
    }
  }
  function update(dt) {
    if (screen !== 'play') return; // a phase change (cards, game over) ends this frame's sub-steps
    G.t += dt; var p = G.p;
    if (G.slowT > 0) { G.slowT -= dt / Math.max(0.05, G.slow); if (G.slowT <= 0) G.slow = 1; }
    if (G.banner) { G.banner.t += dt; if (G.banner.t > (G.banner.small ? 1.1 : 1.8)) G.banner = null; }
    G.comboT -= dt; if (G.comboT <= 0 && G.combo) { G.combo = 0; G.mult = 1; }
    if (p.alive) updatePlayer(dt);
    if (G.phase === 'intro') { G.pt += dt; if (G.pt > 1.3) G.phase = 'fight'; }
    else if (G.phase === 'fight') {
      spawnStep(dt);
      if (!G.queue.length && !G.en.length) { G.phase = 'clear'; G.pt = 0; G.eb.length = 0; Voice.say('clear', { n: G.wave, pr: 2, ttl: 4 }); SFX.chime(); G.banner = { s: T.wave + ' ' + G.wave + ' ' + T.cleared, col: C.lime, t: 0 }; }
    } else if (G.phase === 'clear') { G.pt += dt; if (G.pt > 1.5) openCards(); }
    else if (G.phase === 'dead') { G.deadT += dt / G.slow; if (G.deadT > 2.4) go('over'); }
    updateEnemies(dt); updateBullets(dt); updatePickups(dt);
    // camera: follow the player and lean toward the cursor
    var lx = 0, ly = 0;
    if (!touchMode && p.alive) { var mw = { x: (mouse.x - W / 2) / Z, y: (mouse.y - H / 2) / Z }; lx = clamp(mw.x * 0.22, -170, 170); ly = clamp(mw.y * 0.22, -120, 120); }
    else if (p.alive) { lx = Math.cos(p.aim) * 60; ly = Math.sin(p.aim) * 60; }
    var tx = p.x + lx, ty = p.y + ly, hw = W / 2 / Z, hh = H / 2 / Z;
    tx = AW > hw * 2 - 200 ? clamp(tx, hw - 100, AW - hw + 100) : AW / 2; ty = AH > hh * 2 - 200 ? clamp(ty, hh - 100, AH - hh + 100) : AH / 2;
    cam.x += (tx - cam.x) * damp(7, dt); cam.y += (ty - cam.y) * damp(7, dt);
  }
  function toWorld(sx, sy) { return { x: (sx - W / 2 - shakeX) / Z + cam.x, y: (sy - H / 2 - shakeY) / Z + cam.y }; }
  function rollCards() {
    var pool = Object.keys(UPG).filter(function (k) { return (G.lv[k] || 0) < UPG[k].max; }), out = [];
    while (out.length < 3 && pool.length) {
      var tot = pool.reduce(function (s, k) { return s + UPG[k].w; }, 0), r = Math.random() * tot;
      for (var i = 0; i < pool.length; i++) { r -= UPG[pool[i]].w; if (r <= 0) { out.push(pool[i]); pool.splice(i, 1); break; } }
    }
    return out;
  }
  function openCards() { G.cards = rollCards(); G.cardT = 0; mouse.down = false; sticks.move = sticks.aim = null; go('upgrade'); }
  function pickCard(i) {
    if (screen !== 'upgrade' || !G.cards || !G.cards[i] || G.cardT < 0.35) return;
    var id = G.cards[i]; UPG[id].ap(G.st, G.p); G.lv[id] = (G.lv[id] || 0) + 1;
    SFX.chime(); Voice.say('upgrade', { pr: 2, ttl: 2.5 }); flash(C.cyan, 0.15);
    ring(G.p.x, G.p.y, 10, 140, C.cyan, 0.5); shock(G.p.x, G.p.y, 0.7, 800, 0.8);
    G.cards = null; go('play'); startWave();
  }

  /* ================================================================ screens */
  var screen = 'boot', screenT = 0;
  var PRIMARY = { boot: 'connect', menu: 'start', pause: 'resume', over: 'reboot', upgrade: 'card0' };
  function go(s) {
    if (s === 'play' && screen === 'menu') newGame();
    if (s === 'over') { /* stats drawn from G */ }
    screen = s; screenT = 0; UI.focusId = PRIMARY[s] || null; UI.kb = false; mouse.down = false;
    if (s === 'boot') KeyBox.focus = true;
  }
  var showControls = false;

  /* ---------------- render: world */
  function renderWorld() {
    ctx.save(); ctx.translate(W / 2 + shakeX, H / 2 + shakeY); ctx.scale(Z, Z); ctx.translate(-cam.x, -cam.y);
    var x0 = cam.x - W / 2 / Z - 40, x1 = cam.x + W / 2 / Z + 40, y0 = cam.y - H / 2 / Z - 40, y1 = cam.y + H / 2 / Z + 40;
    drawGrid(Math.max(0, x0), Math.max(0, y0), Math.min(AW, x1), Math.min(AH, y1));
    drawArena();
    if (G) {
      var p = G.p;
      G.pick.forEach(function (k) { var pu = 1 + Math.sin(k.t * 8) * 0.15; ctx.globalCompositeOperation = 'lighter'; blob(k.x, k.y, 26 * pu, C.lime); ctx.globalCompositeOperation = 'source-over'; glow(C.lime, 10); ctx.strokeStyle = C.lime; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(k.x - 7, k.y); ctx.lineTo(k.x + 7, k.y); ctx.moveTo(k.x, k.y - 7); ctx.lineTo(k.x, k.y + 7); ctx.stroke(); noGlow(); });
      G.en.forEach(drawEnemy);
      ctx.globalCompositeOperation = 'lighter';
      G.eb.forEach(function (q) { blob(q.x, q.y, q.r * 3.4, q.col); if (q.bolt) { ctx.strokeStyle = q.col; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(q.x - q.vx * 0.03, q.y - q.vy * 0.03); ctx.lineTo(q.x, q.y); ctx.stroke(); } });
      ctx.fillStyle = '#fff'; G.eb.forEach(function (q) { ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 0.55, 0, TAU); ctx.fill(); });
      ctx.lineCap = 'round';
      G.bullets.forEach(function (b) { ctx.strokeStyle = rgba(C.cyan, 0.85); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(b.x - b.vx * 0.028, b.y - b.vy * 0.028); ctx.lineTo(b.x, b.y); ctx.stroke(); blob(b.x, b.y, 12, C.cyan); });
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; G.bullets.forEach(function (b) { ctx.beginPath(); ctx.moveTo(b.x - b.vx * 0.012, b.y - b.vy * 0.012); ctx.lineTo(b.x, b.y); ctx.stroke(); });
      ctx.globalCompositeOperation = 'source-over';
      if (p.alive) drawPlayer(p);
    }
    drawParts();
    floats.forEach(function (f) { ctx.globalAlpha = 1 - f.t / 0.9; text(f.s, f.x, f.y - f.t * 50, f.size, f.col, 'center', { glow: 8, mono: true }); }); ctx.globalAlpha = 1;
    ctx.restore();
  }
  function drawGrid(x0, y0, x1, y1) {
    var S = 64, SUB = 32, al = 0.45 + level * 0.5;
    ctx.lineWidth = 1.2; ctx.strokeStyle = rgba('#2a3478', al);
    ctx.beginPath();
    var gx0 = Math.floor(x0 / S) * S, gy0 = Math.floor(y0 / S) * S, x, y;
    for (x = gx0; x <= x1; x += S) { if (x < 0 || x > AW) continue; for (y = y0; y <= y1 + SUB; y += SUB) { var yy = Math.min(y, y1); disp(x, yy); if (y === y0) ctx.moveTo(x + DX, yy + DY); else ctx.lineTo(x + DX, yy + DY); } }
    for (y = gy0; y <= y1; y += S) { if (y < 0 || y > AH) continue; for (x = x0; x <= x1 + SUB; x += SUB) { var xx = Math.min(x, x1); disp(xx, y); if (x === x0) ctx.moveTo(xx + DX, y + DY); else ctx.lineTo(xx + DX, y + DY); } }
    ctx.stroke();
    // shockwave glow rings on the grid
    ctx.globalCompositeOperation = 'lighter';
    waves.forEach(function (w) { var a = w.str * (1 - w.t / w.life) * 0.25; if (a <= 0.01) return; ctx.strokeStyle = rgba(C.cyan, Math.min(0.5, a)); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(w.x, w.y, w.t * w.spd, 0, TAU); ctx.stroke(); });
    ctx.globalCompositeOperation = 'source-over';
  }
  function drawArena() {
    var pulse = 0.6 + 0.4 * Math.sin(clock * 2) + level;
    glow(C.mag, 18 * pulse); ctx.strokeStyle = rgba(C.mag, 0.85); ctx.lineWidth = 4; ctx.strokeRect(0, 0, AW, AH); noGlow();
    ctx.strokeStyle = rgba(C.cyan, 0.5); ctx.lineWidth = 1.5; ctx.strokeRect(-10, -10, AW + 20, AH + 20);
    ctx.fillStyle = C.cyan; [[0, 0], [AW, 0], [0, AH], [AW, AH]].forEach(function (c) { ctx.fillRect(c[0] - 14, c[1] - 14, 28, 28); });
  }
  function drawEnemy(e) {
    var white = e.flash > 0, col = white ? '#ffffff' : e.col;
    if (e.warp > 0) { // spawn telegraph
      var k = e.warp / 0.75; ctx.strokeStyle = rgba(e.col, 0.8 * (1 - k) + 0.2); ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (1 + k * 3), 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      for (var i = 0; i < 4; i++) { var a = i * TAU / 4 + clock * 3, rr = e.r * (1.5 + k * 4); ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * rr, e.y + Math.sin(a) * rr); ctx.lineTo(e.x + Math.cos(a) * (rr - 14), e.y + Math.sin(a) * (rr - 14)); ctx.stroke(); }
      return;
    }
    if (e.type === 'sniper' && e.state === 'aim') { // telegraph laser sight
      var lock = e.tel <= 0.35, L = 1800, fl = lock ? (Math.sin(clock * 60) > 0 ? 1 : 0.6) : 0.5 + 0.3 * Math.sin(clock * 20);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, AW, AH); ctx.clip();
      glow(lock ? C.red : C.amb, lock ? 14 : 6); ctx.strokeStyle = rgba(lock ? C.red : C.amb, lock ? 0.9 * fl : 0.45 * fl); ctx.lineWidth = lock ? 3 : 1.5;
      if (!lock) ctx.setLineDash([14, 10]);
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.aim) * L, e.y + Math.sin(e.aim) * L); ctx.stroke(); ctx.setLineDash([]); noGlow(); ctx.restore();
    }
    ctx.globalCompositeOperation = 'lighter'; blob(e.x, e.y, e.r * 2.6, e.col); ctx.globalCompositeOperation = 'source-over';
    glow(col, 14); ctx.lineWidth = e.type === 'boss' ? 4 : 2.6; ctx.strokeStyle = col; ctx.fillStyle = white ? 'rgba(255,255,255,0.5)' : rgba(e.col, 0.12);
    if (e.type === 'swarmer') {
      var va = Math.atan2(e.vy, e.vx); ctx.beginPath(); ctx.moveTo(e.x + Math.cos(va) * e.r * 1.4, e.y + Math.sin(va) * e.r * 1.4);
      ctx.lineTo(e.x + Math.cos(va + 2.5) * e.r, e.y + Math.sin(va + 2.5) * e.r); ctx.lineTo(e.x + Math.cos(va - 2.5) * e.r, e.y + Math.sin(va - 2.5) * e.r); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (e.type === 'boss') {
      poly(e.x, e.y, e.r, 12, e.rot); ctx.fill(); ctx.stroke();
      poly(e.x, e.y, e.r * 0.62, 3, -e.rot * 2); ctx.stroke();
      for (var s = 0; s < 12; s++) { var sa = e.rot + s / 12 * TAU; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(sa) * e.r, e.y + Math.sin(sa) * e.r); ctx.lineTo(e.x + Math.cos(sa) * (e.r + 14 + 6 * Math.sin(clock * 6 + s)), e.y + Math.sin(sa) * (e.r + 14 + 6 * Math.sin(clock * 6 + s))); ctx.stroke(); }
      ctx.fillStyle = white ? '#fff' : C.mag; ctx.beginPath(); ctx.arc(e.x, e.y, 12 + 4 * Math.sin(clock * 8), 0, TAU); ctx.fill();
      ctx.strokeStyle = rgba(C.red, 0.8); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 28, -Math.PI / 2, -Math.PI / 2 + TAU * e.hp / e.max); ctx.stroke();
    } else {
      poly(e.x, e.y, e.r, e.sides, e.rot); ctx.fill(); ctx.stroke();
      poly(e.x, e.y, e.r * 0.5, e.sides, -e.rot); ctx.stroke();
      if (e.type === 'sniper') { ctx.fillStyle = e.state === 'aim' ? C.red : col; ctx.beginPath(); ctx.arc(e.x + Math.cos(e.aim) * 5, e.y + Math.sin(e.aim) * 5, 4, 0, TAU); ctx.fill(); }
    }
    noGlow();
  }
  function drawPlayer(p) {
    var blink = p.inv > 0 && p.dashT <= 0 && p.inv < 0.75 && Math.sin(clock * 50) > 0.3;
    // motion trail
    ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
    for (var i = 1; i < p.trail.length; i++) { var a = p.trail[i - 1], b = p.trail[i], k = i / p.trail.length; ctx.strokeStyle = rgba(C.cyan, k * 0.5); ctx.lineWidth = k * 10; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    p.ghosts.forEach(function (g) { var al = 1 - g.t / 0.3; ctx.strokeStyle = rgba(C.cyan, al * 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(g.x, g.y, p.r, 0, TAU); ctx.stroke(); });
    blob(p.x, p.y, 54 + level * 20, C.cyan);
    ctx.globalCompositeOperation = 'source-over';
    if (blink) return;
    var col = p.critical && Math.sin(clock * 12) > 0 ? C.red : C.cyan, kick = p.kick * 3;
    glow(col, 18); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.fillStyle = rgba(col, 0.15);
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); ctx.stroke();
    var ax = Math.cos(p.aim), ay = Math.sin(p.aim), nx = -ay, ny = ax, tip = p.r + 14 - kick;
    ctx.beginPath(); ctx.moveTo(p.x + ax * tip, p.y + ay * tip); ctx.lineTo(p.x + ax * (p.r + 2) + nx * 8, p.y + ay * (p.r + 2) + ny * 8); ctx.lineTo(p.x + ax * (p.r + 2) - nx * 8, p.y + ay * (p.r + 2) - ny * 8); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, TAU); ctx.fill(); noGlow();
    // dash cooldown ring
    var ready = 1 - p.cd / G.st.dashCd;
    ctx.lineWidth = 2.5; ctx.strokeStyle = rgba(ready >= 1 ? C.lime : C.mag, ready >= 1 ? 0.55 + 0.3 * Math.sin(clock * 6) : 0.75);
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 9, -Math.PI / 2, -Math.PI / 2 + TAU * ready); ctx.stroke();
    if (p.inv > 0.05 && p.dashT > 0) { ctx.strokeStyle = rgba('#ffffff', 0.7); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 16, 0, TAU); ctx.stroke(); }
  }
  function drawParts() {
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i], k = 1 - p.life / p.max; ctx.globalAlpha = k;
      if (p.k === 0) { ctx.strokeStyle = p.col; ctx.lineWidth = p.w; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045); ctx.stroke(); }
      else if (p.k === 1) { var c = Math.cos(p.rot) * p.w, s = Math.sin(p.rot) * p.w; ctx.strokeStyle = p.col; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(p.x - c / 2, p.y - s / 2); ctx.lineTo(p.x + c / 2, p.y + s / 2); ctx.stroke(); }
      else { var r = lerp(p.r0, p.r1, 1 - k * k); ctx.strokeStyle = p.col; ctx.lineWidth = p.w * k + 0.5; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke(); }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------------- render: HUD + voice visualizer */
  var tbuf = new Uint8Array(512), fbuf = new Uint8Array(512), mbuf = new Uint8Array(256);
  function readLevels() {
    var l = 0, v = 0;
    if (AC && BUS.mixAn) { BUS.mixAn.getByteTimeDomainData(mbuf); var s = 0; for (var i = 0; i < mbuf.length; i++) { var x = (mbuf[i] - 128) / 128; s += x * x; } l = Math.min(1, Math.sqrt(s / mbuf.length) * 3.2); }
    if (Voice.cur && Voice.cur.real && BUS.voiceAn) { BUS.voiceAn.getByteTimeDomainData(tbuf); BUS.voiceAn.getByteFrequencyData(fbuf); var s2 = 0; for (var j = 0; j < tbuf.length; j++) { var y = (tbuf[j] - 128) / 128; s2 += y * y; } v = Math.min(1, Math.sqrt(s2 / tbuf.length) * 4); }
    else if (Voice.cur) { // muted or no clip: a synthetic carrier so the panel still reacts to the line
      var env = 0.5 + 0.5 * Math.sin(clock * 17) * Math.sin(clock * 5.3); v = 0.35 * env + 0.15;
      for (var k = 0; k < tbuf.length; k++) tbuf[k] = 128 + Math.sin(k * 0.21 + clock * 40) * 60 * v * Math.sin(k / tbuf.length * Math.PI);
      for (k = 0; k < fbuf.length; k++) fbuf[k] = Math.max(0, 200 * v * Math.exp(-k / 60) * (0.6 + 0.4 * Math.sin(k + clock * 30)));
    } else { for (var z = 0; z < tbuf.length; z++) tbuf[z] = 128 + Math.sin(z * 0.08 + clock * 3) * 1.5; fbuf.fill(0); }
    level += (l - level) * damp(l > level ? 30 : 6, rdt); voiceLevel += (v - voiceLevel) * damp(v > voiceLevel ? 30 : 5, rdt);
  }
  function drawViz(cx, y, w, h) {
    var x = cx - w / 2, on = !!Voice.cur, col = on ? C.cyan : C.dim;
    chamfer(x, y, w, h, 10); ctx.fillStyle = 'rgba(6,8,20,0.72)'; ctx.fill();
    glow(C.cyan, 8 + voiceLevel * 30); ctx.strokeStyle = rgba(C.cyan, 0.35 + voiceLevel * 0.6); ctx.lineWidth = 1.5; ctx.stroke(); noGlow();
    text(T.announcer + ' // ' + Voice.label(), x + 10, y + 11, 10, rgba(C.cyan, 0.75), 'left', { mono: true, max: w - 70 });
    var dotOn = on && Math.sin(clock * 10) > -0.3; ctx.fillStyle = dotOn ? C.red : rgba(C.dim, 0.6); ctx.beginPath(); ctx.arc(x + w - 38, y + 11, 3.5, 0, TAU); ctx.fill();
    text(on ? T.tx : T.idle, x + w - 10, y + 11, 10, on ? C.red : C.dim, 'right', { mono: true });
    var mid = y + h * 0.6, amp = h * 0.36, n = 64, bw = (w - 20) / n;
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < n; i++) { var f = fbuf[Math.floor(i * 3)] / 255, bh = f * amp; if (bh < 0.5) continue; ctx.fillStyle = rgba(C.mag, 0.18 + f * 0.4); ctx.fillRect(x + 10 + i * bw, mid - bh, bw - 1, bh * 2); }
    ctx.lineJoin = 'round';
    [[6, 0.18], [2, 0.95]].forEach(function (pass) {
      ctx.strokeStyle = rgba(col, pass[1]); ctx.lineWidth = pass[0]; ctx.beginPath();
      for (var k = 0; k <= 128; k++) { var v = (tbuf[Math.floor(k * 3.9)] - 128) / 128, px = x + 10 + k / 128 * (w - 20), py = mid + v * amp * 1.6; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';
    if (on) { // subtitle, revealed with the line
      var c = Voice.cur, pr = clamp((clock - c.t0) / Math.max(0.4, c.dur * 0.8), 0, 1), s = c.text.slice(0, Math.ceil(c.text.length * pr));
      text('« ' + s + ' »', cx, y + h + 16, 14 * Math.min(1, U + 0.1), C.white, 'center', { glow: 10, gc: C.cyan, max: Math.max(w, W - 40) });
    }
  }
  function hudBar(x, y, w, h, v, col, segs) {
    chamfer(x, y, w, h, 4); ctx.fillStyle = 'rgba(6,8,20,0.7)'; ctx.fill(); ctx.strokeStyle = rgba(col, 0.5); ctx.lineWidth = 1; ctx.stroke();
    var n = segs || 20, sw = (w - 6) / n, lit = v * n;
    glow(col, 10);
    for (var i = 0; i < n; i++) { var a = clamp(lit - i, 0, 1); if (a <= 0) break; ctx.fillStyle = rgba(col, 0.35 + 0.65 * a); ctx.fillRect(x + 3 + i * sw, y + 3, sw - 2, h - 6); }
    noGlow();
  }
  function drawHUD() {
    var p = G.p, s = clamp(U, 0.75, 1.1), pad = 14;
    // integrity
    var crit = p.critical, hc = crit ? (Math.sin(clock * 12) > 0 ? C.red : C.mag) : C.cyan;
    text(T.integ, pad, pad + 8, 11 * s, rgba(hc, 0.9), 'left', { mono: true, sp: 2 });
    text(Math.ceil(Math.max(0, p.hp)) + '/' + p.max, pad + 230 * s, pad + 8, 11 * s, rgba(hc, 0.9), 'right', { mono: true });
    hudBar(pad, pad + 18, 230 * s, 16 * s, Math.max(0, p.hp) / p.max, hc, 20);
    var ready = 1 - p.cd / G.st.dashCd;
    var dy = pad + 24 + 22 * s;
    text(T.dash, pad, dy + 5 * s, 10 * s, ready >= 1 ? C.lime : C.dim, 'left', { mono: true, sp: 2 });
    hudBar(pad + 56 * s, dy, 110 * s, 10 * s, ready, ready >= 1 ? C.lime : C.mag, 8);
    offscreen();
    // score / wave
    var rx = W - pad - 50;
    text(fmt(G.score), rx, pad + 18, 30 * s, C.white, 'right', { glow: 12, gc: C.cyan, mono: true, w: 800 });
    if (G.mult > 1) text('x' + G.mult.toFixed(1), rx, pad + 46 * s, 16 * s, C.mag, 'right', { glow: 10, mono: true });
    text(T.wave + ' ' + G.wave + '  ·  ' + T.left + ' ' + (G.en.length + G.queue.length), rx, pad + 66 * s, 11 * s, rgba(C.cyan, 0.75), 'right', { mono: true, sp: 1 });
    UI.btn('pause', W - pad - 40, pad, 40, 40, 'II', { col: C.cyan, size: 15, noNav: true, on: function () { go('pause'); } });
    // announcer visualizer (top center; below the bars on narrow screens)
    var vw = Math.min(340, W - 32), vy = W >= 820 ? 10 : 112 * s, vh = 54;
    drawViz(W / 2, vy, vw, vh);
    // boss bar
    var boss = null; G.en.forEach(function (e) { if (e.type === 'boss' && e.warp <= 0) boss = e; });
    if (boss) { var bw = Math.min(420, W - 40), by = vy + vh + (Voice.cur ? 34 : 12); text(T.boss, W / 2, by + 6, 12, C.vio, 'center', { mono: true, sp: 4, glow: 10 }); hudBar(W / 2 - bw / 2, by + 14, bw, 12, boss.hp / boss.max, C.vio, 30); }
    // banners
    if (G.banner) {
      var b = G.banner, life = b.small ? 1.1 : 1.8, k = b.t / life, a = k < 0.15 ? k / 0.15 : k > 0.75 ? (1 - k) / 0.25 : 1, sc = 1 + Math.max(0, 0.15 - k) * 3, sz = (b.small ? 34 : 56) * Math.min(1.2, U);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, H * (b.small ? 0.3 : 0.4)); ctx.scale(sc, sc);
      if (Math.random() < 0.25) { text(b.s, -4, 0, sz, rgba(C.mag, 0.6), 'center', { w: 900, sp: 6, max: W - 30 }); text(b.s, 4, 0, sz, rgba(C.cyan, 0.6), 'center', { w: 900, sp: 6, max: W - 30 }); }
      text(b.s, 0, 0, sz, C.white, 'center', { w: 900, sp: 6, glow: 24, gc: b.col, max: W - 30 });
      ctx.restore();
    }
    // touch controls
    if (touchMode && p.alive) {
      var dr = 40 * U; dashBtn.x = W - 70 * U; dashBtn.y = H - 190 * U; dashBtn.r = dr;
      var rdy = p.cd <= 0;
      glow(rdy ? C.lime : C.mag, rdy ? 16 : 4); ctx.strokeStyle = rgba(rdy ? C.lime : C.mag, 0.8); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(dashBtn.x, dashBtn.y, dr, 0, TAU); ctx.stroke(); noGlow();
      ctx.strokeStyle = rgba(C.lime, 0.9); ctx.beginPath(); ctx.arc(dashBtn.x, dashBtn.y, dr - 6, -Math.PI / 2, -Math.PI / 2 + TAU * ready); ctx.stroke();
      text(T.dash, dashBtn.x, dashBtn.y, 13 * U, rdy ? C.white : C.dim, 'center', { w: 800, sp: 1 });
      ['move', 'aim'].forEach(function (k) { var st = sticks[k]; if (!st) return; var c = k === 'move' ? C.cyan : C.mag; ctx.strokeStyle = rgba(c, 0.4); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(st.ox, st.oy, 60 * U, 0, TAU); ctx.stroke(); glow(c, 12); ctx.fillStyle = rgba(c, 0.5); ctx.beginPath(); ctx.arc(st.x, st.y, 22 * U, 0, TAU); ctx.fill(); noGlow(); });
      if (G.wave === 1 && G.t < 7) text(T.tapHint, W / 2, H - 40, 12 * U, rgba(C.white, 0.7 * clamp(7 - G.t, 0, 1)), 'center', { mono: true, max: W - 20 });
    }
    // damage vignette
    var hv = Math.max(p.hurtT / 0.35, p.critical ? 0.35 + 0.25 * Math.sin(clock * 6) : 0);
    if (hv > 0) { var g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); g.addColorStop(0, 'rgba(255,0,60,0)'); g.addColorStop(1, rgba(C.red, 0.45 * hv)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  }
  function offscreen() { // edge arrows for enemies outside the view (the boss gets a big one)
    var m = 22, n = 0;
    for (var i = 0; i < G.en.length && n < 30; i++) {
      var e = G.en[i]; if (e.warp > 0) continue;
      var sx = (e.x - cam.x) * Z + W / 2, sy = (e.y - cam.y) * Z + H / 2;
      if (sx > -e.r * Z && sx < W + e.r * Z && sy > -e.r * Z && sy < H + e.r * Z) continue;
      n++; var a = Math.atan2(sy - H / 2, sx - W / 2), ex = clamp(sx, m, W - m), ey = clamp(sy, m + 70, H - m), big = e.type === 'boss', r = big ? 16 : 7;
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); glow(e.col, big ? 18 : 8); ctx.fillStyle = rgba(e.col, big ? 0.6 + 0.4 * Math.sin(clock * 8) : 0.75);
      ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(-r * 0.8, r * 0.75); ctx.lineTo(-r * 0.8, -r * 0.75); ctx.closePath(); ctx.fill(); noGlow(); ctx.restore();
    }
  }
  function reticle() {
    if (touchMode) return;
    var x = mouse.x, y = mouse.y; if (x < -100) return;
    var inGame = screen === 'play' && G && G.p.alive, k = inGame ? G.p.kick : 0, r = 11 + k * 6, over = false;
    if (inGame) { var w = toWorld(x, y); G.en.forEach(function (e) { if (!over && e.warp <= 0 && hyp(e.x - w.x, e.y - w.y) < e.r + 8) over = true; }); }
    var col = over ? C.red : C.cyan;
    ctx.save(); ctx.translate(x, y); glow(col, 10); ctx.strokeStyle = col; ctx.lineWidth = 2;
    if (inGame) { ctx.rotate(clock * 1.5); for (var i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.arc(0, 0, r, -0.45, 0.45); ctx.stroke(); } ctx.rotate(-clock * 1.5 - Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fillRect(-1.5, -1.5, 3, 3); }
    else { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 16); ctx.lineTo(4.5, 12); ctx.lineTo(11, 12); ctx.closePath(); ctx.fillStyle = rgba(col, 0.25); ctx.fill(); ctx.stroke(); }
    noGlow(); ctx.restore();
  }
  function overlays() {
    ctx.save(); ctx.translate(0, (clock * 24) % 4); ctx.fillStyle = scanPat; ctx.fillRect(0, -4, W, H + 8); ctx.restore();
    var by = ((clock * 0.12) % 1.3 - 0.15) * H, g = ctx.createLinearGradient(0, by - 70, 0, by + 70); g.addColorStop(0, 'rgba(46,249,255,0)'); g.addColorStop(0.5, rgba(C.cyan, 0.035 + level * 0.04)); g.addColorStop(1, 'rgba(46,249,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, by - 70, W, 140);
    ctx.drawImage(vig, 0, 0, W, H);
    if (glitchT > 0 && !reduceMotion) { // horizontal slice tear
      for (var i = 0; i < 5; i++) { var sy = Math.random() * H, sh = rnd(6, 30), off = rnd(-24, 24); try { ctx.drawImage(cv, 0, sy * DPR, cv.width, sh * DPR, off, sy, W, sh); } catch (e) { /* tainted? never: same canvas */ } }
    }
    if (flashA > 0) { ctx.globalAlpha = flashA; ctx.fillStyle = flashC; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  /* ---------------- attract background (boot + menu) */
  var attract = { t: 0, next: 0, shapes: [] };
  function attractStep(dt) {
    attract.t += dt; attract.next -= dt;
    if (attract.next <= 0) { attract.next = rnd(0.7, 1.6); var x = cam.x + rnd(-500, 500), y = cam.y + rnd(-300, 300); shock(x, y, rnd(0.4, 1), 700, 1); ring(x, y, 4, rnd(60, 160), Math.random() < 0.5 ? C.cyan : C.mag, 0.6); }
    if (attract.shapes.length < 9) attract.shapes.push({ x: cam.x + rnd(-700, 700), y: cam.y + rnd(-400, 400), r: rnd(10, 30), n: [3, 6, 8][Math.floor(rnd(0, 3))], rot: rnd(0, TAU), rs: rnd(-1, 1), vx: rnd(-30, 30), vy: rnd(-30, 30), col: [C.mag, C.amb, C.lime][Math.floor(rnd(0, 3))] });
    attract.shapes.forEach(function (s) { s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.rs * dt; if (Math.abs(s.x - cam.x) > 800 || Math.abs(s.y - cam.y) > 500) { s.x = cam.x + rnd(-600, 600); s.y = cam.y + rnd(-350, 350); } });
    cam.x = AW / 2 + Math.cos(attract.t * 0.08) * 300; cam.y = AH / 2 + Math.sin(attract.t * 0.11) * 160;
  }
  function drawAttract() {
    renderWorld();
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(Z, Z); ctx.translate(-cam.x, -cam.y);
    attract.shapes.forEach(function (s) { ctx.globalAlpha = 0.4; glow(s.col, 10); ctx.strokeStyle = s.col; ctx.lineWidth = 2; poly(s.x, s.y, s.r, s.n, s.rot); ctx.stroke(); noGlow(); });
    ctx.globalAlpha = 1; ctx.restore();
    ctx.fillStyle = 'rgba(4,4,10,0.45)'; ctx.fillRect(0, 0, W, H);
  }
  function title(cx, y, sz) {
    var jit = Math.random() < 0.06 ? rnd(-6, 6) : 0;
    text('NEON OVERDRIVE', cx - 3 + jit, y, sz, rgba(C.mag, 0.7), 'center', { w: 900, sp: sz * 0.08, max: W - 24 });
    text('NEON OVERDRIVE', cx + 3 - jit, y, sz, rgba(C.cyan, 0.7), 'center', { w: 900, sp: sz * 0.08, max: W - 24 });
    text('NEON OVERDRIVE', cx, y, sz, C.white, 'center', { w: 900, sp: sz * 0.08, glow: 26 + level * 30, gc: C.cyan, max: W - 24 });
    text(T.sub, cx, y + sz * 0.72, sz * 0.32, C.mag, 'center', { w: 800, sp: sz * 0.12, glow: 14, max: W - 24 });
  }

  /* ---------------- boot: NEURAL LINK INITIALIZATION */
  function drawBoot() {
    drawAttract();
    var cw = Math.min(560, W - 32), cx = W / 2, x = cx - cw / 2, u = clamp(Math.min(W / 600, H / 720), 0.62, 1.15), y = Math.max(20, H / 2 - 330 * u);
    title(cx, y + 34 * u, 54 * u);
    y += 112 * u;
    var hdr = '> ' + T.init, shown = Math.min(hdr.length, Math.floor(screenT * 40));
    text(hdr.slice(0, shown) + (Math.sin(clock * 8) > 0 ? '_' : ' '), x, y, 15 * u, C.cyan, 'left', { mono: true, glow: 10, max: cw });
    y += 26 * u;
    var log = [['core.audio .......... ' + (AC ? 'OK' : 'STANDBY'), AC ? C.lime : C.dim], ['canvas.render ....... OK', C.lime], ['voice.pack .......... ' + (Object.keys(Voice.pack).length ? Object.keys(Voice.pack).length + ' ' + 'LINES' : 'STANDBY'), Object.keys(Voice.pack).length ? C.lime : C.dim]];
    Log.lines.forEach(function (l) { log.push([l.s, l.col]); });
    if (!Log.lines.length) log.push(['elevenlabs.tts ...... ' + T.awaiting, C.amb]);
    log.slice(-5).forEach(function (l, i) { if (screenT * 6 < i) return; text('> ' + l[0], x, y + i * 17 * u, 11 * u, l[1], 'left', { mono: true, max: cw }); });
    y += 5 * 17 * u + 14 * u;
    // key box
    text(T.keyLabel, x, y, 11 * u, rgba(C.cyan, 0.8), 'left', { mono: true, sp: 2 });
    y += 14 * u;
    var bh = 48 * u, r = KeyBox.rect = { x: x, y: y, w: cw, h: bh }, foc = KeyBox.focus;
    chamfer(r.x, r.y, r.w, r.h, 10); ctx.fillStyle = 'rgba(4,6,16,0.85)'; ctx.fill();
    glow(C.cyan, foc ? 14 + voiceLevel * 20 : 4); ctx.strokeStyle = rgba(C.cyan, foc ? 0.95 : 0.4); ctx.lineWidth = foc ? 2 : 1.2; ctx.stroke(); noGlow();
    var masked = KeyBox.val ? new Array(Math.min(KeyBox.val.length, 40) + 1).join('•') : '';
    ctx.save(); ctx.beginPath(); ctx.rect(r.x + 8, r.y, r.w - 90 * u, r.h); ctx.clip();
    if (masked) text(masked, r.x + 16, r.y + bh / 2 + 1, 18 * u, C.white, 'left', { mono: true, glow: 6, gc: C.cyan });
    else text(T.keyPh, r.x + 16, r.y + bh / 2 + 1, 14 * u, rgba(C.dim, 0.9), 'left', { mono: true, max: r.w - 110 * u });
    if (foc && Math.sin(clock * 7) > 0) { ctx.font = '700 ' + Math.round(18 * u) + 'px ' + MONO; var cwid = masked ? ctx.measureText(masked).width : 0; ctx.fillStyle = C.cyan; ctx.fillRect(r.x + 16 + cwid + 2, r.y + bh * 0.25, 2, bh * 0.5); }
    ctx.restore();
    if (KeyBox.val) text(KeyBox.val.length + ' ' + T.chars, r.x + r.w - 12, r.y + bh / 2, 11 * u, C.dim, 'right', { mono: true });
    y += bh + 12 * u;
    // buttons
    var gap = 10, saved = !!Store.get('key', ''), nb = saved ? 3 : 2, bw = (cw - gap * (nb - 1)) / nb, h2 = 44 * u;
    UI.btn('paste', x, y, bw, h2, T.paste, { col: C.cyan, on: readClipboard });
    UI.btn('connect', x + bw + gap, y, bw, h2, Link.busy ? T.linking + '…' : T.connect, { col: C.lime, disabled: Link.busy, on: function () { Link.connect(KeyBox.val); } });
    if (saved) UI.btn('forget', x + (bw + gap) * 2, y, bw, h2, T.forget, { col: C.red, on: function () { Store.del('key'); KeyBox.val = ''; Voice.key = ''; Voice.mode = 'pack'; Link.set('', C.dim); } });
    y += h2 + 14 * u;
    // status line
    if (Link.status) {
      var st = T[Link.status] || Link.status, sp = Link.busy ? ' ' + '▮▮▮▮▮'.slice(0, 1 + Math.floor(clock * 8) % 5) : '';
      text(st + sp, cx, y + 6 * u, 14 * u, Link.col, 'center', { mono: true, glow: 10, sp: 1, max: cw });
    }
    y += 26 * u;
    UI.btn('bypass', x, y, cw, 52 * u, '[ ' + T.bypass + ' ]', { col: C.mag, on: Link.bypass });
    y += 52 * u + 18 * u;
    text(T.privacy, cx, y, 11 * u, rgba(C.dim, 1), 'center', { mono: true, max: cw });
    text('tts: eleven_turbo_v2_5 · voice: Callum · sfx: /v1/sound-generation', cx, y + 17 * u, 10 * u, rgba(C.dim, 0.7), 'center', { mono: true, max: cw });
  }

  /* ---------------- menu */
  function drawMenu() {
    drawAttract();
    var u = clamp(Math.min(W / 600, H / 700), 0.62, 1.2), cx = W / 2, bw = Math.min(360, W - 40), bh = 50 * u, y = Math.max(20, H / 2 - 290 * u);
    title(cx, y + 40 * u, 60 * u);
    y += 116 * u;
    text(T.announcer + ': ' + Voice.label() + '   ·   ' + T.sfx + ': ' + Heavy.label(), cx, y, 11 * u, rgba(C.cyan, 0.8), 'center', { mono: true, sp: 1, max: W - 30 });
    drawViz(cx, y + 14 * u, Math.min(340, W - 32), 54);
    y += 100 * u;
    if (showControls) {
      var lines = touchMode ? T.ctlT : T.ctl, ph = (lines.length * 26 + 30) * u;
      chamfer(cx - bw / 2 - 20, y - 10, bw + 40, ph, 12); ctx.fillStyle = 'rgba(5,7,18,0.85)'; ctx.fill(); ctx.strokeStyle = rgba(C.cyan, 0.5); ctx.stroke();
      lines.forEach(function (l, i) { text(l, cx, y + 14 * u + i * 26 * u, 13 * u, C.white, 'center', { mono: true, max: bw + 20 }); });
      y += ph + 12 * u;
      UI.btn('ctlBack', cx - bw / 2, y, bw, bh, T.back, { col: C.cyan, on: function () { showControls = false; UI.focusId = 'start'; } });
      return;
    }
    UI.btn('start', cx - bw / 2, y, bw, bh * 1.15, '▶  ' + T.start, { col: C.lime, size: 22 * u, on: function () { audio(); go('play'); } });
    y += bh * 1.15 + 12 * u;
    UI.btn('controls', cx - bw / 2, y, bw, bh, T.controls, { col: C.cyan, on: function () { showControls = true; UI.focusId = 'ctlBack'; } });
    y += bh + 10 * u;
    UI.btn('relink', cx - bw / 2, y, bw, bh, T.relink, { col: C.mag, on: function () { Voice.stop(); go('boot'); } });
    y += bh + 10 * u;
    var hw = (bw - 10) / 2;
    UI.btn('sound', cx - bw / 2, y, hw, bh, T.sound + ': ' + (muted ? T.off : T.on), { col: C.amb, on: function () { setMuted(!muted); } });
    UI.btn('voice', cx - bw / 2 + hw + 10, y, hw, bh, T.voice + ': ' + (voiceOn ? T.on : T.off), { col: C.amb, on: function () { voiceOn = !voiceOn; Store.set('voice', voiceOn); if (!voiceOn) Voice.stop(); } });
    y += bh + 22 * u;
    text(T.best + '  ' + fmt(best), cx, y, 16 * u, C.white, 'center', { mono: true, glow: 10, gc: C.mag, sp: 2 });
  }

  /* ---------------- upgrade cards */
  function cardIcon(id, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); glow(col, 14); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
    var i;
    if (id === 'multi') { for (i = -2; i <= 2; i++) { var a = -Math.PI / 2 + i * 0.32; ctx.beginPath(); ctx.moveTo(0, s * 0.5); ctx.lineTo(Math.cos(a) * s, s * 0.5 + Math.sin(a) * s); ctx.stroke(); } }
    else if (id === 'pierce') { ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.moveTo(s - 12, -10); ctx.lineTo(s, 0); ctx.lineTo(s - 12, 10); ctx.stroke(); ctx.globalAlpha = 0.6; [-0.35, 0.2].forEach(function (k) { ctx.strokeRect(k * s - 6, -s * 0.55, 12, s * 1.1); }); }
    else if (id === 'dash') { [-14, 8].forEach(function (o) { ctx.beginPath(); ctx.moveTo(o - 10, -s * 0.6); ctx.lineTo(o + 12, 0); ctx.lineTo(o - 10, s * 0.6); ctx.stroke(); }); }
    else if (id === 'rapid') { for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.7, -16 + i * 16); ctx.lineTo(s * 0.7, -16 + i * 16); ctx.stroke(); } }
    else if (id === 'boom') { for (i = 0; i < 10; i++) { var b = i / 10 * TAU, r1 = i % 2 ? s * 0.45 : s; ctx.beginPath(); ctx.moveTo(Math.cos(b) * 8, Math.sin(b) * 8); ctx.lineTo(Math.cos(b) * r1, Math.sin(b) * r1); ctx.stroke(); } }
    else if (id === 'heal') { ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-s * 0.6, 0); ctx.lineTo(s * 0.6, 0); ctx.moveTo(0, -s * 0.6); ctx.lineTo(0, s * 0.6); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(6, -s); ctx.lineTo(-10, 4); ctx.lineTo(2, 4); ctx.lineTo(-6, s); ctx.lineTo(12, -6); ctx.lineTo(0, -6); ctx.closePath(); ctx.fill(); }
    noGlow(); ctx.restore();
  }
  var CARDCOL = { multi: C.cyan, pierce: C.amb, dash: C.mag, rapid: C.cyan, boom: C.amb, heal: C.lime, rail: C.vio };
  function drawUpgrade() {
    renderWorld(); ctx.fillStyle = 'rgba(3,3,10,0.66)'; ctx.fillRect(0, 0, W, H);
    G.cardT += rdt;
    var u = clamp(Math.min(W / 900, H / 700), 0.6, 1.15), cx = W / 2, top = Math.max(16, H * 0.12);
    text(T.wave + ' ' + G.wave + ' ' + T.cleared, cx, top, 40 * u, C.white, 'center', { w: 900, sp: 6, glow: 20, gc: C.lime, max: W - 20 });
    text(T.choose, cx, top + 40 * u, 15 * u, C.cyan, 'center', { mono: true, sp: 3, max: W - 20 });
    var cards = G.cards || [], vertical = W < 720, cw, ch, gap = 18 * u;
    if (vertical) { cw = Math.min(440, W - 32); ch = Math.min(124, (H - top - 120 * u) / 3 - gap); }
    else { cw = Math.min(270, (W - 80) / 3); ch = Math.min(360, H - top - 150 * u); }
    var total = vertical ? cards.length * ch + (cards.length - 1) * gap : cards.length * cw + (cards.length - 1) * gap;
    cards.forEach(function (id, i) {
      var x = vertical ? cx - cw / 2 : cx - total / 2 + i * (cw + gap), y = vertical ? top + 70 * u + i * (ch + gap) : top + 80 * u;
      var intro = clamp((G.cardT - i * 0.09) / 0.35, 0, 1), e = 1 - Math.pow(1 - intro, 3);
      var a = UI.reg('card' + i, x, y, cw, ch, { on: function () { pickCard(i); } }), k = a.h, col = CARDCOL[id] || C.cyan, nm = T.u[id], lv = G.lv[id] || 0;
      ctx.save(); ctx.globalAlpha = e; ctx.translate(0, (1 - e) * 60 - k * 8);
      chamfer(x, y, cw, ch, 18); ctx.fillStyle = rgba(col, 0.06 + 0.12 * k + 0.3 * a.p); ctx.fill();
      glow(col, 10 + 24 * k + 16 * level); ctx.strokeStyle = rgba(col, 0.65 + 0.35 * k); ctx.lineWidth = 2 + k; ctx.stroke(); noGlow();
      ctx.save(); chamfer(x, y, cw, ch, 18); ctx.clip();
      var sy = y + (((clock * 0.6 + i * 0.3) % 1.3) - 0.15) * ch, gr = ctx.createLinearGradient(0, sy - 30, 0, sy + 30); gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(0.5, rgba(col, 0.1 + 0.2 * k)); gr.addColorStop(1, rgba(col, 0)); ctx.fillStyle = gr; ctx.fillRect(x, sy - 30, cw, 60);
      ctx.restore();
      text('[' + (i + 1) + ']', x + 14, y + 16, 11, rgba(col, 0.9), 'left', { mono: true });
      text(T.lv + ' ' + lv + ' → ' + (lv + 1), x + cw - 14, y + 16, 11, rgba(col, 0.9), 'right', { mono: true });
      if (vertical) {
        cardIcon(id, x + 48, y + ch / 2 + 4, 20, col);
        text(nm[0], x + 92, y + ch * 0.42, 19 * u + 2, C.white, 'left', { w: 800, sp: 1, glow: 10 * k, gc: col, max: cw - 104 });
        text(nm[1], x + 92, y + ch * 0.7, 12 * u + 1, rgba(C.white, 0.75), 'left', { mono: true, max: cw - 104 });
      } else {
        cardIcon(id, x + cw / 2, y + ch * 0.34, 34 * u, col);
        text(nm[0], x + cw / 2, y + ch * 0.62, 20 * u + 2, C.white, 'center', { w: 800, sp: 1, glow: 10 * k, gc: col, max: cw - 24 });
        wrap(nm[1], x + cw / 2, y + ch * 0.75, cw - 34, 13 * u + 1, rgba(C.white, 0.75));
      }
      ctx.restore();
    });
  }
  function wrap(s, cx, y, maxW, size, col) {
    ctx.font = '700 ' + Math.round(size) + 'px ' + MONO; var words = s.split(' '), line = '', lines = [];
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }); if (line) lines.push(line);
    lines.forEach(function (l, i) { text(l, cx, y + i * size * 1.35, size, col, 'center', { mono: true, max: maxW }); });
  }

  /* ---------------- pause + game over */
  function drawPause() {
    renderWorld(); drawHUD(); ctx.fillStyle = 'rgba(3,3,10,0.7)'; ctx.fillRect(0, 0, W, H);
    var u = clamp(Math.min(W / 600, H / 700), 0.62, 1.2), cx = W / 2, bw = Math.min(340, W - 40), bh = 50 * u, y = H / 2 - 150 * u;
    text(T.paused, cx, y, 46 * u, C.white, 'center', { w: 900, sp: 8, glow: 22, gc: C.cyan });
    y += 50 * u;
    UI.btn('resume', cx - bw / 2, y, bw, bh, '▶  ' + T.resume, { col: C.lime, on: function () { go('play'); } }); y += bh + 10 * u;
    var hw = (bw - 10) / 2;
    UI.btn('psound', cx - bw / 2, y, hw, bh, T.sound + ': ' + (muted ? T.off : T.on), { col: C.amb, on: function () { setMuted(!muted); } });
    UI.btn('pvoice', cx - bw / 2 + hw + 10, y, hw, bh, T.voice + ': ' + (voiceOn ? T.on : T.off), { col: C.amb, on: function () { voiceOn = !voiceOn; Store.set('voice', voiceOn); if (!voiceOn) Voice.stop(); } }); y += bh + 10 * u;
    UI.btn('quit', cx - bw / 2, y, bw, bh, T.quit, { col: C.red, on: function () { Voice.stop(); G = null; go('menu'); } });
  }
  function drawOver() {
    renderWorld(); ctx.fillStyle = 'rgba(3,3,10,' + Math.min(0.72, screenT * 1.5) + ')'; ctx.fillRect(0, 0, W, H);
    var u = clamp(Math.min(W / 600, H / 700), 0.62, 1.2), cx = W / 2, bw = Math.min(340, W - 40), bh = 52 * u, y = Math.max(30, H / 2 - 210 * u);
    var jit = Math.random() < 0.15 ? rnd(-8, 8) : 0;
    text(T.lost, cx + jit, y, 54 * u, rgba(C.red, 0.6), 'center', { w: 900, sp: 8, max: W - 20 });
    text(T.lost, cx, y, 54 * u, C.white, 'center', { w: 900, sp: 8, glow: 26, gc: C.red, max: W - 20 });
    y += 64 * u;
    var rows = [[T.score, fmt(G.score), C.white], [T.wave, String(G.wave), C.cyan], [T.kills, String(G.kills), C.mag], [T.best, fmt(best), C.amb]];
    rows.forEach(function (r, i) { var ry = y + i * 30 * u; text(r[0], cx - 12, ry, 14 * u, rgba(C.dim, 1), 'right', { mono: true, sp: 2 }); text(r[1], cx + 12, ry, 20 * u, r[2], 'left', { mono: true, glow: 10 }); });
    y += rows.length * 30 * u + 6 * u;
    if (G.newBest) text('★ ' + T.newBest + ' ★', cx, y + 6 * u, 18 * u, C.amb, 'center', { w: 800, sp: 3, glow: 16 + 10 * Math.sin(clock * 6) });
    y += 34 * u;
    UI.btn('reboot', cx - bw / 2, y, bw, bh, '↻  ' + T.reboot, { col: C.lime, on: function () { go('menu'); go('play'); } }); y += bh + 10 * u;
    UI.btn('omenu', cx - bw / 2, y, bw, bh, T.menu, { col: C.cyan, on: function () { G = null; go('menu'); } });
    drawViz(W / 2, H - 80, Math.min(340, W - 32), 54);
  }

  /* ================================================================ loop */
  var last = 0, clock = 0, rdt = 0.016, ema = 0.016, slowFor = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min(0.05, Math.max(0, (ts - last) / 1000)) : 0.016; last = ts; rdt = dt; clock += dt; screenT += dt;
    // adaptive quality: glow and resolution drop on slow devices
    ema += (dt - ema) * 0.05; if (ema > 0.026 && screen === 'play') { slowFor += dt; if (slowFor > 2 && Qual > 0.4) { Qual -= 0.3; slowFor = 0; if (Qual < 0.7 && MAXDPR > 1) { MAXDPR = 1; resize(); } } } else slowFor = 0;
    trauma = Math.max(0, trauma - dt * 1.7); var sm = trauma * trauma * 22;
    shakeX = sm * (Math.sin(clock * 37) * 0.6 + Math.sin(clock * 91 + 1.7) * 0.4); shakeY = sm * (Math.sin(clock * 43 + 0.6) * 0.6 + Math.sin(clock * 83 + 2.9) * 0.4);
    flashA = Math.max(0, flashA - dt * 2.2); glitchT -= dt;
    if (screen === 'play' && G) {
      if (hitstop > 0) hitstop -= dt; // 40 ms freeze frame on big kills
      else { var sdt = dt * (G.slow || 1) * speedX, n = Math.ceil(sdt / 0.02); for (var i = 0; i < n; i++) update(sdt / n); stepFx(dt * (G.slow || 1) * speedX); }
    } else if (screen === 'boot' || screen === 'menu') { attractStep(dt); stepFx(dt); }
    else if (screen === 'over') stepFx(dt * 0.4);
    readLevels();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.direction = RTL ? 'rtl' : 'ltr';
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    UI.list = [];
    if (screen === 'boot') drawBoot();
    else if (screen === 'menu') drawMenu();
    else if (screen === 'play') { renderWorld(); drawHUD(); }
    else if (screen === 'upgrade') drawUpgrade();
    else if (screen === 'pause') drawPause();
    else if (screen === 'over') drawOver();
    overlays(); reticle();
  }
  requestAnimationFrame(frame);

  /* ================================================================ test hooks (?test) */
  if (TEST) {
    window.__neon = {
      s: function () {
        return { screen: screen, mode: Voice.mode, voice: Voice.cur && Voice.cur.text, vq: Voice.q.map(function (q) { return q.id; }), keyLen: KeyBox.val.length, keyFocus: KeyBox.focus, status: Link.status,
          wave: G && G.wave, phase: G && G.phase, hp: G && G.p.hp, max: G && G.p.max, alive: G && G.p.alive, px: G && Math.round(G.p.x), py: G && Math.round(G.p.y), vx: G && Math.round(G.p.vx), cd: G && G.p.cd, inv: G && G.p.inv,
          score: G && G.score, kills: G && G.kills, enemies: G ? G.en.length : 0, types: G ? G.en.map(function (e) { return e.type; }) : [], queue: G ? G.queue.length : 0, bullets: G ? G.bullets.length : 0, eb: G ? G.eb.length : 0,
          cards: G && G.cards, lv: G && G.lv, st: G && G.st, parts: parts.length, waves: waves.length, trauma: trauma, ui: UI.list.map(function (it) { return { id: it.id, x: it.x + it.w / 2, y: it.y + it.h / 2, dis: !!it.o.disabled }; }),
          heavy: Heavy.src, pack: Object.keys(Voice.pack).length, calls: XI.calls, ac: !!AC, qual: Qual };
      },
      scr: function () { return G ? G.en.filter(function (e) { return e.warp <= 0; }).map(function (e) { return { t: e.type, x: (e.x - cam.x) * Z + W / 2, y: (e.y - cam.y) * Z + H / 2 }; }) : []; },
      speed: function (x) { speedX = x; },
      spawn: function (t, dx, dy) { var e = makeEnemy(t, G.p.x + (dx || 300), G.p.y + (dy || 0), false); return G.en.length; },
      clearQueue: function () { G.queue.length = 0; }, killAll: function () { G.en.slice().forEach(function (e) { kill(e, 0); }); G.en = G.en.filter(function (e) { return !e.dead; }); },
      hurt: function (n) { G.p.inv = 0; hurtPlayer(n, G.p.x + 10, G.p.y); }, god: function () { G.p.inv = 1e9; }, mortal: function () { G.p.inv = 0; },
      wave: function (n) { G.wave = n - 1; G.en.length = 0; G.queue.length = 0; startWave(); },
      say: function (id) { Voice.say(id, { pr: 5, ttl: 9 }); }, xi: XI, voice: Voice, link: Link
    };
  }
})();
