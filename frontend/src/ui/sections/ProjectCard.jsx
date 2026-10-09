import { useRef } from 'react';

export default function ProjectCard({ project }) {
  const cardRef = useRef(null);

  const onMove = (e) => {
    const card = cardRef.current;
    if (!card || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    card.style.transform =
      `perspective(1000px) rotateY(${(px - 0.5) * 9}deg) rotateX(${(0.5 - py) * 9}deg) translateY(-4px)`;
    card.style.setProperty('--gx', `${px * 100}%`);
    card.style.setProperty('--gy', `${py * 100}%`);
  };

  const onLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = 'transform 800ms var(--ease)';
    card.style.transform = '';
    setTimeout(() => {
      if (card) card.style.transition = '';
    }, 820);
  };

  const cover = project.media?.cover?.url;
  const live = project.links?.live || project.links?.caseStudy;
  const repo = project.links?.repo;
  // Without a live URL the repo IS the primary action — showing it twice as
  // both "Source" and "View" pointed two links at the same place.
  const primary = live || repo;
  const showSource = Boolean(repo) && Boolean(live);

  return (
    <article
      className="card reveal"
      ref={cardRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="card__glow" aria-hidden="true" />
      <div className="card__body">
        <div className="card__vis" aria-hidden="true">
          {cover ? (
            <img src={cover} alt="" loading="lazy" decoding="async" />
          ) : (
            <span className="card__orb" />
          )}
        </div>

        <div className="card__meta mono">
          <span>{project.year ?? ''}</span>
          <span>{(project.layers ?? []).join(' · ')}</span>
        </div>

        <h3 className="card__title">{project.title}</h3>
        {project.summary && <p className="card__summary">{project.summary}</p>}

        {(project.stack ?? []).length > 0 && (
          <ul className="card__stack">
            {project.stack.map((s) => (
              <li key={s.name} className="mono">{s.name}</li>
            ))}
          </ul>
        )}

        <div className="card__foot">
          {showSource && (
            <a className="card__link mono" href={repo} target="_blank" rel="noopener noreferrer">
              Source
            </a>
          )}
          {primary && (
            <a className="card__link card__link--primary mono" href={primary} target="_blank" rel="noopener noreferrer">
              {live ? 'Live view' : 'View source'}
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <path d="M1 5h13" /><path d="M10 1l4 4-4 4" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
