import React from 'react';
import { ArrowLeft, BarChart3, FileHeart, FilePlus2, FileText, History, LogOut, Moon, Share2, Sun } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

const navigation = [
  { label: 'Dashboard', path: '/app', icon: BarChart3 },
  { label: 'Analyze resume', path: '/analyze', icon: FilePlus2 },
  { label: 'Resume builder', path: '/builder', icon: FileHeart },
  { label: 'History', path: '/history', icon: History }
];

const pageTitles = {
  '/app': 'Dashboard',
  '/analyze': 'Analyze resume',
  '/builder': 'Resume builder',
  '/builder/templates': 'Choose a template',
  '/history': 'Analysis history'
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const title = location.pathname.startsWith('/result/') ? 'Analysis report' :
    location.pathname.startsWith('/builder/') && location.pathname !== '/builder/templates' ? 'Resume editor' :
      pageTitles[location.pathname] || 'Dashboard';
  const isHome = location.pathname === '/app';

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Resume.ly', url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Page link copied to clipboard.', 'success');
      }
    } catch (error) {
      if (error.name !== 'AbortError') showToast('Could not share this page.', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <aside className="desktop-sidebar" aria-label="Main navigation">
        <Link to="/app" className="brand-lockup sidebar-brand">
          <span className="sidebar-brand-icon"><FileText size={19} /></span>
          <span>Resume<span className="brand-accent">ly</span></span>
        </Link>
        <p className="sidebar-label">Workspace</p>
        <nav className="sidebar-links">
          {navigation.map(({ label, path, icon: Icon }) => (
            <Link key={path} to={path} className={`sidebar-link ${location.pathname === path || (path === '/builder' && location.pathname.startsWith('/builder')) ? 'active' : ''}`}>
              <Icon size={18} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <span className="profile-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            <span className="profile-details"><span>{user?.name || 'Your account'}</span><small>{user?.email || 'Signed in'}</small></span>
          </div>
          <button className="sidebar-link sidebar-logout" onClick={handleLogout} type="button"><LogOut size={18} /><span>Sign out</span></button>
        </div>
      </aside>

      <header className="app-topbar">
        <button className={`icon-button topbar-back ${isHome ? 'back-hidden' : ''}`} type="button" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={19} />
        </button>
        <h1 className="topbar-title">{title}</h1>
        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={handleShare} aria-label="Share this page"><Share2 size={18} /></button>
          <button className="icon-button" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Main navigation">
        {navigation.map(({ label, path, icon: Icon }) => (
          <Link key={path} to={path} className={`mobile-nav-link ${location.pathname === path || (path === '/builder' && location.pathname.startsWith('/builder')) ? 'active' : ''}`}>
            <Icon size={20} /><span>{label === 'Analyze resume' ? 'Analyze' : label}</span>
          </Link>
        ))}
        <button type="button" onClick={handleLogout} className="mobile-nav-link"><LogOut size={20} /><span>Sign out</span></button>
      </nav>
    </>
  );
};

export default Navbar;
