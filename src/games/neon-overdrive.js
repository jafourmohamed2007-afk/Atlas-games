/* NEON OVERDRIVE: VOICE PROTOCOL — single-file cyber-arena survival shooter for Bubzi.
   Everything (boot screen, menus, HUD, upgrade cards, waveform, touch buttons) is drawn on ONE full-viewport <canvas>:
   no HTML buttons, inputs or CSS overlays. Players never need an API key: the announcer (voice "Callum") and the heavy
   SFX were made ahead of time with ElevenLabs (tools/art/neon/gen-audio.py → audio/neon-overdrive/); the Web Audio
   SoundFX synth plays rapid fire and covers any sound that fails to load.
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
      awaiting: 'AWAITING KEY', online: 'ONLINE', offline: 'OFFLINE', rejected: 'REJECTED', kill2: 'DOUBLE KILL', kill3: 'TRIPLE KILL', kill6: 'RAMPAGE', tapHint: 'LEFT THUMB MOVE · HOLD FIRE TO SHOOT', clickHint: 'HOLD LEFT CLICK TO FIRE · SPACE TO DASH', fire: 'FIRE', engage: 'ENGAGE NEURAL LINK', soundHint: 'Turn the sound on: the announcer talks.',
      ctl: ['WASD / ARROWS   move', 'MOUSE   aim        LEFT CLICK   fire', 'SPACE   dash (invulnerable)', '1 2 3   pick upgrade        ESC   pause'],
      ctlT: ['LEFT THUMB   move', 'FIRE button   hold to shoot where you move', 'RIGHT THUMB drag   aim + fire', 'DASH button   dash (invulnerable)'],
      u: { multi: ['MULTISHOT', '+1 projectile per shot'], pierce: ['PIERCING ROUNDS', 'Shots pass through +1 enemy'], dash: ['OVERCLOCKED DASH', '-15% cooldown, dash shreds enemies'], rapid: ['HYPER TRIGGER', '+10% fire rate'], boom: ['EXPLOSIVE ROUNDS', 'Shots burst on impact'], heal: ['NANO REPAIR', '+20 max integrity, full repair'], rail: ['RAIL COILS', '+15% damage, faster shots'],
        drone: ['ORBIT DRONE', '+1 drone that shoots the nearest enemy'], regen: ['NANO REGEN', '+0.5 integrity per second'], crit: ['CRITICAL CORE', '+6% chance of 2.2× damage'], ricochet: ['RICOCHET', 'Shots jump to +1 more enemy'], shield: ['AEGIS SHIELD', 'Blocks a hit, recharges faster each level'], servo: ['SERVO BOOST', '+8% speed, faster dash'] },
      bn: { overmind: 'OVERMIND', warden: 'WARDEN', queen: 'HIVE QUEEN', lancer: 'LANCER', prism: 'PRISM', hydra: 'HYDRA', 'null': 'NULL CORE' },
      onlineBtn: 'ONLINE BATTLE', onlineArena: 'ONLINE ARENA', dm: 'DEATHMATCH · UP TO 8 PILOTS · FIRST TO 15', srvOn: 'SERVER ONLINE', pilots: 'PILOTS ONLINE', connecting: 'CONNECTING', srvOff: 'SERVER OFFLINE', offlineMsg: 'Online battles need the Neon Overdrive game server, and it is not running yet. Try again later.', reconnect: 'TRY AGAIN', pilot: 'PILOT', rename: 'NEW NAME', quick: 'QUICK MATCH', create: 'CREATE PRIVATE ROOM', joinCode: 'JOIN WITH CODE', enterCode: 'ENTER THE 4-DIGIT ROOM CODE', cancel: 'CANCEL', e_nocode: 'ROOM NOT FOUND', e_full: 'ROOM FULL', e_busy: 'SERVER BUSY', e_lost: 'CONNECTION LOST', room: 'ROOM', publicRoom: 'PUBLIC ROOM', warmup: 'WARM-UP', waitPilots: 'WAITING FOR PILOTS', shareCode: 'SHARE THIS CODE', fightGo: 'FIGHT!', elimBy: 'ELIMINATED BY', elim: 'ELIMINATED', respawn: 'RESPAWN IN', winner: 'WINNER', youWin: 'YOU WIN', nextMatch: 'NEXT MATCH IN', leave: 'LEAVE ROOM', joined: 'joined', leftRoom: 'left', kShort: 'K', dShort: 'D', firstTo: 'FIRST TO', onlineLive: 'The match keeps running while this menu is open.', 
      conquered: 'ARENA CONQUERED', winSub: 'All 60 waves cleared. The Null Core is gone.', time: 'TIME', cont: 'CONTINUE · WAVE', newRun: 'NEW RUN', retryCp: 'RETRY FROM WAVE', cpSaved: 'CHECKPOINT SAVED', shielded: 'SHIELDED', twin: 'TWIN' },
    fr: { sub: 'PROTOCOLE VOCAL', init: 'INITIALISATION DU LIEN NEURAL', keyLabel: 'CLÉ API ELEVENLABS', keyPh: 'Colle (Ctrl+V) ou tape ta clé', paste: 'COLLER', connect: 'CONNEXION', forget: 'OUBLIER LA CLÉ', bypass: 'CONTOURNER / MODE SYNTHÉ HORS LIGNE',
      privacy: 'Ta clé reste dans ce navigateur et n’est envoyée qu’à api.elevenlabs.io.', linking: 'CONNEXION', linked: 'LIEN ÉTABLI', bad: 'LIEN REFUSÉ : CLÉ INVALIDE', limit: 'LIMITE ATTEINTE : MODE HORS LIGNE', quota: 'PLUS DE CRÉDITS : MODE HORS LIGNE', net: 'PAS DE SIGNAL : MODE HORS LIGNE', short: 'CLÉ TROP COURTE', clip: 'PRESSE-PAPIERS BLOQUÉ : CTRL+V', got: 'CLÉ REÇUE', chars: 'car.',
      start: 'LANCER', controls: 'COMMANDES', relink: 'LIEN NEURAL', sound: 'SON', voice: 'VOIX', on: 'OUI', off: 'NON', best: 'RECORD', wave: 'VAGUE', score: 'SCORE', integ: 'INTÉGRITÉ', dash: 'DASH', left: 'HOSTILES', cleared: 'TERMINÉE', choose: 'CHOISIS UNE AMÉLIORATION', paused: 'PAUSE', resume: 'REPRENDRE', quit: 'ABANDONNER', lost: 'SIGNAL PERDU', kills: 'ÉLIMINATIONS', reboot: 'REDÉMARRER', menu: 'MENU', newBest: 'NOUVEAU RECORD',
      modeLive: 'DIRECT · ELEVENLABS', modePack: 'PACK VOCAL', modeSynth: 'SYNTHÉ', announcer: 'ANNONCEUR', sfx: 'SFX', sfxLive: 'GÉNÉRÉS', sfxPack: 'PACK', lv: 'NV', boss: 'OVERMIND', bossWarn: 'SIGNATURE DE BOSS', back: 'RETOUR', tx: 'TX', idle: 'VEILLE',
      awaiting: 'EN ATTENTE DE CLÉ', online: 'EN LIGNE', offline: 'HORS LIGNE', rejected: 'REFUSÉ', kill2: 'DOUBLÉ', kill3: 'TRIPLÉ', kill6: 'CARNAGE', tapHint: 'POUCE GAUCHE BOUGER · MAINTIENS TIR', clickHint: 'MAINTIENS CLIC GAUCHE POUR TIRER · ESPACE POUR DASH', fire: 'TIR', engage: 'ACTIVER LE LIEN NEURAL', soundHint: 'Active le son : l’annonceur parle.',
      ctl: ['ZQSD / FLÈCHES   bouger', 'SOURIS   viser        CLIC GAUCHE   tirer', 'ESPACE   dash (invulnérable)', '1 2 3   amélioration        ÉCHAP   pause'],
      ctlT: ['POUCE GAUCHE   bouger', 'Bouton TIR   maintiens pour tirer où tu vas', 'POUCE DROIT glissé   viser + tirer', 'Bouton DASH   dash (invulnérable)'],
      u: { multi: ['TIR MULTIPLE', '+1 projectile par tir'], pierce: ['BALLES PERFORANTES', 'Les tirs traversent +1 ennemi'], dash: ['DASH SURCADENCÉ', '-15 % de recharge, le dash déchiquette'], rapid: ['GÂCHETTE HYPER', '+10 % de cadence'], boom: ['BALLES EXPLOSIVES', 'Les tirs explosent à l’impact'], heal: ['NANO-RÉPARATION', '+20 intégrité max, réparation totale'], rail: ['BOBINES RAIL', '+15 % de dégâts, tirs plus rapides'],
        drone: ['DRONE ORBITAL', '+1 drone qui tire sur l’ennemi le plus proche'], regen: ['NANO-RÉGÉNÉRATION', '+0,5 intégrité par seconde'], crit: ['NOYAU CRITIQUE', '+6 % de chance de dégâts ×2,2'], ricochet: ['RICOCHET', 'Les tirs rebondissent sur +1 ennemi'], shield: ['BOUCLIER ÉGIDE', 'Bloque un coup, recharge plus vite par niveau'], servo: ['SERVO BOOST', '+8 % de vitesse, dash plus rapide'] },
      bn: { overmind: 'OVERMIND', warden: 'GARDIEN', queen: 'REINE DE LA RUCHE', lancer: 'LANCIER', prism: 'PRISME', hydra: 'HYDRE', 'null': 'NOYAU NUL' },
      onlineBtn: 'COMBAT EN LIGNE', onlineArena: 'ARÈNE EN LIGNE', dm: 'MATCH À MORT · JUSQU’À 8 PILOTES · 15 ÉLIMINATIONS', srvOn: 'SERVEUR EN LIGNE', pilots: 'PILOTES EN LIGNE', connecting: 'CONNEXION', srvOff: 'SERVEUR HORS LIGNE', offlineMsg: 'Les combats en ligne ont besoin du serveur de Neon Overdrive, qui n’est pas encore lancé. Réessaie plus tard.', reconnect: 'RÉESSAYER', pilot: 'PILOTE', rename: 'NOUVEAU NOM', quick: 'PARTIE RAPIDE', create: 'CRÉER UNE SALLE PRIVÉE', joinCode: 'REJOINDRE AVEC UN CODE', enterCode: 'ENTRE LE CODE À 4 CHIFFRES', cancel: 'ANNULER', e_nocode: 'SALLE INTROUVABLE', e_full: 'SALLE PLEINE', e_busy: 'SERVEUR SATURÉ', e_lost: 'CONNEXION PERDUE', room: 'SALLE', publicRoom: 'SALLE PUBLIQUE', warmup: 'ÉCHAUFFEMENT', waitPilots: 'EN ATTENTE DE PILOTES', shareCode: 'PARTAGE CE CODE', fightGo: 'COMBAT !', elimBy: 'ÉLIMINÉ PAR', elim: 'ÉLIMINÉ', respawn: 'RETOUR DANS', winner: 'VAINQUEUR', youWin: 'TU GAGNES', nextMatch: 'PROCHAIN MATCH DANS', leave: 'QUITTER LA SALLE', joined: 'a rejoint', leftRoom: 'est parti', kShort: 'É', dShort: 'M', firstTo: 'OBJECTIF', onlineLive: 'Le match continue pendant que ce menu est ouvert.', 
      conquered: 'ARÈNE CONQUISE', winSub: 'Les 60 vagues sont vaincues. Le Noyau Nul est détruit.', time: 'TEMPS', cont: 'CONTINUER · VAGUE', newRun: 'NOUVELLE PARTIE', retryCp: 'REPRENDRE À LA VAGUE', cpSaved: 'POINT DE CONTRÔLE', shielded: 'PROTÉGÉ', twin: 'JUMEAUX' },
    ar: { sub: 'بروتوكول الصوت', init: 'تهيئة الرابط العصبي', keyLabel: 'مفتاح ElevenLabs API', keyPh: 'الصق (Ctrl+V) أو اكتب مفتاحك', paste: 'لصق', connect: 'اتصال', forget: 'انسَ المفتاح', bypass: 'تخطٍّ / وضع المُركِّب دون اتصال',
      privacy: 'يُحفظ مفتاحك في هذا المتصفح فقط ولا يُرسل إلا إلى api.elevenlabs.io.', linking: 'جارٍ الربط', linked: 'تم إنشاء الرابط', bad: 'رُفض الرابط: مفتاح غير صالح', limit: 'تجاوز الحد: وضع دون اتصال', quota: 'نفد الرصيد: وضع دون اتصال', net: 'لا إشارة: وضع دون اتصال', short: 'المفتاح قصير جداً', clip: 'الحافظة محظورة: استخدم Ctrl+V', got: 'تم استلام المفتاح', chars: 'حرفاً',
      start: 'ابدأ الجولة', controls: 'التحكم', relink: 'الرابط العصبي', sound: 'الصوت', voice: 'المعلّق', on: 'تشغيل', off: 'إيقاف', best: 'الأفضل', wave: 'الموجة', score: 'النقاط', integ: 'السلامة', dash: 'اندفاع', left: 'الأعداء', cleared: 'انتهت', choose: 'اختر ترقية', paused: 'إيقاف مؤقت', resume: 'استئناف', quit: 'إنهاء الجولة', lost: 'فُقدت الإشارة', kills: 'القتلى', reboot: 'إعادة التشغيل', menu: 'القائمة', newBest: 'رقم قياسي جديد',
      modeLive: 'مباشر · ElevenLabs', modePack: 'حزمة الصوت', modeSynth: 'مُركِّب', announcer: 'المعلّق', sfx: 'المؤثرات', sfxLive: 'مولَّدة', sfxPack: 'حزمة', lv: 'م', boss: 'العقل الأعلى', bossWarn: 'بصمة الزعيم', back: 'رجوع', tx: 'بث', idle: 'خامل',
      awaiting: 'بانتظار المفتاح', online: 'متصل', offline: 'دون اتصال', rejected: 'مرفوض', kill2: 'قتل مزدوج', kill3: 'قتل ثلاثي', kill6: 'هيجان', tapHint: 'الإبهام الأيسر للحركة · اضغط إطلاق مطولاً', clickHint: 'اضغط مطولاً بالزر الأيسر للإطلاق · المسافة للاندفاع', fire: 'إطلاق', engage: 'تفعيل الرابط العصبي', soundHint: 'شغّل الصوت: المعلّق يتكلم.',
      ctl: ['WASD / الأسهم   حركة', 'الفأرة   تصويب        النقر الأيسر   إطلاق', 'المسافة   اندفاع (حصانة)', '1 2 3   اختيار ترقية        ESC   إيقاف'],
      ctlT: ['الإبهام الأيسر   حركة', 'زر الإطلاق   اضغط مطولاً للإطلاق باتجاه حركتك', 'سحب الإبهام الأيمن   تصويب وإطلاق', 'زر الاندفاع   اندفاع (حصانة)'],
      u: { multi: ['طلقات متعددة', '+1 مقذوف لكل طلقة'], pierce: ['طلقات خارقة', 'الطلقات تخترق عدواً إضافياً'], dash: ['اندفاع فائق', '-15٪ تبريد والاندفاع يمزّق الأعداء'], rapid: ['زناد فائق', '+10٪ سرعة إطلاق'], boom: ['طلقات متفجرة', 'الطلقات تنفجر عند الاصطدام'], heal: ['إصلاح نانوي', '+20 سلامة قصوى وإصلاح كامل'], rail: ['ملفات السكة', '+15٪ ضرر وطلقات أسرع'],
        drone: ['طائرة مدارية', '+1 طائرة تطلق على أقرب عدو'], regen: ['تجدد نانوي', '+0.5 سلامة في الثانية'], crit: ['نواة حرجة', '+6٪ فرصة ضرر ×2.2'], ricochet: ['ارتداد', 'الطلقات تقفز إلى عدو إضافي'], shield: ['درع إيجيس', 'يصد ضربة ويُشحن أسرع مع كل مستوى'], servo: ['دفع سيرفو', '+8٪ سرعة واندفاع أسرع'] },
      bn: { overmind: 'العقل الأعلى', warden: 'الحارس', queen: 'ملكة الخلية', lancer: 'الرمّاح', prism: 'الموشور', hydra: 'الهيدرا', 'null': 'النواة الصفرية' },
      onlineBtn: 'معركة عبر الإنترنت', onlineArena: 'الساحة عبر الإنترنت', dm: 'قتال حتى الموت · حتى 8 طيارين · أول من يصل إلى 15', srvOn: 'الخادم متصل', pilots: 'طيارين متصلين', connecting: 'جارٍ الاتصال', srvOff: 'الخادم غير متصل', offlineMsg: 'المعارك عبر الإنترنت تحتاج خادم لعبة نيون أوفردرايف، وهو لا يعمل بعد. حاول لاحقاً.', reconnect: 'حاول مجدداً', pilot: 'الطيار', rename: 'اسم جديد', quick: 'مباراة سريعة', create: 'إنشاء غرفة خاصة', joinCode: 'انضم برمز', enterCode: 'أدخل رمز الغرفة من 4 أرقام', cancel: 'إلغاء', e_nocode: 'الغرفة غير موجودة', e_full: 'الغرفة ممتلئة', e_busy: 'الخادم مشغول', e_lost: 'انقطع الاتصال', room: 'الغرفة', publicRoom: 'غرفة عامة', warmup: 'إحماء', waitPilots: 'بانتظار الطيارين', shareCode: 'شارك هذا الرمز', fightGo: 'قاتل!', elimBy: 'أقصاك', elim: 'تم الإقصاء', respawn: 'العودة خلال', winner: 'الفائز', youWin: 'لقد فزت', nextMatch: 'المباراة التالية خلال', leave: 'غادر الغرفة', joined: 'انضم', leftRoom: 'غادر', kShort: 'ق', dShort: 'م', firstTo: 'الهدف', onlineLive: 'المباراة مستمرة أثناء فتح هذه القائمة.', 
      conquered: 'تم غزو الساحة', winSub: 'تم تطهير الموجات الستين. انتهت النواة الصفرية.', time: 'الوقت', cont: 'متابعة · الموجة', newRun: 'جولة جديدة', retryCp: 'أعد من الموجة', cpSaved: 'تم حفظ نقطة التفتيش', shielded: 'محمي', twin: 'التوأم' }
  };
  var T = STR[LANG];
  // Announcer lines: the same text as tools/art/neon/lines.json (the generated voice pack); shown as subtitles.
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
    record: { en: 'New record. Legendary.', fr: 'Nouveau record. Légendaire.', ar: 'رقم قياسي جديد. أسطوري.' },
    checkpoint: { en: 'Checkpoint saved.', fr: 'Point de contrôle enregistré.', ar: 'تم حفظ نقطة التفتيش.' },
    victory: { en: 'Arena conquered. You are the overdrive.', fr: 'Arène conquise. Tu es l’overdrive.', ar: 'تم غزو الساحة. أنت الأوفردرايف.' }
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
  SoundFX.prototype.dash = function () { if (!this.ok('dash', 0.08)) return; if (Heavy.play('dash', 0.8)) return; this.nz({ ft: 'bandpass', f: 500, f2: 3200, dur: 0.24, vol: 0.28, q: 1.3, a: 0.02 }); this.osc({ f: 220, f2: 950, dur: 0.18, vol: 0.07 }); };
  SoundFX.prototype.hit = function () { if (!this.ok('hit', 0.03)) return; this.osc({ type: 'triangle', f: rnd(800, 1000), f2: 280, dur: 0.05, vol: 0.06 }); this.nz({ ft: 'highpass', f: 3000, dur: 0.03, vol: 0.05 }); };
  SoundFX.prototype.pop = function () { if (!this.ok('pop', 0.035)) return; this.osc({ type: 'square', f: rnd(420, 560), f2: 70, dur: 0.13, vol: 0.09, lp: 1900 }); this.nz({ f: 3200, f2: 260, dur: 0.16, vol: 0.13 }); };
  SoundFX.prototype.boom = function (size) {
    if (!this.ok('boom', 0.06)) return;
    if (Heavy.play('explode', 0.55 + 0.4 * size)) return;
    this.osc({ f: 150, f2: 30, dur: 0.65, vol: 0.5 * size + 0.1 }); this.nz({ f: 2600, f2: 120, dur: 0.75, vol: 0.4 * size + 0.1 }); this.osc({ type: 'sawtooth', f: 70, f2: 28, dur: 0.45, vol: 0.14, lp: 420 });
  };
  SoundFX.prototype.impact = function () { if (!this.ok('impact', 0.08)) return; if (Heavy.play('impact', 0.7)) return; this.osc({ f: 210, f2: 42, dur: 0.26, vol: 0.4 }); this.nz({ f: 1600, f2: 200, dur: 0.22, vol: 0.25 }); };
  SoundFX.prototype.hurt = function () { if (!this.ok('hurt', 0.1)) return; if (Heavy.play('hurt', 0.85)) return; this.osc({ type: 'sawtooth', f: 320, f2: 65, dur: 0.3, vol: 0.18, lp: 1500 }); this.nz({ ft: 'bandpass', f: 900, dur: 0.22, vol: 0.18 }); this.impact(); };
  SoundFX.prototype.chime = function () { if (!this.ok('chime', 0.1)) return; var s = this; [880, 1320, 1760, 2640].forEach(function (f, i) { s.osc({ f: f, dur: 0.55, vol: 0.07, at: i * 0.06 }); s.osc({ type: 'triangle', f: f * 2, dur: 0.25, vol: 0.02, at: i * 0.06 }); }); };
  SoundFX.prototype.hover = function () { if (!this.ok('hover', 0.05)) return; this.osc({ f: 2400, dur: 0.03, vol: 0.025 }); };
  SoundFX.prototype.click = function () { if (!this.ok('click', 0.03)) return; this.osc({ type: 'square', f: 1300, f2: 600, dur: 0.05, vol: 0.05, lp: 3200 }); };
  SoundFX.prototype.type = function () { if (!this.ok('type', 0.02)) return; this.osc({ type: 'square', f: rnd(2200, 3600), dur: 0.018, vol: 0.02, lp: 5000 }); };
  SoundFX.prototype.err = function () { if (!this.ok('err', 0.2)) return; this.osc({ type: 'square', f: 220, dur: 0.12, vol: 0.06, lp: 1200 }); this.osc({ type: 'square', f: 180, dur: 0.18, vol: 0.06, lp: 1200, at: 0.13 }); };
  SoundFX.prototype.charge = function () { if (!this.ok('charge', 0.15)) return; if (Heavy.play('charge', 0.45)) return; this.osc({ f: 260, f2: 1500, dur: 0.95, vol: 0.03, a: 0.25 }); };
  SoundFX.prototype.snipe = function () { if (!this.ok('snipe', 0.05)) return; if (Heavy.play('snipe', 0.6)) return; this.osc({ type: 'sawtooth', f: 2300, f2: 180, dur: 0.17, vol: 0.08, lp: 6000 }); this.nz({ ft: 'highpass', f: 4000, dur: 0.05, vol: 0.08 }); };
  SoundFX.prototype.ring = function () { if (!this.ok('ring', 0.1)) return; this.osc({ type: 'triangle', f: 420, f2: 140, dur: 0.22, vol: 0.08 }); };
  SoundFX.prototype.alarm = function () { if (!this.ok('alarm', 1)) return; if (Heavy.play('alarm', 0.75, 1)) return; var s = this; [0, 0.55].forEach(function (at) { s.osc({ type: 'sawtooth', f: 180, f2: 140, dur: 0.45, vol: 0.12, lp: 900, at: at, a: 0.05 }); }); };
  SoundFX.prototype.pickup = function () { if (!this.ok('pickup', 0.05)) return; if (Heavy.play('pickup', 0.7)) return; this.osc({ f: 600, f2: 1800, dur: 0.15, vol: 0.09 }); this.osc({ type: 'triangle', f: 1200, f2: 2400, dur: 0.12, vol: 0.05, at: 0.06 }); };
  SoundFX.prototype.wave = function () { if (!this.ok('wave', 0.5)) return; if (Heavy.play('wave', 0.75)) return; this.osc({ type: 'sawtooth', f: 110, f2: 220, dur: 0.6, vol: 0.1, lp: 900, a: 0.05 }); this.osc({ f: 880, dur: 0.4, vol: 0.04, at: 0.3 }); };
  SoundFX.prototype.upgrade = function () { if (!this.ok('upgrade', 0.2)) return; if (Heavy.play('upgrade', 0.8, 1)) return; this.chime(); };
  var SFX = new SoundFX();

  /* ---------------- ElevenLabs sound bank (generated ahead of time) > synth fallback */
  var Heavy = {
    ids: ['impact', 'explode', 'alarm', 'dash', 'hurt', 'pickup', 'charge', 'snipe', 'upgrade', 'wave'], buf: {},
    loadPack: function () { this.ids.forEach(function (id) { fetchBuf(BASE + 'sfx_' + id + '.mp3').then(function (b) { Heavy.buf[id] = b; }, function () { /* synth stays */ }); }); },
    play: function (id, vol, rate) {
      var b = this.buf[id]; if (!b) return false; if (!AC || muted) return true;
      var s = AC.createBufferSource(), g = AC.createGain(); s.buffer = b; s.playbackRate.value = rate || rnd(0.92, 1.08); g.gain.value = vol == null ? 0.9 : vol;
      s.connect(g); g.connect(BUS.sfx); s.start(); return true;
    },
    count: function () { return Object.keys(this.buf).length; }
  };

  /* ---------------- Announcer: pre-generated ElevenLabs lines, priority queue, never talks over himself */
  var Voice = {
    pack: {}, q: [], busy: false, cur: null, src: null,
    say: function (id, o) {
      o = o || {}; if (!LINES[id]) return;
      var txt = LINES[id][LANG];
      for (var i = 0; i < this.q.length; i++) if (this.q[i].id === id) return;
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
      this.packClip(it.id).then(done, function () { done(null); });
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
    label: function () { return Object.keys(this.pack).length ? T.modePack : T.modeSynth; }
  };
  function engage() { audio(); go('menu'); Voice.say('link', { pr: 5, ttl: 8 }); SFX.chime(); }

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
  var sticks = { move: null, aim: null }, dashBtn = { x: 0, y: 0, r: 0 }, fireBtn = { x: 0, y: 0, r: 0, p: 0 }, fireTouch = null;
  window.addEventListener('keydown', function (e) {
    audio(); keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].indexOf(e.code) >= 0) e.preventDefault();
    if (e.repeat) return;
    if (screen === 'play') {
      if (e.code === 'Space' || e.code === 'ShiftLeft') tryDash();
      else if (e.code === 'Escape' || e.code === 'KeyP') go('pause');
      return;
    }
    if (screen === 'online' && OG) {
      if (e.code === 'Escape' || e.code === 'KeyP') { if (!OG.end) { OG.menu = !OG.menu; UI.focusId = 'oresume'; } return; }
      if (!OG.menu && !OG.end) { if (e.code === 'Space' || e.code === 'ShiftLeft') onlineDash(); return; }
    }
    if (screen === 'lobby' && lobbyPad !== null) {
      var dg = /^(?:Digit|Numpad)([0-9])$/.exec(e.code); if (dg) { padKey(dg[1]); return; }
      if (e.code === 'Backspace') { padKey('⌫'); return; } if (e.code === 'Escape') { lobbyPad = null; return; }
      if (e.code === 'Enter' && lobbyPad.length === 4) { padKey('✓'); return; }
    }
    if (screen === 'upgrade') { var m = /^Digit([1-3])$/.exec(e.code) || /^Numpad([1-3])$/.exec(e.code); if (m) { pickCard(+m[1] - 1); return; } }
    if (e.code === 'Tab' || e.code === 'ArrowDown' || e.code === 'ArrowRight') { UI.nav(e.shiftKey && e.code === 'Tab' ? -1 : 1); return; }
    if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') { UI.nav(-1); return; }
    if (e.code === 'Enter' || e.code === 'Space') { if (UI.enter()) return; }
    if (screen === 'pause' && (e.code === 'Escape' || e.code === 'KeyP')) go('play');
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  cv.addEventListener('pointerdown', function (e) {
    audio(); try { cv.focus({ preventScroll: true }); } catch (er) { /* old browsers */ }
    var p = pos(e); touchMode = e.pointerType === 'touch' ? true : e.pointerType === 'mouse' ? false : touchMode;
    mouse.x = p.x; mouse.y = p.y; UI.kb = false;
    var it = UI.hit(p.x, p.y); if (it) { UI.fire(it); e.preventDefault(); return; }
    if (screen === 'boot') { engage(); return; }
    if ((screen === 'play' && G && G.p.alive) || (screen === 'online' && OG && OG.L.alive && !OG.menu && !OG.end)) {
      if (e.pointerType === 'touch') {
        if (hyp(p.x - fireBtn.x, p.y - fireBtn.y) < fireBtn.r * 1.25) { fireTouch = e.pointerId; fireBtn.p = 1; return; }
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
  function release(e) { if (fireTouch === e.pointerId) fireTouch = null; if (e.pointerType !== 'touch' && e.button === 0) mouse.down = false; ['move', 'aim'].forEach(function (k) { if (sticks[k] && sticks[k].id === e.pointerId) sticks[k] = null; }); }
  cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release);
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('blur', function () { keys = {}; mouse.down = false; fireTouch = null; sticks.move = sticks.aim = null; if (screen === 'play') go('pause'); });
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
    if (FOC) { var px = x - FOC.x, py = y - FOC.y, pd = Math.sqrt(px * px + py * py) + 0.01; if (pd < 260) { var pf = -9 * Math.exp(-pd * pd / 9000); DX += px / pd * pf; DY += py / pd * pf; } }
  }

  /* ================================================================ game */
  var AW = 2400, AH = 1500, LAST = 60;
  // Expected single-target damage per second of a player at the start of each wave (random card picks), from
  // tools/art/neon/balance.py. It drives enemy HP and boss HP so the 60-wave run stays hard but winnable in ~2 hours.
  var DREF = [7.0, 7.6, 8.3, 9.0, 9.7, 10.4, 11.1, 11.9, 12.8, 13.7, 14.6, 15.5, 16.6, 17.7, 18.8, 20.0, 21.2, 22.4, 23.6, 24.8, 26.3, 27.8, 29.4, 31.1, 33.2, 35.0, 37.0, 38.9, 41.1, 43.4,
    45.8, 48.2, 50.7, 53.5, 56.4, 59.4, 62.1, 65.4, 69.0, 72.5, 76.2, 80.2, 84.0, 87.6, 91.2, 95.2, 98.9, 102.8, 107.1, 111.5, 115.6, 119.2, 122.7, 125.9, 129.0, 131.8, 134.2, 136.2, 138.2, 139.1];
  function dref(n) { return DREF[clamp(n, 1, LAST) - 1]; }
  function hpMul(n) { return dref(n) / DREF[0] * 0.7 + 0.3; }     // enemies grow slower than the player: power feels earned
  function dmgMul(n) { return (1 + 0.012 * (n - 1)) * Math.min(1, 0.6 + 0.08 * (n - 1)); } // …but they hit harder every wave (gentle first waves)
  var BOSS_ACC = 0.42; // share of the reference DPS that really lands on a moving boss with adds around (measured with a bot)
  function bossTime(n) { return n >= LAST ? 330 : 80 + 1.6 * n; }  // target fight length (s) at 60% accuracy
  function spawnTime(n) { return 35 + 2.1 * n; }                   // target length (s) of a normal wave
  function quota(n) { return Math.round(10 + 1.4 * n); }            // a normal wave has a fixed number of hostiles (11 at wave 1, 93 at wave 59)
  function aliveCap(n) { return Math.min(30, Math.round(5 + 0.45 * n)); } // most hostiles on the field at once: 5 at wave 1, 30 from wave 56
  function hostiles() { // what the HUD counts: still to come + alive (a splitter counts its 3 shards, so the number only goes down)
    var c = G.spawnLeft; G.en.forEach(function (e) { if (!e.dead && e.type !== 'node') c += e.type === 'splitter' ? 4 : 1; }); return c;
  }
  var ET = {
    swarmer: { r: 12, hp: 1, spd: 255, col: C.mag, score: 100, dmg: 12, sides: 3, from: 1, w: 5 },
    sniper: { r: 17, hp: 3, spd: 150, col: C.amb, score: 250, dmg: 10, sides: 6, from: 3, w: 2.2 },
    splitter: { r: 32, hp: 8, spd: 80, col: C.lime, score: 400, dmg: 18, sides: 8, from: 2, w: 1.3 },
    shard: { r: 16, hp: 2, spd: 185, col: C.lime, score: 120, dmg: 10, sides: 8 },
    dasher: { r: 15, hp: 4, spd: 130, col: C.red, score: 300, dmg: 16, sides: 4, from: 4, w: 1.8 },
    spinner: { r: 20, hp: 6, spd: 90, col: '#4d9dff', score: 350, dmg: 12, sides: 4, from: 7, w: 1.3 },
    bomber: { r: 18, hp: 5, spd: 110, col: '#ff6b3d', score: 350, dmg: 12, sides: 0, from: 10, w: 1.2 },
    shielder: { r: 20, hp: 7, spd: 125, col: '#7fd4ff', score: 450, dmg: 14, sides: 5, from: 13, w: 1.1 },
    medic: { r: 16, hp: 5, spd: 140, col: '#b6ff3d', score: 500, dmg: 8, sides: 0, from: 16, w: 0.7 },
    phantom: { r: 15, hp: 4, spd: 170, col: '#d78bff', score: 450, dmg: 14, sides: 5, from: 20, w: 1.1 },
    hive: { r: 34, hp: 20, spd: 55, col: '#ff4fa0', score: 900, dmg: 20, sides: 0, from: 24, w: 0.55 },
    node: { r: 18, hp: 1, spd: 0, col: '#e8f0ff', score: 200, dmg: 10, sides: 4 },
    boss: { r: 72, hp: 1, spd: 70, col: C.vio, score: 5000, dmg: 25, sides: 12 }
  };
  var BOSSES = { 5: ['overmind', 1], 10: ['warden', 1], 15: ['queen', 1], 20: ['lancer', 1], 25: ['prism', 1], 30: ['hydra', 1],
    35: ['overmind', 2], 40: ['warden', 2], 45: ['queen', 2], 50: ['lancer', 2], 55: ['prism', 2], 60: ['null', 1] };
  var BCOL = { overmind: C.vio, warden: '#4d9dff', queen: '#ff4fa0', lancer: C.red, prism: '#e8f0ff', hydra: C.mag, 'null': '#ffffff' };
  var BSIDES = { overmind: 12, warden: 8, queen: 6, lancer: 3, prism: 4, hydra: 7, 'null': 16 };
  var UPG = {
    multi: { max: 6, w: 2, ap: function (s) { s.shots++; } },
    pierce: { max: 4, w: 1.4, ap: function (s) { s.pierce++; } },
    dash: { max: 4, w: 1.2, ap: function (s) { s.dashCd *= 0.85; s.shred += 2; } },
    rapid: { max: 6, w: 2, ap: function (s) { s.rate *= 1.10; } },
    boom: { max: 4, w: 1.2, ap: function (s) { s.boom++; } },
    heal: { max: 99, w: 1, ap: function (s, p) { p.max += 20; p.hp = p.max; p.critical = false; } },
    rail: { max: 6, w: 2, ap: function (s) { s.dmg *= 1.15; s.bspd *= 1.05; } },
    drone: { max: 3, w: 1.3, ap: function (s) { s.drones++; } },
    regen: { max: 4, w: 1.1, ap: function (s) { s.regen += 0.5; } },
    crit: { max: 5, w: 1.5, ap: function (s) { s.crit += 0.06; } },
    ricochet: { max: 3, w: 1.2, ap: function (s) { s.bounce++; } },
    shield: { max: 3, w: 1.1, ap: function (s) { s.shield++; s.shieldCd = 0; } },
    servo: { max: 3, w: 1, ap: function (s) { s.speed *= 1.08; s.dashCd *= 0.93; } }
  };
  var SHIELD_CD = [0, 12, 9, 6];
  var G = null, cam = { x: AW / 2, y: AH / 2 }, best = +Store.get('best', 0) || 0, speedX = 1;
  function freshStats() { return { shots: 1, pierce: 0, dashCd: 1.15, shred: 0, rate: 7, boom: 0, dmg: 1, bspd: 980, drones: 0, regen: 0, crit: 0, bounce: 0, shield: 0, shieldCd: 0, speed: 1 }; }
  function checkpoint() { var c = Store.get('cp', null); return c && c.wave >= 1 && c.wave < LAST ? c : null; }
  function newGame(cp) {
    G = { t: 0, time: 0, phase: 'intro', pt: 0, wave: 0, score: 0, kills: 0, combo: 0, comboT: 0, mult: 1, streak: 0, streakT: -9, tier: 0, lastVO: -99, lastDouble: -99, banner: null,
      p: { x: AW / 2, y: AH / 2, vx: 0, vy: 0, r: 14, hp: 100, max: 100, inv: 1, dashT: 0, cd: 0, fire: 0, aim: 0, trail: [], ghosts: [], hurtT: 0, critical: false, alive: true, dashN: 0, kick: 0, droneA: 0, droneCd: [0, 0.17, 0.34] },
      st: freshStats(), lv: {}, shieldUp: false,
      bullets: [], eb: [], en: [], pick: [], mines: [], beams: [], spawnLeft: 0, spawnT: 0, slow: 1, deadT: 0, cards: null, newBest: false };
    if (cp) { G.wave = cp.wave; G.st = cp.st; G.lv = cp.lv; G.p.max = cp.max; G.p.hp = cp.max; G.score = cp.score; G.kills = cp.kills; G.time = cp.time || 0; G.fromCp = cp.wave; G.shieldUp = G.st.shield > 0; }
    else Store.del('cp');
    cam.x = G.p.x; cam.y = G.p.y; parts.length = 0; waves.length = 0; floats.length = 0;
    startWave();
  }
  function startWave() {
    var n = ++G.wave, B = BOSSES[n]; G.phase = 'intro'; G.pt = 0; G.boss = !!B; G.spawnLeft = B ? 0 : quota(n); G.spawnT = 0.5; G.bossUp = false; G.escortT = 7;
    G.banner = { s: B ? '⚠ ' + T.bn[B[0]] + (B[1] > 1 ? ' MK II' : '') + ' ⚠' : T.wave + ' ' + n + ' / ' + LAST, col: B ? C.red : C.cyan, t: 0 };
    if (B) { Voice.say('boss', { pr: 4, ttl: 6 }); SFX.alarm(); } else Voice.say(n === 1 || n === G.fromCp + 1 ? 'start' : 'wave', { pr: 2, ttl: 4 });
    SFX.wave(); shock(G.p.x, G.p.y, 0.8, 900, 1.2);
  }
  function spawnPoint(minD) {
    for (var i = 0; i < 14; i++) { var x = rnd(80, AW - 80), y = rnd(80, AH - 80); if (hyp(x - G.p.x, y - G.p.y) > (minD || 460)) return { x: x, y: y }; }
    return { x: G.p.x > AW / 2 ? 120 : AW - 120, y: rnd(120, AH - 120) };
  }
  function pickType(n) {
    var ks = Object.keys(ET).filter(function (k) { return ET[k].from && ET[k].from <= n; }), tot = 0;
    ks.forEach(function (k) { tot += ET[k].w; }); var r = Math.random() * tot;
    for (var i = 0; i < ks.length; i++) { r -= ET[ks[i]].w; if (r <= 0) return ks[i]; }
    return 'swarmer';
  }
  function makeEnemy(type, x, y, warp, o) {
    o = o || {}; var d = ET[type], n = G.wave, elite = !!o.elite;
    var e = { type: type, x: x, y: y, vx: 0, vy: 0, r: d.r * (elite ? 1.25 : 1), hp: o.hp || d.hp * hpMul(n) * (elite ? 3 : 1), spd: d.spd * (elite ? 1.12 : 1) + (type === 'swarmer' ? Math.min(90, n * 2) : 0),
      col: d.col, sides: d.sides, dmg: d.dmg * dmgMul(n), score: d.score * (elite ? 3 : 1), elite: elite,
      rot: rnd(0, TAU), rs: type === 'splitter' || type === 'shard' ? rnd(0.8, 1.6) * (Math.random() < 0.5 ? -1 : 1) : type === 'boss' ? 0.35 : 0.6, flash: 0, warp: warp ? 0.75 : 0, seed: rnd(0, 100),
      state: 'move', cd: rnd(1.4, 2.6), tel: 0, aim: 0, strafe: Math.random() < 0.5 ? 1 : -1, sT: rnd(1.5, 3), a1: 2, a2: 4, a3: 6, a4: 3, dashId: -1, ghost: 0, kids: 0, spin: rnd(0, TAU) };
    e.max = e.hp; G.en.push(e); return e;
  }
  function spawnStep(dt) { // releases the wave's fixed quota a few at a time, never more than aliveCap(n) on the field
    G.spawnT -= dt; if (G.spawnT > 0 || G.spawnLeft <= 0) return;
    var n = G.wave, cap = aliveCap(n), alive = G.en.length;
    if (alive >= cap) { G.spawnT = 0.4; return; }
    var t = pickType(n), sp = spawnPoint(), eliteP = n >= 22 ? Math.min(0.2, 0.04 + 0.004 * (n - 22)) : 0;
    var count = t === 'swarmer' ? Math.min(5, 2 + Math.floor(n / 12)) : (n > 30 && Math.random() < 0.3 ? 2 : 1);
    if (t === 'splitter' && alive + 4 > cap) { G.spawnT = 0.4; return; } // room for its shards
    count = Math.max(1, Math.min(count, G.spawnLeft, cap - alive));
    for (var i = 0; i < count; i++) makeEnemy(t, sp.x + (i ? rnd(-60, 60) : 0), sp.y + (i ? rnd(-60, 60) : 0), true, { elite: t !== 'swarmer' && Math.random() < eliteP });
    G.spawnLeft -= count;
    G.spawnT = spawnTime(n) * 0.8 / quota(n) * count * rnd(0.7, 1.3);
  }
  function makeBoss(kind, mk, x, y, hp, col) {
    var e = makeEnemy('boss', x, y, true, { hp: hp }); e.kind = kind; e.mk = mk; e.col = col || BCOL[kind]; e.sides = BSIDES[kind];
    e.r = kind === 'null' ? 92 : kind === 'lancer' ? 56 : kind === 'hydra' ? 58 : 72; e.bphase = 1; e.shieldT = 0; e.bt = 'off'; e.btT = 2; e.beamA = rnd(0, TAU);
    e.a1 = 2; e.a2 = 3; e.a3 = 5; e.a4 = 4; e.score = ET.boss.score * (1 + G.wave / 10); return e;
  }
  function spawnBoss() {
    var n = G.wave, B = BOSSES[n], hp = dref(n) * BOSS_ACC * bossTime(n) * (0.65 + 0.35 * Math.min(1, n / 25)), /* early bosses are gentler */ x = G.p.x < AW / 2 ? AW - 340 : 340, y = AH / 2;
    if (B[0] === 'hydra') { var a = makeBoss('hydra', 1, x, y - 220, hp * 0.5, C.mag), b = makeBoss('hydra', 1, x, y + 220, hp * 0.5, '#4d9dff'); a.twin = b; b.twin = a; b.strafe = -1; }
    else { var e = makeBoss(B[0], B[1], x, y, B[0] === 'prism' ? hp * 0.32 : hp); /* the Prism is only open between node cycles */ if (B[0] === 'prism') prismNodes(e); }
    G.bossUp = true;
  }
  function prismNodes(e) { // the Prism is shielded while its nodes live
    e.shielded = true; var n = G.wave;
    for (var i = 0; i < 4; i++) { var nd = makeEnemy('node', e.x, e.y, true, { hp: dref(n) * BOSS_ACC * (e.mk > 1 ? 1.8 : 1.5) }); /* ~1.5 s of fire each */ nd.owner = e; nd.slot = i; }
  }
  function tryDash() {
    if (screen === 'online') { onlineDash(); return; }
    if (!G || screen !== 'play') return; var p = G.p; if (!p.alive || p.cd > 0) return;
    var ix = inX, iy = inY, d = hyp(ix, iy); if (d < 0.2) { ix = Math.cos(p.aim); iy = Math.sin(p.aim); d = 1; }
    ix /= d; iy /= d; var v = 1180 * G.st.speed; p.vx = ix * v; p.vy = iy * v; p.dashT = 0.16; p.inv = Math.max(p.inv, 0.32); p.cd = G.st.dashCd; p.dashN++;
    SFX.dash(); shake(0.14); burst(p.x, p.y, Math.atan2(-iy, -ix), 1.2, 18, 420, C.cyan); shock(p.x, p.y, 0.35, 600, 0.5);
  }
  var inX = 0, inY = 0;
  function readInput() {
    inX = ((keys.KeyD || keys.ArrowRight) ? 1 : 0) - ((keys.KeyA || keys.ArrowLeft) ? 1 : 0);
    inY = ((keys.KeyS || keys.ArrowDown) ? 1 : 0) - ((keys.KeyW || keys.ArrowUp) ? 1 : 0);
    var mv = stickVec(sticks.move, 60 * U); if (mv && mv.m > 0.12) { inX = mv.x; inY = mv.y; }
    var d = hyp(inX, inY); if (d > 1) { inX /= d; inY /= d; }
  }
  function targetable(e) { return !e.dead && e.warp <= 0 && !(e.ghost > 0.5); }
  function nearestEnemy(x, y, range, skip) {
    var best = null, bd = range;
    G.en.forEach(function (e) { if (!targetable(e) || (skip && skip.indexOf(e) >= 0)) return; var d = hyp(e.x - x, e.y - y) - e.r; if (d < bd) { bd = d; best = e; } });
    return best;
  }
  function fireBullet(x, y, a, st, o) {
    o = o || {}; var spd = st.bspd * (o.spd || 1);
    G.bullets.push({ x: x, y: y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 0.9, pierce: o.drone ? 0 : st.pierce, bounce: o.drone ? 0 : st.bounce, hits: [], dmg: st.dmg * (o.mul || 1), drone: !!o.drone });
  }
  function updatePlayer(dt) {
    var p = G.p, st = G.st; readInput();
    var ACC = 3300 * st.speed, K = 9.6;
    if (p.dashT > 0) { p.dashT -= dt; if (Math.random() < 0.9) p.ghosts.push({ x: p.x, y: p.y, a: p.aim, t: 0 }); }
    else { p.vx += inX * ACC * dt; p.vy += inY * ACC * dt; var k = Math.exp(-K * dt); p.vx *= k; p.vy *= k; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < p.r) { p.x = p.r; p.vx = Math.abs(p.vx) * 0.3; } if (p.x > AW - p.r) { p.x = AW - p.r; p.vx = -Math.abs(p.vx) * 0.3; }
    if (p.y < p.r) { p.y = p.r; p.vy = Math.abs(p.vy) * 0.3; } if (p.y > AH - p.r) { p.y = AH - p.r; p.vy = -Math.abs(p.vy) * 0.3; }
    p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 16) p.trail.shift();
    for (var i = p.ghosts.length - 1; i >= 0; i--) { p.ghosts[i].t += dt; if (p.ghosts[i].t > 0.3) p.ghosts.splice(i, 1); }
    p.inv -= dt; p.hurtT -= dt; p.cd = Math.max(0, p.cd - dt); p.kick = Math.max(0, p.kick - dt * 6);
    if (st.regen && p.hp < p.max) { p.hp = Math.min(p.max, p.hp + st.regen * dt); if (p.critical && p.hp >= p.max * 0.5) p.critical = false; }
    if (st.shield && !G.shieldUp) { st.shieldCd -= dt; if (st.shieldCd <= 0) { G.shieldUp = true; ring(p.x, p.y, 8, 34, '#7fd4ff', 0.35); } }
    // aim + fire
    var firing = false;
    var am = stickVec(sticks.aim, 60 * U);
    if (am && am.m > 0.2) { p.aim = Math.atan2(am.y, am.x); firing = am.m > 0.35; }
    else if (touchMode) { if (hyp(inX, inY) > 0.2) p.aim = Math.atan2(inY, inX); firing = fireTouch !== null; } // FIRE button shoots where you move
    else { var mw = toWorld(mouse.x, mouse.y); p.aim = Math.atan2(mw.y - p.y, mw.x - p.x); firing = mouse.down || !!keys.KeyJ; }
    p.fire -= dt;
    if (firing && p.fire <= 0 && G.phase !== 'clear' && G.phase !== 'won') {
      p.fire = 1 / st.rate; var n = st.shots, spread = n > 1 ? Math.min(0.13, 0.5 / n) : 0;
      for (var s = 0; s < n; s++) { var a = p.aim + (s - (n - 1) / 2) * spread + rnd(-0.025, 0.025); fireBullet(p.x + Math.cos(a) * 18, p.y + Math.sin(a) * 18, a, st); }
      p.vx -= Math.cos(p.aim) * 38; p.vy -= Math.sin(p.aim) * 38; p.kick = 1;
      burst(p.x + Math.cos(p.aim) * 20, p.y + Math.sin(p.aim) * 20, p.aim, 0.7, 3, 360, C.cyan, 1.5);
      shake(0.035); SFX.pew();
    }
    // orbit drones: each fires at the nearest enemy twice a second
    p.droneA += dt * 2.2;
    for (var dI = 0; dI < st.drones; dI++) {
      p.droneCd[dI] -= dt; if (p.droneCd[dI] > 0) continue;
      var da = p.droneA + dI * TAU / st.drones, dx0 = p.x + Math.cos(da) * 46, dy0 = p.y + Math.sin(da) * 46, tg = nearestEnemy(dx0, dy0, 450);
      if (tg) { fireBullet(dx0, dy0, Math.atan2(tg.y - dy0, tg.x - dx0), st, { drone: true, mul: 0.5 }); p.droneCd[dI] = 0.5; } else p.droneCd[dI] = 0.15;
    }
    // dash shred
    if (p.dashT > 0 && st.shred > 0) G.en.forEach(function (e) { if (targetable(e) && e.dashId !== p.dashN && hyp(e.x - p.x, e.y - p.y) < e.r + p.r + 6) { e.dashId = p.dashN; damage(e, st.shred * st.dmg, Math.atan2(e.y - p.y, e.x - p.x)); } });
  }
  function hurtPlayer(dmg, fx, fy) {
    var p = G.p; if (p.inv > 0 || !p.alive || p.dashT > 0) return false;
    if (G.shieldUp) { // Aegis shield eats the hit
      G.shieldUp = false; G.st.shieldCd = SHIELD_CD[Math.min(3, G.st.shield)]; p.inv = 0.5;
      ring(p.x, p.y, 20, 70, '#7fd4ff', 0.4); burst(p.x, p.y, 0, TAU, 16, 320, '#7fd4ff'); SFX.impact(); shake(0.2); return false;
    }
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
    Voice.q.length = 0; Voice.say('dead', { pr: 5, ttl: 8 });
    if (G.newBest) Voice.say('record', { pr: 4, ttl: 10 });
  }
  function damage(e, dmg, dir) {
    if (e.dead) return;
    if (e.shielded) { e.flash = 0.03; return; }
    e.hp -= dmg; e.flash = 0.07;
    var kb = e.type === 'boss' ? 12 : e.type === 'node' ? 0 : 150 / (e.r / 12); e.vx += Math.cos(dir) * kb; e.vy += Math.sin(dir) * kb;
    if (e.type === 'boss' && e.kind === 'null') nullPhase(e);
    if (e.hp <= 0) kill(e, dir); else SFX.hit();
  }
  function nullPhase(e) {
    var ph = e.hp > e.max * 0.66 ? 1 : e.hp > e.max * 0.33 ? 2 : 3;
    if (ph > e.bphase) {
      e.bphase = ph; G.eb.length = 0; G.p.inv = Math.max(G.p.inv, 1); flash('#ffffff', 0.45); stop(0.06); SFX.alarm();
      G.banner = { s: 'PHASE ' + ph, col: ph === 3 ? C.red : C.amb, t: 0 }; for (var i = 0; i < 3; i++) shock(e.x, e.y, 1.6, 500 + i * 300, 1.3);
      if (ph === 3) Voice.say('critical', { pr: 3, ttl: 3 });
    }
  }
  function kill(e, dir, quiet) {
    e.dead = true;
    var big = e.type === 'splitter' || e.type === 'boss' || e.type === 'hive' || e.elite;
    burst(e.x, e.y, dir, big ? TAU : 2.4, big ? 46 : 16, big ? 560 : 400, e.col);
    shards(e.x, e.y, e.r, e.sides || 8, e.col, big ? 420 : 300);
    ring(e.x, e.y, e.r, e.r * (big ? 5 : 3), e.col, big ? 0.55 : 0.35);
    shock(e.x, e.y, big ? 1.3 : 0.55, big ? 820 : 620, big ? 1 : 0.7);
    if (quiet) return;
    G.kills++; shake(big ? 0.45 : 0.12);
    if (big) { stop(0.04); SFX.boom(e.type === 'boss' ? 1.2 : 0.7); } else SFX.pop();
    // combo + score
    G.combo++; G.comboT = 2.2; G.mult = 1 + Math.min(4, Math.floor(G.combo / 6) * 0.5);
    var pts = Math.round(e.score * G.mult * (1 + (G.wave - 1) * 0.05)); G.score += pts;
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
    if (e.type === 'node' && e.owner && !G.en.some(function (o) { return o.type === 'node' && o.owner === e.owner && !o.dead; })) { // last node: the Prism drops its shield
      e.owner.shielded = false; e.owner.shieldT = e.owner.mk > 1 ? 8 : 9; ring(e.owner.x, e.owner.y, e.owner.r, e.owner.r * 3, '#e8f0ff', 0.5); SFX.impact();
    }
    if (e.type === 'boss') {
      G.slow = 0.3; G.slowT = 0.7; flash('#ffffff', 0.5);
      if (e.twin && !e.twin.dead) { e.twin.enraged = true; e.twin.col = C.red; G.banner = { s: T.bn.hydra + ' ⚡', col: C.red, t: 0, small: true }; }
      else Voice.say('bossdown', { pr: 4, ttl: 5 });
      for (var j = 0; j < 3; j++) { shock(e.x, e.y, 1.8 - j * 0.4, 500 + j * 350, 1.5); ring(e.x, e.y, 20, 300 + j * 160, j === 1 ? C.mag : e.col, 0.9 + j * 0.2); dropHeal(e.x + rnd(-60, 60), e.y + rnd(-60, 60)); }
      G.eb.length = 0; G.beams.length = 0;
    }
    var p = G.p, ch = e.elite ? 0.5 : e.type === 'splitter' || e.type === 'hive' ? 0.22 : e.type === 'swarmer' || e.type === 'shard' ? 0.03 : 0.07;
    if (p.hp < p.max && Math.random() < ch) dropHeal(e.x, e.y);
  }
  function dropHeal(x, y) { G.pick.push({ x: x, y: y, t: 0 }); }
  function explodeAt(x, y, r, dmg, skip) {
    ring(x, y, 6, r, C.amb, 0.3); burst(x, y, 0, TAU, 10, 300, C.amb); shock(x, y, 0.35, 500, 0.45); SFX.impact();
    G.en.forEach(function (e) { if (e !== skip && targetable(e) && hyp(e.x - x, e.y - y) < r + e.r) damage(e, dmg, Math.atan2(e.y - y, e.x - x)); });
  }
  /* ---------------- enemy weapons */
  function shoot(x, y, a, spd, r, dmg, col, o) { var q = { x: x, y: y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: r, dmg: dmg * dmgMul(G.wave), col: col, life: 5 }; if (o) for (var k in o) q[k] = o[k]; G.eb.push(q); return q; }
  function ringShot(e, n, spd, dmg, col, off) { for (var i = 0; i < n; i++) shoot(e.x, e.y, (off || 0) + i / n * TAU, spd, 7, dmg, col); SFX.ring(); ring(e.x, e.y, e.r, e.r * 1.8, col, 0.3); }
  function fan(e, a, n, spread, spd, dmg, col) { for (var i = 0; i < n; i++) shoot(e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r, a + (n > 1 ? (i / (n - 1) - 0.5) * spread : 0), spd, 6, dmg, col); }
  function mine(x, y, fuse) { G.mines.push({ x: x, y: y, t: 0, fuse: fuse || 1.8, r: 80, dmg: 18 * dmgMul(G.wave) }); }
  function beam(e, a, len, tele, on, w) { G.beams.push({ e: e, a: a, len: len, t: 0, tele: tele, on: on, w: w || 14, dmg: 22 * dmgMul(G.wave) }); }
  function bossAI(e, dt, p, ux, uy, d) { // returns [tx, ty, steer]
    var f = (e.mk > 1 ? 1.35 : 1) * (e.enraged ? 1.6 : 1), aimA = Math.atan2(p.y - e.y, p.x - e.x), k = e.kind, ph = e.bphase;
    var orbit = function (r, s) { var oa = G.t * (s || 0.3) * e.strafe, gx = p.x + Math.cos(oa) * r - e.x, gy = p.y + Math.sin(oa) * r * 0.75 - e.y, gd = hyp(gx, gy) + 0.01, v = e.spd * (e.enraged ? 1.4 : 1) * Math.min(1, gd / 120); return [gx / gd * v, gy / gd * v, 1.2]; };
    if (k === 'null') k = ph === 1 ? 'overmind' : ph === 2 ? 'queen' : 'prism';
    var mv = orbit(k === 'queen' ? 430 : 340);
    if (k === 'overmind' || e.kind === 'null') {
      e.a1 -= dt * f; if (e.a1 <= 0) { var rage = e.hp < e.max * 0.5 || e.kind === 'null'; e.a1 = rage ? 1.8 : 2.6; ringShot(e, (rage ? 20 : 14) + (e.mk > 1 ? 6 : 0), 250, 14, e.kind === 'null' ? C.vio : e.col, rnd(0, TAU)); }
      if (e.hp < e.max * (e.mk > 1 ? 0.7 : 0.5) || (e.kind === 'null' && ph === 3)) { e.a2 -= dt; if (e.a2 <= 0) { e.a2 = 0.11 / f; e.spin += 0.32; for (var arm = 0; arm < 3; arm++) shoot(e.x, e.y, e.spin + arm * TAU / 3, 300, 6, 12, C.mag); } }
      if (e.kind !== 'null') { e.a3 -= dt; if (e.a3 <= 0) { e.a3 = (e.mk > 1 ? 7 : 10) / f; for (var m = 0; m < (e.mk > 1 ? 4 : 3) && G.en.length < 30; m++) { var ma = rnd(0, TAU); makeEnemy('swarmer', e.x + Math.cos(ma) * 110, e.y + Math.sin(ma) * 110, true); } } }
    }
    if (k === 'warden' || (e.kind === 'null' && ph !== 2)) { // rotating laser beams: thin telegraph, then lethal
      e.btT -= dt;
      if (e.btT <= 0) { if (e.bt === 'off') { e.bt = 'tele'; e.btT = 1.2; } else if (e.bt === 'tele') { e.bt = 'on'; e.btT = 3.2; } else { e.bt = 'off'; e.btT = 2.2 / f; } }
      e.beamA += dt * (e.mk > 1 || e.kind === 'null' ? 0.6 : 0.45) * (ph === 3 ? 1.3 : 1);
      e.beamN = e.kind === 'null' ? (ph === 3 ? 3 : 2) : e.mk > 1 ? 3 : 2;
      if (k === 'warden') { mv = orbit(300, 0.18); e.a4 -= dt * f; if (e.a4 <= 0) { e.a4 = 1.7; fan(e, aimA, 3, 0.3, 420, 12, e.col); } }
    }
    if (k === 'queen') { // brood + homing missiles you can shoot down
      e.a1 -= dt * f; if (e.a1 <= 0) { e.a1 = 5; for (var q = 0; q < 3 && G.en.length < 30; q++) { var qa = rnd(0, TAU); makeEnemy('swarmer', e.x + Math.cos(qa) * 120, e.y + Math.sin(qa) * 120, true); } if (e.mk > 1 || e.kind === 'null') makeEnemy('dasher', e.x, e.y + 130, true); }
      e.a2 -= dt * f; if (e.a2 <= 0) { e.a2 = 2.8; for (var mI = 0; mI < (e.mk > 1 ? 3 : 2); mI++) shoot(e.x, e.y, aimA + (mI - 0.5) * 1.2, 330, 9, 16, '#ff4fa0', { homing: 2.2, shootable: 1, life: 4.5, missile: true }); SFX.snipe(); }
    }
    if (k === 'lancer' || (e.kind === 'null' && ph === 2)) { // telegraphed charges that leave mines
      if (e.state === 'move') {
        if (k === 'lancer') { e.a4 -= dt * f; if (e.a4 <= 0) { e.a4 = 1.8; fan(e, aimA, 7, 1.1, 360, 12, e.col); } }
        e.a3 -= dt * f; if (e.a3 <= 0 && d < 1100) { e.state = 'tele'; e.tel = 0.9; e.aim = aimA; e.charges = e.mk > 1 || e.kind === 'null' ? 2 : 1; SFX.charge(); }
      } else if (e.state === 'tele') {
        e.tel -= dt; if (e.tel > 0.3) e.aim = angLerp(e.aim, aimA, damp(5, dt)); mv = [0, 0, 6];
        if (e.tel <= 0) { e.state = 'charge'; e.tel = 1.1; e.vx = Math.cos(e.aim) * 1500; e.vy = Math.sin(e.aim) * 1500; e.mineT = 0; SFX.dash(); shake(0.2); }
      } else if (e.state === 'charge') {
        e.tel -= dt; e.mineT -= dt; if (e.mineT <= 0) { e.mineT = 0.13; mine(e.x, e.y, 1.4); }
        if (e.tel <= 0 || e.x <= e.r + 2 || e.x >= AW - e.r - 2 || e.y <= e.r + 2 || e.y >= AH - e.r - 2) {
          if (--e.charges > 0) { e.state = 'tele'; e.tel = 0.6; e.aim = aimA; } else { e.state = 'move'; e.a3 = 4; } shake(0.25); shock(e.x, e.y, 0.8, 600, 0.7);
        }
        return [e.vx, e.vy, 0];
      }
    }
    if (k === 'prism') { // bullet walls with one gap; vulnerable only while its shield is down
      mv = orbit(380, 0.15);
      if (!e.shielded && e.kind === 'prism') { e.shieldT -= dt; if (e.shieldT <= 0) prismNodes(e); }
      e.a2 -= dt * f; if (e.a2 <= 0) {
        e.a2 = e.kind === 'null' ? 1.9 : 2.4; var cnt = 24, gap = Math.floor(rnd(4, cnt - 7)), nx = -Math.sin(aimA), ny = Math.cos(aimA);
        for (var wI = 0; wI < cnt; wI++) { if (wI >= gap && wI < gap + 4) continue; var off2 = (wI - cnt / 2) * 34; shoot(e.x + nx * off2, e.y + ny * off2, aimA, 230, 7, 14, e.kind === 'null' ? C.red : '#e8f0ff'); }
        SFX.ring();
      }
      if (!e.shielded) { e.a1 -= dt; if (e.a1 <= 0) { e.a1 = 1.4; ringShot(e, 12, 260, 12, '#e8f0ff', rnd(0, TAU)); } }
    }
    if (k === 'hydra') {
      mv = orbit(360, 0.25);
      e.a1 -= dt * f; if (e.a1 <= 0) { e.a1 = 1.5; fan(e, aimA, 5, 0.55, 400, 13, e.col); }
      e.a3 -= dt * f; if (e.a3 <= 0) { e.a3 = 4; ringShot(e, 12, 230, 12, e.col, rnd(0, TAU)); }
    }
    if (e.kind === 'null' && ph >= 2) { e.a4 -= dt; if (e.a4 <= 0) { e.a4 = ph === 3 ? 2 : 3; ringShot(e, 18, 270, 13, C.amb, rnd(0, TAU)); } }
    return mv;
  }
  function updateEnemies(dt) {
    var p = G.p;
    for (var i = 0; i < G.en.length; i++) {
      var e = G.en[i]; if (e.dead) continue;
      e.rot += e.rs * dt; e.flash -= dt;
      if (e.warp > 0) { e.warp -= dt; if (e.warp <= 0) { burst(e.x, e.y, 0, TAU, 10, 260, e.col); ring(e.x, e.y, e.r * 3, e.r, e.col, 0.25); } continue; }
      var dx = p.x - e.x, dy = p.y - e.y, d = hyp(dx, dy) + 0.01, ux = dx / d, uy = dy / d, tx = 0, ty = 0, steer = 4, aimA = Math.atan2(dy, dx), t = e.type;
      if (!p.alive) { ux = -ux; uy = -uy; }
      if (t === 'swarmer' || t === 'shard') {
        var wob = Math.sin(G.t * 5 + e.seed) * 0.45; tx = (ux - uy * wob) * e.spd; ty = (uy + ux * wob) * e.spd; steer = t === 'shard' ? 3 : 4.5;
      } else if (t === 'splitter' || t === 'shielder') { tx = ux * e.spd; ty = uy * e.spd; steer = t === 'shielder' ? 2.5 : 1.5; e.aim = angLerp(e.aim, aimA, damp(2.2, dt)); }
      else if (t === 'sniper') {
        e.sT -= dt; if (e.sT < 0) { e.strafe = -e.strafe; e.sT = rnd(1.5, 3); }
        var want = d > 560 ? 1 : d < 380 ? -1 : 0;
        tx = (ux * want - uy * e.strafe * 0.7) * e.spd; ty = (uy * want + ux * e.strafe * 0.7) * e.spd;
        if (e.state === 'move') { e.cd -= dt; if (e.cd <= 0 && d < 900 && p.alive) { e.state = 'aim'; e.tel = 1; e.aim = aimA; SFX.charge(); } }
        else {
          tx *= 0.15; ty *= 0.15; e.tel -= dt;
          if (e.tel > 0.35) e.aim = angLerp(e.aim, aimA, damp(7, dt));
          if (e.tel <= 0) {
            e.state = 'move'; e.cd = rnd(2, 3) - Math.min(0.9, G.wave * 0.02);
            shoot(e.x + Math.cos(e.aim) * 20, e.y + Math.sin(e.aim) * 20, e.aim, 1150, 6, 20, C.amb, { life: 2, bolt: true });
            e.vx -= Math.cos(e.aim) * 200; e.vy -= Math.sin(e.aim) * 200; SFX.snipe(); burst(e.x, e.y, e.aim, 0.5, 8, 400, C.amb);
          }
        }
      } else if (t === 'dasher') { // closes in, telegraphs a line, then charges through it
        if (e.state === 'move') { var wd = d > 330 ? 1 : -0.3; tx = ux * e.spd * wd; ty = uy * e.spd * wd; e.cd -= dt; if (e.cd <= 0 && d < 520) { e.state = 'aim'; e.tel = 0.65; e.aim = aimA; } }
        else if (e.state === 'aim') { e.tel -= dt; if (e.tel > 0.25) e.aim = angLerp(e.aim, aimA, damp(8, dt)); steer = 8; if (e.tel <= 0) { e.state = 'charge'; e.tel = 0.45; e.vx = Math.cos(e.aim) * 950; e.vy = Math.sin(e.aim) * 950; } }
        else { e.tel -= dt; tx = e.vx; ty = e.vy; steer = 0; if (e.tel <= 0) { e.state = 'move'; e.cd = rnd(1.2, 2); } }
      } else if (t === 'spinner') { // keeps range, fires a rotating cross
        var wsp = d > 420 ? 1 : d < 300 ? -1 : 0; tx = (ux * wsp - uy * 0.5) * e.spd; ty = (uy * wsp + ux * 0.5) * e.spd;
        e.cd -= dt; if (e.cd <= 0) { e.cd = 1.6; e.spin += 0.38; for (var c4 = 0; c4 < 4; c4++) shoot(e.x, e.y, e.spin + c4 * TAU / 4, 230, 6, 10, e.col); }
      } else if (t === 'bomber') { // drifts around you and lays mines
        var oa = G.t * 0.5 + e.seed, gx = p.x + Math.cos(oa) * 260 - e.x, gy = p.y + Math.sin(oa) * 260 - e.y, gd = hyp(gx, gy) + 0.01; tx = gx / gd * e.spd; ty = gy / gd * e.spd; steer = 2;
        e.cd -= dt; if (e.cd <= 0) { e.cd = 2.6; mine(e.x, e.y); }
      } else if (t === 'medic') { // stays back and heals nearby enemies
        var wm = d < 460 ? -1 : d > 620 ? 0.6 : 0; tx = (ux * wm - uy * e.strafe * 0.4) * e.spd; ty = (uy * wm + ux * e.strafe * 0.4) * e.spd;
        e.cd -= dt; if (e.cd <= 0) { e.cd = 1.5; var healed = 0; G.en.forEach(function (o) { if (o !== e && !o.dead && o.type !== 'boss' && o.type !== 'node' && hyp(o.x - e.x, o.y - e.y) < 200 && o.hp < o.max) { o.hp = Math.min(o.max, o.hp + o.max * 0.12); healed++; } }); if (healed) ring(e.x, e.y, e.r, 200, e.col, 0.45); }
      } else if (t === 'phantom') { // fades out, blinks next to you, fires a burst
        e.cd -= dt;
        if (e.state === 'move') { tx = ux * e.spd * 0.6; ty = uy * e.spd * 0.6; if (e.cd <= 0) { e.state = 'out'; e.tel = 0.4; } }
        else if (e.state === 'out') { e.ghost = Math.min(1, e.ghost + dt * 2.5); e.tel -= dt; if (e.tel <= 0) { var ba = rnd(0, TAU), br = rnd(220, 300); e.x = clamp(p.x + Math.cos(ba) * br, e.r, AW - e.r); e.y = clamp(p.y + Math.sin(ba) * br, e.r, AH - e.r); e.vx = e.vy = 0; e.state = 'in'; e.tel = 0.45; } }
        else { e.ghost = Math.max(0, e.ghost - dt * 2.5); e.tel -= dt; if (e.tel <= 0) { e.state = 'move'; e.cd = rnd(2, 2.8); fan(e, aimA, 3, 0.25, 420, 11, e.col); } }
      } else if (t === 'hive') { // slow mother that keeps hatching swarmers
        tx = ux * e.spd; ty = uy * e.spd; steer = 1;
        e.cd -= dt; if (e.cd <= 0) { e.cd = 4; e.kids = G.en.filter(function (o) { return o.mother === e && !o.dead; }).length; if (e.kids < 6 && G.en.length < 30) for (var h = 0; h < 2; h++) { var kid = makeEnemy('swarmer', e.x + rnd(-30, 30), e.y + rnd(-30, 30), false); kid.mother = e; } ring(e.x, e.y, e.r, e.r * 2, e.col, 0.3); }
      } else if (t === 'node') { // Prism shield node: orbits its boss
        var ow = e.owner; if (!ow || ow.dead) { kill(e, 0, true); continue; }
        var na = G.t * 0.9 + e.slot * TAU / 4; e.x = ow.x + Math.cos(na) * 175; e.y = ow.y + Math.sin(na) * 175; e.vx = e.vy = 0;
        e.cd -= dt; if (e.cd <= 0) { e.cd = 2.2; shoot(e.x, e.y, aimA, 320, 6, 10, '#e8f0ff'); }
        continue;
      } else if (t === 'boss') { var mv = bossAI(e, dt, p, ux, uy, d); tx = mv[0]; ty = mv[1]; steer = mv[2]; }
      if (steer > 0) { e.vx += (tx - e.vx) * damp(steer, dt); e.vy += (ty - e.vy) * damp(steer, dt); }
      e.x = clamp(e.x + e.vx * dt, e.r, AW - e.r); e.y = clamp(e.y + e.vy * dt, e.r, AH - e.r);
      if (p.alive && d < e.r + p.r && !(e.ghost > 0.5)) { if (hurtPlayer(e.dmg, e.x, e.y)) { e.vx -= ux * 300; e.vy -= uy * 300; } }
    }
    // separation (bosses push, nodes and phantoms are ghostly)
    for (i = 0; i < G.en.length; i++) {
      var A = G.en[i]; if (A.dead || A.warp > 0 || A.type === 'node') continue;
      for (var j = i + 1; j < G.en.length; j++) {
        var B = G.en[j]; if (B.dead || B.warp > 0 || B.type === 'node') continue;
        var sx = B.x - A.x, sy = B.y - A.y, rr = A.r + B.r, sd2 = sx * sx + sy * sy;
        if (sd2 < rr * rr && sd2 > 0.01) { var sd = Math.sqrt(sd2), push = (rr - sd) * 0.5, ma2 = A.r * A.r, mb = B.r * B.r, wa = mb / (ma2 + mb), wb = 1 - wa; A.x -= sx / sd * push * wa; A.y -= sy / sd * push * wa; B.x += sx / sd * push * wb; B.y += sy / sd * push * wb; }
      }
    }
    G.en = G.en.filter(function (e) { return !e.dead; });
    // beams (from Warden / Null Core): spawned from the boss state
    G.beams.length = 0;
    G.en.forEach(function (e) { if (e.type === 'boss' && (e.bt === 'tele' || e.bt === 'on') && (e.kind === 'warden' || (e.kind === 'null' && e.bphase !== 2))) for (var b = 0; b < e.beamN; b++) G.beams.push({ e: e, a: e.beamA + b * TAU / e.beamN, on: e.bt === 'on' }); });
    if (p.alive) G.beams.forEach(function (bm) {
      if (!bm.on) return; var ex = bm.e.x, ey = bm.e.y, cx = Math.cos(bm.a), cy = Math.sin(bm.a), rx = p.x - ex, ry = p.y - ey, along = rx * cx + ry * cy;
      if (along > bm.e.r && along < 1300 && Math.abs(rx * cy - ry * cx) < 14 + p.r) hurtPlayer(22 * dmgMul(G.wave), p.x - cx * 10, p.y - cy * 10);
    });
    // mines
    for (i = G.mines.length - 1; i >= 0; i--) {
      var mn = G.mines[i]; mn.t += dt;
      if (mn.t >= mn.fuse) { G.mines.splice(i, 1); ring(mn.x, mn.y, 8, mn.r, '#ff6b3d', 0.35); burst(mn.x, mn.y, 0, TAU, 14, 340, '#ff6b3d'); shock(mn.x, mn.y, 0.5, 600, 0.5); SFX.impact(); if (p.alive && hyp(p.x - mn.x, p.y - mn.y) < mn.r + p.r) hurtPlayer(mn.dmg, mn.x, mn.y); }
    }
  }
  function bounceTo(b, from) { var tg = nearestEnemy(b.x, b.y, 300, b.hits); if (!tg) return false; var a = Math.atan2(tg.y - b.y, tg.x - b.x), s = hyp(b.vx, b.vy); b.vx = Math.cos(a) * s; b.vy = Math.sin(a) * s; b.life = Math.max(b.life, 0.5); b.bounce--; ring(from.x, from.y, 4, 22, C.cyan, 0.2); return true; }
  function shieldBlocks(e, b) { // a Shielder's front arc deflects shots
    if (e.type !== 'shielder') return false; var inA = Math.atan2(b.y - e.y, b.x - e.x), df = Math.abs(((inA - e.aim + Math.PI * 3) % TAU) - Math.PI);
    return df < 1.05;
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
      for (var m = G.eb.length - 1; m >= 0; m--) { var q = G.eb[m]; if (q.shootable && hyp(q.x - b.x, q.y - b.y) < q.r + 6) { G.eb.splice(m, 1); burst(q.x, q.y, 0, TAU, 10, 300, q.col); SFX.pop(); gone = true; break; } }
      for (var j = 0; j < G.en.length && !gone; j++) {
        var e = G.en[j]; if (!targetable(e) || b.hits.indexOf(e) >= 0) continue;
        var dx = e.x - b.x, dy = e.y - b.y, rr = e.r + 5;
        if (dx * dx + dy * dy < rr * rr) {
          var dir = Math.atan2(b.vy, b.vx); b.hits.push(e);
          if (e.shielded || shieldBlocks(e, b)) { burst(b.x, b.y, dir + Math.PI, 1.6, 6, 320, '#7fd4ff', 1.6); SFX.hit(); gone = true; break; }
          var crit = Math.random() < st.crit, dm = b.dmg * (crit ? 2.2 : 1);
          burst(b.x, b.y, dir + Math.PI, 1.3, crit ? 12 : 6, crit ? 420 : 300, crit ? C.amb : e.col, 1.6); shake(crit ? 0.05 : 0.025);
          if (crit) floatText(b.x, b.y - 10, '✦', C.amb, 16);
          damage(e, dm, dir);
          if (st.boom && !b.drone) explodeAt(b.x, b.y, 40 + st.boom * 22, b.dmg * 0.4, e);
          if (b.bounce > 0 && bounceTo(b, e)) continue;
          if (b.pierce-- <= 0) { gone = true; break; }
        }
      }
      if (gone) G.bullets.splice(i, 1);
    }
    var p = G.p;
    for (i = G.eb.length - 1; i >= 0; i--) {
      var eq = G.eb[i]; eq.life -= dt;
      if (eq.homing && p.alive) { var cur = Math.atan2(eq.vy, eq.vx), want = Math.atan2(p.y - eq.y, p.x - eq.x), na = angLerp(cur, want, Math.min(1, eq.homing * dt)), sp = hyp(eq.vx, eq.vy); eq.vx = Math.cos(na) * sp; eq.vy = Math.sin(na) * sp; }
      eq.x += eq.vx * dt; eq.y += eq.vy * dt;
      if (eq.life <= 0 || eq.x < -20 || eq.x > AW + 20 || eq.y < -20 || eq.y > AH + 20) { G.eb.splice(i, 1); continue; }
      if (p.alive && hyp(eq.x - p.x, eq.y - p.y) < eq.r + p.r - 2) {
        if (p.inv > 0 || p.dashT > 0) continue;
        hurtPlayer(eq.dmg, eq.x - eq.vx * 0.05, eq.y - eq.vy * 0.05); G.eb.splice(i, 1);
      }
    }
  }
  function updatePickups(dt) {
    var p = G.p;
    for (var i = G.pick.length - 1; i >= 0; i--) {
      var k = G.pick[i]; k.t += dt; var dx = p.x - k.x, dy = p.y - k.y, d = hyp(dx, dy) + 0.01, pull = G.phase === 'clear' ? 900 : d < 160 ? 500 : 0;
      if (pull) { k.x += dx / d * pull * dt; k.y += dy / d * pull * dt; }
      if (p.alive && d < p.r + 14) {
        var heal = Math.round(18 + p.max * 0.06);
        G.pick.splice(i, 1); p.hp = Math.min(p.max, p.hp + heal); SFX.pickup(); floatText(p.x, p.y - 24, '+' + heal, C.lime, 18); ring(p.x, p.y, 10, 60, C.lime, 0.3);
        if (p.critical && p.hp >= p.max * 0.5) { p.critical = false; Voice.say('repair', { pr: 2, ttl: 3 }); }
      } else if (k.t > 14) G.pick.splice(i, 1);
    }
  }
  function waveDone() {
    if (G.boss) return G.bossUp && !G.en.some(function (e) { return e.type === 'boss'; });
    return G.spawnLeft <= 0 && !G.en.length;
  }
  function update(dt) {
    if (screen !== 'play') return; // a phase change (cards, game over) ends this frame's sub-steps
    G.t += dt; var p = G.p; if (p.alive && G.phase !== 'won') G.time += dt;
    if (G.slowT > 0) { G.slowT -= dt / Math.max(0.05, G.slow); if (G.slowT <= 0) G.slow = 1; }
    if (G.banner) { G.banner.t += dt; if (G.banner.t > (G.banner.small ? 1.1 : 1.8)) G.banner = null; }
    G.comboT -= dt; if (G.comboT <= 0 && G.combo) { G.combo = 0; G.mult = 1; }
    if (p.alive) updatePlayer(dt);
    if (G.phase === 'intro') { G.pt += dt; if (G.pt > 1.3) G.phase = 'fight'; }
    else if (G.phase === 'fight') {
      if (G.boss) {
        if (!G.bossUp) spawnBoss();
        else { G.escortT -= dt; if (G.escortT <= 0) { G.escortT = Math.max(5, 11 - G.wave * 0.1); if (G.en.length < Math.min(18, aliveCap(G.wave))) { var et = pickType(G.wave), esp = spawnPoint(); makeEnemy(et === 'hive' ? 'swarmer' : et, esp.x, esp.y, true); } } }
      } else spawnStep(dt);
      if (waveDone()) {
        if (G.boss) G.en.slice().forEach(function (e) { kill(e, 0, true); }); // the boss falls: its army falls with it
        G.en.length = 0; G.eb.length = 0; G.mines.length = 0; G.beams.length = 0; G.pt = 0;
        if (G.wave >= LAST) { G.phase = 'won'; G.slow = 0.35; G.slowT = 1.2; Voice.q.length = 0; Voice.say('victory', { pr: 5, ttl: 10 }); G.banner = { s: T.conquered, col: C.amb, t: 0 }; Store.del('cp'); if (G.score > best) { best = G.score; Store.set('best', best); } Store.set('won', true); }
        else { G.phase = 'clear'; Voice.say('clear', { pr: 2, ttl: 4 }); SFX.chime(); G.banner = { s: T.wave + ' ' + G.wave + ' ' + T.cleared, col: C.lime, t: 0 }; }
      }
    } else if (G.phase === 'clear') { G.pt += dt; if (G.pt > 1.5) openCards(); }
    else if (G.phase === 'won') { G.pt += dt; if (G.pt > 3.2) go('win'); }
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
  function openCards() { G.cards = rollCards(); G.cardT = 0; mouse.down = false; fireTouch = null; sticks.move = sticks.aim = null; go('upgrade'); }
  function pickCard(i) {
    if (screen !== 'upgrade' || !G.cards || !G.cards[i] || G.cardT < 0.35) return;
    var id = G.cards[i]; UPG[id].ap(G.st, G.p); G.lv[id] = (G.lv[id] || 0) + 1;
    SFX.upgrade(); Voice.say('upgrade', { pr: 2, ttl: 2.5 }); flash(C.cyan, 0.15);
    ring(G.p.x, G.p.y, 10, 140, C.cyan, 0.5); shock(G.p.x, G.p.y, 0.7, 800, 0.8);
    if (G.boss) { // checkpoint after every boss: a 2-hour run does not have to be one sitting
      Store.set('cp', { wave: G.wave, st: G.st, lv: G.lv, max: G.p.max, score: G.score, kills: G.kills, time: G.time });
      Voice.say('checkpoint', { pr: 2, ttl: 5 }); G.cpBanner = 2.5;
    }
    G.cards = null; go('play'); startWave();
  }

  /* ================================================================ screens */
  var screen = 'boot', screenT = 0;
  var PRIMARY = { boot: 'engage', menu: 'start', pause: 'resume', over: 'reboot', upgrade: 'card0', win: 'wnew' };
  function go(s, cp) {
    if (s === 'play' && (screen === 'menu' || screen === 'over' || screen === 'win')) newGame(cp);
    if (s === 'menu' && checkpoint()) PRIMARY.menu = 'continue'; else PRIMARY.menu = 'start';
    if (s === 'over') PRIMARY.over = checkpoint() ? 'retry' : 'reboot';
    if (s === 'lobby') { lobbyPad = null; Net.connect(); PRIMARY.lobby = 'quick'; }
    if (s === 'menu') { AW = 2400; AH = 1500; }
    screen = s; screenT = 0; UI.focusId = PRIMARY[s] || null; UI.kb = false; mouse.down = false;
  }
  var showControls = false;

  /* ================================================================ online arena (deathmatch; server: server/neon-server.js) */
  var NAMES_A = ['NEON', 'VOLT', 'HEX', 'GHOST', 'NOVA', 'PULSE', 'RIFT', 'ZERO', 'FLUX', 'ION', 'CHROME', 'SPARK'], NAMES_B = ['WOLF', 'VIPER', 'RAVEN', 'BLADE', 'FOX', 'COMET', 'SHARK', 'LYNX', 'DRIFT', 'STORM', 'HAWK', 'ORBIT'];
  function randName() { return NAMES_A[Math.floor(rnd(0, NAMES_A.length))] + '-' + NAMES_B[Math.floor(rnd(0, NAMES_B.length))]; }
  var pilotName = String(Store.get('name', '') || '') || randName(); Store.set('name', pilotName);
  function serverUrl() { // ?server=wss://host/neon, or window.NEON_SERVER, or the same host as the page at /neon
    var q = Q.get('server'); if (q) return q; if (window.NEON_SERVER) return window.NEON_SERVER;
    if (!location.host || location.protocol === 'file:') return 'ws://localhost:8080/neon';
    return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/neon';
  }
  var Net = {
    ws: null, st: 'off', id: 0, online: 0, err: '', seq: 0, sendT: 0,
    connect: function () {
      if (this.ws && (this.st === 'connecting' || this.st === 'on')) return;
      var self = this, ws; this.st = 'connecting'; this.err = '';
      try { ws = new WebSocket(serverUrl()); } catch (e) { this.st = 'down'; return; }
      this.ws = ws;
      var to = setTimeout(function () { if (self.ws === ws && self.st === 'connecting') { self.ws = null; self.st = 'down'; try { ws.close(); } catch (e) { /* closed */ } } }, 5000);
      ws.onopen = function () { clearTimeout(to); if (self.ws !== ws) return; self.st = 'on'; self.send({ t: 'hello', name: pilotName }); };
      ws.onmessage = function (ev) { if (self.ws !== ws) return; var m; try { m = JSON.parse(ev.data); } catch (e) { return; } onNet(m); };
      ws.onclose = function () { clearTimeout(to); if (self.ws !== ws) return; self.ws = null; self.st = 'down'; if (screen === 'online') { self.err = 'lost'; leaveOnline(); } };
      ws.onerror = function () { /* onclose follows */ };
    },
    close: function () { var w = this.ws; this.ws = null; this.st = 'off'; if (w) { try { w.close(); } catch (e) { /* closed */ } } },
    send: function (m) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); }
  };
  var OG = null, lobbyPad = null, FOC = null; // OG: online game state; lobbyPad: room code being typed (null = keypad closed)
  function mkPilot(p) { return { id: p.id, name: p.name, col: p.col, k: p.k || 0, d: p.d || 0, x: 0, y: 0, sx: 0, sy: 0, vx: 0, vy: 0, aim: 0, hp: 100, alive: false, fl: 0, cd: 0, resp: 0, trail: [], ghosts: [], kick: 0, inv: 0, dashT: 0, hurtT: 0, seen: false, r: 14 }; }
  function onNet(m) {
    if (m.t === 'welcome') { Net.id = m.id; Net.online = m.online; return; }
    if (m.t === 'err') { Net.err = m.m; SFX.err(); return; }
    if (m.t === 'room') { startOnline(m); return; }
    if (!OG) return;
    if (m.t === 'join') { if (!OG.roster[m.p.id]) OG.roster[m.p.id] = mkPilot(m.p); feed(m.p.name + ' ' + T.joined, m.p.col); }
    else if (m.t === 'left') { var lp = OG.roster[m.id]; if (lp) feed(lp.name + ' ' + T.leftRoom, C.dim); delete OG.roster[m.id]; }
    else if (m.t === 's') snapshot(m);
    else if (m.t === 'end') { OG.end = { board: m.board, win: m.win, t: 0 }; mouse.down = false; fireTouch = null; if (m.win === OG.me) { Voice.say('victory', { pr: 5, ttl: 8 }); SFX.chime(); } UI.focusId = 'oleave'; }
    else if (m.t === 'reset') { OG.end = null; m.players.forEach(function (p) { var o = OG.roster[p.id]; if (o) { o.k = 0; o.d = 0; } }); OG.banner = { s: T.waitPilots, col: C.cyan, t: 0, small: true }; }
  }
  function startOnline(m) {
    AW = m.map.w; AH = m.map.h; G = null;
    OG = { code: m.code, priv: m.priv, me: m.you, map: m.map, roster: {}, st: m.st, tm: m.tm, kills: m.kills, bullets: [], feed: [], end: null, banner: null, pads: m.map.pads.map(function () { return 1; }),
      dashSeq: 0, dashNow: false, dashSent: false, hist: [], menu: false, hitMark: 0, killer: null, streak: 0, streakT: -9, lastDeathVO: -99, snapT: 0, force: null,
      L: { x: AW / 2, y: AH / 2, ox: 0, oy: 0, vx: 0, vy: 0, dashT: 0, cd: 0, fire: 0, aim: 0, trail: [], ghosts: [], kick: 0, inv: 0, hurtT: 0, critical: false, alive: false, r: 14, hp: 100, max: 100 } };
    m.players.forEach(function (p) { OG.roster[p.id] = mkPilot(p); });
    parts.length = 0; waves.length = 0; floats.length = 0; lobbyPad = null; Net.err = '';
    go('online'); SFX.wave(); Voice.say('start', { pr: 3, ttl: 4 });
  }
  function leaveOnline() { if (OG) Net.send({ t: 'leave' }); OG = null; AW = 2400; AH = 1500; mouse.down = false; fireTouch = null; go('lobby'); }
  function feed(s, col) { OG.feed.push({ s: s, col: col, t: 0 }); if (OG.feed.length > 5) OG.feed.shift(); }
  function snapshot(m) {
    OG.st = m.st; OG.tm = m.tm; OG.pads = m.pd; OG.snapT = 0;
    m.p.forEach(function (a) {
      var o = OG.roster[a[0]]; if (!o) return;
      var alive = !!(a[5] & 1);
      o.sx = a[1]; o.sy = a[2]; o.aim = a[3]; o.hp = a[4]; o.fl = a[5]; o.k = a[6]; o.d = a[7]; o.cd = a[8]; o.resp = a[9]; o.vx = a[11] || 0; o.vy = a[12] || 0; o.dashT = a[13] || 0; o.inv = a[5] & 4 ? 1 : 0;
      if (!o.seen || (!o.alive && alive)) { o.x = o.sx; o.y = o.sy; o.trail.length = 0; o.seen = true; }
      o.alive = alive;
      if (a[0] === OG.me) reconcile(o, a[10]);
    });
    (m.e || []).forEach(netEvent);
  }
  function simMove(S, inp, dt) { // same rules as the server, used for prediction and replay
    S.cd = Math.max(0, S.cd - dt);
    if (inp.dash && S.cd <= 0) { var dx = inp.x, dy = inp.y, d = hyp(dx, dy); if (d < 0.2) { dx = Math.cos(inp.a); dy = Math.sin(inp.a); d = 1; } S.vx = dx / d * 1180; S.vy = dy / d * 1180; S.dashT = 0.16; S.cd = 1.15; }
    if (S.dashT > 0) S.dashT -= dt; else { S.vx += inp.x * 3300 * dt; S.vy += inp.y * 3300 * dt; var k = Math.exp(-9.6 * dt); S.vx *= k; S.vy *= k; }
    S.x = clamp(S.x + S.vx * dt, 14, AW - 14); S.y = clamp(S.y + S.vy * dt, 14, AH - 14);
    OG.map.pillars.forEach(function (pl) { var px = S.x - pl[0], py = S.y - pl[1], pd = hyp(px, py) + 0.001, mm = pl[2] + 14; if (pd < mm) { S.x = pl[0] + px / pd * mm; S.y = pl[1] + py / pd * mm; var vn = (S.vx * px + S.vy * py) / pd; if (vn < 0) { S.vx -= vn * px / pd; S.vy -= vn * py / pd; } } });
  }
  function reconcile(o, lastIn) { // server state + replay of the inputs it has not seen yet; the visual offset hides the correction
    var L = OG.L; L.hp = o.hp; L.inv = o.inv;
    if (!o.alive) { L.alive = false; return; }
    if (!L.alive) { L.alive = true; L.x = o.sx; L.y = o.sy; L.vx = L.vy = 0; L.ox = L.oy = 0; }
    OG.hist = OG.hist.filter(function (h) { return h.s > lastIn; });
    var S = { x: o.sx, y: o.sy, vx: o.vx, vy: o.vy, dashT: o.dashT, cd: o.cd };
    OG.hist.forEach(function (h) { simMove(S, h, 1 / 30); });
    var ex = S.x - L.x, ey = S.y - L.y;
    if (hyp(ex, ey) > 180) { L.ox = L.oy = 0; } else { L.ox -= ex; L.oy -= ey; }
    L.x = S.x; L.y = S.y; L.vx = S.vx; L.vy = S.vy; L.dashT = S.dashT; L.cd = S.cd;
  }
  function removeBullet(owner, x, y, id) {
    var best = -1, bd = 90;
    OG.bullets.forEach(function (b, i) { if (b.o !== owner) return; if (b.id === id) { best = i; bd = -1; return; } var d = hyp(b.x - x, b.y - y); if (bd >= 0 && d < bd) { bd = d; best = i; } });
    if (best >= 0) OG.bullets.splice(best, 1);
  }
  function netEvent(ev) {
    var k = ev[0], o, v, a, L = OG.L;
    if (k === 'shot') { if (ev[1] === OG.me) return; o = OG.roster[ev[1]]; OG.bullets.push({ id: ev[6], o: ev[1], x: ev[2], y: ev[3], vx: ev[4], vy: ev[5], life: 0.9, col: o ? o.col : C.mag }); if (o) o.kick = 1; if (o && hyp(o.x - L.x, o.y - L.y) < 700) SFX.pew(); }
    else if (k === 'hit') {
      v = OG.roster[ev[1]]; removeBullet(ev[2], ev[3], ev[4], ev[5]); burst(ev[3], ev[4], 0, TAU, 8, 300, v ? v.col : '#fff');
      if (ev[1] === OG.me) { L.hurtT = 0.35; shake(0.3); flash(C.red, 0.18); SFX.hurt(); glitchT = 0.15; if (!L.critical && L.hp > 0 && L.hp < 35) { L.critical = true; Voice.say('critical', { pr: 3, ttl: 3 }); } }
      else if (ev[2] === OG.me) { OG.hitMark = 0.18; SFX.hit(); }
    } else if (k === 'kill') {
      v = OG.roster[ev[1]]; a = OG.roster[ev[2]];
      var vx = ev[1] === OG.me ? L.x : v ? v.x : 0, vy = ev[1] === OG.me ? L.y : v ? v.y : 0, vc = v ? v.col : C.cyan;
      burst(vx, vy, 0, TAU, 50, 600, vc); shards(vx, vy, 16, 8, vc, 420); ring(vx, vy, 10, 160, vc, 0.6); shock(vx, vy, 1.2, 760, 1);
      if (v) feed((a && a !== v ? a.name + '  ✕  ' : '✕  ') + v.name, a ? a.col : vc);
      if (ev[2] === OG.me && ev[1] !== OG.me) {
        stop(0.04); SFX.boom(0.6); shake(0.3); OG.banner = { s: T.elim + ' ' + (v ? v.name : ''), col: C.lime, t: 0, small: true };
        if (clock - OG.streakT < 4) OG.streak++; else OG.streak = 1; OG.streakT = clock;
        if (OG.streak >= 2) Voice.say(OG.streak >= 4 ? 'rampage' : OG.streak === 3 ? 'triple' : 'double', { pr: 3, ttl: 2.5 });
      }
      if (ev[1] === OG.me) { L.alive = false; L.critical = false; OG.killer = a && a !== v ? a.name : null; mouse.down = false; shake(0.8); flash('#ffffff', 0.4); SFX.boom(1); if (clock - OG.lastDeathVO > 15) { Voice.say('dead', { pr: 4, ttl: 4 }); OG.lastDeathVO = clock; } }
    } else if (k === 'spawn') {
      o = OG.roster[ev[1]]; if (o) { o.x = o.sx = ev[2]; o.y = o.sy = ev[3]; o.trail.length = 0; }
      ring(ev[2], ev[3], 50, 10, o ? o.col : C.cyan, 0.5);
      if (ev[1] === OG.me) { L.x = ev[2]; L.y = ev[3]; L.vx = L.vy = 0; L.ox = L.oy = 0; L.alive = true; L.critical = false; L.trail.length = 0; OG.hist.length = 0; }
    } else if (k === 'dash') { o = OG.roster[ev[1]]; if (o && ev[1] !== OG.me) { burst(o.x, o.y, 0, TAU, 12, 380, o.col); SFX.dash(); } }
    else if (k === 'pick') { var pd = OG.map.pads[ev[2]]; ring(pd[0], pd[1], 10, 60, C.lime, 0.4); if (ev[1] === OG.me) { SFX.pickup(); floatText(L.x, L.y - 24, '+35', C.lime, 18); if (L.critical) { L.critical = false; Voice.say('repair', { pr: 2, ttl: 3 }); } } }
    else if (k === 'go') { OG.banner = { s: T.fightGo, col: C.lime, t: 0 }; Voice.say('start', { pr: 3, ttl: 3 }); SFX.wave(); }
  }
  function onlineDash() { var L = OG && OG.L; if (!L || !L.alive || L.cd > 0 || OG.st === 'count' || OG.end || OG.menu) return; OG.dashSeq++; OG.dashNow = true; OG.dashSent = true; }
  function pilotTrail(p, dt) {
    p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 16) p.trail.shift();
    if (p.dashT > 0 && Math.random() < 0.9) p.ghosts.push({ x: p.x, y: p.y, t: 0 });
    for (var i = p.ghosts.length - 1; i >= 0; i--) { p.ghosts[i].t += dt; if (p.ghosts[i].t > 0.3) p.ghosts.splice(i, 1); }
    p.kick = Math.max(0, p.kick - dt * 6); p.hurtT -= dt;
  }
  function onlineUpdate(dt) {
    var L = OG.L; readInput(); OG.snapT += dt; OG.hitMark -= dt;
    if (OG.end) OG.end.t += dt; if (OG.banner) { OG.banner.t += dt; if (OG.banner.t > (OG.banner.small ? 1.4 : 1.8)) OG.banner = null; }
    OG.feed.forEach(function (f) { f.t += dt; }); OG.feed = OG.feed.filter(function (f) { return f.t < 7; });
    var busy = OG.menu || !!OG.end, firing = false;
    if (busy) { inX = 0; inY = 0; }
    var am = stickVec(sticks.aim, 60 * U);
    if (am && am.m > 0.2) { L.aim = Math.atan2(am.y, am.x); firing = am.m > 0.35; }
    else if (touchMode) { if (hyp(inX, inY) > 0.2) L.aim = Math.atan2(inY, inX); firing = fireTouch !== null; }
    else { var mw = toWorld(mouse.x, mouse.y); L.aim = Math.atan2(mw.y - L.y, mw.x - L.x); firing = mouse.down || !!keys.KeyJ; }
    if (OG.force) { L.aim = OG.force.a; firing = !!OG.force.f; }
    if (busy || !L.alive) firing = false;
    if (L.alive) {
      var dashing = OG.dashNow && L.cd <= 0; OG.dashNow = false;
      simMove(L, { x: inX, y: inY, a: L.aim, dash: dashing }, dt);
      if (dashing) { SFX.dash(); shake(0.14); burst(L.x, L.y, L.aim + Math.PI, 1.2, 18, 420, C.cyan); shock(L.x, L.y, 0.35, 600, 0.5); }
      L.ox *= Math.exp(-10 * dt); L.oy *= Math.exp(-10 * dt);
      L.fire -= dt;
      if (firing && L.fire <= 0 && OG.st !== 'count') { // predicted shot (the server fires the real one)
        L.fire = 1 / 6.5; var bx = L.x + Math.cos(L.aim) * 18, by = L.y + Math.sin(L.aim) * 18;
        OG.bullets.push({ id: -1, o: OG.me, x: bx, y: by, vx: Math.cos(L.aim) * 980, vy: Math.sin(L.aim) * 980, life: 0.9, col: C.cyan });
        L.kick = 1; burst(bx, by, L.aim, 0.7, 3, 360, C.cyan, 1.5); shake(0.03); SFX.pew();
      }
      var me = OG.roster[OG.me]; L.inv = me ? me.inv : 0;
      pilotTrail(L, dt);
    }
    Net.sendT -= dt;
    if (Net.sendT <= 0) {
      Net.sendT = 1 / 30; var sq = ++Net.seq;
      Net.send({ t: 'i', x: +inX.toFixed(2), y: +inY.toFixed(2), a: +L.aim.toFixed(3), f: firing ? 1 : 0, d: OG.dashSeq, s: sq });
      OG.hist.push({ s: sq, x: inX, y: inY, a: L.aim, dash: OG.dashSent }); OG.dashSent = false; if (OG.hist.length > 90) OG.hist.shift();
    }
    for (var id in OG.roster) {
      if (+id === OG.me) continue; var o = OG.roster[id]; if (!o.alive) continue;
      var age = Math.min(0.12, OG.snapT), tx = o.sx + o.vx * age, ty = o.sy + o.vy * age;
      o.x += (tx - o.x) * damp(16, dt); o.y += (ty - o.y) * damp(16, dt); pilotTrail(o, dt);
    }
    for (var i = OG.bullets.length - 1; i >= 0; i--) {
      var b = OG.bullets[i]; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
      var hitP = OG.map.pillars.some(function (pl) { return hyp(b.x - pl[0], b.y - pl[1]) < pl[2]; });
      if (b.life <= 0 || hitP || b.x < 0 || b.x > AW || b.y < 0 || b.y > AH) { if (hitP || b.life > 0) burst(clamp(b.x, 0, AW), clamp(b.y, 0, AH), Math.atan2(-b.vy, -b.vx), 1.6, 5, 300, b.col, 1.5); OG.bullets.splice(i, 1); }
    }
    var lx = 0, ly = 0;
    if (!touchMode && L.alive) { lx = clamp((mouse.x - W / 2) / Z * 0.22, -170, 170); ly = clamp((mouse.y - H / 2) / Z * 0.22, -120, 120); }
    var cx = L.x + L.ox + lx, cy = L.y + L.oy + ly, hw = W / 2 / Z, hh = H / 2 / Z;
    cx = AW > hw * 2 - 200 ? clamp(cx, hw - 100, AW - hw + 100) : AW / 2; cy = AH > hh * 2 - 200 ? clamp(cy, hh - 100, AH - hh + 100) : AH / 2;
    cam.x += (cx - cam.x) * damp(7, dt); cam.y += (cy - cam.y) * damp(7, dt);
  }
  function renderOnline() {
    var L = OG.L;
    ctx.save(); ctx.translate(W / 2 + shakeX, H / 2 + shakeY); ctx.scale(Z, Z); ctx.translate(-cam.x, -cam.y);
    var x0 = cam.x - W / 2 / Z - 40, x1 = cam.x + W / 2 / Z + 40, y0 = cam.y - H / 2 / Z - 40, y1 = cam.y + H / 2 / Z + 40;
    drawGrid(Math.max(0, x0), Math.max(0, y0), Math.min(AW, x1), Math.min(AH, y1)); drawArena();
    OG.map.pads.forEach(function (pd, i) {
      var on = !OG.pads || OG.pads[i]; ctx.strokeStyle = rgba(C.lime, on ? 0.8 : 0.2); ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(pd[0], pd[1], 34, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      if (on) { var pu = 1 + Math.sin(clock * 4 + i) * 0.12; ctx.globalCompositeOperation = 'lighter'; blob(pd[0], pd[1], 30 * pu, C.lime); ctx.globalCompositeOperation = 'source-over'; glow(C.lime, 10); ctx.strokeStyle = C.lime; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(pd[0] - 9, pd[1]); ctx.lineTo(pd[0] + 9, pd[1]); ctx.moveTo(pd[0], pd[1] - 9); ctx.lineTo(pd[0], pd[1] + 9); ctx.stroke(); noGlow(); }
    });
    OG.map.pillars.forEach(function (pl, i) {
      glow(C.vio, 16 + level * 20); ctx.fillStyle = 'rgba(14,10,36,0.92)'; ctx.strokeStyle = rgba(C.vio, 0.9); ctx.lineWidth = 3; poly(pl[0], pl[1], pl[2], 8, 0.39); ctx.fill(); ctx.stroke(); noGlow();
      ctx.strokeStyle = rgba(C.mag, 0.45); ctx.lineWidth = 1.5; poly(pl[0], pl[1], pl[2] * 0.6, 8, 0.39 + clock * 0.2 * (i % 2 ? 1 : -1)); ctx.stroke();
    });
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    OG.bullets.forEach(function (b) { ctx.strokeStyle = rgba(b.col, 0.85); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(b.x - b.vx * 0.028, b.y - b.vy * 0.028); ctx.lineTo(b.x, b.y); ctx.stroke(); blob(b.x, b.y, 12, b.col); });
    ctx.globalCompositeOperation = 'source-over';
    for (var id in OG.roster) {
      var o = OG.roster[id], me = +id === OG.me, p = me ? { x: L.x + L.ox, y: L.y + L.oy, aim: L.aim, r: 14, trail: L.trail, ghosts: L.ghosts, kick: L.kick, inv: 0, dashT: L.dashT, cd: L.cd, critical: L.critical } : o;
      if (!(me ? L.alive : o.alive)) continue;
      drawPlayer(p, me ? C.cyan : o.col, 1.15);
      if (o.inv) { ctx.strokeStyle = rgba('#ffffff', 0.4 + 0.3 * Math.sin(clock * 10)); ctx.lineWidth = 2; poly(p.x, p.y, 30, 6, clock); ctx.stroke(); }
      text(me ? '▼ ' + o.name : o.name, p.x, p.y - 34, 12, me ? C.cyan : o.col, 'center', { mono: true, glow: 6 });
      if (!me) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(p.x - 18, p.y + 26, 36, 4); ctx.fillStyle = o.col; ctx.fillRect(p.x - 18, p.y + 26, 36 * clamp(o.hp / 100, 0, 1), 4); }
    }
    drawParts();
    floats.forEach(function (f) { ctx.globalAlpha = 1 - f.t / 0.9; text(f.s, f.x, f.y - f.t * 50, f.size, f.col, 'center', { glow: 8, mono: true }); }); ctx.globalAlpha = 1;
    ctx.restore();
  }
  function drawOnlineHUD() {
    var L = OG.L, s = clamp(U, 0.75, 1.1), pad = 14, me = OG.roster[OG.me] || { k: 0, d: 0 };
    var hc = L.critical ? (Math.sin(clock * 12) > 0 ? C.red : C.mag) : C.cyan;
    text(T.integ, pad, pad + 8, 11 * s, rgba(hc, 0.9), 'left', { mono: true, sp: 2 });
    text(Math.ceil(Math.max(0, L.hp)) + '/100', pad + 230 * s, pad + 8, 11 * s, rgba(hc, 0.9), 'right', { mono: true });
    hudBar(pad, pad + 18, 230 * s, 16 * s, Math.max(0, L.hp) / 100, hc, 20);
    var ready = 1 - L.cd / 1.15, dy = pad + 24 + 22 * s;
    text(T.dash, pad, dy + 5 * s, 10 * s, ready >= 1 ? C.lime : C.dim, 'left', { mono: true, sp: 2 });
    hudBar(pad + 56 * s, dy, 110 * s, 10 * s, ready, ready >= 1 ? C.lime : C.mag, 8);
    text(OG.priv ? T.room + ' ' + OG.code : T.publicRoom, pad, dy + 30 * s, 11 * s, rgba(C.amb, 0.9), 'left', { mono: true, sp: 2 });
    // K/D + clock + scoreboard
    var rx = W - pad - 50;
    text(me.k + ' ' + T.kShort + '  ·  ' + me.d + ' ' + T.dShort, rx, pad + 18, 24 * s, C.white, 'right', { glow: 12, gc: C.cyan, mono: true, w: 800 });
    text(OG.st === 'play' ? clockStr(Math.max(0, OG.tm)) + '  ·  ' + T.firstTo + ' ' + OG.kills : OG.st === 'wait' ? T.warmup : OG.st === 'count' ? T.fightGo : '', rx, pad + 44 * s, 12 * s, rgba(C.cyan, 0.85), 'right', { mono: true, sp: 1 });
    UI.btn('opause', W - pad - 40, pad, 40, 40, 'II', { col: C.cyan, size: 15, noNav: true, on: function () { OG.menu = !OG.menu; UI.focusId = 'oresume'; } });
    var rows = Object.keys(OG.roster).map(function (k) { return OG.roster[k]; }).sort(function (a, b) { return b.k - a.k || a.d - b.d; });
    rows.slice(0, 8).forEach(function (o, i) { var ry = pad + 70 * s + i * 17 * s, mine = o.id === OG.me; text((mine ? '▸ ' : '') + o.name, rx - 34, ry, 11 * s, mine ? C.white : rgba(C.white, 0.7), 'right', { mono: true }); ctx.fillStyle = o.col; ctx.fillRect(rx - 26, ry - 4, 8, 8); text(String(o.k), rx + 6, ry, 12 * s, o.col, 'right', { mono: true, w: 800 }); });
    var vw = Math.min(340, W - 32), vy = W >= 900 ? 10 : 150 * s; drawViz(W / 2, vy, vw, 54);
    // kill feed
    OG.feed.forEach(function (f, i) { ctx.globalAlpha = clamp(7 - f.t, 0, 1); text(f.s, pad, H - 30 - (OG.feed.length - 1 - i) * 20 - (touchMode ? 220 * U : 0), 13, f.col, 'left', { mono: true, glow: 6 }); }); ctx.globalAlpha = 1;
    // center messages
    var n = rows.length;
    if (OG.st === 'wait' && !OG.end) { text(T.waitPilots + '  ' + n + '/8', W / 2, H * 0.72, 18 * s, C.white, 'center', { mono: true, sp: 2, glow: 10, gc: C.cyan, max: W - 20 }); if (OG.priv) text(T.shareCode + ':  ' + OG.code, W / 2, H * 0.72 + 30 * s, 22 * s, C.amb, 'center', { mono: true, sp: 6, glow: 14, w: 800 }); }
    if (OG.st === 'count') text(String(Math.max(1, Math.ceil(OG.tm))), W / 2, H * 0.42, 110 * s, C.white, 'center', { w: 900, glow: 30, gc: C.cyan });
    if (!L.alive && !OG.end) {
      text(OG.killer ? T.elimBy + ' ' + OG.killer : T.elim, W / 2, H * 0.4, 26 * s, C.red, 'center', { w: 900, sp: 4, glow: 20, max: W - 20 });
      text(T.respawn + ' ' + Math.max(0, me.resp || 0).toFixed(1), W / 2, H * 0.4 + 34 * s, 15 * s, C.white, 'center', { mono: true, sp: 2 });
    }
    if (OG.banner && !OG.end) { var b = OG.banner, life = b.small ? 1.4 : 1.8, k = b.t / life, a = k < 0.15 ? k / 0.15 : k > 0.75 ? (1 - k) / 0.25 : 1; ctx.globalAlpha = a; text(b.s, W / 2, H * 0.3, (b.small ? 28 : 56) * Math.min(1.2, U), C.white, 'center', { w: 900, sp: 6, glow: 24, gc: b.col, max: W - 30 }); ctx.globalAlpha = 1; }
    if (OG.hitMark > 0 && !touchMode) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (d) { ctx.beginPath(); ctx.moveTo(mouse.x + d[0] * 8, mouse.y + d[1] * 8); ctx.lineTo(mouse.x + d[0] * 15, mouse.y + d[1] * 15); ctx.stroke(); }); }
    if (touchMode && L.alive && !OG.end && !OG.menu) drawTouch(ready, L.cd <= 0);
    var hv = Math.max(L.hurtT / 0.35, L.critical ? 0.35 + 0.25 * Math.sin(clock * 6) : 0);
    if (hv > 0) { var g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); g.addColorStop(0, 'rgba(255,0,60,0)'); g.addColorStop(1, rgba(C.red, 0.45 * hv)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    var u = clamp(Math.min(W / 600, H / 700), 0.62, 1.2), bw = Math.min(340, W - 40), bh = 50 * u, cx = W / 2;
    if (OG.end) { // results
      ctx.fillStyle = 'rgba(3,3,10,0.72)'; ctx.fillRect(0, 0, W, H);
      var y = Math.max(30, H / 2 - 220 * u), win = OG.roster[OG.end.win] || OG.end.board[0];
      text(OG.end.win === OG.me ? '♛ ' + T.youWin + ' ♛' : T.winner + ': ' + (win ? win.name : '—'), cx, y, 40 * u, OG.end.win === OG.me ? C.amb : C.white, 'center', { w: 900, sp: 4, glow: 24, gc: C.amb, max: W - 20 });
      y += 50 * u;
      OG.end.board.slice(0, 8).forEach(function (r, i) { var ry = y + i * 26 * u, o = OG.roster[r.id], col = o ? o.col : C.white; text((i + 1) + '.  ' + r.name, cx - 20, ry, 15 * u, r.id === OG.me ? C.white : rgba(C.white, 0.75), 'right', { mono: true }); text(r.k + ' ' + T.kShort + '  ' + r.d + ' ' + T.dShort, cx + 20, ry, 15 * u, col, 'left', { mono: true, w: 800 }); });
      y += Math.min(8, OG.end.board.length) * 26 * u + 16 * u;
      text(T.nextMatch + ' ' + Math.max(0, Math.ceil(8 - OG.end.t)), cx, y, 13 * u, C.cyan, 'center', { mono: true, sp: 2 }); y += 26 * u;
      UI.btn('oleave', cx - bw / 2, y, bw, bh, T.leave, { col: C.red, on: leaveOnline });
    } else if (OG.menu) {
      ctx.fillStyle = 'rgba(3,3,10,0.7)'; ctx.fillRect(0, 0, W, H);
      var my = H / 2 - 80 * u; text(T.paused, cx, my, 36 * u, C.white, 'center', { w: 900, sp: 6, glow: 20, gc: C.cyan }); my += 40 * u;
      text(T.onlineLive, cx, my, 12 * u, rgba(C.white, 0.7), 'center', { mono: true, max: W - 30 }); my += 26 * u;
      UI.btn('oresume', cx - bw / 2, my, bw, bh, '▶  ' + T.resume, { col: C.lime, on: function () { OG.menu = false; } }); my += bh + 10 * u;
      UI.btn('oleave', cx - bw / 2, my, bw, bh, T.leave, { col: C.red, on: leaveOnline });
    }
  }
  function drawLobby() {
    drawAttract();
    var u = clamp(Math.min(W / 600, H / 760), 0.6, 1.2), cx = W / 2, bw = Math.min(360, W - 40), bh = 50 * u, y = Math.max(24, H / 2 - 300 * u);
    text(T.onlineArena, cx, y + 20 * u, 44 * u, C.white, 'center', { w: 900, sp: 6, glow: 24, gc: C.mag, max: W - 20 });
    text(T.dm, cx, y + 58 * u, 12 * u, C.mag, 'center', { mono: true, sp: 2, max: W - 20 });
    y += 92 * u;
    var on = Net.st === 'on', stTxt = on ? '● ' + T.srvOn + '  ·  ' + Net.online + ' ' + T.pilots : Net.st === 'connecting' ? '◌ ' + T.connecting + '...'.slice(0, 1 + Math.floor(clock * 3) % 3) : '✕ ' + T.srvOff;
    text(stTxt, cx, y, 13 * u, on ? C.lime : Net.st === 'connecting' ? C.amb : C.red, 'center', { mono: true, sp: 2, glow: 8 });
    y += 30 * u;
    text(T.pilot + ':  ' + pilotName, cx, y, 18 * u, C.cyan, 'center', { mono: true, sp: 2, glow: 10, w: 800 });
    y += 22 * u;
    UI.btn('rename', cx - 90 * u, y, 180 * u, 34 * u, '↻ ' + T.rename, { col: C.cyan, size: 13 * u, on: function () { pilotName = randName(); Store.set('name', pilotName); Net.send({ t: 'hello', name: pilotName }); } });
    y += 50 * u;
    if (Net.err) text(T['e_' + Net.err] || Net.err, cx, y - 4, 13 * u, C.red, 'center', { mono: true, sp: 2, glow: 8 });
    y += 14 * u;
    if (lobbyPad !== null) { // on-screen keypad: works on phones
      text(T.enterCode, cx, y, 13 * u, C.amb, 'center', { mono: true, sp: 3 }); y += 16 * u;
      var bx = 52 * u, gx = cx - bx * 2 - 18;
      for (var i = 0; i < 4; i++) { chamfer(gx + i * (bx + 12), y, bx, 56 * u, 8); ctx.strokeStyle = rgba(C.amb, i === lobbyPad.length ? 0.95 : 0.5); ctx.lineWidth = 2; ctx.stroke(); text(lobbyPad[i] || '', gx + i * (bx + 12) + bx / 2, y + 28 * u, 30 * u, C.white, 'center', { mono: true, w: 800, glow: 10, gc: C.amb }); }
      y += 70 * u;
      var kw = Math.min(90, (bw - 20) / 3), kh = 42 * u, kx = cx - (kw * 3 + 20) / 2, keysL = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
      keysL.forEach(function (kk, j) { var col = j % 3, row = Math.floor(j / 3); UI.btn('k' + j, kx + col * (kw + 10), y + row * (kh + 8), kw, kh, kk, { col: kk === '✓' ? C.lime : kk === '⌫' ? C.red : C.amb, size: 20 * u, disabled: kk === '✓' && lobbyPad.length < 4, on: function () { padKey(kk); } }); });
      y += 4 * (kh + 8) + 8 * u;
      UI.btn('kcancel', cx - bw / 2, y, bw, 40 * u, T.cancel, { col: C.dim, on: function () { lobbyPad = null; UI.focusId = 'quick'; } });
      return;
    }
    if (on) {
      UI.btn('quick', cx - bw / 2, y, bw, bh * 1.15, '▶  ' + T.quick, { col: C.lime, size: 21 * u, on: function () { Net.err = ''; Net.send({ t: 'quick' }); } }); y += bh * 1.15 + 10 * u;
      UI.btn('create', cx - bw / 2, y, bw, bh, T.create, { col: C.mag, on: function () { Net.err = ''; Net.send({ t: 'create' }); } }); y += bh + 10 * u;
      UI.btn('joincode', cx - bw / 2, y, bw, bh, T.joinCode, { col: C.amb, on: function () { Net.err = ''; lobbyPad = ''; UI.focusId = 'k0'; } }); y += bh + 10 * u;
    } else if (Net.st !== 'connecting') {
      wrap(T.offlineMsg, cx, y + 6 * u, bw + 20, 13 * u, rgba(C.white, 0.8)); y += 64 * u;
      UI.btn('reconnect', cx - bw / 2, y, bw, bh, '↻  ' + T.reconnect, { col: C.amb, on: function () { Net.close(); Net.connect(); } }); y += bh + 10 * u;
    } else y += 60 * u;
    UI.btn('lback', cx - bw / 2, y + 6 * u, bw, bh * 0.9, T.back, { col: C.dim, on: function () { Net.close(); go('menu'); } });
  }
  function padKey(k) {
    if (lobbyPad === null) return;
    if (k === '⌫') lobbyPad = lobbyPad.slice(0, -1);
    else if (k === '✓') { if (lobbyPad.length === 4) { Net.err = ''; Net.send({ t: 'join', code: lobbyPad }); } }
    else if (lobbyPad.length < 4) { lobbyPad += k; SFX.type(); if (lobbyPad.length === 4) UI.focusId = 'k11'; }
  }

  /* ---------------- render: world */
  function renderWorld() {
    ctx.save(); ctx.translate(W / 2 + shakeX, H / 2 + shakeY); ctx.scale(Z, Z); ctx.translate(-cam.x, -cam.y);
    var x0 = cam.x - W / 2 / Z - 40, x1 = cam.x + W / 2 / Z + 40, y0 = cam.y - H / 2 / Z - 40, y1 = cam.y + H / 2 / Z + 40;
    drawGrid(Math.max(0, x0), Math.max(0, y0), Math.min(AW, x1), Math.min(AH, y1));
    drawArena();
    if (G) {
      var p = G.p;
      G.pick.forEach(function (k) { var pu = 1 + Math.sin(k.t * 8) * 0.15; ctx.globalCompositeOperation = 'lighter'; blob(k.x, k.y, 26 * pu, C.lime); ctx.globalCompositeOperation = 'source-over'; glow(C.lime, 10); ctx.strokeStyle = C.lime; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(k.x - 7, k.y); ctx.lineTo(k.x + 7, k.y); ctx.moveTo(k.x, k.y - 7); ctx.lineTo(k.x, k.y + 7); ctx.stroke(); noGlow(); });
      G.mines.forEach(function (mn) { var k = mn.t / mn.fuse, blink = Math.sin(mn.t * (8 + k * 30)) > 0; ctx.strokeStyle = rgba('#ff6b3d', 0.25 + 0.4 * k); ctx.lineWidth = 1.5; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.arc(mn.x, mn.y, mn.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]); glow('#ff6b3d', 10); ctx.fillStyle = blink ? '#ffffff' : '#ff6b3d'; ctx.beginPath(); ctx.arc(mn.x, mn.y, 7, 0, TAU); ctx.fill(); noGlow(); });
      G.beams.forEach(drawBeam);
      G.en.forEach(drawEnemy);
      ctx.globalCompositeOperation = 'lighter';
      G.eb.forEach(function (q) { blob(q.x, q.y, q.r * 3.4, q.col); if (q.missile) { ctx.strokeStyle = rgba(q.col, 0.7); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(q.x - q.vx * 0.08, q.y - q.vy * 0.08); ctx.lineTo(q.x, q.y); ctx.stroke(); } if (q.bolt) { ctx.strokeStyle = q.col; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(q.x - q.vx * 0.03, q.y - q.vy * 0.03); ctx.lineTo(q.x, q.y); ctx.stroke(); } });
      ctx.fillStyle = '#fff'; G.eb.forEach(function (q) { ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 0.55, 0, TAU); ctx.fill(); });
      ctx.lineCap = 'round';
      G.bullets.forEach(function (b) { ctx.strokeStyle = rgba(C.cyan, 0.85); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(b.x - b.vx * 0.028, b.y - b.vy * 0.028); ctx.lineTo(b.x, b.y); ctx.stroke(); blob(b.x, b.y, 12, C.cyan); });
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; G.bullets.forEach(function (b) { ctx.beginPath(); ctx.moveTo(b.x - b.vx * 0.012, b.y - b.vy * 0.012); ctx.lineTo(b.x, b.y); ctx.stroke(); });
      ctx.globalCompositeOperation = 'source-over';
      if (p.alive) { drawPlayer(p); drawGear(p); }
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
  function drawBeam(bm) {
    var e = bm.e, cx = Math.cos(bm.a), cy = Math.sin(bm.a), L = 1300, x0 = e.x + cx * e.r, y0 = e.y + cy * e.r;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, AW, AH); ctx.clip(); ctx.lineCap = 'round';
    if (bm.on) { ctx.globalCompositeOperation = 'lighter'; [[34, 0.18], [18, 0.45], [6, 1]].forEach(function (w) { ctx.strokeStyle = w[1] === 1 ? '#ffffff' : rgba(e.col, w[1]); ctx.lineWidth = w[0] + Math.sin(clock * 40) * 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + cx * L, y0 + cy * L); ctx.stroke(); }); ctx.globalCompositeOperation = 'source-over'; }
    else { ctx.strokeStyle = rgba(e.col, 0.35 + 0.3 * Math.sin(clock * 25)); ctx.lineWidth = 2; ctx.setLineDash([16, 12]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + cx * L, y0 + cy * L); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
  }
  function drawGear(p) { // drones + Aegis shield
    var st = G.st;
    for (var i = 0; i < st.drones; i++) { var a = p.droneA + i * TAU / st.drones, x = p.x + Math.cos(a) * 46, y = p.y + Math.sin(a) * 46; glow(C.cyan, 10); ctx.fillStyle = C.cyan; poly(x, y, 6, 4, a * 2); ctx.fill(); noGlow(); }
    if (G.shieldUp) { ctx.strokeStyle = rgba('#7fd4ff', 0.55 + 0.25 * Math.sin(clock * 5)); ctx.lineWidth = 2; glow('#7fd4ff', 12); poly(p.x, p.y, p.r + 22, 6, clock * 0.8); ctx.stroke(); noGlow(); }
  }
  function telLine(x, y, a, L, col, lock) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, AW, AH); ctx.clip();
    glow(lock ? C.red : col, lock ? 14 : 6); ctx.strokeStyle = rgba(lock ? C.red : col, lock ? (Math.sin(clock * 60) > 0 ? 0.9 : 0.55) : 0.45 + 0.25 * Math.sin(clock * 20)); ctx.lineWidth = lock ? 3 : 1.5;
    if (!lock) ctx.setLineDash([14, 10]);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke(); ctx.setLineDash([]); noGlow(); ctx.restore();
  }
  function drawEnemy(e) {
    var white = e.flash > 0, col = white ? '#ffffff' : e.col, t = e.type, i;
    if (e.warp > 0) { // spawn telegraph
      var k = e.warp / 0.75; ctx.strokeStyle = rgba(e.col, 0.8 * (1 - k) + 0.2); ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (1 + k * 3), 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      for (i = 0; i < 4; i++) { var a = i * TAU / 4 + clock * 3, rr = e.r * (1.5 + k * 4); ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * rr, e.y + Math.sin(a) * rr); ctx.lineTo(e.x + Math.cos(a) * (rr - 14), e.y + Math.sin(a) * (rr - 14)); ctx.stroke(); }
      return;
    }
    if (t === 'sniper' && e.state === 'aim') telLine(e.x, e.y, e.aim, 1800, C.amb, e.tel <= 0.35);
    if (t === 'dasher' && e.state === 'aim') telLine(e.x, e.y, e.aim, 430, C.red, e.tel <= 0.25);
    if (t === 'boss' && e.state === 'tele') telLine(e.x, e.y, e.aim, 1800, e.col, e.tel <= 0.3);
    if (t === 'node' && e.owner) { ctx.strokeStyle = rgba('#e8f0ff', 0.25); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.owner.x, e.owner.y); ctx.stroke(); }
    var ghost = e.ghost || 0; if (ghost) ctx.globalAlpha = 1 - ghost * 0.85;
    ctx.globalCompositeOperation = 'lighter'; blob(e.x, e.y, e.r * 2.6, e.col); ctx.globalCompositeOperation = 'source-over';
    glow(col, 14); ctx.lineWidth = t === 'boss' ? 4 : 2.6; ctx.strokeStyle = col; ctx.fillStyle = white ? 'rgba(255,255,255,0.5)' : rgba(e.col, 0.12);
    if (t === 'swarmer') {
      var va = Math.atan2(e.vy, e.vx); ctx.beginPath(); ctx.moveTo(e.x + Math.cos(va) * e.r * 1.4, e.y + Math.sin(va) * e.r * 1.4);
      ctx.lineTo(e.x + Math.cos(va + 2.5) * e.r, e.y + Math.sin(va + 2.5) * e.r); ctx.lineTo(e.x + Math.cos(va - 2.5) * e.r, e.y + Math.sin(va - 2.5) * e.r); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (t === 'dasher') { var da = e.state === 'move' ? Math.atan2(e.vy, e.vx) : e.aim; poly(e.x, e.y, e.r * 1.25, 4, da); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(da) * e.r * 1.25, e.y + Math.sin(da) * e.r * 1.25); ctx.stroke(); }
    else if (t === 'spinner') { poly(e.x, e.y, e.r, 4, e.spin); ctx.fill(); ctx.stroke(); for (i = 0; i < 4; i++) { var sa2 = e.spin + i * TAU / 4; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(sa2) * e.r * 0.4, e.y + Math.sin(sa2) * e.r * 0.4); ctx.lineTo(e.x + Math.cos(sa2) * (e.r + 9), e.y + Math.sin(sa2) * (e.r + 9)); ctx.stroke(); } }
    else if (t === 'bomber') { ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 0.55, e.rot, e.rot + 4); ctx.stroke(); ctx.fillStyle = e.cd < 0.5 && Math.sin(clock * 30) > 0 ? '#fff' : col; ctx.beginPath(); ctx.arc(e.x, e.y, 4, 0, TAU); ctx.fill(); }
    else if (t === 'medic') { ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(e.x - 7, e.y); ctx.lineTo(e.x + 7, e.y); ctx.moveTo(e.x, e.y - 7); ctx.lineTo(e.x, e.y + 7); ctx.stroke(); }
    else if (t === 'hive') { ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, TAU); ctx.fill(); ctx.stroke(); for (i = 0; i < 6; i++) { var ha = e.rot + i * TAU / 6; poly(e.x + Math.cos(ha) * e.r * 0.5, e.y + Math.sin(ha) * e.r * 0.5, e.r * 0.22, 6, 0); ctx.stroke(); } }
    else if (t === 'phantom') { ctx.beginPath(); for (i = 0; i < 10; i++) { var pa = e.rot + i * Math.PI / 5, pr = i % 2 ? e.r * 0.45 : e.r * 1.15; ctx.lineTo(e.x + Math.cos(pa) * pr, e.y + Math.sin(pa) * pr); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (t === 'shielder') { poly(e.x, e.y, e.r, 5, e.rot); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 9, e.aim - 1.05, e.aim + 1.05); ctx.stroke(); }
    else if (t === 'node') { poly(e.x, e.y, e.r, 4, clock * 2); ctx.fill(); ctx.stroke(); }
    else if (t === 'boss') drawBoss(e, col, white);
    else {
      poly(e.x, e.y, e.r, e.sides, e.rot); ctx.fill(); ctx.stroke();
      poly(e.x, e.y, e.r * 0.5, e.sides, -e.rot); ctx.stroke();
      if (t === 'sniper') { ctx.fillStyle = e.state === 'aim' ? C.red : col; ctx.beginPath(); ctx.arc(e.x + Math.cos(e.aim) * 5, e.y + Math.sin(e.aim) * 5, 4, 0, TAU); ctx.fill(); }
    }
    if (e.elite) { ctx.strokeStyle = C.amb; ctx.lineWidth = 2; glow(C.amb, 12); ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 8, clock, clock + TAU); ctx.stroke(); ctx.setLineDash([]); }
    if (e.hp < e.max && t !== 'boss' && (e.max > 6 || e.elite)) { ctx.fillStyle = rgba('#000000', 0.5); ctx.fillRect(e.x - e.r, e.y - e.r - 12, e.r * 2, 4); ctx.fillStyle = e.elite ? C.amb : e.col; ctx.fillRect(e.x - e.r, e.y - e.r - 12, e.r * 2 * Math.max(0, e.hp / e.max), 4); }
    noGlow(); ctx.globalAlpha = 1;
  }
  function drawBoss(e, col, white) {
    var n = e.sides, s;
    if (e.kind === 'lancer') { var la = e.state === 'move' ? Math.atan2(G.p.y - e.y, G.p.x - e.x) : e.aim; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(la) * e.r * 1.5, e.y + Math.sin(la) * e.r * 1.5); ctx.lineTo(e.x + Math.cos(la + 2.4) * e.r, e.y + Math.sin(la + 2.4) * e.r); ctx.lineTo(e.x + Math.cos(la + Math.PI) * e.r * 0.4, e.y + Math.sin(la + Math.PI) * e.r * 0.4); ctx.lineTo(e.x + Math.cos(la - 2.4) * e.r, e.y + Math.sin(la - 2.4) * e.r); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { poly(e.x, e.y, e.r, n, e.rot); ctx.fill(); ctx.stroke(); }
    if (e.kind === 'null') { for (s = 1; s <= 3; s++) { ctx.strokeStyle = rgba([C.vio, '#ff4fa0', '#e8f0ff'][s - 1], e.bphase >= s ? 0.9 : 0.25); poly(e.x, e.y, e.r * (1 - s * 0.2), 3 + s * 2, e.rot * (s % 2 ? -2 : 2)); ctx.stroke(); } }
    else if (e.kind === 'prism') { poly(e.x, e.y, e.r * 0.55, 3, -e.rot * 2); ctx.stroke(); poly(e.x, e.y, e.r * 0.55, 3, -e.rot * 2 + Math.PI); ctx.stroke(); }
    else if (e.kind === 'queen') { for (s = 0; s < 6; s++) { var qa = e.rot + s * TAU / 6; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(qa) * e.r, e.y + Math.sin(qa) * e.r); ctx.lineTo(e.x + Math.cos(qa + 0.26) * (e.r + 22), e.y + Math.sin(qa + 0.26) * (e.r + 22)); ctx.stroke(); } }
    else if (e.kind !== 'lancer') { poly(e.x, e.y, e.r * 0.62, 3, -e.rot * 2); ctx.stroke(); for (s = 0; s < n; s++) { var sa = e.rot + s / n * TAU, sl = e.r + 14 + 6 * Math.sin(clock * 6 + s); ctx.beginPath(); ctx.moveTo(e.x + Math.cos(sa) * e.r, e.y + Math.sin(sa) * e.r); ctx.lineTo(e.x + Math.cos(sa) * sl, e.y + Math.sin(sa) * sl); ctx.stroke(); } }
    ctx.fillStyle = white ? '#fff' : e.kind === 'hydra' ? '#ffffff' : C.mag; ctx.beginPath(); ctx.arc(e.x, e.y, 12 + 4 * Math.sin(clock * 8), 0, TAU); ctx.fill();
    if (e.shielded) { ctx.strokeStyle = rgba('#e8f0ff', 0.5 + 0.3 * Math.sin(clock * 6)); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 22, 0, TAU); ctx.stroke(); ctx.fillStyle = rgba('#e8f0ff', 0.06); ctx.fill(); }
    ctx.strokeStyle = rgba(C.red, 0.8); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 30, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0, e.hp / e.max)); ctx.stroke();
  }
  function drawPlayer(p, pc, cdMax) {
    pc = pc || C.cyan; cdMax = cdMax || G.st.dashCd;
    var blink = p.inv > 0 && p.dashT <= 0 && p.inv < 0.75 && Math.sin(clock * 50) > 0.3;
    // motion trail
    ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
    for (var i = 1; i < p.trail.length; i++) { var a = p.trail[i - 1], b = p.trail[i], k = i / p.trail.length; ctx.strokeStyle = rgba(pc, k * 0.5); ctx.lineWidth = k * 10; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    p.ghosts.forEach(function (g) { var al = 1 - g.t / 0.3; ctx.strokeStyle = rgba(pc, al * 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(g.x, g.y, p.r, 0, TAU); ctx.stroke(); });
    blob(p.x, p.y, 54 + level * 20, pc);
    ctx.globalCompositeOperation = 'source-over';
    if (blink) return;
    var col = p.critical && Math.sin(clock * 12) > 0 ? C.red : pc, kick = p.kick * 3;
    glow(col, 18); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.fillStyle = rgba(col, 0.15);
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); ctx.stroke();
    var ax = Math.cos(p.aim), ay = Math.sin(p.aim), nx = -ay, ny = ax, tip = p.r + 14 - kick;
    ctx.beginPath(); ctx.moveTo(p.x + ax * tip, p.y + ay * tip); ctx.lineTo(p.x + ax * (p.r + 2) + nx * 8, p.y + ay * (p.r + 2) + ny * 8); ctx.lineTo(p.x + ax * (p.r + 2) - nx * 8, p.y + ay * (p.r + 2) - ny * 8); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, TAU); ctx.fill(); noGlow();
    // dash cooldown ring
    var ready = 1 - p.cd / cdMax;
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
    text(T.wave + ' ' + G.wave + '/' + LAST + '  ·  ' + T.left + ' ' + hostiles() + '  ·  ' + clockStr(G.time), rx, pad + 66 * s, 11 * s, rgba(C.cyan, 0.75), 'right', { mono: true, sp: 1 });
    UI.btn('pause', W - pad - 40, pad, 40, 40, 'II', { col: C.cyan, size: 15, noNav: true, on: function () { go('pause'); } });
    // announcer visualizer (top center; below the bars on narrow screens)
    var vw = Math.min(340, W - 32), vy = W >= 820 ? 10 : 112 * s, vh = 54;
    drawViz(W / 2, vy, vw, vh);
    // boss bar
    var bosses = G.en.filter(function (e) { return e.type === 'boss' && e.warp <= 0; }), bk = BOSSES[G.wave];
    if (bosses.length && bk) {
      var bw = Math.min(420, W - 40), by = vy + vh + (Voice.cur ? 34 : 12), bhp = 0, bmax = 0, bcol = BCOL[bk[0]], sh = bosses.some(function (e) { return e.shielded; });
      bosses.forEach(function (e) { bhp += Math.max(0, e.hp); bmax += e.max; });
      if (bk[0] === 'hydra') bmax = Math.max(bmax, bosses[0].max * 2);
      var nm = T.bn[bk[0]] + (bk[1] > 1 ? ' MK II' : '') + (bk[0] === 'null' ? '  ·  PHASE ' + bosses[0].bphase : '') + (sh ? '  ·  ' + T.shielded : '');
      text(nm, W / 2, by + 6, 12, bcol === '#ffffff' ? C.amb : bcol, 'center', { mono: true, sp: 4, glow: 10, max: W - 30 }); hudBar(W / 2 - bw / 2, by + 14, bw, 12, bhp / bmax, sh ? C.dim : bcol === '#ffffff' ? C.amb : bcol, 30);
    }
    if (G.cpBanner > 0) { G.cpBanner -= rdt; text('✓ ' + T.cpSaved, W / 2, H - 70, 14, C.lime, 'center', { mono: true, sp: 2, glow: 12 }); }
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
      drawTouch(ready, p.cd <= 0);
      if (G.wave === 1 && G.t < 9) text(T.tapHint, W / 2, H - 190 * U, 12 * U, rgba(C.white, 0.85 * clamp(9 - G.t, 0, 1)), 'center', { mono: true, max: W - 20 });
    }
    if (!touchMode && G.wave === 1 && G.t < 9) text(T.clickHint, W / 2, H - 46, 15, rgba(C.white, 0.9 * clamp(9 - G.t, 0, 1)), 'center', { mono: true, sp: 1, glow: 10, gc: C.cyan, max: W - 20 });
    // damage vignette
    var hv = Math.max(p.hurtT / 0.35, p.critical ? 0.35 + 0.25 * Math.sin(clock * 6) : 0);
    if (hv > 0) { var g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); g.addColorStop(0, 'rgba(255,0,60,0)'); g.addColorStop(1, rgba(C.red, 0.45 * hv)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  }
  function drawTouch(ready, rdy) { // FIRE + DASH buttons and thumb sticks (campaign and online)
      var fr = 50 * U; fireBtn.x = W - 76 * U; fireBtn.y = H - 96 * U; fireBtn.r = fr; fireBtn.p = Math.max(0, fireBtn.p - rdt * 4);
      var held = fireTouch !== null, fk = held ? 1 : 0;
      ctx.fillStyle = rgba(C.mag, 0.12 + 0.25 * fk); ctx.beginPath(); ctx.arc(fireBtn.x, fireBtn.y, fr * (1 - 0.06 * fk), 0, TAU); ctx.fill();
      glow(C.mag, 14 + 16 * fk); ctx.strokeStyle = rgba(C.mag, 0.9); ctx.lineWidth = 3; ctx.stroke(); noGlow();
      text(T.fire, fireBtn.x, fireBtn.y, 16 * U, C.white, 'center', { w: 900, sp: 2, glow: 10 * fk + 2, gc: C.mag });
      var dr = 36 * U; dashBtn.x = W - 186 * U; dashBtn.y = H - 66 * U; dashBtn.r = dr;
      glow(rdy ? C.lime : C.mag, rdy ? 16 : 4); ctx.strokeStyle = rgba(rdy ? C.lime : C.mag, 0.8); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(dashBtn.x, dashBtn.y, dr, 0, TAU); ctx.stroke(); noGlow();
      ctx.strokeStyle = rgba(C.lime, 0.9); ctx.beginPath(); ctx.arc(dashBtn.x, dashBtn.y, dr - 6, -Math.PI / 2, -Math.PI / 2 + TAU * ready); ctx.stroke();
      text(T.dash, dashBtn.x, dashBtn.y, 12 * U, rdy ? C.white : C.dim, 'center', { w: 800, sp: 1 });
      ['move', 'aim'].forEach(function (k) { var st = sticks[k]; if (!st) return; var c = k === 'move' ? C.cyan : C.mag; ctx.strokeStyle = rgba(c, 0.4); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(st.ox, st.oy, 60 * U, 0, TAU); ctx.stroke(); glow(c, 12); ctx.fillStyle = rgba(c, 0.5); ctx.beginPath(); ctx.arc(st.x, st.y, 22 * U, 0, TAU); ctx.fill(); noGlow(); });
  }
  function clockStr(t) { t = Math.floor(t); var h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, sx = t % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (sx < 10 ? '0' : '') + sx; }
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
    var onl = screen === 'online' && OG && OG.L.alive && !OG.menu && !OG.end, inGame = (screen === 'play' && G && G.p.alive) || onl, k = onl ? OG.L.kick : inGame ? G.p.kick : 0, r = 11 + k * 6, over = false;
    if (inGame && !onl) { var w = toWorld(x, y); G.en.forEach(function (e) { if (!over && e.warp <= 0 && hyp(e.x - w.x, e.y - w.y) < e.r + 8) over = true; }); }
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
    var cw = Math.min(560, W - 32), cx = W / 2, x = cx - cw / 2, u = clamp(Math.min(W / 600, H / 620), 0.62, 1.15), y = Math.max(20, H / 2 - 250 * u);
    title(cx, y + 34 * u, 54 * u);
    y += 112 * u;
    var hdr = '> ' + T.init, shown = Math.min(hdr.length, Math.floor(screenT * 40));
    text(hdr.slice(0, shown) + (Math.sin(clock * 8) > 0 ? '_' : ' '), x, y, 15 * u, C.cyan, 'left', { mono: true, glow: 10, max: cw });
    y += 26 * u;
    var np = Object.keys(Voice.pack).length, nh = Heavy.count();
    var log = [['core.audio .......... ' + (AC ? 'OK' : 'STANDBY'), AC ? C.lime : C.dim], ['canvas.render ....... OK', C.lime],
      ['voice.pack .......... ' + (np ? np + ' LINES' : 'STANDBY'), np ? C.lime : C.dim], ['sfx.bank ............ ' + (nh ? nh + ' SOUNDS' : 'STANDBY'), nh ? C.lime : C.dim],
      ['elevenlabs.voice .... CALLUM', C.mag]];
    log.forEach(function (l, i) { if (screenT * 6 < i) return; text('> ' + l[0], x, y + i * 18 * u, 12 * u, l[1], 'left', { mono: true, max: cw }); });
    y += log.length * 18 * u + 30 * u;
    var pulse = 0.5 + 0.5 * Math.sin(clock * 3);
    glow(C.cyan, 20 * pulse); UI.btn('engage', x, y, cw, 68 * u, '[ ' + T.engage + ' ]', { col: C.cyan, size: 20 * u, on: engage }); noGlow();
    y += 68 * u + 26 * u;
    text(T.soundHint, cx, y, 12 * u, rgba(C.white, 0.75), 'center', { mono: true, max: cw });
    text('voice + sfx: ElevenLabs · voice: Callum · eleven_turbo_v2_5', cx, y + 20 * u, 10 * u, rgba(C.dim, 0.8), 'center', { mono: true, max: cw });
  }

  /* ---------------- menu */
  function drawMenu() {
    drawAttract();
    var u = clamp(Math.min(W / 600, H / 760), 0.6, 1.2), cx = W / 2, bw = Math.min(360, W - 40), bh = 50 * u, y = Math.max(20, H / 2 - 310 * u);
    title(cx, y + 40 * u, 60 * u);
    y += 116 * u;
    text(T.announcer + ': ' + Voice.label() + '   ·   ' + T.sfx + ': ' + Heavy.count() + ' · ELEVENLABS', cx, y, 11 * u, rgba(C.cyan, 0.8), 'center', { mono: true, sp: 1, max: W - 30 });
    drawViz(cx, y + 14 * u, Math.min(340, W - 32), 54);
    y += 14 * u + 54 + 34; // panel + subtitle line
    if (showControls) {
      var lines = touchMode ? T.ctlT : T.ctl, ph = (lines.length * 26 + 30) * u;
      chamfer(cx - bw / 2 - 20, y - 10, bw + 40, ph, 12); ctx.fillStyle = 'rgba(5,7,18,0.85)'; ctx.fill(); ctx.strokeStyle = rgba(C.cyan, 0.5); ctx.stroke();
      lines.forEach(function (l, i) { text(l, cx, y + 14 * u + i * 26 * u, 13 * u, C.white, 'center', { mono: true, max: bw + 20 }); });
      y += ph + 12 * u;
      UI.btn('ctlBack', cx - bw / 2, y, bw, bh, T.back, { col: C.cyan, on: function () { showControls = false; UI.focusId = 'start'; } });
      return;
    }
    var cp = checkpoint();
    if (cp) { UI.btn('continue', cx - bw / 2, y, bw, bh * 1.15, '▶  ' + T.cont + ' ' + (cp.wave + 1), { col: C.lime, size: 20 * u, on: function () { audio(); go('play', checkpoint()); } }); y += bh * 1.15 + 10 * u; }
    UI.btn('start', cx - bw / 2, y, bw, cp ? bh : bh * 1.15, (cp ? '' : '▶  ') + (cp ? T.newRun : T.start), { col: cp ? C.cyan : C.lime, size: (cp ? 18 : 22) * u, on: function () { audio(); go('play'); } });
    y += (cp ? bh : bh * 1.15) + 12 * u;
    UI.btn('online', cx - bw / 2, y, bw, bh, '⚔  ' + T.onlineBtn, { col: C.mag, on: function () { audio(); go('lobby'); } });
    y += bh + 10 * u;
    UI.btn('controls', cx - bw / 2, y, bw, bh, T.controls, { col: C.cyan, on: function () { showControls = true; UI.focusId = 'ctlBack'; } });
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
    else if (id === 'drone') { ctx.beginPath(); ctx.arc(0, 0, s * 0.7, 0, TAU); ctx.stroke(); for (i = 0; i < 3; i++) { var da = i * TAU / 3 - 0.5; poly(Math.cos(da) * s * 0.7, Math.sin(da) * s * 0.7, 7, 4, da); ctx.fill(); } }
    else if (id === 'regen') { ctx.beginPath(); ctx.arc(0, 0, s * 0.75, -2.4, 2.2); ctx.stroke(); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke(); }
    else if (id === 'crit') { ctx.beginPath(); ctx.arc(0, 0, s * 0.75, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, TAU); ctx.stroke(); for (i = 0; i < 4; i++) { var ca = i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(Math.cos(ca) * s * 0.45, Math.sin(ca) * s * 0.45); ctx.lineTo(Math.cos(ca) * s, Math.sin(ca) * s); ctx.stroke(); } }
    else if (id === 'ricochet') { ctx.beginPath(); ctx.moveTo(-s, s * 0.5); ctx.lineTo(-s * 0.2, -s * 0.5); ctx.lineTo(s * 0.4, s * 0.3); ctx.lineTo(s, -s * 0.4); ctx.stroke(); }
    else if (id === 'shield') { poly(0, 0, s * 0.8, 6, 0); ctx.stroke(); poly(0, 0, s * 0.45, 6, 0); ctx.globalAlpha = 0.5; ctx.fill(); }
    else if (id === 'servo') { for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-s + i * 14, -s * 0.5); ctx.lineTo(-s * 0.5 + i * 14, 0); ctx.lineTo(-s + i * 14, s * 0.5); ctx.stroke(); } }
    else { ctx.beginPath(); ctx.moveTo(6, -s); ctx.lineTo(-10, 4); ctx.lineTo(2, 4); ctx.lineTo(-6, s); ctx.lineTo(12, -6); ctx.lineTo(0, -6); ctx.closePath(); ctx.fill(); }
    noGlow(); ctx.restore();
  }
  var CARDCOL = { multi: C.cyan, pierce: C.amb, dash: C.mag, rapid: C.cyan, boom: C.amb, heal: C.lime, rail: C.vio, drone: C.cyan, regen: C.lime, crit: C.amb, ricochet: C.mag, shield: '#7fd4ff', servo: C.lime };
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
    var u = clamp(Math.min(W / 600, H / 760), 0.6, 1.2), cx = W / 2, bw = Math.min(340, W - 40), bh = 52 * u, y = Math.max(30, H / 2 - 240 * u);
    var jit = Math.random() < 0.15 ? rnd(-8, 8) : 0;
    text(T.lost, cx + jit, y, 54 * u, rgba(C.red, 0.6), 'center', { w: 900, sp: 8, max: W - 20 });
    text(T.lost, cx, y, 54 * u, C.white, 'center', { w: 900, sp: 8, glow: 26, gc: C.red, max: W - 20 });
    y += 64 * u;
    var rows = [[T.score, fmt(G.score), C.white], [T.wave, G.wave + '/' + LAST, C.cyan], [T.time, clockStr(G.time), C.lime], [T.kills, String(G.kills), C.mag], [T.best, fmt(best), C.amb]];
    rows.forEach(function (r, i) { var ry = y + i * 30 * u; text(r[0], cx - 12, ry, 14 * u, rgba(C.dim, 1), 'right', { mono: true, sp: 2 }); text(r[1], cx + 12, ry, 20 * u, r[2], 'left', { mono: true, glow: 10 }); });
    y += rows.length * 30 * u + 6 * u;
    if (G.newBest) text('★ ' + T.newBest + ' ★', cx, y + 6 * u, 18 * u, C.amb, 'center', { w: 800, sp: 3, glow: 16 + 10 * Math.sin(clock * 6) });
    y += 34 * u;
    var cp = checkpoint();
    if (cp) { UI.btn('retry', cx - bw / 2, y, bw, bh, '↻  ' + T.retryCp + ' ' + (cp.wave + 1), { col: C.lime, on: function () { go('play', checkpoint()); } }); y += bh + 10 * u; }
    UI.btn('reboot', cx - bw / 2, y, bw, bh, (cp ? '' : '↻  ') + (cp ? T.newRun : T.reboot), { col: cp ? C.cyan : C.lime, on: function () { go('play'); } }); y += bh + 10 * u;
    UI.btn('omenu', cx - bw / 2, y, bw, bh, T.menu, { col: C.dim, on: function () { G = null; go('menu'); } });
    drawViz(W / 2, H - 80, Math.min(340, W - 32), 54);
  }

  function drawWin() {
    renderWorld(); ctx.fillStyle = 'rgba(3,3,10,' + Math.min(0.75, screenT) + ')'; ctx.fillRect(0, 0, W, H);
    if (Math.random() < 0.08) { var fx = rnd(W * 0.1, W * 0.9), fy = rnd(H * 0.1, H * 0.6); burst(cam.x + (fx - W / 2) / Z, cam.y + (fy - H / 2) / Z, 0, TAU, 30, 500, [C.cyan, C.mag, C.amb, C.lime][Math.floor(rnd(0, 4))]); }
    var u = clamp(Math.min(W / 600, H / 760), 0.6, 1.2), cx = W / 2, bw = Math.min(340, W - 40), bh = 52 * u, y = Math.max(30, H / 2 - 230 * u);
    text('♛', cx, y - 4, 40 * u, C.amb, 'center', { glow: 24 });
    text(T.conquered, cx, y + 50 * u, 46 * u, C.white, 'center', { w: 900, sp: 6, glow: 30, gc: C.amb, max: W - 20 });
    text(T.winSub, cx, y + 92 * u, 13 * u, rgba(C.white, 0.8), 'center', { mono: true, max: W - 30 });
    y += 130 * u;
    [[T.score, fmt(G.score), C.white], [T.time, clockStr(G.time), C.lime], [T.kills, String(G.kills), C.mag], [T.best, fmt(best), C.amb]].forEach(function (r, i) { var ry = y + i * 30 * u; text(r[0], cx - 12, ry, 14 * u, C.dim, 'right', { mono: true, sp: 2 }); text(r[1], cx + 12, ry, 20 * u, r[2], 'left', { mono: true, glow: 10 }); });
    y += 4 * 30 * u + 20 * u;
    UI.btn('wnew', cx - bw / 2, y, bw, bh, '▶  ' + T.newRun, { col: C.lime, on: function () { go('play'); } }); y += bh + 10 * u;
    UI.btn('wmenu', cx - bw / 2, y, bw, bh, T.menu, { col: C.cyan, on: function () { G = null; go('menu'); } });
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
    } else if (screen === 'online' && OG) { onlineUpdate(dt); stepFx(dt); }
    else if (screen === 'boot' || screen === 'menu' || screen === 'lobby') { attractStep(dt); stepFx(dt); }
    else if (screen === 'over') stepFx(dt * 0.4);
    else if (screen === 'win') stepFx(dt);
    FOC = screen === 'online' && OG ? (OG.L.alive ? OG.L : null) : G && G.p.alive ? G.p : null;
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
    else if (screen === 'win') drawWin();
    else if (screen === 'lobby') drawLobby();
    else if (screen === 'online' && OG) { renderOnline(); drawOnlineHUD(); }
    overlays(); reticle();
  }
  requestAnimationFrame(frame);

  /* ================================================================ test hooks (?test) */
  if (TEST) {
    window.__neon = {
      s: function () {
        return { screen: screen, mode: Voice.label(), voice: Voice.cur && Voice.cur.text, vq: Voice.q.map(function (q) { return q.id; }), fireTouch: fireTouch,
          wave: G && G.wave, phase: G && G.phase, hp: G && G.p.hp, max: G && G.p.max, alive: G && G.p.alive, px: G && Math.round(G.p.x), py: G && Math.round(G.p.y), vx: G && Math.round(G.p.vx), cd: G && G.p.cd, inv: G && G.p.inv,
          score: G && G.score, kills: G && G.kills, enemies: G ? G.en.length : 0, types: G ? G.en.map(function (e) { return e.type; }) : [], spawnLeft: G ? G.spawnLeft : 0, hostiles: G ? hostiles() : 0, time: G && G.time, cp: checkpoint(), boss: G ? G.en.filter(function (e) { return e.type === 'boss'; }).map(function (e) { return { k: e.kind, hp: Math.round(e.hp), max: Math.round(e.max), sh: !!e.shielded, ph: e.bphase }; }) : [], bullets: G ? G.bullets.length : 0, eb: G ? G.eb.length : 0,
          cards: G && G.cards, lv: G && G.lv, st: G && G.st, parts: parts.length, waves: waves.length, trauma: trauma, ui: UI.list.map(function (it) { return { id: it.id, x: it.x + it.w / 2, y: it.y + it.h / 2, dis: !!it.o.disabled }; }),
          heavy: Heavy.count(), pack: Object.keys(Voice.pack).length, ac: !!AC, qual: Qual };
      },
      scr: function () { return G ? G.en.filter(function (e) { return e.warp <= 0; }).map(function (e) { return { t: e.type, x: (e.x - cam.x) * Z + W / 2, y: (e.y - cam.y) * Z + H / 2 }; }) : []; },
      aim: function () { return G ? G.p.aim : null; },
      speed: function (x) { speedX = x; },
      spawn: function (t, dx, dy) { var e = makeEnemy(t, G.p.x + (dx || 300), G.p.y + (dy || 0), false); return G.en.length; },
      clearQueue: function () { G.spawnLeft = 0; }, killAll: function () { G.en.slice().forEach(function (e) { kill(e, 0); }); G.en = G.en.filter(function (e) { return !e.dead; }); },
      hurt: function (n) { G.p.inv = 0; hurtPlayer(n, G.p.x + 10, G.p.y); }, god: function () { G.p.inv = 1e9; }, mortal: function () { G.p.inv = 0; },
      wave: function (n) { G.wave = n - 1; G.en.length = 0; G.eb.length = 0; G.mines.length = 0; startWave(); },
      picks: function (k) { for (var i = 0; i < k; i++) { var c = rollCards(); var id = c[Math.floor(Math.random() * c.length)]; if (!id) break; UPG[id].ap(G.st, G.p); G.lv[id] = (G.lv[id] || 0) + 1; } return G.lv; },
      bossHit: function (frac) { G.en.forEach(function (e) { if (e.type === 'boss') { e.shielded = false; damage(e, e.max * frac, 0); } }); },
      dref: function (n) { return dref(n); },
      say: function (id) { Voice.say(id, { pr: 5, ttl: 9 }); }, voice: Voice,
      net: function () { return { st: Net.st, err: Net.err, url: serverUrl(), og: OG && { code: OG.code, priv: OG.priv, me: OG.me, st: OG.st, tm: OG.tm, end: OG.end && OG.end.win, alive: OG.L.alive, hp: OG.L.hp, x: Math.round(OG.L.x), y: Math.round(OG.L.y), roster: Object.keys(OG.roster).map(function (k) { var o = OG.roster[k]; return { id: o.id, name: o.name, k: o.k, d: o.d, x: Math.round(o.sx), y: Math.round(o.sy), alive: o.alive }; }), bullets: OG.bullets.length, feed: OG.feed.map(function (f) { return f.s; }) }, pad: lobbyPad }; },
      force: function (a, f) { if (OG) OG.force = a === null ? null : { a: a, f: f }; }, nsend: function (m) { Net.send(m); }
    };
  }
})();
