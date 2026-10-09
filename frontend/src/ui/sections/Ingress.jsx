import { useEffect, useRef } from 'react';

function Split({ text, delay = 0 }) {
  return (
    <span className="split">
      {text.split('').map((ch, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <span key={`${ch}-${i}`} className="split__ch" style={{ transitionDelay: `${delay + i * 0.028}s` }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}

export default function Ingress({ profile, ready }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (ready) rootRef.current?.classList.add('is-live');
  }, [ready]);

  const name = profile?.name ?? 'Vishal';
  const headline = profile?.headline ?? 'Full-stack developer';
  const short = profile?.bio?.short ?? '';
  const available = profile?.availability?.status === 'open';

  return (
    <header className="ingress" id="ingress" ref={rootRef}>
      <div className="shell ingress__inner">
        <p className="eyebrow ingress__eyebrow">
          {headline} — React &rarr; Node &rarr; Mongo
        </p>

        <h1 className="ingress__title">
          <span className="ingress__line ingress__line--fn">
            <Split text="Hello();" delay={0.1} />
          </span>
          <span className="ingress__line">
            <Split text="I'm " delay={0.42} />
            <span className="ingress__accent">
              <Split text={name} delay={0.5} />
            </span>
          </span>
        </h1>

        {short && <p className="ingress__copy">{short}</p>}

        <div className="ingress__actions">
          <a className="btn" href="#contact">
            <span>Let&apos;s talk</span>
          </a>
          <a className="btn btn--ghost" href="#l01">
            <span>Begin the descent</span>
          </a>
        </div>

        {available && (
          <p className="ingress__status mono">
            <span className="status-dot" aria-hidden="true" />
            {profile?.availability?.note || 'Available for work'}
          </p>
        )}
      </div>

      <div className="ingress__cue mono" aria-hidden="true">
        <span>Scroll</span>
        <span className="ingress__cue-line" />
        <span>240 m</span>
      </div>
    </header>
  );
}
