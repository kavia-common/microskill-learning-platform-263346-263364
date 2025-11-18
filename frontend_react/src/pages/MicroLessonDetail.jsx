import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * MicroLessonDetail: Video-first detail view
 * - Fetches lesson by id from /api/lessons/:id
 * - Shows video placeholder and captions list
 * - 'Play narration' uses Web Speech API (SSML stripped fallback)
 * - 'Mark Complete' posts to /api/progress
 */
export default function MicroLessonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const synthRef = useRef(typeof window !== 'undefined' ? (window.speechSynthesis || null) : null);

  const apiBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3001' : '');
  const userId = useMemo(() => {
    // simple anonymous id persisted in localStorage
    const k = 'ms_user_id';
    let v = localStorage.getItem(k);
    if (!v) {
      v = 'anon_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(k, v);
    }
    return v;
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/api/lessons/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setLesson)
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [apiBase, id]);

  const stopSpeech = () => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
    }
  };

  useEffect(() => {
    // stop TTS when unmount
    return () => stopSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stripSSML = (text) => {
    if (!text) return '';
    return String(text).replace(/<[^>]+>/g, '');
  };

  const handlePlay = () => {
    if (!synthRef.current) return;
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(
      lesson?.narrationScript || stripSSML(lesson?.ssml || '')
    );
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = navigator.language || 'en-US';
    synthRef.current.speak(utterance);
  };

  const handleMarkComplete = async () => {
    try {
      const res = await fetch(`${apiBase}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          lessonId: id,
          watched: true,
          completed: true
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      navigate('/micro-lessons');
    } catch (e) {
      alert(`Failed to mark complete: ${e}`);
    }
  };

  return (
    <div style={{ padding: 24, color: '#FFFFFF' }}>
      {loading && <p style={{ color: '#9CA3AF' }}>Loading…</p>}
      {err && <p style={{ color: '#EF4444' }}>{err}</p>}
      {lesson && (
        <div>
          <button
            onClick={() => navigate('/micro-lessons')}
            style={{
              background: 'transparent',
              color: '#9CA3AF',
              border: '1px solid #374151',
              padding: '6px 10px',
              borderRadius: 8,
              marginBottom: 12
            }}
          >
            ← Back
          </button>

          <h1 style={{ fontWeight: 800, color: '#F97316', marginBottom: 8 }}>{lesson.title}</h1>

          {/* Video placeholder */}
          <div
            style={{
              background:
                'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(0,0,0,1))',
              border: '1px solid #374151',
              borderRadius: 16,
              height: 320,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#FFFFFF' }}>
                Video coming from Kaviya prompt
              </div>
              <div style={{ color: '#9CA3AF', fontSize: 12 }}>
                Use Generate Media feature to attach assets
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 16
            }}
          >
            {/* Narration and play */}
            <div
              style={{
                background: '#1F2937',
                border: '1px solid #374151',
                borderRadius: 12,
                padding: 16
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>Narration</h2>
              <p style={{ color: '#E5E7EB', whiteSpace: 'pre-wrap' }}>
                {lesson.narrationScript || stripSSML(lesson.ssml)}
              </p>
              <button
                onClick={handlePlay}
                style={{
                  background: '#F97316',
                  color: '#000',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ▶ Play narration
              </button>
            </div>

            {/* Captions */}
            <div
              style={{
                background: '#1F2937',
                border: '1px solid #374151',
                borderRadius: 12,
                padding: 16
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>Captions</h2>
              <ol style={{ margin: 0, paddingLeft: 18, color: '#E5E7EB' }}>
                {(lesson.captions || []).map((c, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {c}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Kaviya prompt collapsible */}
          <div
            style={{
              background: '#0B1220',
              border: '1px dashed #374151',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16
            }}
          >
            <button
              onClick={() => setShowPrompt((s) => !s)}
              style={{
                background: 'transparent',
                color: '#10B981',
                border: '1px solid #10B981',
                padding: '6px 10px',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {showPrompt ? 'Hide' : 'Show'} Kaviya video prompt
            </button>
            {showPrompt && (
              <pre
                style={{
                  marginTop: 12,
                  whiteSpace: 'pre-wrap',
                  color: '#D1D5DB',
                  background: '#111827',
                  padding: 12,
                  borderRadius: 8
                }}
              >
                {lesson.kaviyaVideoPrompt}
              </pre>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleMarkComplete}
              style={{
                background: '#10B981',
                color: '#000',
                padding: '10px 14px',
                borderRadius: 8,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Mark Complete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
