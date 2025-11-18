import React, { useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * UploadForm allows creators to upload lessons.
 */
export default function UploadForm({ onSubmit, loading }) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [media, setMedia] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title: title.trim(),
      summary: summary.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      media
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
      <label>
        <div>Title</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Lesson title" style={fieldStyle} />
      </label>
      <label>
        <div>Summary</div>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} required placeholder="Short summary" rows={4} style={fieldStyle} />
      </label>
      <label>
        <div>Tags (comma separated)</div>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. productivity, focus" style={fieldStyle} />
      </label>
      <label>
        <div>Optional media</div>
        <input type="file" accept="video/*,image/*" onChange={(e) => setMedia(e.target.files?.[0] || null)} />
      </label>
      <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</button>
    </form>
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
