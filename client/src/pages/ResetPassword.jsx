import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Scale, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { API_BASE_URL as API } from '../utils/api.js';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState('');

  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 4)  { setError('Password must be at least 4 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/students/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed. Please request a new link.'); return; }
      setDone(true);
      // Auto-redirect to login after 3 seconds
      setTimeout(() => navigate('/student/login', {
        state: { message: '✅ Password changed! Sign in with your new password.' }
      }), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── No token in URL ── */
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
          <div className="card p-8 text-center max-w-md w-full">
            <div className="text-4xl mb-4">🔗</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Reset Link</h2>
            <p className="text-sm text-slate-500 mb-6">
              This link is missing or broken. Please request a new password reset.
            </p>
            <Link to="/student/forgot-password" className="btn-primary">Request Reset Link</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Brand */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <Scale size={26} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Choose a new password</h1>
            <p className="mt-1 text-sm text-slate-500">Enter and confirm your new password below</p>
          </div>

          <div className="card p-7">
            {done ? (
              /* ── Success ── */
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Password changed!</h2>
                <p className="mt-3 text-sm text-slate-600">
                  Your password has been updated. Redirecting you to sign in…
                </p>
                <Link to="/student/login" className="btn-primary mt-6 inline-block">
                  Sign In Now
                </Link>
              </div>
            ) : (
              /* ── Form ── */
              <form onSubmit={submit}>
                {error && (
                  <div className="mb-5 flex gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
                    <span>⚠️</span><span>{error}</span>
                  </div>
                )}

                <div className="grid gap-5">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">New Password</span>
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
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Confirm Password</span>
                    <input
                      className={`input ${confirm && confirm !== password ? 'border-rose-400 focus:ring-rose-100' : ''}`}
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Repeat your new password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    {confirm && confirm !== password && (
                      <p className="text-xs text-rose-500">Passwords don't match</p>
                    )}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || (!!confirm && confirm !== password)}
                  className="btn-primary mt-6 w-full disabled:opacity-60"
                >
                  {loading ? '⏳ Saving…' : 'Set New Password'}
                </button>

                <p className="mt-4 text-center text-xs text-slate-400">
                  Reset link expires 1 hour after it was sent.{' '}
                  <Link to="/student/forgot-password" className="text-indigo-500 hover:underline">
                    Request a new one
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
