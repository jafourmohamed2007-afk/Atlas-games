/* ===== 03 audio: Web Audio synth SFX, procedural chiptune music, embedded narrator voice + visualizer ===== */
var VOICE_DATA = __VOICE_JSON__;   // base64 mp3 data URIs, filled in by tools/build-ashen-vigil.js (no runtime API calls)
var LINES = {
  start: 'The night begins. Survive.', levelup: 'Level up. Choose your power.', swarm: 'They come in swarms. Keep moving!',
  boss: 'A great evil approaches.', evolve: 'Your weapon awakens... evolved!', lowhp: 'Health critical. Find light!',
  reaper: 'The Reaper has come for you.', win: 'Dawn breaks. You have survived the vigil.', lose: 'You have fallen. The vigil ends.'
};
var LINE_COOL = { start: 5, levelup: 20, swarm: 30, boss: 25, evolve: 5, lowhp: 30, reaper: 5, win: 1, lose: 1 };

var AC = null, masterG, musicG, sfxG, voiceG, analyser, anaData, noiseBuf;
var voiceBuf = {}, voiceBad = {}, voiceSrc = null, voiceUntil = 0, voiceGapUntil = 0, voicePrio = 0, voiceCool = {};
var sub = { text: '', t0: 0, dur: 0 }, voiceLive = false;

function pnow() { return performance.now() / 1000; }
function applyVol() {
  if (!AC) return;
  masterG.gain.value = save.vol.m; musicG.gain.value = save.vol.mu * 0.55; sfxG.gain.value = save.vol.s; voiceG.gain.value = 1.15;
}
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    AC = new C();
    masterG = AC.createGain(); var comp = AC.createDynamicsCompressor();
    masterG.connect(comp); comp.connect(AC.destination);
    musicG = AC.createGain(); sfxG = AC.createGain(); voiceG = AC.createGain();
    musicG.connect(masterG); sfxG.connect(masterG); voiceG.connect(masterG);
    analyser = AC.createAnalyser(); analyser.fftSize = 128; analyser.smoothingTimeConstant = 0.6;
    anaData = new Uint8Array(analyser.frequencyBinCount); voiceG.connect(analyser);
    noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = M.random() * 2 - 1;
    applyVol(); decodeVoices();
  } catch (e) { AC = null; }
}
function decodeVoices() {
  Object.keys(LINES).forEach(function (k) {
    try {
      var uri = VOICE_DATA[k]; if (!uri) { voiceBad[k] = 1; return; }
      var bin = atob(uri.split(',')[1]), u8 = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      var ok = function (b) { voiceBuf[k] = b; }, bad = function () { voiceBad[k] = 1; };
      var p = AC.decodeAudioData(u8.buffer, ok, bad);
      if (p && p.catch) p.catch(bad);
    } catch (e) { voiceBad[k] = 1; }
  });
}

