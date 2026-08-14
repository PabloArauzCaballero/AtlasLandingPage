# Playbook de diseño y frontend

> **Para quién es esto.** Para un agente que va a construir el frontend de un proyecto
> distinto y quiere seguir el mismo estándar. No describe este proyecto: describe **cómo se
> trabaja**. Donde aparece un ejemplo concreto va marcado como tal — copia el criterio, no el
> valor.

---

## 0 · Los cuatro principios

Todo lo demás sale de aquí.

1. **Medir antes que opinar.** "Se siente vacío", "se ve pixelado", "va lento" son síntomas.
   Instrumenta la página y consigue el número. Casi siempre la causa real no es la que se
   supone.
2. **Un solo sistema.** Colores, espaciado, tipografía y movimiento salen de tokens. Si un
   valor aparece escrito a mano dos veces, es un token que falta.
3. **Degradar con gracia.** Cada capa vistosa —3D, animación, desenfoque— se apaga sola si no
   hay soporte, si el equipo pide menos movimiento o si el dispositivo no da. Nada se rompe:
   se ve más simple.
4. **No inventar datos.** Cifras, testimonios y logos son placeholders hasta que alguien los
   confirme. Van marcados como tales en el README, en una tabla de "reemplazar antes de
   publicar". Nunca se presentan como reales.

---

## 1 · Arquitectura por defecto

Empieza por lo más simple que resuelva el encargo, y sube solo cuando haga falta:

| Situación | Elección |
|---|---|
| Landing, sitio de marca, one-pager | HTML + CSS + JS, sin build |
| Necesitas 3D | Vanilla + Three.js **vendorizado**, cargado bajo demanda |
| App con estado y rutas | Ahí sí un framework |

Sin build significa: se abre con doble clic, funciona offline, no hay `node_modules` que
pudra en seis meses y cualquiera puede editarlo. **No renuncies a eso sin una razón.**

Si entra una dependencia:

- Se **vendoriza** en `assets/js/vendor/` — nunca un CDN en runtime.
- Se carga **bajo demanda**, no en toda visita.
- Si no llega, la página funciona igual.

### Estructura

```
index.html
assets/
  css/style.css      ← tokens + todo el sistema
  css/<vista>.css    ← solo si una vista tiene bastante propio
  js/main.js         ← un archivo, por bloques numerados y comentados
  js/<pieza>.js      ← piezas pesadas o aisladas
  js/vendor/
  img/
README.md            ← cómo correrlo, qué reemplazar, decisiones
```

---

## 2 · Sistema de diseño

### Tokens

Un solo `:root` con todo. La regla dura: **cambiar la marca debe ser cambiar variables, no
buscar y reemplazar.**

```css
:root{
  /* Marca — el mínimo viable son 3-5 tonos */
  --navy:#…;   /* el profundo: arranques de degradado y superficies */
  --b1:#…;     /* … */
  --b2:#…;
  --b3:#…;     /* el vivo: lo que se ve sobre fondo oscuro */
  --tint:#…;   /* acento para texto e iconos */
  --on-brand:#…; /* texto sobre superficies de marca */

  /* Los mismos en RGB, para poder darles alpha */
  --b2-rgb:20,168,148;

  /* Superficies, texto, líneas */
  --bg: --bg-2: --ink: --line: --t1: --t2: --t3:

  /* Escala fluida: clamp(mínimo, preferido, máximo) */
  --fs-h1:clamp(2.9rem,7.2vw,5.6rem);

  /* Ritmo */
  --pad: --gap: --r:

  /* Movimiento — ver sección 4 */
  --spring: --pop: --glide: --t-fast: --t-base: --t-slow:
}
```

**Los `-rgb` no son opcionales.** Sin ellos terminas con `rgba(20,168,148,.16)` escrito a mano
en cincuenta sitios, y ahí ya no puedes cambiar la paleta.

### Dos degradados, no uno

Un degradado que arranca en un tono profundo **no se lee** sobre fondo oscuro. Define dos:

- `--g` — la parte viva. Va donde tiene que leerse: botones, texto en degradado, iconos.
- `--g-deep` — el completo, del profundo al vivo. Va en planos grandes: bloques de cierre,
  paneles laterales, placas de ícono.

Confundirlos produce botones con texto ilegible o planos que se ven lavados.

### Contraste sobre superficies de marca

El texto sobre un degradado tiene que pasar el contraste **en el extremo más claro y en el más
oscuro**, no en el medio. Si no pasa, achica el recorrido del degradado.

