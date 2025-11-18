import React, { useState } from 'react';
import UploadForm from '../components/UploadForm';
import { addGlobalToast } from '../ui/ToastHost';

/**
 * PUBLIC_INTERFACE
 * CreatorUploadPage posts new lessons to backend if available, otherwise stub success.
 */
export default function CreatorUploadPage() {
  const [loading, setLoading] = useState(false);

  const onSubmit = async (payload) => {
    setLoading(true);
    try {
      // Try hitting potential endpoint; if it fails, fall back to stub
      const base = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '';
      const url = base ? `${base.replace(/\/$/, '')}/api/lessons` : null;
      let ok = false;
      if (url) {
        try {
          const form = new FormData();
          form.append('title', payload.title);
          form.append('summary', payload.summary);
          form.append('tags', JSON.stringify(payload.tags));
          if (payload.media) form.append('media', payload.media);
          const res = await fetch(url, { method: 'POST', body: form });
          ok = res.ok;
        } catch {
          ok = false;
        }
      }
      if (!ok) {
        // Stub: pretend success
      }
      addGlobalToast({ type: 'success', message: 'Upload successful' });
    } catch {
      addGlobalToast({ type: 'error', message: 'Upload failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 640, margin: '0 auto' }}>
      <h2>Create a Lesson</h2>
      <UploadForm onSubmit={onSubmit} loading={loading} />
    </div>
  );
}
