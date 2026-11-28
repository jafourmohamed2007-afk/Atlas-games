/* ===== ASHEN VIGIL: Web Audio synth SFX, procedural chiptune, narrator voice ===== */
const AU = {
  ctx: null, master: null, music: null, sfx: null, voice: null, analyser: null, noise: null, last: {}, combo: 0, comboT: 0, live: 0,
  vol: { master: 0.8, music: 0.55, sfx: 0.7 },
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.connect(c.destination);
    this.music = c.createGain(); this.music.connect(this.master);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    // voice bus: dry + short dark echo, then analyser for the rune visualizer
    this.voice = c.createGain(); this.analyser = c.createAnalyser(); this.analyser.fftSize = 256; this.analyser.smoothingTimeConstant = 0.6;
    const dly = c.createDelay(1), fb = c.createGain(), lp = c.createBiquadFilter();
    dly.delayTime.value = 0.19; fb.gain.value = 0.28; lp.type = 'lowpass'; lp.frequency.value = 1400;
    this.voice.connect(this.analyser); this.voice.connect(dly); dly.connect(lp); lp.connect(fb); fb.connect(dly); lp.connect(this.analyser);
    this.analyser.connect(this.master);
    const len = c.sampleRate * 1.5, nb = c.createBuffer(1, len, c.sampleRate), ch = nb.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    this.noise = nb;
    this.applyVol();
    VO.decodeAll();
    MUS.start();
  },
  applyVol() {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.vol.master, t, 0.02);
    this.music.gain.setTargetAtTime(this.vol.music * 0.5 * (VO.speaking ? 0.45 : 1), t, 0.08);
    this.sfx.gain.setTargetAtTime(this.vol.sfx * 0.6, t, 0.02);
    this.voice.gain.setTargetAtTime(1.15, t, 0.02);
  },
  can(name, ms) { const n = performance.now(); if (n - (this.last[name] || 0) < ms) return false; this.last[name] = n; return true; },
  tone(f, dur, type, vol, slide, dest, when, attack) {
    const c = this.ctx; if (!c) return;
    const t = when || c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + (attack || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + dur + 0.02);
  },
  burst(dur, vol, freq, type, dest, when, q) {
    const c = this.ctx; if (!c) return;
    const t = when || c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; f.type = type || 'lowpass'; f.frequency.value = freq || 2000; f.Q.value = q || 0.7;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfx); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  // ---- SFX ----
  slash() { if (!this.can('slash', 60)) return; this.burst(0.12, 0.35, 3200, 'bandpass', 0, 0, 1.2); this.tone(520, 0.09, 'square', 0.07, 180); },
  zap() { if (!this.can('zap', 70)) return; this.tone(300, 0.12, 'sawtooth', 0.06, 1200); this.tone(900, 0.08, 'square', 0.03, 1600); },
  twang() { if (!this.can('twang', 70)) return; this.tone(700, 0.14, 'triangle', 0.12, 260); this.burst(0.04, 0.12, 5000, 'highpass'); },
  thunder() { if (!this.can('thunder', 90)) return; this.burst(0.35, 0.45, 900, 'lowpass'); this.tone(120, 0.3, 'sawtooth', 0.08, 40); },
  chain() { if (!this.can('chain', 90)) return; this.tone(1400, 0.1, 'square', 0.04, 500); this.burst(0.08, 0.15, 6000, 'highpass'); },
  glass() { if (!this.can('glass', 90)) return; this.tone(1800, 0.06, 'triangle', 0.06, 2600); this.burst(0.15, 0.2, 3000, 'bandpass'); },
  hit() { if (!this.can('hit', 45)) return; this.tone(180 + Math.random() * 60, 0.05, 'square', 0.05, 90); },
  pop() { if (!this.can('pop', 55)) return; this.burst(0.07, 0.18, 1400, 'lowpass'); },
  blip() {
    if (!this.can('blip', 28)) return;
    this.combo = this.comboT > 0 ? Math.min(this.combo + 1, 24) : 0; this.comboT = 0.45;
    const f = 660 * Math.pow(2, this.combo / 12); this.tone(f, 0.06, 'square', 0.05, f * 1.5);
  },
  coin() { if (!this.can('coin', 50)) return; this.tone(988, 0.06, 'square', 0.05); this.tone(1319, 0.12, 'square', 0.05, 0, 0, this.ctx && this.ctx.currentTime + 0.06); },
  levelup() { if (!this.ctx) return; const t = this.ctx.currentTime;[523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.16, 'square', 0.07, 0, 0, t + i * 0.06)); },
  boom() { if (!this.can('boom', 80)) return; this.burst(0.5, 0.6, 600, 'lowpass'); this.tone(90, 0.35, 'triangle', 0.25, 30); },
  hurt() { if (!this.can('hurt', 120)) return; this.tone(220, 0.15, 'sawtooth', 0.1, 70); this.burst(0.1, 0.2, 800); },
  heal() { if (!this.ctx) return; const t = this.ctx.currentTime;[440, 554, 659].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.08, 0, 0, t + i * 0.05)); },
  chestOpen() { if (!this.ctx) return; const t = this.ctx.currentTime;[392, 494, 587, 784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.22, 'square', 0.06, 0, 0, t + i * 0.08)); this.burst(0.8, 0.2, 7000, 'highpass', 0, t + 0.5); },
  smite() { this.burst(1.2, 0.5, 2500, 'bandpass'); this.tone(1047, 0.8, 'triangle', 0.1, 523); this.tone(1568, 0.8, 'triangle', 0.08, 784); },
  dash() { if (!this.can('dash', 80)) return; this.burst(0.18, 0.3, 1800, 'bandpass'); this.tone(300, 0.15, 'triangle', 0.06, 900); },
  buy() { if (!this.ctx) return; const t = this.ctx.currentTime;[784, 988, 1319].forEach((f, i) => this.tone(f, 0.12, 'square', 0.06, 0, 0, t + i * 0.05)); },
  click() { if (!this.can('click', 40)) return; this.tone(880, 0.04, 'square', 0.05, 660); },
  hover() { if (!this.can('hover', 50)) return; this.tone(1320, 0.025, 'square', 0.02); },
  deny() { this.tone(200, 0.15, 'square', 0.06, 120); },
  // the "rune chime" used when a voice clip is missing (routed through the voice bus so the visualizer reacts)
  chime() {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    [[659, 0], [988, 0.12], [1319, 0.24], [880, 0.42]].forEach(([f, d]) => { this.tone(f, 1.0, 'triangle', 0.12, 0, this.voice, t + d, 0.01); this.tone(f * 2.01, 0.6, 'sine', 0.04, 0, this.voice, t + d); });
  }
};

