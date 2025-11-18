import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getLesson, updateProgress } from '../services/api';
import LessonPlayer from '../components/LessonPlayer';
import SummaryBox from '../components/SummaryBox';
import TagList from '../components/TagList';
import { Skeleton } from '../ui/Skeleton';
import { addGlobalToast } from '../ui/ToastHost';

/**
 * PUBLIC_INTERFACE
 * LessonDetailPage shows a lesson, summary, takeaways, and progress bar.
 */
export default function LessonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const userId = useMemo(() => {
    const key = 'lms_user_id';
    let val = localStorage.getItem(key);
    if (!val) {
      val = `anon_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, val);
    }
    return val;
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getLesson(id)
      .then((d) => mounted && setLesson(d))
      .catch(() => addGlobalToast({ type: 'error', message: 'Failed to load lesson' }))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  const markWatched = async () => {
    setSaving(true);
    try {
      await updateProgress({ userId, lessonId: id, watched: true, completed: false });
      addGlobalToast({ type: 'success', message: 'Marked as watched' });
    } catch {
      addGlobalToast({ type: 'error', message: 'Could not update progress' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton height={180} />
        <div style={{ height: 10 }} />
        <Skeleton width="60%" />
        <div style={{ height: 6 }} />
        <Skeleton width="80%" />
      </div>
    );
  }

  if (!lesson) return <div style={{ padding: 16 }}>Lesson not found</div>;

  const takeaways = lesson.takeaways || [
    'Understand the concept quickly',
    'Apply it with a quick tip',
    'Avoid a common pitfall'
  ];

  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <TagList tags={lesson.tags || []} />
      <h1 style={{ margin: 0 }}>{lesson.title}</h1>
      <LessonPlayer src={lesson.videoUrl} poster={lesson.thumbnail} />
      <SummaryBox summary={lesson.summary} takeaways={takeaways} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={markWatched} disabled={saving}>Mark Watched</button>
        <Link to={`/quiz/${lesson.id}`} className="btn primary">Begin Quiz</Link>
      </div>
      <div>
        <Link to="/" className="btn">Back to Feed</Link>
      </div>
    </div>
  );
}
