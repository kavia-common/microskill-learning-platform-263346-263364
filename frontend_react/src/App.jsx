import React from 'react';
import AppRouter from './router/AppRouter';
import ToastHost from './ui/ToastHost';

export default function App() {
  return (
    <ToastHost>
      <AppRouter />
    </ToastHost>
  );
}