---

## 3 · Composición: el problema de "se siente vacío"

Es el comentario más frecuente y casi nunca se resuelve agregando contenido. **Instrumenta y
mide** (ver §9.1). Los patrones que aparecen siempre:

| Patrón | Arreglo |
|---|---|
| ~200px muertos en cada frontera entre secciones | Bajar el padding vertical. Con 12 secciones son 2.000px de nada |
| Una línea o conector dibujado solo dentro de la caja del texto | Que vaya de borde a borde: los huecos entre bloques son justo lo que se ve vacío |
| Un mockup con media pantalla en negro | Llenarlo con contenido real del producto, no con relleno |
| Un acordeón o formulario angosto centrado en una sección ancha | Dos columnas: encabezado sticky a un lado, contenido al otro |
| Decoración tan sutil que no se ve | O se ve, o se borra. Lo invisible solo suma peso |

**No confundir vacío con respiro.** ~144px entre secciones en escritorio está bien; 300 no. El
objetivo no es densidad máxima, es que no haya bandas donde no pasa nada.

---

## 4 · Movimiento

### Una sola gramática

Tres curvas y tres duraciones para todo el sitio:

```css
/* Resortes reales: linear() muestrea una oscilación amortiguada.
   Es lo que da el asentamiento de una interfaz nativa; con una
   cubic-bezier el pulsado se siente de goma. */
--spring:linear(0,.006,.025 2.8%,.101 6.1%,.539 18.9%,.721 25.3%,.849 31.5%,
  .937 38.1%,.968 41.8%,.991 45.7%,1.006 50.1%,1.015 55%,1.017 63.9%,1.001 100%);
--pop:linear(0,.009,.035 2.1%,.141,.281 6.7%,.723 12.9%,.938 16.7%,1.017,
  1.077 21%,1.121,1.149 26.6%,1.155,1.153 30.8%,1.129 33.8%,1.052 40%,
  1.007 44.4%,.981 50.7%,.98 59.4%,1.002 78.5%,1);
--glide:cubic-bezier(.32,.72,0,1);

--t-fast:.28s; --t-base:.55s; --t-slow:.9s;
```

- `--spring` → entradas. Llega, se pasa apenas, se acomoda.
- `--pop` → micro-interacciones. Rebote corto al tocar.
- `--glide` → recorridos largos y opacidades. Sin rebote.

### Entradas

Subir + escalar **+ salir de un desenfoque**. El desenfoque es lo que separa una entrada
natural de una mecánica, por más resorte que se le ponga.

```css
[data-anim]{opacity:0;
  transition:opacity var(--t-slow) var(--glide) var(--d,0ms),
             transform var(--t-slow) var(--spring) var(--d,0ms),
             filter var(--t-slow) var(--glide) var(--d,0ms)}
[data-anim="rise"]{transform:translateY(34px) scale(.975);filter:blur(9px)}
[data-anim].in{opacity:1;transform:none;filter:blur(0)}
```

El `.in` lo pone un `IntersectionObserver`. Escalonar con `--d` por índice.

> **Cuidado:** `filter` sobre superficies grandes es de lo más caro que hay. Úsalo en textos y
> tarjetas chicas; en grillas grandes quédate con transform + opacity.

### Movimiento ligado al scroll

Es lo que hace que una página se sienta de producto y no de plantilla. El patrón:

1. JS calcula un progreso 0→1 de la sección respecto al viewport.
2. Lo **suaviza con un lerp por cuadro** y lo escribe como variable CSS.
3. El CSS la traduce a transformaciones.

```js
t.to  = clamp((innerHeight - rect.top) / (innerHeight + rect.height), 0, 1);
t.now += (t.to - t.now) * 0.09;              // sin esto se siente escalonado
el.style.setProperty('--sp', t.now.toFixed(4));
```

```css
.pieza{transform:rotateY(calc((var(--sp) - .5) * 17deg))
                 scale(calc(.965 + var(--sp) * .05))}
```

Dos detalles que cuestan tiempo si no se saben:

- **Deduce la visibilidad del rect, no de un `IntersectionObserver`.** Con el observer, una
  sección puede quedarse sin actualizar cuando el scroll es instantáneo.
- **Corta el bucle donde el CSS ya ignora la variable.** Mantenerlo vivo en móvil es gastar
  cuadros para nada.

### Revelado de titulares

Palabra por palabra tras una máscara, no letra por letra: **el split por caracteres rompe el
wrapping** y el navegador parte líneas en medio de una palabra.

