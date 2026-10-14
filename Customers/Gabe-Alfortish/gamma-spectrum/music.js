// =========================================================
// GAMMA SPECTRUM — ambient soundtrack (original, generated live with WebAudio)
// Calm sci-fi atmosphere: a low reactor hum, slow evolving pads, soft data blips as if
// classified shoe files were being opened, a faint geiger crackle and an occasional scanner sweep.
// =========================================================
(() => {
  const btn = document.querySelector('[data-music]');
  if (!btn) return;
  const label = btn.querySelector('.music-btn__label');

  let ctx = null, out = null, dry = null, verb = null, timer = null, playing = false;
  let nextPad = 0, nextBlip = 0, nextBell = 0, nextSweep = 0, nextCrackle = 0, chord = 0;
  const hum = [];
  const N = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // Slow progression, ~10 s per chord: Am(add9) – Fmaj7 – Cmaj7/G – Em7
  const CHORDS = [[57, 60, 64, 71], [53, 57, 60, 64], [55, 60, 64, 71], [52, 55, 59, 62]];
  const PENTA = [69, 72, 74, 76, 79, 81, 84];   // A minor pentatonic for the bells
  const PAD_LEN = 10;

  function impulse(seconds, decay) {
    const len = ctx.sampleRate * seconds, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  }

  function setup() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination);
    dry = ctx.createGain(); dry.gain.value = 0.55; dry.connect(out);
    verb = ctx.createConvolver(); verb.buffer = impulse(5, 2.6);
    const wet = ctx.createGain(); wet.gain.value = 0.75; verb.connect(wet); wet.connect(out);
    return true;
  }

  // ----- continuous reactor hum (two detuned low oscillators through a breathing low-pass) -----
  function startHum() {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260; f.Q.value = 2;
    const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05; lfoGain.gain.value = 140; lfo.connect(lfoGain); lfoGain.connect(f.frequency);
    const g = ctx.createGain(); g.gain.value = 0.12;
    [[N(33), 'sawtooth', -6], [N(33), 'sawtooth', 7], [N(45), 'triangle', 0]].forEach(([fr, type, det]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = fr; o.detune.value = det; o.connect(f); o.start(); hum.push(o);
    });
    f.connect(g); g.connect(dry); g.connect(verb); lfo.start(); hum.push(lfo);
  }
  function stopHum() { hum.splice(0).forEach((o) => { try { o.stop(ctx.currentTime + 1.5); } catch (e) {} }); }

  // ----- pads: soft, slow-attack chords -----
  function pad(t) {
    const notes = CHORDS[chord++ % CHORDS.length];
    notes.forEach((m, k) => {
      [-5, 5].forEach((det) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
        o.type = k === 0 ? 'triangle' : 'sine'; o.frequency.value = N(m); o.detune.value = det;
        lp.type = 'lowpass'; lp.frequency.value = 1400;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.028, t + 3.5);
        g.gain.linearRampToValueAtTime(0.022, t + PAD_LEN - 1);
        g.gain.linearRampToValueAtTime(0.0001, t + PAD_LEN + 3);
        o.connect(lp); lp.connect(g); g.connect(dry); g.connect(verb);
        o.start(t); o.stop(t + PAD_LEN + 3.2);
      });
    });
  }

  // ----- data blips: short, quiet, high sine chirps like a terminal reading records -----
  function blip(t) {
    const n = 1 + ((Math.random() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const tt = t + i * 0.07;
      o.type = 'sine'; o.frequency.value = 1400 + Math.random() * 1600;
      g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.03, tt + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.06);
      if (p) { p.pan.value = Math.random() * 1.6 - 0.8; o.connect(g); g.connect(p); p.connect(dry); p.connect(verb); } else { o.connect(g); g.connect(dry); }
      o.start(tt); o.stop(tt + 0.08);
    }
  }

  // ----- glassy bells, sparse -----
  function bell(t) {
    const m = PENTA[(Math.random() * PENTA.length) | 0];
    [[1, 0.05], [2.76, 0.012], [5.4, 0.006]].forEach(([mult, vol]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = N(m) * mult;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5 / mult);
      o.connect(g); g.connect(verb); g.connect(dry); o.start(t); o.stop(t + 3.6);
    });
  }

  let nb = null;
  function noiseBuf() {
    if (!nb) { nb = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    return nb;
  }
  // ----- scanner sweep: band-passed noise gliding up and down -----
  function sweep(t) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 9;
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(3200, t + 1.4); bp.frequency.exponentialRampToValueAtTime(500, t + 2.8);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 1.2); g.gain.linearRampToValueAtTime(0.0001, t + 2.9);
    s.connect(bp); bp.connect(g); g.connect(verb); g.connect(dry); s.start(t); s.stop(t + 3);
  }
  // ----- faint geiger crackle (it's radioactive, after all) -----
  function crackle(t) {
    const n = 2 + ((Math.random() * 6) | 0);
    for (let i = 0; i < n; i++) {
      const tt = t + Math.random() * 0.6;
      const s = ctx.createBufferSource(); s.buffer = noiseBuf();
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.025, tt); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.008);
      s.connect(hp); hp.connect(g); g.connect(dry); s.start(tt, Math.random() * 2); s.stop(tt + 0.01);
    }
  }

  function schedule() {
    const now = ctx.currentTime, ahead = now + 0.5;
    if (nextPad < ahead) { pad(nextPad); nextPad += PAD_LEN; }
    if (nextBlip < ahead) { blip(nextBlip); nextBlip += 0.6 + Math.random() * 2.2; }
    if (nextBell < ahead) { if (Math.random() < 0.7) bell(nextBell); nextBell += 1.8 + Math.random() * 2.5; }
    if (nextSweep < ahead) { sweep(nextSweep); nextSweep += 11 + Math.random() * 9; }
    if (nextCrackle < ahead) { crackle(nextCrackle); nextCrackle += 3 + Math.random() * 6; }
  }

  function play() {
    if (!setup()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!timer) {
      const t = ctx.currentTime + 0.1;
      nextPad = t; nextBlip = t + 1.5; nextBell = t + 2.5; nextSweep = t + 6; nextCrackle = t + 4;
      startHum();
      timer = setInterval(schedule, 120);
    }
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setTargetAtTime(0.9, ctx.currentTime, 0.8);
    playing = true; render();
  }
  function stop() {
    if (!ctx) return;
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
    setTimeout(() => { if (!playing && timer) { clearInterval(timer); timer = null; stopHum(); } }, 1600);
    playing = false; render();
  }
  function render() {
    btn.setAttribute('aria-pressed', String(playing));
    btn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    btn.classList.toggle('is-playing', playing);
    if (label) label.textContent = playing ? 'Pause' : 'Sound';
  }
  btn.addEventListener('click', () => (playing ? stop() : play()));
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stop(); });
  render();
})();
