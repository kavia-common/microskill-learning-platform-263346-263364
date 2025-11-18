import React, { useState } from 'react';
import { addGlobalToast } from '../../ui/ToastHost';

/**
 * PUBLIC_INTERFACE
 * ForgotPasswordPage stub to simulate password reset request.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Stub success
      addGlobalToast({ type: 'success', message: 'Reset link sent if email exists' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 420, margin: '0 auto' }}>
      <h2>Reset Password</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        <label>
          <div>Email</div>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={fieldStyle} />
        </label>
        <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button>
      </form>
    </div>
  );
}

const fieldStyle = {
  width: '100%',
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  padding: '8px 10px',
  borderRadius: 8,
  outline: 'none'
};
