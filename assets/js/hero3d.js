/* ═══════════════════════════════════════════════════════════════════════
   ATLAS · Globo WebGL del hero
   ─────────────────────────────────────────────────────────────────────
   No es un adorno abstracto: es la red. Los puntos son comercios, los
   nodos brillantes las plazas grandes, y por los arcos viajan pulsos —
   las compras cruzando la red.

   Lo que lo separa de un efecto de plantilla vive en los shaders:
     · los puntos de la cara oculta se apagan, así se percibe un cuerpo
       sólido y no una nube hueca;
     · cada punto es un disco de borde suave, no un cuadrado duro;
     · color y tamaño pierden fuerza con la distancia, que es lo que da
       aire entre el frente y el fondo;
     · la atmósfera usa Fresnel con FrontSide (ver la nota del bloque 4).

   Es una capa decorativa: sin WebGL, con movimiento reducido o si Three
   no cargó, no se dibuja y el hero se ve como siempre.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const host = document.getElementById('globe');
  if (!host || typeof THREE === 'undefined') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (innerWidth < 760) return;

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
  const brand = (n, fb) => new THREE.Color(css.getPropertyValue(n).trim() || fb);
  const cDeep = brand('--b1', '#0E7377');
  const cMid  = brand('--b2', '#14A894');
  const cLite = brand('--b3', '#2BE0A8');
  const cSoft = brand('--b4', '#5CF0CC');

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
  camera.position.set(0, 0, 13);

  const world = new THREE.Group();
  world.rotation.z = -0.38;                 // eje inclinado, como un planeta
  scene.add(world);

  const R = 4.2;

  /* Niebla por distancia, compartida por todas las capas */
  const FOG_V = `
    float dist = -mv.z;
    vFog = 1.0 - smoothstep(9.0, 23.0, dist);`;

  /* ═══════════ 1 · Superficie: los comercios ═══════════ */
  const COUNT = 9500;
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const siz = new Float32Array(COUNT);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const tmp = new THREE.Color();

  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;

    // Ruido en la posición: una retícula perfecta se lee como generada
    const j = 1 + (Math.random() - 0.5) * 0.04;
    pos[i * 3]     = Math.cos(th) * r * R * j;
    pos[i * 3 + 1] = y * R * j;
    pos[i * 3 + 2] = Math.sin(th) * r * R * j;

    const t = (y + 1) / 2;
    tmp.copy(cDeep).lerp(cMid, Math.min(t * 1.7, 1));
    if (t > 0.55) tmp.lerp(cLite, (t - 0.55) * 1.5);
    tmp.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;

    siz[i] = 2.1 + Math.random() * 2.7;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor',   new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize',    new THREE.BufferAttribute(siz, 1));

  world.add(new THREE.Points(geo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    blending: THREE.NormalBlending,        // aditivo satura y vuelve todo neón
    uniforms: { uOpacity: { value: 1 } },
    vertexShader: `
      attribute float aSize;
      attribute vec3 aColor;
      varying vec3 vColor; varying float vFace; varying float vFog; varying float vLit;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normalize(position));
        vFace = smoothstep(-0.25, 0.55, n.z);   // 1 de frente, 0 en la cara oculta
        // Luz desde arriba a la izquierda: da lado iluminado y terminador
        vec3 L = normalize(vec3(-0.55, 0.5, 0.62));
        vLit = 0.22 + 0.78 * pow(clamp(dot(n, L), 0.0, 1.0), 0.75);
        ${FOG_V}
        vColor = aColor;
        gl_PointSize = aSize * (44.0 / dist) * (0.55 + 0.45 * vFog) * (0.72 + 0.28 * vLit);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vColor; varying float vFace; varying float vFog; varying float vLit;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.12, d);     // disco suave, no cuadrado
        if (a < 0.01) discard;
        float shade = (0.3 + 0.7 * vFace) * vLit;
        gl_FragColor = vec4(vColor * shade, a * vFog * uOpacity * (0.4 + 0.6 * vFace) * (0.45 + 0.55 * vLit));
      }`
  })));

  /* ═══════════ 2 · Nodos: las plazas grandes ═══════════ */
  const HUBS = 30;
  const hubPts = [];
  for (let i = 0; i < HUBS; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    hubPts.push(new THREE.Vector3(
      Math.sin(ph) * Math.cos(th) * R,
      Math.cos(ph) * R,
      Math.sin(ph) * Math.sin(th) * R
    ));
  }

  const hpos = new Float32Array(HUBS * 3);
  const hoff = new Float32Array(HUBS);
  hubPts.forEach((p, i) => {
    hpos[i * 3] = p.x; hpos[i * 3 + 1] = p.y; hpos[i * 3 + 2] = p.z;
    hoff[i] = Math.random() * 6.28;
  });
  const hgeo = new THREE.BufferGeometry();
  hgeo.setAttribute('position', new THREE.BufferAttribute(hpos, 3));
  hgeo.setAttribute('aOff', new THREE.BufferAttribute(hoff, 1));

  const hubMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: cSoft.clone() }, uTime: { value: 0 } },
    vertexShader: `
      attribute float aOff;
      uniform float uTime;
      varying float vFace; varying float vFog; varying float vPulse;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normalize(position));
        vFace = smoothstep(-0.1, 0.5, n.z);
        ${FOG_V}
        vPulse = 0.65 + 0.35 * sin(uTime * 1.6 + aOff);
        gl_PointSize = (16.0 + 9.0 * vPulse) * (54.0 / dist) * 0.3;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vFace; varying float vFog; varying float vPulse;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.18, 0.0, d);
        float halo = smoothstep(0.5, 0.16, d) * 0.35;
        float a = (core + halo) * vFace * vFog * vPulse;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor, a);
      }`
  });
  world.add(new THREE.Points(hgeo, hubMat));

  /* ═══════════ 3 · Arcos: las compras viajando ═══════════ */
  const arcs = [];
  for (let i = 0; i < 16; i++) {
    const a = hubPts[(Math.random() * HUBS) | 0];
    const b = hubPts[(Math.random() * HUBS) | 0];
    if (a.distanceTo(b) < R * 0.8) continue;      // los saltos cortos no lucen

    // El control se levanta sobre la superficie: a más distancia, más alto
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize()
      .multiplyScalar(R * (1.12 + a.distanceTo(b) / (R * 7)));
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);

    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: cLite.clone() },
        uTime:  { value: 0 },
        uOff:   { value: Math.random() },
        uSpeed: { value: 0.1 + Math.random() * 0.12 }
      },
      vertexShader: `
        varying float vU; varying float vFog;
        void main(){
          vU = uv.x;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          ${FOG_V}
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor; uniform float uTime; uniform float uOff; uniform float uSpeed;
        varying float vU; varying float vFog;
        void main(){
          // Cabeza del pulso recorriendo el arco, con distancia envolvente
          float head = fract(uTime * uSpeed + uOff);
          float d = vU - head;
          d = d - floor(d + 0.5);
          float pulse = smoothstep(0.13, 0.0, abs(d));
          // Los extremos se desvanecen: así el arco no nace de golpe
          float ends = smoothstep(0.0, 0.09, vU) * smoothstep(1.0, 0.91, vU);
          float a = (0.14 + pulse * 1.15) * ends * vFog;
          if (a < 0.01) discard;
          gl_FragColor = vec4(uColor, a);
        }`
    });

    world.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.022, 6, false), mat));
    arcs.push(mat);
  }

  /* ═══════════ 4 · Atmósfera (Fresnel) ═══════════
     Ojo con el truco clásico de BackSide: ese ilumina el CENTRO y solo
     funciona si el planeta es opaco y lo tapa. Aquí el planeta son puntos
     transparentes, así que ese brillo inunda la escena. Con FrontSide y el
     Fresnel invertido, el filo queda donde debe: en el limbo. */
  world.add(new THREE.Mesh(
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
          float rim = 1.0 - clamp(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
          gl_FragColor = vec4(uColor, 1.0) * pow(rim, 3.0) * 1.15;
        }`
    })
  ));

  /* ═══════════ 5 · Polvo lejano ═══════════
     Sin esto el globo queda recortado contra el fondo, que es otra marca
     del 3D mal integrado. */
  const DUST = 520;
  const dpos = new Float32Array(DUST * 3);
  const dsiz = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    const rr = R * (1.9 + Math.random() * 2.6);
    const a = Math.random() * Math.PI * 2;
    const b = Math.acos(2 * Math.random() - 1);
    dpos[i * 3]     = Math.sin(b) * Math.cos(a) * rr;
    dpos[i * 3 + 1] = Math.cos(b) * rr * 0.75;
    dpos[i * 3 + 2] = Math.sin(b) * Math.sin(a) * rr;
    dsiz[i] = 1.0 + Math.random() * 1.5;
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
        ${FOG_V}
        gl_PointSize = aSize * (30.0 / dist);
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

  /* ── El puntero inclina el mundo, poco: de más se vuelve juguete ── */
  let tx = 0, ty = 0, mx = 0, my = 0;
  addEventListener('mousemove', (e) => {
    tx = (e.clientX / innerWidth - 0.5) * 2;
    ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ── El scroll lo sigue girando mientras se sale de cuadro ── */
  let scrollK = 0;
  addEventListener('scroll', () => {
    scrollK = Math.min(scrollY / Math.max(innerHeight, 1), 1.4);
  }, { passive: true });

  let visible = true, hidden = false, raf = null;
  const clock = new THREE.Clock();

  function frame() {
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();

    mx += (tx - mx) * 0.035;
    my += (ty - my) * 0.035;

    world.rotation.y = t * 0.055 + mx * 0.3 + scrollK * 0.5;
    world.rotation.x = my * 0.16;
    dust.rotation.y  = -t * 0.018;

    hubMat.uniforms.uTime.value = t;
    for (let i = 0; i < arcs.length; i++) arcs[i].uniforms.uTime.value = t;

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
