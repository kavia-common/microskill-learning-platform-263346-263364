import React, { useRef, useEffect, useState } from 'react';
import '../lms.css';
import { inferFallbackCaptionLines } from '../utils/audioMapping';
import { enforceSinglePlayback, globalAudioManager } from '../utils/audioManager';
import { loadSettings } from '../utils/settings';
import CaptionOverlay from './CaptionOverlay';
import { addGlobalToast } from '../ui/ToastHost';

/**
 * PUBLIC_INTERFACE
 * LessonCard shows a single autoplaying video lesson with overlay and audio/captions.
 */
export default function LessonCard({ lesson, active, onQuiz, onWatched }) {
  /**
   * Renders a lesson card with video background and audio voiceover.
   * - Audio autoplay when active in viewport (if enabled in settings), pauses when out.
   * - Captions overlay if available or derived.
   * - Reports watched after threshold time.
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

  const watchThreshold = Math.min(lesson.durationSeconds || 45, 20); // seconds to consider watched

  useEffect(() => {
    // refresh settings each mount in case user changed it
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function resolveAndLoad() {
      setResolving(true);
      try {
        const r = await globalAudioManager.resolveForLesson(lesson);
        if (cancelled) return;
        setResolved(r);
        setAudioAvailable(Boolean(r.audioUrl));
        // Load captions JSON if discovered; else derive from text or summary
        if (r.captionsUrl) {
          try {
            const res = await fetch(r.captionsUrl, { cache: 'no-store' });
            if (res.ok) {
              const data = await res.json();
              const cues = Array.isArray(data) ? data : (data?.cues || []);
              setCaptions(cues);
              setCaptionsAvailable(cues.length > 0);
            } else {
              throw new Error('not ok');
            }
          } catch {
            const lines = inferFallbackCaptionLines(lesson);
            setCaptions(lines.map((t, i) => ({ start: i * 3, end: i * 3 + 2.8, text: t })));
            setCaptionsAvailable(lines.length > 0);
          }
        } else if (r.textUrl) {
          try {
            const res = await fetch(r.textUrl, { cache: 'no-store' });
            if (res.ok) {
              const txt = await res.text();
              const lines = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0, 30);
              const cues = lines.map((t, i) => ({ start: i * 3, end: i * 3 + 2.8, text: t }));
              setCaptions(cues);
              setCaptionsAvailable(cues.length > 0);
            } else {
              throw new Error('not ok');
            }
          } catch {
            const lines = inferFallbackCaptionLines(lesson);
            setCaptions(lines.map((t, i) => ({ start: i * 3, end: i * 3 + 2.8, text: t })));
            setCaptionsAvailable(lines.length > 0);
          }
        } else {
          const lines = inferFallbackCaptionLines(lesson);
          setCaptions(lines.map((t, i) => ({ start: i * 3, end: i * 3 + 2.8, text: t })));
          setCaptionsAvailable(lines.length > 0);
        }
      } finally {
        if (!cancelled) setResolving(false);
      }
    }
    resolveAndLoad();
    return () => { cancelled = true; };
  }, [lesson]);

  useEffect(() => {
    setAudioAvailable(Boolean(resolved.audioUrl));
  }, [resolved]);

  // Viewport active => play/pause
  useEffect(() => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v) return;

    if (active) {
      v.play().catch(() => {});
      if (a && settings.audioOn && settings.autoplayOn && audioAvailable) {
        setBuffering(true);
        enforceSinglePlayback(a, true);
        a.muted = settings.mutedByDefault;
        a.play().catch(() => {
          // Likely blocked by browser policy or missing file
          setError('Audio playback failed');
          addGlobalToast({ type: 'error', message: 'Audio playback failed' });
        }).finally(() => setBuffering(false));
      }
    } else {
      v.pause();
      if (a) {
        try { a.pause(); } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, settings, audioAvailable]);

  // Watched threshold reporting based on video clock if present, else audio
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
      // captions tick
      if (captions && (settings.captionsOn)) {
        const cue = captions.find((c) => t >= (c.start || 0) && t <= (c.end ?? (c.start || 0) + 2));
        setCurrentCaption(cue?.text || '');
      }
    };

    const src = v || a;
    if (!src) return;
    src.addEventListener('timeupdate', tick);
    return () => src.removeEventListener('timeupdate', tick);
  }, [lesson?.id, watchThreshold, onWatched, captions, settings.captionsOn]);

  // Audio event handlers
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onError = () => {
      setError('Audio failed to load');
      setBuffering(false);
      addGlobalToast({ type: 'error', message: 'Audio failed to load' });
    };
    a.addEventListener('waiting', onWaiting);
    a.addEventListener('playing', onPlaying);
    a.addEventListener('stalled', onWaiting);
    a.addEventListener('error', onError);
    return () => {
      a.removeEventListener('waiting', onWaiting);
      a.removeEventListener('playing', onPlaying);
      a.removeEventListener('stalled', onWaiting);
      a.removeEventListener('error', onError);
    };
  }, []);

  const quizCta = lesson?.cta === 'Start Lesson' ? 'Start Lesson' : 'Take Quiz';

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !a.muted;
    setSettings((s) => ({ ...s, mutedByDefault: a.muted }));
  };

  return (
    <div className="lesson-card" aria-label={`Lesson ${lesson.title}`}>
      <video
        ref={videoRef}
        src={lesson.videoUrl}
        muted
        playsInline
        preload="metadata"
        aria-label="Background lesson video"
      />
      {/* Audio voiceover - hidden controls; show mute button separately.
          Only render when resolved and available. */}
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
          {(resolving || buffering) && <span style={{ color: 'var(--muted)', fontSize: 12 }}>Loading audio…</span>}
          {error && <span style={{ color: '#EF4444', fontSize: 12 }}>Audio error</span>}
        </div>
      </div>
      <CaptionOverlay text={currentCaption} visible={settings.captionsOn && captionsAvailable} />
    </div>
  );
}
