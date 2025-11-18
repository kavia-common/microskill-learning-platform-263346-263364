import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

const ToastCtx = createContext({ addToast: () => {} });

// PUBLIC_INTERFACE
export function addGlobalToast(toast) {
  if (listeners.length === 0) {
    return;
  }
  listeners.forEach((l) => {
    try {
      l(toast);
    } catch {}
  });
}

let listeners = [];

/**
 * PUBLIC_INTERFACE
 * useToasts hook to show user messages.
 */
export function useToasts() {
  return useContext(ToastCtx);
}

/**
 * PUBLIC_INTERFACE
 * ToastHost renders small toasts at bottom and provides context.
 */
export default function ToastHost({ children }) {
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
      {children}
      <div style={{ position: 'fixed', bottom: 20, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 1000 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {toasts.map(t => (
            <div key={t.id} role="status" aria-live="assertive" style={{
              pointerEvents: 'auto',
              background: t.type === 'error' ? '#7F1D1D' : t.type === 'success' ? '#065F46' : '#1F2937',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '10px 12px',
              borderRadius: 12,
              minWidth: 220,
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
            }}>
              {t.message}
            </div>
          ))}
        </div>
      </div>
    </ToastCtx.Provider>
  );
}
