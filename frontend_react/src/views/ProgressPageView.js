import React, { useEffect, useState } from 'react';
import { getProgress } from '../services/api';
import { Skeleton } from '../ui/Skeleton';
import ToastHost, { addGlobalToast } from '../ui/ToastHost';

export default function ProgressPageView() {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getProgress();
        if (mounted) setProgress(Array.isArray(data) ? data : []);
      } catch (e) {
        addGlobalToast({ type: 'error', message: e?.message || 'Failed to load progress' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="container">
      <h2>Your Progress</h2>
      {loading && <Skeleton lines={4} />}
      {!loading && progress.length === 0 && <p>No progress yet</p>}
      {!loading && progress.length > 0 && (
        <ul>
          {progress.map((p) => (
            <li key={`${p.lessonId}-${p.moduleIndex ?? 'all'}`}>
              Lesson {p.lessonId}: {p.status} {p.score != null ? `(Score: ${p.score})` : ''}
            </li>
          ))}
        </ul>
      )}
      <ToastHost />
    </div>
  );
}
