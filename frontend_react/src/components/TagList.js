import React from 'react';

/**
 * PUBLIC_INTERFACE
 * TagList renders accessible tags.
 */
export default function TagList({ tags = [] }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} aria-label="Tags">
      {tags.map((t, i) => (
        <span key={`${t}-${i}`} style={{
          background: 'rgba(249,115,22,0.15)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          padding: '4px 8px',
          borderRadius: 999,
          fontSize: 12
        }}>{t}</span>
      ))}
    </div>
  );
}
