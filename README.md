# Atlas — Landing Page

Landing page estática para **Atlas**, plataforma de microcréditos / "compra ahora, paga después"
(modelo tipo Cashea: inicial + 3 cuotas quincenales, 0% intereses, niveles de usuario).

**Sin build, sin dependencias, sin frameworks.** Se abre con doble clic y funciona offline
(lo único que sale a la red son las fuentes de Google, con fallback al sistema).

```
.
├── index.html
├── assets/
│   ├── css/style.css      ← design tokens + todos los estilos
│   ├── js/main.js         ← animaciones e interacciones (vanilla)
│   └── img/
│       ├── logo.svg              ← PLACEHOLDER (reemplazar)
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
9. **Comercios** — propuesta B2B + mockup del panel de aliados
10. **Opiniones** — dos carriles infinitos en direcciones opuestas
11. **Descarga** — botones de tienda, QR y mockup de compra aprobada
12. **FAQ**, **CTA final** y **footer**

## Re-branding (cuando llegue el manual de marca)

### 1. Colores
Todo el sitio se pinta desde tres variables al inicio de `assets/css/style.css`:

```css
:root{
  --b1:#8B5CF6;   /* violeta */
  --b2:#4F7BFF;   /* azul    */
  --b3:#2DE3B0;   /* menta   */
}
```

Cambiar esas tres líneas re-brandea botones, gradientes, iconos, anillos, badges, la aurora y el
fondo de partículas. Si la marca es clara en vez de oscura, hay que tocar también `--bg`, `--bg-2`
y los `--t1/--t2/--t3`.

### 2. Logo
Reemplazar `assets/img/logo.svg` conservando el nombre (se usa en nav, footer, loader, QR,
tabla comparativa, notificaciones y favicon). Ideal: SVG cuadrado con viewBox ~48×48.
Si el logo ya trae el texto "Atlas", quitar los `<span>Atlas</span>` del `.brand` en el nav y el footer.

### 3. Tipografía
Línea `<link>` de Google Fonts en el `<head>` + `--display` / `--body` en el CSS.

## Contenido que hay que reemplazar antes de publicar

Los textos son **placeholders realistas, no datos verificados**:

| Dónde | Qué revisar |
|---|---|
| Contadores del hero | "60s", "500+ comercios" — poner cifras reales |
| Medidor del bento | "42s promedio" |
| Niveles | Porcentajes de inicial y montos de cupo de cada nivel |
| Calculadora | `data-initial` de cada chip, `N` (cuotas) y `EVERY` (días) en `main.js` |
| Opiniones | **Son ficticias.** Sustituir por testimonios reales con consentimiento |
| Comparativa | Verificar que las afirmaciones sobre tarjetas y prestamistas sean defendibles |
| Panel de aliados | Cifras de demo |
| Enlaces de tiendas | Los `href="#"` de App Store / Google Play |
| QR | Generar el QR real al enlace de descarga |
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
  rompe `background-clip:text`.
- `.cell p` gana por especificidad dentro del bento, por eso `.cell .cell__stat` va con doble clase.
