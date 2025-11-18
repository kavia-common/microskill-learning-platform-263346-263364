import React, { useEffect, useState } from 'react';
import { listLessons } from '../services/api';
import { Skeleton } from '../ui/Skeleton';
import ToastHost, { addGlobalToast } from '../ui/ToastHost';
import { Link } from 'react-router-dom';

export default function MicroLessonsList() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listLessons();
        if (mounted) setLessons(Array.isArray(data) ? data : []);
      } catch (e) {
        const msg = e && e.message ? e.message : 'Failed to load lessons';
        setError(msg);
        addGlobalToast({ type: 'error', message: msg });
        if (mounted) setLessons([]);
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
      <h2>Micro Lessons</h2>
      {loading && <Skeleton lines={4} />}
      {!loading && error && <p role="alert" style={{ color: '#EF4444' }}>{error}</p>}
      {!loading && !error && lessons.length === 0 && <p>No lessons available</p>}
      {!loading && !error && lessons.length > 0 && (
        <ul>
          {lessons.map((l) => (
            <li key={l.id}>
              <Link to={`/lessons/${l.id}`}>{l.title}</Link>
            </li>
          ))}
        </ul>
      )}
      <ToastHost />
    </div>
  );
}