// ---- procedural chiptune: D minor, layers unlock with intensity (0..5) ----
const MUS = {
  next: 0, step: 0, timer: null, intensity: 0, mode: 'title',
  start() { if (this.timer || !AU.ctx) return; this.next = AU.ctx.currentTime + 0.1; this.timer = setInterval(() => this.tick(), 25); },
  bpm() { return this.mode === 'title' ? 84 : this.mode === 'boss' ? 138 : 104 + this.intensity * 5; },
  tick() {
    const c = AU.ctx; if (!c || c.state !== 'running') return;
    if (this.mode === 'off') { this.next = c.currentTime + 0.05; return; }
    while (this.next < c.currentTime + 0.12) { this.play(this.step, this.next); this.next += 60 / this.bpm() / 4; this.step++; }
  },
  play(step, t) {
    const s = step % 16, bar = Math.floor(step / 16) % 4, I = this.mode === 'boss' ? 5 : this.mode === 'title' ? -1 : this.intensity, d = AU.music;
    const ROOT = [73.42, 58.27, 65.41, 55.0][bar];            // D, Bb, C, A
    const CH = [[293.7, 349.2, 440], [233.1, 293.7, 349.2], [261.6, 329.6, 392], [220, 261.6, 329.6]][bar];
    if (I < 0) { // title: slow drone + sparse bell
      if (s === 0) { AU.tone(ROOT, 1.9, 'triangle', 0.22, 0, d, t, 0.2); AU.tone(ROOT * 1.5, 1.9, 'triangle', 0.08, 0, d, t, 0.3); }
      if (s % 4 === 2 && Math.random() < 0.5) AU.tone(CH[(s / 4 | 0) % 3] * 2, 0.5, 'sine', 0.05, 0, d, t);
      return;
    }
    if ([0, 3, 6, 8, 11, 14].includes(s)) AU.tone(ROOT * (s === 6 || s === 14 ? 2 : 1), 0.18, 'triangle', 0.3, 0, d, t);
    if (I >= 1) AU.tone(CH[s % 3] * (s % 6 < 3 ? 1 : 2), 0.08, 'square', 0.03, 0, d, t);
    if (I >= 2 && (s === 0 || s === 8 || (I >= 3 && (s === 4 || s === 12)))) AU.tone(150, 0.12, 'sine', 0.35, 40, d, t);
    if (I >= 2 && (s === 4 || s === 12)) AU.burst(0.1, 0.14, 1800, 'bandpass', d, t);
    if (I >= 3 && s % 2 === 1) AU.burst(0.03, 0.06, 8000, 'highpass', d, t);
    if (I >= 4) {
      const MEL = [[587, 0, 698, 0, 659, 0, 587, 0, 523, 0, 587, 0, 0, 440, 0, 0], [466, 0, 587, 0, 698, 0, 659, 587, 0, 0, 523, 0, 466, 0, 0, 0],
        [523, 0, 659, 0, 784, 0, 698, 0, 659, 0, 587, 0, 523, 0, 0, 0], [440, 0, 523, 0, 659, 0, 554, 0, 440, 0, 0, 0, 554, 0, 659, 0]][bar];
      if (MEL[s]) AU.tone(MEL[s], 0.2, 'square', 0.035, 0, d, t);
    }
    if (I >= 5 && s % 4 === 0) AU.tone(ROOT * 4, 0.1, 'sawtooth', 0.03, ROOT * 2, d, t);
  }
};

