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
  }

  /* ---------- the raven: follows the pointer across the hero, drops a feather on click ---------- */
  var ravenEl = $('.raven-cursor'), featherCv = $('.feathers');
  var wingNear = ravenEl && $('.wing-near', ravenEl), wingFar = ravenEl && $('.wing-far', ravenEl);
  var useRaven = !!(finePointer && !reduced && ravenEl && featherCv && hero);
  var RAVEN_W = 120, RAVEN_H = 60;           // matches .raven-cursor; the beak tip sits at 96.7% / 60.8%
  var bird = { px: 0, py: 0, x: 0, y: 0, ang: 0, flap: 0, live: false, inHero: false };
  var feathers = [], fctx = null;
  function sizeFeathers() {
    if (!featherCv) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    featherCv.width = window.innerWidth * dpr; featherCv.height = window.innerHeight * dpr;
    fctx = featherCv.getContext('2d'); fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  if (useRaven) {
    sizeFeathers();
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      bird.px = e.clientX; bird.py = e.clientY;
      if (!bird.live) { bird.live = true; bird.x = e.clientX; bird.y = e.clientY; }
      if (!bird.inHero) { bird.inHero = true; hero.classList.add('raven-on'); }
    });
    hero.addEventListener('pointerleave', function () { bird.inHero = false; bird.live = false; hero.classList.remove('raven-on'); });
    hero.addEventListener('pointerdown', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var t = e.target, onControl = !!(t && t.closest && t.closest('a, button'));
      // the feather leaves from the bird's body, a little behind the beak
      var ox = bird.live ? bird.x - Math.cos(bird.ang) * 40 : e.clientX;
      var oy = bird.live ? bird.y - Math.sin(bird.ang) * 40 : e.clientY;
      for (var i = 0, n = onControl ? 3 : 1; i < n; i++) {
        feathers.push({ x: ox + (Math.random() - 0.5) * 16, y: oy + 6, vx: (Math.random() - 0.5) * 60, vy: -24 - Math.random() * 36,
          rot: Math.random() * 6.2832, vr: (Math.random() - 0.5) * 2.4, ph: Math.random() * 6.2832,
          size: 18 + Math.random() * 10, life: 0, ttl: 2.4 + Math.random() * 1.2 });
      }
      if (feathers.length > 40) feathers.splice(0, feathers.length - 40);
    });
  }
  function setWing(g, k) { if (g) g.setAttribute('transform', 'translate(0 32) scale(1 ' + k.toFixed(3) + ') translate(0 -32)'); }
  function flyRaven(dt) {
    if (!bird.inHero || !bird.live) { if (ravenEl.style.opacity !== '0') ravenEl.style.opacity = '0'; return; }
    var follow = 1 - Math.pow(0.0016, dt);
    var ddx = bird.px - bird.x, ddy = bird.py - bird.y, dist = Math.hypot(ddx, ddy);
    bird.x += ddx * follow; bird.y += ddy * follow;
    if (dist > 1.2) {
      var want = Math.atan2(bird.py - bird.y, bird.px - bird.x), diff = want - bird.ang;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      bird.ang += diff * (1 - Math.pow(0.004, dt));
    }
    // beats hard while chasing, settles into a slow glide near the pointer
    var chase = Math.min(1, dist / 60);
    bird.flap += dt * (4 + chase * 10);
    var base = 0.35 - 0.23 * chase, amp = 0.45 + 0.43 * chase;
    setWing(wingNear, base + amp * Math.sin(bird.flap));
    setWing(wingFar, (base + amp * Math.sin(bird.flap - 0.35)) * 0.85);
    var deg = bird.ang * 180 / Math.PI, flip = Math.abs(deg) > 90 ? -1 : 1;
    ravenEl.style.transformOrigin = '96.7% 60.8%';
    ravenEl.style.opacity = '1';
    ravenEl.style.transform = 'translate3d(' + (bird.x - RAVEN_W * 0.967).toFixed(2) + 'px,' + (bird.y - RAVEN_H * 0.608).toFixed(2) + 'px,0) rotate(' +
      deg.toFixed(2) + 'deg) scaleY(' + flip + ')';
  }
  function drawFeather(ctx, p, a) {
    var s = p.size, j;
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.globalAlpha = a;
    ctx.shadowColor = 'rgba(200,169,97,0.5)'; ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, 0);
    ctx.bezierCurveTo(-s * 0.2, -s * 0.24, s * 0.3, -s * 0.2, s * 0.52, 0);
    ctx.bezierCurveTo(s * 0.3, s * 0.16, -s * 0.2, s * 0.2, -s * 0.5, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(200,169,97,0.32)'; ctx.fill();
    ctx.strokeStyle = 'rgba(231,203,130,0.9)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.moveTo(-s * 0.66, 0); ctx.lineTo(s * 0.52, 0);
    ctx.strokeStyle = '#E7CB82'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath();
    for (j = 1; j <= 4; j++) {
      var x = -s * 0.36 + j * s * 0.15;
      ctx.moveTo(x, 0); ctx.lineTo(x + s * 0.08, -s * 0.14);
      ctx.moveTo(x, 0); ctx.lineTo(x + s * 0.08, s * 0.11);
    }
    ctx.strokeStyle = 'rgba(231,203,130,0.45)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.restore();
  }
  function drawFeathers(dt) {
    if (!fctx) return;
    var w = window.innerWidth, h = window.innerHeight;
    fctx.clearRect(0, 0, w, h);
    if (!feathers.length) return;
    var next = [];
    for (var i = 0; i < feathers.length; i++) {
      var p = feathers[i];
      p.life += dt;
      var k = p.life / p.ttl;
      if (k >= 1 || p.y > h + 40) continue;
      p.vy += (38 - p.vy) * Math.min(1, dt * 1.5);       // eases into a slow fall
      p.vx *= 1 - 0.8 * dt;
      p.x += (p.vx + Math.sin(p.life * 2.2 + p.ph) * 34) * dt;
      p.y += p.vy * dt;
      p.rot += (p.vr + Math.cos(p.life * 2.2 + p.ph) * 0.9) * dt;   // rocks as it drifts
      var a = k < 0.08 ? k / 0.08 : 1 - Math.pow((k - 0.08) / 0.92, 2);
      drawFeather(fctx, p, a);
      next.push(p);
    }
    feathers = next;
  }

  /* ---------- one animation loop, idle when nothing is on screen ---------- */
  var prevT = 0;
  function frame(t) {
    var dt = Math.min(0.05, (t - (prevT || t)) / 1000);
    prevT = t;
    if (heroVisible && !reduced) drawSky(t);
    if (useRaven) { flyRaven(dt); drawFeathers(dt); }
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
    resizeT = setTimeout(function () { sizeSky(); sizeFeathers(); drawTimelinePath(); onScroll(); }, 150);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', drawTimelinePath);

  sizeSky();
  drawTimelinePath();
  pickActive();
  if (!reduced) requestAnimationFrame(frame);
})();
