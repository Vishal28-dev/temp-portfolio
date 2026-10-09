import * as THREE from 'three';
import { createSwarm, createDust } from './systems/Swarm.js';
import { Post } from './systems/Post.js';
import { TIERS, detectTier } from './systems/quality.js';
import { descent, setQuality } from '../lib/descent.js';
import { STRATA, paletteAt } from '../lib/strata.js';

const DUST_HEIGHT = 150;
const CAMERA_TRAVEL = 96; // world units descended across the whole page

export class Descent {
  constructor(canvas, { tier = detectTier() } = {}) {
    this.canvas = canvas;
    this.tier = tier;
    this.settings = TIERS[tier];
    this.running = false;
    this.disposed = false;

    this.clock = new THREE.Clock();
    this.smoothPhase = 0;
    this.smoothPointer = new THREE.Vector2();
    this.frameTimes = [];
    this.lastGovernorCheck = 0;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setClearColor(new THREE.Color('#080b0e'), 1);
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, this.settings.dpr);
    this.renderer.setPixelRatio(this.pixelRatio);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
    this.camera.position.set(0, 0, 5.4);

    this.swarmGroup = new THREE.Group();
    this.scene.add(this.swarmGroup);

    this.swarm = createSwarm(this.settings.points);
    this.swarmGroup.add(this.swarm.points);

    this.dust = createDust(this.settings.dust, { height: DUST_HEIGHT });
    this.scene.add(this.dust.points);

    this.post = new Post(this.renderer, { blurScale: this.settings.blurScale });
    this.post.enabled = this.settings.post;
    this.post.compositeMaterial.uniforms.uDofStrength.value = this.settings.dof;

    this.groundColor = new THREE.Color('#080b0e');
    this.additive = true;
    this.swarmOffsetX = 1.65;

    this.onResize = this.onResize.bind(this);
    this.tick = this.tick.bind(this);

