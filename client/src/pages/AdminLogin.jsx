import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

import { API_BASE_URL as API } from '../utils/api.js';

export default function AdminLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const res = await fetch(`${API}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'Login failed');
    localStorage.setItem('adminToken', data.token);
    navigate('/admin/dashboard');
  };
  return <div><Navbar /><main className="mx-auto grid min-h-[75vh] max-w-md place-items-center px-4"><form onSubmit={submit} className="card w-full p-6"><h1 className="text-2xl font-bold">Admin Login</h1>{error && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-rose-700">{error}</p>}<label className="mt-5 grid gap-2 text-sm font-semibold">Username<input className="input" value={username} onChange={(e) => setUsername(e.target.value)} /></label><label className="mt-4 grid gap-2 text-sm font-semibold">Password<input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label><button className="btn-primary mt-6 w-full">Login</button></form></main></div>;
}
