/* ═══════════════════════════════════════════════════════════════════════
   ATLAS · Panel de previsualización — TEMPORAL
   Cambia el concepto de logo y la ruta de degradado en vivo.
   Ver assets/css/preview.css para las instrucciones de borrado.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const panel = document.getElementById('preview');
  if (!panel) return;

  const KEY = 'atlas-preview';
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  })();

  let concept = saved.concept || 'A';
  let route   = saved.route   || 'blue';
  let open    = saved.open === true;   // arranca plegado para no tapar el sitio

  const favicon = document.getElementById('favicon');

  function applyConcept(c) {
    concept = c;
    // Todas las marcas del sitio apuntan al mismo símbolo.
    // Las miniaturas del panel se quedan como están: son el selector.
    document.querySelectorAll('use[href^="#mark"]').forEach((u) => {
      if (u.closest('#preview')) return;
      u.setAttribute('href', '#mark' + c);
    });
    if (favicon) favicon.href = 'assets/img/logo-' + c.toLowerCase() + '.svg';
    panel.querySelectorAll('[data-concept]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.concept === c));
    });
  }

  function applyRoute(r) {
    route = r;
    // "blue" es la ruta por defecto: vive en style.css, sin atributo
    if (r === 'blue') document.body.removeAttribute('data-route');
    else document.body.setAttribute('data-route', r);
    panel.querySelectorAll('[data-route-key]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.routeKey === r));
    });
  }

  function applyOpen(o) {
    open = o;
    panel.classList.toggle('min', !o);
    panel.querySelector('.pv__head').setAttribute('aria-expanded', String(o));
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ concept, route, open })); } catch { /* sin storage */ }
  }

  panel.addEventListener('click', (e) => {
    const mark = e.target.closest('[data-concept]');
    if (mark) { applyConcept(mark.dataset.concept); save(); return; }

    const rt = e.target.closest('[data-route-key]');
    if (rt) { applyRoute(rt.dataset.routeKey); save(); return; }

    if (e.target.closest('.pv__head')) { applyOpen(!open); save(); }
  });

  applyConcept(concept);
  applyRoute(route);
  applyOpen(open);
})();
