import ProjectCard from './ProjectCard.jsx';

export default function Stratum({ stratum, blurb, skills = [], projects = [] }) {
  return (
    <section className="stratum" id={stratum.id} aria-labelledby={`${stratum.id}-title`}>
      <div className="shell stratum__inner">
        <div className="stratum__head reveal">
          <div className="stratum__meta">
            <span className="stratum__code mono">{stratum.code}</span>
            <span className="stratum__depth mono tnum">{stratum.depth} m</span>
          </div>
          <h2 className="stratum__title" id={`${stratum.id}-title`}>{stratum.name}</h2>
        </div>

        {blurb && <p className="stratum__blurb reveal">{blurb}</p>}

        {skills.length > 0 && (
          <ul className="stratum__skills reveal">
            {skills.map((skill) => (
              <li key={skill.id ?? skill.slug} className="chip">
                <span className="chip__name">{skill.name}</span>
                <span className="chip__meter" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <i key={n} className={n <= (skill.proficiency ?? 0) ? 'is-on' : undefined} />
                  ))}
                </span>
                <span className="sr-only">
                  proficiency {skill.proficiency ?? 0} out of 5
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="stratum__artifacts">
          {projects.length > 0 ? (
            <div className="stratum__grid">
              {projects.map((project) => (
                <ProjectCard key={project.id ?? project.slug} project={project} />
              ))}
            </div>
          ) : (
            <p className="stratum__empty mono reveal">
              <span aria-hidden="true">[ </span>
              No work recorded at this depth yet
              <span aria-hidden="true"> ]</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
