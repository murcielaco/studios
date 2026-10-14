// =========================================================
// GAMMA KIDS — background music (original music-box loop, generated live with WebAudio)
// Toggled by the round play button at the top of the hero. Pauses while LAMBO RUSH is running.
// =========================================================
(() => {
  const btn = document.querySelector('[data-music]');
  if (!btn) return;
  const label = btn.querySelector('.music-btn__label');

  let ctx = null, out = null, timer = null, step = 0, nextT = 0, playing = false, pausedByGame = false;

  const N = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const TEMPO = 104;            // gentle, bouncy
  const S8 = 60 / TEMPO / 2;    // eighth-note length

  // 8 bars of eighth notes (16 steps per bar would be busy; 8 per bar keeps it light).
  // Progression: F  Dm  Bb  C  |  F  Am  Bb  C
  const CHORDS = [
    [53, 57, 60], [50, 53, 57], [46, 50, 53], [48, 52, 55],
    [53, 57, 60], [45, 48, 52], [46, 50, 53], [48, 52, 55],
  ];
  // Melody (0 = rest), one row per bar, 8 eighths each — original tune.
  const MEL = [
    [77, 0, 81, 0, 84, 81, 79, 0],
    [77, 0, 74, 0, 77, 0, 0, 0],
    [74, 0, 77, 0, 82, 81, 79, 77],
    [76, 0, 79, 0, 72, 0, 0, 0],
    [77, 0, 81, 0, 84, 0, 86, 84],
    [81, 0, 76, 0, 79, 77, 76, 0],
    [74, 77, 82, 0, 81, 0, 79, 0],
    [79, 0, 76, 0, 77, 0, 0, 0],
  ];

  function setup() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    out = ctx.createGain(); out.gain.value = 0;
    // soft room: short feedback delay
    const delay = ctx.createDelay(); delay.delayTime.value = 0.23;
    const fb = ctx.createGain(); fb.gain.value = 0.22;
    const wet = ctx.createGain(); wet.gain.value = 0.25;
    out.connect(ctx.destination);
    out.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(ctx.destination);
    return true;
  }

  // music-box / celesta voice: two sines with fast attack and long decay
  function bell(freq, t, vol = 0.16, dur = 1.1) {
    [[1, 1], [2, 0.35], [3.01, 0.12]].forEach(([mult, amp]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq * mult;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol * amp, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur / mult);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
    });
  }
  function pluck(freq, t, vol = 0.12, dur = 0.5) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  let nb = null;
  function shaker(t, vol = 0.03) {
    if (!nb) { nb = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ctx.createBufferSource(); s.buffer = nb;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 0.08);
  }

  function schedule() {
    while (nextT < ctx.currentTime + 0.15) {
      const bar = Math.floor(step / 8) % 8, i = step % 8;
      const ch = CHORDS[bar];
      const m = MEL[bar][i];
      if (m) bell(N(m), nextT, 0.13);
      // broken-chord accompaniment
      bell(N(ch[[0, 1, 2, 1][i % 4]] + 12), nextT, 0.045, 0.7);
      if (i === 0 || i === 4) pluck(N(ch[0] - 12), nextT, 0.14, 0.6);
      if (i % 2 === 1) shaker(nextT);
      nextT += S8; step++;
    }
  }

  function play() {
    if (!setup()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!timer) { nextT = ctx.currentTime + 0.06; timer = setInterval(schedule, 30); }
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setTargetAtTime(0.85, ctx.currentTime, 0.15);
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
    if (label) label.textContent = playing ? 'Pause' : 'Music';
  }

  btn.addEventListener('click', () => { pausedByGame = false; playing ? stop() : play(); });

  // Hand the speakers to the game while it runs; come back afterwards if we were playing.
  window.addEventListener('gk:game-start', () => { if (playing) { pausedByGame = true; stop(); } });
  window.addEventListener('gk:game-end', () => { if (pausedByGame) { pausedByGame = false; play(); } });

  render();
})();
