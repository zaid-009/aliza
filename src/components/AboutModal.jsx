import React from 'react';
import { X, Sparkles, Film, Heart } from 'lucide-react';

export const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,107,138,0.12)',
                color: 'var(--accent-pink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Film size={20} />
            </div>
            <div>
             <h2 className="modal-title">About Aliza</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Public Sync Cinema Platform
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p>
            <strong style={{ color: 'var(--text-primary)' }}>Aliza</strong> is a public real-time digital cinema platform engineered to bring people together regardless of physical distance.
          </p>
          <p>
            With sub-millisecond Socket.IO playback synchronization, live room chat, and interactive screen reactions, you can share movie trailers, clips, and videos seamlessly with anyone, anywhere.
          </p>

          <div
            style={{
              padding: 16,
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              marginTop: 6,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} color="var(--accent-purple)" /> Platform Credits
            </div>
            <p style={{ fontSize: '0.85rem' }}>
              Built with React, Socket.IO, Express, and HTML5 Video APIs. Designed with a premium dark cinematic visual identity.
            </p>
            {/* Subtle Z♡A signature in credits */}
            <div
              style={{
                marginTop: 10,
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Version 2.0.0</span>
              <span style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Z♡A</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button className="btn btn-primary" style={{ padding: '8px 20px' }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
