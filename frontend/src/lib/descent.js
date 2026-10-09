/**
 * Shared descent state. Scroll runs at 60fps, so the canvas reads these
 * values directly from a mutable object inside its own RAF loop — putting
 * them in React state would re-render the tree every frame.
 * Components that need coarse updates subscribe and are notified only when
 * the active stratum changes.
 */
import { STRATA } from './strata.js';

export const descent = {
  progress: 0,     // 0..1 across the whole page
  phase: 0,        // 0..STRATA.length-1, fractional
  index: 0,        // active stratum index (integer)
  depth: 0,        // metres, for the readout
  pointerX: 0,
  pointerY: 0,
  quality: 'high',
  reducedMotion: false,
};

const listeners = new Set();

export const subscribeDescent = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

let lastIndex = -1;
export function setPhase(phase, progress) {
  descent.phase = phase;
  descent.progress = progress;

  const index = Math.round(phase);
  const a = STRATA[Math.floor(phase)] ?? STRATA[0];
  const b = STRATA[Math.min(Math.floor(phase) + 1, STRATA.length - 1)] ?? a;
  const t = phase - Math.floor(phase);
  descent.depth = Math.round(a.depth + (b.depth - a.depth) * t);
  descent.index = index;

  if (index !== lastIndex) {
    lastIndex = index;
    listeners.forEach((fn) => fn(descent));
  }
}

export function setQuality(q) {
  descent.quality = q;
  listeners.forEach((fn) => fn(descent));
}
