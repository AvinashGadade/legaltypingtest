import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, FileText, Users, BarChart2 } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { API_BASE_URL as API } from '../utils/api.js';

const statConfig = [
  { key: 'exams',    label: 'Exams',    icon: BarChart2,   color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
  { key: 'pdfs',     label: 'PDFs',     icon: FileText,    color: 'text-blue-600',    bg: 'bg-blue-50'    },
  { key: 'passages', label: 'Passages', icon: FileText,    color: 'text-violet-600',  bg: 'bg-violet-50'  },
  { key: 'tests',    label: 'Tests',    icon: BarChart2,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({ exams: 0, pdfs: 0, passages: 0, tests: 0 });

  useEffect(() => {
    fetch(`${API}/stats`).then((r) => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar admin />
      <main className="mx-auto max-w-5xl px-4 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-slate-500">Manage passages, PDFs, and students</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statConfig.map(({ key, label, icon: Icon, color, bg }) => (
            <div key={key} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-1 text-4xl font-black tabular-nums text-slate-900">{stats[key]}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                  <Icon size={22} className={color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Link to="/admin/upload" className="card flex items-center gap-4 p-6 hover:shadow-md transition-shadow">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
              <UploadCloud size={22} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Upload PDF</p>
              <p className="text-sm text-slate-500">Add new exam PDF</p>
            </div>
          </Link>

          <Link to="/admin/passages" className="card flex items-center gap-4 p-6 hover:shadow-md transition-shadow">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <FileText size={22} className="text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Manage Passages</p>
              <p className="text-sm text-slate-500">Edit passage content</p>
            </div>
          </Link>

          <Link to="/admin/students" className="card flex items-center gap-4 p-6 hover:shadow-md transition-shadow">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <Users size={22} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Manage Students</p>
              <p className="text-sm text-slate-500">Unlock passage access</p>
            </div>
          </Link>
        </div>

      </main>
    </div>
  );
}
