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
- Optional captions JSON in `public/assets/audio/captions/`

### File naming convention

- Audio: `<lesson-id>.mp3` (e.g., `focus-60.mp3`)
- Captions: `<lesson-id>.captions.json` (array of cues or `{ "cues": [...] }`)
  - Cue shape: `{ "start": numberSeconds, "end": numberSeconds, "text": "sentence" }`

### Mapping lessons to audio/captions

Update `src/utils/audioMapping.js`:
- `ID_TO_FILE` maps lesson IDs to MP3 filenames
- `ID_TO_CAPTIONS` maps lesson IDs to captions filenames

If captions JSON is missing, the app will derive short cues from the lesson description/summary as a fallback.

### Settings

Users can toggle:
- Audio On/Off
- Captions On/Off
- Autoplay On/Off

These controls are available in the Navbar and persist in `localStorage`.

### Progressive enhancement

- If an audio file is missing, the card/player hides audio controls automatically.
- If captions are unavailable, the overlay is hidden.

### Accessibility

- Captions are rendered in a `aria-live="polite"` overlay.
- Keyboard support for toggles and buttons is enabled.
- Focus-visible styles rely on browser defaults; customize via CSS if needed.

### Playback behavior

- Only one audio voiceover plays at a time across the feed.
- Audio autoplays when the card is visible (if Autoplay is on); pauses when out of view.
- A small buffering indicator shows when audio is loading.

### Errors

- Load/playback errors show a small toast message at the bottom of the screen.

