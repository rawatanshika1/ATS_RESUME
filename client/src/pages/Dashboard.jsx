import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, BriefcaseBusiness, FileHeart, FilePlus2, History, Lightbulb, MessageSquareText, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const tools = [
  { title: 'Analyze resume', description: 'See how your resume matches a role and get feedback you can use.', icon: FilePlus2, path: '/analyze', className: 'tool-featured', label: 'Get started' },
  { title: 'Build resume', description: 'Bring your experience together in a clear, polished resume.', icon: FileHeart, path: '/builder' },
  { title: 'Cover letter', description: 'Find the right words to introduce yourself for a role.', icon: MessageSquareText, path: '/builder' },
  { title: 'Interview prep', description: 'Practice telling your story with confidence.', icon: BriefcaseBusiness, path: '/builder' },
  { title: 'Skill roadmap', description: 'Turn missing role skills into a prioritized learning plan.', icon: Lightbulb, path: '/builder' },
  { title: 'History', description: 'Pick up where you left off and revisit your past reviews.', icon: History, path: '/history' }
];

const Dashboard = () => {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';

  return (
    <motion.div className="dashboard-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <section className="dashboard-welcome">
        <div className="welcome-copy">
          <span className="eyebrow"><Sparkles size={14} /> Your career, in motion</span>
          <h2>Good things are<br className="mobile-break" /> ahead, {firstName}.</h2>
          <p>Make your next application a little more you.</p>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="welcome-orbit orbit-one" /><div className="welcome-orbit orbit-two" />
          <div className="welcome-document"><span /><span /><span /><span className="welcome-document-badge"><Sparkles size={17} /></span></div>
          <span className="welcome-sparkle sparkle-one" /><span className="welcome-sparkle sparkle-two" />
        </div>
      </section>

      <section className="tool-section">
        <div className="section-heading">
          <div><span className="section-kicker">Your toolkit</span><h2>Where would you like to start?</h2></div>
          <p>Small steps add up to big opportunities.</p>
        </div>
        <div className="tool-grid">
          {tools.map(({ title, description, icon: Icon, path, soon, label }, index) => {
            const content = (
              <>
                <div className="tool-card-top"><span className="tool-icon"><Icon size={21} /></span>{soon ? <span className="coming-soon">Coming soon</span> : <ArrowUpRight size={18} className="tool-arrow" />}</div>
                <div><h3>{title}</h3><p>{description}</p></div>
                {label && <span className="tool-card-label">{label}<ArrowUpRight size={14} /></span>}
              </>
            );
            return (
              <motion.div key={title} className={`tool-card ${label ? 'tool-card-primary' : ''} ${soon ? 'tool-card-soon' : ''}`} whileHover={{ y: -3 }} transition={{ duration: 0.18 }} style={{ animationDelay: `${index * 45}ms` }}>
                {path ? <Link to={path} className="tool-card-link" aria-label={`${title}: ${description}`}>{content}</Link> : <div className="tool-card-content" aria-label={`${title}, coming soon`}>{content}</div>}
              </motion.div>
            );
          })}
        </div>
      </section>

      <aside className="dashboard-tip">
        <span className="tip-icon"><Sparkles size={17} /></span>
        <p><span>A little tip</span> Tailoring your resume to each role helps the right experience shine.</p>
        <Link to="/analyze">Give it a try <ArrowUpRight size={15} /></Link>
      </aside>
    </motion.div>
  );
};

export default Dashboard;
