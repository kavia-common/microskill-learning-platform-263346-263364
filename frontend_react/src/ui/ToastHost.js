import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

const ToastCtx = createContext({ addToast: () => {} });
// PUBLIC_INTERFACE
// Use addGlobalToast({ type: 'error'|'success'|'info', message: '...' }) anywhere to show actionable toasts.
// Example:
// import { addGlobalToast } from '../ui/ToastHost';
// addGlobalToast({ type: 'error', message: 'Backend unreachable. Check REACT_APP_API_BASE and CORS.' });

let listeners = [];

// PUBLIC_INTERFACE
export function addGlobalToast(toast) {
  /** Adds a toast globally; gracefully no-ops if no host is mounted yet. */
  if (listeners.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug('[ToastHost] addGlobalToast before mount', toast);
    }
    return;
  }
  listeners.forEach((l) => {
    try {
      l(toast);
    } catch {}
  });
}

/**
 * PUBLIC_INTERFACE
 * useToasts hook to show user messages.
 */
export function useToasts() {
  return useContext(ToastCtx);
}

/**
 * ToastHost renders small toasts at bottom.
 */
export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    const t = { id, ...toast };
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, toast.duration || 3000);
  }, []);

  useEffect(() => {
    const listener = (t) => addToast(t);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, [addToast]);

  return (
    <ToastCtx.Provider value={{ addToast }}>
      <div style={{ position: 'fixed', bottom: 20, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {toasts.map(t => (
            <div key={t.id} role="status" aria-live="assertive" style={{
              pointerEvents: 'auto',
              background: t.type === 'error' ? '#7F1D1D' : '#1F2937',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              padding: '10px 12px',
              borderRadius: 12,
              minWidth: 220,
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              transform: 'translateY(0)',
              transition: 'all .2s ease'
            }}>
              {t.message}
            </div>
          ))}
        </div>
      </div>
      {/* Children injected via Layout context usage */}
    </ToastCtx.Provider>
  );
}
