/* Enlaces de la landing: lo ÚNICO que hay que editar al poner el dominio.
   Esta página es pública: aquí sólo van URLs, nunca claves. */
window.ATLAS_LINKS = {
  // Dominio de la app web del cliente (sin «/» final). Ej.: 'https://app.tudominio.com'
  // Vacío = los botones de la landing siguen abriendo las páginas de muestra login.html / registro.html.
  // TEST: la app web del cliente en su dominio propio (no *.sslip.io: el filtro de Pablo lo bloquea).
  webApp: 'https://atlas.consumerweb.test.arauzsoftware.com',
  // Rutas de la app web (consumer-app, expo-router).
  loginPath: '/ingresar',
  signupPath: '/registro',
  // Tiendas. Android se deduce del paquete de la app (bo.atlas.consumer).
  playStore: 'https://play.google.com/store/apps/details?id=bo.atlas.consumer',
  // iOS: pegar aquí el enlace de App Store Connect (https://apps.apple.com/app/id<número>).
  // Vacío = el botón muestra «Próximamente» en vez de llevar a ninguna parte.
  appStore: ''
};
