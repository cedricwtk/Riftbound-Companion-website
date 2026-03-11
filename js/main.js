(function () {
  'use strict';

  /* ============================================================
     UTIL
     ============================================================ */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  // Allow carousel images to be .jpg or .png — tries the alternate extension on load failure
  function initImageFallbacks() {
    qsa('#carousel-track img').forEach(img => {
      img.addEventListener('error', function onErr() {
        img.removeEventListener('error', onErr);
        const src = img.src;
        if (src.endsWith('.jpg') || src.endsWith('.jpeg')) {
          img.src = src.replace(/\.jpe?g$/, '.png');
        } else if (src.endsWith('.png')) {
          img.src = src.replace(/\.png$/, '.jpg');
        }
      });
    });
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasHover      = window.matchMedia('(hover: hover)').matches;

  /* ============================================================
     1. NAVBAR SCROLL
     ============================================================ */
  function initNavbarScroll() {
    const navbar = qs('#navbar');
    if (!navbar) return;

    let ticking = false;

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          navbar.classList.toggle('is-scrolled', window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load
  }

  /* ============================================================
     2. SMOOTH SCROLL
     ============================================================ */
  function initSmoothScroll() {
    const NAVBAR_HEIGHT = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--navbar-height') || '72',
      10
    );

    document.addEventListener('click', function (e) {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const targetId = link.getAttribute('href');
      if (targetId === '#') return;

      const target = qs(targetId);
      if (!target) return;

      e.preventDefault();

      const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
      window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ============================================================
     3. SCROLL SPY
     ============================================================ */
  function initScrollSpy() {
    const sections = qsa('section[id]');
    const links    = qsa('.navbar__link[data-section]');
    if (!sections.length || !links.length) return;

    const linkMap = {};
    links.forEach(l => { linkMap[l.dataset.section] = l; });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.remove('is-active'));
          const active = linkMap[entry.target.id];
          if (active) active.classList.add('is-active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });

    sections.forEach(s => observer.observe(s));
  }

  /* ============================================================
     4. MOBILE MENU
     ============================================================ */
  function initMobileMenu() {
    const navbar  = qs('#navbar');
    const btn     = qs('#hamburger-btn');
    const links   = qs('#navbar-links');
    if (!navbar || !btn || !links) return;

    function openMenu() {
      navbar.classList.add('menu-is-open');
      btn.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      navbar.classList.remove('menu-is-open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', () => {
      navbar.classList.contains('menu-is-open') ? closeMenu() : openMenu();
    });

    // Close on any nav link click
    links.addEventListener('click', e => {
      if (e.target.closest('.navbar__link')) closeMenu();
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!navbar.contains(e.target)) closeMenu();
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ============================================================
     5. SCROLL ANIMATIONS
     ============================================================ */
  function initScrollAnimations() {
    if (reducedMotion) return; // CSS handles this case — elements already visible

    const elements = qsa('[data-animate]');
    if (!elements.length) return;

    // Stagger feature cards
    qsa('.feature-card').forEach((card, i) => {
      card.style.transitionDelay = `${i * 80}ms`;
    });

    // Stagger audience cards
    qsa('.audience-card').forEach((card, i) => {
      card.style.transitionDelay = `${i * 80}ms`;
    });

    // Stagger scenario cards
    qsa('.scenario-card').forEach((card, i) => {
      card.style.transitionDelay = `${i * 100}ms`;
    });

    // Stagger trust cards
    qsa('.trust-card').forEach((card, i) => {
      card.style.transitionDelay = `${i * 80}ms`;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // fire once
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => observer.observe(el));
  }

  /* ============================================================
     6. CAROUSEL — 3-up rotating
     ============================================================ */
  function initCarousel() {
    const track    = qs('#carousel-track');
    const dotsWrap = qs('#carousel-dots');
    const prevBtn  = qs('#carousel-prev');
    const nextBtn  = qs('#carousel-next');
    if (!track) return;

    const slides  = qsa('.carousel__slide', track);
    const total   = slides.length;
    let current   = 0;
    let autoTimer = null;
    let idleTimer = null;

    // Build dots
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel__dot' + (i === 0 ? ' carousel__dot--active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to screenshot ${i + 1}`);
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.addEventListener('click', () => { goTo(i); resetAutoPlay(); });
      dotsWrap.appendChild(dot);
    });

    function getDots() { return qsa('.carousel__dot', dotsWrap); }

    // Shortest wrapped distance from cur to i
    function wrappedOffset(i, cur) {
      let d = i - cur;
      if (d >  total / 2) d -= total;
      if (d < -total / 2) d += total;
      return d;
    }

    function positionSlides() {
      const mobile = window.innerWidth <= 768;
      // How far apart the side slides sit from center (px)
      const xStep  = window.innerWidth <= 1024 ? 275 : 330;

      slides.forEach((slide, i) => {
        const offset = wrappedOffset(i, current);
        const abs    = Math.abs(offset);

        slide.classList.remove('carousel__slide--active');

        if (offset === 0) {
          // Active — center
          slide.classList.add('carousel__slide--active');
          slide.style.cssText =
            'opacity:1;transform:translateX(-50%) scale(1);z-index:3;pointer-events:auto;';

        } else if (abs === 1 && !mobile) {
          // Adjacent — visible side slides
          const x = offset * xStep;
          slide.style.cssText =
            `opacity:0.5;transform:translateX(calc(-50% + ${x}px)) scale(0.8);z-index:2;pointer-events:auto;cursor:pointer;`;

        } else {
          // Off-screen
          const dir = offset > 0 ? 1 : -1;
          slide.style.cssText =
            `opacity:0;transform:translateX(calc(-50% + ${dir * xStep * 2}px)) scale(0.65);z-index:1;pointer-events:none;cursor:default;`;
        }
      });

      // Update dots
      getDots().forEach((d, i) => {
        d.classList.toggle('carousel__dot--active', i === current);
        d.setAttribute('aria-selected', i === current ? 'true' : 'false');
      });
    }

    function goTo(index) {
      current = ((index % total) + total) % total;
      positionSlides();
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    // Clicking a side slide navigates to it; clicking active slide opens lightbox
    track.addEventListener('click', e => {
      const slide = e.target.closest('.carousel__slide');
      if (!slide) return;
      const idx = slides.indexOf(slide);
      if (idx === -1) return;
      if (idx === current) {
        window._openLightbox && window._openLightbox(idx);
      } else {
        goTo(idx); resetAutoPlay();
      }
    });

    // Expose goTo so lightbox can sync carousel
    track._carouselGoTo = goTo;

    function startAutoPlay() {
      if (reducedMotion) return;
      autoTimer = setInterval(next, 4500);
    }
    function stopAutoPlay() { clearInterval(autoTimer); autoTimer = null; }
    function resetAutoPlay() {
      stopAutoPlay();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(startAutoPlay, 8000);
    }

    prevBtn && prevBtn.addEventListener('click', () => { prev(); resetAutoPlay(); });
    nextBtn && nextBtn.addEventListener('click', () => { next(); resetAutoPlay(); });

    // Touch swipe
    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const delta = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(delta) > 50) { delta > 0 ? next() : prev(); resetAutoPlay(); }
    }, { passive: true });

    // Keyboard
    const carousel = qs('#screenshots-carousel');
    carousel && carousel.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { prev(); resetAutoPlay(); }
      if (e.key === 'ArrowRight') { next(); resetAutoPlay(); }
    });

    // Reposition on resize
    window.addEventListener('resize', positionSlides, { passive: true });

    goTo(0);
    startAutoPlay();
  }

  /* ============================================================
     7. LIGHTBOX
     ============================================================ */
  function initLightbox() {
    const lightbox  = qs('#lightbox');
    const img       = qs('#lightbox-img');
    const counter   = qs('#lightbox-counter');
    const closeBtn  = qs('#lightbox-close');
    const prevBtn   = qs('#lightbox-prev');
    const nextBtn   = qs('#lightbox-next');
    const track     = qs('#carousel-track');
    if (!lightbox || !track) return;

    const slides  = qsa('.carousel__slide', track);
    const total   = slides.length;
    let lbIndex   = 0;
    let prevFocus = null;

    function getImgSrc(idx) {
      const el = slides[idx];
      if (!el) return '';
      const i = el.querySelector('img');
      return i ? i.src : '';
    }

    function updateLightboxImage(idx) {
      lbIndex = ((idx % total) + total) % total;
      img.src = getImgSrc(lbIndex);
      counter.textContent = `${lbIndex + 1} / ${total}`;
    }

    function openLightbox(idx) {
      prevFocus = document.activeElement;
      updateLightboxImage(idx);
      lightbox.hidden = false;
      // Force reflow so opacity transition fires correctly
      lightbox.getBoundingClientRect();
      lightbox.style.opacity = '1';
      closeBtn.focus();
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.style.opacity = '0';
      lightbox.addEventListener('transitionend', function hide() {
        lightbox.hidden = true;
        lightbox.removeEventListener('transitionend', hide);
      });
      document.body.style.overflow = '';
      if (prevFocus) prevFocus.focus();
    }

    function lbNext() {
      updateLightboxImage(lbIndex + 1);
      track._carouselGoTo && track._carouselGoTo(lbIndex);
    }

    function lbPrev() {
      updateLightboxImage(lbIndex - 1);
      track._carouselGoTo && track._carouselGoTo(lbIndex);
    }

    // Expose openLightbox for the carousel click handler
    window._openLightbox = openLightbox;

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', lbPrev);
    nextBtn.addEventListener('click', lbNext);

    // Close on backdrop click (outside the frame)
    lightbox.addEventListener('click', e => {
      if (e.target === lightbox) closeLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', e => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape')     { closeLightbox(); }
      if (e.key === 'ArrowRight') { lbNext(); }
      if (e.key === 'ArrowLeft')  { lbPrev(); }
    });

    // Focus trap inside lightbox
    lightbox.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(lightbox.querySelectorAll('button'));
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  }

  /* ============================================================
     8. HERO EMBERS — domain cycling particle system
     ============================================================ */
  function initHeroEmbers() {
    const container = qs('.hero__embers');
    if (!container || reducedMotion) return;

    // 6 domains: Fury → Body → Calm → Mind → Order → Chaos
    const domains = [
      {
        // FURY — hot chaotic fire embers
        anim: 'ember-rise',
        colors: ['#ff4500', '#ff6b35', '#e8873e', '#c9a84c', '#ff2200', '#ffaa44'],
        count: 55, sizeMin: 1.5, sizeMax: 6,
        durMin: 5, durMax: 12, delayMax: 12,
        driftMin: -70, driftMax: 70,
        opMin: 0.45, opMax: 0.9,
        borderRadius: '50%',
      },
      {
        // BODY — heavy pulsing orbs, strength & physicality
        anim: 'body-heave',
        colors: ['#ff8c00', '#ff7f50', '#ff6347', '#e8643e', '#ff5722', '#ffa040'],
        count: 28, sizeMin: 4.5, sizeMax: 11,
        durMin: 7, durMax: 16, delayMax: 14,
        driftMin: -40, driftMax: 40,
        opMin: 0.4, opMax: 0.85,
        borderRadius: '50%',
      },
      {
        // CALM — gentle drifting teardrops, peace & water
        anim: 'calm-waft',
        colors: ['#00c896', '#00e5a0', '#26a69a', '#4caf50', '#43d9ab', '#00d4a0'],
        count: 42, sizeMin: 2, sizeMax: 5.5,
        durMin: 14, durMax: 26, delayMax: 20,
        driftMin: -90, driftMax: 90,
        opMin: 0.3, opMax: 0.65,
        borderRadius: '50% 50% 50% 0',
      },
      {
        // MIND — rapid twinkling sparks, intellect & magic
        anim: 'mind-twinkle',
        colors: ['#4fc3f7', '#29b6f6', '#00bcd4', '#40c4ff', '#81d4fa', '#00e5ff'],
        count: 65, sizeMin: 1, sizeMax: 3.5,
        durMin: 3, durMax: 8, delayMax: 7,
        driftMin: -25, driftMax: 25,
        opMin: 0.6, opMax: 1.0,
        borderRadius: '50%',
      },
      {
        // ORDER — slow disciplined diamonds, law & structure
        anim: 'order-ascend',
        colors: ['#ffd700', '#ffeb3b', '#fff176', '#f5c518', '#ffe566', '#ffcc00'],
        count: 35, sizeMin: 2, sizeMax: 5,
        durMin: 12, durMax: 22, delayMax: 18,
        driftMin: -8, driftMax: 8,
        opMin: 0.5, opMax: 0.9,
        borderRadius: '2px', // square — rotation in keyframe makes it a diamond
      },
      {
        // CHAOS — erratic spinning blobs, disorder & unpredictability
        anim: 'chaos-scatter',
        colors: ['#9d4edd', '#c77dff', '#7b2d8b', '#e040fb', '#ab47bc', '#ce93d8'],
        count: 52, sizeMin: 1.5, sizeMax: 6.5,
        durMin: 5, durMax: 13, delayMax: 11,
        driftMin: -100, driftMax: 100,
        opMin: 0.4, opMax: 0.9,
        borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
      },
    ];

    let currentIndex = 0;

    function spawnDomain(domain) {
      container.innerHTML = '';
      for (let i = 0; i < domain.count; i++) {
        const el = document.createElement('span');
        el.className = 'ember';

        const size  = (Math.random() * (domain.sizeMax - domain.sizeMin) + domain.sizeMin).toFixed(1);
        const x     = (Math.random() * 100).toFixed(1);
        const dur   = (Math.random() * (domain.durMax - domain.durMin) + domain.durMin).toFixed(1);
        const delay = -(Math.random() * domain.delayMax).toFixed(1);
        const drift = (Math.random() * (domain.driftMax - domain.driftMin) + domain.driftMin).toFixed(1);
        const op    = (Math.random() * (domain.opMax - domain.opMin) + domain.opMin).toFixed(2);
        const color = domain.colors[Math.floor(Math.random() * domain.colors.length)];

        el.style.cssText =
          `--size:${size}px;--x:${x}%;--dur:${dur}s;--delay:${delay}s;` +
          `--drift:${drift}px;--peak-opacity:${op};--ember-color:${color};` +
          `--anim-name:${domain.anim};--border-radius:${domain.borderRadius};`;

        container.appendChild(el);
      }
    }

    function cycleDomain() {
      container.style.transition = 'opacity 1.5s ease';
      container.style.opacity = '0';
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % domains.length;
        spawnDomain(domains[currentIndex]);
        container.style.opacity = '1';
      }, 1500);
    }

    spawnDomain(domains[0]);
    setInterval(cycleDomain, 5000); // 5s per domain = 30s full rotation
  }

  /* ============================================================
     8. HOVER GLOW (desktop only)
     ============================================================ */
  function initHoverGlows() {
    if (!hasHover) return;

    const grid = qs('.features__grid');
    if (!grid) return;

    grid.addEventListener('mousemove', e => {
      qsa('.feature-card', grid).forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width)  * 100;
        const y = ((e.clientY - rect.top)  / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
      });
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    initImageFallbacks();
    initNavbarScroll();
    initSmoothScroll();
    initScrollSpy();
    initMobileMenu();
    initScrollAnimations();
    initCarousel();
    initLightbox();
    initHeroEmbers();
    initHoverGlows();
  }

  document.addEventListener('DOMContentLoaded', init);

})();
