import * as THREE from 'three';
import { swarmVertex, swarmFragment, dustVertex, dustFragment } from '../materials/swarmShader.js';

export function createSwarm(count) {
  const seeds = new Float32Array(count * 3);
  const index = new Float32Array(count);
  // `position` is required by three but unused — every coordinate is derived
  // in the vertex shader, so the buffer stays at the origin.
  const position = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    seeds[i * 3] = Math.random();
    seeds[i * 3 + 1] = Math.random();
    seeds[i * 3 + 2] = Math.random();
    index[i] = i;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
  geometry.setAttribute('aIndex', new THREE.BufferAttribute(index, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: swarmVertex,
    fragmentShader: swarmFragment,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPhase: { value: 0 },
      uCount: { value: count },
      uSize: { value: 13 },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 1 },
      uSpread: { value: 1 },
      uPointer: { value: new THREE.Vector2() },
      uAccent: { value: new THREE.Color('#e8632a') },
      uAccentAlt: { value: new THREE.Color('#f2c14e') },
      uInk: { value: new THREE.Color('#ede9df') },
    },
  });

  const points = new THREE.Points(geometry, material);
  // Positions live in the shader, so the computed bounding sphere is a point.
  points.frustumCulled = false;
  points.renderOrder = 2;

  return { points, geometry, material };
}

export function createDust(count, { radius = 15, height = 150 } = {}) {
  const position = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    // sqrt keeps the column evenly dense instead of clustering at the axis
    const r = Math.sqrt(Math.random()) * radius;
    position[i * 3] = Math.cos(a) * r;
    position[i * 3 + 1] = (Math.random() - 0.5) * height;
    position[i * 3 + 2] = Math.sin(a) * r;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader: dustVertex,
    fragmentShader: dustFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uSize: { value: 26 },
      uPixelRatio: { value: 1 },
      uInk: { value: new THREE.Color('#b4bdbb') },
    },
  });

  const points = new THREE.Points(geometry, material);
  points.renderOrder = 1;

  return { points, geometry, material };
}
