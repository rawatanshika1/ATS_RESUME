import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await login(email, password);
      showToast('Welcome back! Logged in successfully.', 'success');
      navigate('/app');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="brand-lockup auth-brand"><span className="sidebar-brand-icon"><Sparkles size={19} /></span><span>Resume<span className="brand-accent">ly</span></span></Link>
      <div className="w-full max-w-md auth-container">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-500 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-main">Welcome back</h1>
          <p className="text-muted text-sm mt-2">A little more clarity for your next career move.</p>
        </div>

        {/* Login Form Card */}
        <div className="auth-card p-8 rounded-2xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-main mb-2">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="form-input w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-main mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="form-input w-full pl-10 pr-10 py-3 rounded-xl text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-main"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="button button-primary w-full py-3.5 px-4 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted border-t border-divider pt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent font-semibold hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
