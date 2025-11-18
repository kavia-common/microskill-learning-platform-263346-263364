 /** 
  * API client for LMS backend.
  * Uses REACT_APP_API_BASE or REACT_APP_BACKEND_URL for base URL.
  * If not provided, attempt a sane dev fallback:
  *  - If running on localhost: assume backend at http://localhost:3001
  *  - Else: same-origin (empty prefix)
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
export async function getLessons(onErrorToast) {
  /** Fetch all lessons. */
  return fetchJson(buildUrl('/api/lessons'), undefined, onErrorToast);
}

// PUBLIC_INTERFACE
export async function getLesson(id, onErrorToast) {
  /** Fetch lesson detail by id. */
  return fetchJson(buildUrl(`/api/lessons/${id}`), undefined, onErrorToast);
}

// PUBLIC_INTERFACE
export async function getQuiz(lessonId, onErrorToast) {
  /** Fetch quiz for lesson. */
  return fetchJson(buildUrl(`/api/lessons/${lessonId}/quiz`), undefined, onErrorToast);
}

// PUBLIC_INTERFACE
export async function submitQuiz(lessonId, userId, answers, onErrorToast) {
  /** Submit quiz answers and get score. */
  return fetchJson(
    buildUrl(`/api/lessons/${lessonId}/quiz`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, answers })
    },
    onErrorToast
  );
}

// PUBLIC_INTERFACE
export async function getProgress(userId, onErrorToast) {
  /** Get user progress. */
  return fetchJson(buildUrl(`/api/progress?userId=${encodeURIComponent(userId)}`), undefined, onErrorToast);
}

// PUBLIC_INTERFACE
export async function updateProgress(payload, onErrorToast) {
  /** Update user progress record. */
  return fetchJson(
    buildUrl('/api/progress'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    },
    onErrorToast
  );
}

// PUBLIC_INTERFACE
export async function generateLessonAI({ topic, audience, tone, dryRun = false }, onErrorToast) {
  /**
   * Calls backend /api/generate-lesson to create lesson + quiz.
   * Returns: { lesson, quiz }
   */
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
  /**
   * Calls backend /api/generate-media to render local MP4 + VTT.
   * Returns: { slug, videoUrl, captionsUrl }
   */
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

export { buildUrl as __buildApiUrl, inferredBase as __apiBase };
