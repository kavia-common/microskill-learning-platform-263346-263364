import React, { useEffect, useState } from 'react';
import { checkHealth } from '../services/health';
import { runtime } from '../utils/settings';

export default function DiagnosticsPanel() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await checkHealth();
      setStatus(res);
    })();
  }, []);

  const pill = (ok) => ({
    padding: '2px 8px',
    borderRadius: 12,
    color: '#fff',
    background: ok ? '#10B981' : '#EF4444',
    fontSize: 12,
  });

  const apiBase = status?.baseUrl || runtime.apiBase || '';
  const sampleSlug = 'quick-inbox-zero';
  const sampleVideo = `${apiBase?.replace(/\/$/, '') || ''}/assets/video/mp4/${sampleSlug}.mp4`;
  const sampleCaptions = `${apiBase?.replace(/\/$/, '') || ''}/assets/captions/${sampleSlug}.vtt`;

  return (
    <div className="diagnostics" style={{ background: '#1F2937', padding: 12, borderRadius: 8 }}>
      <h4 style={{ marginTop: 0 }}>Diagnostics</h4>
      {!status && <p>Running checks...</p>}
      {status && (
        <>
          <p>API Base: <code>{apiBase || '(same-origin)'}</code></p>
          <p>Health endpoint: <span style={pill(status.api.ok)}>{status.api.ok ? 'OK' : 'FAIL'}</span> {status.api.message}</p>
          <p>Generator: <span style={pill(status.generator.ok)}>{status.generator.ok ? 'OK' : 'FAIL'}</span> {status.generator.message}</p>
          <p>Assets: <span style={pill(status.assets.ok)}>{status.assets.ok ? 'OK' : 'FAIL'}</span> {status.assets.message}</p>
          <div style={{ marginTop: 8, fontSize: 12, color: '#D1D5DB' }}>
            Sample media URLs (try opening in a new tab):
            <div><code>{sampleVideo}</code></div>
            <div><code>{sampleCaptions}</code></div>
          </div>
          {!status.api.ok && status.api.status === 0 && (
            <p role="alert" style={{ color: '#F97316' }}>
              Network/CORS issue detected. Ensure backend allows this origin and matches REACT_APP_API_BASE/REACT_APP_BACKEND_URL.
            </p>
          )}
        </>
      )}
    </div>
  );
}
