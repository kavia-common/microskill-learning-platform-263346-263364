 // PUBLIC_INTERFACE
 /**
  * Audio mapping utilities for lessons.
  * Maps lesson IDs/titles to audio MP3 assets and captions JSON if available.
  * Progressive enhancement: if audio isn't available, return nulls.
  */

const AUDIO_BASE = '/assets/audio/mp3';
const CAPTIONS_BASE = '/assets/audio/captions';

// Basic mapping by lesson id to filenames. Users can extend via README.
const ID_TO_FILE = {
  'focus-60': 'focus-60.mp3',
  'inbox-zero': 'inbox-zero.mp3',
  'clear-ask': 'clear-ask.mp3',
  'two-minute-rule': 'two-minute-rule.mp3',
  'feedback-fast': 'feedback-fast.mp3',
  'atomic-habit': 'atomic-habit.mp3',
  'async-standup': 'async-standup.mp3',
};

// Captions file naming convention: <lesson-id>.captions.json
const ID_TO_CAPTIONS = {
  'focus-60': 'focus-60.captions.json',
  'inbox-zero': 'inbox-zero.captions.json',
  'clear-ask': 'clear-ask.captions.json',
  'two-minute-rule': 'two-minute-rule.captions.json',
  'feedback-fast': 'feedback-fast.captions.json',
  'atomic-habit': 'atomic-habit.captions.json',
  'async-standup': 'async-standup.captions.json',
};

// PUBLIC_INTERFACE
export function getAudioUrlForLesson(lesson) {
  /** Return the audio URL for a lesson if mapped, else null. */
  const id = lesson?.id || '';
  const file = ID_TO_FILE[id];
  if (!file) return null;
  return `${AUDIO_BASE}/${file}`;
}

// PUBLIC_INTERFACE
export function getCaptionsUrlForLesson(lesson) {
  /** Return the captions JSON URL for a lesson if mapped, else null. */
  const id = lesson?.id || '';
  const file = ID_TO_CAPTIONS[id];
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
