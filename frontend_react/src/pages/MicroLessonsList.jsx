import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * MicroLessonsList: Lists built-in micro lessons (id, title)
 * Style: Ocean Professional (dark surface, primary accents)
 */
export default function MicroLessonsList() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
    fetch(`${apiBase}/api/lessons`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setLessons)
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 24, color: '#FFFFFF' }}>
      <h1 style={{ fontWeight: 800, color: '#F97316' }}>Micro Lessons</h1>
      {loading && <p style={{ color: '#9CA3AF' }}>Loading…</p>}
      {err && <p style={{ color: '#EF4444' }}>{err}</p>}
      <ul style={{ listStyle: 'none', padding: 0, marginTop: 16 }}>
        {lessons.map((l) => (
          <li
            key={l.id}
            style={{
              background: '#1F2937',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              border: '1px solid #374151'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{l.title}</div>
                <div style={{ color: '#9CA3AF', fontSize: 12 }}>ID: {l.id}</div>
              </div>
              <Link
                to={`/micro-lessons/${l.id}`}
                style={{
                  background: '#F97316',
                  color: '#000',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                Open
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
