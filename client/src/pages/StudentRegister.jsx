import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Scale } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { API_BASE_URL as API } from '../utils/api.js';

export default function StudentRegister() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/students/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed. Try again.'); return; }
      navigate('/student/login', {
        state: { message: '✅ Account created! Please sign in to continue.' }
      });
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
            <h1 className="text-2xl font-extrabold text-slate-900">Create your account</h1>
            <p className="mt-1 text-sm text-slate-500">Track your progress and unlock all passages</p>
          </div>

          <form onSubmit={submit} className="card p-7">
            {error && (
              <div className="mb-5 flex gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-6 w-full disabled:opacity-60"
            >
              {loading ? '⏳ Creating account…' : 'Create Account — Free'}
            </button>

            <p className="mt-5 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/student/login" className="font-bold text-indigo-600 hover:text-indigo-500 hover:underline">
                Sign in
              </Link>
            </p>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Registration is 100% free. We don't share your data.
          </p>
        </div>
      </main>
    </div>
  );
}
