import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import ProjectForm from './ProjectForm.jsx';
import './admin.css';

const BLANK = {
  slug: '', title: '', tagline: '', summary: '', body: '',
  status: 'draft', featured: false, order: 0,
  layers: [], stack: [], tags: [],
  links: { live: '', repo: '', caseStudy: '' },
  media: { cover: { url: '', alt: '' } },
  role: '', client: '', year: new Date().getFullYear(),
};

function Login({ onIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api.login({ email, password });
      onIn(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-login">
      <form onSubmit={submit}>
        <h1>Admin</h1>
        <p className="adm-login__sub mono">Portfolio content</p>

        <label className="mono" htmlFor="adm-email">Email</label>
        <input id="adm-email" type="email" autoComplete="username"
               value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label className="mono" htmlFor="adm-pass">Password</label>
        <input id="adm-pass" type="password" autoComplete="current-password"
               value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="adm-err mono">{error}</p>}

        <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState('projects');

  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');

  const token = session?.accessToken;

  // The refresh cookie survives a reload; the access token does not.
  useEffect(() => {
    api.refresh()
      .then((data) => setSession(data))
      .catch(() => setSession(null))
      .finally(() => setChecking(false));
  }, []);

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      const [p, m] = await Promise.all([api.adminProjects(token), api.adminMessages(token)]);
      setProjects(p);
      setMessages(m);
    } catch (err) {
      setNotice(err.message);
    }
  }, [token]);

  useEffect(() => { reload(); }, [reload]);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3200);
  };

  const save = async (values) => {
    try {
      if (values.id) {
        const { id, ...patch } = values;
        await api.updateProject(id, patch, token);
        flash('Saved');
      } else {
        await api.createProject(values, token);
        flash('Project created');
      }
      setEditing(null);
      reload();
    } catch (err) {
      flash(err.details?.length ? `${err.message}: ${err.details.map((d) => d.field).join(', ')}` : err.message);
    }
  };

  const remove = async (project) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete “${project.title}”? This cannot be undone.`)) return;
    try {
      await api.deleteProject(project.id, token);
      flash('Deleted');
      reload();
    } catch (err) {
      flash(err.message);
    }
  };

  const signOut = async () => {
    try { await api.logout(token); } catch { /* already gone */ }
    setSession(null);
  };

  if (checking) return <div className="adm-boot mono">Checking session…</div>;
  if (!session) return <Login onIn={setSession} />;

  return (
    <div className="adm">
      <header className="adm__bar">
        <div>
          <strong>Portfolio admin</strong>
          <span className="mono adm__who">{session.user?.email}</span>
        </div>
        <nav className="adm__tabs">
          <button type="button" className={tab === 'projects' ? 'is-on' : ''} onClick={() => setTab('projects')}>
            Projects <span className="mono">{projects.length}</span>
          </button>
          <button type="button" className={tab === 'inbox' ? 'is-on' : ''} onClick={() => setTab('inbox')}>
            Inbox <span className="mono">{messages.filter((m) => m.status === 'new').length}</span>
          </button>
          <a href="/">View site</a>
          <button type="button" onClick={signOut}>Sign out</button>
        </nav>
      </header>

      {notice && <p className="adm__notice mono" role="status">{notice}</p>}

      <main className="adm__main">
        {tab === 'projects' && (
          <>
            <div className="adm__head">
              <h2>Projects</h2>
              <button type="button" className="adm__primary" onClick={() => setEditing({ ...BLANK })}>
                New project
              </button>
            </div>

            {editing && (
              <ProjectForm
                value={editing}
                onCancel={() => setEditing(null)}
                onSave={save}
              />
            )}

            {projects.length === 0 && !editing && (
              <p className="adm__empty mono">
                No projects yet. Add your first one — it appears on the site immediately.
              </p>
            )}

            <ul className="adm__list">
              {projects.map((p) => (
                <li key={p.id}>
                  <div>
                    <strong>{p.title}</strong>
                    <span className={`adm__pill adm__pill--${p.status}`}>{p.status}</span>
                    {p.featured && <span className="adm__pill">featured</span>}
                    <p className="mono adm__slug">/{p.slug} · {(p.layers ?? []).join(' ') || 'no layer'}</p>
                  </div>
                  <div className="adm__row-actions">
                    <button type="button" onClick={() => setEditing({ ...BLANK, ...p })}>Edit</button>
                    <button type="button" className="adm__danger" onClick={() => remove(p)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === 'inbox' && (
          <>
            <div className="adm__head"><h2>Inbox</h2></div>
            {messages.length === 0 && <p className="adm__empty mono">No messages yet.</p>}
            <ul className="adm__list adm__list--messages">
              {messages.map((m) => (
                <li key={m.id}>
                  <div>
                    <strong>{m.subject}</strong>
                    <span className={`adm__pill adm__pill--${m.status}`}>{m.status}</span>
                    <p className="mono adm__slug">
                      {m.name} · <a href={`mailto:${m.email}`}>{m.email}</a> ·{' '}
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                    <p className="adm__body">{m.body}</p>
                  </div>
                  <div className="adm__row-actions">
                    {m.status !== 'replied' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await api.setMessageStatus(m.id, 'replied', token);
                          reload();
                        }}
                      >
                        Mark replied
                      </button>
                    )}
                    <button
                      type="button"
                      className="adm__danger"
                      onClick={async () => {
                        await api.deleteMessage(m.id, token);
                        reload();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
