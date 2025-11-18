import { runtime } from '../utils/settings';

/**
 * API client for LMS backend.
 *
 * Base URL resolution order:
 *  1) REACT_APP_API_BASE
 *  2) REACT_APP_BACKEND_URL
 *  3) If browser hostname is localhost/127.0.0.1: http://localhost:3001
 *  4) Otherwise: same-origin (empty prefix)
 *
 * To avoid CORS issues, ensure backend allows the frontend origin.
 */

export const __apiBase = runtime.apiBase;

export function __buildApiUrl(path) {
  const base = __apiBase || '';
  if (!base) return path;
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${trimmed}${path}`;
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function responseToError(res, url) {
  const payload = await safeJson(res);
  const msg =
    payload?.error?.message ||
    payload?.message ||
    `${res.status} ${res.statusText || ''}`.trim() ||
    'Request failed';
  const err = new Error(msg);
  err.status = res.status;
  err.payload = payload;
  err.url = url;
  if (res.type === 'opaque') err.hint = 'CORS or network issue';
  return err;
}

/**
 * Generic JSON fetch with consistent error shaping.
 * Adds diagnostics for CORS/network failures without leaking secrets.
 */
async function jsonFetch(path, options = {}) {
  const url = __buildApiUrl(path);
  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: 'same-origin',
      mode: 'cors',
    });
    if (!res.ok) {
      throw await responseToError(res, url);
    }
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    return isJson ? await res.json().catch(() => ({})) : await res.text();
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Network error');
    if (!('status' in error)) error.status = 0;
    if (!('url' in error)) error.url = url;
    if (!('hint' in error)) error.hint = 'Check backend availability and CORS';
    throw error;
  }
}

/**
 * PUBLIC_INTERFACE
 * Lessons and progress APIs per acceptance criteria (list/detail/learn/quiz/progress).
 */
export async function listLessons() {
  return jsonFetch('/lessons', { method: 'GET' });
}

/**
 * PUBLIC_INTERFACE
 * Skill endpoints used by HomeFeedPage and LearningModulePage.
 * These are thin wrappers that align with an alternative backend shape (if present).
 * If the backend does not provide these routes, callers should handle errors gracefully.
 */
export async function listSkills(params = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', String(params.search).slice(0, 120));
  if (params.level) qs.set('level', params.level);
  if (params.tag) qs.set('tag', params.tag);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return jsonFetch(`/skills${suffix}`, { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function getSkill(id) {
  return jsonFetch(`/skills/${encodeURIComponent(id)}`, { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function getSkillProgress(skillId) {
  return jsonFetch(`/progress/${encodeURIComponent(skillId)}`, { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function updateSkillProgress(skillId, payload) {
  return jsonFetch(`/progress/${encodeURIComponent(skillId)}`, {
    method: 'POST',
    body: payload || {},
  });
}

// PUBLIC_INTERFACE
export async function getLesson(id) {
  return jsonFetch(`/lessons/${encodeURIComponent(id)}`, { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function enrollLesson(id) {
  return jsonFetch(`/lessons/${encodeURIComponent(id)}/enroll`, { method: 'POST' });
}

// PUBLIC_INTERFACE
export async function getProgress(userId) {
  return jsonFetch(`/progress${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`, {
    method: 'GET',
  });
}

// PUBLIC_INTERFACE
export async function updateProgress({ lessonId, moduleIndex, status, score }) {
  const body = { lessonId, moduleIndex, status, score };
  return jsonFetch(`/progress`, { method: 'POST', body });
}

// PUBLIC_INTERFACE
export async function getQuiz(lessonId) {
  return jsonFetch(`/lessons/${encodeURIComponent(lessonId)}/quiz`, { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function submitQuiz(lessonId, answers) {
  return jsonFetch(`/lessons/${encodeURIComponent(lessonId)}/quiz`, {
    method: 'POST',
    body: { answers },
  });
}

// PUBLIC_INTERFACE
export async function generateLesson(seed) {
  return jsonFetch(`/generate/lesson`, { method: 'POST', body: { seed } });
}

// PUBLIC_INTERFACE
export async function generateMedia({ type, prompt }) {
  return jsonFetch(`/generate/media`, { method: 'POST', body: { type, prompt } });
}

/** PUBLIC_INTERFACE
 * Returns a diagnostic string explaining the resolved API base and guidance.
 */
export function __apiDiagnostics() {
  const base = __apiBase || '(same-origin)';
  return `API base: ${base}. Set REACT_APP_API_BASE or REACT_APP_BACKEND_URL to override. Ensure backend CORS allows this origin.`;
}