---

## 5 · 3D y WebGL

### Cuándo

Solo si aporta significado. Un globo genérico es adorno; el mismo globo donde los puntos son
**tus** tiendas y los arcos **tus** transacciones, cuenta algo. Si no encuentras el
significado, no lo pongas.

### Que no parezca CGI barato

Esto es casi todo shaders, no geometría:

| Regla | Por qué |
|---|---|
| Apaga lo que mira al otro lado | Sin eso una esfera de puntos se lee como nube hueca, no como cuerpo |
| Luz direccional con terminador | **Lo que más aporta.** Sin lado iluminado y lado en sombra, una esfera se lee plana por muchos puntos que tenga |
| Puntos como discos de borde suave | El cuadrado duro delata el 3D hecho a las apuradas y además aliasea |
| Niebla por distancia en color y tamaño | Es lo que da aire entre frente y fondo |
| Ruido en las posiciones | Una retícula perfecta se lee como generada |
| Blending normal, no aditivo | El aditivo satura y vuelve todo neón |
| Polvo alrededor del objeto | Sin él queda recortado contra el fondo |
| Movimiento lento | Un planeta no corre. De más se vuelve juguete |

### La atmósfera de Fresnel

El truco que aparece en todos los tutoriales usa `BackSide`, y **ese ilumina el centro**: solo
funciona si el objeto es opaco y tapa el brillo. Con un cuerpo transparente —puntos, por
ejemplo— el resplandor inunda la escena.

Para cuerpos transparentes: `FrontSide` con el Fresnel invertido, para que el filo quede en el
limbo.

```glsl
float rim = 1.0 - clamp(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
gl_FragColor = vec4(uColor, 1.0) * pow(rim, 3.0) * 1.15;
```

### Objetos "2.5D" en CSS

Una tarjeta, un teléfono o cualquier objeto que gira con `transform` cae en la misma trampa
que el 3D mal hecho, y por el mismo motivo: **gira con la luz horneada en el fondo**. El
degradado no cambia nunca, así que se lee como una imagen plana rotada — que es literalmente
lo que hace ver mal un compositing de película.

La regla es una sola: **el giro y la luz salen de la misma variable.**

```css
@property --rx{syntax:'<number>';inherits:true;initial-value:0}
@property --ry{syntax:'<number>';inherits:true;initial-value:0}

.objeto{
  transform:perspective(1000px) rotateY(calc(var(--rx) * 20deg))
                                rotateX(calc(var(--ry) * -13deg));
  box-shadow:
    inset calc(var(--rx) * 3.4px) calc(var(--ry) * -3.4px) 0 rgba(255,255,255,.42), /* canto */
    inset calc(var(--rx) * -3.6px) calc(var(--ry) * 3.6px) 0 rgba(0,0,0,.5),
    calc(var(--rx) * -8px)  calc(10px + var(--ry) * -4px)  14px -8px rgba(0,0,0,.8),  /* contacto */
    calc(var(--rx) * -24px) calc(30px + var(--ry) * -12px) 52px -20px rgba(0,0,0,.9); /* ambiente */
}
/* El reflejo se desplaza al contrario de la inclinación */
.objeto::before{background:radial-gradient(72% 58% at
  calc(50% - var(--rx) * 46%) calc(24% - var(--ry) * 40%),
  rgba(255,255,255,.26),transparent 66%);mix-blend-mode:screen}
```

`@property` es lo que permite interpolar esas variables, así que sirven tanto para un vaivén
con `@keyframes` como para seguir al puntero desde JS.

**Si el objeto existe en la realidad, copia sus medidas.** Una tarjeta ISO 7810 mide
85,6 × 53,98 mm con un radio de esquina de 3,18 mm: proporción **1.586** y radio **3,7% del
ancho**. Al doble de redondeo se lee como una tarjeta de interfaz, no como una tarjeta de
pago — y es un error que se ve aunque nadie sepa nombrarlo. Lo mismo vale para teléfonos,
pantallas y envases: búscalo, no lo estimes.

Lo demás que hace falta, por orden de impacto:

1. **Canto.** Sin grosor visible la cara se lee como un rectángulo dibujado.
2. **Dos sombras**, no una: una de contacto corta y densa, y otra de ambiente amplia. Las dos se
   corren al contrario del giro.
3. **Grano.** Una superficie perfectamente lisa delata que es un dibujo. Un ruido al 13% en
   `mix-blend-mode:overlay` alcanza.
