/**
 * The swarm. Eight formations, every one computed procedurally in the vertex
 * shader from a per-point random seed — so the whole system ships as one
 * buffer of random numbers and no geometry at all.
 *
 * Morphing between two formations is a mix, plus a swirl impulse scaled by
 * sin(t·π): the points explode outward at the midpoint and re-gather. That
 * impulse is what stops a morph reading as a lerp.
 */

export const swarmVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  uniform float uCount;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec2  uPointer;
  uniform vec3  uAccent;
  uniform vec3  uAccentAlt;
  uniform vec3  uInk;
  uniform float uSpread;

  attribute vec3  aSeed;
  attribute float aIndex;

  varying vec3  vCol;
  varying float vFade;
  varying float vBurst;

  const float FORMATIONS = 8.0;

  mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

  vec3 swirl(vec3 p, float t) {
    return vec3(
      sin(p.y * 1.7 + t)       * cos(p.z * 1.3 - t * 0.7),
      sin(p.z * 1.5 - t * 0.8) * cos(p.x * 1.9 + t * 0.6),
      sin(p.x * 1.6 + t * 0.9) * cos(p.y * 1.4 - t * 0.5)
    );
  }

  // 0 — Ingress: dispersed haze
  vec3 fHaze(vec3 s, float t) {
    vec3 d = normalize(s * 2.0 - 1.0 + 0.0001);
    float r = 1.15 + fract(s.z * 57.13) * 1.75;
    vec3 p = d * r;
    p.y *= 0.62;
    p += swirl(p * 0.55, t * 0.16) * 0.7;
    return p;
  }

  // 1 — L01 Interface: a flat lattice, the DOM laid out in Z
  vec3 fLattice(float i, float t) {
    float cols = 420.0;
    float rows = max(ceil(uCount / cols), 1.0);
    float x = mod(i, cols);
    float y = floor(i / cols);
    vec3 p = vec3((x / cols - 0.5) * 4.7, (y / rows - 0.5) * 2.8, 0.0);
    p.z += sin(p.x * 2.6 + t * 0.5) * 0.10 + cos(p.y * 3.1 - t * 0.4) * 0.07;
    return p;
  }

  // 2 — L02 Motion: the lattice dissolves into flow
  vec3 fFlow(float i, vec3 s, float t) {
    vec3 p = fLattice(i, t);
    p += swirl(p * 1.15 + s * 0.6, t * 0.55) * 0.66;
    p.z += sin(p.x * 1.7 + t * 0.9) * 0.48;
    return p;
  }

  // 3 — L03 Service: request arcs orbiting a centre
  vec3 fOrbit(vec3 s, float t) {
    float band = floor(s.z * 4.0);
    float a = s.x * 6.28318 + t * (0.22 + band * 0.09);
    float r = 0.78 + s.y * 1.15;
    vec3 p = vec3(cos(a) * r, (s.z - 0.5) * 0.55, sin(a) * r);
    float tilt = band * 0.42 - 0.6;
    p.yz = rot(tilt) * p.yz;
    return p;
  }

  // 4 — L04 Data: crystalline document clusters
  vec3 fCrystal(vec3 s, float t) {
    // Finer lattice with tighter, anisotropic jitter: reads as crystalline
    // structure instead of a handful of blocky cells.
    vec3 cell = floor(s * 7.0);
    vec3 c = (cell / 7.0 - 0.43) * 3.5;
    vec3 j = (fract(s * 23.17) - 0.5) * 0.22;
    j.y *= 1.9;
    vec3 p = c + j;
    p.xz = rot(t * 0.16) * p.xz;
    return p;
  }

  // 5 — L05 Runtime: points snap onto container surfaces
  vec3 fCubes(vec3 s, float t) {
    vec3 cell = floor(s * vec3(3.0, 3.0, 2.0));
    vec3 lo = fract(s * vec3(37.3, 17.9, 29.1)) - 0.5;
    float ax = floor(fract(s.x * 91.7) * 3.0);
    if (ax < 1.0)      lo.x = sign(lo.x + 0.0001) * 0.5;
    else if (ax < 2.0) lo.y = sign(lo.y + 0.0001) * 0.5;
    else               lo.z = sign(lo.z + 0.0001) * 0.5;
    vec3 p = (cell - vec3(1.0, 1.0, 0.5)) * 1.30 + lo * 1.04;
    p.xz = rot(t * 0.13) * p.xz;
    return p;
  }

  // 6 — L06 Delivery: radial dispersal outward
  vec3 fBurst(vec3 s, float t) {
    vec3 d = normalize(s * 2.0 - 1.0 + 0.0001);
    float r = 1.05 + fract(s.x * 91.3) * 1.65;
    vec3 p = d * r;
    p += swirl(p * 1.3, t * 0.35) * 0.22;
    return p;
  }

  // 7 — The Core: everything collapses into a thin shell
  vec3 fCore(vec3 s, float t) {
    vec3 d = normalize(s * 2.0 - 1.0 + 0.0001);
    float r = 0.86 + fract(s.y * 131.7) * 0.12;
    vec3 p = d * r;
    p.xz = rot(t * 0.20) * p.xz;
    p += swirl(p * 3.0, t * 0.5) * 0.04;
    return p;
  }

  vec3 formation(int id, float i, vec3 s, float t) {
    if (id == 0) return fHaze(s, t);
    if (id == 1) return fLattice(i, t);
    if (id == 2) return fFlow(i, s, t);
    if (id == 3) return fOrbit(s, t);
    if (id == 4) return fCrystal(s, t);
    if (id == 5) return fCubes(s, t);
    if (id == 6) return fBurst(s, t);
    return fCore(s, t);
  }

  void main() {
    float ph = clamp(uPhase, 0.0, FORMATIONS - 1.0);
    float fi = floor(ph);
    int a = int(fi);
    int bi = int(min(fi + 1.0, FORMATIONS - 1.0));
    float f = ph - fi;

    vec3 pos;
    float burst;

    // uPhase is a uniform, so every vertex takes the same branch — coherent
    // on the GPU. The swarm rests on a formation most of the time, and while
    // it does this skips the second formation and the turbulence entirely,
    // roughly halving the vertex cost.
    if (f < 0.002) {
      pos = formation(a, aIndex, aSeed, uTime);
      burst = 0.0;
    } else {
      vec3 pa = formation(a, aIndex, aSeed, uTime);
      vec3 pb = formation(bi, aIndex, aSeed, uTime);
      float e = f * f * (3.0 - 2.0 * f);
      pos = mix(pa, pb, e);

      // Transition impulse — the reason a morph reads as an event.
      burst = sin(f * 3.14159);
      pos += swirl(pos * 1.9 + aSeed * 4.0, uTime * 1.15) * burst * 0.52;
    }

    // Pointer parallax, strongest on the points nearest the camera.
    pos.xy += uPointer * (0.10 + fract(aSeed.x * 17.0) * 0.16);
    pos *= uSpread;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float dist = max(-mv.z, 0.35);
    gl_PointSize = clamp(uSize * uPixelRatio * (0.5 + fract(aSeed.y * 53.0)) / dist, 0.6, 9.0);

    float hue = fract(aSeed.z * 7.0 + float(a) * 0.17 + burst * 0.25);
    vec3 col = mix(uAccent, uAccentAlt, smoothstep(0.0, 0.6, hue));
    col = mix(col, uInk, smoothstep(0.86, 1.0, hue) * 0.85);

    vCol = col;
    vBurst = burst;
    vFade = smoothstep(11.0, 2.0, dist);
  }
`;

export const swarmFragment = /* glsl */ `
  uniform float uOpacity;

  varying vec3  vCol;
  varying float vFade;
  varying float vBurst;

  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float d2 = dot(q, q);
    if (d2 > 0.25) discard;

    float a = smoothstep(0.25, 0.01, d2);
    float energy = 0.42 + vBurst * 0.8;
    gl_FragColor = vec4(vCol * energy, a * vFade * uOpacity);
  }
`;

// ---------------------------------------------------------------- dust
// A static column the camera physically descends through. Nothing sells
// vertical travel like fixed geometry moving past you.
export const dustVertex = /* glsl */ `
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3  uInk;
  varying float vFade;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = max(-mv.z, 0.4);
    gl_PointSize = clamp(uSize * uPixelRatio / dist, 0.5, 3.5);
    vFade = smoothstep(46.0, 3.0, dist) * 0.7;
  }
`;

export const dustFragment = /* glsl */ `
  uniform vec3 uInk;
  varying float vFade;

  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float d2 = dot(q, q);
    if (d2 > 0.25) discard;
    float a = smoothstep(0.25, 0.02, d2) * vFade;
    gl_FragColor = vec4(uInk * a, a * 0.55);
  }
`;
