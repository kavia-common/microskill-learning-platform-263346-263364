import React, { useEffect, useState } from 'react';
import '../lms.css';

// PUBLIC_INTERFACE
export default function ProgressPage({ loader }) {
  /** Displays progress stats. Loader is a function returning {stats, items}. */
  const [data, setData] = useState({ stats: { watched: 0, completed: 0, overall: 0, totalLessons: 0 }, items: [] });

  useEffect(() => {
    let mounted = true;
    loader().then(d => mounted && setData(d)).catch(() => {});
    return () => { mounted = false; };
  }, [loader]);

  const pct = data.stats.overall || 0;

  return (
    <div className="progress" role="region" aria-label="Progress">
      <h2>Your Progress</h2>
      <div className="bar" aria-label={`Overall ${pct}% complete`}>
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>
      <div style={{ marginTop: 8, color: 'var(--muted)' }}>
        Watched: {data.stats.watched}/{data.stats.totalLessons} • Completed: {data.stats.completed}/{data.stats.totalLessons}
      </div>
      <h3 style={{ marginTop: 16 }}>Lessons</h3>
      <ul>
        {data.items.map((it) => (
          <li key={it.lessonId} style={{ marginBottom: 6 }}>
            <span>{it.lessonId}</span> — {it.watched ? 'Watched' : 'Not watched'} • {it.completed ? `Score: ${it.score}` : 'Not completed'}
          </li>
        ))}
        {data.items.length === 0 && <li>No progress yet.</li>}
      </ul>
    </div>
  );
}
