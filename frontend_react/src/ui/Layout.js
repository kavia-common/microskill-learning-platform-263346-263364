import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../ui/Navbar';
import ToastHost from '../ui/ToastHost';

/**
 * PUBLIC_INTERFACE
 * Layout wraps all pages with top navbar, toasts, and theme handling.
 */
export default function Layout({ children }) {
  const [theme] = useState('dark');
  const [mounted, setMounted] = useState(false);

  const value = useMemo(() => ({ theme }), [theme]);

  useEffect(() => setMounted(true), []);

  return (
    <div data-theme={value.theme} style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 56px)' }} aria-live="polite" aria-busy={!mounted}>
        {children}
      </main>
      <ToastHost />
    </div>
  );
}
