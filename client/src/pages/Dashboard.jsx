import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Keyboard, Shield } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';

import { API_BASE_URL as API } from '../utils/api.js';

export default function Dashboard() {
  const [stats, setStats] = useState({ exams: 0, passages: 0, pdfs: 0, tests: 0 });
  useEffect(() => { fetch(`${API}/stats`).then((res) => res.json()).then(setStats).catch(() => {}); }, []);
  const cards = [
    ['Available Exams', stats.exams],
    ['Passages Found', stats.passages],
    ['Uploaded PDFs', stats.pdfs],
    ['Practice Tests', stats.tests]
  ];
  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-blue-700 p-8 text-white shadow-lg md:p-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Bombay High Court Clerk Typing Practice</h1>
            <p className="mt-4 text-lg text-white/85">Practice official typing passages with timer, WPM, accuracy and error analysis.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/practice" className="rounded-xl bg-white px-5 py-3 font-bold text-indigo-700 hover:bg-indigo-50"><Keyboard className="mr-2 inline" size={18}/>Start Typing Practice</Link>
              <Link to="/download-passages" className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-white hover:bg-cyan-500"><Download className="mr-2 inline" size={18}/>Download Passages</Link>
              <Link to="/admin/login" className="rounded-xl bg-white/15 px-5 py-3 font-bold text-white hover:bg-white/25"><Shield className="mr-2 inline" size={18}/>Admin Login</Link>
            </div>
          </div>
        </section>
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value]) => <div key={label} className="card p-6"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-4xl font-extrabold text-slate-900">{value}</p></div>)}
        </section>
      </main>
    </div>
  );
}
