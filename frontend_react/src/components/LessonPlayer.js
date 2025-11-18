import React, { useRef, useEffect } from 'react';

/**
 * PUBLIC_INTERFACE
 * LessonPlayer renders a video with subtle autoplay and controls.
 */
export default function LessonPlayer({ src, poster }) {
  const ref = useRef(null);

  useEffect(() => {
    const v = ref.current;
    if (v) v.play().catch(() => {});
  }, [src]);

  return (
    <video ref={ref} src={src} poster={poster} muted playsInline controls style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)' }} />
  );
}
