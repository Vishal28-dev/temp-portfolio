# Vishal — Portfolio

A full-stack portfolio built around one idea: **the descent**.

A single WebGL particle swarm lives behind the whole page and never unloads.
Scrolling drives one continuous camera descent through six strata of the stack —
Interface, Motion, Service, Data, Runtime, Delivery — and at each depth the swarm
re-forms into a structure belonging to that layer. The page ground darkens from
bone at the surface to abyss at the core, so colour carries the narrative.
"Full-stack" is the architecture of the site, not a line in a bio.

React · Three.js · Node · Express · MongoDB · Docker · Nginx

---

## Quick start

```bash
make up      # build + start everything in Docker
make seed    # load profile, skills and the admin user
```

| | |
|---|---|
| Portfolio | http://localhost:5173 |
| Admin | http://localhost:5173/admin |
| API | http://localhost:4000/api/v1 |
| Health | http://localhost:4000/api/v1/health |

`make up` creates `.env` from `.env.example` on first run and generates fresh
secrets for every placeholder. Your admin password is in that file —
**`.env` is gitignored and must never be committed.**

```bash
make down    # stop everything (database volume kept)
```

## Everything else

```
make help         list all targets

make prod-up      production images — nginx-served build on :8080
make prod-down    stop the production stack

make seed         idempotent; safe to re-run
make seed-fresh   wipe every collection, then reseed

make logs         tail all services      make logs-api / logs-web
make ps           container status       make health
make mongo-shell  mongosh on the app db  make db-export
make sh-api       shell into a container make sh-web

make clean        remove containers AND the database volume (destructive)
```

## Adding your work

Projects are **not** seeded — sign in at `/admin` and add them there. Each
project is tagged with the strata it belongs to (L01–L06) and surfaces inside
that stratum during the descent, so work appears where it sits in the stack
rather than in a grid at the bottom. Strata with nothing in them yet show a
designed empty state.

## Architecture

```
browser ──▶ nginx (prod) / vite (dev) ──▶ Express ──▶ Mongoose ──▶ MongoDB
              │                             │
              └── static build              └── route → validator → controller
                                                  → service → model
```

```
backend/src
  config/      env (zod-validated, fails fast), db, logger
  models/      Profile Project Skill Experience Message Guestbook Visit Setting User
  routes/v1/   public · auth · admin
  middleware/  security sanitize validate rateLimit auth cache error
  services/    content · inbox · auth
  seed/        seed.js + data/

frontend/src
  scene/       Descent.js (controller) · systems/ (Swarm, Post, quality) · materials/ (GLSL)
  ui/          chrome/ (Preloader Cursor Hud Nav) · sections/
  admin/       lazy-loaded CMS — no canvas, no motion
  lib/         api · strata (the palette + formation source of truth) · descent (frame store)
```

### The 3D

- **No models and no geometry files.** All eight formations are computed
  procedurally in the vertex shader from a per-point random seed, so the whole
  system ships as one buffer of random numbers.
- **Morphs are not lerps.** Mid-transition the points take a swirl impulse
  scaled by `sin(t·π)`, so they explode outward and re-gather.
- **Hand-rolled post chain** — one half-res blur feeds both a real
  depth-texture depth-of-field and the bloom, plus chromatic aberration,
  vignette and grain. Three passes, no addons.
- **Three quality tiers** picked from device hints, then corrected at runtime by
  a rolling FPS governor that drops a tier when the frame budget is missed.
- **`three` is a deferred chunk** (~115 KB gzip) — the document paints first.
- Additive blending cannot darken a pale ground, so on the bone strata the
  swarm switches to normal blending and paints dark specks instead.

### Accessibility & degradation

- Every stratum is a real DOM section with real headings; the canvas is
  `aria-hidden`. Content is never trapped in WebGL.
- **No WebGL, or context lost → the site is a styled scrolling document.** Same
  content, same palette, no canvas.
- `prefers-reduced-motion` freezes the swarm and cuts between strata.
- Ink polarity is chosen from the interpolated ground's luminance rather than
  interpolated through it, so text never fades toward grey mid-scroll. Contrast
  at every stratum is 5.9:1–16.3:1.
- Keyboard navigable, visible focus rings, skip link, labelled fields.

## Configuration

Every value is environment-driven; there are no secrets in the source.
`backend/src/config/env.js` validates the whole environment with zod at import
time and **refuses to boot** on anything missing or malformed.

See `.env.example` for the full list. The ones that matter:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | Database connection string |
| `CORS_ORIGIN` | Comma-separated allowed browser origins |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Admin session signing |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin account |
| `IP_HASH_SALT` | Salt for one-way IP hashing in analytics |
| `VITE_API_URL` | API base the frontend calls |

### Security

Passwords are hashed with node's own `scrypt` (no native module to compile).
Access tokens are short-lived with rotating refresh tokens in httpOnly cookies;
bumping `tokenVersion` revokes every session. Requests pass through helmet, a
CORS allowlist, per-route rate limits, body-size caps, and a sanitiser that
rejects mongo operator keys. Analytics stores a salted HMAC of the IP — never an
address — and rows self-delete after 90 days.

## Deploying to Render

Render has no managed MongoDB, so the database lives on **MongoDB Atlas**
(the free M0 tier is enough).

1. Create an Atlas cluster and copy its connection string.
2. Render → **New** → **Blueprint** → point at this repo. `render.yaml` defines
   the API (Docker) and the site (static).
3. Fill in the values marked `sync: false`:
   - on `portfolio-api` — `MONGO_URI`, `CORS_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   - on `portfolio-web` — `VITE_API_URL`, `VITE_SITE_URL`
   JWT secrets and the IP salt are generated by Render automatically.
4. After the first deploy, set `CORS_ORIGIN` to the site's URL and
   `VITE_API_URL` to `https://<api>.onrender.com/api/v1`.
5. Seed once: `render shell portfolio-api` → `npm run seed`.

> Free Render services sleep when idle, so the first request after a quiet spell
> takes a few seconds to wake.
