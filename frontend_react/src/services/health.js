 /**
  * PUBLIC_INTERFACE
  * Backend health/diagnostics helper functions used by CreatorGeneratePage and DiagnosticsPanel.
  */

import { __buildApiUrl as buildApiUrl, __apiBase as apiBase } from './api';

/** PUBLIC_INTERFACE */
export function getBackendBase() {
  /** Returns the resolved backend base URL or '' for same-origin. */
  return apiBase || '';
}

/** PUBLIC_INTERFACE */
export function buildBackendUrl(path) {
  /** Builds a full URL for backend endpoint using configured base. */
  return buildApiUrl(path);
}

/** PUBLIC_INTERFACE */
export async function probeBackend(build = (p) => buildApiUrl(p)) {
  /** Checks health endpoint and returns { ok, status, message }. */
  try {
    const res = await fetch(build('/'), { cache: 'no-store' });
    if (!res.ok) return { ok: false, status: res.status, message: res.statusText || 'health not ok' };
    const json = await res.json().catch(() => null);
    return { ok: true, status: res.status, message: json?.message || 'ok' };
  } catch (e) {
    return { ok: false, status: 0, message: String(e?.message || e) };
  }
}

/** PUBLIC_INTERFACE */
export async function probeApiEndpoints(build = (p) => buildApiUrl(p)) {
  /** Probes OPTIONS for generate endpoints to confirm reachability. */
  const endpoints = ['/api/generate-lesson', '/api/generate-media'];
  const out = {};
  await Promise.all(endpoints.map(async (ep) => {
    try {
      const r = await fetch(build(ep), { method: 'OPTIONS' });
      out[ep] = { ok: r.ok, status: r.status, message: r.statusText || '' };
    } catch (e) {
      out[ep] = { ok: false, status: 0, message: String(e?.message || e) };
    }
  }));
  return out;
}
