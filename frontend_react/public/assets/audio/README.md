# Micro‑Lessons Voiceover Assets

This folder contains production‑ready SSML files and matching plain‑text scripts for seven micro‑lessons. They are formatted for Amazon Polly Neural TTS.

- Voice: Joanna (en‑US)
- Prosody: rate +5%, pitch +2%, volume default
- Structure: Sentence‑level breaks, emphasis on key terms, short pauses between beats
- Files:
  - ssml/lesson-1-inbox-zero.ssml
  - ssml/lesson-2-two-minute-rule.ssml
  - ssml/lesson-3-clear-ask.ssml
  - ssml/lesson-4-60-second-focus.ssml
  - ssml/lesson-5-feedback-fast.ssml
  - ssml/lesson-6-make-it-obvious.ssml
  - ssml/lesson-7-micro-leadership.ssml
  - text/lesson-*.txt (exact VO lines without SSML tags)

Synthesis notes:
- SSML files are Amazon Polly compatible and include <speak> root, <prosody>, <break>, <emphasis>, and <amazon:effect> where helpful.
- Use Neural engine for higher quality.

Quick start with AWS CLI (Polly):
1) Ensure AWS credentials are configured in your environment. Do NOT hardcode secrets; use your profile or env vars.
2) Synthesize an MP3 for a lesson (example for lesson 1):

aws polly synthesize-speech \
  --engine neural \
  --voice-id Joanna \
  --output-format mp3 \
  --text-type ssml \
  --text file://ssml/lesson-1-inbox-zero.ssml \
  lesson-1-inbox-zero.mp3

3) Repeat for each SSML file. Output formats supported: mp3, ogg_vorbis, pcm.

Tips:
- Keep output files alongside this folder or in a sibling build/audio directory.
- If adjusting pacing, tweak <break time="...ms"/> and prosody rate values slightly (+3% to +8%) then re-render.

Attribution:
- Scripts aligned to the dummy lessons included in src/data/dummyLessons.js, adapted for VO clarity and timing.

