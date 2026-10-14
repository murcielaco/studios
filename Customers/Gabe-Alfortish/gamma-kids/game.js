// =========================================================
// LAMBO RUSH — GAMMA KIDS mini game
// 3-lane top-down runner. Dodge squirrels and lava holes, grab coins.
// Keyboard: ← → / A D (W / ↑ / Space to start). Touch: tap left/right half, swipe, or the pads.
// =========================================================
(() => {
  const root = document.querySelector('[data-game]');
  if (!root) return;

  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const overlay = root.querySelector('.game__overlay');
  const ovTitle = overlay.querySelector('.game__ov-title');
  const ovText = overlay.querySelector('.game__ov-text');
  const ovBtn = overlay.querySelector('.game__ov-btn');
  const muteBtn = root.querySelector('.game__mute');
  const bestEls = document.querySelectorAll('[data-best]');
  const padL = root.querySelector('[data-pad="left"]');
  const padR = root.querySelector('[data-pad="right"]');

  // ---------- Logical canvas ----------
  const W = 360, H = 640;
  const ROAD_L = 48, ROAD_R = W - 48;
  const LANE_W = (ROAD_R - ROAD_L) / 3;
  const laneX = (i) => ROAD_L + LANE_W * (i + 0.5);
  const CAR_Y = H - 120;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.width * (H / W) * dpr);
  }
  new ResizeObserver(resize).observe(canvas);

  // ---------- Palette (matches the site) ----------
  const C = {
    berry: '#3a0b2e', pink: '#ff5fa8', pinkSoft: '#ffc4de', road: '#f9d3e6', roadDark: '#f3bfd8',
    mint: '#9fe6c2', mintDark: '#7bd4aa', yellow: '#ffd23f', sky: '#6ec6ff', lilac: '#b79cff', orange: '#ff8a3d',
    car: '#f6c453', carDark: '#d9a336', mesh: '#f08a3c', white: '#ffffff',
  };

  // ---------- Best score ----------
  let best = 0;
  try { best = Number(localStorage.getItem('gk-lambo-best')) || 0; } catch (e) {}
  const showBest = () => bestEls.forEach((el) => { el.textContent = best.toLocaleString('en-US'); });
  showBest();

  // ---------- State ----------
  let state = 'ready'; // ready | playing | over
  let lane = 1, carX = laneX(1), tilt = 0;
  let speed = 0, dist = 0, score = 0, coins = 0, time = 0, nextRow = 0;
  let objs = [], puffs = [], sparks = [], deco = [];
  let shake = 0, flash = 0;

  function reset() {
    lane = 1; carX = laneX(1); tilt = 0;
    speed = 250; dist = 0; score = 0; coins = 0; time = 0; nextRow = 420;
    objs = []; puffs = []; sparks = []; shake = 0; flash = 0;
    deco = [];
    for (let y = -40; y < H + 80; y += 70) addDeco(y);
  }

  function addDeco(y) {
    const side = Math.random() < 0.5 ? 0 : 1;
    const x = side ? ROAD_R + 8 + Math.random() * 30 : 6 + Math.random() * 30;
    const kinds = ['flower', 'dot', 'flower', 'star'];
    deco.push({ x, y, k: kinds[(Math.random() * kinds.length) | 0], c: [C.pink, C.yellow, C.sky, C.lilac, C.white][(Math.random() * 5) | 0], s: 0.7 + Math.random() * 0.6 });
  }

  // ---------- Spawning ----------
  function spawnRow(y) {
    const hard = Math.min(1, (speed - 250) / 500);
    const count = Math.random() < 0.35 + hard * 0.35 ? 2 : 1;
    const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
    const blocked = lanes.slice(0, count);
    blocked.forEach((l) => {
      const type = Math.random() < 0.55 ? 'squirrel' : 'lava';
      objs.push({ type, lane: l, x: laneX(l), y, ph: Math.random() * 6.28, dir: Math.random() < 0.5 ? -1 : 1 });
    });
    const free = lanes.slice(count);
    if (Math.random() < 0.75) {
      const l = free[(Math.random() * free.length) | 0];
      const n = 1 + ((Math.random() * 3) | 0);
      for (let i = 0; i < n; i++) objs.push({ type: 'coin', lane: l, x: laneX(l), y: y - i * 44, ph: Math.random() * 6.28 });
    }
  }

  // ---------- Input ----------
  function move(d) {
    if (state !== 'playing') return;
    const n = Math.max(0, Math.min(2, lane + d));
    if (n !== lane) { lane = n; sfx.swish(); }
  }
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    const left = k === 'arrowleft' || k === 'a';
    const right = k === 'arrowright' || k === 'd';
    const startKey = k === ' ' || k === 'enter' || k === 'arrowup' || k === 'w';
    if (state === 'playing' && (left || right || startKey || k === 'arrowdown' || k === 's')) e.preventDefault();
    if (left) move(-1);
    else if (right) move(1);
    else if (startKey && state !== 'playing' && inView) { e.preventDefault(); state === 'paused-ready' ? resume() : start(); }
  });

  let tStart = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (state !== 'playing') return;
    tStart = { x: e.clientX, y: e.clientY, t: performance.now() };
  });
  canvas.addEventListener('pointerup', (e) => {
    if (state !== 'playing' || !tStart) return;
    const dx = e.clientX - tStart.x;
    if (Math.abs(dx) > 30) move(dx < 0 ? -1 : 1);
    else {
      const r = canvas.getBoundingClientRect();
      move(e.clientX - r.left < r.width / 2 ? -1 : 1);
    }
    tStart = null;
  });
  const pad = (el, d) => el && el.addEventListener('pointerdown', (e) => { e.preventDefault(); if (state === 'paused-ready') resume(); else if (state !== 'playing') start(); else move(d); });
  pad(padL, -1); pad(padR, 1);
  ovBtn.addEventListener('click', () => (state === 'paused-ready' ? resume() : start()));

  // ---------- Audio (WebAudio chiptune, no files) ----------
  let actx = null, master = null, musicGain = null, sfxGain = null, muted = false, musicTimer = null, step = 0, nextNoteT = 0;
  try { muted = localStorage.getItem('gk-lambo-muted') === '1'; } catch (e) {}
  const setMuteUI = () => { muteBtn.setAttribute('aria-pressed', String(muted)); muteBtn.dataset.muted = muted ? '1' : '0'; muteBtn.querySelector('span').textContent = muted ? 'Sound off' : 'Sound on'; };
  setMuteUI();
  muteBtn.addEventListener('click', () => {
    muted = !muted; setMuteUI();
    try { localStorage.setItem('gk-lambo-muted', muted ? '1' : '0'); } catch (e) {}
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, actx.currentTime, 0.02);
    if (!muted) { ensureAudio(); if (state === 'playing') startMusic(); }
  });

  function ensureAudio() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      actx = new AC();
      master = actx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(actx.destination);
      musicGain = actx.createGain(); musicGain.gain.value = 0.32; musicGain.connect(master);
      sfxGain = actx.createGain(); sfxGain.gain.value = 0.55; sfxGain.connect(master);
    }
    if (actx.state === 'suspended') actx.resume();
    return true;
  }

  function tone(freq, t, dur, type = 'square', vol = 0.2, dest = musicGain, slideTo = null) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
  }
  let noiseBuf = null;
  function noise(t, dur, vol = 0.08, dest = musicGain, hp = 6000) {
    if (!noiseBuf) {
      noiseBuf = actx.createBuffer(1, actx.sampleRate * 0.5, actx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = actx.createBufferSource(); s.buffer = noiseBuf;
    const f = actx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = actx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.02);
  }
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // midi -> Hz
  // Bouncy 2-bar loop in C major (midi numbers, 0 = rest), 16th-note grid x 32 steps
  const MEL = [72,0,76,0, 79,0,76,0, 81,0,79,76, 74,0,72,0,  72,0,76,0, 79,0,84,0, 83,0,79,0, 81,79,76,74];
  const MEL2= [76,0,79,0, 84,0,79,0, 86,0,84,79, 81,0,79,0,  77,0,81,0, 84,0,88,0, 86,0,84,0, 83,81,79,77];
  const BAS = [48,0,48,0, 55,0,55,0, 53,0,53,0, 55,0,55,0,  48,0,48,0, 52,0,52,0, 53,0,55,0, 55,0,59,0];

  function scheduleMusic() {
    const tempo = 138 + Math.min(40, (speed - 250) / 14);
    const s16 = 60 / tempo / 4;
    while (nextNoteT < actx.currentTime + 0.12) {
      const i = step % 32;
      const phrase = Math.floor(step / 32) % 4;
      const mel = phrase === 3 ? MEL2 : MEL;
      if (mel[i]) tone(N(mel[i]), nextNoteT, s16 * 1.6, 'square', 0.09);
      if (BAS[i]) tone(N(BAS[i]), nextNoteT, s16 * 1.9, 'triangle', 0.22);
      if (i % 4 === 0) tone(110, nextNoteT, 0.09, 'sine', 0.3, musicGain, 45); // kick
      if (i % 8 === 4) noise(nextNoteT, 0.12, 0.08, musicGain, 2000);        // snare
      if (i % 2 === 1) noise(nextNoteT, 0.03, 0.035);                         // hat
      nextNoteT += s16; step++;
    }
  }
  function startMusic() {
    if (!actx || muted) return;
    stopMusic();
    step = 0; nextNoteT = actx.currentTime + 0.08;
    musicGain.gain.cancelScheduledValues(actx.currentTime);
    musicGain.gain.setValueAtTime(0.32, actx.currentTime);
    musicTimer = setInterval(scheduleMusic, 25);
  }
  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (musicGain && actx) { musicGain.gain.setTargetAtTime(0.0001, actx.currentTime, 0.03); setTimeout(() => { if (musicGain && !musicTimer) musicGain.gain.value = 0.32; }, 300); }
  }

  const sfx = {
    coin() { if (!actx || muted) return; const t = actx.currentTime; tone(N(88), t, 0.07, 'square', 0.16, sfxGain); tone(N(95), t + 0.06, 0.14, 'square', 0.16, sfxGain); },
    swish() { if (!actx || muted) return; const t = actx.currentTime; tone(520, t, 0.07, 'triangle', 0.06, sfxGain, 880); },
    start() { if (!actx || muted) return; const t = actx.currentTime; [72, 76, 79, 84].forEach((n, i) => tone(N(n), t + i * 0.07, 0.12, 'square', 0.13, sfxGain)); },
    lose() {
      if (!actx || muted) return; const t = actx.currentTime;
      noise(t, 0.35, 0.25, sfxGain, 300);
      [67, 63, 60, 55].forEach((n, i) => tone(N(n), t + 0.12 + i * 0.16, 0.2, 'square', 0.16, sfxGain));
      tone(N(48), t + 0.8, 0.6, 'square', 0.16, sfxGain, N(36));
    },
  };

  // ---------- Flow ----------
  function start() {
    ensureAudio();
    reset();
    state = 'playing';
    overlay.hidden = true;
    root.classList.add('is-playing');
    sfx.start(); startMusic();
    canvas.focus({ preventScroll: true });
  }
  function gameOver() {
    state = 'over';
    shake = 14; flash = 1;
    stopMusic(); sfx.lose();
    root.classList.remove('is-playing');
    const final = Math.floor(score);
    const isBest = final > best;
    if (isBest) { best = final; try { localStorage.setItem('gk-lambo-best', String(best)); } catch (e) {} showBest(); }
    setTimeout(() => {
      ovTitle.textContent = isBest ? 'New record!' : 'Crash!';
      ovText.innerHTML = `<strong>${final.toLocaleString('en-US')}</strong> points · ${coins} coins<br>Best: ${best.toLocaleString('en-US')}`;
      ovBtn.textContent = 'Play again';
      overlay.hidden = false;
    }, 650);
  }

  // ---------- Update ----------
  function update(dt) {
    time += dt;
    // background deco always scrolls a little (alive on the start screen too)
    const v = state === 'playing' ? speed : (state === 'ready' ? 90 : 0);
    deco.forEach((d) => { d.y += v * dt; });
    deco = deco.filter((d) => d.y < H + 40);
    while (deco.length < 20) addDeco(-30 - Math.random() * 60);

    if (state !== 'playing') { puffs.forEach(p => { p.life -= dt; }); sparks.forEach(s => { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 500 * dt; }); puffs = puffs.filter(p => p.life > 0); sparks = sparks.filter(s => s.life > 0); return; }

    speed = Math.min(820, speed + 11 * dt);
    const dy = speed * dt;
    dist += dy;
    score += dy / 9;

    // car steering
    const tx = laneX(lane);
    const prev = carX;
    carX += (tx - carX) * Math.min(1, dt * 16);
    tilt += (((carX - prev) / Math.max(dt, 0.001)) * 0.0009 - tilt) * Math.min(1, dt * 12);

    // exhaust
    if (Math.random() < 0.6) puffs.push({ x: carX + (Math.random() - 0.5) * 16, y: CAR_Y + 48, r: 4 + Math.random() * 4, life: 0.5, max: 0.5 });
    puffs.forEach((p) => { p.y += (speed * 0.55) * dt; p.r += 14 * dt; p.life -= dt; });
    puffs = puffs.filter((p) => p.life > 0);
    sparks.forEach((s) => { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 500 * dt; });
    sparks = sparks.filter((s) => s.life > 0);

    // spawn
    nextRow -= dy;
    if (nextRow <= 0) {
      spawnRow(-70);
      nextRow = speed * 0.42 + 150 + Math.random() * 120;
    }

    // move objects + collisions
    const carBox = { l: carX - 20, r: carX + 20, t: CAR_Y - 38, b: CAR_Y + 38 };
    for (const o of objs) {
      o.y += dy;
      o.ph += dt * (o.type === 'coin' ? 5 : 3);
      if (o.type === 'squirrel') o.x = laneX(o.lane) + Math.sin(o.ph) * 6 * o.dir; // little scurry
      if (o.dead) continue;
      const hw = o.type === 'coin' ? 15 : o.type === 'lava' ? 26 : 22;
      const hh = o.type === 'coin' ? 15 : o.type === 'lava' ? 18 : 24;
      if (o.x + hw > carBox.l && o.x - hw < carBox.r && o.y + hh > carBox.t && o.y - hh < carBox.b) {
        if (o.type === 'coin') {
          o.dead = true; coins++; score += 50; sfx.coin();
          for (let i = 0; i < 8; i++) sparks.push({ x: o.x, y: o.y, vx: (Math.random() - 0.5) * 240, vy: -Math.random() * 220, life: 0.45, c: Math.random() < 0.5 ? C.yellow : C.white });
        } else {
          for (let i = 0; i < 18; i++) sparks.push({ x: carX, y: CAR_Y - 20, vx: (Math.random() - 0.5) * 420, vy: -Math.random() * 380, life: 0.8, c: [C.pink, C.yellow, C.orange, C.white][i % 4] });
          gameOver();
          break;
        }
      }
    }
    objs = objs.filter((o) => o.y < H + 80 && !(o.dead && o.type === 'coin'));
  }

  // ---------- Drawing helpers ----------
  function circ(x, y, r) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); }
  function ell(x, y, rx, ry, rot) { ctx.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  function drawBackground() {
    // grass sides
    ctx.fillStyle = C.mint; ctx.fillRect(0, 0, W, H);
    // deco on grass
    for (const d of deco) {
      ctx.save(); ctx.translate(d.x + 6, d.y); ctx.scale(d.s, d.s);
      if (d.k === 'flower') {
        ctx.fillStyle = d.c;
        for (let i = 0; i < 5; i++) { ctx.beginPath(); circ(Math.cos(i * 1.256) * 5, Math.sin(i * 1.256) * 5, 4); ctx.fill(); }
        ctx.fillStyle = C.yellow; ctx.beginPath(); circ(0, 0, 3); ctx.fill();
      } else if (d.k === 'star') {
        ctx.fillStyle = d.c; star(0, 0, 7, 3.2);
      } else {
        ctx.fillStyle = C.mintDark; ctx.beginPath(); circ(0, 0, 4); ctx.fill();
      }
      ctx.restore();
    }
    // road
    ctx.fillStyle = C.road; ctx.fillRect(ROAD_L, 0, ROAD_R - ROAD_L, H);
    // candy curbs
    const seg = 28, off = dist % (seg * 2);
    for (let y = -seg * 2 + off; y < H + seg; y += seg) {
      const odd = Math.round((y - off) / seg) % 2 === 0;
      ctx.fillStyle = odd ? C.pink : C.white;
      ctx.fillRect(ROAD_L - 10, y, 10, seg);
      ctx.fillRect(ROAD_R, y, 10, seg);
    }
    // lane dashes
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    const dash = 46, gap = 34, per = dash + gap, o2 = dist % per;
    for (let i = 1; i < 3; i++) {
      const x = ROAD_L + LANE_W * i - 3;
      for (let y = -per + o2; y < H; y += per) { rr(x, y, 6, dash, 3); ctx.fill(); }
    }
    // soft road texture dots
    ctx.fillStyle = C.roadDark;
    const o3 = dist % 160;
    for (let y = -160 + o3; y < H; y += 160) {
      ctx.beginPath(); circ(ROAD_L + 30, y + 20, 3); circ(ROAD_R - 40, y + 100, 2.5); circ(W / 2 + 40, y + 60, 2); ctx.fill();
    }
  }

  function star(x, y, R, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R; ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
    ctx.closePath(); ctx.fill();
  }

  // Top-down supercar: wedge nose, Y headlights, flared rear arches, hexagonal engine bay
  // (which is the shoe's foot opening), side intakes, rear wing and quad exhausts.
  function poly(pts) { ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); }
  const mirror = (pts) => pts.concat(pts.slice().reverse().map(([px, py]) => [-px, py]));

  function drawCar(x, y, t) {
    const Y = '#f7c63f', YD = '#d39a1f', YL = '#ffe08a', INK = '#2a0a22';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.max(-0.35, Math.min(0.35, t)));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // shadow
    ctx.fillStyle = 'rgba(58,11,46,.12)'; ctx.beginPath(); ell(2, 4, 33, 56, 0); ctx.fill();

    // tyres (wide, mostly tucked under the body)
    ctx.fillStyle = INK;
    [[-29, -27, 9, 20], [29, -27, 9, 20], [-31, 24, 11, 24], [31, 24, 11, 24]].forEach(([wx, wy, ww, wh]) => { rr(wx - ww / 2, wy - wh / 2, ww, wh, 3); ctx.fill(); });

    // body silhouette (right half, mirrored)
    poly(mirror([[0, -60], [6, -60], [15, -54], [23, -44], [29, -30], [27, -14], [25, -2], [30, 8], [33, 20], [33, 34], [30, 44], [22, 50], [0, 50]]));
    ctx.fillStyle = Y; ctx.fill();
    ctx.strokeStyle = YD; ctx.lineWidth = 2; ctx.stroke();

    // front splitter + intakes
    ctx.fillStyle = INK;
    poly([[-6, -60], [6, -60], [9, -57], [-9, -57]]); ctx.fill();
    poly([[11, -56], [20, -49], [16, -46], [9, -53]]); ctx.fill();
    poly([[-11, -56], [-20, -49], [-16, -46], [-9, -53]]); ctx.fill();

    // hood with two creases converging to the nose
    ctx.fillStyle = YL;
    poly([[-4, -56], [4, -56], [12, -26], [-12, -26]]); ctx.fill();
    ctx.strokeStyle = YD; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-4, -56); ctx.lineTo(-14, -26); ctx.moveTo(4, -56); ctx.lineTo(14, -26); ctx.stroke();

    // Y-shaped headlights
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4;
    [1, -1].forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(s * 13, -51); ctx.lineTo(s * 21, -44); ctx.lineTo(s * 26, -36);
      ctx.moveTo(s * 21, -44); ctx.lineTo(s * 18, -38);
      ctx.stroke();
    });

    // windshield (the shoe's orange mesh)
    poly([[-14, -24], [14, -24], [19, -7], [-19, -7]]);
    ctx.fillStyle = '#f08a3c'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.32)'; ctx.lineWidth = 1;
    for (let i = -44; i < 44; i += 5) { ctx.beginPath(); ctx.moveTo(i, -24); ctx.lineTo(i + 17, -7); ctx.moveTo(i + 17, -24); ctx.lineTo(i, -7); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; poly([[-14, -24], [14, -24], [19, -7], [-19, -7]]); ctx.stroke();

    // roof
    ctx.fillStyle = Y; poly([[-18, -6], [18, -6], [16, 8], [-16, 8]]); ctx.fill();
    ctx.strokeStyle = YD; ctx.lineWidth = 1.4; ctx.stroke();

    // side air intakes behind the doors
    ctx.fillStyle = INK;
    poly([[24, 0], [31, 10], [30, 18], [25, 9]]); ctx.fill();
    poly([[-24, 0], [-31, 10], [-30, 18], [-25, 9]]); ctx.fill();

    // hexagonal engine bay = the foot opening of the shoe
    poly([[-15, 10], [15, 10], [20, 22], [15, 40], [-15, 40], [-20, 22]]);
    ctx.fillStyle = YD; ctx.fill();
    ctx.fillStyle = '#c9772e'; ctx.beginPath(); ell(0, 25, 12, 13, 0); ctx.fill();
    ctx.fillStyle = '#9c561d'; ctx.beginPath(); ell(0, 27, 8, 9, 0); ctx.fill();
    // louvres
    ctx.strokeStyle = 'rgba(42,10,34,.45)'; ctx.lineWidth = 1.6;
    for (let k = 0; k < 4; k++) { const ly = 14 + k * 7; ctx.beginPath(); ctx.moveTo(-19 + (k === 0 ? 2 : 0), ly); ctx.lineTo(-13, ly); ctx.moveTo(13, ly); ctx.lineTo(19 - (k === 0 ? 2 : 0), ly); ctx.stroke(); }

    // rear wing
    ctx.fillStyle = INK; rr(-24, 42, 48, 5, 2.5); ctx.fill();
    // tail lights (thin Y)
    ctx.strokeStyle = '#ff5fa8'; ctx.lineWidth = 2.4;
    [1, -1].forEach((s) => { ctx.beginPath(); ctx.moveTo(s * 10, 48); ctx.lineTo(s * 22, 48); ctx.lineTo(s * 28, 43); ctx.moveTo(s * 22, 48); ctx.lineTo(s * 25, 44.5); ctx.stroke(); });
    // quad exhausts
    ctx.fillStyle = '#6b1d55';
    [-6, -2, 2, 6].forEach((ex) => { ctx.beginPath(); circ(ex, 50.5, 1.8); ctx.fill(); });

    // centre highlight
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath(); ell(-9, -38, 2, 9, 0.25); ctx.fill();
    ctx.restore();
  }

  function drawSquirrel(o) {
    const wag = Math.sin(o.ph * 2) * 0.25;
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.fillStyle = 'rgba(58,11,46,.15)'; ctx.beginPath(); ell(2, 6, 22, 26, 0); ctx.fill();
    // tail (big curl behind, toward the top)
    ctx.save(); ctx.translate(0, -12); ctx.rotate(wag);
    ctx.fillStyle = '#f2b07a';
    ctx.beginPath(); ell(0, -16, 15, 20, 0); ctx.fill();
    ctx.strokeStyle = '#e08d55'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -16, 8, 0.5, 5.2); ctx.stroke();
    ctx.restore();
    // body
    ctx.fillStyle = '#e8935a'; ctx.beginPath(); ell(0, 2, 15, 17, 0); ctx.fill();
    ctx.fillStyle = '#ffe2c6'; ctx.beginPath(); ell(0, 6, 8, 10, 0); ctx.fill();
    // head (facing the car, toward the bottom)
    ctx.fillStyle = '#e8935a'; ctx.beginPath(); circ(0, 18, 12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, 10); ctx.lineTo(-13, 2); ctx.lineTo(-5, 8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10, 10); ctx.lineTo(13, 2); ctx.lineTo(5, 8); ctx.fill();
    // face
    ctx.fillStyle = C.berry; ctx.beginPath(); circ(-5, 19, 2.4); circ(5, 19, 2.4); ctx.fill();
    ctx.fillStyle = C.white; ctx.beginPath(); circ(-4.3, 18.2, 0.9); circ(5.7, 18.2, 0.9); ctx.fill();
    ctx.fillStyle = 'rgba(255,95,168,.55)'; ctx.beginPath(); circ(-8, 23, 2.6); circ(8, 23, 2.6); ctx.fill();
    ctx.fillStyle = C.white; rr(-2.5, 25, 5, 4.5, 1); ctx.fill(); // teeth
    // little paws holding an acorn
    ctx.fillStyle = '#b5652f'; ctx.beginPath(); ell(0, 30, 4, 4.5, 0); ctx.fill();
    ctx.fillStyle = '#7a4320'; rr(-4, 26, 8, 3, 1.5); ctx.fill();
    ctx.restore();
  }

  function drawLava(o) {
    ctx.save(); ctx.translate(o.x, o.y);
    // glow
    const g = ctx.createRadialGradient(0, 0, 6, 0, 0, 44);
    g.addColorStop(0, 'rgba(255,138,61,.45)'); g.addColorStop(1, 'rgba(255,138,61,0)');
    ctx.fillStyle = g; ctx.beginPath(); ell(0, 0, 46, 36, 0); ctx.fill();
    // rocky rim
    ctx.fillStyle = '#6b1d55'; ctx.beginPath(); ell(0, 0, 32, 22, 0); ctx.fill();
    ctx.fillStyle = '#8a2c6f';
    for (let i = 0; i < 9; i++) { const a = i * 0.698; ctx.beginPath(); circ(Math.cos(a) * 30, Math.sin(a) * 20, 5); ctx.fill(); }
    // lava
    const lg = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
    lg.addColorStop(0, '#fff17a'); lg.addColorStop(0.45, '#ffb238'); lg.addColorStop(1, '#ff4d3d');
    ctx.fillStyle = lg; ctx.beginPath(); ell(0, 1, 25, 16, 0); ctx.fill();
    // bubbles
    for (let i = 0; i < 3; i++) {
      const p = (o.ph * 0.6 + i / 3) % 1;
      const bx = Math.cos(i * 2.1 + o.ph * 0.3) * 12, by = Math.sin(i * 1.7) * 6;
      ctx.fillStyle = `rgba(255,241,122,${1 - p})`;
      ctx.beginPath(); circ(bx, by, 2 + p * 5); ctx.fill();
    }
    // rising embers
    ctx.fillStyle = C.yellow;
    for (let i = 0; i < 2; i++) { const p = (o.ph * 0.5 + i * 0.5) % 1; ctx.globalAlpha = 1 - p; ctx.beginPath(); circ(Math.sin(i * 3 + o.ph) * 10, -p * 30, 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawCoin(o) {
    const sx = Math.abs(Math.cos(o.ph));
    ctx.save(); ctx.translate(o.x, o.y + Math.sin(o.ph * 0.7) * 2);
    ctx.fillStyle = 'rgba(58,11,46,.15)'; ctx.beginPath(); ell(1, 14, 10 * Math.max(0.35, sx), 3, 0); ctx.fill();
    ctx.scale(Math.max(0.12, sx), 1);
    ctx.fillStyle = '#e8a91c'; ctx.beginPath(); circ(0, 0, 13); ctx.fill();
    ctx.fillStyle = C.yellow; ctx.beginPath(); circ(0, 0, 10.5); ctx.fill();
    ctx.fillStyle = '#e8a91c'; ctx.font = '700 13px Fredoka, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('G', 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ell(-4, -5, 2, 4, 0.5); ctx.fill();
    ctx.restore();
  }

  function drawHUD() {
    ctx.font = '700 18px Fredoka, system-ui, sans-serif'; ctx.textBaseline = 'middle';
    // score pill
    const s = Math.floor(score).toLocaleString('en-US');
    ctx.textAlign = 'left';
    const w1 = ctx.measureText(s).width + 34;
    ctx.fillStyle = C.berry; rr(12, 12, w1, 34, 17); ctx.fill();
    ctx.fillStyle = C.pink; ctx.beginPath(); circ(29, 29, 7); ctx.fill();
    ctx.fillStyle = C.white; ctx.fillText(s, 42, 30);
    // coins pill
    const c = String(coins);
    const w2 = ctx.measureText(c).width + 40;
    ctx.fillStyle = C.white; rr(W - 12 - w2, 12, w2, 34, 17); ctx.fill();
    ctx.fillStyle = C.yellow; ctx.beginPath(); circ(W - w2 + 6, 29, 9); ctx.fill();
    ctx.fillStyle = '#e8a91c'; ctx.font = '700 11px Fredoka, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('G', W - w2 + 6, 30);
    ctx.font = '700 18px Fredoka, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = C.berry; ctx.fillText(c, W - 24, 30);
    // speed bar
    const p = Math.min(1, (speed - 250) / (820 - 250));
    ctx.fillStyle = 'rgba(58,11,46,.18)'; rr(12, 54, 90, 6, 3); ctx.fill();
    ctx.fillStyle = C.pink; rr(12, 54, Math.max(6, 90 * p), 6, 3); ctx.fill();
  }

  function draw() {
    const sx = canvas.width / W, sy = canvas.height / H;
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    drawBackground();
    for (const o of objs) if (o.type === 'lava') drawLava(o);
    for (const p of puffs) { ctx.fillStyle = `rgba(255,255,255,${(p.life / p.max) * 0.8})`; ctx.beginPath(); circ(p.x, p.y, p.r); ctx.fill(); }
    for (const o of objs) if (o.type === 'coin' && !o.dead) drawCoin(o);
    drawCar(carX, CAR_Y + (state === 'ready' ? Math.sin(time * 3) * 3 : 0), tilt);
    for (const o of objs) if (o.type === 'squirrel') drawSquirrel(o);
    for (const s of sparks) { ctx.fillStyle = s.c; ctx.globalAlpha = Math.max(0, s.life * 2); star(s.x, s.y, 5, 2.2); }
    ctx.globalAlpha = 1;
    ctx.restore();
    if (flash > 0) { ctx.fillStyle = `rgba(255,95,168,${flash * 0.45})`; ctx.fillRect(0, 0, W, H); }
    if (state !== 'ready') drawHUD();
  }

  // ---------- Loop (pauses when off-screen or tab hidden) ----------
  let last = performance.now(), inView = false, raf = 0;
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    update(dt);
    if (shake > 0) shake = Math.max(0, shake - dt * 40);
    if (flash > 0) flash = Math.max(0, flash - dt * 2.5);
    draw();
    raf = requestAnimationFrame(frame);
  }
  function run() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function halt() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  function pauseGame() {
    if (state === 'playing') {
      state = 'paused-ready';
      stopMusic();
      ovTitle.textContent = 'Paused';
      ovText.innerHTML = `<strong>${Math.floor(score).toLocaleString('en-US')}</strong> points so far`;
      ovBtn.textContent = 'Keep driving';
      overlay.hidden = false;
      root.classList.remove('is-playing');
    }
  }
  function resume() {
    state = 'playing'; overlay.hidden = true; root.classList.add('is-playing');
    ensureAudio(); startMusic(); last = performance.now();
  }

  new IntersectionObserver((en) => {
    inView = en[0].isIntersecting;
    if (inView) run(); else { pauseGame(); halt(); }
  }, { threshold: 0.25 }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

  reset();
  draw();
})();
