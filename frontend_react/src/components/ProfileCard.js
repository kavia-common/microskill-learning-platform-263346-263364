import React from 'react';
import TagList from './TagList';

/**
 * PUBLIC_INTERFACE
 * ProfileCard displays user info and saved lessons.
 */
export default function ProfileCard({ user, saved = [], onLogout }) {
  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
        <h2 style={{ marginTop: 0 }}>{user?.name || 'Guest'}</h2>
        <div style={{ color: 'var(--muted)' }}>{user?.email || 'anonymous'}</div>
        <button className="btn" onClick={onLogout} aria-label="Logout">Logout</button>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Saved Lessons</h3>
        {saved.length === 0 && <div style={{ color: 'var(--muted)' }}>No saved lessons yet.</div>}
        <div style={{ display: 'grid', gap: 10 }}>
          {saved.map((l) => (
            <div key={l.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
              <div style={{ fontWeight: 700 }}>{l.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: 14, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{l.summary}</div>
              <TagList tags={l.tags || []} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
