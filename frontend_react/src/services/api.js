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
    res.statusText ||
    'Request failed';
  const err = new Error(msg);
  err.status = res.status;
  err.payload = payload;
  return err;
}

// PUBLIC_INTERFACE
export async function getLessons() {
  /** Fetch all lessons. */
  const res = await fetch(buildUrl('/api/lessons'));
  if (!res.ok) throw await responseToError(res);
  return res.json();
}

// PUBLIC_INTERFACE
export async function getLesson(id) {
  /** Fetch lesson detail by id. */
  const res = await fetch(buildUrl(`/api/lessons/${id}`));
  if (!res.ok) throw await responseToError(res);
  return res.json();
}

// PUBLIC_INTERFACE
export async function getQuiz(lessonId) {
  /** Fetch quiz for lesson. */
  const res = await fetch(buildUrl(`/api/lessons/${lessonId}/quiz`));
  if (!res.ok) throw await responseToError(res);
  return res.json();
}

// PUBLIC_INTERFACE
export async function submitQuiz(lessonId, userId, answers) {
  /** Submit quiz answers and get score. */
  const res = await fetch(buildUrl(`/api/lessons/${lessonId}/quiz`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, answers })
  }).catch((e) => {
    const err = new Error(`Network error: ${e?.message || e}`);
    err.cause = e;
    throw err;
  });
  if (!res.ok) throw await responseToError(res);
  return res.json();
}

// PUBLIC_INTERFACE
export async function getProgress(userId) {
  /** Get user progress. */
  const res = await fetch(buildUrl(`/api/progress?userId=${encodeURIComponent(userId)}`));
  if (!res.ok) throw await responseToError(res);
  return res.json();
}

// PUBLIC_INTERFACE
export async function updateProgress(payload) {
  /** Update user progress record. */
  const res = await fetch(buildUrl('/api/progress'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch((e) => {
    const err = new Error(`Network error: ${e?.message || e}`);
    err.cause = e;
    throw err;
  });
  if (!res.ok) throw await responseToError(res);
  return res.json();
}

// PUBLIC_INTERFACE
export async function generateLessonAI({ topic, audience, tone, dryRun = false }) {
  /**
   * Calls backend /api/generate-lesson to create lesson + quiz.
   * Returns: { lesson, quiz }
   */
  const res = await fetch(buildUrl('/api/generate-lesson'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, audience, tone, dryRun })
  }).catch((e) => {
    // Network-level errors (CORS, DNS, refused, etc.)
    const err = new Error(`Network error: ${e?.message || e}`);
    err.cause = e;
    throw err;
  });
  if (!res.ok) {
    throw await responseToError(res);
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function generateMediaAI({ title, summary, takeaways }) {
  /**
   * Calls backend /api/generate-media to render local MP4 + VTT.
   * Returns: { slug, videoUrl, captionsUrl }
   */
  const res = await fetch(buildUrl('/api/generate-media'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, summary, takeaways })
  }).catch((e) => {
    const err = new Error(`Network error: ${e?.message || e}`);
    err.cause = e;
    throw err;
  });
  if (!res.ok) {
    throw await responseToError(res);
  }
  return res.json();
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export { buildUrl as __buildApiUrl, inferredBase as __apiBase };