/* ---- synth voices ---- */
function tone(freq, dur, type, vol, slide, delay, dest) {
  if (!AC) return;
  var t = AC.currentTime + (delay || 0), o = AC.createOscillator(), gn = AC.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(M.max(20, freq * slide), t + dur);
  gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(vol, t + 0.008); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(gn); gn.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, freq, q, type, delay, dest, sweep) {
  if (!AC) return;
  var t = AC.currentTime + (delay || 0), s = AC.createBufferSource(), f = AC.createBiquadFilter(), gn = AC.createGain();
  s.buffer = noiseBuf; f.type = type || 'lowpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 1;
  if (sweep) f.frequency.exponentialRampToValueAtTime(M.max(40, sweep), t + dur);
  gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(gn); gn.connect(dest || sfxG); s.start(t, M.random() * 0.5); s.stop(t + dur + 0.02);
}
var sfxLast = {}, comboN = 0, comboT = 0;
var SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26];
function sfx(name, p) {
  if (!AC || AC.state !== 'running') return;
  var now = AC.currentTime, gap = { hit: 0.05, kill: 0.04, gem: 0.02, slash: 0.08, zap: 0.06, twang: 0.06, hurt: 0.15, orb: 0.1, fire: 0.1, boom: 0.08 }[name] || 0.03;
  if (sfxLast[name] && now - sfxLast[name] < gap) return; sfxLast[name] = now;
  switch (name) {
    case 'slash': noise(0.14, 0.35, 3200, 0.8, 'bandpass', 0, null, 600); tone(300, 0.1, 'square', 0.07, 0.4); break;
    case 'zap': tone(900, 0.16, 'sawtooth', 0.08, 0.25); tone(1400, 0.1, 'square', 0.05, 0.5, 0.03); break;
    case 'twang': tone(520, 0.14, 'triangle', 0.14, 0.5); noise(0.05, 0.1, 2500, 1, 'highpass'); break;
    case 'thunder': noise(0.4, 0.5, 1800, 1, 'lowpass', 0, null, 120); tone(90, 0.3, 'sawtooth', 0.15, 0.3); break;
    case 'fire': noise(0.3, 0.25, 900, 1, 'lowpass', 0, null, 200); break;
    case 'orb': tone(660, 0.08, 'triangle', 0.05, 1.3); break;
    case 'hit': tone(180, 0.05, 'square', 0.06, 0.6); break;
    case 'kill': noise(0.08, 0.14, 1800, 1, 'bandpass'); tone(240, 0.07, 'square', 0.05, 0.4); break;
    case 'gem': {
      var step = SCALE[M.min(comboN, SCALE.length - 1)];
      tone(523 * M.pow(2, step / 12), 0.09, 'square', 0.07); tone(523 * M.pow(2, step / 12) * 2, 0.06, 'triangle', 0.04, 1, 0.03);
      break;
    }
    case 'coin': tone(988, 0.07, 'square', 0.07); tone(1319, 0.14, 'square', 0.07, 1, 0.06); break;
    case 'heal': [392, 494, 587, 784].forEach(function (f, i) { tone(f, 0.12, 'triangle', 0.12, 1, i * 0.06); }); break;
    case 'hurt': noise(0.18, 0.4, 700, 1, 'lowpass', 0, null, 150); tone(140, 0.2, 'sawtooth', 0.14, 0.4); break;
    case 'boom': noise(0.55, 0.7, 1400, 0.7, 'lowpass', 0, null, 70); tone(70, 0.4, 'sine', 0.35, 0.3); break;
    case 'level': [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, 0.16, 'square', 0.1, 1, i * 0.07); tone(f / 2, 0.16, 'triangle', 0.1, 1, i * 0.07); }); break;
    case 'chime': [880, 1175, 1568].forEach(function (f, i) { tone(f, 0.5, 'sine', 0.12, 1, i * 0.12); tone(f * 2, 0.3, 'triangle', 0.04, 1, i * 0.12); }); break;
    case 'click': tone(660, 0.05, 'square', 0.06); break;
    case 'pick': tone(440, 0.06, 'square', 0.08); tone(660, 0.1, 'square', 0.08, 1, 0.05); break;
    case 'chest': [262, 330, 392, 523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.22, 'square', 0.09, 1, i * 0.08); }); break;
    case 'evolve': [392, 523, 659, 784, 1047, 1319, 1568].forEach(function (f, i) { tone(f, 0.3, 'sawtooth', 0.07, 1, i * 0.07); tone(f / 2, 0.3, 'square', 0.05, 1, i * 0.07); }); noise(0.8, 0.2, 5000, 1, 'highpass', 0.3); break;
    case 'bossroar': tone(70, 0.9, 'sawtooth', 0.22, 0.6); tone(95, 0.9, 'square', 0.1, 0.5, 0.05); noise(0.8, 0.3, 500, 1, 'lowpass'); break;
    case 'smite': noise(0.7, 0.6, 6000, 1, 'highpass', 0, null, 300); tone(1200, 0.6, 'sawtooth', 0.1, 0.2); break;
    case 'win': [523, 659, 784, 1047, 784, 1047, 1319].forEach(function (f, i) { tone(f, 0.28, 'square', 0.1, 1, i * 0.12); }); break;
    case 'lose': [392, 349, 311, 262, 196].forEach(function (f, i) { tone(f, 0.4, 'sawtooth', 0.1, 1, i * 0.2); }); break;
  }
}
function gemCombo() { comboN = M.min(comboN + 1, 11); comboT = 0.75; }

