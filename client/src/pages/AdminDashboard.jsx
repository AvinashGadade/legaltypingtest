import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

import { API_BASE_URL as API } from '../utils/api.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ exams: 0, pdfs: 0, passages: 0, tests: 0 });
  useEffect(() => { fetch(`${API}/stats`).then((res) => res.json()).then(setStats); }, []);
  return <div><Navbar admin /><main className="mx-auto max-w-7xl px-4 py-8"><h1 className="text-3xl font-extrabold">Admin Dashboard</h1><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(stats).map(([key, value]) => <div key={key} className="card p-6"><p className="capitalize text-slate-500">{key}</p><p className="mt-2 text-4xl font-bold">{value}</p></div>)}</div><div className="mt-8 flex flex-wrap gap-4"><Link className="btn-primary" to="/admin/upload">Upload PDF</Link><Link className="btn-blue" to="/admin/passages">Manage Passages</Link></div></main></div>;
}
