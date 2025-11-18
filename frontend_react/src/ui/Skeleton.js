import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Skeleton block for loading state.
 */
export function Skeleton({ width = '100%', height = 16, rounded = 10, style }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: rounded,
        background: 'linear-gradient(90deg, #1f2937 25%, #374151 37%, #1f2937 63%)',
        backgroundSize: '400% 100%',
        animation: 'skeletonShimmer 1.4s ease infinite',
        ...style
      }}
    />
  );
}

// keyframes are provided by global CSS in lms.css addition if needed
