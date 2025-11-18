# Micro-skill LMS Frontend

React app with vertical video feed, quiz modal, and progress.

- Env: REACT_APP_API_BASE or REACT_APP_BACKEND_URL
- Start: npm install && npm start
- Routes: Single page; top right Progress toggles the view.

## Dummy Content Toggle

To demo without a backend or when the API returns empty, enable the local dummy lessons:

- Set `REACT_APP_USE_DUMMY=true` in your `.env` (see `.env.example`)
- When enabled (or when the API returns an empty list), the app renders seven pre-defined micro-lessons in both:
  - A TikTok-like feed
  - A 3–4 column responsive grid (switch with the "View: Feed | Grid" toggle)

Content included:
- Lesson titles, descriptions, tags, durations, and CTAs (e.g., "Start Lesson", "Take Quiz")
- Section headings: "Welcome back", "Your Micro Skills for Today", "Continue Learning", "Popular Micro Lessons", "Recommended for You", "Productivity Essentials", "Soft Skills Boosters", "Your Saved Lessons"
- Empty states for feed/profile/saved/continue

This preserves existing API integration—dummy content only activates via the flag or empty API response.

## Audio Voiceovers & Captions

The feed and lesson pages support optional audio voiceovers with captions.

- Place MP3 files in `public/assets/audio/mp3/`
- Optional SSML in `public/assets/audio/ssml/` and plain text transcripts in `public/assets/audio/text/`
- Optional captions JSON in `public/assets/audio/captions/`

### Automatic title-based mapping

Lessons automatically map to audio and captions via a normalized slug of the lesson title.

Slug rules:
- lowercase
- trim leading/trailing spaces
- collapse internal whitespace
- remove accents/diacritics
- remove non-alphanumerics (letters and digits preserved)
- replace spaces with dashes
- collapse multiple dashes

Asset probes (first match wins):
- Audio MP3: `/assets/audio/mp3/{slug}.mp3`
- SSML: `/assets/audio/ssml/{slug}.ssml`
- Text transcript: `/assets/audio/text/{slug}.txt`
- Captions JSON: `/assets/audio/captions/{slug}.captions.json`

The resolver will also try:
- A small registry of common title variants to canonical slugs (see below)
- `lesson.id` as a candidate slug
- Known alias slugs: `quick-inbox-zero`, `focus-sprints`, `g-m-a-formula`, `five-minute-map`, `4-4-6-reset`, `memory-ladder`, `micro-leadership-tips`
- Legacy mappings by id (for backward compatibility)

If no captions JSON is found, the app derives short cues from the lesson summary/description. If no audio exists but a text transcript exists, captions are formed from the text.

### Title variants registry and environment overrides

Default registry (excerpt):
- "Inbox Zero in Minutes" -> `quick-inbox-zero`
- "Inbox Zero" -> `quick-inbox-zero`
- "60-Second Focus Reset" -> `4-4-6-reset`
- "The Two-Minute Rule" -> `two-minute-rule`
- "Make a Clear Ask" -> `clear-ask`

You can override or extend mappings via an environment variable:

- `REACT_APP_AUDIO_TITLE_MAP` (JSON string)

Example:
```
REACT_APP_AUDIO_TITLE_MAP={"Inbox Zero":"quick-inbox-zero","Focus Sprints":"focus-sprints"}
```

This is merged on top of the defaults. No secrets are stored in code; configure via `.env`.

### Telemetry

Set `REACT_APP_LOG_LEVEL` to control console logs:
- `debug` (most verbose): shows candidates and resolution results
- `info` (default): reports misses
- `warn`, `error`: reduced logs

### Settings

Users can toggle:
- Audio On/Off
- Captions On/Off
- Autoplay On/Off

These controls are available in the Navbar and persist in `localStorage`.

### Progressive enhancement and accessibility

- If audio is missing, UI hides mute controls but still shows captions if available.
- If captions are unavailable, the overlay is hidden.
- Captions are rendered in a `aria-live="polite"` overlay.
- Keyboard support for toggles and buttons is enabled.

### Playback behavior

- Only one audio voiceover plays at a time across the feed.
- Audio autoplays when the card is visible (if Autoplay is on); pauses when out of view.
- A small "Loading audio…" indicator shows during resolution/loading.

### Errors

- Load/playback errors show a small toast message at the bottom of the screen.

## Troubleshooting Audio Voiceovers

If you see "Audio playback failed" or no sound:

1) Verify asset paths
- Place files under public/assets/audio/ with these exact paths:
  - MP3: public/assets/audio/mp3/{slug}.mp3
  - Captions JSON: public/assets/audio/captions/{slug}.captions.json
  - SSML: public/assets/audio/ssml/{slug}.ssml
  - Transcript: public/assets/audio/text/{slug}.txt
- At runtime, assets are requested from:
  - /assets/audio/mp3/{slug}.mp3, etc.

2) Slug mapping rules
- Slug is derived from the lesson title:
  - lowercase
  - trim
  - collapse internal whitespace
  - remove accents/diacritics
  - remove non-alphanumerics (letters/digits kept)
  - replace spaces with dashes, collapse dashes
- Resolver will also try:
  - Title variants registry (defaults)
  - lesson.id as candidate
  - Known aliases (e.g., quick-inbox-zero)
- You can override via:
  - REACT_APP_AUDIO_TITLE_MAP='{"Inbox Zero":"quick-inbox-zero"}'

3) Dev server probing
- Some dev servers don’t allow HEAD requests. The resolver now falls back to:
  - GET with Range: bytes=0-1024
  - Then plain GET
- This makes asset existence checks work reliably in development.

4) Browser autoplay policies
- Audio autoplays muted by default.
- Click the Unmute button to enable sound (a user gesture).
- If autoplay is blocked, a toast will say: "Autoplay blocked. Tap Unmute to start audio."

5) Single-audio enforcement
- Only one lesson audio plays at a time via the global audio manager.

6) Captions
- If captions JSON is missing, the app derives short cues from description/summary.
- The overlay is non-blocking (pointer-events: none).

7) Logging & diagnostics
- Set REACT_APP_LOG_LEVEL=debug for detailed logs.
- Optionally enable REACT_APP_AUDIO_DIAGNOSTIC=true for extra diagnostics.

8) Common pitfalls
- Wrong filenames or wrong directories under public/.
- Typos in slugs; verify the expected slug in the browser console when log level is debug.
- Browser-level autoplay restrictions (use Unmute).

Expected behavior after setup:
- Active card auto-plays video muted and attempts audio muted.
- User can unmute via the toggle.
- No concurrent audio playback across cards.
- Captions display when available or derived.

