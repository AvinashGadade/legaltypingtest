import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Target, Keyboard, Award } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { API_BASE_URL as API } from '../utils/api.js';

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('studentToken')}` });

export default function StudentHistory() {
  const [history, setHistory] = useState([]);
  const [error,   setError]   = useState('');
  const studentName = localStorage.getItem('studentName');

  useEffect(() => {
    fetch(`${API}/students/history`, { headers: auth() })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => ok ? setHistory(d.history || []) : setError(d.error || 'Unable to load history'))
      .catch(() => setError('Unable to load history. Please check your connection.'));
  }, []);

  /* ── Derived summary stats ── */
  const best      = history.reduce((acc, r) => Math.max(acc, r.wpm || 0), 0);
  const avgAcc    = history.length
    ? Math.round(history.reduce((s, r) => s + (r.accuracy || 0), 0) / history.length)
    : 0;
  const qualified = history.filter((r) => r.qualified).length;

  const summaryCards = [
    { icon: TrendingUp, label: 'Best WPM',      value: best || '—',             color: 'bg-indigo-50 text-indigo-600' },
    { icon: Target,     label: 'Avg Accuracy',  value: history.length ? `${avgAcc}%` : '—', color: 'bg-emerald-50 text-emerald-600' },
    { icon: Keyboard,   label: 'Tests Taken',   value: history.length,          color: 'bg-amber-50  text-amber-600'  },
    { icon: Award,      label: 'Times Qualified', value: qualified,             color: 'bg-rose-50   text-rose-600'   }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">My Typing History</h1>
            {studentName && (
              <p className="mt-1 text-slate-500">Welcome back, <span className="font-semibold text-slate-700">{studentName}</span>!</p>
            )}
          </div>
          <Link className="btn-primary" to="/practice">
            + New Test
          </Link>
        </div>

        {/* Summary cards */}
        {history.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="card p-5">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon size={20} />
                </div>
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="mt-0.5 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="card mb-5 p-5 text-rose-600">
            <p className="font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* History table */}
        <div className="card overflow-hidden">
          {history.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-6xl">⌨️</div>
              <h3 className="text-xl font-bold text-slate-900">No tests yet</h3>
              <p className="mt-2 max-w-xs text-sm text-slate-500">
                Complete your first typing test and your results will show up here.
              </p>
              <Link to="/practice" className="btn-primary mt-6">Start Your First Test</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50">
                  <tr>
                    {['Date & Time', 'Passage', 'Net WPM', 'Accuracy', 'Backspaces', 'Marks', 'Status', 'Result'].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {history.map((item, idx) => (
                    <tr key={item.id} className={`transition-colors hover:bg-indigo-50/30 ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="px-5 py-4 text-slate-500">
                        {new Date(item.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                        <br />
                        <span className="text-xs text-slate-400">
                          {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-700">
                        Passage {item.passage_number || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-base font-black tabular-nums ${(item.wpm || 0) >= 40 ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {item.wpm}
                        </span>
                        <span className="text-xs text-slate-400"> WPM</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-semibold ${(item.accuracy || 0) >= 90 ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {item.accuracy}%
                        </span>
                      </td>
                      <td className="px-5 py-4 tabular-nums text-slate-600">{item.backspaces}</td>
                      <td className="px-5 py-4">
                        <span className={`font-bold ${(item.marks || 0) >= 10 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {item.marks} <span className="text-xs font-normal text-slate-400">/ 20</span>
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                          item.qualified
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-600'
                        }`}>
                          {item.qualified ? '✓ Qualified' : '✗ Not Qualified'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/result/${item.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-center text-slate-400">
          Qualification criteria: Net WPM ≥ 40 and Marks ≥ 10 out of 20
        </p>
      </main>
    </div>
  );
}
