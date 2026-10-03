import React from 'react';
import { PlusCircle, LogIn, Sparkles, Play } from 'lucide-react';
import { HeroPlayerMockup } from './HeroPlayerMockup';

export const Hero = ({ onOpenCreateRoom, onOpenJoinRoom, onStartDemoRoom }) => {
  return (
    <section className="hero-section">
      <style>{`
        .hero-section {
          position: relative;
          z-index: 10;
          padding: 80px 24px 60px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-tagline-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: var(--radius-full);
          background: rgba(139, 124, 255, 0.1);
          border: 1px solid rgba(139, 124, 255, 0.3);
          color: var(--accent-purple);
          font-weight: 600;
          font-size: 0.85rem;
          margin-bottom: 24px;
          box-shadow: 0 4px 14px rgba(139, 124, 255, 0.15);
        }

        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4.2rem);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 20px;
          max-width: 900px;
        }

        .hero-title-accent {
          background: linear-gradient(135deg, var(--text-primary) 30%, var(--accent-pink) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-supporting-text {
          font-size: clamp(1.05rem, 2vw, 1.25rem);
          color: var(--text-secondary);
          max-width: 680px;
          line-height: 1.6;
          margin-bottom: 36px;
        }

        .hero-cta-group {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }

        @media (max-width: 600px) {
          .hero-cta-group {
            width: 100%;
            flex-direction: column;
          }
          .hero-cta-group .btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="hero-tagline-pill">
        <Sparkles size={15} />
        <span>Aliza — Watch together. Wherever you are.</span>
      </div>

      <h1 className="hero-title">
  Welcome to <span className="hero-title-accent">Aliza.</span><br />
  Watch together.
</h1>

      <p className="hero-supporting-text">
        Create a room, invite your friends, and enjoy your favorite moments together — wherever everyone is.
      </p>

      <div className="hero-cta-group">
        <button
          className="btn btn-primary"
          style={{ padding: '14px 28px', fontSize: '1.05rem' }}
          onClick={onOpenCreateRoom}
        >
          <PlusCircle size={20} />
          Create a room
        </button>

        <button
          className="btn btn-secondary"
          style={{ padding: '14px 28px', fontSize: '1.05rem' }}
          onClick={onOpenJoinRoom}
        >
          <LogIn size={20} />
          Join a room
        </button>
      </div>

      {/* Modern Video Player Mockup showing sync & chat */}
      <HeroPlayerMockup onStartDemoRoom={onStartDemoRoom} />
    </section>
  );
};
