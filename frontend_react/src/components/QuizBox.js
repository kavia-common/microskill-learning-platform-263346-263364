import React, { useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * QuizBox renders quiz questions and local scoring.
 */
export default function QuizBox({ quiz, onSubmit }) {
  const [answers, setAnswers] = useState(Array(quiz?.questions?.length || 0).fill(null));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const select = (qi, oi) => {
    const next = answers.slice();
    next[qi] = oi;
    setAnswers(next);
  };

  const handleSubmit = async () => {
    if (answers.some(a => a === null)) {
      setError('Please answer all questions.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(answers);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
      {quiz?.questions?.map((q, i) => (
        <div key={q.id} style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{i + 1}. {q.text}</div>
          {q.options.map((opt, oi) => (
            <div
              key={oi}
              onClick={() => select(i, oi)}
              onKeyDown={(e) => e.key === 'Enter' && select(i, oi)}
              role="button"
              tabIndex={0}
              className={`quiz-option ${answers[i] === oi ? 'selected' : ''}`}
            >
              {opt}
            </div>
          ))}
        </div>
      ))}
      {error && <div style={{ color: '#EF4444', marginTop: 8 }}>{error}</div>}
      <button className="btn primary" onClick={handleSubmit} disabled={submitting} aria-label="Submit Quiz">{submitting ? 'Submitting...' : 'Submit'}</button>
    </div>
  );
}
