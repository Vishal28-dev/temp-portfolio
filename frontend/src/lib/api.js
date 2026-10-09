const BASE = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiClientError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details ?? [];
  }
}

async function request(path, { method = 'GET', body, signal, token } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      signal,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiClientError("Can't reach the server right now.", { status: 0, code: 'NETWORK' });
  }

  if (res.status === 204 || res.status === 202) return null;

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok || payload?.ok === false) {
    const e = payload?.error ?? {};
    throw new ApiClientError(e.message || `Request failed (${res.status})`, {
      status: res.status,
      code: e.code,
      details: e.details,
    });
  }

  return payload;
}

export const api = {
  raw: request,

  getProfile: (o) => request('/profile', o).then((r) => r.data),
  getSkills: (o) => request('/skills?grouped=true', o).then((r) => r.data),
  getProjects: (o) => request('/projects?limit=100', o).then((r) => r.data),
  getExperiences: (o) => request('/experiences', o).then((r) => r.data),
  getMeta: (o) => request('/meta', o).then((r) => r.data),
  getGuestbook: (o) => request('/guestbook?limit=60', o).then((r) => r.data),

  sendContact: (body, o) => request('/contact', { ...o, method: 'POST', body }),
  signGuestbook: (body, o) => request('/guestbook', { ...o, method: 'POST', body }).then((r) => r.data),
  recordView: (body) =>
    request('/metrics/view', { method: 'POST', body }).catch(() => null),

  // ---- admin ----
  login: (body) => request('/auth/login', { method: 'POST', body }).then((r) => r.data),
  logout: (token) => request('/auth/logout', { method: 'POST', token }),
  me: (token) => request('/auth/me', { token }).then((r) => r.data),
  refresh: () => request('/auth/refresh', { method: 'POST' }).then((r) => r.data),

  adminProjects: (token) => request('/admin/projects?limit=100', { token }).then((r) => r.data),
  createProject: (body, token) => request('/admin/projects', { method: 'POST', body, token }).then((r) => r.data),
  updateProject: (id, body, token) => request(`/admin/projects/${id}`, { method: 'PATCH', body, token }).then((r) => r.data),
  deleteProject: (id, token) => request(`/admin/projects/${id}`, { method: 'DELETE', token }),

  adminMessages: (token) => request('/admin/messages?limit=100', { token }).then((r) => r.data),
  setMessageStatus: (id, status, token) =>
    request(`/admin/messages/${id}`, { method: 'PATCH', body: { status }, token }).then((r) => r.data),
  deleteMessage: (id, token) => request(`/admin/messages/${id}`, { method: 'DELETE', token }),
};
