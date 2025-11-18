import React, { useRef, useEffect, useState } from 'react';
import CaptionOverlay from './CaptionOverlay';
import { inferFallbackCaptionLines } from '../utils/audioMapping';
import { loadSettings } from '../utils/settings';
import { addGlobalToast } from '../ui/ToastHost';
import { globalAudioManager } from '../utils/audioManager';

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
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.play().catch(() => {});
  }, [src]);

  useEffect(() => {
    setAudioAvailable(Boolean(resolved.audioUrl));
  }, [resolved]);

  useEffect(() => {
    let cancelled = false;
    async function resolveAndLoad() {
      setResolving(true);
      try {
        if (!lesson) return;
        const r = await globalAudioManager.resolveForLesson(lesson);
        if (cancelled) return;
        setResolved(r);
        // captions resolution similar to LessonCard
        if (r.captionsUrl) {
          try {
            const res = await fetch(r.captionsUrl, { cache: 'no-store' });
            if (res.ok) {
              const data = await res.json();
              const cues = Array.isArray(data) ? data : (data?.cues || []);
              setCaptions(cues);
              return;
            }
          } catch { /* fallthrough */ }
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
          } catch { /* fallthrough */ }
        }
        const lines = lesson ? inferFallbackCaptionLines(lesson) : [];
        setCaptions(lines.map((t, i) => ({ start: i * 3, end: i * 3 + 2.8, text: t })));
      } finally {
        if (!cancelled) setResolving(false);
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

  return (
    <div style={{ position: 'relative' }}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        controls
        style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)' }}
      />
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
