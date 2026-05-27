import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Scale } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import Navbar from '../components/Navbar.jsx';
import { API_BASE_URL as API } from '../utils/api.js';

export default function StudentLogin() {
  const [mode,     setMode]     = useState('login'); // 'login' | 'register'
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const navigate   = useNavigate();
  const location   = useLocation();
  const message    = location.state?.message || '';
  const redirectTo = location.state?.from || '/student/history';

  const switchMode = (m) => { setMode(m); setError(''); setName(''); setEmail(''); setPassword(''); };

  /* ── Login ── */
  const submitLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res  = await fetch(`${API}/students/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed. Check your email and password.'); return; }
      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentName',  data.student.name);
      navigate(redirectTo);
    } catch { setError('Network error. Please try again.'); }
    finally  { setLoading(false); }
  };

  /* ── Register ── */
  const submitRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res  = await fetch(`${API}/students/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed. Try again.'); return; }
      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentName',  data.student.name);
      navigate('/student/history');
    } catch { setError('Network error. Please try again.'); }
    finally  { setLoading(false); }
  };

  /* ── Google OAuth (works for both login & register) ── */
  const onGoogleSuccess = async (credentialResponse) => {
    setError(''); setLoading(true);
    try {
      const res  = await fetch(`${API}/students/google`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Google sign-in failed. Please try again.'); return; }
      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentName',  data.student.name);
      navigate(mode === 'login' ? redirectTo : '/student/history');
    } catch { setError('Network error. Please try again.'); }
    finally  { setLoading(false); }
  };

  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Brand */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <Scale size={26} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isLogin
                ? 'Sign in to save your typing history and track progress'
                : 'Track your progress and unlock all passages — it\'s free'}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="mb-5 flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${isLogin ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${!isLogin ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Create Account
            </button>
          </div>

          <div className="card p-7">
            {/* Banners */}
            {message && (
              <div className="mb-5 flex gap-2 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-700">
                <span>ℹ️</span><span>{message}</span>
              </div>
            )}
            {error && (
              <div className="mb-5 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            {/* Google button */}
            <div className="mb-5 flex flex-col items-center gap-3">
              <GoogleLogin
                onSuccess={onGoogleSuccess}
                onError={() => setError('Google sign-in was cancelled or failed. Please try again.')}
                shape="rectangular"
                size="large"
                width="368"
                text={isLogin ? 'signin_with' : 'signup_with'}
                logo_alignment="left"
              />
            </div>

            {/* Divider */}
            <div className="relative mb-5 flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs font-semibold text-slate-400">OR</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            {/* Login Form */}
            {isLogin && (
              <form onSubmit={submitLogin}>
                <div className="grid gap-5">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Email address</span>
                    <input
                      className="input"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </label>
                  <label className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Password</span>
                      <Link to="/student/forgot-password" className="text-xs font-semibold text-indigo-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        className="input pr-11"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                        {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </label>
                </div>
                <button type="submit" disabled={loading} className="btn-primary mt-6 w-full disabled:opacity-60">
                  {loading ? '⏳ Signing in…' : 'Sign In with Email'}
                </button>
              </form>
            )}

            {/* Register Form */}
            {!isLogin && (
              <form onSubmit={submitRegister}>
                <div className="grid gap-5">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Full Name</span>
                    <input
                      className="input"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Email address</span>
                    <input
                      className="input"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Password</span>
                    <div className="relative">
                      <input
                        className="input pr-11"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Min. 4 characters"
                        minLength={4}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                        {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </label>
                </div>
                <button type="submit" disabled={loading} className="btn-primary mt-6 w-full disabled:opacity-60">
                  {loading ? '⏳ Creating account…' : 'Create Account — Free'}
                </button>
              </form>
            )}

            <p className="mt-5 text-center text-sm text-slate-500">
              {isLogin ? (
                <>New here?{' '}
                  <button onClick={() => switchMode('register')} className="font-bold text-indigo-600 hover:underline">
                    Create a free account
                  </button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button onClick={() => switchMode('login')} className="font-bold text-indigo-600 hover:underline">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            First 4 passages are free — no account needed to start practicing.
          </p>
        </div>
      </main>
    </div>
  );
}