4. **Textura de superficie.** Un patrón muy tenue rompe el degradado plano.
5. **Reflejo del ambiente**, no solo un punto especular. Una banda ancha y suave que viaja con
   la inclinación, como la de una ventana. Un brillo puntual sobre color plano no alcanza.
6. **Viñeta.** Todo objeto fotografiado pierde luz hacia los bordes.
7. **Relieve en el texto**: luz arriba, sombra abajo. Plano se ve impreso sobre un rectángulo;
   en relieve, grabado en un objeto.
8. **Fuera el barrido de brillo en bucle.** Esa banda diagonal que cruza sola cada pocos
   segundos es el efecto que más grita "plantilla". Si hay reflejo, que dependa de la
   inclinación o del puntero.

> Cuidado al apilar capas: el grano y la viñeta necesitan intensidades **muy** distintas. Si
> comparten un mismo `opacity`, la superficie termina polvorienta.

### Datos geográficos

- Contorno en `[lon, lat]`, en **su propio archivo**. Cambiar de país debe ser cambiar ese
  archivo y nada más.
- **La resolución importa.** Un contorno de 60 puntos produce tramos rectos que se leen como
  escalera. Usa 300-500 (Natural Earth 1:50m es dominio público y sirve).
- Proyecta corrigiendo por latitud: `x = (lon - lonC) * cos(latC)`.
- Rellena con punto-en-polígono **en el navegador**, no precalculado: así el archivo de datos
  queda mínimo y la densidad se ajusta sin regenerar nada.
- **Densidad no uniforme.** Apiñar alrededor de las ciudades reproduce la población real y se
  ve mucho mejor que una nube pareja.
- Las fronteras, como línea continua (un tubo sobre una curva centrípeta), **nunca como fila de
  puntos**: se ve dentada.

---

## 6 · Responsive

### Breakpoints derivados, no redondos

Un breakpoint sale de **medir cuándo el contenido deja de caber**, no de una lista de
dispositivos. Si el nav tiene seis enlaces más sesión y CTA, mide su ancho real y pon ahí el
corte. Un `860px` elegido por costumbre deja el nav partido en dos líneas a 900.

### Orden en móvil

El contenido primario va primero. Un panel lateral con `order:-1` en un formulario entierra el
formulario bajo una pantalla de decoración.

### Contenido que desborda a propósito

Tablas anchas, carruseles: si scrollean, **tiene que verse que scrollean**. Una pista con
flecha y un degradado en el borde que **se apaga al llegar al final**. Sin eso se ve cortado y
parece roto.

### Elementos flotantes

Posicionados en porcentaje respecto a su columna, nunca dependiendo de dónde termina un texto:
el texto cambia de largo con la fuente, el idioma y el ancho, y un día tapa una palabra.

---

## 7 · Rendimiento

### Presupuesto

| | Objetivo |
|---|---|
| Primera carga en móvil | **< 200 KB** |
| Librerías pesadas | Bajo demanda, nunca en el HTML inicial |
| Bucles de rAF | Detenidos fuera de vista y con la pestaña oculta |

### Lo que traba un teléfono

No es la cantidad de elementos. En orden de costo:

1. **`filter: blur()` sobre superficies grandes, y peor si están animadas.** Tres manchas de
   60vw con `blur(110px)` en movimiento son lo más caro que puede tener una página.
2. **`backdrop-filter`** en elementos fijos: obliga a releer el fondo en cada cuadro de scroll.
3. **Bucles O(n²)** — un campo de partículas que compara cada punto contra todos.
4. **Sombras muy difusas** sobre elementos grandes.
5. **WebGL** corriendo donde el resultado ni se aprecia.

En móvil se apagan **todos**. Sustituye los desenfoques por un fondo pintado una vez: se ve
casi igual y no cuesta nada.

### Carga bajo demanda

```js
if (innerWidth < 820) return;                  // ni se pide en teléfonos
const io = new IntersectionObserver(rows => {
  if (!rows[0].isIntersecting) return;
  io.disconnect();
  cargarLibreria().then(arrancar);
}, { rootMargin: '700px 0px' });                // con margen: llega antes de verse
io.observe(host);
```

**No sondees capacidades al arrancar el script.** Un `getContext('webgl')` temprano puede dar
falso negativo antes de que la GPU esté lista, y ahí ya abortaste. Deja que falle el
`try/catch` del constructor real, más tarde.

---

## 8 · Accesibilidad

No es una pasada al final; es parte del componente.

- **`prefers-reduced-motion`**: apaga animaciones, canvas, cursores propios y transformaciones
  ligadas al scroll. Bloque explícito al final del CSS.
