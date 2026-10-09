import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import SceneCanvas from './scene/SceneCanvas.jsx';
import Preloader from './ui/chrome/Preloader.jsx';
import Cursor from './ui/chrome/Cursor.jsx';
import Hud from './ui/chrome/Hud.jsx';
import Nav from './ui/chrome/Nav.jsx';

import Ingress from './ui/sections/Ingress.jsx';
import Stratum from './ui/sections/Stratum.jsx';
import Core from './ui/sections/Core.jsx';
import Contact from './ui/sections/Contact.jsx';
import Footer from './ui/sections/Footer.jsx';

import { api } from './lib/api.js';
import { useApi } from './hooks/useApi.js';
import { useReveal } from './hooks/useReveal.js';
import { useReducedMotion } from './hooks/useReducedMotion.js';
import { useDescentScroll } from './hooks/useDescentScroll.js';
import { STRATA, LAYER_STRATA } from './lib/strata.js';

import './styles/base.css';
import './ui/ui.css';

const Admin = lazy(() => import('./admin/Admin.jsx'));

const SECTION_IDS = STRATA.map((s) => s.id);

function Portfolio() {
  const [booted, setBooted] = useState(false);
  useReducedMotion();

  const { data: profile } = useApi(({ signal }) => api.getProfile({ signal }), []);
  const { data: layers } = useApi(({ signal }) => api.getSkills({ signal }), [], { initial: [] });
  const { data: projects } = useApi(({ signal }) => api.getProjects({ signal }), [], { initial: [] });
  const { data: experiences } = useApi(({ signal }) => api.getExperiences({ signal }), [], { initial: [] });
  const { data: meta } = useApi(({ signal }) => api.getMeta({ signal }), []);

  useDescentScroll(SECTION_IDS);
  useReveal([profile, layers, projects, experiences]);

  useEffect(() => {
    api.recordView({
      path: window.location.pathname,
      referrer: document.referrer || '',
      device: window.matchMedia('(pointer: coarse)').matches
        ? (window.innerWidth < 700 ? 'mobile' : 'tablet')
        : 'desktop',
    });
  }, []);

  useEffect(() => {
    if (profile?.seo?.title) document.title = profile.seo.title;
  }, [profile]);

  // Layer name, depth and copy all come from the API alongside the skills.
  const layerData = useMemo(() => {
    const map = {};
    (layers ?? []).forEach((group) => {
      map[group.layer] = { skills: group.skills ?? [], blurb: group.blurb, name: group.name };
    });
    return map;
  }, [layers]);

  const projectsByLayer = useMemo(() => {
    const map = {};
    LAYER_STRATA.forEach((s) => {
      map[s.code] = (projects ?? []).filter((p) => (p.layers ?? []).includes(s.code));
    });
    // A project with no layer tag still deserves to be seen — surface it at L01.
    const untagged = (projects ?? []).filter((p) => !(p.layers ?? []).length);
    map.L01 = [...(map.L01 ?? []), ...untagged];
    return map;
  }, [projects]);

  return (
    <>
      {!booted && <Preloader onDone={() => setBooted(true)} name={profile?.name ?? 'Vishal'} />}

      <SceneCanvas />
      <Cursor />
      <Hud />

      <a className="skip-link" href="#l01">Skip to content</a>

      <Nav initials={profile?.initials ?? 'V'} />

      <main id="main" className={booted ? 'is-ready' : undefined}>
        <Ingress profile={profile} ready={booted} />

        {LAYER_STRATA.map((stratum) => (
          <Stratum
            key={stratum.id}
            stratum={stratum}
            blurb={layerData[stratum.code]?.blurb}
            skills={layerData[stratum.code]?.skills ?? []}
            projects={projectsByLayer[stratum.code] ?? []}
          />
        ))}

        <Core profile={profile} experiences={experiences ?? []} />
        <Contact profile={profile} />
      </main>

      <Footer profile={profile} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="admin-boot mono">Loading…</div>}>
              <Admin />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
