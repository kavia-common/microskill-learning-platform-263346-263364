 // PUBLIC_INTERFACE
 /**
  * Audio mapping utilities for lessons.
  * Adds automatic title-based slug mapping with alias registry and env overrides.
  * Progressive enhancement: audio/captions are optional; presence is probed at runtime.
  *
  * Env flags:
  * - REACT_APP_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error' (controls console telemetry)
  * - REACT_APP_AUDIO_TITLE_MAP: JSON string mapping title variants to canonical slug
  *   Example: {"Inbox Zero in Minutes":"quick-inbox-zero","Inbox Zero":"quick-inbox-zero"}
  */

const LOG_LEVEL = (process.env.REACT_APP_LOG_LEVEL || 'info').toLowerCase();
const LOG_LEVEL_ORDER = { debug: 10, info: 20, warn: 30, error: 40 };
function log(level, msg, meta) {
  const cur = LOG_LEVEL_ORDER[LOG_LEVEL] ?? 20;
  const lvl = LOG_LEVEL_ORDER[level] ?? 20;
  if (lvl >= cur) {
    const payload = meta ? [msg, meta] : [msg];
    // eslint-disable-next-line no-console
    (console[level] || console.log)(...payload);
  }
}

const AUDIO_MP3_BASE = '/assets/audio/mp3';
const AUDIO_SSML_BASE = '/assets/audio/ssml';
const AUDIO_TEXT_BASE = '/assets/audio/text';
const CAPTIONS_BASE = '/assets/audio/captions';

// Known alias slugs that might be present as asset filenames even if not equal to lesson id
// Keep list extensible; these are examples provided in task description.
const KNOWN_ALIAS_SLUGS = [
  'quick-inbox-zero',
  'focus-sprints',
  'g-m-a-formula',
  'five-minute-map',
  '4-4-6-reset',
  'memory-ladder',
  'micro-leadership-tips'
];

// Static direct ID mappings retained for backward compatibility (legacy assets)
const LEGACY_ID_TO_FILE = {
  'focus-60': 'focus-60.mp3',
  'inbox-zero': 'inbox-zero.mp3',
  'clear-ask': 'clear-ask.mp3',
  'two-minute-rule': 'two-minute-rule.mp3',
  'feedback-fast': 'feedback-fast.mp3',
  'atomic-habit': 'atomic-habit.mp3',
  'async-standup': 'async-standup.mp3',
};

// Legacy captions mapping retained. Prefer auto-discovered text/ssml if available.
const LEGACY_ID_TO_CAPTIONS = {
  'focus-60': 'focus-60.captions.json',
  'inbox-zero': 'inbox-zero.captions.json',
  'clear-ask': 'clear-ask.captions.json',
  'two-minute-rule': 'two-minute-rule.captions.json',
  'feedback-fast': 'feedback-fast.captions.json',
  'atomic-habit': 'atomic-habit.captions.json',
  'async-standup': 'async-standup.captions.json',
};

// Title variants registry; consumers can override via REACT_APP_AUDIO_TITLE_MAP
const DEFAULT_TITLE_TO_SLUG = {
  'Inbox Zero in Minutes': 'quick-inbox-zero',
  'Inbox Zero': 'quick-inbox-zero',
  '60-Second Focus Reset': '4-4-6-reset',
  '4-4 Breathing Reset': '4-4-6-reset',
  'The Two-Minute Rule': 'two-minute-rule',
  'Make a Clear Ask': 'clear-ask',
  'Feedback in 30 Seconds': 'feedback-fast',
  'Make It Obvious': 'atomic-habit',
  'Async Standups That Work': 'async-standup'
};

let ENV_TITLE_TO_SLUG = {};
try {
  if (process.env.REACT_APP_AUDIO_TITLE_MAP) {
    ENV_TITLE_TO_SLUG = JSON.parse(process.env.REACT_APP_AUDIO_TITLE_MAP);
  }
} catch (e) {
  log('warn', '[audioMapping] Failed to parse REACT_APP_AUDIO_TITLE_MAP JSON; ignoring.', { error: String(e) });
}

const TITLE_TO_SLUG = { ...DEFAULT_TITLE_TO_SLUG, ...ENV_TITLE_TO_SLUG };

/**
 * Normalize a string to safe slug:
 * - lowercase
 * - trim
 * - collapse internal whitespace
 * - remove accents/diacritics
 * - remove non-alphanumeric (keep spaces and hyphens during processing)
 * - replace spaces with dashes
 */
// PUBLIC_INTERFACE
export function toSlug(str) {
  /** Create a canonical slug from a free-form string. */
  if (!str) return '';
  const lower = String(str).toLowerCase().trim();
  // Collapse multiple whitespace to single space
  const collapsed = lower.replace(/\s+/g, ' ');
  // Remove accents
  const noAccents = collapsed.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Remove non-alphanumeric except spaces and hyphens (keep digits and letters)
  const cleaned = noAccents.replace(/[^a-z0-9 -]/g, '');
  // Replace spaces with dashes and collapse multiple dashes
  const dashed = cleaned.replace(/\s+/g, '-').replace(/-+/g, '-');
  // Trim stray dashes
  return dashed.replace(/^-+/, '').replace(/-+$/, '');
}

