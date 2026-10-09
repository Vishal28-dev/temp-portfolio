import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';

const EMPTY = { name: '', email: '', subject: '', message: '', website: '' };

export default function Contact({ profile }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [notice, setNotice] = useState('');
  const openedAt = useRef(Date.now());

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const validate = () => {
    const next = {};
    if (values.name.trim().length < 2) next.name = 'Tell me your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'That email address looks off';
    if (values.message.trim().length < 10) next.message = 'A little more detail, please';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;
    if (!validate()) return;

    setStatus('sending');
    setNotice('');

    try {
      const res = await api.sendContact({
        ...values,
        elapsedMs: Date.now() - openedAt.current,
      });
      setStatus('sent');
      setNotice(res?.message ?? "Thanks — that's landed.");
      setValues(EMPTY);
    } catch (err) {
      setStatus('error');
      if (err.details?.length) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
        setNotice('Some fields need fixing.');
      } else {
        setNotice(err.message || "That didn't send. Try again in a moment.");
      }
    }
  };

  const socials = profile?.socials ?? [];

  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <div className="shell contact__inner">
        <div className="stratum__head reveal">
          <div className="stratum__meta">
            <span className="stratum__code mono">Ascent</span>
            <span className="stratum__depth mono">Back to the surface</span>
          </div>
          <h2 className="stratum__title stratum__title--code" id="contact-title">GetinTouch();</h2>
        </div>

        <div className="contact__grid">
          <form className="contact__form reveal" onSubmit={onSubmit} noValidate>
            {/* Honeypot — hidden from people, irresistible to bots. */}
            <div className="hp" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={values.website}
                onChange={set('website')}
              />
            </div>

            <div className="field">
              <label htmlFor="name" className="mono">Name</label>
              <input
                id="name" name="name" type="text" autoComplete="name"
                value={values.name} onChange={set('name')}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'name-err' : undefined}
              />
              {errors.name && <p className="field__err mono" id="name-err">{errors.name}</p>}
            </div>

            <div className="field">
              <label htmlFor="email" className="mono">Email</label>
              <input
                id="email" name="email" type="email" autoComplete="email"
                value={values.email} onChange={set('email')}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-err' : undefined}
              />
              {errors.email && <p className="field__err mono" id="email-err">{errors.email}</p>}
            </div>

            <div className="field">
              <label htmlFor="subject" className="mono">Subject <span>optional</span></label>
              <input
                id="subject" name="subject" type="text"
                value={values.subject} onChange={set('subject')}
              />
            </div>

            <div className="field">
              <label htmlFor="message" className="mono">Message</label>
              <textarea
                id="message" name="message" rows={5}
                value={values.message} onChange={set('message')}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? 'message-err' : undefined}
              />
              {errors.message && <p className="field__err mono" id="message-err">{errors.message}</p>}
            </div>

            <button className="btn" type="submit" disabled={status === 'sending'}>
              <span>{status === 'sending' ? 'Sending…' : 'Send message'}</span>
            </button>

            <p className="contact__notice mono" role="status" aria-live="polite">
              {status === 'sent' && <span className="is-ok">{notice}</span>}
              {status === 'error' && <span className="is-bad">{notice}</span>}
            </p>
          </form>

          <aside className="contact__aside reveal">
            <p className="contact__lede">
              Working on something interesting, or hiring? Send it over — I read everything.
            </p>
            <ul className="contact__socials">
              {socials.map((s) => (
                <li key={s.platform}>
                  <a href={s.url} target={s.url.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer">
                    <span className="mono">{s.label ?? s.platform}</span>
                    <span className="contact__handle mono">{s.handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
