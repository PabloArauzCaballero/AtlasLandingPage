# Atlas — Landing Page

Landing page estática para **Atlas**, plataforma boliviana de microcréditos /
"compra ahora, paga después": inicial del 60 % y el resto en cuotas mensuales, con la tasa que
asigna la evaluación de cada solicitud.

> **Mercado: Bolivia.** Cashea (Venezuela) es solo la referencia de categoría; el modelo de
> negocio de Atlas es distinto y está pendiente de definir. Todo el contenido actual —montos en
> bolivianos, CI, +591, ciudades, los porcentajes de inicial y el número de cuotas— es un
> supuesto de trabajo que hay que ajustar cuando llegue el modelo real.
>
> **Desde el 2026-09-29 la página no afirma nada que el producto real contradiga** (ver
> [«Lo que se retiró y por qué»](#lo-que-se-retiró-y-por-qué-2026-09-29)) y `check.py` lo
> vigila en CI.

> **¿Vas a construir otro proyecto con este mismo estándar?**
> [`PLAYBOOK-DISENO.md`](PLAYBOOK-DISENO.md) es el manual transferible: reglas de sistema de
> diseño, movimiento, 3D, responsive, rendimiento y accesibilidad, más las técnicas de
> diagnóstico y una lista de errores concretos con su causa raíz. Está escrito para que otro
> agente lo siga en un proyecto distinto, sin arrastrar nada de Atlas.

**Sin build ni frameworks.** Se abre con doble clic y funciona offline (lo único que sale a
la red son las fuentes de Google, con fallback al sistema).

La única dependencia es **Three.js**, vendorizada en `assets/js/vendor/` — no se llama a
ningún CDN. Sirve solo para el mapa decorativo de la sección Cobertura, y **se descarga bajo
demanda**: nunca en teléfonos, y en escritorio recién cuando esa sección se acerca. Si no
llega, no hay WebGL o el equipo pide menos movimiento, la sección se ve igual sin él.

Eso deja la primera carga en **~167 KB** en móvil, contra los ~760 KB que pesaba cuando la
librería venía en toda visita.

```
.
├── index.html             ← versión de trabajo (con panel de previsualización)
├── login.html             ← iniciar sesión
├── registro.html          ← crear cuenta
├── comparar.html          ← portada para presentarle los 3 al cliente
├── concepto-a.html        ← la landing completa con el concepto A
├── concepto-b.html        ← …con el B
├── concepto-c.html        ← …con el C
├── build.py               ← regenera los 4 archivos de arriba
├── check.py               ← guardia: sin href="#" ni promesas sin respaldo
├── assets/
│   ├── css/
│   │   ├── style.css      ← design tokens + todos los estilos
│   │   ├── auth.css       ← login y registro
│   │   ├── preview.css    ← panel de previsualización (TEMPORAL)
│   │   └── compare.css    ← portada y barra de conceptos (TEMPORAL)
│   ├── js/
│   │   ├── main.js        ← animaciones, motion y interacciones (vanilla)
│   │   ├── mapa3d.js      ← mapa WebGL de Bolivia
│   │   ├── geo-bolivia.js ← contorno del país y ciudades
│   │   ├── auth.js        ← validación de login y registro
│   │   ├── preview.js     ← panel de previsualización (TEMPORAL)
│   │   └── vendor/        ← Three.js (única dependencia, sin CDN)
│   └── img/
│       ├── logo-a.svg     ← concepto A · monograma
│       ├── logo-b.svg     ← concepto B · orbe
│       ├── logo-c.svg     ← concepto C · ascenso
│       └── qr-placeholder.svg    ← PLACEHOLDER (reemplazar por el QR real)
└── README.md
```

## Ver en local

```bash
python3 -m http.server 8788
# → http://localhost:8788            la versión de trabajo
# → http://localhost:8788/comparar.html   los 3 conceptos, para el cliente
```

## Presentar los 3 conceptos

`comparar.html` es la portada: muestra los tres símbolos con su ícono de app, sus favicons
y su lockup, y desde ahí se abre la landing completa de cada uno. Dentro de cada versión hay
una barrita abajo a la izquierda para saltar entre los tres sin volver a la portada.

Las tres páginas se **generan**, no se editan a mano:

```bash
python3 build.py
```

Toma `index.html` como fuente, le quita el panel de previsualización, fija el concepto y
escribe `concepto-a/b/c.html` + `comparar.html`. **Cada vez que cambies contenido en
`index.html` hay que volver a correrlo**, o las versiones del cliente se quedan viejas.

También copia el bloque de símbolos a `login.html` y `registro.html` para que no se
desincronicen, y hace que los enlaces de cuenta arrastren el concepto (`login.html?c=b`),
para que el logo no cambie a mitad de la demo.

Cuando el cliente elija, se borran `comparar.html`, `concepto-*.html`, `build.py` y
`assets/css/compare.css`; y de `index.html` se aplica el concepto elegido siguiendo los
pasos de la sección de abajo.

## Secciones

1. **Loader** con contador 0→100 y cortina de salida
2. **Hero** — escena 3D en CSS: el mockup de la app rodeado de objetos que flotan a distinta
   profundidad real (tarjeta Atlas, moneda, una compra al fondo). El mouse
   inclina la escena y desplaza cada objeto según su distancia, y el conjunto se aleja
   al hacer scroll
3. **Ticker** de categorías de comercios
4. **Tour** — la pieza central: el teléfono queda fijo y **cambia de pantalla mientras haces scroll**
   por los 4 pasos (registro → cupo aprobado → pago con QR → plan de pago)
5. **Calculadora** — simulación ilustrativa: presets de compra, slider de monto, anillo SVG
   con la inicial del 60 % y lo que queda por financiar. No calcula cuotas ni fechas: dependen
   de la tasa y el plazo de cada evaluación
6. **Bento de beneficios** — celdas de distinto tamaño con medidor animado, notificaciones,
   chat y spotlight que sigue al cursor
7. **Comparativa** — tabla Atlas vs tarjeta de crédito vs prestamista informal
8. **Categorías** — grilla de 12 rubros donde se puede comprar
9. **Cobertura** — el mapa del país en WebGL con la red de comercios
10. **Comercios** — propuesta B2B + mockup del panel de aliados
11. **Ejemplos ilustrativos** — dos carriles infinitos en direcciones opuestas (no son testimonios)
12. **Descarga** — tiendas («todavía no disponible»), QR de ejemplo, requisitos y mockup de compra
13. **Cuenta regresiva** — reloj al lanzamiento con dígitos que ruedan,
    barra de avance de campaña y lista de espera (deshabilitada hasta que exista)
14. **FAQ**, **CTA final** y **footer**

La sección **Niveles** (camino N1–N4) se retiró el 2026-09-29: el producto no tiene niveles.
Su CSS (`.path`, `.node`) sigue en `style.css` por si el modelo real los trae.

Las secciones alternan fondo (`.section` / `.section band`). Si agregas o mueves una,
respeta la alternancia para que no queden dos del mismo tono pegadas.

## Panel de previsualización (TEMPORAL)

Abajo a la izquierda hay un panel plegado, **Previsualizar marca**. Al abrirlo permite
cambiar en vivo:

- **Concepto de logo**: A · monograma, B · orbe, C · ascenso
- **Ruta de degradado**: Azul→Teal (la recomendada), Teal→Menta, Índigo→Periwinkle,
  Medianoche→Oro

Cambia el símbolo en toda la página (nav, footer, loader, QR, tabla, notificaciones y favicon)
y repinta la paleta completa. La elección se guarda en `localStorage` de ese navegador.

**Este panel no va a producción.** Para quitarlo cuando esté decidido el concepto:

1. Borra `assets/css/preview.css` y `assets/js/preview.js`
2. En `index.html`, borra el `<link>` y el `<script>` de preview, y el bloque `<aside id="preview">`
3. Si eligieron una ruta distinta de Azul→Teal, copia sus valores al `:root` de `style.css`
4. Borra de `index.html` los `<g id="mark…">` de los conceptos que no se usen, y sus
   `assets/img/logo-*.svg`

## Marca

### Colores
La paleta es la ruta **Azul → Teal** del manual, en el `:root` de `assets/css/style.css`:

```css
--navy:#0C2C50;   /* azul profundo: arranque del degradado y superficies */
--b1:#0E7377;     /* teal profundo */
--b2:#14A894;     /* teal medio    */
--b3:#2BE0A8;     /* menta         */
--b4:#5CF0CC;     /* menta clara   */
--tint:#7FEFD6;   /* acento de texto e iconos sobre oscuro */
```

Hay dos degradados: `--g` (teal → menta) es el que se usa donde tiene que **leerse** sobre fondo
oscuro —botones, texto en degradado, iconos—, y `--g-deep` es el del manual completo
(azul → teal → menta) para planos grandes, como el bloque de cierre.

Los `--b*-rgb` son los mismos colores en RGB, para poder darles alpha en sombras y fondos.

### Logo
Los tres conceptos viven como `<g id="markA|markB|markC">` dentro de `index.html`, y cada
aparición del logo es un `<use href="#markA">`. Los stops de sus degradados usan las variables
de marca, así que el símbolo se repinta solo al cambiar la paleta.

Los `assets/img/logo-*.svg` son los mismos símbolos como archivos sueltos, con los colores fijos:
se usan para el favicon y sirven para pasarlos a diseño o a la app.

### Tipografía
Sora (display) + Manrope (texto), como en el manual. Se cargan por Google Fonts en el `<head>`
y se declaran en `--display` / `--body`.

## Contenido que hay que reemplazar antes de publicar

Los textos son **placeholders realistas, no datos verificados**:

| Dónde | Qué revisar |
|---|---|
| Contadores del hero | Hoy: 60 % de inicial, QR, sin buró. Cifras de red o de tiempo, sólo medidas |
| Medidor del bento | Sin cifra (se quitó "42s promedio") |
| **Modelo de negocio** | Inicial 60 % fija, cuotas mensuales, tasa por evaluación: si cambia, cambia el texto |
| Montos | Todo está en bolivianos con cifras de ejemplo (mockups) |
| Calculadora | `data-initial` de `.calc` (0.6). Cuotas y fechas no se simulan |
| Ejemplos | **No son testimonios.** Sólo con testimonios reales con consentimiento, y tras el lanzamiento |
| Categorías | Que los 12 rubros coincidan con la red real de aliados |
| Requisitos (descarga) | Confirmar con legal la edad mínima y los documentos aceptados |
| Validaciones | CI de 5-8 dígitos y celular de 8 empezando en 6/7, en `auth.js` |
| Comparativa | Verificar que las afirmaciones sobre tarjetas y prestamistas sean defendibles |
| Panel de aliados | Cifras de demo |
| Enlaces de tiendas | Hoy son texto «todavía no disponible»: poner los enlaces reales al publicar |
| QR | Generar el QR real al enlace de descarga |
| Fechas del lanzamiento | `data-start` y `data-launch` de la sección `#lanzamiento` |
| Logo | Elegir concepto y ruta en el panel, y luego quitar el panel |
| Legales | Términos y privacidad: enlazar la URL pública cuando exista (hoy se aceptan en la app) |
| Formularios | Lista de espera y cierre deshabilitados; login y registro no envían nada |

## Cuenta regresiva al lanzamiento

Las dos fechas viven en la propia sección, en `index.html`:

```html
<section class="launch" id="lanzamiento"
         data-start="2026-08-01T00:00:00-04:00"    <!-- arranque de campaña -->
         data-launch="2026-10-15T12:00:00-04:00">  <!-- lanzamiento -->
```

`data-launch` es el objetivo del reloj y `data-start` marca desde dónde cuenta la barra de
avance. **Las dos son de ejemplo: hay que poner las reales.** Incluyen zona horaria (`-04:00`,
Venezuela), así que la cuenta es la misma para todos, sin importar dónde esté el visitante.

Cuando la fecha llega, el reloj se queda en cero y el titular cambia solo a "¡Atlas ya está
aquí!". La lista de espera **está deshabilitada** con una nota («todavía no guarda correos»):
no existe ese servicio. Si alguien la habilita sin backend, `main.js` responde lo mismo, nunca
«¡Anotado!». Está marcada con un `TODO`.

Los dígitos son columnas del 0 al 9 que se desplazan, así el número sube en vez de parpadear.
El tamaño sale de tres variables (`--dw`, `--dh`, `--df`) en `.clock`, para que en pantallas
angostas los ocho quepan sin desbordar.

> Ojo con la coherencia: mientras haya cuenta regresiva, la acción es **crear cuenta**, no
> descargar. La sección `#descarga` dice que la app llega con el lanzamiento y las tiendas dicen
> "Pronto en · todavía no disponible".
> Cuando la app se publique hay que revertir esos textos y quitar la cuenta regresiva.

## Cuenta: login y registro

`login.html` y `registro.html` son pantallas completas con el mismo sistema de diseño.
Validan en el cliente, **pero no envían nada todavía**, y lo dicen: un aviso «Vista previa»
arriba del formulario y un mensaje final que no confirma cuentas, códigos ni sesiones
(`data-done` de cada `<form>`).

- **Login**: correo o teléfono + contraseña, ver/ocultar clave y mantener sesión.
  Recuperar clave y código por SMS aparecen como «todavía no disponible».
- **Registro**: nombre, cédula (CI), teléfono (+591), correo y contraseña con medidor de
  fuerza. Sin checkbox de términos: no hay texto legal público que enlazar y esta pantalla no
  guarda nada; los términos se aceptan en la app. Arriba, el indicador de los 3 pasos del alta.

La validación vive en `assets/js/auth.js`, en el objeto `RULES` — ahí se ajusta el formato
de cédula, la longitud del teléfono o el mínimo de la contraseña. El envío está marcado con
un `TODO`: es el único punto donde hay que enchufar la API de Atlas.

Las dos páginas llevan `noindex`: no tiene sentido que Google indexe un login.

## Formulario de la landing

`#leadForm` está **deshabilitado** con la nota «todavía no guarda correos»: no existe un
servicio de leads. Conectar en `main.js` (bloque 12, marcado con `TODO`) al backend o CRM de
Atlas cuando exista, y sólo entonces cambiar el mensaje por una confirmación.

## Lo que se retiró y por qué (2026-09-29)

La landing era un prototipo con el modelo de negocio **supuesto**, y el HTML lo afirmaba como
hecho. La auditoría de calidad del 2026-09-29 (informe `06-promesas-al-publico…`, §A) lo
contrastó con el backend real, y se retiró todo lo que era falso o confirmaba algo que no
ocurre. **No se reescribió la propuesta de valor**: donde había una promesa falsa quedó la frase
verdadera más corta posible, o nada. Recuperar cualquier texto es `git log -p` de este cambio;
volver a publicarlo exige antes el cambio de producto que lo respalde (y quitarlo de `check.py`).

| Qué decía | Por qué se quitó | Qué dice ahora |
|---|---|---|
| Formularios: «¡Listo! Te escribiremos…», «¡Anotado!…», «¡Cuenta creada! Te enviamos un código», «Entrando a tu cuenta…» (A1) | No hay backend de leads, de lista de espera ni de cuentas: no se guarda nada | Lista de espera y cierre, **deshabilitados** con una nota; login y registro, interactivos pero su mensaje dice «Vista previa: no se guardó nada» |
| 8 testimonios con nombre y ciudad, y la cita de «Valeria M.» en el login (A2) | Producto sin lanzar: nadie lo usó | Sección «Ejemplos ilustrativos», sin personas, rotulada como no testimonios |
| «0 % de intereses» / «sin intereses» (~15 sitios) (A3) | El Motor asigna la tasa por solicitud; Core responde 422 si no la hay (nunca 0 %) | «La tasa depende de tu evaluación»; se quitó el sello flotante de 0 % |
| «3 cuotas quincenales», calendario a 15/30/45 días (A4) | El cronograma real es mensual (`loan-schedule.ts`) | «Cuotas mensuales»; los mockups muestran meses, sin montos por cuota |
| Niveles N1–N4 con inicial 60/50/40/30 % y cupos Bs 400/1.750/4.200 (A4) | No existen: hay bandas de puntaje internas y la inicial es **60 % fija** (`assertPurchaseSplit`) | **Se retiró la sección Niveles** entera (y su enlace del menú y del pie). La calculadora usa sólo la inicial del 60 % (`data-initial` de `.calc`) |
| «Te avisamos antes de cada cuota y puedes mover una fecha» (A5) | No hay emisor de `installment.due_*` ni endpoint de reprogramación | «En la app ves cada cuota, su fecha y a qué comercio se paga» |
| Enlaces legales a `#` y checkbox «Acepto los Términos…» (A6) | No hay texto legal publicado (el único sembrado es de desarrollo); se aceptan en la app (`GET /consent-documents/active`) | Pie y registro dicen que los términos se leen y aceptan en la app; sin checkbox |
| Comercios: «recibes el 100 % al instante… Cero riesgo de impago… link de pago o API» (A7, A10) | Atlas cobra comisión (MDR) por contrato; la cobertura pasa por dos firmas y revisión; no hay link de pago ni API | Cuotas directo al QR del comercio, comisión por venta fijada en su contrato |
| «60 s», «42 s promedio», «al instante», «menos de 1 minuto» (A8) | Sin métrica; el flujo exige revisión y aceptación del comercio | Quitados |
| «Regístrate en 2 minutos, sólo cédula y selfie, sin papeleo» (A9) | El alta pide contacto, documentos, datos, domicilio, perfil financiero y permisos; selfie en tres poses | Lo dice tal cual |
| «Compra online», «tarjeta de débito», «transferencia» (A10, A11) | No existen; cada cuota se paga al QR bancario del comercio con comprobante | QR del comercio y comprobante en la app |
| «500+ comercios», «nueve departamentos», «cientos de tiendas» (A12) | No verificable | Quitados (se fueron también los contadores de Cobertura) |
| «Cargos por mora indicados en tu contrato» (A13) | No hay contrato de crédito en el código ni cálculo de mora | «Se aplica la política de mora de Atlas, que puedes leer en la app» |
| «Cupo reservado», «entras con tu cupo ya aprobado» (A14) | No hay preaprobación | La sección Descarga dice que la cuenta se crea en la app al lanzamiento |
| «Contestan personas, no un robot», «soporte con personas reales» (A15) | Existe un asistente de IA | «Soporte desde la app» |
| «Pronto en App Store/Google Play», redes, «¿Olvidaste tu clave?», «Código por SMS» a `#` (A17) | Enlaces a ninguna parte | Tiendas como texto «todavía no disponible»; redes quitadas; recuperar clave y SMS marcados como no disponibles |
| «Bs 0 de costo de apertura» (A18) | Sin respaldo | Quitado |
| «Preventa abierta» (barra del lanzamiento) | No hay preventa: nada se vende ni se reserva | «Camino al lanzamiento» |

«Sin buró de crédito» (A16) **se mantuvo**: hoy es cierto.

Además hay un aviso visible en el hero, en el cierre, en el pie y en login/registro:
**«Vista previa de diseño: precios, plazos y condiciones son ilustrativos y no vinculantes.»**
Hasta el lanzamiento eso es lo verdadero. Se quita cuando cada cifra tenga respaldo.

### Guardia: `check.py`

```bash
python3 check.py            # revisa las páginas publicadas y sus scripts
```

Falla (y dice archivo, línea y motivo) si alguna página tiene un `href="#"` o una frase de la
lista prohibida (0 % de interés, quincenal, niveles, 60 s / 42 s / 500+, cero riesgo, compra
online, cupo reservado, «te escribiremos», testimonios…). Corre en CI (job `promesas`). No mira
los comentarios, para que se pueda explicar ahí por qué algo se quitó. Si una frase vuelve a
ser verdad, sale de la lista **con** el cambio de producto que la respalda.


## Sistema de motion

El movimiento sigue una sola gramática, al estilo de las interfaces de Apple. Los tokens
están en el `:root` de `style.css`:

```css
--spring   /* entradas: llega, se pasa apenas y se acomoda */
--pop      /* micro-interacciones: rebote corto al tocar   */
--glide    /* recorridos largos, sin rebote                */
--t-fast / --t-base / --t-slow
```

`--spring` y `--pop` son **curvas de resorte reales**, no cubic-bezier: la función `linear()`
muestrea una oscilación amortiguada, que es lo que produce el asentamiento característico de
iOS. Con una cubic-bezier el pulsado se siente de goma.

Tres cosas más definen el carácter:

- **Las entradas salen de un desenfoque** (`filter: blur()` → 0) además de subir y escalar. Sin
  eso la entrada se siente mecánica por más resorte que se le ponga. No se aplica a las grillas
  del bento: cubren mucha superficie y el desenfoque es lo más caro de animar.
- **Movimiento ligado al scroll, continuo.** `main.js` escribe `--sp` (0 cuando la sección
  entra, 1 cuando sale) en `.tour__sticky` y `.hero__stage`, y el CSS lo traduce a
  transformaciones. El teléfono del tour gira mientras recorres los pasos, como si lo
  examinaras. El valor se suaviza con un lerp por cuadro: escribirlo directo desde el evento
  de scroll se siente escalonado.
- **La visibilidad se deduce del propio rect**, no de un observer, para que ninguna sección se
  quede sin actualizar cuando el scroll es instantáneo.

Todo se apaga con `prefers-reduced-motion` y las transformaciones ligadas al scroll no corren
por debajo de 1080px.

## Rendimiento en móvil

Un teléfono no perdona lo que un escritorio disimula. Lo que está apagado por debajo de
860px, y por qué:

| Qué | Por qué |
|---|---|
| Three.js y el mapa WebGL | 600 KB y un render continuo por un adorno que en pantalla chica queda de fondo |
| Las tres manchas de la aurora | 60vw con `blur(110px)` **y animadas**: es lo más caro de toda la página. Se cambian por un fondo pintado una sola vez |
| El campo de partículas | Compara cada punto contra todos: CPU constante por un detalle que casi no se distingue |
| El desenfoque de las entradas | Obliga a repintar cada elemento que aparece |
| `backdrop-filter` en nav y tarjetas | Obliga a releer el fondo en cada cuadro de scroll |
| El bucle del scroll ligado | Por debajo de 1080 el CSS ya ignora `--sp`: mantenerlo vivo sería gastar cuadros para nada |

Si agregas efectos, la regla es esa: **`filter`, `backdrop-filter` y sombras muy difusas sobre
superficies grandes** son los que se sienten, no la cantidad de elementos.

## Detalles técnicos

- Un solo listener de `scroll` con throttle por `requestAnimationFrame`
- Reveals, contadores y el cambio de pantalla del tour usan `IntersectionObserver`;
  sin soporte, todo queda visible
- El canvas de partículas se pausa cuando la pestaña no está visible
- Respeta `prefers-reduced-motion`: apaga animaciones, canvas y cursor
- Teclado: flechas dentro de los chips de nivel (`radiogroup`), foco visible en todo el sitio
- El loader se quita solo por CSS a los 4,5 s aunque el JS falle
- Breakpoints en 1150 / 1080 / 860 / 620 px. El menú hamburguesa entra a 1150: con
  seis secciones más sesión y CTA, el nav ya no cabe en una línea por debajo de eso

### Mapa WebGL (sección Cobertura)

`assets/js/mapa3d.js` dibuja **la red sobre el mapa del país**: cada punto es un comercio,
los nodos que laten son las ciudades y por los arcos viajan pulsos, que son las compras
cruzando la red. Lee los colores de `--b1`…`--b4`, así que **cambia con la paleta** igual
que el resto del sitio.

El relleno no viene precalculado: se hace en el navegador con punto-en-polígono sobre el
contorno de `assets/js/geo-bolivia.js`. **Para cambiar de país solo se cambia ese archivo**
—contorno en `[lon, lat]` y lista de ciudades— y el renderizador no se toca.

El contorno son **417 puntos** de Natural Earth 1:50m (dominio público). La resolución
importa: con un contorno grueso los bordes salen angulosos y el mapa se ve pixelado. Si
cambias de país, no uses una versión demasiado simplificada.

Lo que lo separa de un efecto de plantilla está todo en los shaders:

- **Luz direccional con terminador.** Sin un lado iluminado y otro en sombra, una esfera se
  lee plana por más puntos que tenga. Es lo que más aporta de todo lo de aquí.

- Los puntos de la cara oculta se apagan en vez de dibujarse igual: así se percibe un cuerpo
  sólido y no una nube hueca.
- Cada punto es un disco con borde suave; un cuadrado duro se ve barato.
- Color y tamaño pierden fuerza con la distancia, que es lo que da aire entre frente y fondo.
- La atmósfera usa Fresnel **con `FrontSide`**. Ojo aquí: el truco clásico que se ve en todos
  los tutoriales usa `BackSide`, que ilumina el centro y solo funciona si el planeta es opaco
  y lo tapa. Con un planeta de puntos transparentes ese brillo inunda la escena. Con
  `FrontSide` y el Fresnel invertido, el filo queda donde debe: en el limbo.

Se apaga fuera de la vista y con la pestaña oculta, y respeta `prefers-reduced-motion`.

Para subir o bajar su presencia: `STEP` (separación entre puntos, en grados), el
`40.0 / dist` del tamaño de punto y, en el CSS, el `mask-image` de `.cover__map`.

### Escena 3D del hero (CSS)

Cada objeto flotante es un `.fo` con cuatro variables en su `style`:

```html
<div class="fo fo--card" style="--x:-3%;--y:64%;--z:-140px;--p:34px">
```

`--x`/`--y` son el **centro** del objeto dentro de la escena, `--z` su profundidad y `--p`
cuánto se desplaza con el mouse. Los cercanos llevan `--p` alto y los del fondo bajo: esa
diferencia es la que produce la sensación de volumen. El movimiento va en el contenedor y la
flotación en `.fo__in`, separados para que no se pisen.

Al mover objetos, ojo con dos cosas: `--x` fuera del rango −5%…105% se mete en la columna de
texto o se sale por el borde, y por debajo de 620px sobreviven solo los que aportan
(el resto se oculta para no saturar).

### Detalles a tener en cuenta si tocas el CSS

- El gradiente del titular va en `.hero__title em .wi`, no en el `<em>`: un hijo con `transform`
  rompe `background-clip:text`. Y ese `.wi` lleva `padding-bottom`: la caja del degradado
  termina en la línea base, así que sin ese alto extra la bajante de la "p" se ve cortada.
- Las máscaras `.w` del titular necesitan más alto que la caja de línea o recortan las bajantes.
- Un `var()` dentro de una custom property se resuelve **donde se declara**. Por eso las rutas
  de `preview.css` tienen que volver a declarar `--g` en `body`: el de `:root` se quedaría
  con los colores por defecto.
- `.cell p` gana por especificidad dentro del bento, por eso `.cell .cell__stat` va con doble clase.
