import * as THREE from 'three';
import { fullscreenVertex, blurFragment, compositeFragment } from '../materials/postShader.js';

/**
 * A hand-rolled composer. Deliberately not three's EffectComposer — this
 * needs exactly three passes and full control over how the blur buffer is
 * reused, and it keeps the addon surface out of the bundle.
 */
export class Post {
  constructor(renderer, { blurScale = 0.5 } = {}) {
    this.renderer = renderer;
    this.blurScale = blurScale;
    this.enabled = true;

    const rtOpts = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: true,
      stencilBuffer: false,
    };

    this.sceneTarget = new THREE.WebGLRenderTarget(1, 1, rtOpts);
    this.sceneTarget.depthTexture = new THREE.DepthTexture(1, 1);
    this.sceneTarget.depthTexture.format = THREE.DepthFormat;
    this.sceneTarget.depthTexture.type = THREE.UnsignedIntType;

    this.blurA = new THREE.WebGLRenderTarget(1, 1, { ...rtOpts, depthBuffer: false });
    this.blurB = new THREE.WebGLRenderTarget(1, 1, { ...rtOpts, depthBuffer: false });

    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadGeometry = new THREE.PlaneGeometry(2, 2);

    this.blurMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: blurFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tDiffuse: { value: null },
        uTexel: { value: new THREE.Vector2() },
        uDirection: { value: new THREE.Vector2(1, 0) },
      },
    });

    this.compositeMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: compositeFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tScene: { value: this.sceneTarget.texture },
        tBlur: { value: this.blurB.texture },
        tDepth: { value: this.sceneTarget.depthTexture },
        uTime: { value: 0 },
        uNear: { value: 0.1 },
        uFar: { value: 200 },
        uFocusDistance: { value: 6 },
        uFocusRange: { value: 5.5 },
        uDofStrength: { value: 0.72 },
        uBloomThreshold: { value: 0.5 },
        uBloomStrength: { value: 0.55 },
        uAberration: { value: 0.0045 },
        uVignette: { value: 0.72 },
        uGrain: { value: 0.035 },
        uGround: { value: new THREE.Color('#080b0e') },
      },
    });

    this.blurQuad = new THREE.Mesh(this.quadGeometry, this.blurMaterial);
    this.compositeQuad = new THREE.Mesh(this.quadGeometry, this.compositeMaterial);
    this.blurQuad.frustumCulled = false;
    this.compositeQuad.frustumCulled = false;

    this.blurScene = new THREE.Scene().add(this.blurQuad);
    this.compositeScene = new THREE.Scene().add(this.compositeQuad);
  }

  /** Takes the scene target's pixel dimensions directly — the caller decides
   *  how far below canvas resolution the 3D is rendered. */
  setSize(w, h) {
    this.sceneTarget.setSize(w, h);

    const bw = Math.max(1, Math.floor(w * this.blurScale));
    const bh = Math.max(1, Math.floor(h * this.blurScale));
    this.blurA.setSize(bw, bh);
    this.blurB.setSize(bw, bh);
    this.blurTexel = new THREE.Vector2(1 / bw, 1 / bh);
  }

  render(scene, camera, elapsed) {
    const { renderer } = this;

    if (!this.enabled) {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      return;
    }

    // 1 — scene into a target that also captures depth
    renderer.setRenderTarget(this.sceneTarget);
    renderer.clear();
    renderer.render(scene, camera);

    // 2 — horizontal blur
    this.blurMaterial.uniforms.tDiffuse.value = this.sceneTarget.texture;
    this.blurMaterial.uniforms.uTexel.value.copy(this.blurTexel);
    this.blurMaterial.uniforms.uDirection.value.set(1, 0);
    renderer.setRenderTarget(this.blurA);
    renderer.clear();
    renderer.render(this.blurScene, this.quadCamera);

    // 3 — vertical blur
    this.blurMaterial.uniforms.tDiffuse.value = this.blurA.texture;
    this.blurMaterial.uniforms.uDirection.value.set(0, 1);
    renderer.setRenderTarget(this.blurB);
    renderer.clear();
    renderer.render(this.blurScene, this.quadCamera);

    // 4 — composite to screen
    this.compositeMaterial.uniforms.uTime.value = elapsed;
    this.compositeMaterial.uniforms.uNear.value = camera.near;
    this.compositeMaterial.uniforms.uFar.value = camera.far;
    renderer.setRenderTarget(null);
    renderer.render(this.compositeScene, this.quadCamera);
  }

  dispose() {
    this.sceneTarget.depthTexture?.dispose();
    this.sceneTarget.dispose();
    this.blurA.dispose();
    this.blurB.dispose();
    this.quadGeometry.dispose();
    this.blurMaterial.dispose();
    this.compositeMaterial.dispose();
  }
}
