/* ═══════════════════════════════════════════════════════════════════════
   ATLAS · Mapa de Bolivia en WebGL
   ─────────────────────────────────────────────────────────────────────
   El mapa del país hecho de puntos: cada punto es un comercio, los nodos
   que laten son las ciudades y por los arcos viajan pulsos — las compras
   cruzando la red.

   El relleno se calcula en el navegador con punto-en-polígono sobre el
   contorno de `geo-bolivia.js`, así que para cambiar de país solo hay que
   cambiar ese archivo: aquí no se toca nada.

   Es una capa decorativa: sin WebGL, con movimiento reducido o si Three
   no cargó, no se dibuja y la sección se ve igual sin él.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const host = document.getElementById('mapa');
  const GEO = window.ATLAS_GEO;
  if (!host || !GEO || typeof THREE === 'undefined') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true, alpha: true, powerPreference: 'high-performance'
    });
  } catch (e) {
    return;
  }

  /* ── Colores leídos del CSS: el mapa cambia con la paleta ── */
  const css = getComputedStyle(document.documentElement);
  const brand = (n, fb) => new THREE.Color(css.getPropertyValue(n).trim() || fb);
  const cDeep = brand('--b1', '#0E7377');
  const cMid  = brand('--b2', '#14A894');
  const cLite = brand('--b3', '#2BE0A8');
  const cSoft = brand('--b4', '#5CF0CC');

  /* ── Proyección: lon/lat → plano, corrigiendo por la latitud ── */
  const ring = GEO.outline;
  let lo0 = Infinity, lo1 = -Infinity, la0 = Infinity, la1 = -Infinity;
  for (const [lo, la] of ring) {
    if (lo < lo0) lo0 = lo; if (lo > lo1) lo1 = lo;
    if (la < la0) la0 = la; if (la > la1) la1 = la;
  }
  const loC = (lo0 + lo1) / 2, laC = (la0 + la1) / 2;
  const kx = Math.cos(laC * Math.PI / 180);

  const SCALE = 9 / Math.max((lo1 - lo0) * kx, la1 - la0);   // el país cabe en ~9 unidades
  const project = (lo, la) => [ (lo - loC) * kx * SCALE, (la - laC) * SCALE ];

  const poly = ring.map(([lo, la]) => project(lo, la));

  // Punto en polígono (ray casting)
  function inside(x, y) {
    let hit = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  }

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 15);

  const map = new THREE.Group();
  map.rotation.x = -0.38;             // el mapa reposa inclinado, no de frente
  scene.add(map);

  const FOG_V = `
    float dist = -mv.z;
    vFog = 1.0 - smoothstep(11.0, 26.0, dist);`;

  /* ═══════════ 1 · Relleno: los comercios ═══════════
     La densidad no es pareja: se apiña alrededor de las ciudades, como la
     población real. Una nube uniforme se lee como textura generada. */
  const cityXY = GEO.cities.map((c) => project(c.lon, c.lat));

  function density(x, y) {
    let d = 0.21;                            // piso: el campo nunca queda vacío
    for (let i = 0; i < cityXY.length; i++) {
      const dx = x - cityXY[i][0], dy = y - cityXY[i][1];
      const r2 = dx * dx + dy * dy;
      d += (GEO.cities[i].big ? 1.15 : 0.6) * Math.exp(-r2 / 0.85);
    }
    return Math.min(d, 1);
  }

  const fill = [];
  const wgt  = [];
  const STEP = 0.062;                        // grados entre candidatos
  for (let la = la0; la <= la1; la += STEP) {
    for (let lo = lo0; lo <= lo1; lo += STEP) {
      // Desorden: una retícula perfecta se lee como generada
      const jx = lo + (Math.random() - 0.5) * STEP * 0.95;
      const jy = la + (Math.random() - 0.5) * STEP * 0.95;
      const [x, y] = project(jx, jy);
      if (!inside(x, y)) continue;
      const w = density(x, y);
      if (Math.random() > w) continue;        // el sorteo produce el apiñamiento
      fill.push(x, y);
      wgt.push(w);
    }
  }

  const N = fill.length / 2;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const siz = new Float32Array(N);
  const tmp = new THREE.Color();

  for (let i = 0; i < N; i++) {
    const x = fill[i * 2], y = fill[i * 2 + 1];
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 0.06;   // grosor mínimo, no una lámina

    // Del teal profundo abajo a la menta arriba, con variación por punto
    const t = (y / 4.5 + 1) / 2;
    tmp.copy(cDeep).lerp(cMid, Math.min(Math.max(t, 0) * 1.6, 1));
    if (t > 0.55) tmp.lerp(cLite, (t - 0.55) * 1.4);
    tmp.offsetHSL(0, 0, (Math.random() - 0.5) * 0.12);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;

    siz[i] = (1.3 + Math.random() * 1.5) * (0.75 + 0.55 * wgt[i]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor',   new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize',    new THREE.BufferAttribute(siz, 1));

  const fillMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute float aSize;
      attribute vec3 aColor;
      uniform float uTime;
      varying vec3 vColor; varying float vFog; varying float vWave;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        ${FOG_V}
        // Onda lenta cruzando el país: la red respira, no parpadea
        vWave = 0.72 + 0.28 * sin(position.x * 0.55 - uTime * 0.9 + position.y * 0.3);
        vColor = aColor;
        gl_PointSize = aSize * (40.0 / dist) * (0.8 + 0.2 * vWave);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vFog; varying float vWave;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.18, d);      // caída suave: el corte duro aliasea
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor * (0.6 + 0.4 * vWave), a * vFog * vWave * 0.9);
      }`
  });
  map.add(new THREE.Points(geo, fillMat));

  /* ═══════════ 2 · Frontera ═══════════
     Antes era una fila de puntos y se veía dentada. Un tubo sobre una
     curva centrípeta da una línea continua y suave, sin escalones. */
  const border = new THREE.CatmullRomCurve3(
    poly.map(([x, y]) => new THREE.Vector3(x, y, 0.04)),
    true, 'centripetal', 0.5
  );
  map.add(new THREE.Mesh(
    new THREE.TubeGeometry(border, Math.min(poly.length * 2, 900), 0.017, 5, true),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: cLite.clone() } },
      vertexShader: `
        varying float vFog; varying float vRound;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          ${FOG_V}
          vRound = uv.y;                 // posición alrededor del tubo
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vFog; varying float vRound;
        void main(){
          // Se apaga hacia los lados del tubo: se lee como trazo, no como caño
          float soft = sin(vRound * 3.14159);
          gl_FragColor = vec4(uColor, pow(soft, 1.6) * vFog * 0.95);
        }`
    })
  ));

  /* ═══════════ 3 · Ciudades ═══════════ */
  const cityPts = GEO.cities.map((c) => {
    const [x, y] = project(c.lon, c.lat);
    return { v: new THREE.Vector3(x, y, 0.12), big: c.big };
  });

  const cpos = new Float32Array(cityPts.length * 3);
  const coff = new Float32Array(cityPts.length);
  const cbig = new Float32Array(cityPts.length);
  cityPts.forEach((c, i) => {
    cpos[i * 3] = c.v.x; cpos[i * 3 + 1] = c.v.y; cpos[i * 3 + 2] = c.v.z;
    coff[i] = Math.random() * 6.28;
    cbig[i] = c.big ? 1 : 0.62;
  });
  const cgeo = new THREE.BufferGeometry();
  cgeo.setAttribute('position', new THREE.BufferAttribute(cpos, 3));
  cgeo.setAttribute('aOff', new THREE.BufferAttribute(coff, 1));
  cgeo.setAttribute('aBig', new THREE.BufferAttribute(cbig, 1));

  const cityMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: cSoft.clone() }, uTime: { value: 0 } },
    vertexShader: `
      attribute float aOff; attribute float aBig;
      uniform float uTime;
      varying float vFog; varying float vPulse;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        ${FOG_V}
        vPulse = 0.6 + 0.4 * sin(uTime * 1.5 + aOff);
        gl_PointSize = (13.0 + 8.0 * vPulse) * aBig * (46.0 / dist) * 0.34;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vFog; varying float vPulse;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.2, 0.0, d);
        float halo = smoothstep(0.5, 0.18, d) * 0.4;
        float a = (core + halo) * vFog * vPulse;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor, a);
      }`
  });
  map.add(new THREE.Points(cgeo, cityMat));

  /* ═══════════ 4 · Arcos: las compras entre ciudades ═══════════ */
  const arcs = [];
  const pairs = [[0, 1], [0, 2], [1, 2], [2, 3], [0, 6], [1, 4], [0, 7], [1, 8], [2, 5], [0, 10]];
  pairs.forEach(([i, j], k) => {
    const a = cityPts[i] && cityPts[i].v, b = cityPts[j] && cityPts[j].v;
    if (!a || !b) return;

    // El control se levanta según la distancia: los saltos largos vuelan más alto
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.z = 0.35 + a.distanceTo(b) * 0.28;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);

    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: cLite.clone() },
        uTime:  { value: 0 },
        uOff:   { value: k / pairs.length },
        uSpeed: { value: 0.12 + Math.random() * 0.1 }
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
          float pulse = smoothstep(0.15, 0.0, abs(d));
          // Los extremos se desvanecen: el arco no nace de golpe
          float ends = smoothstep(0.0, 0.1, vU) * smoothstep(1.0, 0.9, vU);
          float a = (0.12 + pulse * 1.1) * ends * vFog;
          if (a < 0.01) discard;
          gl_FragColor = vec4(uColor, a);
        }`
    });

    map.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.018, 6, false), mat));
    arcs.push(mat);
  });

  /* ── Montaje ── */
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 620 ? 18 : 15;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  /* ── El puntero inclina el mapa, poco: un mapa no gira sobre sí mismo ── */
  let tx = 0, ty = 0, mx = 0, my = 0;
  addEventListener('mousemove', (e) => {
    const r = host.getBoundingClientRect();
    tx = ((e.clientX - r.left) / Math.max(r.width, 1) - 0.5) * 2;
    ty = ((e.clientY - r.top) / Math.max(r.height, 1) - 0.5) * 2;
  }, { passive: true });

  let visible = true, hidden = false, raf = null;
  const clock = new THREE.Clock();

  function frame() {
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();

    mx += (tx - mx) * 0.04;
    my += (ty - my) * 0.04;

    map.rotation.y = mx * 0.26;
    map.rotation.x = -0.38 + my * 0.14;

    fillMat.uniforms.uTime.value = t;
    cityMat.uniforms.uTime.value = t;
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
