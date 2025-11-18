/** 
  * API client for LMS backend.
  *
  * Base URL resolution order:
  *  1) REACT_APP_API_BASE
  *  2) REACT_APP_BACKEND_URL
  *  3) If browser hostname is localhost/127.0.0.1: http://localhost:3001
  *  4) Otherwise: same-origin (empty prefix)
  *
  * To avoid CORS issues, set backend FRONTEND_ORIGIN to the frontend origin.
  */

const inferredBase = (() => {
  const envBase =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    '';
  if (envBase) return envBase;

  try {
    const isLocalhost =
      typeof window !== 'undefined' &&
      window.location &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1');
    if (isLocalhost) {
      return 'http://localhost:3001';
    }
  } catch {
    // ignore
  }
  return '';
})();

function buildUrl(path) {
  const trimmed = inferredBase.endsWith('/') ? inferredBase.slice(0, -1) : inferredBase;
  // If no explicit base is configured, return same-origin path (suitable for CRA proxy or same-origin API)
  if (!trimmed) {
    return path;
  }
  return `${trimmed}${path}`;
}

/**
 * Convert a non-ok fetch Response into a richer Error with status/context.
 */
async function responseToError(res) {
  const payload = await safeJson(res);
  const msg =
    payload?.error?.message ||
    payload?.message ||
    `${res.status} ${res.statusText || ''}`.trim() ||
    'Request failed';
  const err = new Error(msg);
  err.status = res.status;
  err.payload = payload;
  // Surface CORS-like hints
  if (res.type === 'opaque') {
    err.hint = 'CORS or network issue';
  }
  return err;
}

// Helper to fetch with robust error surfacing and optional toast callback
async function fetchJson(url, options = {}, onErrorToast) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const err = await responseToError(res);
      if (onErrorToast) {
        onErrorToast({
          status: err.status,
          message: err.message,
          hint: err.hint,
          url
        });
      }
      throw err;
    }
    return res.json();
  } catch (e) {
    if (onErrorToast && (!e.status || String(e.message || '').toLowerCase().includes('network'))) {
      onErrorToast({
        status: e.status || 0,
        message: e.message || 'Network error',
        hint: e.hint || 'Check CORS or server availability',
        url
      });
    }
    throw e;
  }
}

// PUBLIC_INTERFACE
export async function listSkills({ search = '', level, tag } = {}, onErrorToast) {
  /** List skills with optional filters. */
  const qs = new URLSearchParams();
  if (search) qs.set('search', String(search).slice(0, 120));
  if (level) qs.set('level', level);
  if (tag) qs.set('tag', tag);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return fetchJson(buildUrl(`/api/skills${suffix}`), undefined, onErrorToast);
}

// PUBLIC_INTERFACE
export async function getSkill(id, onErrorToast) {
  /** Get skill detail by id. */
  return fetchJson(buildUrl(`/api/skills/${encodeURIComponent(id)}`), undefined, onErrorToast);
}

// PUBLIC_INTERFACE
export async function enrollSkill(id, onErrorToast) {
  /** Enroll current user (mock) to a skill. */
  return fetchJson(buildUrl(`/api/skills/${encodeURIComponent(id)}/enroll`), { method: 'POST' }, onErrorToast);
}

// PUBLIC_INTERFACE
export async function getSkillProgress(skillId, onErrorToast) {
  /** Get progress for a skill. */
  return fetchJson(buildUrl(`/api/progress/${encodeURIComponent(skillId)}`), undefined, onErrorToast);
}

// PUBLIC_INTERFACE
export async function updateSkillProgress(skillId, payload, onErrorToast) {
  /** Update progress for a lesson within a skill. */
  return fetchJson(buildUrl(`/api/progress/${encodeURIComponent(skillId)}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }, onErrorToast);
}

// Keep existing optional AI endpoints if backend provides them
// PUBLIC_INTERFACE
export async function generateLessonAI({ topic, audience, tone, dryRun = false }, onErrorToast) {
  return fetchJson(
    buildUrl('/api/generate-lesson'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, audience, tone, dryRun })
    },
    onErrorToast
  );
}

// PUBLIC_INTERFACE
export async function generateMediaAI({ title, summary, takeaways }, onErrorToast) {
  return fetchJson(
    buildUrl('/api/generate-media'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, summary, takeaways })
    },
    onErrorToast
  );
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** PUBLIC_INTERFACE
 * Returns a diagnostic string explaining the resolved API base and guidance.
 */
export function __apiDiagnostics() {
  const base = inferredBase || '(same-origin)';
  return `API base: ${base}. Set REACT_APP_API_BASE in frontend .env to override. Ensure backend FRONTEND_ORIGIN allows your frontend origin.`;
}

export { buildUrl as __buildApiUrl, inferredBase as __apiBase };
