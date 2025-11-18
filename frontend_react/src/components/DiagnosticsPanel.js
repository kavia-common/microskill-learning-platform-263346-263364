import React, { useEffect, useMemo, useState } from 'react';
import { __apiBase as apiBase, __buildApiUrl as buildUrl } from '../services/api';
import { addGlobalToast } from '../ui/ToastHost';

/**
 * PUBLIC_INTERFACE
 * DiagnosticsPanel shows runtime connectivity and asset checks with remediation tips.
 * It validates:
 * - Health: GET {API_BASE}/
 * - Endpoint probes: OPTIONS/GET /api/generate-lesson and /api/generate-media
 * - Static assets served at /assets for a known slug (quick-inbox-zero)
 */
export default function DiagnosticsPanel() {
  const base = useMemo(() => apiBase || '', [apiBase]);
  const [health, setHealth] = useState({ status: 'unknown' });
  const [checks, setChecks] = useState({
    generateLesson: 'unknown',
    generateMedia: 'unknown',
    staticAssetProbe: 'unknown',
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setBusy(true);
      try {
        // Health: allow non-JSON too
        try {
          const res = await fetch(buildUrl('/'), { cache: 'no-store' });
          const ok = res.ok;
          let json = null;
          try { json = await res.json(); } catch { /* ignore text */ }
          if (!cancelled) setHealth({ status: ok ? 'ok' : 'fail', details: json || null });
        } catch (e) {
          if (!cancelled) setHealth({ status: 'fail', details: { error: String(e) } });
        }

        // Probe helper supports OPTIONS -> GET fallback; treats 405/404 as "route reachable"
        async function probe(path) {
          const url = buildUrl(path);
          try {
            const res = await fetch(url, { method: 'OPTIONS' });
            if (res.ok) return 'ok';
          } catch {
            // fall through
          }
          try {
            const res = await fetch(url, { method: 'GET' });
            return res.ok || res.status === 405 || res.status === 404 ? 'ok' : `fail(${res.status})`;
          } catch (e) {
            return `fail(${(e && e.message) || 'network'})`;
          }
        }

        const [genL, genM] = await Promise.all([
          probe('/api/generate-lesson'),
          probe('/api/generate-media'),
        ]);

        if (!cancelled) {
          setChecks(prev => ({ ...prev, generateLesson: genL, generateMedia: genM }));
        }

        // Static asset probe for a common slug
        async function probeAsset(url) {
          try {
            const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
            return res.ok ? 'ok' : `missing(${res.status})`;
          } catch (e) {
            return `fail(${(e && e.message) || 'network'})`;
          }
        }
        const commonSlug = 'quick-inbox-zero';
        const [vid, vtt] = await Promise.all([
          probeAsset(`/assets/video/mp4/${commonSlug}.mp4`),
          probeAsset(`/assets/captions/${commonSlug}.vtt`),
        ]);
        const staticStatus = vid === 'ok' || vtt === 'ok' ? 'ok' : `${vid}|${vtt}`;
        if (!cancelled) {
          setChecks(prev => ({ ...prev, staticAssetProbe: staticStatus }));
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [base]);

  const color = (s) => s === 'ok' ? '#10B981' : (s === 'unknown' ? '#9CA3AF' : '#EF4444');

  const remediation = [
    `- Ensure backend is running (npm start in backend) and REACT_APP_API_BASE points to it (current: ${base || '(same-origin)'}).`,
    '- If probes fail, check CORS: set FRONTEND_ORIGIN in backend .env to your frontend origin.',
    '- /api/generate-media writes to backend public/assets/{video/mp4|captions}; served at /assets.',
    '- Playback fallbacks: video -> audio+captions -> captions-only; toasts will guide if media is missing.',
    '- See latest screenshot reference at /assets/diagnostics-latest.png'
  ];

  return (
    <div style={{
      background: 'var(--surface, #111827)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
      color: 'var(--text-color, #fff)',
      borderRadius: 12,
      padding: 12,
      marginBottom: 12
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontWeight: 700 }}>Diagnostics</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{busy ? 'running…' : 'idle'}</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 12 }}>
        API Base: <code>{base || '(same-origin)'}</code>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 8, marginTop: 12, fontSize: 14 }}>
        <div>Health:</div>
        <div style={{ color: color(health.status) }}>
          {health.status} {health.details?.environment ? `(env: ${health.details.environment})` : ''}
        </div>
        <div>POST /api/generate-lesson:</div>
        <div style={{ color: color(checks.generateLesson) }}>{checks.generateLesson}</div>
        <div>POST /api/generate-media:</div>
        <div style={{ color: color(checks.generateMedia) }}>{checks.generateMedia}</div>
        <div>Static asset probe:</div>
        <div style={{ color: color(checks.staticAssetProbe) }}>{checks.staticAssetProbe}</div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          className="btn"
          onClick={() => window.location.reload()}
          style={{ padding: '6px 10px', fontSize: 12 }}
        >
          Re-run checks
        </button>
        <button
          className="btn"
          onClick={async () => {
            try {
              const payload = {
                title: 'Inbox Zero — Micro Lesson',
                summary: 'Learn Inbox Zero quickly with practical steps.',
                takeaways: ['Triage fast', 'Batch replies', 'Reduce switching'],
              };
              const res = await fetch(buildUrl('/api/generate-media'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error?.message || `HTTP ${res.status}`);
              }
              const json = await res.json();
              addGlobalToast({ type: 'success', message: `Media generated for slug ${json.slug}` });
            } catch (e) {
              addGlobalToast({ type: 'error', message: `Generate media failed: ${e.message || e}` });
            }
          }}
          style={{ padding: '6px 10px', fontSize: 12, marginLeft: 8 }}
        >
          Test media generation
        </button>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.9 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Remediation</div>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {remediation.map((r) => <li key={r}>{r}</li>)}
        </ul>
      </div>
    </div>
  );
}
