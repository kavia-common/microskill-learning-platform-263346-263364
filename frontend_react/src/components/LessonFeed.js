import React, { useEffect, useRef, useState } from 'react';
import LessonCard from './LessonCard';
import '../lms.css';

// PUBLIC_INTERFACE
export default function LessonFeed({ lessons, onQuiz, onWatched }) {
  /** Vertical scroll feed with autoplay of the visible card. */
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const nodes = containerRef.current?.querySelectorAll('.lesson-card') || [];
    const observer = new IntersectionObserver(
      entries => {
        // pick the most visible entry
        let maxRatio = 0;
        let idx = activeIndex;
        entries.forEach(entry => {
          const i = Array.from(nodes).indexOf(entry.target);
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            idx = i;
          }
        });
        setActiveIndex(idx);
      },
      { threshold: Array.from({ length: 10 }, (_, i) => i / 10) }
    );
    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons?.length]);

  return (
    <div className="feed" ref={containerRef}>
      {lessons.map((l, i) => (
        <LessonCard
          key={l.id}
          lesson={l}
          active={i === activeIndex}
          onQuiz={onQuiz}
          onWatched={onWatched}
        />
      ))}
    </div>
  );
}