// ---- narrator voice (ElevenLabs clips embedded as data URIs) ----
const VOICE_DATA = /*__VOICE_DATA__*/{};
const VO = {
  lines: {
    start: { t: 'The night begins. Survive.', cd: 30 },
    level: { t: 'Level up. Choose your power.', cd: 45 },
    swarm: { t: 'They come in swarms. Keep moving!', cd: 40 },
    evil: { t: 'A great evil approaches.', cd: 40 },
    evolve: { t: 'Your weapon awakens... evolved!', cd: 8 },
    lowhp: { t: 'Health critical. Find light!', cd: 35 },
    reaper: { t: 'The Reaper has come for you.', cd: 30 },
    win: { t: 'Dawn breaks. You have survived the vigil.', cd: 5 },
    dead: { t: 'You have fallen. The vigil ends.', cd: 5 },
    merchant: { t: 'A merchant emerges from the mist. Trade, if you dare.', cd: 90 },
    endless: { t: 'The night returns... and it will never end.', cd: 10 },
    boss: { t: 'Another horror rises from the dark.', cd: 40 }
  },
  buf: {}, failed: {}, last: {}, pending: null, speaking: false, until: 0, src: null, sub: '', subT: 0, subMax: 1, decoded: false, cur: '',
  decodeAll() {
    if (this.decoded || !AU.ctx) return; this.decoded = true;
    for (const k in this.lines) {
      const uri = VOICE_DATA[k];
      if (!uri || uri.indexOf('base64,') < 0) { this.failed[k] = true; continue; }
      try {
        const bin = atob(uri.split('base64,')[1]), arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        const ok = (b) => { this.buf[k] = b; }, bad = () => { this.failed[k] = true; };
        const p = AU.ctx.decodeAudioData(arr.buffer, ok, bad);
        if (p && p.catch) p.catch(bad);
      } catch (e) { this.failed[k] = true; }
    }
  },
  // prio: high lines (win/dead/reaper) interrupt; others are dropped while the narrator speaks
  say(k, high) {
    const L = this.lines[k]; if (!L) return false;
    const now = performance.now() / 1000;
    if (this.last[k] && now - this.last[k] < L.cd) return false;
    if (this.speaking && now < this.until && !high) return false;
    // clip still decoding: hold the line briefly instead of falling back to the chime
    if (AU.ctx && !this.buf[k] && !this.failed[k] && VOICE_DATA[k] && !(this.pending && this.pending.k === k && now - this.pending.t > 1.5)) {
      if (!this.pending || this.pending.k !== k) this.pending = { k, high, t: now };
      return false;
    }
    this.pending = null;
    this.last[k] = now;
    if (this.src) { try { this.src.stop(); } catch (e) { } this.src = null; }
    const b = this.buf[k];
    let dur = 2.4;
    if (AU.ctx && b) {
      try {
        const s = AU.ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = 0.93; s.connect(AU.voice); s.start();
        this.src = s; dur = b.duration / 0.93;
        s.onended = () => { if (this.src === s) { this.src = null; } };
      } catch (e) { AU.chime(); }
    } else AU.chime(); // missing or undecodable clip: rune chime + subtitles only
    this.cur = k; this.speaking = true; this.until = now + dur; this.sub = L.t; this.subMax = dur + 0.8; this.subT = this.subMax;
    AU.applyVol();
    return true;
  },
  update(dt) {
    if (this.pending) this.say(this.pending.k, this.pending.high);
    if (this.subT > 0) this.subT -= dt;
    if (this.speaking && performance.now() / 1000 > this.until) { this.speaking = false; AU.applyVol(); }
  },
  stop() { this.pending = null; if (this.src) { try { this.src.stop(); } catch (e) { } } this.src = null; this.speaking = false; this.subT = 0; AU.applyVol(); }
};
