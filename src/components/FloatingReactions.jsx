import React from 'react';

export const FloatingReactions = ({ reactions }) => {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 35,
      }}
    >
      {reactions.map((rx) => (
        <div
          key={rx.id}
          className="floating-reaction-item"
          style={{
            position: 'absolute',
            bottom: '80px',
            left: `${rx.left || 50}%`,
            fontSize: '2.5rem',
            animation: 'reactionFloat 2.4s cubic-bezier(0.25, 1, 0.5, 1) forwards',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
          }}
        >
          {rx.emoji}
        </div>
      ))}
    </div>
  );
};
