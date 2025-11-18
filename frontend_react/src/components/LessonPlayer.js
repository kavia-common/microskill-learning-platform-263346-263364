import React, { useRef, useEffect, useState, useCallback } from 'react';
import CaptionOverlay from './CaptionOverlay';
import { inferFallbackCaptionLines } from '../utils/audioMapping';
import { loadSettings, runtime } from '../utils/settings';
import { addGlobalToast } from '../ui/ToastHost';
import { globalAudioManager } from '../utils/audioManager';
import { mapLessonToVideo } from '../utils/videoMapping';

/**
 * PUBLIC_INTERFACE
 * LessonPlayer renders a video with optional audio voiceover and captions.
 * Builds media URLs relative to env-driven API base (no localhost hardcoding).
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
  const [ready, setReady] = useState({ meta: false, canPlay: false });

  // Helper to prefix asset paths with API base if needed
  const withApiBase = useCallback((pathOrUrl) => {
    if (!pathOrUrl) return pathOrUrl;
    // If already absolute (http/https), return as-is
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const base = runtime.apiBase || '';
    if (!base) return pathOrUrl; // same-origin
    const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${trimmedBase}${normalizedPath}`;
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true; // respect autoplay policy
    const p = v.play();
    if (p && typeof p.then === 'function') {
      p.catch((e) => {
        const t = String(e || '').toLowerCase();
        const isPolicy = t.includes('user') || t.includes('gesture') || t.includes('autoplay');
        const msg = isPolicy
          ? 'Autoplay blocked. Press play to start video, or use audio + captions.'
          : 'Video failed to start. Falling back to audio + captions.';
        addGlobalToast({ type: 'error', message: msg });
      });
    }
    const onError = () => addGlobalToast({
      type: 'error',
      message: 'Video failed to load. Check your connection and try again. You can still use audio and captions.',
    });
    const onLoadedMetadata = () => setReady((s) => ({ ...s, meta: true }));
    const onCanPlay = () => setReady((s) => ({ ...s, canPlay: true }));
    v.addEventListener('error', onError);
    v.addEventListener('loadedmetadata', onLoadedMetadata);
    v.addEventListener('canplay', onCanPlay);
    return () => {
      v.removeEventListener('error', onError);
      v.removeEventListener('loadedmetadata', onLoadedMetadata);
      v.removeEventListener('canplay', onCanPlay);
    };
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

        // Apply API base prefix for assets that are relative paths
        const prefixedVid = {
          ...vid,
          videoUrl: withApiBase(vid.videoUrl),
          posterUrl: withApiBase(vid.posterUrl),
          captionsVttUrl: withApiBase(vid.captionsVttUrl),
        };
        const prefixedAudio = {
          audioUrl: withApiBase(r.audioUrl),
          captionsUrl: withApiBase(r.captionsUrl),
          textUrl: withApiBase(r.textUrl),
          ssmlUrl: withApiBase(r.ssmlUrl),
          slug: r.slug || '',
        };

        setVideoResolved(prefixedVid);
        setResolved(prefixedAudio);

        // captions priority: video VTT -> audio captions JSON -> audio text -> fallback
        if (prefixedVid.captionsVttUrl) {
          try {
            const res = await fetch(prefixedVid.captionsVttUrl, { cache: 'no-store' });
            if (res.ok) {
              const text = await res.text();
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
        if (prefixedAudio.captionsUrl) {
          try {
            const res = await fetch(prefixedAudio.captionsUrl, { cache: 'no-store' });
            if (res.ok) {
              const data = await res.json();
              const cues = Array.isArray(data) ? data : (data?.cues || []);
              if (cues.length > 0) { setCaptions(cues); return; }
            }
          } catch { /* next */ }
        }
        if (prefixedAudio.textUrl) {
          try {
            const res = await fetch(prefixedAudio.textUrl, { cache: 'no-store' });
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
  }, [lesson, withApiBase]);

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

  const onAudioError = () => addGlobalToast({
    type: 'error',
    message: 'Audio failed to load. Check your connection or try reloading the page.',
  });

  const videoSrc = withApiBase(src) || videoResolved.videoUrl || null;
  const posterSrc = withApiBase(poster) || videoResolved.posterUrl || undefined;

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
          crossOrigin="anonymous"
          style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)' }}
          onLoadedMetadata={() => addGlobalToast({ type: 'success', message: 'Video metadata loaded' })}
          onCanPlay={() => addGlobalToast({ type: 'success', message: 'Video is ready to play' })}
          onError={() => addGlobalToast({ type: 'error', message: 'Video failed to load. You can still use audio and captions.' })}
        >
          {/* If captionsVttUrl available, include as track for browser-native subtitles */}
          {videoResolved.captionsVttUrl && (
            <track
              kind="subtitles"
              srcLang="en"
              label="English"
              src={videoResolved.captionsVttUrl}
              default
            />
          )}
        </video>
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
