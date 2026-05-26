import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, Mail } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { API_BASE_URL as API } from '../utils/api.js';

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/students/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong. Please try again.'); return; }
      setSent(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl font-extrabold text-slate-900">Reset your password</h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <div className="card p-7">
            {sent ? (
              /* ── Success state ── */
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Mail size={30} className="text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Check your inbox</h2>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  If <strong>{email}</strong> is registered, we've sent a password reset link.
                  Check your inbox (and spam folder). The link expires in <strong>1 hour</strong>.
                </p>
                <Link
                  to="/student/login"
                  className="btn-primary mt-6 inline-block"
                >
                  Back to Sign In
                </Link>
              </div>
            ) : (
              /* ── Form state ── */
              <form onSubmit={submit}>
                {error && (
                  <div className="mb-5 flex gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
                    <span>⚠️</span><span>{error}</span>
                  </div>
                )}

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
                    autoFocus
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary mt-6 w-full disabled:opacity-60"
                >
                  {loading ? '⏳ Sending…' : 'Send Reset Link'}
                </button>

                <p className="mt-5 text-center text-sm text-slate-500">
                  Remembered it?{' '}
                  <Link to="/student/login" className="font-bold text-indigo-600 hover:text-indigo-500 hover:underline">
                    Sign in
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
