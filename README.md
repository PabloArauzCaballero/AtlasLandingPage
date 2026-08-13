# Atlas — Landing Page

Landing page estática para **Atlas**, plataforma de microcréditos / "compra ahora, paga después"
(modelo tipo Cashea: inicial + 3 cuotas quincenales, 0% intereses, niveles de usuario).

**Sin build ni frameworks.** Se abre con doble clic y funciona offline (lo único que sale a
la red son las fuentes de Google, con fallback al sistema).

La única dependencia es **Three.js**, y está vendorizada en `assets/js/vendor/` — no se
llama a ningún CDN. Se carga con `defer` y sirve solo para el globo decorativo del hero:
si no llega, no hay WebGL o el equipo pide menos movimiento, el hero se ve igual sin él.

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
├── assets/
│   ├── css/
│   │   ├── style.css      ← design tokens + todos los estilos
│   │   ├── auth.css       ← login y registro
│   │   ├── preview.css    ← panel de previsualización (TEMPORAL)
│   │   └── compare.css    ← portada y barra de conceptos (TEMPORAL)
│   ├── js/
│   │   ├── main.js        ← animaciones e interacciones (vanilla)
│   │   ├── hero3d.js      ← globo WebGL del hero
│   │   └── vendor/        ← Three.js (única dependencia, sin CDN)
│   │   ├── auth.js        ← validación de login y registro
│   │   └── preview.js     ← panel de previsualización (TEMPORAL)
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
2. **Hero** — escena 3D: el mockup de la app rodeado de objetos que flotan a distinta
   profundidad real (tarjeta Atlas, moneda, sello de 0%, una compra al fondo). El mouse
   inclina la escena y desplaza cada objeto según su distancia
3. **Ticker** de categorías de comercios
4. **Tour** — la pieza central: el teléfono queda fijo y **cambia de pantalla mientras haces scroll**
   por los 4 pasos (registro → cupo aprobado → pago con QR → plan de pago)
5. **Calculadora** — presets de compra, slider de monto, selector de nivel, anillo SVG y
   **timeline con las fechas reales** de cada cuota (calculadas desde hoy)
6. **Bento de beneficios** — celdas de distinto tamaño con medidor animado, notificaciones,
   chat y spotlight que sigue al cursor
7. **Niveles** — camino con 4 nodos que se van encendiendo con el scroll
8. **Comparativa** — tabla Atlas vs tarjeta de crédito vs prestamista informal
9. **Categorías** — grilla de 12 rubros donde se puede comprar
10. **Comercios** — propuesta B2B + mockup del panel de aliados
11. **Opiniones** — dos carriles infinitos en direcciones opuestas
12. **Descarga** — tiendas, QR, requisitos de apertura y mockup de compra aprobada
13. **Cuenta regresiva** — reloj al lanzamiento con dígitos que ruedan,
    barra de avance de campaña y lista de espera
14. **FAQ**, **CTA final** y **footer**

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
| Contadores del hero | "60s", "500+ comercios" — poner cifras reales |
| Medidor del bento | "42s promedio" |
| Niveles | Porcentajes de inicial y montos de cupo de cada nivel |
| Calculadora | `data-initial` de cada chip, `N` (cuotas) y `EVERY` (días) en `main.js` |
| Opiniones | **Son ficticias.** Sustituir por testimonios reales con consentimiento |
| Categorías | Que los 12 rubros coincidan con la red real de aliados |
| Requisitos (descarga) | Confirmar con legal la edad mínima y los documentos aceptados |
| Comparativa | Verificar que las afirmaciones sobre tarjetas y prestamistas sean defendibles |
| Panel de aliados | Cifras de demo |
| Enlaces de tiendas | Los `href="#"` de App Store / Google Play |
| QR | Generar el QR real al enlace de descarga |
| Fechas del lanzamiento | `data-start` y `data-launch` de la sección `#lanzamiento` |
| Logo | Elegir concepto y ruta en el panel, y luego quitar el panel |
| Legales | Términos, privacidad y el detalle de cargos por mora del FAQ |

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
aquí!". La lista de espera valida el correo pero **no envía nada**: está marcada con un `TODO`
en `main.js`.

Los dígitos son columnas del 0 al 9 que se desplazan, así el número sube en vez de parpadear.
El tamaño sale de tres variables (`--dw`, `--dh`, `--df`) en `.clock`, para que en pantallas
angostas los ocho quepan sin desbordar.

> Ojo con la coherencia: mientras haya cuenta regresiva, la acción es **crear cuenta**, no
> descargar. La sección `#descarga` habla de reservar cupo y las tiendas dicen "Pronto en".
> Cuando la app se publique hay que revertir esos textos y quitar la cuenta regresiva.

## Cuenta: login y registro

`login.html` y `registro.html` son pantallas completas con el mismo sistema de diseño.
Validan en el cliente y muestran el resultado, **pero no envían nada todavía**.

- **Login**: correo o teléfono + contraseña, ver/ocultar clave, mantener sesión,
  recuperar clave y una vía alterna por código SMS.
- **Registro**: nombre, cédula (con prefijo V-), teléfono (+58), correo y contraseña
  con medidor de fuerza, más la aceptación de términos. Arriba, el indicador de los
  3 pasos del alta.

La validación vive en `assets/js/auth.js`, en el objeto `RULES` — ahí se ajusta el formato
de cédula, la longitud del teléfono o el mínimo de la contraseña. El envío está marcado con
un `TODO`: es el único punto donde hay que enchufar la API de Atlas.

Las dos páginas llevan `noindex`: no tiene sentido que Google indexe un login.

## Formulario de la landing

`#leadForm` valida el correo en el cliente y muestra un mensaje, **pero no envía nada**.
Conectar en `main.js` (bloque 12, marcado con `TODO`) al backend, CRM o un servicio tipo
Formspree / Mailchimp.

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

### Globo WebGL del hero

`assets/js/hero3d.js` dibuja un globo de puntos detrás del teléfono. Lee los colores de
`--b1/--b2/--b3`, así que **cambia con la paleta** igual que el resto del sitio.

Lo que lo separa de un efecto de plantilla está todo en los shaders:

- Los puntos de la cara oculta se apagan en vez de dibujarse igual: así se percibe un cuerpo
  sólido y no una nube hueca.
- Cada punto es un disco con borde suave; un cuadrado duro se ve barato.
- Color y tamaño pierden fuerza con la distancia, que es lo que da aire entre frente y fondo.
- La atmósfera usa Fresnel **con `FrontSide`**. Ojo aquí: el truco clásico que se ve en todos
  los tutoriales usa `BackSide`, que ilumina el centro y solo funciona si el planeta es opaco
  y lo tapa. Con un planeta de puntos transparentes ese brillo inunda la escena. Con
  `FrontSide` y el Fresnel invertido, el filo queda donde debe: en el limbo.

Se apaga fuera de la vista y con la pestaña oculta, no corre por debajo de 760px de ancho y
respeta `prefers-reduced-motion`.

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
