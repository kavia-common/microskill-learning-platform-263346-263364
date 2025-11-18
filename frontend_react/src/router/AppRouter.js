import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../ui/Layout';
import HomeFeedPage from '../views/HomeFeedPage';
import LearningModulePage from '../views/LearningModulePage';
import QuizPage from '../views/QuizPage';
import ProgressPageView from '../views/ProgressPageView';
import MicroLessonsList from '../pages/MicroLessonsList';
import MicroLessonDetail from '../pages/MicroLessonDetail';

/**
 * PUBLIC_INTERFACE
 * AppRouter provides core LMS routes.
 */
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomeFeedPage />} />
          <Route path="/lessons" element={<MicroLessonsList />} />
          <Route path="/lessons/:id" element={<MicroLessonDetail />} />
          <Route path="/learn/:id" element={<LearningModulePage />} />
          <Route path="/quiz/:id" element={<QuizPage />} />
          <Route path="/progress" element={<ProgressPageView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
