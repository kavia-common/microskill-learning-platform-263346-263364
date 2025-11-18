 // PUBLIC_INTERFACE
 /**
  * Simple settings persistence for audio/captions/autoplay toggles.
  * Keys stored in localStorage. Fallback to defaults if absent.
  * Also exposes computed API base URL and health path for services.
  */

const KEY = 'lms_media_settings_v1';

const DEFAULTS = {
  audioOn: true,
  captionsOn: true,
  autoplayOn: true,
  mutedByDefault: true,
};

// PUBLIC_INTERFACE
export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

// PUBLIC_INTERFACE
export function saveSettings(next) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

// PUBLIC_INTERFACE
export function updateSetting(partial) {
  const cur = loadSettings();
  const next = { ...cur, ...partial };
  saveSettings(next);
  return next;
}

/**
 * Resolve API base URL with precedence:
 * 1) REACT_APP_API_BASE
 * 2) REACT_APP_BACKEND_URL
 * 3) localhost dev default http://localhost:3001 if running on localhost
 * 4) same-origin fallback: ''
 */
// PUBLIC_INTERFACE
export const runtime = {
  apiBase: (() => {
    const env =
      (typeof process !== 'undefined' && process.env && (process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL)) ||
      '';
    if (env) return env;
    try {
      if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
          return 'http://localhost:3001';
        }
      }
    } catch {
      // ignore
    }
    return ''; // same-origin
  })(),
  healthPath: (typeof process !== 'undefined' && process.env && process.env.REACT_APP_HEALTHCHECK_PATH) || '/health',
  logLevel: (typeof process !== 'undefined' && process.env && process.env.REACT_APP_LOG_LEVEL) || 'warn',
};