- **Foco visible** en todo lo interactivo. `:focus-visible` con `outline` y `outline-offset`.
- **Semántica**: `<table>` para tablas, `<details>` para acordeones, `<fieldset>`/`role` donde
  corresponda. Un `<div>` con click no es un botón.
- **Estado en el DOM**, no solo en color: `aria-pressed`, `aria-expanded`, `aria-invalid`,
  `aria-current`.
- **Teclado**: flechas dentro de un `radiogroup`, `Esc` cierra lo que se abre.
- **Formularios**: el error va junto al campo y también anunciado; nunca solo color.
- **Decoración**: `aria-hidden="true"`. Un canvas de partículas no debe existir para un lector
  de pantalla.

### Validación de formularios

Marcar en rojo un campo vacío que el usuario apenas tocó es hostil. **Valida al salir solo si
llegó a escribir**; lo que falta se avisa al enviar.

---

## 9 · Cómo verificar

Esta sección es la que más rinde. Sin ella se trabaja a ciegas.

### 9.1 · Buscar bandas vacías

Marca cada fila de 8px que tenga contenido, y reporta los tramos sin nada. Convierte "se
siente vacío" en "1.864px muertos en 12 bandas, aquí y aquí".

```js
var H = document.documentElement.scrollHeight, STEP = 8;
var rows = new Uint8Array(Math.ceil(H / STEP));
document.querySelectorAll('body *').forEach(function (el) {
  var s = getComputedStyle(el);
  if (s.display === 'none' || s.position === 'fixed' || +s.opacity === 0) return;
  var propio = [].slice.call(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim());
  if (!propio && el.firstElementChild) return;      // contenedores no cuentan
  var r = el.getBoundingClientRect();
  if (r.height < 2) return;
  for (var i = Math.floor((r.top + scrollY) / STEP); i <= (r.bottom + scrollY) / STEP; i++) rows[i] = 1;
});
// recorre rows y reporta rachas de ceros > 80px
```

### 9.2 · Desborde horizontal

Dos comprobaciones, y **hacen falta las dos**:

```js
scrollTo(400, 0); var real = scrollX; scrollTo(0, 0);   // ¿scrollea de verdad?
```

Y al listar elementos fuera de cuadro, **descarta los que un ancestro ya recorta** — si no, los
carruseles y las capas decorativas aparecen como falsos positivos y te persiguen fantasmas.

### 9.3 · Probar anchos que el navegador no da

Chrome headless no baja de ~500px de ancho. **Dentro de un `<iframe>` las media queries
evalúan el ancho del iframe**, así que un iframe de 375px prueba 375px de verdad.

```html
<iframe src="/" width="375" height="20000"></iframe>
```

Sirve además para desplazar la página sin depender del scroll: se mueve el iframe con
`style.top` negativo dentro de un contenedor con `overflow:hidden`.

### 9.4 · Auditar la red

```js
performance.getEntriesByType('resource')
  .forEach(e => console.log(Math.round((e.transferSize||0)/1024) + 'KB', e.name));
```

Corre esto a varios anchos. Es como se descubre que un teléfono se descarga 600 KB de una
librería que nunca usa.

### 9.5 · Capturas en headless

- **El reloj virtual no avanza las transiciones CSS**: las capturas salen a medio camino y
  parece que el diseño está roto. Fuerza `--force-prefers-reduced-motion` para fotografiar el
  estado final.
- Para WebGL: `--use-angle=swiftshader --enable-unsafe-swiftshader`. Renderiza por software, así
  que **apaga un poco los colores y baja el brillo de los puntos**: no juzgues intensidad por
  ahí, júzgala en un equipo real.
- Si un recurso externo cuelga (fuentes), el reloj virtual se detiene con él. Bloquéalo:
  `--host-resolver-rules="MAP fonts.googleapis.com ~NOTFOUND"`.
- En macOS no existe `timeout`, y el `cropOffset` de `sips` es relativo al **centro**, no a la
  esquina.

---

## 10 · Errores concretos y su causa raíz

Todos aparecieron en un proyecto real y todos costaron tiempo. Léelos antes de depurar.

### CSS

