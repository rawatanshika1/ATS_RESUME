import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Menu, Moon, Sun, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const features = [
  {
    title: 'Know where you stand',
    description: 'See how your resume lines up with a role, with clear feedback you can act on.',
    icon: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-4 3 2 5-6" /><path d="M16 7h3v3" /></>
  },
  {
    title: 'Make every detail count',
    description: 'Bring the right skills and experience forward for the opportunity you want.',
    icon: <><path d="M12 3 4.5 7v5c0 4.5 3.2 7.7 7.5 9 4.3-1.3 7.5-4.5 7.5-9V7L12 3Z" /><path d="m9 12 2 2 4-4" /></>
  },
  {
    title: 'Keep your momentum',
    description: 'Save past reviews and see your application materials grow stronger over time.',
    icon: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="M7 15v-3m5 3V8m5 7v-5" /><path d="m7 9 5-4 5 2 3-3" /></>
  }
];

const modes = [
  ['General', 'A balanced review for any role or industry.'],
  ['Fresher', 'Highlight education, projects, and potential.'],
  ['Internship', 'Bring relevant coursework and early experience forward.'],
  ['LinkedIn', 'Shape a profile that tells your career story.']
];

function BrandMark({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="42" height="42" rx="8" fill="var(--primary)" />
      <path d="M15 32V16h5.2l8.1 10.2V16H33v16h-5.1l-8.2-10.3V32H15Z" fill="var(--primary-text)" />
      <path d="M35.2 11.5v5.2m-2.6-2.6h5.2" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Reveal({ children, className = '' }) {
  const elementRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !('IntersectionObserver' in window)) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.unobserve(element);
      }
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={elementRef} className={`landing-reveal ${visible ? 'is-visible' : ''} ${className}`}>{children}</div>;
}

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const startPath = isAuthenticated ? '/app' : '/register';
  const signInPath = isAuthenticated ? '/app' : '/login';
  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="brand-lockup" aria-label="Resume.ly home">
          <BrandMark className="brand-mark" />
          <span>Resume<span className="brand-accent">ly</span></span>
        </Link>
        <button
          className="landing-menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`landing-links ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <a href="#features" onClick={closeMenu}>Features</a>
          <a href="#how-it-works" onClick={closeMenu}>How it works</a>
          <a href="#modes" onClick={closeMenu}>Modes</a>
          <div className="landing-mobile-actions">
            <button className="icon-button landing-theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <Link className="landing-signin" to={signInPath} onClick={closeMenu}>
              {isAuthenticated ? 'Open workspace' : 'Sign in'}
            </Link>
            <Link className="button button-primary landing-nav-cta" to={startPath} onClick={closeMenu}>
              Get started
            </Link>
          </div>
        </nav>
        <div className="landing-desktop-actions">
          <button className="icon-button landing-theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link className="landing-signin" to={signInPath}>
            {isAuthenticated ? 'Open workspace' : 'Sign in'}
          </Link>
          <Link className="button button-primary landing-nav-cta" to={startPath}>Get started</Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="hero-content">
          <span className="hero-eyebrow"><span className="eyebrow-dot" />A clearer path from application to opportunity</span>
          <h1>Make your next move your best.</h1>
          <p>Thoughtful tools to help your experience stand out, get noticed, and land the role you deserve.</p>
          <div className="hero-actions">
            <Link className="button button-primary hero-cta" to={startPath}>
              Get started <ArrowRight size={18} />
            </Link>
            <a className="button button-outline hero-secondary" href="#how-it-works">See how it works</a>
          </div>
        </div>
      </section>

      <section className="landing-preview-section" aria-label="Example resume analysis">
        <Reveal>
          <div className="product-preview">
            <div className="preview-topline">
              <div><span className="preview-kicker">RESUME ANALYSIS</span><h2>Product designer</h2></div>
              <span className="sample-badge">Illustrative sample</span>
            </div>
            <div className="preview-content">
              <div className="preview-score">
                <svg viewBox="0 0 120 120" role="img" aria-label="Sample match score: 86 out of 100">
                  <circle className="gauge-track" cx="60" cy="60" r="49" />
                  <circle className="gauge-value" cx="60" cy="60" r="49" />
                </svg>
                <span className="gauge-number">86</span>
                <span className="gauge-caption">Match score</span>
              </div>
              <div className="preview-details">
                <div className="preview-chip-group">
                  <h3>Matched keywords</h3>
                  <div className="preview-chips"><span>Figma</span><span>Prototyping</span><span>User research</span></div>
                </div>
                <div className="preview-chip-group">
                  <h3>Worth adding</h3>
                  <div className="preview-chips preview-chips-muted"><span>Design systems</span><span>Accessibility</span></div>
                </div>
              </div>
            </div>
            <div className="preview-suggestions">
              <p><Check size={16} /> Add measurable outcomes to your project descriptions.</p>
              <p><Check size={16} /> Move your most relevant design work closer to the top.</p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="landing-section" id="features">
        <Reveal>
          <div className="landing-section-heading">
            <span className="section-kicker">A clearer next step</span>
            <h2>Make your experience work harder.</h2>
          </div>
          <div className="landing-feature-grid">
            {features.map((feature) => (
              <article className="landing-feature-card" key={feature.title}>
                <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{feature.icon}</svg></span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="landing-section landing-steps-section" id="how-it-works">
        <Reveal>
          <div className="landing-section-heading">
            <span className="section-kicker">How it works</span>
            <h2>Three steps to a stronger application.</h2>
          </div>
          <div className="landing-steps">
            {['Upload your resume', 'Add a job description', 'Get your score and fixes'].map((step, index) => (
              <article className="landing-step" key={step}>
                <span className="step-number">0{index + 1}</span>
                <h3>{step}</h3>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="landing-section" id="modes">
        <Reveal>
          <div className="landing-section-heading">
            <span className="section-kicker">Made for your next move</span>
            <h2>Feedback for where you are.</h2>
          </div>
          <div className="landing-modes">
            {modes.map(([title, description]) => (
              <article className="landing-mode-card" key={title}>
                <h3>{title}</h3><p>{description}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="landing-final-cta">
        <div><span className="section-kicker">Your next chapter starts here</span><h2>Take the next step with confidence.</h2></div>
        <Link className="button button-primary" to={startPath}>Get started <ArrowRight size={18} /></Link>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Resume.ly. A little more clarity for the career you’re building.</span>
        <div><a href="#features">Features</a><a href="#how-it-works">How it works</a><Link to={signInPath}>Sign in</Link></div>
      </footer>
    </main>
  );
};

export default Landing;
