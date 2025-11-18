 // PUBLIC_INTERFACE
 /**
  * Video mapping utilities for lessons.
  * Similar to audio mapping, this resolves title-based slugs and probes for:
  * - /assets/video/mp4/{slug}.mp4
  * - /assets/video/thumb/{slug}.jpg|png
  * - /assets/captions/{slug}.vtt (WebVTT)
  *
  * Supports aliases and environment override:
  * - REACT_APP_VIDEO_TITLE_MAP as a JSON string of { "Title Variant": "canonical-slug" }
  *
  * Notes:
  * - We do not hardcode any secrets.
  * - Progressive enhancement: if video is missing, the app should fall back to audio+captions.
  */

const LOG_LEVEL = (process.env.REACT_APP_LOG_LEVEL || 'info').toLowerCase();
const LOG_LEVEL_ORDER = { debug: 10, info: 20, warn: 30, error: 40 };
function vlog(level, msg, meta) {
  const cur = LOG_LEVEL_ORDER[LOG_LEVEL] ?? 20;
  const lvl = LOG_LEVEL_ORDER[level] ?? 20;
  if (lvl >= cur) {
    // eslint-disable-next-line no-console
    (console[level] || console.log)(meta ? msg : `[videoMapping] ${msg}`, meta || undefined);
  }
}

const VIDEO_BASE = '/assets/video/mp4';
const THUMB_BASE = '/assets/video/thumb';
const CAPTIONS_VTT_BASE = '/assets/captions';

// Aliases mentioned in requirements for seven topics
const KNOWN_ALIAS_SLUGS = [
  'quick-inbox-zero',
  'focus-sprints',
  'g-m-a-formula',
  'five-minute-map',
  '4-4-6-reset',
  'memory-ladder',
  'micro-leadership-tips',
];

// PUBLIC_INTERFACE
export function toVideoSlug(str) {
  /** Create a canonical slug from a free-form string for video assets. */
  if (!str) return '';
  const lower = String(str).toLowerCase().trim();
  const collapsed = lower.replace(/\s+/g, ' ');
  const noAccents = collapsed.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleaned = noAccents.replace(/[^a-z0-9 -]/g, '');
  const dashed = cleaned.replace(/\s+/g, '-').replace(/-+/g, '-');
  return dashed.replace(/^-+/, '').replace(/-+$/, '');
}

let ENV_TITLE_TO_SLUG = {};
try {
  if (process.env.REACT_APP_VIDEO_TITLE_MAP) {
    ENV_TITLE_TO_SLUG = JSON.parse(process.env.REACT_APP_VIDEO_TITLE_MAP);
  }
} catch (e) {
  vlog('warn', '[videoMapping] Failed to parse REACT_APP_VIDEO_TITLE_MAP; ignoring.', { error: String(e) });
}

// Default title to slug mappings per task instructions
const DEFAULT_TITLE_TO_SLUG = {
  'Inbox Zero in Minutes': 'quick-inbox-zero',
  'Inbox Zero': 'quick-inbox-zero',
  'Focus Sprints': 'focus-sprints',
  'G-M-A Formula': 'g-m-a-formula',
  'Five-Minute Map': 'five-minute-map',
  '60-Second Focus Reset': '4-4-6-reset',
  'The 4-4-6 Reset': '4-4-6-reset',
  'Memory Ladder': 'memory-ladder',
  'Micro Leadership Tips': 'micro-leadership-tips',
};
const TITLE_TO_SLUG = { ...DEFAULT_TITLE_TO_SLUG, ...ENV_TITLE_TO_SLUG };

async function headExists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

// Probe with HEAD -> GET Range -> GET
async function probeFirstExists(urls) {
  for (const u of urls) {
    if (await headExists(u)) return u;
    try {
      const resRange = await fetch(u, { method: 'GET', headers: { Range: 'bytes=0-256' }, cache: 'no-store' });
      if (resRange.ok || resRange.status === 206) return u;
    } catch { /* ignore */ }
    try {
      const res = await fetch(u, { method: 'GET', cache: 'no-store' });
      if (res.ok) return u;
    } catch { /* ignore */ }
  }
  return null;
}

/**
 * PUBLIC_INTERFACE
 * mapLessonToVideo
 * Resolves the lesson to a video file, poster thumbnail, and optional captions .vtt based on title -> slug resolution.
 * Returns { slug, videoUrl, posterUrl, captionsVttUrl }
 */
export async function mapLessonToVideo(lesson) {
  const title = lesson?.title || '';
  const id = lesson?.id || '';
  const registrySlug = TITLE_TO_SLUG[title] || TITLE_TO_SLUG[title.trim()] || null;
  const autoSlug = toVideoSlug(title);
  const idSlug = toVideoSlug(id);

  // Candidate slugs by priority
  const candidateSlugs = [];
  const pushUnique = (s) => { if (s && !candidateSlugs.includes(s)) candidateSlugs.push(s); };
  pushUnique(registrySlug);
  pushUnique(autoSlug);
  pushUnique(idSlug);
  KNOWN_ALIAS_SLUGS.forEach(pushUnique);

  // Video and poster candidates
  const videoCandidates = candidateSlugs.map((s) => `${VIDEO_BASE}/${s}.mp4`);
  const thumbCandidates = candidateSlugs.flatMap((s) => [
    `${THUMB_BASE}/${s}.jpg`,
    `${THUMB_BASE}/${s}.png`,
  ]);
  const captionsCandidates = candidateSlugs.map((s) => `${CAPTIONS_VTT_BASE}/${s}.vtt`);

  vlog('debug', '[videoMapping] Probing video/thumb/captions candidates', {
    id, title, candidateSlugs, videoCandidates, thumbCandidates, captionsCandidates
  });

  const [videoUrl, posterUrl, captionsVttUrl] = await Promise.all([
    probeFirstExists(videoCandidates),
    probeFirstExists(thumbCandidates),
    probeFirstExists(captionsCandidates),
  ]);

  if (!videoUrl) {
    vlog('info', '[videoMapping] No video found; UI should fall back to audio', { id, title, autoSlug, registrySlug });
  } else {
    vlog('debug', '[videoMapping] Resolved video asset', { id, title, slug: registrySlug || autoSlug || idSlug, videoUrl, posterUrl, captionsVttUrl });
  }

  return {
    slug: registrySlug || autoSlug || idSlug || '',
    videoUrl,
    posterUrl,
    captionsVttUrl,
  };
}

/**
 * PUBLIC_INTERFACE
 * attachVideoToLesson
 * Convenience: given a lesson object, return a new object with videoUrl/thumbnail resolved if missing.
 */
export async function attachVideoToLesson(lesson) {
  if (!lesson) return lesson;
  const hasVideo = !!lesson.videoUrl;
  const hasThumb = !!lesson.thumbnail;
  if (hasVideo && hasThumb) return lesson;
  const resolved = await mapLessonToVideo(lesson);
  return {
    ...lesson,
    videoUrl: lesson.videoUrl || resolved.videoUrl || null,
    thumbnail: lesson.thumbnail || resolved.posterUrl || null,
    _videoSlug: resolved.slug,
    _captionsVttUrl: resolved.captionsVttUrl || null,
  };
}
