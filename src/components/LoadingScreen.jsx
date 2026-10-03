import React from 'react';

export const LoadingScreen = ({ text = "Loading cinema experience..." }) => {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-dots-container">
        <div className="loading-dot loading-dot-left" />
        <div className="loading-dot loading-dot-right" />
      </div>

      <div className="loading-logo-text">WT</div>
      <div className="loading-subtext">{text}</div>

      {/* Tiny subtle Easter egg signature as requested */}
      <div className="loading-easter-egg" aria-hidden="true">
        Z♡A
      </div>
    </div>
  );
};