/* ---- procedural chiptune: a small A-minor loop whose tempo and layers grow with the run ---- */
var music = { step: 0, next: 0, intensity: 0, on: false };
var CHORDS = [[45, [57, 60, 64, 69]], [41, [53, 57, 60, 65]], [43, [55, 59, 62, 67]], [40, [52, 56, 59, 64]]];
var LEAD = [69, 0, 72, 0, 76, 0, 72, 69, 67, 0, 71, 0, 74, 0, 71, 67];
function mtof(m) { return 440 * M.pow(2, (m - 69) / 12); }
function musicStep(st, t) {
  var bar = (st >> 4) & 3, s = st & 15, ch = CHORDS[bar], I = music.intensity, o, gn;
  function n(m, dur, type, vol, dest) {
    var os = AC.createOscillator(), gg = AC.createGain();
    os.type = type; os.frequency.value = mtof(m);
    gg.gain.setValueAtTime(0.0001, t); gg.gain.linearRampToValueAtTime(vol, t + 0.01); gg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    os.connect(gg); gg.connect(musicG); os.start(t); os.stop(t + dur + 0.02);
  }
  if (s === 0 || s === 6 || s === 8 || (I > 0.3 && s === 11) || (I > 0.5 && s === 14)) n(ch[0], 0.22, 'triangle', 0.5);
  if (I > 0.12 && (s % 2 === 0 || I > 0.6)) n(ch[1][(s >> 1) % 4] + (s % 4 === 2 ? 12 : 0), 0.12, 'square', 0.08 + I * 0.04);
  if (I > 0.5 && LEAD[s]) n(LEAD[s] + (bar === 3 ? -1 : 0), 0.2, 'square', 0.07);
  if (s === 0 || s === 8 || (I > 0.35 && (s === 4 || s === 12 || s === 10))) { // kick
    var k = AC.createOscillator(), kg = AC.createGain();
    k.frequency.setValueAtTime(150, t); k.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    kg.gain.setValueAtTime(0.7, t); kg.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    k.connect(kg); kg.connect(musicG); k.start(t); k.stop(t + 0.16);
  }
  if (I > 0.18 && (s === 4 || s === 12)) { noise(0.12, 0.35, 1800, 1, 'bandpass', t - AC.currentTime, musicG); }
  if (I > 0.3 && (s % 2 === 0 || I > 0.65)) { noise(0.03, 0.12, 8000, 1, 'highpass', t - AC.currentTime, musicG); }
}
function musicTick(dt) {
  comboT -= dt; if (comboT <= 0) comboN = 0;
  if (!AC || AC.state !== 'running' || !music.on) return;
  var now = AC.currentTime, bpm = 84 + 56 * music.intensity, len = 60 / bpm / 4;
  if (music.next < now - 0.2) music.next = now + 0.05;
  var guard = 0;
  while (music.next < now + 0.25 && guard++ < 8) { musicStep(music.step, music.next); music.next += len; music.step = (music.step + 1) & 63; }
}

/* ---- narrator ---- */
function say(key, prio) {
  prio = prio || 1;
  var t = pnow(), line = LINES[key]; if (!line) return;
  if (voiceCool[key] && t < voiceCool[key]) return;
  if (t < voiceUntil && prio <= voicePrio) return;          // never overlap, never spam
  if (t < voiceGapUntil && prio < 3) return;
  if (voiceSrc) { try { voiceSrc.stop(); } catch (e) { /* done */ } voiceSrc = null; }
  var dur = 2.6;
  if (AC && AC.state === 'running' && voiceBuf[key]) {
    try {
      var s = AC.createBufferSource(); s.buffer = voiceBuf[key]; s.connect(voiceG); s.start(); voiceSrc = s;
      dur = voiceBuf[key].duration; voiceLive = true;
      s.onended = function () { if (voiceSrc === s) { voiceSrc = null; } };
    } catch (e) { voiceBuf[key] = null; voiceBad[key] = 1; sfx('chime'); voiceLive = false; }
  } else { sfx('chime'); voiceLive = false; }               // missing/blocked clip: subtitles + rune chime
  voiceUntil = t + dur; voiceGapUntil = voiceUntil + 1.4; voicePrio = prio;
  voiceCool[key] = t + (LINE_COOL[key] || 10);
  sub.text = line; sub.t0 = t; sub.dur = dur;
}
function voiceActive() { return pnow() < voiceUntil; }
