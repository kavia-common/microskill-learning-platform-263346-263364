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
      const p = v.play();
      if (p && typeof p.then === 'function') {
        p.catch((e) => {
          // Autoplay policy or network issue
          const t = String(e || '').toLowerCase();
          const isPolicy = t.includes('user') || t.includes('gesture') || t.includes('autoplay');
          const msg = isPolicy
            ? 'Autoplay blocked. Press play to start video, or use audio + captions.'
            : 'Video failed to start. Falling back to audio + captions.';
          addGlobalToast({ type: 'error', message: msg });
        });
      }
      // Attach error listeners to detect network stalls
      const onError = () => addGlobalToast({ type: 'error', message: 'Video failed to load. You can still use audio and captions.' });
      v.addEventListener('error', onError);
      return () => {
        v.removeEventListener('error', onError);
      };
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
              const text = await res.text();
              // If content-type is JSON or looks like JSON, parse as cues
              const trimmed = text.trim();
              if ((trimmed.startsWith('{') || trimmed.startsWith('['))) {
                try {
                  const data = JSON.parse(trimmed);
                  const cues = Array.isArray(data) ? data : (data?.cues || []);
                  if (cues.length) { setCaptions(cues); return; }
                } catch { /* fall back to VTT parse */ }
              }
              const lines = text
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
              if (cues.length > 0) { setCaptions(cues); return; }
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

  const showCaptionsOnlyHint = !videoSrc && !audioAvailable && (captions?.length > 0);

  return (
    <div style={{ position: 'relative' }}>
      {videoSrc ? (
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
      ) : (
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)'
        }}>
          {audioAvailable ? 'Audio + captions will play without video.' : (showCaptionsOnlyHint ? 'Captions-only view (video/audio missing)' : 'Waiting for media…')}
        </div>
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
