import React, { useEffect, useMemo, useState, useCallback } from 'react';
import './App.css';
import './lms.css';
import TopNav from './components/TopNav';
import LessonFeed from './components/LessonFeed';
import QuizModal from './components/QuizModal';
import ProgressPage from './components/ProgressPage';
import { getLessons, getQuiz, submitQuiz, getProgress, updateProgress } from './services/api';

// PUBLIC_INTERFACE
function App() {
  /** Main LMS app with vertical feed, quizzes, and progress tracking. */
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // minimal auth stub: anonymous user id stored in localStorage
  const userId = useMemo(() => {
    const key = 'lms_user_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = `anon_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, id);
    }
    return id;
  }, []);

  useEffect(() => {
    let mounted = true;
    getLessons()
      .then(data => { if (mounted) setLessons(data); })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const openQuiz = useCallback(async (lesson) => {
    try {
      const quiz = await getQuiz(lesson.id);
      setQuizData({ lesson, quiz });
      setQuizOpen(true);
      setFeedback(null);
    } catch (e) {
      // ignore
    }
  }, []);

  const submitQuizAnswers = useCallback(async (answers) => {
    if (!quizData) return;
    setSubmitting(true);
    try {
      const result = await submitQuiz(quizData.lesson.id, userId, answers);
      setFeedback({ score: result.score, results: result.results });
      setQuizOpen(false);
      // update progress view silently
    } catch (e) {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }, [quizData, userId]);

  const handleWatched = useCallback(async (lessonId) => {
    try {
      await updateProgress({ userId, lessonId, watched: true, completed: false });
    } catch (e) {
      // ignore
    }
  }, [userId]);

  const progressLoader = useCallback(() => getProgress(userId), [userId]);

  if (loading) {
    return <div style={{ padding: 20, color: '#fff' }}>Loading…</div>;
  }

  return (
    <div>
      <TopNav onViewProgress={() => setShowProgress(v => !v)} />
      {!showProgress ? (
        <>
          <LessonFeed lessons={lessons} onQuiz={openQuiz} onWatched={handleWatched} />
          {quizOpen && quizData && (
            <QuizModal
              quiz={quizData.quiz}
              onClose={() => setQuizOpen(false)}
              onSubmit={submitQuizAnswers}
              loading={submitting}
            />
          )}
          {feedback && (
            <div style={{ position: 'fixed', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: 12, borderRadius: 10 }}>
                Quiz submitted: Score {feedback.score}%
              </div>
            </div>
          )}
        </>
      ) : (
        <ProgressPage loader={progressLoader} />
      )}
    </div>
  );
}

export default App;
