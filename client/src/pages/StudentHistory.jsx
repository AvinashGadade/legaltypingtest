import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

import { API_BASE_URL as API } from '../utils/api.js';
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('studentToken')}` });

export default function StudentHistory() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/students/history`, { headers: auth() })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => ok ? setHistory(data.history || []) : setError(data.error || 'Unable to load history'))
      .catch(() => setError('Unable to load history'));
  }, []);

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold">My Typing History</h1>
            <p className="mt-2 text-slate-600">Stored fields: WPM, backspace, accuracy, marks obtained, and qualification.</p>
          </div>
          <Link className="btn-primary" to="/practice">Start Practice</Link>
        </div>
        {error && <div className="card mt-6 p-5 text-rose-700">{error}</div>}
        <div className="card mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Passage</th>
                  <th className="px-4 py-3">WPM</th>
                  <th className="px-4 py-3">Backspace</th>
                  <th className="px-4 py-3">Accuracy</th>
                  <th className="px-4 py-3">Marks</th>
                  <th className="px-4 py-3">Qualified</th>
                  <th className="px-4 py-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3">{new Date(item.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">Passage {item.passage_number || '-'}</td>
                    <td className="px-4 py-3 font-bold">{item.wpm} WPM</td>
                    <td className="px-4 py-3">{item.backspaces}</td>
                    <td className="px-4 py-3">{item.accuracy}%</td>
                    <td className="px-4 py-3">{item.marks} / 20</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.qualified ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{item.qualified ? 'Qualified' : 'Not Qualified'}</span></td>
                    <td className="px-4 py-3"><Link className="font-bold text-indigo-700" to={`/result/${item.id}`}>Open</Link></td>
                  </tr>
                ))}
                {!history.length && !error && <tr><td colSpan="8" className="px-4 py-10 text-center text-slate-500">No test history yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
