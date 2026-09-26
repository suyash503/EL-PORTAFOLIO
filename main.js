/* House Singh — Suyash Singh's portfolio */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- headline reveals ---------- */
  var reveals = $$('.rv');
  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { revealIO.observe(el); });
    // never leave a headline hidden if the observer is slow to fire
    setTimeout(function () { reveals.forEach(function (el) { el.classList.add('in'); }); }, 9000);
  }

  /* ---------- active section in the rail and pill ---------- */
  var navLinks = $$('[data-nav]');
  var sections = ['house', 'deeds', 'chronicle', 'armoury', 'raven'].map(function (id) { return document.getElementById(id); });
  function setActive(id) {
    navLinks.forEach(function (a) {
      var on = a.getAttribute('data-nav') === id;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }
  function pickActive() {
    var mid = window.innerHeight * 0.42, active = 'house';
    sections.forEach(function (s) { if (s && s.getBoundingClientRect().top <= mid) active = s.id; });
    setActive(active);
  }

  /* ---------- drawers ---------- */
  $$('.drawer-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      var list = document.getElementById(btn.getAttribute('aria-controls'));
      if (list) list.hidden = !open;
      var sign = $('b', btn);
      if (sign) sign.textContent = open ? '−' : '+';
    });
  });

  /* ---------- more deeds filter ---------- */
  var cards = $$('.card');
  var countEl = $('.more-count');
  $$('.filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      $$('.filter').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      var shown = 0;
      cards.forEach(function (c) {
        var tags = (c.getAttribute('data-tags') || '').split(' ');
        var show = f === 'all' || tags.indexOf(f) !== -1;
        c.hidden = !show;
        if (show) shown++;
      });
      if (countEl) countEl.textContent = shown + ' of ' + cards.length + ' shown';
    });
  });

  /* ---------- armoury: which deeds used a skill ---------- */
  var DEEDS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  var SK = {
    'Python': ['I', 'II', 'VI', 'VIII', 'IX'], 'JavaScript': ['II', 'III', 'IV'], 'TypeScript': ['IV', 'V', 'VI', 'VII', 'X', 'XI'],
    'Kotlin': ['VII'], 'C++': [], 'React.js': ['II', 'X'], 'Next.js': ['V', 'VI', 'VII', 'IX', 'XI'], 'React Native': ['IV'],
    'Node.js': ['III', 'IV'], 'FastAPI': ['II', 'VIII'], 'Express': ['IV'],
    'RAG pipelines': ['I', 'VIII'], 'LangChain': ['I'], 'Vector search': ['I'], 'Prompt engineering': ['I', 'II', 'VIII', 'IX'],
    'Gemini': ['I', 'VIII'], 'Groq / Llama 3': ['II'],
    'MongoDB Atlas': ['I'], 'PostgreSQL': ['V', 'VI', 'X'], 'SQLite': ['II', 'XI'], 'ChromaDB': [], 'Prisma': ['V', 'X', 'XI'],
    'Docker': ['IV', 'V', 'VII', 'X'], 'Kubernetes': ['VII'], 'Vercel': ['II', 'III', 'VI'], 'Render': [],
    'Git': DEEDS.slice(), 'Vite': ['II', 'III', 'X'], 'Streamlit': ['I'], 'Pydantic': ['II'], 'SQLAlchemy': ['II'], 'OAuth 2.0': ['II'],
    'WebSockets / SSE': ['IV', 'V'], 'GraphQL': ['X'], 'Unit testing': ['III', 'IV', 'VII', 'VIII'], 'REST design': ['II', 'IV', 'V', 'VII']
  };
  var chips = $$('.chip');
  var plaques = $$('.pq');
  var skillEl = $('.proof-skill'), lineEl = $('.proof-line');
  var current = null;
  function pickSkill(name) {
    if (name === current) return;
    current = name;
    var used = SK[name] || [];
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-skill') === name)); });
    plaques.forEach(function (p) { p.classList.toggle('lit', used.indexOf(p.getAttribute('data-deed')) !== -1); });
    if (skillEl) skillEl.textContent = name;
    if (lineEl) {
      lineEl.textContent = used.length === 0 ? 'Drawn outside these deeds.'
        : used.length === DEEDS.length ? 'Drawn in every deed.'
        : 'Drawn in ' + used.length + ' of ' + DEEDS.length + ' deeds.';
    }
  }
  chips.forEach(function (c) {
    var go = function () { pickSkill(c.getAttribute('data-skill')); };
    c.addEventListener('mouseenter', go);
    c.addEventListener('focus', go);
    c.addEventListener('click', go);
  });
  if (chips.length) pickSkill('Python');

  /* ---------- chronicle: the ink line, drawn by hand to fit, inked on scroll ---------- */
  var timeline = $('.timeline'), tlSvg = $('.tl-line'), tlPath = $('.tl-path');
  function drawTimelinePath() {
    if (!timeline || !tlSvg || !tlPath) return;
    var h = Math.max(40, Math.round(tlSvg.getBoundingClientRect().height));
    var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var x = 12, step = 48, d = 'M' + x + ',0';
    for (var y = step; y < h + step; y += step) {
      var yy = Math.min(y, h);
      d += ' C' + (x + (rnd() - 0.5) * 5).toFixed(1) + ',' + (yy - step * 0.66).toFixed(1) + ' ' +
        (x + (rnd() - 0.5) * 5).toFixed(1) + ',' + (yy - step * 0.33).toFixed(1) + ' ' +
        (x + (rnd() - 0.5) * 2.4).toFixed(1) + ',' + yy;
      if (yy === h) break;
    }
    tlSvg.setAttribute('viewBox', '0 0 24 ' + h);
    tlPath.setAttribute('d', d);
    tlPath.setAttribute('pathLength', '1');
    inkTimeline();
  }
  function inkTimeline() {
    if (!timeline || !tlPath) return;
    if (reduced) { tlPath.style.strokeDashoffset = '0'; return; }
    var r = timeline.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, (window.innerHeight * 0.75 - r.top) / r.height));
    tlPath.style.strokeDashoffset = String(1 - p);
  }

  /* ---------- raven: break the seal to copy ---------- */
  var seal = $('.sealbtn');
  var EMAIL = 'suyashsingh2711@gmail.com';
  if (seal) {
    var hint = $('.seal-msg .hint'), copied = $('.seal-msg .copied');
    seal.addEventListener('click', function () {
      var cracked = !seal.classList.contains('cracked');
      if (cracked) {
        try { if (navigator.clipboard) navigator.clipboard.writeText(EMAIL).catch(function () {}); } catch (e) { /* the address is still on the envelope */ }
      }
      seal.classList.toggle('cracked', cracked);
      seal.setAttribute('aria-label', cracked ? 'Seal the letter again' : 'Break the seal: copy ' + EMAIL);
      if (hint) hint.hidden = cracked;
      if (copied) copied.hidden = !cracked;
    });
  }

  /* ---------- the IST clock ---------- */
  var clock = $('.clock');
  function tick() {
    if (!clock) return;
    try { clock.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }); }
    catch (e) { clock.textContent = new Date().toTimeString().slice(0, 8); }
  }
  tick(); setInterval(tick, 1000);

  /* ---------- the hero sky: stars and snow ---------- */
  var hero = $('#house'), sky = $('.sky');
  var heroVisible = true;
  var skyState = null;
  function sizeSky() {
    if (!sky) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = sky.offsetWidth, h = sky.offsetHeight;
    sky.width = Math.max(1, w * dpr); sky.height = Math.max(1, h * dpr);
    var ctx = sky.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var stars = [], flakes = [], i;
    var count = Math.round(w * h / 4200);
    for (i = 0; i < count; i++) {
      var big = Math.random() > 0.955;
      stars.push({ x: Math.random() * w, y: Math.random() * h * 0.92, r: big ? 1.2 + Math.random() * 0.9 : 0.35 + Math.random() * 0.7,
        a: 0.16 + Math.random() * 0.7, sp: 0.0006 + Math.random() * 0.0022, ph: Math.random() * Math.PI * 2 });
    }
    var fc = Math.round(w / 30);
    for (i = 0; i < fc; i++) {
      flakes.push({ x: Math.random() * w, y: Math.random() * h, r: 0.7 + Math.random() * 1.5, vy: 7 + Math.random() * 16,
        sway: 12 + Math.random() * 26, ph: Math.random() * Math.PI * 2, a: 0.16 + Math.random() * 0.34 });
    }
    skyState = { ctx: ctx, w: w, h: h, stars: stars, flakes: flakes };
    if (reduced) drawSky(0);
  }
  function drawSky(t) {
    if (!skyState) return;
    var s = skyState, ctx = s.ctx, i;
    ctx.clearRect(0, 0, s.w, s.h);
    for (i = 0; i < s.stars.length; i++) {
      var st = s.stars[i];
      var tw = reduced ? 1 : 0.62 + 0.38 * Math.sin(t * st.sp + st.ph);
      ctx.globalAlpha = Math.min(1, st.a * tw);
      ctx.fillStyle = st.r > 1.15 ? '#EAF1FA' : '#B9CCE2';
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.2832); ctx.fill();
      if (st.r > 1.15) { ctx.globalAlpha = 0.09 * tw; ctx.beginPath(); ctx.arc(st.x, st.y, st.r * 5.5, 0, 6.2832); ctx.fill(); }
    }
    if (!reduced) {
      var ts = t / 1000;
      ctx.fillStyle = '#DCE8F5';
      for (i = 0; i < s.flakes.length; i++) {
        var f = s.flakes[i];
        var y = ((f.y + ts * f.vy) % (s.h + 60) + (s.h + 60)) % (s.h + 60) - 30;
        var x = f.x + Math.sin(ts * 0.42 + f.ph) * f.sway;
        ctx.globalAlpha = f.a;
        ctx.beginPath(); ctx.arc(x, y, f.r, 0, 6.2832); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    drawConstellation(s);
  }

  /* ---------- hero cursor: a gold ring trails the pointer and the nearest stars reach for it ---------- */
  var ring = $('.c-ring'), dot = $('.c-dot');
  var useCursor = !!(finePointer && !reduced && ring && dot && hero);
  var cur = { px: 0, py: 0, x: 0, y: 0, live: false, inHero: false, glow: 0, over: false };
  if (useCursor) {
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      cur.px = e.clientX; cur.py = e.clientY;
      if (!cur.live) { cur.live = true; cur.x = e.clientX; cur.y = e.clientY; }
      if (!cur.inHero) { cur.inHero = true; hero.classList.add('cursor-on'); }
      var over = !!(e.target && e.target.closest && e.target.closest('a, button'));
      if (over !== cur.over) { cur.over = over; ring.classList.toggle('over', over); dot.classList.toggle('over', over); }
    });
    hero.addEventListener('pointerleave', function () { cur.inHero = false; cur.live = false; hero.classList.remove('cursor-on'); });
    hero.addEventListener('pointerdown', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      ring.classList.remove('pulse');
      void ring.offsetWidth;            // restart the pulse on every click
      ring.classList.add('pulse');
    });
  }
  function moveCursor(dt) {
    var on = cur.inHero && cur.live;
    cur.glow += ((on ? 1 : 0) - cur.glow) * Math.min(1, dt * 6);
    var op = on ? '1' : '0';
    if (ring.style.opacity !== op) { ring.style.opacity = op; dot.style.opacity = op; }
    if (!on) return;
    var k = 1 - Math.pow(0.0004, dt);   // the ring lags a touch behind the dot
    cur.x += (cur.px - cur.x) * k; cur.y += (cur.py - cur.y) * k;
    ring.style.transform = 'translate3d(' + cur.x.toFixed(1) + 'px,' + cur.y.toFixed(1) + 'px,0)';
    dot.style.transform = 'translate3d(' + cur.px + 'px,' + cur.py + 'px,0)';
  }
  // hairlines from the ring to the few stars nearest it, fading with distance
  function drawConstellation(s) {
    if (!useCursor || cur.glow < 0.01 || !cur.live) return;
    var r = hero.getBoundingClientRect();
    var cx = cur.x - r.left, cy = cur.y - r.top, R = 170, near = [], i;
    for (i = 0; i < s.stars.length; i++) {
      var dx = s.stars[i].x - cx, dy = s.stars[i].y - cy, d = dx * dx + dy * dy;
      if (d < R * R) near.push([d, s.stars[i]]);
    }
    near.sort(function (a, b) { return a[0] - b[0]; });
    var ctx = s.ctx;
    ctx.lineWidth = 0.8;
    for (i = 0; i < near.length && i < 6; i++) {
      var st = near[i][1], f = 1 - Math.sqrt(near[i][0]) / R;
      ctx.globalAlpha = f * 0.6 * cur.glow;
      ctx.strokeStyle = '#C8A961';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(st.x, st.y); ctx.stroke();
      ctx.globalAlpha = Math.min(1, 0.35 + f) * cur.glow;
      ctx.fillStyle = '#E7CB82';
      ctx.beginPath(); ctx.arc(st.x, st.y, Math.max(1.2, st.r * 1.3), 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- one animation loop, idle when nothing is on screen ---------- */
  var prevT = 0;
  function frame(t) {
    var dt = Math.min(0.05, (t - (prevT || t)) / 1000);
    prevT = t;
    if (useCursor) moveCursor(dt);
    if (heroVisible && !reduced) drawSky(t);
    requestAnimationFrame(frame);
  }
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { heroVisible = entries[0].isIntersecting; }).observe(hero);
  }

  /* ---------- wiring ---------- */
  var scrollQueued = false;
  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function () { scrollQueued = false; pickActive(); inkTimeline(); });
  }
  var resizeT;
  function onResize() {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { sizeSky(); drawTimelinePath(); onScroll(); }, 150);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', drawTimelinePath);

  sizeSky();
  drawTimelinePath();
  pickActive();
  if (!reduced) requestAnimationFrame(frame);
})();
