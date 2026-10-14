// =========================================================
// GAMMA SPECTRUM — background music (original electronic loop, generated live with WebAudio)
// Driving 4/4 beat, pulsing bass and a bright arpeggio. Toggled by the button at the top of the hero.
// =========================================================
(() => {
  const btn = document.querySelector('[data-music]');
  if (!btn) return;
  const label = btn.querySelector('.music-btn__label');

  let ctx = null, out = null, bus = null, filt = null, timer = null, step = 0, nextT = 0, playing = false;
  const N = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const TEMPO = 124;
  const S16 = 60 / TEMPO / 4;

  // 4 bars, Am – F – C – G (root notes for bass, triads for the arp)
  const ROOTS = [45, 41, 48, 43];
  const TRIADS = [[69, 72, 76], [65, 69, 72], [72, 76, 79], [67, 71, 74]];
  const ARP = [0, 1, 2, 1, 2, 0, 1, 2, 0, 2, 1, 2, 0, 1, 2, 1];

  function setup() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(out);
    bus = ctx.createGain(); bus.gain.value = 0.9; bus.connect(comp);
    filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 900; filt.Q.value = 6; filt.connect(bus);
    // stereo-ish echo on the arp
    const d = ctx.createDelay(); d.delayTime.value = S16 * 3;
    const fb = ctx.createGain(); fb.gain.value = 0.3;
    const wet = ctx.createGain(); wet.gain.value = 0.22;
    d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(comp);
    ctx._echo = d;
    return true;
  }

  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    env(g, t, 0.003, 0.9, 0.28); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.35);
  }
  let nb = null;
  function noise(t, dur, vol, hp) {
    if (!nb) { nb = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ctx.createBufferSource(); s.buffer = nb;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = ctx.createGain(); env(g, t, 0.002, vol, dur);
    s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t + dur + 0.05);
  }
  function bass(freq, t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = freq;
    env(g, t, 0.005, 0.32, S16 * 0.9);
    o.connect(g); g.connect(filt); o.start(t); o.stop(t + S16 + 0.05);
  }
  function arp(freq, t, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o.frequency.value = freq;
    env(g, t, 0.004, vol, S16 * 1.4);
    o.connect(g); g.connect(bus); g.connect(ctx._echo); o.start(t); o.stop(t + S16 * 1.6);
  }

  function schedule() {
    while (nextT < ctx.currentTime + 0.12) {
      const i = step % 16, bar = Math.floor(step / 16) % 4, phrase = Math.floor(step / 64) % 2;
      if (i % 4 === 0) kick(nextT);
      if (i % 4 === 2) noise(nextT, 0.05, 0.12, 8000);          // open-ish hat on the off-beat
      if (i % 2 === 1) noise(nextT, 0.025, 0.05, 9000);         // closed hat
      if (i === 4 || i === 12) noise(nextT, 0.16, 0.22, 1500);  // clap
      // pulsing bass, octave jump on the last 16th of each beat
      bass(N(ROOTS[bar] + (i % 4 === 3 ? 12 : 0)), nextT);
      // filter sweep breathes over two phrases
      filt.frequency.setTargetAtTime(phrase ? 2600 : 800 + (step % 64) * 22, nextT, 0.2);
      // arpeggio enters on the second phrase
      if (phrase === 1 || bar >= 2) arp(N(TRIADS[bar][ARP[i]] + (i >= 12 ? 12 : 0)), nextT, 0.05);
      nextT += S16; step++;
    }
  }

  function play() {
    if (!setup()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!timer) { nextT = ctx.currentTime + 0.06; step = 0; timer = setInterval(schedule, 25); }
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setTargetAtTime(0.55, ctx.currentTime, 0.2);
    playing = true; render();
  }
  function stop() {
    if (!ctx) return;
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12);
    setTimeout(() => { if (!playing && timer) { clearInterval(timer); timer = null; } }, 500);
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
