import React, { useEffect, useMemo, useState } from 'react';
import { addGlobalToast } from '../ui/ToastHost';
import { generateLessonAI, generateMediaAI } from '../services/api';
import { toVideoSlug } from '../utils/videoMapping';
import { probeBackend, probeApiEndpoints, buildBackendUrl, getBackendBase } from '../services/health';

/**
 * PUBLIC_INTERFACE
 * CreatorGeneratePage allows creators to generate lessons via AI and render media locally.
 */
export default function CreatorGeneratePage() {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('practical');
  const [busy, setBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [backendWarning, setBackendWarning] = useState(null);

  // Diagnostics state
  const apiBase = useMemo(() => getBackendBase(), []);
  const [health, setHealth] = useState({ ok: null, message: '' });
  const [endpoints, setEndpoints] = useState({});
  const [lastErr, setLastErr] = useState({ status: null, message: '', hint: '' });
  const [failCounts, setFailCounts] = useState({ generateLesson: 0, generateMedia: 0 });

  const baseBuilder = (p) => (apiBase ? `${apiBase}${p}` : p);

  useEffect(() => {
    let active = true;
    (async () => {
      const h = await probeBackend(baseBuilder);
      if (!active) return;
      setHealth(h);
      const eps = await probeApiEndpoints(baseBuilder);
      if (!active) return;
      setEndpoints(eps);
      if (!h.ok) {
        const msg = `Cannot reach backend at "${apiBase || '(same origin)'}". ` +
          `Set REACT_APP_API_BASE (e.g. http://localhost:3001). ${h.message || ''}`;
        setBackendWarning(msg);
      } else {
        setBackendWarning(null);
      }
    })();
    return () => { active = false; };
  }, [apiBase]);

  const onToastFromApi = ({ status, message, hint }) => {
    setLastErr({ status: status ?? null, message: message || '', hint: hint || '' });
    const code = status ? ` (${status})` : '';
    addGlobalToast({ type: 'error', message: `${message}${code}${hint ? ` – ${hint}` : ''}` });
  };

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await generateLessonAI({ topic, audience, tone, dryRun: true }, onToastFromApi);
      setResult(data);
      addGlobalToast({ type: 'success', message: 'Lesson draft generated' });
      setFailCounts((c) => ({ ...c, generateLesson: 0 }));
    } catch (e) {
      const msg = String(e?.message || e || 'Generation failed');
      setError(msg);
      setFailCounts((c) => {
        const next = { ...c, generateLesson: (c.generateLesson || 0) + 1 };
        if (next.generateLesson >= 3) {
          addGlobalToast({
            type: 'error',
            message: 'Generation failed repeatedly. Tip: Verify REACT_APP_API_BASE and backend CORS allow your origin.'
          });
        }
        return next;
      });
    } finally {
      setBusy(false);
    }
  };

  const savePublish = async () => {
    if (!result) return;
    setBusy(true);
    try {
      // Call again without dryRun to persist if backend is configured with Supabase
      const data = await generateLessonAI({ topic, audience, tone, dryRun: false }, onToastFromApi);
      setResult(data);
      addGlobalToast({ type: 'success', message: 'Saved to backend (if configured)' });
    } catch {
      addGlobalToast({ type: 'error', message: 'Save failed (check backend/Supabase setup)' });
    } finally {
      setBusy(false);
    }
  };

  const renderMedia = async () => {
    if (!result?.lesson) {
      addGlobalToast({ type: 'error', message: 'Generate a lesson first' });
      return;
    }
    setMediaBusy(true);
    try {
      const { lesson } = result;
      const r = await generateMediaAI({ title: lesson.title, summary: lesson.summary, takeaways: lesson.takeaways }, onToastFromApi);
      addGlobalToast({ type: 'success', message: 'Media generated' });
      setResult({ ...result, media: r });
      setFailCounts((c) => ({ ...c, generateMedia: 0 }));
    } catch (e) {
      setFailCounts((c) => {
        const next = { ...c, generateMedia: (c.generateMedia || 0) + 1 };
        if (next.generateMedia >= 3) {
          addGlobalToast({
            type: 'error',
            message: 'Media generation failed repeatedly. Tip: Ensure backend writes to /public/assets/video/mp4 and /public/assets/captions using slug.'
          });
        }
        return next;
      });
    } finally {
      setMediaBusy(false);
    }
  };

  const slug = result?.lesson ? toVideoSlug(result.lesson.title) : '';

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto', display: 'grid', gap: 12 }}>
      <h2>Create with AI</h2>

      {/* Diagnostics Panel */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ margin: 0 }}>Diagnostics</h3>
          <button
            className="btn"
            onClick={async () => {
              const h = await probeBackend(baseBuilder);
              setHealth(h);
              const eps = await probeApiEndpoints(baseBuilder);
              setEndpoints(eps);
              addGlobalToast({ type: h.ok ? 'success' : 'error', message: h.ok ? 'Diagnostics refreshed' : 'Backend not reachable' });
            }}
          >
            Refresh
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
          API base detected: <code>{apiBase || '(same-origin)'}</code> • Health URL: <code>{buildBackendUrl('/')}</code>
        </div>
        <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
          <div>
            Backend connectivity: {health.ok === null ? '—' : health.ok ? 'OK' : 'Failed'} {health.message ? `(${health.message})` : ''}
          </div>
          <div>Endpoints:</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {['/api/generate-lesson', '/api/generate-media'].map((ep) => {
              const r = endpoints[ep];
              return (
                <li key={ep} style={{ fontSize: 13 }}>
                  {ep}: {r ? (r.ok ? 'OK' : 'Failed') : '—'} {r?.status ? `(${r.status})` : ''} {r?.message ? `- ${r.message}` : ''}
                </li>
              );
            })}
          </ul>
          {lastErr.message && (
            <div style={{ marginTop: 6 }}>
              Last error: <strong>{lastErr.message}</strong> {lastErr.status ? `(${lastErr.status})` : ''} {lastErr.hint ? `– ${lastErr.hint}` : ''}
            </div>
          )}
          <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>
            Tips:
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Set REACT_APP_API_BASE to your backend URL (e.g., http://localhost:3001).</li>
              <li>Ensure CORS allows the frontend origin if using different hosts/ports.</li>
              <li>/api/generate-media should write MP4 to public/assets/video/mp4 and VTT to public/assets/captions.</li>
              <li>Video mapping expects /assets/video/mp4/&lt;slug&gt;.mp4 and /assets/captions/&lt;slug&gt;.vtt.</li>
            </ul>
          </div>
        </div>
      </div>

      {backendWarning && (
        <div style={{ background: '#1F2937', border: '1px solid #EF4444', color: '#ffffff', padding: 12, borderRadius: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Backend not reachable</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>{backendWarning}</div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 6 }}>
            Current base: <code>{apiBase || '(same-origin)'}</code>. Health URL tried: <code>{buildBackendUrl('/')}</code>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
        <label>
          <div>Topic</div>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Inbox Zero" style={fieldStyle} />
        </label>
        <label>
          <div>Audience</div>
          <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. busy professionals" style={fieldStyle} />
        </label>
        <label>
          <div>Tone</div>
          <input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="e.g. practical, friendly" style={fieldStyle} />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn primary" onClick={generate} disabled={busy}>{busy ? 'Generating…' : 'Generate Lesson (AI)'}</button>
          <button className="btn" onClick={savePublish} disabled={busy || !result}>Save/Publish</button>
        </div>
        {error && <div style={{ color: '#EF4444' }}>{error}</div>}
      </div>

      {result?.lesson && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Preview</h3>
          <div style={{ fontWeight: 800 }}>{result.lesson.title}</div>
          <div style={{ color: 'var(--muted)' }}>{result.lesson.summary}</div>
          {Array.isArray(result.lesson.takeaways) && result.lesson.takeaways.length > 0 && (
            <>
              <h4 style={{ marginBottom: 6 }}>Takeaways</h4>
              <ul>
                {result.lesson.takeaways.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn" onClick={renderMedia} disabled={mediaBusy}>{mediaBusy ? 'Rendering…' : 'Generate Media (AI)'}</button>
          </div>
          {result.media && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
              Assets generated:
              <div>Video: {result.media.videoUrl}</div>
              <div>Captions: {result.media.captionsUrl}</div>
              <div>Slug: {result.media.slug}</div>
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
            Mapping will auto-pick up: /assets/video/mp4/{slug}.mp4 and /assets/captions/{slug}.vtt
          </div>
        </div>
      )}
    </div>
  );
}

const fieldStyle = {
  width: '100%',
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  padding: '8px 10px',
  borderRadius: 8,
  outline: 'none'
};
