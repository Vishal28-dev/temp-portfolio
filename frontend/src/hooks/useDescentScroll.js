import { useEffect } from 'react';
import { setPhase } from '../lib/descent.js';
import { STRATA, paletteAt } from '../lib/strata.js';

/**
 * Turns scroll position into a fractional stratum index.
 *
 * Section heights are not uniform, so the phase is derived from where the
 * viewport's focal line sits between the registered section anchors rather
 * than from raw scroll percentage.
 */
export function useDescentScroll(sectionIds) {
  useEffect(() => {
    let frame = 0;
    let lenis = null;
    let disposed = false;

    const root = document.documentElement;

    // The palette holds steady across each stratum and only moves inside the
    // crossover band, so most frames would rewrite identical values. Writing a
    // custom property invalidates every element that reads it, so skip the
    // no-ops: during a hold this drops to zero style invalidations per frame.
    const applied = {};
    const setVar = (name, value) => {
      if (applied[name] === value) return;
      applied[name] = value;
      root.style.setProperty(name, value);
    };

    const applyPalette = (phase) => {
      const p = paletteAt(phase);
      setVar('--ground', p.ground);
      setVar('--ink', p.ink);
      setVar('--ink-dim', p.inkDim);
      setVar('--accent', p.accent);
      setVar('--rule', p.rule);
    };

    // Anchored on section centres, not tops: a section is "reached" when it is
    // centred in the viewport, so resting at scrollY 0 is exactly phase 0
    // rather than already part-way into the next stratum.
    const measure = () =>
      sectionIds
        .map((id) => document.getElementById(id))
        .map((el) => {
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return rect.top + window.scrollY + rect.height / 2;
        });

    let anchors = measure();

    const compute = () => {
      const focal = window.scrollY + window.innerHeight / 2;

      let phase = 0;
      const valid = anchors.map((a, i) => [a, i]).filter(([a]) => a !== null);

      if (valid.length >= 2) {
        if (focal <= valid[0][0]) {
          phase = valid[0][1];
        } else if (focal >= valid[valid.length - 1][0]) {
          phase = valid[valid.length - 1][1];
        } else {
          for (let i = 0; i < valid.length - 1; i += 1) {
            const [top, idx] = valid[i];
            const [nextTop, nextIdx] = valid[i + 1];
            if (focal >= top && focal < nextTop) {
              const t = (focal - top) / Math.max(nextTop - top, 1);
              phase = idx + t * (nextIdx - idx);
              break;
            }
          }
        }
      }

      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);

      const clamped = Math.min(Math.max(phase, 0), STRATA.length - 1);
      setPhase(clamped, progress);
      applyPalette(clamped);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        compute();
      });
    };

    const onResize = () => {
      anchors = measure();
      compute();
    };

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Lenis is optional — without it the page still works on native scroll.
    if (!reduced) {
      import('lenis')
        .then(({ default: Lenis }) => {
          if (disposed) return;
          lenis = new Lenis({ lerp: 0.13, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.5 });
          const raf = (time) => {
            if (disposed) return;
            lenis.raf(time);
            requestAnimationFrame(raf);
          };
          requestAnimationFrame(raf);
          lenis.on('scroll', onScroll);
        })
        .catch(() => {
          /* native scroll is a fine fallback */
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // Sections grow as API data lands, so anchors must be re-measured — but
    // observing the document is far cheaper than polling layout on a timer.
    let ro = null;
    if ('ResizeObserver' in window) {
      let queued = 0;
      ro = new ResizeObserver(() => {
        if (queued) return;
        queued = requestAnimationFrame(() => {
          queued = 0;
          onResize();
        });
      });
      ro.observe(document.body);
    }

    onResize();

    return () => {
      disposed = true;
      ro?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      lenis?.destroy();
    };
  }, [sectionIds]);
}
