import { useEffect, useRef } from 'react';

export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia?.('(pointer: fine)').matches) return undefined;

    document.body.classList.add('has-cursor');

    const dot = dotRef.current;
    const ring = ringRef.current;
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (dot) dot.style.transform = `translate(${mx}px, ${my}px)`;
    };

    const loop = () => {
      rx += (mx - rx) * 0.17;
      ry += (my - ry) * 0.17;
      if (ring) ring.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };

    // Delegated so it also covers content that mounts after data loads.
    const onOver = (e) => {
      const interactive = e.target.closest?.('a, button, input, textarea, label, [data-cursor]');
      ring?.classList.toggle('is-active', Boolean(interactive));
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      document.body.classList.remove('has-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
