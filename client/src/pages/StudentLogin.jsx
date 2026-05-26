import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

import { API_BASE_URL as API } from '../utils/api.js';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message || '';
  const redirectTo = location.state?.from || '/student/history';

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const res = await fetch(`${API}/students/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'Login failed');
    localStorage.setItem('studentToken', data.token);
    localStorage.setItem('studentName', data.student.name);
    navigate(redirectTo);
  };

  return (
    <div>
      <Navbar />
      <main className="mx-auto grid min-h-[75vh] max-w-md place-items-center px-4">
        <form onSubmit={submit} className="card w-full p-6">
          <h1 className="text-2xl font-bold">Student Login</h1>
          <p className="mt-2 text-sm text-slate-500">Login to save your typing test history.</p>
          {message && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-emerald-700">{message}</p>}
          {error && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-rose-700">{error}</p>}
          <label className="mt-5 grid gap-2 text-sm font-semibold">Email
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-semibold">Password
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn-primary mt-6 w-full">Login</button>
          <p className="mt-4 text-center text-sm text-slate-600">New student? <Link className="font-bold text-indigo-700" to="/student/register">Register</Link></p>
        </form>
      </main>
    </div>
  );
}
