import React, { useEffect, useState } from 'react';
import { getLesson, enrollLesson } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '../ui/Skeleton';
import ToastHost, { addGlobalToast } from '../ui/ToastHost';

export default function MicroLessonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getLesson(id);
        if (mounted) setLesson(data);
      } catch (e) {
        const msg = e && e.message ? e.message : 'Failed to load lesson';
        setError(msg);
        addGlobalToast({ type: 'error', message: msg });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const onEnroll = async () => {
    try {
      setEnrolling(true);
      await enrollLesson(id);
      addGlobalToast({ type: 'success', message: 'Enrolled successfully' });
      navigate(`/learn/${id}`);
    } catch (e) {
      const msg = e && e.message ? e.message : 'Failed to enroll';
      addGlobalToast({ type: 'error', message: msg });
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="container">
      {loading && <Skeleton lines={4} />}
      {!loading && error && <p role="alert" style={{ color: '#EF4444' }}>{error}</p>}
      {!loading && !error && lesson && (
        <>
          <h2>{lesson.title}</h2>
          <p>{lesson.description}</p>
          <button onClick={onEnroll} disabled={enrolling}>
            {enrolling ? 'Enrolling...' : 'Enroll'}
          </button>
        </>
      )}
      <ToastHost />
    </div>
  );
}
