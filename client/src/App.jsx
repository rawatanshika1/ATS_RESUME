import React, { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import WaveBackground from './components/WaveBackground';

const Analyze = lazy(() => import('./pages/Analyze'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const History = lazy(() => import('./pages/History'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Result = lazy(() => import('./pages/Result'));
const ResumeList = lazy(() => import('./pages/ResumeList'));
const ResumeTemplates = lazy(() => import('./pages/ResumeTemplates'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const SharedReport = lazy(() => import('./pages/SharedReport'));

function PageLoading() {
  return <div className="app-loading" role="status" aria-label="Loading page"><span /></div>;
}

function Workspace() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-content">
        <Suspense fallback={<PageLoading />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="page-transition"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Routes location={location}>
                <Route path="/app" element={<Dashboard />} />
                <Route path="/analyze" element={<Analyze />} />
                <Route path="/result/:id" element={<Result />} />
                <Route path="/history" element={<History />} />
                <Route path="/builder" element={<ResumeList />} />
                <Route path="/builder/templates" element={<ResumeTemplates />} />
                <Route path="/builder/new" element={<ResumeBuilder />} />
                <Route path="/builder/:id" element={<ResumeBuilder />} />
                <Route path="*" element={<Navigate to="/app" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  return (
    <>
      <WaveBackground />
      <Routes>
        <Route path="/" element={<Suspense fallback={<PageLoading />}><Landing /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<PageLoading />}><Login /></Suspense>} />
        <Route path="/register" element={<Suspense fallback={<PageLoading />}><Register /></Suspense>} />
        <Route path="/shared-report/:token" element={<Suspense fallback={<PageLoading />}><SharedReport /></Suspense>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<Workspace />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
