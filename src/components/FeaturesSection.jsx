import React from 'react';
import { Zap, ShieldCheck, MessageCircle, Tv2, Users2, Sparkles } from 'lucide-react';

export const FeaturesSection = () => {
  const features = [
    {
      icon: Zap,
      title: 'Ultra-low Latency Sync',
      description: 'Synchronized playback across all connected devices in millisecond real-time.',
      color: 'var(--accent-pink)',
    },
    {
      icon: MessageCircle,
      title: 'Live Room Chat & Floating Reactions',
      description: 'Express every laugh, shock, and tear with real-time text chat and animated screen reactions.',
      color: 'var(--accent-purple)',
    },
    {
      icon: ShieldCheck,
      title: 'Public & Private Cinema Lounges',
      description: 'Host open screening rooms for the community or set up private passwordless rooms for friends.',
      color: '#22c55e',
    },
    {
      icon: Tv2,
      title: 'Universal Media Compatibility',
      description: 'Stream direct MP4/WebM videos, demo movie trailers, or custom web streams seamlessly.',
      color: '#3b82f6',
    },
    {
      icon: Users2,
      title: 'Smart Host Controls & Moderation',
      description: 'Host-only playback lock options, host reassignment, and audience member management.',
      color: '#f59e0b',
    },
    {
      icon: Sparkles,
      title: 'Designed for Every Device',
      description: 'Flawless side-by-side cinema UI on desktop, optimized stacked control drawers on mobile.',
      color: '#ec4899',
    },
  ];

  return (
    <section id="features" className="features-section">
      <style>{`
        .features-section {
          position: relative;
          z-index: 10;
          padding: 90px 24px;
          background: var(--bg-dark);
          border-top: 1px solid var(--border-color);
        }

        .features-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          margin-bottom: 56px;
        }

        .section-subtitle {
          color: var(--accent-pink);
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 8px;
        }

        .section-title {
          font-size: clamp(2rem, 4vw, 2.8rem);
          font-weight: 800;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
          gap: 24px;
        }

        .feature-card {
          background: var(--surface-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 30px;
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .feature-card:hover {
          border-color: var(--border-highlight);
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(0,0,0,0.5);
        }

        .feature-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background: var(--surface-secondary);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .feature-card-title {
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .feature-card-desc {
          color: var(--text-secondary);
          font-size: 0.92rem;
          line-height: 1.55;
        }
      `}</style>

      <div className="features-container">
        <div className="section-header">
          <div className="section-subtitle">Cinematic Experience</div>
          <h2 className="section-title">Built for shared watch parties</h2>
        </div>

        <div className="features-grid">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="feature-card">
                <div className="feature-icon-wrapper">
                  <Icon size={24} color={item.color} />
                </div>
                <h3 className="feature-card-title">{item.title}</h3>
                <p className="feature-card-desc">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
