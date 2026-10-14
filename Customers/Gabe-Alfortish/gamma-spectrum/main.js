// GAMMA SPECTRUM — interactions
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----- Hero wireframe field: a dark-grey 3D mesh, slowly breathing like a scanned surface -----
  const cv = document.querySelector('.hero__field');
  if (cv) {
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, t0 = performance.now();
    const NX = 46, NZ = 34;            // grid resolution
    const SPAN = 26, DEPTH = 30;       // world size
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect(); w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
    }
    const height = (x, z, t) =>
      Math.sin(x * 0.35 + t * 0.25) * 0.55 +
      Math.cos(z * 0.28 - t * 0.18) * 0.65 +
      Math.sin((x + z) * 0.17 + t * 0.12) * 0.45;
    function draw(now) {
      const t = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const f = Math.min(w, h * 1.6) * 0.9;           // focal length
      const cx = w / 2, horizon = h * 0.34, camY = 3.2;
      const scroll = (t * 0.6) % (DEPTH / NZ);        // slow drift toward the viewer
      const P = [];
      for (let j = 0; j < NZ; j++) {
        const z = 2 + j * (DEPTH / NZ) - scroll;
        const row = [];
        for (let i = 0; i < NX; i++) {
          const x = -SPAN / 2 + i * (SPAN / (NX - 1));
          const y = height(x, z + t * 0.6, t);
          row.push([cx + (x * f) / z, horizon + ((camY - y) * f) / z, z]);
        }
        P.push(row);
      }
      ctx.lineWidth = 1;
      const alpha = (z) => Math.max(0, Math.min(1, (DEPTH - z) / DEPTH)) * 0.42;
      for (let j = 0; j < NZ; j++) {          // lines across
        ctx.strokeStyle = `rgba(150,158,154,${alpha(P[j][0][2])})`;
        ctx.beginPath();
        P[j].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
      for (let i = 0; i < NX; i++) {          // lines in depth
        ctx.beginPath();
        for (let j = 0; j < NZ; j++) { const [x, y] = P[j][i]; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        const g = ctx.createLinearGradient(0, h, 0, horizon);
        g.addColorStop(0, 'rgba(150,158,154,.38)'); g.addColorStop(1, 'rgba(150,158,154,0)');
        ctx.strokeStyle = g; ctx.stroke();
      }
      if (!reduce && visible) raf = requestAnimationFrame(draw); else raf = 0;
    }
    size();
    new ResizeObserver(() => { size(); if (!raf) draw(performance.now()); }).observe(cv);
    draw(performance.now());
    if (!reduce) new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(draw); }).observe(cv);
  }

  // ----- Colorway switch: swaps the 360° video -----
  document.querySelectorAll('[data-model]').forEach((model) => {
    const video = model.querySelector('video');
    const btns = [...model.querySelectorAll('.colorways button')];
    btns.forEach((b) => b.addEventListener('click', () => {
      if (b.classList.contains('is-active')) return;
      btns.forEach((x) => { x.classList.remove('is-active'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('is-active'); b.setAttribute('aria-pressed', 'true');
      const base = b.dataset.video;
      video.style.opacity = '0';
      setTimeout(() => {
        video.poster = base + '.jpg';
        video.innerHTML = `<source src="${base}.mp4" type="video/mp4"><source src="${base}.webm" type="video/webm">`;
        video.load();
        const p = video.play(); if (p) p.catch(() => {});
        video.style.opacity = '1';
      }, 250);
    }));
    // only play videos that are on screen
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { const p = video.play(); if (p) p.catch(() => {}); } else video.pause();
    }, { threshold: 0.2 }).observe(video);
  });

  // ----- Gallery strips -> lightbox -----
  const lb = document.querySelector('.lightbox');
  const lbImg = lb.querySelector('.lightbox__img');
  let items = [], idx = 0, lastFocus = null;
  const show = (i) => { idx = (i + items.length) % items.length; lbImg.src = items[idx].src; lbImg.alt = items[idx].alt; };
  function open(list, i) { items = list; lastFocus = document.activeElement; lb.hidden = false; document.body.style.overflow = 'hidden'; show(i); lb.querySelector('.lightbox__close').focus(); }
  function close() { lb.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  document.querySelectorAll('[data-gallery]').forEach((g) => {
    const btns = [...g.querySelectorAll('button')];
    const list = btns.map((b) => ({ src: b.dataset.full, alt: b.querySelector('img').alt }));
    btns.forEach((b, i) => b.addEventListener('click', () => open(list, i)));
  });
  lb.querySelector('.lightbox__close').addEventListener('click', close);
  lb.querySelector('.lightbox__nav--prev').addEventListener('click', () => show(idx - 1));
  lb.querySelector('.lightbox__nav--next').addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  let x0 = null;
  lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1)); x0 = null; });

  // ----- Reveal on scroll -----
  const els = document.querySelectorAll('.manifesto__inner, .values, .model__info, .model__stage, .strip, .energy__body');
  if ('IntersectionObserver' in window && !reduce) {
    els.forEach((el) => el.classList.add('reveal'));
    const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } }), { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  }
})();
