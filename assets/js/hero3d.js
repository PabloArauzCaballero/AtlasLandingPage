/* ═══════════════════════════════════════════════════════════════════════
   ATLAS · Globo WebGL del hero
   ─────────────────────────────────────────────────────────────────────
   Un globo de puntos (Atlas = mundo) girando detrás del teléfono.

   Lo que separa esto de un "efecto 3D de plantilla" son cuatro cosas, y
   todas viven en los shaders de abajo:
     · los puntos de la cara oculta se apagan, así se percibe un cuerpo
       sólido y no una nube hueca;
     · cada punto es un disco con borde suave, no un cuadrado duro;
     · el color y el tamaño pierden fuerza con la distancia (niebla),
       que es lo que da aire entre el frente y el fondo;
     · una atmósfera con caída de Fresnel en el borde, como la que se ve
       en una foto de un planeta real.

   Es una capa decorativa: sin WebGL, con movimiento reducido o si Three
   no cargó, no se dibuja y el hero se ve como siempre.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const host = document.getElementById('globe');
  if (!host || typeof THREE === 'undefined') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (innerWidth < 760) return;          // detrás del teléfono no se vería

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true, alpha: true, powerPreference: 'high-performance'
    });
  } catch (e) {
    return;
  }

  /* ── Colores leídos del CSS: el globo cambia con la paleta ── */
  const css = getComputedStyle(document.documentElement);
  const brand = (name, fb) => new THREE.Color(css.getPropertyValue(name).trim() || fb);
  const cDeep = brand('--b1', '#0E7377');
  const cMid  = brand('--b2', '#14A894');
  const cLite = brand('--b3', '#2BE0A8');

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
  camera.position.set(0, 0, 13);

  const world = new THREE.Group();
  world.rotation.z = -0.38;              // eje inclinado, como un planeta real
  scene.add(world);

  const R = 4.2;

  /* ═══════════ Globo de puntos ═══════════ */
  const COUNT = 9000;
  const pos   = new Float32Array(COUNT * 3);
  const col   = new Float32Array(COUNT * 3);
  const siz   = new Float32Array(COUNT);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const tmp = new THREE.Color();

  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;

    // Un poco de desorden: una retícula perfecta se lee como generada
    const j = 1 + (Math.random() - 0.5) * 0.035;
    pos[i * 3]     = Math.cos(th) * r * R * j;
    pos[i * 3 + 1] = y * R * j;
    pos[i * 3 + 2] = Math.sin(th) * r * R * j;

    // Variación tonal sutil, no un degradado de neón parejo
    const t = (y + 1) / 2;
    tmp.copy(cDeep).lerp(cMid, Math.min(t * 1.7, 1));
    if (t > 0.55) tmp.lerp(cLite, (t - 0.55) * 1.5);
    tmp.offsetHSL(0, 0, (Math.random() - 0.5) * 0.09);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;

    siz[i] = 2.2 + Math.random() * 2.6;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor',   new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize',    new THREE.BufferAttribute(siz, 1));

  const dotsMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    blending: THREE.NormalBlending,       // aditivo satura y delata el CGI
    uniforms: { uOpacity: { value: 1 }, uFogNear: { value: 9 }, uFogFar: { value: 22 } },
    vertexShader: `
      attribute float aSize;
      attribute vec3 aColor;
      varying vec3 vColor;
      varying float vFace;
      varying float vFog;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        // La esfera está centrada: la normal es la propia posición
        vec3 n = normalize(normalMatrix * normalize(position));
        // 1 de frente, 0 en la cara oculta. Es lo que la vuelve un cuerpo.
        vFace = smoothstep(-0.25, 0.55, n.z);
        float dist = -mv.z;
        vFog = 1.0 - smoothstep(uFogNear, uFogFar, dist);
        vColor = aColor;
        gl_PointSize = aSize * (52.0 / dist) * (0.55 + 0.45 * vFog);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vFace;
      varying float vFog;
      void main(){
        // Disco con borde suave: un cuadrado duro se ve barato
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.12, d);
        if (a < 0.01) discard;
        float shade = 0.34 + 0.66 * vFace;    // la cara oculta no desaparece, se apaga
        gl_FragColor = vec4(vColor * shade, a * vFog * uOpacity * (0.5 + 0.5 * vFace));
      }`
  });
  world.add(new THREE.Points(geo, dotsMat));

  /* ═══════════ Atmósfera (Fresnel) ═══════════
     El filo luminoso del borde es lo que hace que se lea como un planeta.

     Ojo con el truco clásico de BackSide: ese ilumina el CENTRO y solo
     funciona si el planeta es opaco y lo tapa. Aquí el planeta son puntos
     transparentes, así que el brillo inundaba la escena y se comía todo.
     Con FrontSide y el Fresnel invertido el brillo queda donde debe: en
     el limbo. */
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.02, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true, side: THREE.FrontSide, depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: cLite.clone() } },
      vertexShader: `
        varying vec3 vNormal;
        void main(){
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        void main(){
          // 0 de frente, 1 en el borde: el filo se enciende, el centro no
          float rim = 1.0 - clamp(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
          gl_FragColor = vec4(uColor, 1.0) * pow(rim, 3.0) * 1.05;
        }`
    })
  );
  world.add(atmo);

  /* ═══════════ Polvo lejano ═══════════
     Muy tenue y a distintas distancias: sin esto el globo queda recortado
     contra el fondo, que es otra marca del 3D mal integrado. */
  const DUST = 420;
  const dpos = new Float32Array(DUST * 3);
  const dsiz = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    const rr = R * (1.9 + Math.random() * 2.6);
    const a = Math.random() * Math.PI * 2;
    const b = Math.acos(2 * Math.random() - 1);
    dpos[i * 3]     = Math.sin(b) * Math.cos(a) * rr;
    dpos[i * 3 + 1] = Math.cos(b) * rr * 0.75;
    dpos[i * 3 + 2] = Math.sin(b) * Math.sin(a) * rr;
    dsiz[i] = 0.9 + Math.random() * 1.4;
  }
  const dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  dgeo.setAttribute('aSize', new THREE.BufferAttribute(dsiz, 1));

  const dust = new THREE.Points(dgeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    uniforms: { uColor: { value: cMid.clone() } },
    vertexShader: `
      attribute float aSize;
      varying float vFog;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float dist = -mv.z;
        vFog = 1.0 - smoothstep(10.0, 26.0, dist);
        gl_PointSize = aSize * (26.0 / dist);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vFog;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.15, d);
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor, a * vFog * 0.5);
      }`
  }));
  scene.add(dust);

  /* ── Montaje ── */
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 1100 ? 15.5 : 13;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  /* ── El puntero inclina el mundo, muy poco: de más se vuelve juguete ── */
  let tx = 0, ty = 0, mx = 0, my = 0;
  addEventListener('mousemove', (e) => {
    tx = (e.clientX / innerWidth - 0.5) * 2;
    ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  let visible = true, hidden = false, raf = null;
  const clock = new THREE.Clock();

  function frame() {
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();

    mx += (tx - mx) * 0.035;
    my += (ty - my) * 0.035;

    world.rotation.y = t * 0.055 + mx * 0.3;   // lento: un planeta no corre
    world.rotation.x = my * 0.16;
    dust.rotation.y  = -t * 0.018;

    renderer.render(scene, camera);
  }

  const play = () => { if (raf === null && visible && !hidden) frame(); };
  const stop = () => { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      visible ? play() : stop();
    }, { threshold: 0 }).observe(host);
  }
  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden;
    hidden ? stop() : play();
  });

  host.classList.add('is-on');
  play();
})();
