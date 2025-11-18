# Micro-skill LMS Frontend

React app with vertical video feed, quiz modal, and progress.

- Env: REACT_APP_API_BASE or REACT_APP_BACKEND_URL
- Start: npm install && npm start
- Routes: Single page; top right Progress toggles the view.

## AI Generation (Optional)

If the backend is running (see backend/README.md), you can:
- Create -> Create (AI): open the Creator Generate screen to input Topic/Audience/Tone and call /api/generate-lesson.
- In lesson detail: use "Generate Media (AI)" to call /api/generate-media and render local MP4 + WebVTT under /assets/.
The Home Feed and Lesson Detail will automatically map generated assets by slug (derived from the title). The UI gracefully falls back to captions-only if video is still processing.

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

## Video Lessons, Thumbnails, and Captions (Preferred)

The feed and lesson pages now prioritize topic-relevant video playback with captions. Place assets under:

- MP4 videos: `public/assets/video/mp4/{slug}.mp4`
- Thumbnails: `public/assets/video/thumb/{slug}.jpg|png`
- WebVTT captions: `public/assets/captions/{slug}.vtt`

At runtime these are served from `/assets/video/mp4/`, `/assets/video/thumb/`, and `/assets/captions/`.

### Canonical slugs and mapping

Lessons map to assets by a canonical slug derived from the lesson title:

Slug rules:
- lowercase, trim, collapse whitespace
- remove accents/diacritics
- remove non-alphanumerics (letters and digits preserved)
- replace spaces with dashes, collapse multiple dashes

In addition to the auto slug, the resolver tries:
- Title variants registry (defaults listed below)
- `lesson.id` as a candidate slug
- Known aliases: `quick-inbox-zero`, `focus-sprints`, `g-m-a-formula`, `five-minute-map`, `4-4-6-reset`, `memory-ladder`, `micro-leadership-tips`

You can override or extend title -> slug mapping with:

- `REACT_APP_VIDEO_TITLE_MAP` (JSON string)
- `REACT_APP_AUDIO_TITLE_MAP` (for audio; same format)

Example:
```
REACT_APP_VIDEO_TITLE_MAP={"Inbox Zero":"quick-inbox-zero","Focus Sprints":"focus-sprints"}
```

These overrides merge on top of defaults; no secrets are stored in code.

### Topic-appropriate filenames (seven lessons)

Provide these video filenames to match included lessons:

- quick-inbox-zero.mp4
- focus-sprints.mp4
- g-m-a-formula.mp4
- five-minute-map.mp4
- 4-4-6-reset.mp4
- memory-ladder.mp4
- micro-leadership-tips.mp4

Optional thumbnails:
- Place `jpg` or `png` with the same slug in `public/assets/video/thumb/`, e.g., `public/assets/video/thumb/quick-inbox-zero.jpg`.

Optional captions (WebVTT):
- Place `public/assets/captions/{slug}.vtt` (e.g., `/assets/captions/quick-inbox-zero.vtt`).
- If no VTT is found, the app falls back to audio captions JSON or text transcript (see Audio section), otherwise derives simple lines from the lesson summary/description.

A sample thumbnail asset has been included for reference:
- `/assets/video/thumb/sample-attachment.png`
You can map a title to this by setting `REACT_APP_VIDEO_TITLE_MAP` to point your lesson’s title to `sample-attachment` and placing a corresponding mp4 if desired.

## Quick Inbox Zero assets

This lesson is supported out of the box via the canonical slug `quick-inbox-zero`. Place assets at:

- Video (optional, preferred): `public/assets/video/mp4/quick-inbox-zero.mp4`
- Poster thumbnail (optional): `public/assets/video/thumb/quick-inbox-zero.png` or `.jpg`  
  A brand-styled template is provided here for guidance:  
  `public/assets/video/thumb/quick-inbox-zero-template.png`
- Captions (WebVTT): `public/assets/captions/quick-inbox-zero.vtt`
- Audio fallback (optional): `public/assets/audio/mp3/quick-inbox-zero.mp3`
- SSML (optional, for TTS): `public/assets/audio/ssml/quick-inbox-zero.ssml`

Mapping behavior:
- The resolvers first compute a slug from the lesson title and also check the alias registry, which includes `quick-inbox-zero`.
- The Home Feed and Lesson Detail will auto-detect the VTT captions immediately. If `quick-inbox-zero.mp4` is not present, playback will gracefully fall back to audio + captions when audio exists; if no audio exists, captions still display based on VTT (or derived text).
- You can override mappings via `REACT_APP_VIDEO_TITLE_MAP` or `REACT_APP_AUDIO_TITLE_MAP`.

Expected file lookups for this lesson:
- Video: `/assets/video/mp4/quick-inbox-zero.mp4`
- Poster: `/assets/video/thumb/quick-inbox-zero.(png|jpg)`
- Captions: `/assets/captions/quick-inbox-zero.vtt`
- Audio: `/assets/audio/mp3/quick-inbox-zero.mp3`

### Playback behavior and policies

- Home Feed cards:
  - Video auto-plays muted, loops, and is inline when card is active.
  - Only the audio voiceover is single-instance enforced across the feed.
- Lesson Detail:
  - Video auto-plays muted; user can control playback with built-in controls.
- Browser autoplay:
  - We start muted to comply with policies.
  - If autoplay is blocked, a toast suggests tapping Unmute to start audio.

### Errors and fallbacks

- If video fails to load/play, a non-blocking toast is shown and the app falls back to audio + captions automatically (if available).
- If both video and audio are unavailable, the captions overlay still shows derived text if possible.

## Audio Voiceovers & Captions (Secondary)

Video is preferred, but audio voiceovers are still supported.

- Place MP3 files in `public/assets/audio/mp3/`
- Optional SSML in `public/assets/audio/ssml/` and plain text transcripts in `public/assets/audio/text/`
- Optional captions JSON in `public/assets/audio/captions/`

Automatic title-based mapping applies as described above. If captions JSON is missing, the app derives short cues from the lesson summary/description. If no audio exists but a text transcript exists, captions are formed from the text.

Telemetry:
- `REACT_APP_LOG_LEVEL`: `debug` | `info` | `warn` | `error` (default `info`)

## Settings

Users can toggle:
- Audio On/Off
- Captions On/Off
- Autoplay On/Off

These controls are available in the Navbar and persist in `localStorage`.

## Troubleshooting

- Verify expected filenames and directories under `public/assets/`.
- Use `REACT_APP_VIDEO_TITLE_MAP` or `REACT_APP_AUDIO_TITLE_MAP` for custom mapping.
- Dev servers may not support `HEAD`; resolvers fall back to `GET Range` and then `GET`.
- If playback is blocked by autoplay policies, unmute to start playback.

Expected behavior:
- Active feed card plays video muted and attempts audio muted.
- Audio single-play enforcement across the feed.
- Captions display via VTT when available, otherwise via audio/text fallback or derived summary.
