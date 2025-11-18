 // PUBLIC_INTERFACE
 /**
  * Simple settings persistence for audio/captions/autoplay toggles.
  * Keys stored in localStorage. Fallback to defaults if absent.
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
