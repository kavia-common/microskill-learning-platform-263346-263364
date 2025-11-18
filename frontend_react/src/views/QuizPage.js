import React, { useEffect, useState } from 'react';
import { getQuiz, submitQuiz, updateProgress } from '../services/api';
import { useParams, Link } from 'react-router-dom';
import { Skeleton } from '../ui/Skeleton';
import ToastHost, { addGlobalToast } from '../ui/ToastHost';

export default function QuizPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const submitting = result === 'SUBMITTING';

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getQuiz(id);
        if (mounted) setQuiz(data);
      } catch (e) {
        addGlobalToast({ type: 'error', message: e?.message || 'Failed to load quiz' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const onSubmit = async () => {
    try {
      setResult('SUBMITTING');
      const res = await submitQuiz(id, answers);
      setResult(res);
      // Best effort progress update; ignore errors
      try {
        await updateProgress({
          lessonId: id,
          moduleIndex: (quiz?.questions?.length || 1) - 1,
          status: 'completed',
          score: res?.score,
        });
      } catch {
        // no-op
      }
      addGlobalToast({ type: 'success', message: `Quiz submitted. Score: ${res?.score ?? '-'}` });
    } catch (e) {
      setResult(null);
      addGlobalToast({ type: 'error', message: e?.message || 'Failed to submit quiz' });
    }
  };

  if (loading) return <Skeleton lines={5} />;
  if (!quiz) return <p role="alert" style={{ color: '#EF4444' }}>Quiz not available</p>;

  return (
    <div className="container">
      <h2>Quiz</h2>
      {quiz.questions?.map((q, idx) => (
        <div key={idx}>
          <p>{q.prompt}</p>
          <input
            aria-label={`answer-${idx}`}
            onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
          />
        </div>
      ))}
      <button onClick={onSubmit} disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
      {result && result !== 'SUBMITTING' && (
        <>
          <p>Score: {result.score}</p>
          <Link to="/progress">View Progress</Link>
        </>
      )}
      <ToastHost />
    </div>
  );
}
