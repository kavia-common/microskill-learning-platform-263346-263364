import React, { useEffect, useMemo, useState } from 'react';
import { getProgress } from '../services/api';
import ProgressTracker from '../components/ProgressTracker';
import { Skeleton } from '../ui/Skeleton';
import { emptyStates, sectionHeadings } from '../data/dummyLessons';

/**
 * PUBLIC_INTERFACE
 * ProgressPageView fetches and displays user progress with a list.
 */
export default function ProgressPageView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = useMemo(() => {
    const key = 'lms_user_id';
    let v = localStorage.getItem(key);
    if (!v) {
      v = `anon_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, v);
    }
    return v;
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getProgress(userId)
      .then((d) => mounted && setData(d))
      .catch(() => setData({ stats: { watched: 0, completed: 0, overall: 0, totalLessons: 0, points: 0, streak: 0 }, items: [] }))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [userId]);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton width="40%" />
        <div style={{ height: 8 }} />
        <Skeleton height={10} />
        <div style={{ height: 8 }} />
        <Skeleton />
      </div>
    );
  }

  const completed = (data?.items || []).filter(i => i.completed);

  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0 }}>{sectionHeadings.continue}</h1>
      <ProgressTracker stats={data?.stats || {}} />
      <section aria-label="Completed lessons" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Completed lessons</h3>
        <ul>
          {completed.map((it) => (
            <li key={it.lessonId}>{it.lessonId} — Score {it.score}</li>
          ))}
          {completed.length === 0 && <li>{emptyStates.continue}</li>}
        </ul>
      </section>
    </div>
  );
}
