export default function Core({ profile, experiences = [] }) {
  const avatar = profile?.avatar?.url;
  const paragraphs = (profile?.bio?.long ?? '').split('\n').filter(Boolean);

  const fmt = (value) =>
    value ? new Date(value).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Present';

  return (
    <section className="core" id="core" aria-labelledby="core-title">
      <div className="shell core__inner">
        <div className="stratum__head reveal">
          <div className="stratum__meta">
            <span className="stratum__code mono">Core</span>
            <span className="stratum__depth mono tnum">260 m</span>
          </div>
          <h2 className="stratum__title" id="core-title">Who I am</h2>
        </div>

        <div className="core__grid">
          <div className="core__bio reveal">
            {paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}

            {profile?.quote && <blockquote className="core__quote">“{profile.quote}”</blockquote>}

            <dl className="core__facts mono">
              {profile?.location && (
                <div><dt>Based</dt><dd>{profile.location}</dd></div>
              )}
              {profile?.availability?.openTo?.length > 0 && (
                <div><dt>Open to</dt><dd>{profile.availability.openTo.join(', ')}</dd></div>
              )}
              {profile?.resume?.url && (
                <div>
                  <dt>Résumé</dt>
                  <dd><a href={profile.resume.url} target="_blank" rel="noopener noreferrer">Download</a></dd>
                </div>
              )}
            </dl>
          </div>

          {avatar && (
            <figure className="core__portrait reveal">
              <img
                src={avatar}
                alt={profile?.avatar?.alt || profile?.name || 'Portrait'}
                width={profile?.avatar?.width || 1200}
                height={profile?.avatar?.height || 1600}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="mono">{profile?.name}</figcaption>
            </figure>
          )}
        </div>

        {experiences.length > 0 && (
          <ol className="timeline reveal">
            {experiences.map((item) => (
              <li key={item.id} className="timeline__row">
                <span className="timeline__when mono tnum">
                  {fmt(item.startDate)} — {item.current ? 'Present' : fmt(item.endDate)}
                </span>
                <div className="timeline__what">
                  <h3>{item.role}</h3>
                  <p className="timeline__org">{item.org}{item.location ? ` · ${item.location}` : ''}</p>
                  {item.summary && <p className="timeline__summary">{item.summary}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
