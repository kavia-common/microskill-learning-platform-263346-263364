import React, { useRef, useEffect, useState } from 'react';
import CaptionOverlay from './CaptionOverlay';
import { inferFallbackCaptionLines } from '../utils/audioMapping';
import { loadSettings } from '../utils/settings';
import { addGlobalToast } from '../ui/ToastHost';
import { globalAudioManager } from '../utils/audioManager';
import { mapLessonToVideo } from '../utils/videoMapping';

/**
 * PUBLIC_INTERFACE
 * LessonPlayer renders a video with optional audio voiceover and captions.
 */
export default function LessonPlayer({ src, poster, lesson }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [settings] = useState(loadSettings());
  const [captions, setCaptions] = useState(null);
  const [currentCaption, setCurrentCaption] = useState('');
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [resolved, setResolved] = useState({ audioUrl: null, captionsUrl: null, textUrl: null, ssmlUrl: null, slug: '' });
  const [videoResolved, setVideoResolved] = useState({ slug: '', videoUrl: null, posterUrl: null, captionsVttUrl: null });

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.muted = true; // respect autoplay policy; user can unmute audio track if needed (separate)
      v.play().catch(() => {});
    }
  }, [src]);

  useEffect(() => {
    setAudioAvailable(Boolean(resolved.audioUrl));
  }, [resolved]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onError = () => onAudioError();
    globalAudioManager.register(a, false);
    a.addEventListener('error', onError);
    return () => {
      a.removeEventListener('error', onError);
      globalAudioManager.unregister(a);
    };
  }, [resolved.audioUrl]);

  useEffect(() => {
    let cancelled = false;
    async function resolveAndLoad() {
      try {
        if (!lesson) return;
        const [vid, r] = await Promise.all([
          mapLessonToVideo(lesson),
          globalAudioManager.resolveForLesson(lesson),
        ]);
        if (cancelled) return;
        setVideoResolved(vid);
        setResolved(r);

        // captions priority: video VTT -> audio captions JSON -> audio text -> fallback
        if (vid.captionsVttUrl) {
          try {
            const res = await fetch(vid.captionsVttUrl, { cache: 'no-store' });
            if (res.ok) {
              const vtt = await res.text();
              const lines = vtt
                .split(/\r?\n/)
                .map(s => s.trim())
                .filter(Boolean)
                .filter((s) => !/^WEBVTT/i.test(s) && !/^\d{2}:\d{2}/.test(s));
              const cues = lines.slice(0, 30).map((t, i) => ({ start: i * 3, end: i * 3 + 2.8, text: t }));
              setCaptions(cues);
              return;
            }
          } catch { /* fallback chain */ }
        }
        if (r.captionsUrl) {
          try {
            const res = await fetch(r.captionsUrl, { cache: 'no-store' });
            if (res.ok) {
              const data = await res.json();
              const cues = Array.isArray(data) ? data : (data?.cues || []);
              setCaptions(cues);
              return;
            }
          } catch { /* next */ }
        }
        if (r.textUrl) {
          try {
            const res = await fetch(r.textUrl, { cache: 'no-store' });
            if (res.ok) {
              const txt = await res.text();
              const lines = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0, 30);
              const cues = lines.map((t, i) => ({ start: i * 3, end: i * 3 + 2.8, text: t }));
              setCaptions(cues);
              return;
            }
          } catch { /* next */ }
        }
        const lines = lesson ? inferFallbackCaptionLines(lesson) : [];
        setCaptions(lines.map((t, i) => ({ start: i * 3, end: i * 3 + 2.8, text: t })));
      } finally {
        // no busy flag shown in detail; UI remains responsive
      }
    }
    resolveAndLoad();
    return () => { cancelled = true; };
  }, [lesson]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tick = () => {
      if (captions && settings.captionsOn) {
        const t = v.currentTime;
        const cue = captions.find((c) => t >= (c.start || 0) && t <= (c.end ?? (c.start || 0) + 2));
        setCurrentCaption(cue?.text || '');
      }
    };
    v.addEventListener('timeupdate', tick);
    return () => v.removeEventListener('timeupdate', tick);
  }, [captions, settings.captionsOn]);

  const onAudioError = () => addGlobalToast({ type: 'error', message: 'Audio failed to load' });

  const videoSrc = src || videoResolved.videoUrl || null;
  const posterSrc = poster || videoResolved.posterUrl || undefined;

  return (
    <div style={{ position: 'relative' }}>
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          muted
          playsInline
          controls
          style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)' }}
          onError={() => addGlobalToast({ type: 'error', message: 'Video failed to load. You can still use audio and captions.' })}
        />
      )}
      {audioAvailable && settings.audioOn && (
        <audio
          ref={audioRef}
          src={resolved.audioUrl}
          preload="metadata"
          onError={onAudioError}
          aria-hidden="true"
        />
      )}
      <CaptionOverlay text={currentCaption} visible={settings.captionsOn} />
    </div>
  );
}
