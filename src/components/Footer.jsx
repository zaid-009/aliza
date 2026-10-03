import React from 'react';

export const Footer = ({ onOpenAbout, onOpenPrivacy, onOpenTerms, onOpenContact }) => {
  return (
    <footer className="footer-bar">
      <style>{`
        .footer-bar {
          position: relative;
          z-index: 10;
          background: var(--bg-dark);
          border-top: 1px solid var(--border-color);
          padding: 60px 28px 28px 28px;
          margin-top: auto;
        }

        .footer-container {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          text-align: center;
        }

        .footer-brand {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .footer-tagline {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-top: 4px;
        }

        .footer-links {
          display: flex;
          align-items: center;
          gap: 24px;
          list-style: none;
          flex-wrap: wrap;
          justify-content: center;
        }

        .footer-link-btn {
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
          transition: color var(--transition-fast);
        }

        .footer-link-btn:hover {
          color: var(--text-primary);
        }

        .footer-signature-line {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          width: 100%;
          padding-top: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          color: var(--text-muted);
          font-size: 0.78rem;
        }

        .footer-easter-egg {
          font-size: 0.76rem;
          color: rgba(245, 247, 250, 0.35);
          letter-spacing: 0.5px;
          font-weight: 400;
          user-select: none;
          transition: color 0.2s ease;
        }

        .footer-easter-egg:hover {
          color: var(--accent-pink);
        }
      `}</style>

      <div className="footer-container">
        <div>
          <div className="footer-brand">
            Aliz<span style={{ color: 'var(--accent-pink)' }}>a</span>
          </div>
          <div className="footer-tagline">"Watch together. Wherever you are."</div>
        </div>

        <ul className="footer-links">
          <li>
            <button className="footer-link-btn" onClick={onOpenAbout}>
              About
            </button>
          </li>
          <li>
            <button className="footer-link-btn" onClick={onOpenPrivacy}>
              Privacy
            </button>
          </li>
          <li>
            <button className="footer-link-btn" onClick={onOpenTerms}>
              Terms
            </button>
          </li>
          <li>
            <button className="footer-link-btn" onClick={onOpenContact}>
              Contact
            </button>
          </li>
        </ul>

        <div className="footer-signature-line">
         <div>&copy; {new Date().getFullYear()} Aliza Public Platform. All rights reserved.</div>
          
          {/* Subtle tiny Easter egg text */}
          <div className="footer-easter-egg" aria-hidden="true" title="Easter egg">
            crafted with ♡ by Z × A
          </div>
        </div>
      </div>
    </footer>
  );
};
