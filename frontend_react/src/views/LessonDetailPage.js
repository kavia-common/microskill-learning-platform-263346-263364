import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getSkill, updateSkillProgress, generateMediaAI } from '../services/api';
import LessonPlayer from '../components/LessonPlayer';
import SummaryBox from '../components/SummaryBox';
import TagList from '../components/TagList';
import { Skeleton } from '../ui/Skeleton';
import { addGlobalToast } from '../ui/ToastHost';
import { ctas } from '../data/dummyLessons';

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
  const [mediaBusy, setMediaBusy] = useState(false);

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
    getSkill(id)
      .then((d) => {
        if (!mounted) return;
        // Convert skill detail to a pseudo "lesson" for existing media player components
        const synthetic = {
          id: d.id,
          title: d.title,
          summary: d.description || d.brief,
          description: d.description || d.brief,
          tags: d.tags || [],
          takeaways: [],
          // Let mapping utils resolve video/captions by title
          videoUrl: null,
          thumbnail: null,
        };
        setLesson(synthetic);
      })
      .catch(() => addGlobalToast({ type: 'error', message: 'Failed to load lesson' }))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  const derivedSummary = useMemo(() => {
    if (!lesson) return '';
    const base = lesson.summary || lesson.description || '';
    return base.length > 0 ? base : 'A quick, practical micro-lesson to boost your skills.';
  }, [lesson]);

  const derivedTakeaways = useMemo(() => {
    if (!lesson) return [];
    if (lesson.takeaways && lesson.takeaways.length) return lesson.takeaways;
    const src = (lesson.description || lesson.summary || '').split(/[.?!]/).map(s => s.trim()).filter(Boolean);
    const bullets = src.slice(0, 3);
    if (bullets.length === 0) return ['Understand the concept', 'Apply it quickly', 'Avoid common pitfalls'];
    return bullets;
  }, [lesson]);

  const markWatched = async () => {
    setSaving(true);
    try {
      await updateSkillProgress(id, { lessonId: `${id}-overview`, watched: true, completed: false });
      addGlobalToast({ type: 'success', message: 'Marked as watched' });
    } catch {
      addGlobalToast({ type: 'error', message: 'Could not update progress' });
    } finally {
      setSaving(false);
    }
  };

  const onGenerateMedia = async () => {
    if (!lesson) return;
    setMediaBusy(true);
    try {
      await generateMediaAI({ title: lesson.title, summary: derivedSummary, takeaways: derivedTakeaways });
      addGlobalToast({ type: 'success', message: 'Media generated. Reloading mapping...' });
      // Hint to user: assets will be auto-detected; just re-rendering the component is enough
      setLesson({ ...lesson }); // trigger rerender
    } catch (e) {
      addGlobalToast({ type: 'error', message: String(e.message || 'Media generation failed') });
    } finally {
      setMediaBusy(false);
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

  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <TagList tags={lesson.tags || []} />
      <h1 style={{ margin: 0 }}>{lesson.title}</h1>
      <LessonPlayer src={lesson.videoUrl || null} poster={lesson.thumbnail || null} lesson={lesson} />
      <SummaryBox summary={derivedSummary} takeaways={derivedTakeaways} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn" onClick={markWatched} disabled={saving}>Mark Watched</button>
        <Link to={`/quiz/${lesson.id}`} className="btn primary">{ctas.beginQuiz}</Link>
        <button className="btn" onClick={onGenerateMedia} disabled={mediaBusy}>{mediaBusy ? 'Generating Media…' : 'Generate Media (AI)'}</button>
      </div>
      <div>
        <Link to="/" className="btn">Back to Feed</Link>
      </div>
    </div>
  );
}
