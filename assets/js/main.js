/* ═══════════════════════════════════════════════════════════════════════
   ATLAS · main.js
   Vanilla, sin dependencias. Todo degrada con gracia si algo no existe.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const SOFT  = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOUCH = matchMedia('(hover: none)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ─────────────────────────────────────────────────────────────────
     1 · Loader
     ───────────────────────────────────────────────────────────────── */
  (function loader() {
    const el = $('#loader');
    if (!el) return;
    document.body.classList.add('lock');

    const num = $('#loaderNum');
    const bar = $('#loaderBar');
    let p = 0;

    const tick = setInterval(() => {
      p = Math.min(p + Math.random() * 18 + 6, 100);
      if (num) num.textContent = Math.round(p);
      if (bar) bar.style.width = p + '%';
      if (p >= 100) clearInterval(tick);
    }, SOFT ? 10 : 130);

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      clearInterval(tick);
      if (num) num.textContent = '100';
      if (bar) bar.style.width = '100%';
      el.classList.add('done');
      document.body.classList.remove('lock');
      setTimeout(() => el.remove(), 900);
    };

    addEventListener('load', () => setTimeout(close, SOFT ? 0 : 900));
    setTimeout(close, 4000); // por si `load` nunca dispara
  })();

  /* ─────────────────────────────────────────────────────────────────
     2 · Año del footer
     ───────────────────────────────────────────────────────────────── */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ─────────────────────────────────────────────────────────────────
     3 · Split del título por palabras (cada una sube tras su máscara)
     ───────────────────────────────────────────────────────────────── */
  $$('[data-split]').forEach((el) => {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          // Conserva los espacios para que el texto siga fluyendo normal
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (part === '') return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const mask = document.createElement('span');
            mask.className = 'w';
            const inner = document.createElement('span');
            inner.className = 'wi';
            inner.textContent = part;
            mask.appendChild(inner);
            frag.appendChild(mask);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
    $$('.wi', el).forEach((w, i) => { w.style.setProperty('--wd', 220 + i * 75 + 'ms'); });
  });

  /* ─────────────────────────────────────────────────────────────────
     4 · Reveal al hacer scroll
     ───────────────────────────────────────────────────────────────── */
  const animated = $$('[data-anim]');
  if ('IntersectionObserver' in window && !SOFT) {
    const io = new IntersectionObserver((rows) => {
      rows.forEach((r) => {
        if (!r.isIntersecting) return;
        r.target.classList.add('in');
        io.unobserve(r.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    animated.forEach((el) => io.observe(el));
  } else {
    animated.forEach((el) => el.classList.add('in'));
  }

  // La celda del medidor necesita saber cuándo entra para animar el arco
  const gaugeCell = $('.cell--a');
  if (gaugeCell && 'IntersectionObserver' in window) {
    const gio = new IntersectionObserver((rows) => {
      rows.forEach((r) => {
        if (!r.isIntersecting) return;
        r.target.classList.add('in');
        gio.unobserve(r.target);
      });
    }, { threshold: 0.35 });
    gio.observe(gaugeCell);
  }

  /* ─────────────────────────────────────────────────────────────────
     5 · Contadores
     ───────────────────────────────────────────────────────────────── */
  const nf = new Intl.NumberFormat('es-BO');
  const easeOut = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  function count(el) {
    const to = parseFloat(el.dataset.count || '0');
    const sfx = el.dataset.suffix || '';
    if (SOFT || to === 0) { el.textContent = nf.format(to) + sfx; return; }
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min((now - t0) / 1700, 1);
      el.textContent = nf.format(Math.round(easeOut(p) * to)) + sfx;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((rows) => {
      rows.forEach((r) => {
        if (!r.isIntersecting) return;
        count(r.target);
        cio.unobserve(r.target);
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach(count);
  }

  /* ─────────────────────────────────────────────────────────────────
     6 · Nav: sticky, auto-hide, píldora y link activo
     ───────────────────────────────────────────────────────────────── */
  const nav = $('#nav');
  const menu = $('#navMenu');
  const burger = $('#burger');
  const pill = $('#navPill');
  const links = $$('.nav__link');
  let lastY = scrollY;

  burger?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.classList.toggle('lock', open);
  });

  menu?.addEventListener('click', (e) => {
    if (e.target.closest('a') && menu.classList.contains('open')) {
      menu.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('lock');
    }
  });

  // Píldora que sigue al link con hover
  if (pill && !TOUCH) {
    links.forEach((a) => {
      a.addEventListener('mouseenter', () => {
        pill.style.setProperty('--x', a.offsetLeft + 'px');
        pill.style.setProperty('--w', a.offsetWidth + 'px');
      });
    });
  }

  const sections = $$('main section[id]');
  const linkFor = new Map();
  links.forEach((a) => {
    const id = a.getAttribute('href').slice(1);
    if (id) linkFor.set(id, a);
  });

  /* ─────────────────────────────────────────────────────────────────
     7 · Tour: la pantalla del teléfono sigue al paso activo
     ───────────────────────────────────────────────────────────────── */
  const steps = $$('.tour__step');
  const screens = $$('.scr');
  const dots = $$('.tour__dots i');
  const tourNum = $('#tourNum');
  const tourName = $('#tourName');
  const NAMES = ['Registro', 'Tu cupo', 'Pago con QR', 'Plan de pago'];
  let currentScreen = 0;

  function setScreen(i) {
    if (i === currentScreen) return;
    currentScreen = i;
    screens.forEach((s, k) => s.classList.toggle('is-on', k === i));
    steps.forEach((s, k) => s.classList.toggle('on', k === i));
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
    if (tourNum) tourNum.textContent = i + 1;
    if (tourName) tourName.textContent = NAMES[i] || '';
  }

  if (steps.length && 'IntersectionObserver' in window) {
    const sio = new IntersectionObserver((rows) => {
      // El paso más centrado en pantalla manda
      let best = null;
      rows.forEach((r) => {
        if (r.isIntersecting && (!best || r.intersectionRatio > best.intersectionRatio)) best = r;
      });
      if (best) setScreen(Number(best.target.dataset.step));
    }, { threshold: [0.4, 0.6, 0.8], rootMargin: '-25% 0px -25% 0px' });
    steps.forEach((s) => sio.observe(s));
    steps[0].classList.add('on');
  } else {
    steps.forEach((s) => s.classList.add('on'));
  }

  /* ─────────────────────────────────────────────────────────────────
     7b · Movimiento ligado al scroll, continuo
     El paso activo cambia de golpe, pero el teléfono no: gira y escala
     de forma continua según cuánto llevas recorrido de la sección. El
     valor se suaviza con un lerp en cada cuadro; escribirlo directo
     desde el evento de scroll se siente escalonado.
     ───────────────────────────────────────────────────────────────── */
  (function scrollLinked() {
    if (SOFT) return;

    const targets = [
      { el: $('.tour__sticky'), sec: $('#tour') },
      { el: $('.hero__stage'),  sec: $('#hero') }
    ].filter((t) => t.el && t.sec);
    if (!targets.length) return;

    targets.forEach((t) => { t.now = 0.5; t.to = 0.5; t.live = false; });

    // La visibilidad se deduce del propio rect: depender de un observer
    // dejaba secciones sin actualizar cuando el scroll era instantáneo.
    function measure() {
      let any = false;
      for (const t of targets) {
        const r = t.sec.getBoundingClientRect();
        t.live = r.bottom > -200 && r.top < innerHeight + 200;
        if (!t.live) continue;
        any = true;
        // 0 cuando la sección entra por abajo, 1 cuando termina de salir
        t.to = clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
      }
      return any;
    }

    let loop = null;
    function tick() {
      let go = false;
      for (const t of targets) {
        if (!t.live) continue;
        t.now += (t.to - t.now) * 0.09;
        t.el.style.setProperty('--sp', t.now.toFixed(4));
        if (Math.abs(t.to - t.now) > 0.0004) go = true;
      }
      loop = go ? requestAnimationFrame(tick) : null;
    }

    function refresh() {
      measure();
      if (loop === null) tick();
    }

    addEventListener('scroll', refresh, { passive: true });
    addEventListener('resize', refresh);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    refresh();
  })();

  /* ─────────────────────────────────────────────────────────────────
     8 · Todo lo que depende del scroll (un solo listener + rAF)
     ───────────────────────────────────────────────────────────────── */
  const upBtn = $('#up');
  const upRing = $('#upRing');
  const pathFill = $('#pathFill');
  const pathSection = $('#niveles');
  const nodes = $$('.node');
  const RING = 151;

  function onScroll() {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? y / max : 0;

    // Nav
    nav.classList.toggle('stuck', y > 24);
    nav.classList.toggle('away', y > 460 && y > lastY && !menu.classList.contains('open'));
    nav.style.setProperty('--p', p * 100 + '%');
    lastY = y;

    // Botón subir + anillo de progreso
    upBtn.classList.toggle('show', y > 700);
    if (upRing) upRing.style.setProperty('--o', RING * (1 - p));

    // Link activo
    const probe = y + innerHeight * 0.3;
    let cur = null;
    sections.forEach((s) => { if (s.offsetTop <= probe) cur = s.id; });
    linkFor.forEach((a, id) => a.classList.toggle('on', id === cur));

    // Camino de niveles
    if (pathFill && pathSection) {
      const r = pathSection.getBoundingClientRect();
      const k = clamp((innerHeight * 0.8 - r.top) / (r.height * 0.55), 0, 1);
      pathFill.style.width = k * 100 + '%';
      nodes.forEach((n, i) => n.classList.toggle('reached', k >= (i + 0.5) / nodes.length));
    }
  }

  let queued = false;
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { onScroll(); queued = false; });
  }, { passive: true });

  upBtn?.addEventListener('click', () =>
    scrollTo({ top: 0, behavior: SOFT ? 'auto' : 'smooth' })
  );

  /* ─────────────────────────────────────────────────────────────────
     9 · Cursor, botones magnéticos, tilt y spotlight
     ───────────────────────────────────────────────────────────────── */
  if (!TOUCH && !SOFT) {
    const cur = $('#cursor');
    if (cur) {
      let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
      addEventListener('mousemove', (e) => {
        tx = e.clientX; ty = e.clientY;
        cur.classList.add('on');
      }, { passive: true });
      (function loop() {
        x += (tx - x) * 0.16;
        y += (ty - y) * 0.16;
        cur.style.transform = `translate3d(${x}px,${y}px,0)`;
        requestAnimationFrame(loop);
      })();

      const HOT = 'a,button,summary,input,.cell,.quote,.preset,.chip,.node__card';
      document.addEventListener('mouseover', (e) => {
        cur.classList.toggle('hot', !!e.target.closest(HOT));
      });
    }

    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.translate =
          `${(e.clientX - r.left - r.width / 2) * 0.26}px ${(e.clientY - r.top - r.height / 2) * 0.4}px`;
      });
      el.addEventListener('mouseleave', () => { el.style.translate = '0 0'; });
    });

    $$('[data-tilt]').forEach((el) => {
      const max = Number(el.dataset.tilt || 7);
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          `perspective(1200px) rotateY(${px * max}deg) rotateX(${-py * max}deg) scale(1.012)`;
        el.style.animationPlayState = 'paused';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.animationPlayState = '';
      });
    });
  }

  /* Escena 3D del hero: el mouse inclina el conjunto y cada objeto se
     desplaza segun su profundidad. Se apaga fuera de la vista. */
  (function scene3d() {
    const scene = $('#scene');
    if (!scene || TOUCH || SOFT) return;

    let tx = 0, ty = 0, x = 0, y = 0, visible = true, raf = null;

    addEventListener('mousemove', (e) => {
      tx = (e.clientX / innerWidth - 0.5) * 2;
      ty = (e.clientY / innerHeight - 0.5) * 2;
      if (raf === null) loop();
    }, { passive: true });

    function loop() {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      scene.style.setProperty('--mx', x.toFixed(4));
      scene.style.setProperty('--my', y.toFixed(4));
      const rest = Math.abs(tx - x) < 0.001 && Math.abs(ty - y) < 0.001;
      raf = (rest || !visible) ? null : requestAnimationFrame(loop);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; })
        .observe(scene);
    }
  })();

  if (!TOUCH) {
    $$('[data-spot]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     10 · Calculadora
     ───────────────────────────────────────────────────────────────── */
  (function calculator() {
    const slider = $('#amount');
    if (!slider) return;

    const out     = $('#amountOut');
    const donut   = $('#donut');
    const initOut = $('#initOut');
    const tl0     = $('#tl0');
    const quotas  = $$('.timeline .q');
    const totalO  = $('#totalOut');
    const chips   = $$('.chip');
    const presets = $$('.preset');
    const LEN     = 2 * Math.PI * 56;   // r = 56
    const N       = 3;                  // número de cuotas
    const EVERY   = 15;                 // días entre cuotas

    const money = (n) =>
      n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Fechas reales de cada cuota, a partir de hoy
    (function dates() {
      const fmt = new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'short' });
      for (let i = 1; i <= N; i++) {
        const d = new Date();
        d.setDate(d.getDate() + EVERY * i);
        const cell = $('#d' + i);
        if (cell) cell.textContent = fmt.format(d).replace('.', '');
      }
    })();

    let pct = 0.4;

    function render() {
      const amount  = Number(slider.value);
      const initial = amount * pct;
      const quota   = (amount - initial) / N;

      out.textContent     = nf.format(amount);
      initOut.textContent = money(initial);
      tl0.textContent     = 'Bs ' + money(initial);
      totalO.textContent  = money(amount);
      quotas.forEach((q) => { q.textContent = 'Bs ' + money(quota); });

      slider.style.setProperty('--fill',
        ((amount - slider.min) / (slider.max - slider.min)) * 100 + '%');

      donut.style.strokeDasharray  = LEN;
      donut.style.strokeDashoffset = LEN * (1 - pct);

      presets.forEach((p) => p.classList.toggle('on', Number(p.dataset.amount) === amount));
    }

    slider.addEventListener('input', render);

    presets.forEach((p) => {
      p.addEventListener('click', () => {
        slider.value = p.dataset.amount;
        render();
      });
    });

    chips.forEach((chip, i) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => { c.classList.remove('on'); c.setAttribute('aria-checked', 'false'); });
        chip.classList.add('on');
        chip.setAttribute('aria-checked', 'true');
        pct = Number(chip.dataset.initial);
        render();
      });
      // Flechas dentro del radiogroup
      chip.addEventListener('keydown', (e) => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
        e.preventDefault();
        const dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
        const next = chips[(i + dir + chips.length) % chips.length];
        next.focus();
        next.click();
      });
    });

    render();
  })();

  /* ─────────────────────────────────────────────────────────────────
     10b · Tabla comparativa: apaga el degradado al llegar al final
     ───────────────────────────────────────────────────────────────── */
  (function tableEdge() {
    const wrap = $('.table-wrap');
    if (!wrap) return;
    const check = () => {
      const end = wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 2;
      wrap.classList.toggle('at-end', end);
    };
    wrap.addEventListener('scroll', check, { passive: true });
    addEventListener('resize', check);
    check();
  })();

  /* ─────────────────────────────────────────────────────────────────
     11 · FAQ (uno abierto a la vez)
     ───────────────────────────────────────────────────────────────── */
  const asks = $$('.ask');
  asks.forEach((a) => {
    a.addEventListener('toggle', () => {
      if (a.open) asks.forEach((o) => { if (o !== a) o.open = false; });
    });
  });

  /* ─────────────────────────────────────────────────────────────────
     12 · Formulario (demo, sin backend)
     ───────────────────────────────────────────────────────────────── */
  $('#leadForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#leadEmail');
    const msg = $('#leadMsg');
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());

    msg.classList.toggle('err', !ok);
    msg.textContent = ok
      ? '¡Listo! Te escribiremos para activar tu cupo. 🎉'
      : 'Escribe un correo válido para continuar.';

    // TODO: conectar con el backend / CRM real de Atlas
    if (ok) e.target.reset(); else input.focus();
  });

  /* ─────────────────────────────────────────────────────────────────
     13 · Cuenta regresiva al lanzamiento
     La fecha vive en el data-launch de la sección, en index.html.
     ───────────────────────────────────────────────────────────────── */
  (function countdown() {
    const sec = $('#lanzamiento');
    const clock = $('#clock');
    if (!sec || !clock) return;

    const target = new Date(sec.dataset.launch).getTime();
    if (isNaN(target)) return;

    // Cada dígito es una columna 0-9: rodamos a la posición en vez de reescribir
    const rolls = {};
    $$('.digit', clock).forEach((d) => { rolls[d.dataset.d] = $('.digit__roll', d); });
    const H = () => $('.digit', clock).getBoundingClientRect().height;

    // La barra va del arranque de campaña al lanzamiento. Si no hay
    // data-start, usa una ventana de 90 días para no quedarse en cero.
    const started = new Date(sec.dataset.start).getTime();
    const start = isNaN(started) ? target - 90 * 864e5 : started;
    const fill = $('#launchFill');
    const pct = $('#launchPct');
    const dateOut = $('#clockDate');

    if (dateOut) {
      const fmt = new Intl.DateTimeFormat('es-BO', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
      dateOut.innerHTML = 'Lanzamiento el <b>' + fmt.format(new Date(target)) + '</b>';
    }

    function put(key, value) {
      const s = String(Math.min(value, 99)).padStart(2, '0');
      for (let i = 0; i < 2; i++) {
        const roll = rolls[key + i];
        if (roll) roll.style.transform = `translateY(-${Number(s[i]) * H()}px)`;
      }
    }

    let done = false;
    function tick() {
      const left = target - Date.now();

      if (left <= 0) {
        if (!done) {
          done = true;
          ['d', 'h', 'm', 's'].forEach((k) => put(k, 0));
          const t = $('.launch__title');
          if (t) t.innerHTML = '<em>¡Atlas ya está aquí!</em>';
          if (fill) fill.style.width = '100%';
          if (pct) pct.textContent = '100%';
        }
        return;
      }

      const sTotal = Math.floor(left / 1000);
      put('d', Math.floor(sTotal / 86400));
      put('h', Math.floor(sTotal / 3600) % 24);
      put('m', Math.floor(sTotal / 60) % 60);
      put('s', sTotal % 60);

      const p = clamp((Date.now() - start) / (target - start), 0, 1);
      if (fill) fill.style.width = (p * 100).toFixed(1) + '%';
      if (pct) pct.textContent = Math.round(p * 100) + '%';
    }

    tick();
    setInterval(tick, 1000);
    // Al cambiar el ancho cambia el alto del dígito, y con él el desplazamiento
    addEventListener('resize', () => {
      $$('.digit__roll', clock).forEach((r) => { r.style.transition = 'none'; });
      tick();
      requestAnimationFrame(() => {
        $$('.digit__roll', clock).forEach((r) => { r.style.transition = ''; });
      });
    });

    $('#waitForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#waitEmail');
      const msg = $('#waitMsg');
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      msg.classList.toggle('err', !ok);
      msg.textContent = ok
        ? '¡Anotado! Te escribimos el día del lanzamiento. 🚀'
        : 'Escribe un correo válido para anotarte.';
      // TODO: conectar con la lista de espera real
      if (ok) e.target.reset(); else input.focus();
    });
  })();

  /* ─────────────────────────────────────────────────────────────────
     14 · Fondo: partículas conectadas
     ───────────────────────────────────────────────────────────────── */
  (function field() {
    const cv = $('#fx');
    if (!cv || SOFT) return;
    const ctx = cv.getContext('2d');
    const TONES = ['139,92,246', '79,123,255', '45,227,176'];
    let w, h, dots = [], raf = null;

    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const n = Math.min(Math.round((w * h) / 22000), 80);
      dots = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.26, vy: (Math.random() - 0.5) * 0.26,
        r: Math.random() * 1.7 + 0.6,
        c: TONES[(Math.random() * TONES.length) | 0],
        a: Math.random() * 0.45 + 0.2
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < dots.length; i++) {
        const p = dots[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = `rgba(${p.c},${p.a})`;
        ctx.fill();

        for (let j = i + 1; j < dots.length; j++) {
          const q = dots[j];
          const dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
          if (d2 < 15625) {                       // 125px
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${p.c},${0.12 * (1 - d2 / 15625)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    const start = () => { if (raf === null) draw(); };
    const stop  = () => { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } };

    size(); start();

    let t;
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(size, 200); });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  })();

  /* ─────────────────────────────────────────────────────────────────
     15 · Scroll suave con offset de navbar
     ───────────────────────────────────────────────────────────────── */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = $(id);
    if (!target) return;

    e.preventDefault();
    scrollTo({ top: target.getBoundingClientRect().top + scrollY - 72,
               behavior: SOFT ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });

  onScroll();
})();
