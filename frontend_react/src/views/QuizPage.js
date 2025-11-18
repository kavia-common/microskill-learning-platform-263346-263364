import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getQuiz, submitQuiz, updateProgress } from '../services/api';
import QuizBox from '../components/QuizBox';
import { Skeleton } from '../ui/Skeleton';
import { addGlobalToast } from '../ui/ToastHost';

/**
 * PUBLIC_INTERFACE
 * QuizPage renders quiz and handles scoring and final screen.
 */
export default function QuizPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

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
    getQuiz(lessonId)
      .then((d) => mounted && setQuiz(d))
      .catch(() => addGlobalToast({ type: 'error', message: 'Failed to load quiz' }))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [lessonId]);

  const handleSubmit = async (answers) => {
    try {
      const r = await submitQuiz(lessonId, userId, answers);
      setResult(r);
      await updateProgress({ userId, lessonId, watched: true, completed: true, score: r.score });
      addGlobalToast({ type: 'success', message: `Quiz submitted: ${r.score}%` });
    } catch {
      addGlobalToast({ type: 'error', message: 'Failed to submit quiz' });
    }
  };

  if (loading) {
    return <div style={{ padding: 16 }}><Skeleton height={160} /><div style={{ height: 8 }} /><Skeleton /></div>;
  }

  if (result) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <h2>Great job!</h2>
        <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--secondary)' }}>{result.score}%</div>
        <button className="btn primary" onClick={() => navigate('/progress')}>View Progress</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Quick Quiz</h2>
      {quiz ? <QuizBox quiz={quiz} onSubmit={handleSubmit} /> : <div>No quiz available.</div>}
    </div>
  );
}
