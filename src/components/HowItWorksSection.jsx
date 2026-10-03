import React from 'react';
import { PlusCircle, Share2, PlayCircle } from 'lucide-react';

export const HowItWorksSection = ({ onOpenCreateRoom }) => {
  const steps = [
    {
      number: '01',
      icon: PlusCircle,
      title: 'Create or Join a Room',
      description: 'Set up your watch room in one click. Name your room, pick your movie or video source, and customize controls.',
    },
    {
      number: '02',
      icon: Share2,
      title: 'Share the Room Link',
      description: 'Copy your unique invite link or 6-digit room code and send it to your friends on any chat app or browser.',
    },
    {
      number: '03',
      icon: PlayCircle,
      title: 'Watch & React Together',
      description: 'Press play! Playback stays 100% in sync for everyone. Chat, send floating reactions, and feel closer.',
    },
  ];

  return (
    <section id="how-it-works" className="how-section">
      <style>{`
        .how-section {
          position: relative;
          z-index: 10;
          padding: 90px 24px;
          background: var(--surface-primary);
          border-top: 1px solid var(--border-color);
        }

        .how-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .how-steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 28px;
          margin-top: 48px;
        }

        .step-card {
          background: var(--surface-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 36px 28px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .step-number {
          font-family: var(--font-heading);
          font-size: 2.8rem;
          font-weight: 800;
          color: rgba(255, 107, 138, 0.2);
          position: absolute;
          top: 20px;
          right: 28px;
        }

        .step-icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          background: rgba(255, 107, 138, 0.12);
          border: 1px solid rgba(255, 107, 138, 0.25);
          color: var(--accent-pink);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .step-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .step-desc {
          color: var(--text-secondary);
          font-size: 0.94rem;
          line-height: 1.6;
        }

        .how-cta-banner {
          margin-top: 60px;
          background: linear-gradient(135deg, rgba(139, 124, 255, 0.12) 0%, rgba(255, 107, 138, 0.12) 100%);
          border: 1px solid var(--border-highlight);
          border-radius: var(--radius-xl);
          padding: 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
      `}</style>

      <div className="how-container">
        <div className="section-header">
          <div className="section-subtitle">Simple Setup</div>
          <h2 className="section-title">How WatchTogether Works</h2>
        </div>

        <div className="how-steps-grid">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div key={st.number} className="step-card">
                <span className="step-number">{st.number}</span>
                <div className="step-icon-wrapper">
                  <Icon size={26} />
                </div>
                <h3 className="step-title">{st.title}</h3>
                <p className="step-desc">{st.description}</p>
              </div>
            );
          })}
        </div>

        <div className="how-cta-banner">
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Ready for your movie night?</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '540px' }}>
            No registration required. Create your watch room in seconds and share with friends.
          </p>
          <button className="btn btn-primary" style={{ padding: '12px 28px' }} onClick={onOpenCreateRoom}>
            Create your watch room
          </button>
        </div>
      </div>
    </section>
  );
};
