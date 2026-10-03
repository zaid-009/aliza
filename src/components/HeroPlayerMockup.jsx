import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Maximize, Users, MessageSquare, Heart, Flame, Smile } from 'lucide-react';

export const HeroPlayerMockup = ({ onStartDemoRoom }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeReactions, setActiveReactions] = useState([]);

  // Auto-generate periodic floating reactions in mockup to demonstrate real-time feel
  useEffect(() => {
    const emojis = ['❤️', '🔥', '😂', '🍿', '👏', '😱'];
    const interval = setInterval(() => {
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      const id = Date.now() + Math.random();
      setActiveReactions((prev) => [
        ...prev.slice(-10),
        { id, emoji: randomEmoji, left: Math.random() * 60 + 20 },
      ]);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  const triggerReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setActiveReactions((prev) => [
      ...prev,
      { id, emoji, left: Math.random() * 50 + 25 },
    ]);
  };

  return (
    <div className="hero-mockup-wrapper">
      <style>{`
        .hero-mockup-wrapper {
          position: relative;
          width: 100%;
          max-width: 1060px;
          margin: 40px auto 0 auto;
          border-radius: var(--radius-xl);
          background: var(--surface-primary);
          border: 1px solid var(--border-color);
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.7), 0 0 40px var(--glow-purple);
          overflow: hidden;
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);
        }

        .hero-mockup-wrapper:hover {
          border-color: var(--border-highlight);
          box-shadow: 0 35px 80px rgba(0, 0, 0, 0.8), 0 0 50px var(--glow-pink);
        }

        .mockup-top-bar {
          background: var(--surface-secondary);
          padding: 10px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .dots-row {
          display: flex;
          gap: 6px;
        }

        .dot-circle {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .mockup-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          min-height: 440px;
        }

        @media (max-width: 860px) {
          .mockup-grid {
            grid-template-columns: 1fr;
          }
          .mockup-chat-panel {
            display: none;
          }
        }

        .mockup-video-area {
          position: relative;
          background: #000;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }

        .mockup-video-element {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
          inset: 0;
          opacity: 0.9;
        }

        .video-overlay-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%);
          pointer-events: none;
        }

        .mockup-video-header {
          position: relative;
          z-index: 10;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .live-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(8, 10, 13, 0.75);
          backdrop-filter: blur(8px);
          padding: 6px 12px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .floating-reaction-item {
          position: absolute;
          bottom: 70px;
          font-size: 2.2rem;
          pointer-events: none;
          z-index: 20;
          animation: reactionFloat 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .mockup-controls-bar {
          position: relative;
          z-index: 10;
          padding: 14px 20px;
          background: rgba(17, 21, 26, 0.85);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          gap: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .progress-timeline {
          flex: 1;
          height: 5px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-full);
          position: relative;
          cursor: pointer;
        }

        .progress-timeline-fill {
          width: 48%;
          height: 100%;
          background: linear-gradient(90deg, var(--accent-purple), var(--accent-pink));
          border-radius: var(--radius-full);
          position: relative;
        }

        .progress-timeline-fill::after {
          content: '';
          position: absolute;
          right: -5px;
          top: -3.5px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #FFF;
          box-shadow: 0 0 10px var(--accent-pink);
        }

        /* Mockup Right Chat Panel */
        .mockup-chat-panel {
          background: var(--surface-primary);
          border-left: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 16px;
        }

        .chat-header {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .mockup-messages {
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: hidden;
        }

        .chat-bubble {
          background: var(--surface-secondary);
          border: 1px solid var(--border-color);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          font-size: 0.82rem;
          line-height: 1.35;
          animation: fadeIn 0.3s ease-out;
        }

        .chat-sender {
          font-weight: 700;
          color: var(--accent-pink);
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chat-time {
          font-size: 0.68rem;
          color: var(--text-muted);
          font-weight: 400;
        }

        .mockup-reaction-buttons {
          display: flex;
          gap: 6px;
          margin-top: 12px;
          justify-content: center;
          padding-top: 10px;
          border-top: 1px solid var(--border-color);
        }

        .reaction-btn-small {
          background: var(--surface-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 6px 10px;
          font-size: 1.05rem;
          transition: transform 0.15s ease, background 0.15s ease;
        }

        .reaction-btn-small:hover {
          transform: scale(1.25);
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>

      {/* Mac / Window Top Bar */}
      <div className="mockup-top-bar">
        <div className="dots-row">
          <div className="dot-circle" style={{ background: '#FF5F56' }} />
          <div className="dot-circle" style={{ background: '#FFBD2E' }} />
          <div className="dot-circle" style={{ background: '#27C93F' }} />
        </div>
        <div style={{ fontWeight: 600 }}>WatchTogether Digital Cinema Lounge</div>
        <div className="badge badge-live">
          <span className="badge-live-dot" /> Live Sync
        </div>
      </div>

      <div className="mockup-grid">
        {/* Main Video Screen */}
        <div className="mockup-video-area">
          <video
            className="mockup-video-element"
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
            autoPlay
            loop
            muted
            playsInline
          />

          <div className="video-overlay-gradient" />

          {/* Top video bar */}
          <div className="mockup-video-header">
            <div className="live-tag">
              <Users size={14} color="#FF6B8A" />
              <span>7 people watching</span>
            </div>

            <button
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={onStartDemoRoom}
            >
              Enter Live Room
            </button>
          </div>

          {/* Floating reactions */}
          {activeReactions.map((rx) => (
            <div
              key={rx.id}
              className="floating-reaction-item"
              style={{ left: `${rx.left}%` }}
            >
              {rx.emoji}
            </div>
          ))}

          {/* Video Control Bar */}
          <div className="mockup-controls-bar">
            <button
              className="btn-icon"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <div className="progress-timeline">
              <div className="progress-timeline-fill" />
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              04:12 / 12:00
            </div>

            <button className="btn-icon" aria-label="Volume">
              <Volume2 size={18} />
            </button>

            <button className="btn-icon" aria-label="Fullscreen">
              <Maximize size={18} />
            </button>
          </div>
        </div>

        {/* Right Chat Panel Mockup */}
        <div className="mockup-chat-panel">
          <div>
            <div className="chat-header">
              <MessageSquare size={16} color="#8B7CFF" />
              <span>Room Chat (Sync active)</span>
            </div>

            <div className="mockup-messages">
              <div className="chat-bubble">
                <div className="chat-sender">
                  <span>Alex</span>
                  <span className="chat-time">13:40</span>
                </div>
                <div>That scene 😂</div>
              </div>

              <div className="chat-bubble">
                <div className="chat-sender" style={{ color: 'var(--accent-purple)' }}>
                  <span>Zaid 👑</span>
                  <span className="chat-time">13:41</span>
                </div>
                <div>Wait for it...</div>
              </div>

              <div className="chat-bubble">
                <div className="chat-sender" style={{ color: '#22c55e' }}>
                  <span>Maya</span>
                  <span className="chat-time">13:41</span>
                </div>
                <div>No way 😭</div>
              </div>
            </div>
          </div>

          {/* Interactive floating reaction triggers */}
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                marginBottom: '4px',
              }}
            >
              Try sending a reaction:
            </div>
            <div className="mockup-reaction-buttons">
              {['❤️', '😂', '😭', '😱', '🔥', '🍿'].map((emoji) => (
                <button
                  key={emoji}
                  className="reaction-btn-small"
                  onClick={() => triggerReaction(emoji)}
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
