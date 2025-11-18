import React, { useEffect, useState } from 'react';
import { checkHealth } from '../services/health';
import { runtime } from '../utils/settings';
import { runMediaEndpointDiagnostics, probeVideoPlayback } from '../services/mediaDiagnostics';

export default function DiagnosticsPanel() {
  const [status, setStatus] = useState(null);
  const [mediaDiag, setMediaDiag] = useState(null);
  const [playbackProbe, setPlaybackProbe] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await checkHealth();
      setStatus(res);
      try {
        const diag = await runMediaEndpointDiagnostics('quick-inbox-zero');
        setMediaDiag(diag);
        // Only probe playback if endpoints look reachable to avoid long timeouts
        if (diag?.assertions?.videoOk && diag?.urls?.videoUrl) {
          const probe = await probeVideoPlayback(diag.urls.videoUrl, 6000);
          setPlaybackProbe(probe);
        } else {
          setPlaybackProbe({ ok: false, canPlay: false, error: 'Video endpoint not OK; skipping playback probe' });
        }
      } catch (e) {
        setMediaDiag({ error: String(e) });
      }
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
            <div style={{ marginBottom: 4, color: '#fff' }}>Media endpoint checks (quick-inbox-zero)</div>
            {!mediaDiag && <div>Checking media endpoints…</div>}
            {mediaDiag && !mediaDiag.error && (
              <>
                <div>HEAD video: <span style={pill(mediaDiag.results.headVideo.ok && mediaDiag.results.headVideo.status === 200)}>{mediaDiag.results.headVideo.status}</span> <code>{mediaDiag.results.headVideo.contentType || '(no content-type)'}</code></div>
                <div>GET video: <span style={pill(mediaDiag.results.getVideo.ok)}>{mediaDiag.results.getVideo.status}</span> <code>{mediaDiag.results.getVideo.contentType || '(no content-type)'}</code></div>
                <div>HEAD captions: <span style={pill(mediaDiag.results.headVtt.ok)}>{mediaDiag.results.headVtt.status}</span> <code>{mediaDiag.results.headVtt.contentType || '(no content-type)'}</code></div>
                <div>GET captions: <span style={pill(mediaDiag.results.getVtt.ok)}>{mediaDiag.results.getVtt.status}</span> <code>{mediaDiag.results.getVtt.contentType || '(no content-type)'}</code></div>
                <div style={{ marginTop: 4 }}>
                  Assertions: videoOk=<strong>{String(mediaDiag.assertions.videoOk)}</strong>, vttOk=<strong>{String(mediaDiag.assertions.vttOk)}</strong>
                </div>
              </>
            )}
            {mediaDiag?.error && (
              <div style={{ color: '#EF4444' }}>Media diagnostics error: {mediaDiag.error}</div>
            )}
            <div style={{ marginTop: 6 }}>
              Playback probe: {playbackProbe ? (
                <span>
                  <span style={pill(playbackProbe.ok && playbackProbe.canPlay)}>{playbackProbe.ok ? 'canplay' : 'fail'}</span>
                  {!playbackProbe.ok && playbackProbe.error ? <span style={{ marginLeft: 8, color: '#FCA5A5' }}><code>{playbackProbe.error}</code></span> : null}
                </span>
              ) : 'pending…'}
            </div>
          </div>

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
