import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { updateSkillProgress } from '../services/api';
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
    // Minimal viable local quiz generation based on lessonId
    const q = buildLocalQuiz(lessonId);
    if (mounted) {
      setQuiz(q);
      setLoading(false);
    }
    return () => { mounted = false; };
  }, [lessonId]);

  const handleSubmit = async (answers) => {
    try {
      const score = scoreQuiz(quiz, answers);
      const r = { score };
      setResult(r);
      // Persist completion against a skill context if possible.
      // We don't have the skillId here, so we associate progress to a pseudo-skill "quiz" scoped by lessonId.
      await updateSkillProgress(lessonId, { lessonId, watched: true, completed: true, score });
      addGlobalToast({ type: 'success', message: `Quiz submitted: ${score}%` });
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

function buildLocalQuiz(seed) {
  const base = (seed || 'skill').toString().slice(0, 10);
  return {
    questions: [
      { id: `${base}-q1`, text: 'What is the main takeaway of this micro-skill?', options: ['A', 'B', 'C', 'D'], correct: 1 },
      { id: `${base}-q2`, text: 'How long should you spend on the first step?', options: ['1m', '3m', '5m', '10m'], correct: 2 },
      { id: `${base}-q3`, text: 'Which tag best matches this skill?', options: ['focus', 'email', 'planning', 'memory'], correct: 0 },
    ]
  };
}

function scoreQuiz(quiz, answers) {
  const total = quiz.questions.length;
  let correct = 0;
  quiz.questions.forEach((q, i) => {
    if (answers[i] === q.correct) correct += 1;
  });
  return Math.round((correct / total) * 100);
}
