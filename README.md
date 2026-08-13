# Atlas — Landing Page

Landing page estática para **Atlas**, plataforma de microcréditos / "compra ahora, paga después"
(modelo tipo Cashea: inicial + 3 cuotas quincenales, 0% intereses, niveles de usuario).

**Sin build, sin dependencias, sin frameworks.** Se abre con doble clic y funciona offline
(lo único que sale a la red son las fuentes de Google, con fallback al sistema).

```
.
├── index.html
├── assets/
│   ├── css/
│   │   ├── style.css      ← design tokens + todos los estilos
│   │   └── preview.css    ← panel de previsualización (TEMPORAL)
│   ├── js/
│   │   ├── main.js        ← animaciones e interacciones (vanilla)
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
# → http://localhost:8788
```

## Secciones

1. **Loader** con contador 0→100 y cortina de salida
2. **Hero** — titular que entra palabra por palabra tras una máscara, aurora animada de fondo,
   mockup de la app, tarjetas flotantes y contadores
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
13. **FAQ**, **CTA final** y **footer**

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
| Logo | Elegir concepto y ruta en el panel, y luego quitar el panel |
| Legales | Términos, privacidad y el detalle de cargos por mora del FAQ |

## Formulario

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
- Breakpoints en 1080 / 860 / 620 px; menú hamburguesa desde 860

### Detalles a tener en cuenta si tocas el CSS

- El gradiente del titular va en `.hero__title em .wi`, no en el `<em>`: un hijo con `transform`
  rompe `background-clip:text`. Y ese `.wi` lleva `padding-bottom`: la caja del degradado
  termina en la línea base, así que sin ese alto extra la bajante de la "p" se ve cortada.
- Las máscaras `.w` del titular necesitan más alto que la caja de línea o recortan las bajantes.
- Un `var()` dentro de una custom property se resuelve **donde se declara**. Por eso las rutas
  de `preview.css` tienen que volver a declarar `--g` en `body`: el de `:root` se quedaría
  con los colores por defecto.
- `.cell p` gana por especificidad dentro del bento, por eso `.cell .cell__stat` va con doble clase.
