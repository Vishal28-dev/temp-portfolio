import { useState } from 'react';

const LAYERS = [
  ['L01', 'Interface'], ['L02', 'Motion'], ['L03', 'Service'],
  ['L04', 'Data'], ['L05', 'Runtime'], ['L06', 'Delivery'],
];

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);

export default function ProjectForm({ value, onSave, onCancel }) {
  const [v, setV] = useState(value);
  const [stackText, setStackText] = useState((value.stack ?? []).map((s) => s.name).join(', '));
  const [tagsText, setTagsText] = useState((value.tags ?? []).join(', '));

  const set = (key) => (e) => {
    const next = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setV((prev) => ({ ...prev, [key]: next }));
  };

  const setNested = (group, key) => (e) =>
    setV((prev) => ({ ...prev, [group]: { ...prev[group], [key]: e.target.value } }));

  const toggleLayer = (code) =>
    setV((prev) => ({
      ...prev,
      layers: prev.layers.includes(code)
        ? prev.layers.filter((l) => l !== code)
        : [...prev.layers, code],
    }));

  const submit = (e) => {
    e.preventDefault();

    const clean = (obj) =>
      Object.fromEntries(Object.entries(obj).filter(([, val]) => val !== '' && val !== undefined));

    const payload = {
      ...(v.id ? { id: v.id } : {}),
      slug: v.slug || slugify(v.title),
      title: v.title,
      status: v.status,
      featured: Boolean(v.featured),
      order: Number(v.order) || 0,
      layers: v.layers,
      year: Number(v.year) || undefined,
      stack: stackText.split(',').map((s) => s.trim()).filter(Boolean).map((name) => ({ name })),
      tags: tagsText.split(',').map((s) => s.trim()).filter(Boolean),
      links: clean(v.links ?? {}),
      ...(v.tagline ? { tagline: v.tagline } : {}),
      ...(v.summary ? { summary: v.summary } : {}),
      ...(v.body ? { body: v.body } : {}),
      ...(v.role ? { role: v.role } : {}),
      ...(v.client ? { client: v.client } : {}),
      ...(v.media?.cover?.url
        ? { media: { cover: clean(v.media.cover) } }
        : {}),
    };

    onSave(payload);
  };

  return (
    <form className="adm-form" onSubmit={submit}>
      <div className="adm-form__grid">
        <label>
          <span className="mono">Title</span>
          <input
            value={v.title}
            onChange={(e) => {
              const title = e.target.value;
              setV((prev) => ({
                ...prev,
                title,
                slug: prev.id ? prev.slug : slugify(title),
              }));
            }}
            required
          />
        </label>

        <label>
          <span className="mono">Slug</span>
          <input value={v.slug} onChange={set('slug')} pattern="[a-z0-9\-]+" required />
        </label>

        <label>
          <span className="mono">Status</span>
          <select value={v.status} onChange={set('status')}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label>
          <span className="mono">Year</span>
          <input type="number" value={v.year ?? ''} onChange={set('year')} min="1990" max="2100" />
        </label>

        <label className="adm-form__wide">
          <span className="mono">Summary</span>
          <textarea rows={3} value={v.summary ?? ''} onChange={set('summary')} maxLength={600} />
        </label>

        <label>
          <span className="mono">Live URL</span>
          <input value={v.links?.live ?? ''} onChange={setNested('links', 'live')} />
        </label>

        <label>
          <span className="mono">Repo URL</span>
          <input value={v.links?.repo ?? ''} onChange={setNested('links', 'repo')} />
        </label>

        <label>
          <span className="mono">Stack (comma separated)</span>
          <input value={stackText} onChange={(e) => setStackText(e.target.value)} />
        </label>

        <label>
          <span className="mono">Tags (comma separated)</span>
          <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
        </label>

        <label className="adm-form__wide">
          <span className="mono">Cover image URL</span>
          <input
            value={v.media?.cover?.url ?? ''}
            onChange={(e) =>
              setV((prev) => ({
                ...prev,
                media: { ...prev.media, cover: { ...prev.media?.cover, url: e.target.value } },
              }))
            }
            placeholder="/uploads/… or an absolute URL"
          />
        </label>
      </div>

      <fieldset className="adm-form__layers">
        <legend className="mono">Strata — where this surfaces during the descent</legend>
        {LAYERS.map(([code, name]) => (
          <label key={code} className="adm-form__check">
            <input
              type="checkbox"
              checked={v.layers.includes(code)}
              onChange={() => toggleLayer(code)}
            />
            <span className="mono">{code}</span> {name}
          </label>
        ))}
      </fieldset>

      <label className="adm-form__check">
        <input type="checkbox" checked={Boolean(v.featured)} onChange={set('featured')} />
        Featured
      </label>

      <div className="adm-form__actions">
        <button type="submit" className="adm__primary">Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
