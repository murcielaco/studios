// GAMMA KIDS — interactions
(() => {
  // ----- Galleries: thumbs swap the main image -----
  const galleries = [...document.querySelectorAll('[data-gallery]')];
  galleries.forEach((g) => {
    const mainImg = g.querySelector('.gallery__main img');
    const thumbs = [...g.querySelectorAll('.gallery__thumbs button')];
    thumbs.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        thumbs.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        mainImg.style.opacity = '0';
        const next = new Image();
        next.onload = () => {
          mainImg.src = btn.dataset.full;
          mainImg.alt = btn.querySelector('img').alt;
          mainImg.style.opacity = '1';
        };
        next.src = btn.dataset.full;
        g.dataset.index = i;
      });
    });
    g.querySelector('.gallery__main').addEventListener('click', () => {
      openLightbox(thumbs.map((b) => ({ src: b.dataset.full, alt: b.querySelector('img').alt })), Number(g.dataset.index || 0));
    });
  });

  // ----- Lightbox -----
  const lb = document.querySelector('.lightbox');
  const lbImg = lb.querySelector('.lightbox__img');
  let items = [];
  let idx = 0;
  let lastFocus = null;

  function show(i) {
    idx = (i + items.length) % items.length;
    lbImg.src = items[idx].src;
    lbImg.alt = items[idx].alt;
  }
  function openLightbox(list, start) {
    items = list;
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    show(start);
    lb.querySelector('.lightbox__close').focus();
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  lb.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
  lb.querySelector('.lightbox__nav--prev').addEventListener('click', () => show(idx - 1));
  lb.querySelector('.lightbox__nav--next').addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  // swipe on touch
  let x0 = null;
  lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  // ----- Reveal on scroll -----
  const revealables = document.querySelectorAll('.intro__text, .intro__chips, .product__info, .gallery, .soon__body');
  if ('IntersectionObserver' in window) {
    revealables.forEach((el) => el.classList.add('reveal'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    revealables.forEach((el) => io.observe(el));
  }

  // ----- Subtle parallax on the hero toys (desktop pointers only) -----
  const scene = document.querySelector('.scene');
  if (scene && matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const layer = scene.querySelector('.toys');
    scene.addEventListener('pointermove', (e) => {
      const r = scene.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      layer.style.translate = `${dx * -18}px ${dy * -12}px`;
    });
    scene.addEventListener('pointerleave', () => { layer.style.translate = '0 0'; });
  }
})();
