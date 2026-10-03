/* Cablea la landing con la app web y las tiendas según assets/js/config.js. */
(function () {
  const L = window.ATLAS_LINKS || {};
  const base = (L.webApp || '').replace(/\/+$/, '');
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // Entrar / crear cuenta → la app web; sin dominio, las páginas de muestra.
  if (base) {
    const dest = { login: base + L.loginPath, signup: base + L.signupPath };
    $$('[data-atlas-link]').forEach((a) => { a.href = dest[a.dataset.atlasLink] || a.href; });
    // Las páginas de muestra no autentican a nadie: con dominio puesto, mandan a la app real.
    const page = document.body.dataset.atlasRedirect;
    if (page && dest[page]) location.replace(dest[page]);
  }

  // Tiendas: enlace real o «Próximamente», nunca un «#» que no hace nada.
  $$('[data-store]').forEach((a) => {
    const url = L[a.dataset.store];
    const label = a.querySelector('span');
    if (url) {
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      a.removeAttribute('href');
      a.setAttribute('aria-disabled', 'true');
      a.classList.add('store--soon');
      if (label) label.textContent = 'Próximamente en';
    }
  });

})();
