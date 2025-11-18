import React, { useEffect, useState } from 'react';
import { getLesson, updateProgress } from '../services/api';
import { useParams, Link } from 'react-router-dom';
import { Skeleton } from '../ui/Skeleton';
import ToastHost, { addGlobalToast } from '../ui/ToastHost';

// PUBLIC_INTERFACE
export default function LearningModulePage() {
  /**
   * Learning module view: displays module content, next/prev, marks progress.
   */
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getLesson(id);
        if (mounted) setLesson(data);
      } catch (e) {
        addGlobalToast({ type: 'error', message: e?.message || 'Failed to load lesson' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const markProgress = async (nextIndex, status) => {
    try {
      await updateProgress({ lessonId: id, moduleIndex: nextIndex, status });
    } catch (e) {
      addGlobalToast({ type: 'info', message: 'Progress sync delayed. Will retry later.' });
    }
  };

  const next = async () => {
    const total = lesson?.modules?.length || 1;
    const nextIndex = Math.min(index + 1, total - 1);
    await markProgress(nextIndex, nextIndex === total - 1 ? 'completed' : 'in_progress');
    setIndex(nextIndex);
  };

  const prev = () => {
    setIndex(Math.max(index - 1, 0));
  };

  if (loading) return <Skeleton lines={5} />;
  if (!lesson) return <p role="alert" style={{ color: '#EF4444' }}>Lesson not found</p>;

  const current = lesson.modules?.[index] || { title: '', content: '' };

  return (
    <div className="container">
      <h2>{lesson.title}</h2>
      <h3>{current.title}</h3>
      <p>{current.content}</p>
      <div>
        <button onClick={prev} disabled={index === 0}>Prev</button>
        <button onClick={next} disabled={index >= (lesson.modules?.length || 1) - 1}>Next</button>
        {index >= (lesson.modules?.length || 1) - 1 && <Link to={`/quiz/${id}`}>Take Quiz</Link>}
      </div>
      <ToastHost />
    </div>
  );
}
