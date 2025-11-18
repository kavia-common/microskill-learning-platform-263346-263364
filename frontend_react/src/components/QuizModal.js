import React, { useState } from 'react';
import '../lms.css';

// PUBLIC_INTERFACE
export default function QuizModal({ quiz, onClose, onSubmit, loading }) {
  /** Modal to render quiz questions and submit answers. */
  const [answers, setAnswers] = useState(Array(quiz.questions.length).fill(null));
  const [error, setError] = useState(null);

  function select(i, optIndex) {
    const next = answers.slice();
    next[i] = optIndex;
    setAnswers(next);
  }

  async function submit() {
    if (answers.some(a => a === null)) {
      setError('Please answer all questions.');
      return;
    }
    setError(null);
    await onSubmit(answers);
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Quiz">
      <div className="panel">
        <h3>Quick Quiz</h3>
        {quiz.questions.map((q, i) => (
          <div key={q.id}>
            <div style={{ fontWeight: 700, margin: '8px 0' }}>{i + 1}. {q.text}</div>
            {q.options.map((opt, oi) => (
              <div
                role="button"
                tabIndex={0}
                key={oi}
                className={`quiz-option ${answers[i] === oi ? 'selected' : ''}`}
                onClick={() => select(i, oi)}
                onKeyDown={(e) => e.key === 'Enter' && select(i, oi)}
              >
                {opt}
              </div>
            ))}
          </div>
        ))}
        {error && <div style={{ color: '#EF4444', marginTop: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={onClose} disabled={loading}>Close</button>
          <button className="btn primary" onClick={submit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
