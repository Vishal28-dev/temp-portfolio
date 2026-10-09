import { useEffect, useState } from 'react';
import { descent, subscribeDescent } from '../../lib/descent.js';
import { STRATA } from '../../lib/strata.js';

const TARGETS = [
  { id: 'ingress', label: 'Top' },
  { id: 'l01', label: 'Stack' },
  { id: 'core', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

export default function Nav({ initials = 'V' }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeDescent((d) => setIndex(d.index)), []);

  useEffect(() => {
    document.body.classList.toggle('is-locked', open);
    return () => document.body.classList.remove('is-locked');
  }, [open]);

  const go = (event, id) => {
    event.preventDefault();
    setOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const stratum = STRATA[Math.min(index, STRATA.length - 1)] ?? STRATA[0];

  return (
    <>
      <nav className="nav" aria-label="Primary">
        <a className="nav__mark" href="#ingress" onClick={(e) => go(e, 'ingress')} aria-label="Back to top">
          {initials}
        </a>

        <ul className="nav__links">
          {TARGETS.map((t) => (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                onClick={(e) => go(e, t.id)}
                className={stratum.id === t.id ? 'is-here' : undefined}
              >
                &lt;/{t.label}&gt;
              </a>
            </li>
          ))}
        </ul>

        <a className="nav__cta" href="#contact" onClick={(e) => go(e, 'contact')}>
          <span className="nav__dot" aria-hidden="true" />
          GetinTouch();
        </a>

        <button
          type="button"
          className={`nav__burger${open ? ' is-open' : ''}`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <span /><span /><span />
        </button>
      </nav>

      <div id="mobile-menu" className={`mobile-menu${open ? ' is-open' : ''}`} hidden={!open}>
        <ul>
          {TARGETS.map((t) => (
            <li key={t.id}>
              <a href={`#${t.id}`} onClick={(e) => go(e, t.id)}>&lt;/{t.label}&gt;</a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
