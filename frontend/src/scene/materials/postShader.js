/**
 * Composite pass. One half-res blur chain feeds both effects:
 *   · depth-of-field  — real, driven by the scene depth texture
 *   · bloom           — bright part of the same blurred buffer
 * plus chromatic aberration, vignette and grain.
 */

export const fullscreenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const blurFragment = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec2 uTexel;
  uniform vec2 uDirection;
  varying vec2 vUv;

  void main() {
    // 9-tap gaussian, linear-sampled to 5 fetches
    vec2 off1 = vec2(1.3846153846) * uDirection * uTexel;
    vec2 off2 = vec2(3.2307692308) * uDirection * uTexel;

    vec4 col = texture2D(tDiffuse, vUv) * 0.2270270270;
    col += texture2D(tDiffuse, vUv + off1) * 0.3162162162;
    col += texture2D(tDiffuse, vUv - off1) * 0.3162162162;
    col += texture2D(tDiffuse, vUv + off2) * 0.0702702703;
    col += texture2D(tDiffuse, vUv - off2) * 0.0702702703;
    gl_FragColor = col;
  }
`;

export const compositeFragment = /* glsl */ `
  uniform sampler2D tScene;
  uniform sampler2D tBlur;
  uniform sampler2D tDepth;

  uniform float uTime;
  uniform float uNear;
  uniform float uFar;
  uniform float uFocusDistance;
  uniform float uFocusRange;
  uniform float uDofStrength;
  uniform float uBloomThreshold;
  uniform float uBloomStrength;
  uniform float uAberration;
  uniform float uVignette;
  uniform float uGrain;
  uniform vec3  uGround;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float viewZFromDepth(float depth) {
    float ndc = depth * 2.0 - 1.0;
    return (2.0 * uNear * uFar) / (uFar + uNear - ndc * (uFar - uNear));
  }

  void main() {
    vec2 uv = vUv;
    vec2 centred = uv - 0.5;
    float r = length(centred);

    // Chromatic aberration grows toward the edges of the frame.
    vec2 shift = centred * uAberration * r;
    vec3 sharp = vec3(
      texture2D(tScene, uv + shift).r,
      texture2D(tScene, uv).g,
      texture2D(tScene, uv - shift).b
    );

    vec3 blurred = texture2D(tBlur, uv).rgb;

    // ---- depth of field ----
    float depth = texture2D(tDepth, uv).r;
    float viewZ = viewZFromDepth(depth);
    float coc = clamp(abs(viewZ - uFocusDistance) / max(uFocusRange, 0.001), 0.0, 1.0);
    coc = smoothstep(0.0, 1.0, coc) * uDofStrength;

    vec3 col = mix(sharp, blurred, coc);

    // ---- bloom, from the same blurred buffer ----
    vec3 bright = max(blurred - uBloomThreshold, 0.0);
    col += bright * uBloomStrength;

    // ---- vignette toward the current ground colour ----
    float vig = smoothstep(0.42, 1.05, r) * uVignette;
    col = mix(col, uGround, vig);

    // ---- grain ----
    float g = hash(uv * 900.0 + fract(uTime) * 91.0) - 0.5;
    col += g * uGrain;

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;
