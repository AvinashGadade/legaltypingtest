import { useEffect, useState, useCallback } from 'react';
import { Search, CheckCircle2, XCircle, User, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { API_BASE_URL as API } from '../utils/api.js';

function adminToken() {
  return localStorage.getItem('adminToken') || '';
}

function Badge({ status }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
        <CheckCircle2 size={11} /> Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
      <XCircle size={11} /> Free
    </span>
  );
}

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(null); // id of student being updated
  const [toast,    setToast]    = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchStudents = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/admin/students?search=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${adminToken()}` }
      });
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchStudents(search), 350);
    return () => clearTimeout(timer);
  }, [search, fetchStudents]);

  const toggleSubscription = async (student) => {
    const newStatus = student.subscription_status === 'active' ? 'free' : 'active';
    setUpdating(student.id);
    try {
      const res = await fetch(`${API}/admin/students/${student.id}/subscription`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken()}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) { showToast(`❌ ${data.error}`); return; }
      setStudents((prev) =>
        prev.map((s) => s.id === student.id ? { ...s, ...data.student } : s)
      );
      showToast(newStatus === 'active'
        ? `✅ ${student.name} — All passages unlocked!`
        : `🔒 ${student.name} — Access revoked`
      );
    } catch {
      showToast('❌ Network error. Try again.');
    } finally {
      setUpdating(null);
    }
  };

  const activeCount = students.filter((s) => s.subscription_status === 'active').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar admin />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl slide-down">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Manage Students</h1>
            <p className="mt-1 text-slate-500">
              {students.length} student{students.length !== 1 ? 's' : ''} found
              {activeCount > 0 && <span className="ml-2 font-semibold text-emerald-600">· {activeCount} active</span>}
            </p>
          </div>
          <button
            onClick={() => fetchStudents(search)}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Search */}
        <div className="mb-5 relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-11"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="text-3xl mb-3">⏳</div>Loading students…
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <User size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No students found</p>
              {search && <p className="text-sm mt-1">Try a different search term</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Student</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Tests</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Joined</th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge status={s.subscription_status} />
                        {s.subscription_type === 'manual' && (
                          <span className="ml-1 text-xs text-slate-400">(manual)</span>
                        )}
                        {s.subscription_type === 'lifetime' && (
                          <span className="ml-1 text-xs text-slate-400">(paid)</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600 tabular-nums">{s.test_count}</td>
                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {new Date(s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => toggleSubscription(s)}
                          disabled={updating === s.id}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50 ${
                            s.subscription_status === 'active'
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {updating === s.id
                            ? '⏳'
                            : s.subscription_status === 'active'
                            ? '🔒 Revoke'
                            : '🔓 Unlock All'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          🔓 Unlock All — student can access all passages without payment. &nbsp;
          🔒 Revoke — returns student to free tier (passages 1–4 only).
        </p>
      </main>
    </div>
  );
}
