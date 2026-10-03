import React, { useState } from 'react';
import { Film, PlusCircle, LogIn, Menu, X, Sparkles } from 'lucide-react';

export const Navbar = ({
  currentView,
  onNavigateHome,
  onOpenCreateRoom,
  onOpenJoinRoom,
  onOpenAbout,
  isInRoom = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoTooltipVisible, setLogoTooltipVisible] = useState(false);

  const handleNavClick = (action) => {
    setMobileMenuOpen(false);
    action();
  };

  const handleScrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    if (currentView !== 'landing') {
      onNavigateHome();
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="nav-bar">
      <style>{`
        .nav-bar {
          position: sticky;
          top: 0;
          z-index: 500;
          background: rgba(8, 10, 13, 0.88);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-color);
          padding: 14px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.35rem;
          color: var(--text-primary);
          text-decoration: none;
          position: relative;
          cursor: pointer;
        }

        .logo-badge {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, var(--surface-secondary) 0%, #1D232C 100%);
          border: 1px solid var(--border-highlight);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-pink);
          font-weight: 800;
          font-size: 1.1rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: transform var(--transition-bounce), border-color var(--transition-fast);
        }

        .nav-logo:hover .logo-badge {
          transform: scale(1.06) rotate(-2deg);
          border-color: var(--accent-pink);
        }

        .logo-text-accent {
          color: var(--accent-pink);
        }

        .logo-hover-signature {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          background: var(--surface-secondary);
          border: 1px solid var(--border-highlight);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          color: var(--text-muted);
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          animation: fadeIn 0.15s ease-out;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 20px;
          list-style: none;
        }

        .nav-link-btn {
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.92rem;
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          transition: color var(--transition-fast), background var(--transition-fast);
        }

        .nav-link-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.04);
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-toggle {
          display: none;
        }

        @media (max-width: 860px) {
          .nav-links {
            display: none;
          }
          .mobile-toggle {
            display: flex;
          }
          .nav-right-actions {
            display: none;
          }
        }

        .mobile-drawer {
          position: fixed;
          top: 65px;
          left: 0;
          right: 0;
          background: var(--surface-primary);
          border-bottom: 1px solid var(--border-color);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 20px 30px rgba(0,0,0,0.7);
          animation: slideUp 0.2s ease-out;
          z-index: 499;
        }
      `}</style>

      <div className="nav-left">
        <div
          className="nav-logo"
          onClick={onNavigateHome}
          onMouseEnter={() => setLogoTooltipVisible(true)}
          onMouseLeave={() => setLogoTooltipVisible(false)}
          title="Aliza Home"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigateHome()}
        >
          <div className="logo-badge">A</div>
          <span>Aliz<span className="logo-text-accent">a</span></span>

          {logoTooltipVisible && (
            <div className="logo-hover-signature" aria-hidden="true">
              crafted with ♡ by Z × A
            </div>
          )}
        </div>

        <ul className="nav-links">
          <li>
            <button className="nav-link-btn" onClick={onNavigateHome}>
              Home
            </button>
          </li>
          <li>
            <button
              className="nav-link-btn"
              onClick={() => handleScrollToSection('features')}
            >
              Features
            </button>
          </li>
          <li>
            <button
              className="nav-link-btn"
              onClick={() => handleScrollToSection('how-it-works')}
            >
              How it works
            </button>
          </li>
          {onOpenAbout && (
            <li>
              <button className="nav-link-btn" onClick={onOpenAbout}>
                About
              </button>
            </li>
          )}
        </ul>
      </div>

      <div className="nav-right">
        <div className="nav-right-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onOpenJoinRoom}>
            <LogIn size={16} />
            Join room
          </button>
          <button className="btn btn-primary" onClick={onOpenCreateRoom}>
            <PlusCircle size={16} />
            Create room
          </button>
        </div>

        <button
          className="btn-icon mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <button
            className="nav-link-btn"
            style={{ textAlign: 'left', padding: '10px' }}
            onClick={() => handleNavClick(onNavigateHome)}
          >
            Home
          </button>
          <button
            className="nav-link-btn"
            style={{ textAlign: 'left', padding: '10px' }}
            onClick={() => handleScrollToSection('features')}
          >
            Features
          </button>
          <button
            className="nav-link-btn"
            style={{ textAlign: 'left', padding: '10px' }}
            onClick={() => handleScrollToSection('how-it-works')}
          >
            How it works
          </button>
          {onOpenAbout && (
            <button
              className="nav-link-btn"
              style={{ textAlign: 'left', padding: '10px' }}
              onClick={() => handleNavClick(onOpenAbout)}
            >
              About
            </button>
          )}
          <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />
          <button className="btn btn-secondary" onClick={() => handleNavClick(onOpenJoinRoom)}>
            <LogIn size={16} /> Join room
          </button>
          <button className="btn btn-primary" onClick={() => handleNavClick(onOpenCreateRoom)}>
            <PlusCircle size={16} /> Create room
          </button>
        </div>
      )}
    </nav>
  );
};
