import React, { useRef, useEffect, useState } from 'react';
import CaptionOverlay from './CaptionOverlay';
import { getAudioUrlForLesson, getCaptionsUrlForLesson, inferFallbackCaptionLines } from '../utils/audioMapping';
import { loadSettings } from '../utils/settings';
import { addGlobalToast } from '../ui/ToastHost';

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

  const audioUrl = lesson ? getAudioUrlForLesson(lesson) : null;
  const captionsUrl = lesson ? getCaptionsUrlForLesson(lesson) : null;

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.play().catch(() => {});
  }, [src]);

  useEffect(() => {
    setAudioAvailable(Boolean(audioUrl));
  }, [audioUrl]);

  useEffect(() => {
    let cancelled = false;
    async function loadCaptions() {
      try {
        if (captionsUrl) {
          const res = await fetch(captionsUrl, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (!cancelled) {
              const cues = Array.isArray(data) ? data : (data?.cues || []);
              setCaptions(cues);
              return;
            }
          }
        }
      } catch {
        // ignore
      }
      const lines = lesson ? inferFallbackCaptionLines(lesson) : [];
      setCaptions(
        lines.map((t, i) => ({ start: i * 3, end: i * 3 + 2.8, text: t }))
      );
    }
    loadCaptions();
    return () => { cancelled = true; };
  }, [captionsUrl, lesson]);

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
          src={audioUrl}
          preload="metadata"
          onError={onAudioError}
          aria-hidden="true"
        />
      )}
      <CaptionOverlay text={currentCaption} visible={settings.captionsOn} />
    </div>
  );
}
