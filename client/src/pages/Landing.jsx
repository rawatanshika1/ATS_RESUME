import React from 'react';
import { ArrowRight, Check, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function BrandMark({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="42" height="42" rx="15" fill="url(#brand-gradient)" />
      <path d="M15 32V16h5.2l8.1 10.2V16H33v16h-5.1l-8.2-10.3V32H15Z" fill="white" />
      <path d="M35.2 11.5v5.2m-2.6-2.6h5.2" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
      <defs>
        <linearGradient id="brand-gradient" x1="3" y1="3" x2="45" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8272F4" />
          <stop offset="1" stopColor="#5040C8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="brand-lockup">
          <BrandMark className="brand-mark" />
          <span>Resume<span className="brand-accent">ly</span></span>
        </Link>
        <div className="landing-nav-actions">
          <button className="icon-button landing-theme" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link className="landing-signin" to={isAuthenticated ? '/app' : '/login'}>
            {isAuthenticated ? 'Open workspace' : 'Sign in'}
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="hero-content">
          <span className="hero-eyebrow"><span className="eyebrow-dot" /> YOUR NEXT CHAPTER STARTS HERE</span>
          <BrandMark className="hero-logo" />
          <h1>Make your next<br /><span>move your best.</span></h1>
          <p>Thoughtful tools to help your experience stand out, get noticed, and land the role you deserve.</p>
          <Link className="button button-primary hero-cta" to={isAuthenticated ? '/app' : '/register'}>
            Get Started <ArrowRight size={18} />
          </Link>
          <div className="hero-proof"><Check size={15} /> A clearer path from application to opportunity</div>
        </div>
        <div className="hero-note"><span className="hero-note-icon">✦</span><span><strong>Made for your next move</strong><small>Less guesswork. More confidence.</small></span></div>
      </section>

      <section className="landing-benefits" aria-label="How Resume.ly helps">
        <article><span className="benefit-number">01</span><h2>Know where you stand</h2><p>See how your resume lines up with the role, with practical feedback you can act on.</p></article>
        <article><span className="benefit-number">02</span><h2>Make every detail count</h2><p>Find the skills and experience worth bringing forward for your next opportunity.</p></article>
        <article><span className="benefit-number">03</span><h2>Keep your momentum</h2><p>Save past reviews and watch your application materials get stronger over time.</p></article>
      </section>
      <footer className="landing-footer">A little more clarity for the career you’re building.</footer>
    </main>
  );
};

export default Landing;
