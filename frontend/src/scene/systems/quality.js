/**
 * `dpr` sizes the canvas (so the composited image is crisp).
 * `renderScale` sizes the 3D render target *below* that — a particle field
 * carries almost no high-frequency detail, so rendering it at 80% and
 * compositing to full resolution is free visually and ~35% cheaper in pixels.
 */
export const TIERS = {
  high:   { points: 90000, dust: 14000, dpr: 1.75, renderScale: 0.8,  blurScale: 0.45, post: true,  dof: 0.5 },
  medium: { points: 52000, dust: 9000,  dpr: 1.4,  renderScale: 0.72, blurScale: 0.4,  post: true,  dof: 0.34 },
  low:    { points: 24000, dust: 5000,  dpr: 1,    renderScale: 0.65, blurScale: 0.4,  post: false, dof: 0 },
};

/** First guess from what the device tells us; the FPS governor corrects it. */
export function detectTier() {
  if (typeof navigator === 'undefined') return 'medium';

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = navigator.deviceMemory ?? 4;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const narrow = window.innerWidth < 760;

  if (coarse || narrow || cores <= 4 || memory <= 4) return 'low';
  if (cores <= 8 || memory <= 8) return 'medium';
  return 'high';
}
