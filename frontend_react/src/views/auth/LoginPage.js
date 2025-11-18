import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addGlobalToast } from '../../ui/ToastHost';

/**
 * PUBLIC_INTERFACE
 * LoginPage stub with simple local "auth".
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Auth stub: store email as user name
      localStorage.setItem('lms_user_name', email);
      addGlobalToast({ type: 'success', message: 'Logged in' });
      navigate('/');
    } catch {
      addGlobalToast({ type: 'error', message: 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 420, margin: '0 auto' }}>
      <h2>Login</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        <label>
          <div>Email</div>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={fieldStyle} />
        </label>
        <label>
          <div>Password</div>
          <input type="password" required value={pwd} onChange={(e) => setPwd(e.target.value)} style={fieldStyle} />
        </label>
        <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      <div style={{ marginTop: 10, color: 'var(--muted)' }}>
        <Link to="/forgot-password">Forgot password?</Link> • <Link to="/signup">Create account</Link>
      </div>
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
