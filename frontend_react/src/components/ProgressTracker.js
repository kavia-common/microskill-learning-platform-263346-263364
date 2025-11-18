import React from 'react';

/**
 * PUBLIC_INTERFACE
 * ProgressTracker renders XP/progress bars and stats.
 */
export default function ProgressTracker({ stats }) {
  const pct = stats?.overall || 0;
  return (
    <section className="progress" role="region" aria-label="Your Progress">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <h2 style={{ margin: 0 }}>Progress</h2>
        <div aria-label="Points and Streak" style={{ color: 'var(--muted)' }}>
          {stats?.points || 0} pts • Streak {stats?.streak || 0}🔥
        </div>
      </div>
      <div className="bar" aria-label={`Overall ${pct}%`}>
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>
      <div style={{ marginTop: 6, color: 'var(--muted)' }}>
        Watched: {stats?.watched || 0}/{stats?.totalLessons || 0} • Completed: {stats?.completed || 0}/{stats?.totalLessons || 0}
      </div>
    </section>
  );
}
