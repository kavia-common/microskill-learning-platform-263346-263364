import React from 'react';

/**
 * PUBLIC_INTERFACE
 * SummaryBox renders larger lesson summaries and takeaways.
 */
export default function SummaryBox({ summary, takeaways = [] }) {
  return (
    <section aria-label="Lesson Summary" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
      <p style={{ marginTop: 0, color: 'var(--text)' }}>{summary}</p>
      {takeaways.length > 0 && (
        <>
          <h4 style={{ marginBottom: 6 }}>Key takeaways</h4>
          <ul>
            {takeaways.map((t, i) => <li key={i} style={{ color: 'var(--muted)' }}>{t}</li>)}
          </ul>
        </>
      )}
    </section>
  );
}
