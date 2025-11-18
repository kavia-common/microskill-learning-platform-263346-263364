import React, { useRef, useEffect, useState } from 'react';
import '../lms.css';
import { inferFallbackCaptionLines } from '../utils/audioMapping';
import { enforceSinglePlayback, globalAudioManager } from '../utils/audioManager';
import { loadSettings } from '../utils/settings';
import CaptionOverlay from './CaptionOverlay';
import { addGlobalToast } from '../ui/ToastHost';
import { mapLessonToVideo } from '../utils/videoMapping';

/**
 * PUBLIC_INTERFACE
 * LessonCard shows a single autoplaying video lesson with overlay and audio/captions.
 */
export default function LessonCard({ lesson, active, onQuiz, onWatched }) {
  /**
   * Renders a lesson card that prefers video + captions, with audio voiceover as fallback/secondary.
   * - Video autoplays muted, loops, and playsInline when card is active.
   * - Captions overlay from WebVTT if available, else from audio JSON/text fallback.
   * - If video fails to load, show toast and continue with audio+captions only.
   * - Only one audio element plays at a time across feed (enforced via audioManager).
   */
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [settings, setSettings] = useState(loadSettings());
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(null);
  const [captions, setCaptions] = useState(null);
  const [currentCaption, setCurrentCaption] = useState('');
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [captionsAvailable, setCaptionsAvailable] = useState(false);
  const [resolving, setResolving] = useState(true);
  const [resolved, setResolved] = useState({ audioUrl: null, captionsUrl: null, textUrl: null, ssmlUrl: null, slug: '' });
  const [videoResolved, setVideoResolved] = useState({ slug: '', videoUrl: null, posterUrl: null, captionsVttUrl: null });

  const watchThreshold = Math.min(lesson.durationSeconds || 45, 20); // seconds to consider watched

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Resolve video and audio/captions
  useEffect(() => {
    let cancelled = false;
    async function resolveAll() {
      setResolving(true);
      try {
        const [videoR, audioR] = await Promise.all([
          mapLessonToVideo(lesson),
          globalAudioManager.resolveForLesson(lesson),
        ]);
        if (cancelled) return;
        setVideoResolved(videoR);
        setResolved(audioR);
        setAudioAvailable(Boolean(audioR.audioUrl));

        // Captions priority: VTT from video mapping -> audio captions JSON -> audio text -> fallback summary
        if (videoR.captionsVttUrl) {
          try {
            // Parse minimal VTT into cues: we will not fully parse; approximate by timing-less lines
            const res = await fetch(videoR.captionsVttUrl, { cache: 'no-store' });
            if (res.ok) {
              const vtt = await res.text();
              // naive segmentation: split on blank lines, ignore VTT headers; no timings => we use incremental 3s windows
              const lines = vtt
                .split(/\r?\n/)
                .map(s => s.trim())
                .filter(Boolean)
                .filter((s) => !/^WEBVTT/i.test(s) && !/^\d{2}:\d{2}/.test(s)); // drop header and timestamp lines for simplicity
              const cues = lines.slice(0, 30).map((t, i) => ({ start: i * 3, end: i * 3 + 2.8, text: t }));
              setCaptions(cues);
              setCaptionsAvailable(cues.length > 0);
              return;
            }
          } catch { /* fallback below */ }
        }

        if (audioR.captionsUrl) {
          try {
            const res = await fetch(audioR.captionsUrl, { cache: 'no-store' });
            if (res.ok) {
              const data = await res.json();
              const cues = Array.isArray(data) ? data : (data?.cues || []);
              setCaptions(cues);
              setCaptionsAvailable(cues.length > 0);
              return;
            }
          } catch { /* fallback to text */ }
        }
        if (audioR.textUrl) {
          try {
            const res = await fetch(audioR.textUrl, { cache: 'no-store' });
            if (res.ok) {
              const txt = await res.text();
              const lines = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0, 30);
              const cues = lines.map((t, i) => ({ start: i * 3, end: i * 3 + 2.8, text: t }));
              setCaptions(cues);
              setCaptionsAvailable(cues.length > 0);
              return;
            }
          } catch { /* fall through */ }
        }
        const lines = inferFallbackCaptionLines(lesson);
        setCaptions(lines.map((t, i) => ({ start: i * 3, end: i * 3 + 2.8, text: t })));
        setCaptionsAvailable(lines.length > 0);
      } finally {
        if (!cancelled) setResolving(false);
      }
    }
    resolveAll();
    return () => { cancelled = true; };
  }, [lesson]);

  useEffect(() => {
    setAudioAvailable(Boolean(resolved.audioUrl));
  }, [resolved]);

  // Active state controls media playback
  useEffect(() => {
    const v = videoRef.current;
    const a = audioRef.current;

    if (active) {
      if (v) {
        v.loop = true;
        v.muted = true; // respect autoplay policy
        v.play().catch((e) => {
          // Non-blocking: toast and rely on audio fallback if exists
          addGlobalToast({ type: 'error', message: 'Video failed to play. Falling back to audio.' });
        });
      }
      if (a && settings.audioOn && settings.autoplayOn && audioAvailable) {
        setBuffering(true);
        try {
          enforceSinglePlayback(a, true);
          a.muted = settings.mutedByDefault !== false;
          const p = a.play();
          if (p && typeof p.then === 'function') {
            p.then(() => setError(null)).catch((e) => {
              const txt = String(e || '').toLowerCase();
              const isPolicy = txt.includes('user interaction') || txt.includes('autoplay');
              const msg = isPolicy ? 'Autoplay blocked. Tap Unmute to start audio.' : 'Audio playback failed';
              setError(msg);
              addGlobalToast({ type: 'error', message: msg });
            }).finally(() => setBuffering(false));
          } else {
            setBuffering(false);
          }
        } catch {
          setBuffering(false);
          setError('Audio playback failed');
          addGlobalToast({ type: 'error', message: 'Audio playback failed' });
        }
      }
    } else {
      if (v) { try { v.pause(); } catch {} }
      if (a) { try { a.pause(); } catch {} }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, settings, audioAvailable]);

  // Timeupdate -> captions + watched threshold (prefer video clock)
  useEffect(() => {
    const v = videoRef.current;
    const a = audioRef.current;
    let watchedReported = false;

    const tick = () => {
      const t = v?.currentTime ?? a?.currentTime ?? 0;
      if (!watchedReported && t >= watchThreshold) {
        watchedReported = true;
        onWatched?.(lesson.id);
      }
      if (captions && settings.captionsOn) {
        const cue = captions.find((c) => t >= (c.start || 0) && t <= (c.end ?? (c.start || 0) + 2));
        setCurrentCaption(cue?.text || '');
      }
    };

    const src = v || a;
    if (!src) return;
    src.addEventListener('timeupdate', tick);
    return () => src.removeEventListener('timeupdate', tick);
  }, [lesson?.id, watchThreshold, onWatched, captions, settings.captionsOn]);

  // Audio element lifecycle
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoadedMetadata = () => setBuffering(false);
    const onCanPlay = () => setBuffering(false);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onPause = () => setBuffering(false);
    const onError = () => {
      setError('Audio failed to load');
      setBuffering(false);
      addGlobalToast({ type: 'error', message: 'Audio failed to load' });
    };
    globalAudioManager.register(a, false);
    a.addEventListener('loadedmetadata', onLoadedMetadata);
    a.addEventListener('canplay', onCanPlay);
    a.addEventListener('waiting', onWaiting);
    a.addEventListener('playing', onPlaying);
    a.addEventListener('pause', onPause);
    a.addEventListener('stalled', onWaiting);
    a.addEventListener('error', onError);
    return () => {
      a.removeEventListener('loadedmetadata', onLoadedMetadata);
      a.removeEventListener('canplay', onCanPlay);
      a.removeEventListener('waiting', onWaiting);
      a.removeEventListener('playing', onPlaying);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('stalled', onWaiting);
      a.removeEventListener('error', onError);
      globalAudioManager.unregister(a);
    };
  }, [resolved.audioUrl]);

  const quizCta = lesson?.cta === 'Start Lesson' ? 'Start Lesson' : 'Take Quiz';

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !a.muted;
    setSettings((s) => ({ ...s, mutedByDefault: a.muted }));
    if (!a.muted && a.paused) {
      a.play().catch(() => addGlobalToast({ type: 'error', message: 'Unable to start audio. Check browser autoplay settings.' }));
    }
  };

  // Determine active media URLs with auto-resolution fallback
  const videoSrc = lesson.videoUrl || videoResolved.videoUrl || null;
  const poster = lesson.thumbnail || videoResolved.posterUrl || undefined;

  return (
    <div className="lesson-card" aria-label={`Lesson ${lesson.title}`}>
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Background lesson video"
          onError={() => {
            addGlobalToast({ type: 'error', message: 'Video failed to load. Falling back to audio.' });
          }}
        />
      )}
      {/* Audio voiceover - hidden controls; show mute button separately. */}
      {resolved.audioUrl && settings.audioOn && (
        <audio
          ref={audioRef}
          src={resolved.audioUrl}
          preload="metadata"
          aria-hidden="true"
        />
      )}
      <div className="lesson-overlay">
        <div className="title">{lesson.title}</div>
        <div className="summary">{lesson.summary}</div>
        <div className="buttons" style={{ alignItems: 'center' }}>
          <button className="btn primary" onClick={() => onQuiz?.(lesson)} aria-label={quizCta}>{quizCta}</button>
          {resolved.audioUrl && settings.audioOn && (
            <button className="btn" onClick={toggleMute} aria-label="Toggle mute/unmute" title="Mute/Unmute">
              {audioRef.current?.muted ?? settings.mutedByDefault ? 'Unmute' : 'Mute'}
            </button>
          )}
          {(resolving || buffering) && <span style={{ color: 'var(--muted)', fontSize: 12 }}>Loading media…</span>}
          {error && <span style={{ color: '#EF4444', fontSize: 12 }}>Audio error</span>}
        </div>
      </div>
      <CaptionOverlay text={currentCaption} visible={settings.captionsOn && captionsAvailable} />
    </div>
  );
}
