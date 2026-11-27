/* Adaptive game music (Ink Heroes, Arrow Rampart via GameMusic(opts)), synthesised with the kit's voices (no audio files).
   One 16-step sequencer; the "mood" picks tempo, drums, bass and lead layers:
   menu (dark pad), cut (soft pad), explore (tense pulse), fight (drums + bass), boss (faster, heavier).
   Notes are scheduled a little ahead of K.time so frame hiccups do not make it stutter.
   Respects the kit's mute button (the kit voices are silent while muted). */
(function () {
  'use strict';
  var A4 = 440, midi = function (n) { return A4 * Math.pow(2, (n - 69) / 12); };
  // D minor: i - VI - VII - v  (Dm, Bb, C, Am), one chord per bar
  var PROG = [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 48, 52]];
  var MOODS = {
    menu: { bpm: 84, pad: 0.035, bass: 0, kick: 0, snare: 0, hat: 0, lead: 0.018, arp: 0 },
    cut: { bpm: 72, pad: 0.03, bass: 0, kick: 0, snare: 0, hat: 0, lead: 0, arp: 0.012 },
    explore: { bpm: 96, pad: 0.02, bass: 0.06, kick: 0.25, snare: 0, hat: 0.03, lead: 0, arp: 0.012, sparse: true },
    fight: { bpm: 128, pad: 0.016, bass: 0.075, kick: 0.42, snare: 0.16, hat: 0.045, lead: 0.022, arp: 0 },
    boss: { bpm: 142, pad: 0.02, bass: 0.09, kick: 0.5, snare: 0.2, hat: 0.05, lead: 0.026, arp: 0.012, heavy: true }
  };
  var KICK = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0], SNARE = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
  var BASS = [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1], BASS_OFF = [0, 0, 12, 0, 0, 0, 12, 7, 0, 0, 12, 0, 0, 0, 7, 12];
  var LEAD = [[0, 2], [3, 1], [4, 1], [6, 2], [10, 1], [11, 1], [12, 3]], LEAD_NOTES = [62, 65, 64, 62, 60, 62, 57];
  /* Recorded audio (ElevenLabs, games/audio/ink-heroes/*.mp3): loaded on first use, played through the kit's
     master bus. Anything missing (offline, file://, an old browser) falls back to the synth above. */
  var BASE = 'audio/ink-heroes/';
  // one game sound name → several recordings, picked at random (zombie / civilian voices)
  var VARIANTS = { groan: ['groan', 'groan2', 'groan3'], zatk: ['z_attack1', 'z_attack2', 'z_attack3'], zbite: ['z_bite1', 'z_bite2', 'z_bite3'], zdie: ['z_die1', 'z_die2', 'z_die3'],
    chelp: ['c_help1', 'c_help2', 'c_help3'], cscream: ['c_scream1', 'c_scream2'], cthanks: ['c_thanks1', 'c_thanks2'] };
  var SFX_FILES = ['groan2', 'groan3', 'z_attack1', 'z_attack2', 'z_attack3', 'z_bite1', 'z_bite2', 'z_bite3', 'z_die1', 'z_die2', 'z_die3', 'c_help1', 'c_help2', 'c_help3', 'c_scream1', 'c_scream2', 'c_thanks1', 'c_thanks2','hit', 'punch', 'heavy', 'whoosh', 'groan', 'boom', 'land', 'jump', 'boss', 'reload', 'shot', 'block', 'pop', 'combo', 'reward', 'star', 'coin', 'over', 'click', 'flip', 'win'];
  var bufs = {}, loading = {};
  function load(K, name) {
    if (bufs[name] || loading[name] || !window.fetch || location.protocol === 'file:') return bufs[name] || null;
    var o = K.audioOut(); if (!o) return null;
    loading[name] = true;
    fetch(BASE + name + '.mp3').then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then(function (ab) { return new Promise(function (res, rej) { o.ctx.decodeAudioData(ab, res, rej); }); })
      .then(function (b) { bufs[name] = b; }, function () { bufs[name] = null; loading[name] = 'failed'; });
    return null;
  }
  function make(opts) { // opts (other games): { base, sfx: [file names], variants: { name: [files] } }
    if (opts) { if (opts.base) BASE = opts.base; if (opts.sfx) SFX_FILES = opts.sfx; if (opts.variants) VARIANTS = opts.variants; }
    var rec = null, recMood = '', lastCall = 0, watch = 0;
    function recPlay(K, m, track) { // crossfade to the recorded loop for this mood/track; returns false if it is not ready
      var o = K.audioOut && K.audioOut(); if (!o) return false;
      var key = 'm_' + (track || (m === 'cut' ? 'menu' : m)), b = load(K, key);
      if (!b && track && loading[key] === 'failed') { key = 'm_' + (m === 'cut' ? 'menu' : m); b = load(K, key); } // a missing track falls back to the base one
      if (recMood === key && rec) { rec.g.gain.setTargetAtTime(o.muted ? 0 : (m === 'explore' ? 0.5 : 0.62), o.ctx.currentTime, 0.2); return true; }
      if (!b) return false;
      recStop(o, 0.6);
      var src = o.ctx.createBufferSource(), g = o.ctx.createGain(); src.buffer = b; src.loop = true; src.loopStart = 0.03; src.loopEnd = b.duration - 0.03;
      g.gain.value = 0.0001; g.gain.setTargetAtTime(o.muted ? 0 : 0.62, o.ctx.currentTime, 0.35); src.connect(g); g.connect(o.out); src.start();
      rec = { src: src, g: g }; recMood = key; return true;
    }
    function recStop(o, fade) { if (!rec) return; var r = rec; rec = null; recMood = ''; try { r.g.gain.setTargetAtTime(0.0001, o.ctx.currentTime, fade / 3); r.src.stop(o.ctx.currentTime + fade + 0.1); } catch (e) { } }
    var api = make0();
    var synthMood = api.mood;
    api.mood = function (K, m, track) {
      lastCall = Date.now();
      if (!watch) watch = setInterval(function () { if (Date.now() - lastCall > 300 && rec) { var o = K.audioOut(); if (o) recStop(o, 0.4); } }, 250); // paused / hidden tab: fade out
      if (recPlay(K, MOODS[m] ? m : 'menu', track)) { synthMood(K, '__off'); return; }
      synthMood(K, m);
    };
    api.sfx = function (K, n) { // a recorded sample when it is loaded; false = let the kit synth play it
      var o = K.audioOut && K.audioOut(); if (VARIANTS[n]) { var vs = VARIANTS[n], pickN = vs[Math.floor(Math.random() * vs.length)]; if (!o || !load(K, pickN)) pickN = vs[0]; n = pickN; }
      if (!o || o.muted || SFX_FILES.indexOf(n) < 0) return false;
      var b = load(K, n); if (!b) return false;
      var now = o.ctx.currentTime; if (api._last[n] && now - api._last[n] < 0.045) return true; api._last[n] = now;
      var src = o.ctx.createBufferSource(), g = o.ctx.createGain(); src.buffer = b; src.playbackRate.value = 0.94 + Math.random() * 0.12; g.gain.value = n === 'click' ? 0.45 : 0.8;
      src.connect(g); g.connect(o.out); src.start(); return true;
    };
    api._last = {};
    api.preload = function (K) { SFX_FILES.forEach(function (n) { load(K, n); }); };
    return api;
  }
  function make0() {
    var cur = 'off', want = 'menu', step = 0, nextT = -1, vol = 0, fadeTo = 1, bar = 0;
    function sched(K, m, t, s) {
      var S = K.synth, at = Math.max(0, t - K.time), ch = PROG[bar % 4], g = vol;
      if (g <= 0.01) return;
      var sp = 60 / m.bpm / 4; // seconds per 16th
      if (m.pad && s === 0) ch.forEach(function (n, i) { S.voice({ f: midi(n), w: 'sawtooth', vol: m.pad * g * (i ? 0.7 : 1), a: 0.4, h: sp * 12, r: 0.9, lp: 700 + (m.heavy ? 500 : 0), at: at }); S.voice({ f: midi(n) * 1.006, w: 'triangle', vol: m.pad * g * 0.6, a: 0.5, h: sp * 12, r: 0.9, at: at }); });
      if (m.kick && KICK[s] && !(m.sparse && s % 8)) S.voice({ f: [[0, 150], [0.09, 48]], w: 'sine', vol: m.kick * g, a: 0.002, r: 0.22, at: at });
      if (m.snare && SNARE[s]) { S.noiseVoice({ bp: 1900, q: 0.8, vol: m.snare * g, r: 0.14, at: at }); S.voice({ f: [[0, 230], [0.05, 160]], w: 'triangle', vol: m.snare * g * 0.5, r: 0.08, at: at }); }
      if (m.hat && (s % 2 === 0 || m.heavy)) S.noiseVoice({ hp: 7000, vol: m.hat * g * (s % 4 === 2 ? 1 : 0.55), r: 0.035, at: at });
      if (m.bass && BASS[s] && !(m.sparse && s % 4)) S.voice({ f: midi(ch[0] - 24 + (m.sparse ? 0 : BASS_OFF[s])), w: m.heavy ? 'sawtooth' : 'square', vol: m.bass * g, a: 0.004, h: sp * 0.6, r: 0.08, lp: m.heavy ? 900 : 600, drive: m.heavy ? 2 : 0, at: at });
      if (m.arp && s % 2 === 0) S.voice({ f: midi(ch[(s / 2) % 3] + 12 + ((s / 2) % 4 === 3 ? 12 : 0)), w: 'triangle', vol: m.arp * g, a: 0.004, r: 0.18, hp: 400, at: at });
      if (m.lead && bar % 2 === 1) LEAD.forEach(function (l, i) { if (l[0] === s) S.voice({ f: midi(LEAD_NOTES[i] + (bar % 4 === 3 ? -2 : 0) + (m.heavy ? 12 : 0)), w: 'square', vol: m.lead * g, a: 0.01, h: sp * l[1] * 0.7, r: 0.12, lp: 2400, vib: [5.5, [[0, 0], [0.3, 0.25]]], at: at }); });
    }
    return {
      mood: function (K, m) {
        if (m === '__off') { cur = 'off'; want = 'off'; nextT = -1; vol = 0; return; }
        want = MOODS[m] ? m : 'menu';
        if (!K.synth || (K.synth.muted && K.synth.muted())) { nextT = -1; return; }
        if (cur !== want) { // short fade-out, then the new groove starts on its downbeat
          fadeTo = 0; vol = Math.max(0, vol - (K.dt || 0.016) * 4);
          if (vol <= 0.02 || nextT < 0) { cur = want; step = 0; bar = 0; nextT = K.time + 0.05; fadeTo = 1; }
        } else vol = Math.min(fadeTo, vol + (K.dt || 0.016) * 1.5);
        if (cur === 'off') return;
        var M = MOODS[cur], sp = 60 / M.bpm / 4;
        if (nextT < 0 || nextT < K.time - 0.5) nextT = K.time + 0.05; // resync after a pause or a long frame
        while (nextT < K.time + 0.18) { sched(K, M, nextT, step); step = (step + 1) % 16; if (!step) bar++; nextT += sp; }
      },
      stop: function () { cur = 'off'; nextT = -1; vol = 0; },
      state: function () { return { mood: cur, want: want, vol: vol, bar: bar }; }
    };
  }
  window.InkMusic = make; window.GameMusic = make; // GameMusic: the same player for other Bubzi games (tools/build.js MODULES)
})();