| Síntoma | Causa |
|---|---|
| Un degradado en texto desaparece | `background-clip:text` se rompe si un hijo tiene `transform`. Pon el degradado en el hijo transformado, no en el padre |
| A las bajantes (p, g, é) les falta el color | La caja del degradado termina en la línea base. Dale `padding-bottom` al elemento con el degradado, compensado con margen negativo |
| Un revelado tras máscara recorta letras | La máscara tiene que ser **más alta** que la caja de línea |
| Cambias la paleta y algo no cambia | Un `var()` dentro de una custom property se resuelve **donde se declara**. Si redefines `--b2` en `body`, tienes que volver a declarar ahí los degradados que lo usan |
| Un estilo no aplica y parece imposible | Especificidad: `.tarjeta p` gana a `.tarjeta__stat`. Usa doble clase |
| Un elemento se aplasta cuando falta espacio | Le falta `flex:none` |
| Una animación vuelve tras arreglarla | Un breakpoint la vuelve a declarar más abajo. **Busca la propiedad en todo el archivo, no solo en la regla base** |

### 3D

| Síntoma | Causa |
|---|---|
| Un resplandor inunda la escena | Fresnel con `BackSide` sobre un cuerpo transparente (ver §5) |
| Se ve pixelado | Tres causas distintas y suelen darse juntas: contorno de baja resolución, borde dibujado con puntos, y renderizar por debajo del `devicePixelRatio` dejando que el navegador escale |
| Todo se ve neón y plano | Blending aditivo y falta de luz direccional |
| Un objeto que gira se ve como una calcomanía | La luz está horneada en el fondo y no se mueve con el giro (ver §5) |
| Un objeto real "no se siente real" y no sabes por qué | Revisa sus proporciones y radios contra el objeto físico. El redondeo de más es el error más frecuente |
| El 3D nunca arranca | Sondeo de capacidades demasiado temprano (ver §7) |

### Layout

| Síntoma | Causa |
|---|---|
| Un panel lateral se ve vacío | Su contenido está centrado dentro de una fila de grid tan alta como la otra columna, y cae bajo el fold. Hazlo `sticky` con `height:100dvh` |
| Un elemento flotante tapa texto | Está posicionado contando con dónde termina el texto. Ánclalo a la columna |
| El nav se parte en dos líneas | El breakpoint se eligió redondo en vez de medido |

---

## 11 · Contenido

- **Escribe en el idioma y el registro del mercado.** Documentos de identidad, prefijos
  telefónicos, moneda, ciudades y métodos de pago son específicos de cada país. Un formulario
  que pide un documento del país equivocado destruye la credibilidad en un segundo.
- **Cifras y testimonios inventados van marcados.** Tabla de "reemplazar antes de publicar" en
  el README, con el dónde y el qué.
- **Coherencia entre secciones.** Si hay cuenta regresiva al lanzamiento, la acción es
  registrarse, no descargar. Al agregar una sección, revisa qué contradice.
- **Cuando el encargo tiene un supuesto de negocio, dilo.** Plazos, comisiones y porcentajes
  son decisiones del cliente. Constrúyelos como parámetros visibles y anota que están
  pendientes.

---

## 12 · Trabajo y entrega

- **Commits que explican el porqué**, no el qué. `git diff` ya dice qué cambió; el mensaje dice
  por qué y qué se descartó. Cuando arreglas algo, di cuál era la causa raíz.
- **Nada de versiones duplicadas a mano.** Si hacen falta variantes, se **generan** con un
  script desde una fuente única, y el README avisa que hay que regenerarlas.
- **Verifica el despliegue, no lo asumas.** Después de publicar, comprueba códigos de respuesta
  y que el contenido nuevo esté realmente ahí.
- **Reporta lo que no pudiste verificar.** Gestos táctiles reales, rendimiento en un teléfono
  concreto, cómo se ve en una pantalla que no tienes. Decirlo vale más que suponer.

---

## 13 · Lista de repaso

Antes de dar algo por terminado:

- [ ] Sin desborde horizontal a 360, 390, 414, 768, 1024 y 1440
- [ ] Primera carga en móvil bajo el presupuesto, medida en la pestaña de red
- [ ] `prefers-reduced-motion` apaga todo lo que se mueve
- [ ] Foco visible y recorrido de teclado completo
- [ ] Sin bandas vacías mayores a ~150px salvo respiro intencional
- [ ] Cambiar los tokens de marca repinta el sitio entero, sin excepciones
- [ ] Todo dato inventado está en la tabla de reemplazo del README
- [ ] Los breakpoints salen de medir contenido, no de una lista de dispositivos
- [ ] Lo pesado se carga bajo demanda y se detiene fuera de vista
- [ ] El README explica cómo correrlo, qué reemplazar y qué decisiones quedaron abiertas
