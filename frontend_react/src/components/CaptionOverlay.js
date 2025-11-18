 import React from 'react';
import '../lms.css';

/**
 * PUBLIC_INTERFACE
 * CaptionOverlay renders the current caption text with aria-live polite.
 */
export default function CaptionOverlay({ text, visible }) {
  if (!visible || !text) return null;
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Captions"
      style={{
        position: 'absolute',
        bottom: 56,
        left: 12,
        right: 12,
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          border: '1px solid var(--border)',
          padding: '8px 10px',
          borderRadius: 10,
          fontSize: 14,
          lineHeight: 1.4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        {text}
      </span>
    </div>
  );
}
