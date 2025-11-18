import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import MicroLessonsList from './pages/MicroLessonsList';
import MicroLessonDetail from './pages/MicroLessonDetail';

function Shell({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh', background: '#000000' }}>
      <aside style={{ background: '#0B1220', borderRight: '1px solid #111827', padding: 16, color: '#FFFFFF' }}>
        <div style={{ fontWeight: 900, color: '#F97316', marginBottom: 16 }}>MicroSkills</div>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: 8 }}>
              <Link to="/micro-lessons" style={{ color: '#FFFFFF', textDecoration: 'none', fontWeight: 700 }}>
                🧠 Micro Lessons
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Navigate to="/micro-lessons" replace />} />
          <Route path="/micro-lessons" element={<MicroLessonsList />} />
          <Route path="/micro-lessons/:id" element={<MicroLessonDetail />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