    window.addEventListener('resize', this.onResize);
    this.onResize();
  }

  onResize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    this.pixelRatio = Math.min(window.devicePixelRatio || 1, this.settings.dpr);

    // Canvas backing store at full device ratio so the composite stays crisp…
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;

    // Keep the swarm fully in frame on narrow viewports.
    const narrow = width < 900;
    this.swarm.material.uniforms.uSpread.value = narrow ? 0.7 : 1;
    this.camera.fov = narrow ? 58 : 46;
    // Body copy occupies the left column, so the swarm sits right of centre.
    this.swarmOffsetX = narrow ? 0 : 1.65;
    this.camera.updateProjectionMatrix();

    this.swarm.material.uniforms.uPixelRatio.value = this.pixelRatio;
    this.dust.material.uniforms.uPixelRatio.value = this.pixelRatio;

    // …while the 3D itself renders below that and is upscaled on composite.
    const scale = this.pixelRatio * this.settings.renderScale;
    this.post.setSize(
      Math.max(1, Math.round(width * scale)),
      Math.max(1, Math.round(height * scale))
    );
  }

  setTier(tier) {
    if (tier === this.tier || !TIERS[tier]) return;

    this.tier = tier;
    this.settings = TIERS[tier];

    this.swarmGroup.remove(this.swarm.points);
    this.swarm.geometry.dispose();
    this.swarm.material.dispose();

    this.swarm = createSwarm(this.settings.points);
    this.swarm.material.blending = this.additive
      ? THREE.AdditiveBlending
      : THREE.NormalBlending;
    this.swarmGroup.add(this.swarm.points);

    this.post.enabled = this.settings.post;
    this.post.blurScale = this.settings.blurScale;
    this.post.compositeMaterial.uniforms.uDofStrength.value = this.settings.dof;

    this.onResize();
    setQuality(tier);
  }

  /** Drops a tier when the frame budget is consistently missed. */
  governor(now, delta) {
    this.frameTimes.push(delta);
    if (this.frameTimes.length > 70) this.frameTimes.shift();
    if (now - this.lastGovernorCheck < 1500 || this.frameTimes.length < 45) return;

    this.lastGovernorCheck = now;
    const mean = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const fps = 1 / mean;

    // 50, not 42: anything under this reads as stutter rather than "slow".
    if (fps < 50) {
      if (this.tier === 'high') this.setTier('medium');
      else if (this.tier === 'medium') this.setTier('low');
      this.frameTimes.length = 0;
    }
  }

  tick() {
    if (!this.running || this.disposed) return;
    this.rafId = requestAnimationFrame(this.tick);

    const delta = Math.min(this.clock.getDelta(), 0.06);
    const elapsed = this.clock.elapsedTime;
    const now = performance.now();

    const reduced = descent.reducedMotion;
    const lerp = reduced ? 1 : 1 - Math.exp(-delta * 3.4);

    // ---- phase: hold, cross, hold (same band as the palette) ----
    const rawPhase = Math.max(0, Math.min(descent.phase, STRATA.length - 1));
    const fi = Math.floor(rawPhase);
    const ff = rawPhase - fi;
    const k = Math.max(0, Math.min((ff - 0.38) / 0.24, 1));
    const targetPhase = fi + k * k * k * (k * (k * 6 - 15) + 10);

    this.smoothPhase += (targetPhase - this.smoothPhase) * lerp;
    // Snap when settled so fract() hits exactly zero and the shader's
    // resting-state branch actually engages.
    if (Math.abs(targetPhase - this.smoothPhase) < 0.0015) {
      this.smoothPhase = targetPhase;
    }
    this.smoothPointer.x += (descent.pointerX - this.smoothPointer.x) * lerp * 0.8;
    this.smoothPointer.y += (descent.pointerY - this.smoothPointer.y) * lerp * 0.8;

    const u = this.swarm.material.uniforms;
    u.uTime.value = reduced ? 6 : elapsed;
    u.uPhase.value = this.smoothPhase;
    u.uPointer.value.set(this.smoothPointer.x * 0.34, -this.smoothPointer.y * 0.24);

    // ---- palette: swarm, dust and vignette follow the strata ----
    const palette = paletteAt(this.smoothPhase);
    const stratum = STRATA[Math.min(Math.round(this.smoothPhase), STRATA.length - 1)];
    u.uAccent.value.set(palette.accent);
    u.uAccentAlt.value.set(stratum.code === 'L04' || stratum.code === 'L05' ? '#f2c14e' : '#e8632a');
    u.uInk.value.set(palette.ink);

    this.groundColor.setRGB(
      palette.groundRgb[0] / 255,
      palette.groundRgb[1] / 255,
      palette.groundRgb[2] / 255
    );
    this.renderer.setClearColor(this.groundColor, 1);
    this.post.compositeMaterial.uniforms.uGround.value.copy(this.groundColor);

    // Additive light cannot darken a pale ground, so on the bone strata the
    // swarm switches to normal blending and paints dark specks instead.
    const lightness = (palette.groundRgb[0] + palette.groundRgb[1] + palette.groundRgb[2]) / 765;
    const wantAdditive = lightness < 0.45;
    if (wantAdditive !== this.additive) {
      this.additive = wantAdditive;
      this.swarm.material.blending = wantAdditive
        ? THREE.AdditiveBlending
        : THREE.NormalBlending;
      this.swarm.material.needsUpdate = true;
      this.dust.material.blending = this.swarm.material.blending;
      this.dust.material.needsUpdate = true;
    }
    u.uOpacity.value = wantAdditive ? 1 : 0.42;
    this.dust.material.uniforms.uInk.value.set(wantAdditive ? palette.ink : palette.inkDim);
    this.post.compositeMaterial.uniforms.uBloomStrength.value = wantAdditive ? 0.55 : 0.06;
    this.post.compositeMaterial.uniforms.uVignette.value = 0.72 - lightness * 0.34;

    // ---- camera descends through the static dust column ----
    const travel = descent.progress * CAMERA_TRAVEL;
    const targetY = -travel;
    this.camera.position.y += (targetY - this.camera.position.y) * (reduced ? 1 : lerp);
    this.swarmGroup.position.y = this.camera.position.y;
    this.swarmGroup.position.x +=
      (this.swarmOffsetX - this.swarmGroup.position.x) * (reduced ? 1 : lerp);

    if (!reduced) {
      const orbit = elapsed * 0.045 + this.smoothPointer.x * 0.28;
      this.camera.position.x = Math.sin(orbit) * 0.85;
      this.camera.position.z = 5.4 + Math.cos(orbit) * 0.4;
    }
    this.camera.lookAt(0, this.camera.position.y + this.smoothPointer.y * 0.18, 0);

    // Focus follows the swarm; everything above and below falls off.
    this.post.compositeMaterial.uniforms.uFocusDistance.value = this.camera.position.z;

    this.post.render(this.scene, this.camera, elapsed);
    if (!reduced) this.governor(now, delta);
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.clock.start();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  dispose() {
    this.disposed = true;
    this.stop();
    window.removeEventListener('resize', this.onResize);

    this.swarm.geometry.dispose();
    this.swarm.material.dispose();
    this.dust.geometry.dispose();
    this.dust.material.dispose();
    this.post.dispose();
    this.renderer.dispose();
  }
}
