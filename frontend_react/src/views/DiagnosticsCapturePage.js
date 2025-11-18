import React from 'react';
import DiagnosticsPanel from '../components/DiagnosticsPanel';

export default function DiagnosticsCapturePage() {
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Diagnostics Capture</h2>
      <p>Use the panel below to copy exact endpoint results (status, Content-Type) and playback probe outcome.</p>
      <DiagnosticsPanel />
    </div>
  );
}
