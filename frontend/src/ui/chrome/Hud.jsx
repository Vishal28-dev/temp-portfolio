import { useEffect, useState } from 'react';
import { descent, subscribeDescent, setQuality } from '../../lib/descent.js';
import { STRATA } from '../../lib/strata.js';

/**
 * The instrument frame. Depth and stratum are real values read from the
 * descent store, not decoration.
 */
export default function Hud() {
  const [state, setState] = useState({ index: 0, depth: 0, quality: descent.quality });

  useEffect(() => {
    const update = (d) => setState({ index: d.index, depth: d.depth, quality: d.quality });
    update(descent);
    return subscribeDescent(update);
  }, []);

  // Depth changes continuously; poll it gently rather than every frame.
  const [depth, setDepth] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDepth(descent.depth), 120);
    return () => clearInterval(id);
  }, []);

  const stratum = STRATA[Math.min(state.index, STRATA.length - 1)] ?? STRATA[0];

  const cycleQuality = () => {
    const order = ['high', 'medium', 'low'];
    const next = order[(order.indexOf(descent.quality) + 1) % order.length];
    setQuality(next);
    window.dispatchEvent(new CustomEvent('descent:quality', { detail: next }));
  };

  return (
    <div className="hud" aria-hidden="true">
      <span className="hud__rule hud__rule--t" />
      <span className="hud__rule hud__rule--b" />
      <span className="hud__rule hud__rule--l" />
      <span className="hud__rule hud__rule--r" />

      <span className="hud__tick hud__tick--bl mono tnum">
        {stratum.code === '—' ? 'Surface' : `${stratum.code} · ${stratum.name}`} — {depth} m
      </span>
      <span className="hud__tick hud__tick--br mono">
        Render
        <button type="button" className="hud__quality" onClick={cycleQuality} aria-hidden="true" tabIndex={-1}>
          {state.quality}
        </button>
      </span>
    </div>
  );
}
