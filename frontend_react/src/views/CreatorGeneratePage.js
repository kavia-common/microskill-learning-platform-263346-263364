import React, { useState } from 'react';
import { addGlobalToast } from '../ui/ToastHost';
import { generateLessonAI, generateMediaAI } from '../services/api';
import { toVideoSlug } from '../utils/videoMapping';

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

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await generateLessonAI({ topic, audience, tone, dryRun: true });
      setResult(data);
      addGlobalToast({ type: 'success', message: 'Lesson draft generated' });
    } catch (e) {
      setError(String(e.message || e));
      addGlobalToast({ type: 'error', message: 'Generation failed' });
    } finally {
      setBusy(false);
    }
  };

  const savePublish = async () => {
    if (!result) return;
    setBusy(true);
    try {
      // Call again without dryRun to persist if backend is configured with Supabase
      const data = await generateLessonAI({ topic, audience, tone, dryRun: false });
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
      const r = await generateMediaAI({ title: lesson.title, summary: lesson.summary, takeaways: lesson.takeaways });
      addGlobalToast({ type: 'success', message: 'Media generated' });
      // Refresh mapping hints by reloading the page assets (cache-bypass not strictly necessary)
      setResult({ ...result, media: r });
    } catch (e) {
      addGlobalToast({ type: 'error', message: String(e.message || 'Media generation failed') });
    } finally {
      setMediaBusy(false);
    }
  };

  const slug = result?.lesson ? toVideoSlug(result.lesson.title) : '';

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: '0 auto', display: 'grid', gap: 12 }}>
      <h2>Create with AI</h2>
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
