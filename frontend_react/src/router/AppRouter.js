import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../ui/Layout';
import HomeFeedPage from '../views/HomeFeedPage';
import LessonDetailPage from '../views/LessonDetailPage';
import QuizPage from '../views/QuizPage';
import ProgressPageView from '../views/ProgressPageView';
import LoginPage from '../views/auth/LoginPage';
import SignupPage from '../views/auth/SignupPage';
import ForgotPasswordPage from '../views/auth/ForgotPasswordPage';
import ProfilePage from '../views/ProfilePage';
import CreatorUploadPage from '../views/CreatorUploadPage';
import CreatorGeneratePage from '../views/CreatorGeneratePage';
import SkillsHomePage from '../views/SkillsHomePage';
import SkillDetailPage from '../views/SkillDetailPage';
import LearningModulePage from '../views/LearningModulePage';

/**
 * PUBLIC_INTERFACE
 * AppRouter provides all app routes using react-router.
 */
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Original feed and LMS routes */}
          <Route path="/" element={<HomeFeedPage />} />
          <Route path="/lesson/:id" element={<LessonDetailPage />} />
          <Route path="/quiz/:lessonId" element={<QuizPage />} />
          <Route path="/progress" element={<ProgressPageView />} />
          {/* New micro-skill routes */}
          <Route path="/skills" element={<SkillsHomePage />} />
          <Route path="/skill/:id" element={<SkillDetailPage />} />
          <Route path="/learn/:skillId/:lessonId" element={<LearningModulePage />} />
          {/* Micro-lesson list and detail (video-first) */}
          <Route path="/micro-lessons" element={React.createElement(require('../pages/MicroLessonsList.jsx').default)} />
          <Route path="/micro-lessons/:id" element={React.createElement(require('../pages/MicroLessonDetail.jsx').default)} />
          {/* Auth and creator */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/create" element={<CreatorUploadPage />} />
          <Route path="/create/generate" element={<CreatorGeneratePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
