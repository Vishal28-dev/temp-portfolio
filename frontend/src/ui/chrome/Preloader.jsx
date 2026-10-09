import { useEffect, useRef, useState } from 'react';

export default function Preloader({ onDone, name = 'Vishal' }) {
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 220 : 1400;
    const start = performance.now();
    let raf = 0;

    const step = (now) => {
      const k = Math.min((now - start) / duration, 1);
      setPct(Math.round((1 - (1 - k) ** 3) * 100));
      if (k < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setGone(true);
        setTimeout(() => doneRef.current?.(), reduced ? 0 : 900);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`preloader${gone ? ' is-gone' : ''}`} aria-hidden="true">
      <div className="preloader__inner">
        <span className="preloader__name">{name}</span>
        <span className="preloader__pct mono tnum">{String(pct).padStart(3, '0')}</span>
      </div>
      <div className="preloader__bar">
        <i style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
