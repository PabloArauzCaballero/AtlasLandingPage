/* Enlaces de la landing: lo ÚNICO que hay que editar al poner el dominio.
   Esta página es pública: aquí sólo van URLs, nunca claves. */
window.ATLAS_LINKS = {
  // Dominio de la app web del cliente (sin «/» final). Ej.: 'https://app.tudominio.com'
  // Vacío = los botones de la landing siguen abriendo las páginas de muestra login.html / registro.html.
  // TEST: la app web del cliente en su dominio propio (no *.sslip.io: el filtro de Pablo lo bloquea).
  // TODO(LND-07, auditoría 2026-10-09): este valor y el canonical/og:url de index.html son de TEST y
  // van FIJOS en la imagen. Si esta misma imagen se promueve a PROD, el registro mandaría a los
  // clientes a TEST. No se cambia a ciegas porque PROD todavía no existe. Propuesta (sin activar):
  // generar este archivo al arrancar nginx desde una variable (ATLAS_WEB_APP vía envsubst en
  // /docker-entrypoint.d) y fallar el arranque si en PROD el valor contiene «.test.».
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
