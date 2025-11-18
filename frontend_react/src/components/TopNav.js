import React from 'react';
import '../lms.css';

// PUBLIC_INTERFACE
export default function TopNav({ onViewProgress }) {
  /** Top navigation with brand and actions. */
  return (
    <div className="topnav" role="navigation" aria-label="Top navigation">
      <div className="brand">MicroSkills</div>
      <div className="actions">
        <button onClick={onViewProgress} className="primary">Progress</button>
      </div>
    </div>
  );
}
