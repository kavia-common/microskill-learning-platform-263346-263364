 /**
  * API client for LMS backend.
  * Uses REACT_APP_API_BASE or REACT_APP_BACKEND_URL for base URL.
  */
const base =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_BACKEND_URL ||
  '';

function buildUrl(path) {
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${trimmed}${path}`;
}

// PUBLIC_INTERFACE
export async function getLessons() {
  /** Fetch all lessons. */
  const res = await fetch(buildUrl('/api/lessons'));
  if (!res.ok) throw new Error('Failed to fetch lessons');
  return res.json();
}

// PUBLIC_INTERFACE
export async function getLesson(id) {
  /** Fetch lesson detail by id. */
  const res = await fetch(buildUrl(`/api/lessons/${id}`));
  if (!res.ok) throw new Error('Failed to fetch lesson');
  return res.json();
}

// PUBLIC_INTERFACE
export async function getQuiz(lessonId) {
  /** Fetch quiz for lesson. */
  const res = await fetch(buildUrl(`/api/lessons/${lessonId}/quiz`));
  if (!res.ok) throw new Error('Failed to fetch quiz');
  return res.json();
}

// PUBLIC_INTERFACE
export async function submitQuiz(lessonId, userId, answers) {
  /** Submit quiz answers and get score. */
  const res = await fetch(buildUrl(`/api/lessons/${lessonId}/quiz`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, answers })
  });
  if (!res.ok) throw new Error('Failed to submit quiz');
  return res.json();
}

// PUBLIC_INTERFACE
export async function getProgress(userId) {
  /** Get user progress. */
  const res = await fetch(buildUrl(`/api/progress?userId=${encodeURIComponent(userId)}`));
  if (!res.ok) throw new Error('Failed to fetch progress');
  return res.json();
}

// PUBLIC_INTERFACE
export async function updateProgress(payload) {
  /** Update user progress record. */
  const res = await fetch(buildUrl('/api/progress'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to update progress');
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
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.error?.message || 'Failed to generate lesson');
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
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.error?.message || 'Failed to generate media');
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
