import React, { useRef, useEffect } from 'react';
import '../lms.css';

/**
 * PUBLIC_INTERFACE
 * LessonCard shows a single autoplaying video lesson with overlay.
 */
export default function LessonCard({ lesson, active, onQuiz, onWatched }) {
  /**
   * Renders a video lesson card. Auto plays when active and pauses otherwise.
   * Calls onWatched when the video has played for a threshold.
   */
  const videoRef = useRef(null);
  const watchThreshold = Math.min(lesson.durationSeconds || 45, 20); // seconds to consider watched

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [active]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let watchedReported = false;
    const handler = () => {
      if (!watchedReported && v.currentTime >= watchThreshold) {
        watchedReported = true;
        onWatched?.(lesson.id);
      }
    };
    v.addEventListener('timeupdate', handler);
    return () => v.removeEventListener('timeupdate', handler);
  }, [lesson?.id]);

  const quizCta = lesson?.cta === 'Start Lesson' ? 'Start Lesson' : 'Take Quiz';

  return (
    <div className="lesson-card" aria-label={`Lesson ${lesson.title}`}>
      <video ref={videoRef} src={lesson.videoUrl} muted playsInline preload="metadata" />
      <div className="lesson-overlay">
        <div className="title">{lesson.title}</div>
        <div className="summary">{lesson.summary}</div>
        <div className="buttons">
          <button className="btn primary" onClick={() => onQuiz?.(lesson)} aria-label={quizCta}>{quizCta}</button>
        </div>
      </div>
    </div>
  );
}