async function headExists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Probe helper that tries HEAD against a list of candidate urls and returns the first that exists.
async function probeFirstExists(urls) {
  for (const u of urls) {
    // Try HEAD first; if HEAD is not supported by static host, a GET with no-store fallback
    const exists = await headExists(u);
    if (exists) return u;
    try {
      const res = await fetch(u, { method: 'GET', cache: 'no-store' });
      if (res.ok) return u;
    } catch {
      // ignore
    }
  }
  return null;
}

// PUBLIC_INTERFACE
export function getAudioUrlForLesson(lesson) {
  /** Backward-compatible direct mapping by lesson id (legacy). */
  const id = lesson?.id || '';
  const file = LEGACY_ID_TO_FILE[id];
  if (!file) return null;
  return `${AUDIO_MP3_BASE}/${file}`;
}

// PUBLIC_INTERFACE
export function getCaptionsUrlForLesson(lesson) {
  /** Backward-compatible direct mapping for captions JSON (legacy). */
  const id = lesson?.id || '';
  const file = LEGACY_ID_TO_CAPTIONS[id];
  if (!file) return null;
  return `${CAPTIONS_BASE}/${file}`;
}

// PUBLIC_INTERFACE
export function inferFallbackCaptionLines(lesson) {
  /**
   * Fallback: derive lines from description/summary if captions JSON not present.
   * Splits into short cue lines.
   */
  const src = (lesson?.description || lesson?.summary || lesson?.title || '').trim();
  if (!src) return [];
  return src
    .split(/[.?!]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
}

/**
 * PUBLIC_INTERFACE
 * mapLessonToAudio
 * Resolve lesson to audio and text sources by generating a slug from title/id and probing for files.
 * Returns an object: { slug, audioUrl, ssmlUrl, textUrl, captionsUrl }
 */
export async function mapLessonToAudio(lesson) {
  /**
   * Try in order:
   * 1) Legacy id mappings (mp3, captions)
   * 2) Title->slug registry (env overrides + defaults)
   * 3) Auto slug from title, also check lesson.id as a candidate
   * 4) Known alias slugs
   * Probe presence for:
   * - /assets/audio/mp3/{slug}.mp3
   * - /assets/audio/ssml/{slug}.ssml
   * - /assets/audio/text/{slug}.txt
   * - /assets/audio/captions/{slug}.captions.json
   */
  const title = lesson?.title || '';
  const id = lesson?.id || '';

  // Step 1: legacy direct (by id)
  const legacyMp3 = LEGACY_ID_TO_FILE[id] ? `${AUDIO_MP3_BASE}/${LEGACY_ID_TO_FILE[id]}` : null;
  const legacyCaptions = LEGACY_ID_TO_CAPTIONS[id] ? `${CAPTIONS_BASE}/${LEGACY_ID_TO_CAPTIONS[id]}` : null;

  const registrySlug = TITLE_TO_SLUG[title] || TITLE_TO_SLUG[title.trim()] || null;
  const autoSlug = toSlug(title);
  const idSlug = toSlug(id);

  // Build candidate slugs list with priority
  const candidateSlugs = [];
  if (registrySlug) candidateSlugs.push(registrySlug);
  if (autoSlug) candidateSlugs.push(autoSlug);
  if (idSlug && idSlug !== autoSlug) candidateSlugs.push(idSlug);
  // add known aliases last (unique)
  KNOWN_ALIAS_SLUGS.forEach(s => {
    if (!candidateSlugs.includes(s)) candidateSlugs.push(s);
  });

  // Build candidate URLs
  const mp3Candidates = [
    ...(legacyMp3 ? [legacyMp3] : []),
    ...candidateSlugs.map((s) => `${AUDIO_MP3_BASE}/${s}.mp3`),
  ];
  const ssmlCandidates = candidateSlugs.map((s) => `${AUDIO_SSML_BASE}/${s}.ssml`);
  const textCandidates = candidateSlugs.map((s) => `${AUDIO_TEXT_BASE}/${s}.txt`);
  const captionsCandidates = [
    ...(legacyCaptions ? [legacyCaptions] : []),
    ...candidateSlugs.map((s) => `${CAPTIONS_BASE}/${s}.captions.json`),
  ];

  log('debug', '[audioMapping] Probing candidates', {
    id,
    title,
    candidateSlugs,
    mp3: mp3Candidates,
    ssml: ssmlCandidates,
    text: textCandidates,
    captions: captionsCandidates,
  });

  const [audioUrl, ssmlUrl, textUrl, captionsUrl] = await Promise.all([
    probeFirstExists(mp3Candidates),
    probeFirstExists(ssmlCandidates),
    probeFirstExists(textCandidates),
    probeFirstExists(captionsCandidates),
  ]);

  if (!audioUrl && !ssmlUrl && !textUrl && !captionsUrl) {
    log('info', '[audioMapping] No audio assets found for lesson', { id, title, autoSlug, registrySlug });
  } else {
    log('debug', '[audioMapping] Resolved audio assets', {
      id, title, slug: registrySlug || autoSlug || idSlug, audioUrl, ssmlUrl, textUrl, captionsUrl,
    });
  }

  return {
    slug: registrySlug || autoSlug || idSlug || '',
    audioUrl,
    ssmlUrl,
    textUrl,
    captionsUrl,
  };
}
