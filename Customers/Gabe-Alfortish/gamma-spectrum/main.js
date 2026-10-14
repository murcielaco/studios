// GAMMA SPECTRUM — interactions
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----- Hero energy field: light streaks rushing past, like motion trails -----
  const cv = document.querySelector('.hero__field');
  if (cv) {
    const ctx = cv.getContext('2d');
    const COLORS = ['0,191,99', '0,191,99', '0,191,99', '140,82,255', '255,80,49'];
    let w = 0, h = 0, dpr = 1, streaks = [], raf = 0, visible = true;
    const make = (initial) => ({
      x: initial ? Math.random() * w : w + Math.random() * w * 0.4,
      y: Math.random() * h,
      len: 80 + Math.random() * 380,
      v: 500 + Math.random() * 1400,
      t: 0.6 + Math.random() * 2.2,
      a: 0.15 + Math.random() * 0.55,
      c: COLORS[(Math.random() * COLORS.length) | 0],
    });
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect(); w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      const n = Math.round(Math.min(110, w / 12));
      streaks = Array.from({ length: n }, () => make(true));
    }
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const s of streaks) {
        s.x -= s.v * dt;
        if (s.x + s.len < 0) Object.assign(s, make(false));
        const g = ctx.createLinearGradient(s.x, 0, s.x + s.len, 0);
        g.addColorStop(0, `rgba(${s.c},${s.a})`);
        g.addColorStop(1, `rgba(${s.c},0)`);
        ctx.strokeStyle = g; ctx.lineWidth = s.t;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + s.len, s.y); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = visible ? requestAnimationFrame(frame) : 0;
    }
    size();
    new ResizeObserver(size).observe(cv);
    if (reduce) { last = performance.now(); frame(last + 16); cancelAnimationFrame(raf); raf = 0; }
    else {
      raf = requestAnimationFrame(frame);
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      }).observe(cv);
    }
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
