/* ═══════════════════════════════════════════════════════════════════════
   ATLAS · Login y registro
   Validación en cliente. NO envía nada todavía: ver el TODO de submit().
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ── Concepto de marca desde la URL (?c=b) ────────────────────────
     Solo para la demo: así el logo no cambia al entrar desde una de las
     páginas de concepto. Se puede borrar junto con el resto del material
     de presentación.                                                   */
  (function markFromUrl() {
    const c = (new URLSearchParams(location.search).get('c') || 'a').toUpperCase();
    if (!'ABC'.includes(c) || c === 'A') return;
    $$('use[href^="#mark"]').forEach((u) => u.setAttribute('href', '#mark' + c));
    const fav = $('#favicon');
    if (fav) fav.href = 'assets/img/logo-' + c.toLowerCase() + '.svg';
    // Y que los enlaces internos no pierdan el concepto: volver al sitio
    // tiene que devolverte a la versión de la que veniste.
    const slug = c.toLowerCase();
    $$('a[href$=".html"]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href === 'index.html') a.href = 'concepto-' + slug + '.html';
      else a.href = href + '?c=' + slug;
    });
  })();

  /* ── Año ──────────────────────────────────────────────────────────── */
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();

  /* ── Ver / ocultar contraseña ─────────────────────────────────────── */
  $$('.peek').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = $('#' + btn.dataset.for);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  });

  /* ── Fuerza de la contraseña ──────────────────────────────────────── */
  const LEVELS = ['Muy débil', 'Débil', 'Aceptable', 'Segura'];

  function strength(v) {
    if (!v) return 0;
    let s = 0;
    if (v.length >= 8) s++;
    if (v.length >= 12) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/\d/.test(v) && /[^\w\s]/.test(v)) s++;
    return Math.min(s, 4);
  }

  const pass = $('#pass');
  const meter = $('#meter');
  const meterLbl = $('#meterLbl');
  if (pass && meter) {
    pass.addEventListener('input', () => {
      const s = strength(pass.value);
      meter.className = 'meter' + (s ? ' s' + s : '');
      meterLbl.textContent = pass.value ? LEVELS[s - 1] || LEVELS[0] : 'Mínimo 8 caracteres';
    });
  }

  /* ── Validación ───────────────────────────────────────────────────── */
  const RULES = {
    email:  (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Escribe un correo válido.',
    user:   (v) => (v.trim().length > 3) || 'Escribe tu correo o teléfono.',
    name:   (v) => (v.trim().length >= 3 && v.trim().includes(' ')) || 'Escribe tu nombre y apellido.',
    // Cédula de identidad boliviana: 5 a 8 dígitos, con o sin puntos
    cedula: (v) => /^\d{5,8}$/.test(v.replace(/[.\s]/g, '')) || 'Cédula inválida. Solo números.',
    phone:  (v) => /^[67]\d{7}$/.test(v.replace(/[\s-]/g, '')) || 'Son 8 dígitos y empieza en 6 o 7.',
    pass:   (v) => (v.length >= 8) || 'La contraseña necesita al menos 8 caracteres.',
    login:  (v) => (v.length >= 1) || 'Escribe tu contraseña.'
  };

  function validate(input) {
    const field = input.closest('.field');
    const rule = RULES[input.dataset.rule];
    if (!rule) return true;

    const res = rule(input.value);
    const ok = res === true;
    field.classList.toggle('bad', !ok);
    input.setAttribute('aria-invalid', String(!ok));
    const err = $('.field__err', field);
    if (err) err.textContent = ok ? '' : res;
    return ok;
  }

  $$('[data-rule]').forEach((input) => {
    // Solo se marca en rojo un campo donde llegaste a escribir. Salir de un
    // campo vacío que apenas tocaste no es un error todavía: eso se avisa
    // al enviar, no antes.
    input.addEventListener('blur', () => {
      if (input.value.trim()) validate(input);
    });
    input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('bad')) validate(input);
      live();
    });
  });

  /* ── Tarjeta en vivo ──────────────────────────────────────────────
     El panel deja de ser decoración: muestra la cuenta armándose con lo
     que vas escribiendo. ── */
  const card = $('#liveCard');
  const cardName = $('#cardName');
  const cardNo = $('#cardNo');
  const readyList = $('#ready');

  function live() {
    if (cardName) {
      const v = ($('#name')?.value || '').trim().replace(/\s+/g, ' ');
      if (v.length > 1) {
        const p = v.split(' ');
        // Formato de tarjeta: inicial del nombre + apellido
        const txt = (p.length > 1 ? p[0][0] + '. ' + p.slice(1).join(' ') : p[0]).toUpperCase();
        cardName.textContent = txt.slice(0, 22);
        card.classList.add('named');
      } else {
        cardName.textContent = 'TU NOMBRE';
        card.classList.remove('named');
      }
    }
    if (cardNo) {
      const ci = ($('#cedula')?.value || '').replace(/\D/g, '');
      cardNo.textContent = ci.length >= 4 ? ci.slice(-4) : '••••';
    }
    if (readyList) {
      $$('li', readyList).forEach((li) => {
        const input = $('#' + li.dataset.for);
        const rule = input && RULES[input.dataset.rule];
        li.classList.toggle('ok', !!(input && rule && input.value.trim() && rule(input.value) === true));
      });
    }
  }
  live();

  /* Inclinación y brillo siguiendo al puntero: la vuelve un objeto físico */
  if (card && !matchMedia('(hover: none)').matches &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const side = card.closest('.auth__side') || card;
    side.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--rx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      card.style.setProperty('--ry', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      card.style.setProperty('--gx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--gy', (e.clientY - r.top) + 'px');
      card.classList.add('lit');
    });
    side.addEventListener('mouseleave', () => {
      card.style.setProperty('--rx', 0);
      card.style.setProperty('--ry', 0);
      card.classList.remove('lit');
    });
  }

  /* ── Envío ────────────────────────────────────────────────────────── */
  const form = $('#authForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = $('#authMsg');

    let ok = true;
    let first = null;
    $$('[data-rule]', form).forEach((input) => {
      if (!validate(input)) { ok = false; first = first || input; }
    });

    const terms = $('#terms');
    if (terms && !terms.checked) {
      ok = false;
      first = first || terms;
      msg.classList.add('err');
      msg.textContent = 'Necesitas aceptar los términos para continuar.';
    }

    if (!ok) {
      if (!msg.textContent) {
        msg.classList.add('err');
        msg.textContent = 'Revisa los campos marcados.';
      }
      first?.focus();
      return;
    }

    // TODO: aquí va la llamada real a la API de Atlas.
    // Hoy solo confirma en pantalla: no hay backend ni se guarda nada.
    msg.classList.remove('err');
    msg.textContent = form.dataset.done || 'Listo.';
    form.querySelector('button[type="submit"]').disabled = true;
  });
})();
