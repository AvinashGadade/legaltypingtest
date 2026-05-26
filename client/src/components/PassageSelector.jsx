import { useEffect, useState } from 'react';
import { Lock, Unlock, PlayCircle, ChevronRight } from 'lucide-react';
import { API_BASE_URL as API } from '../utils/api.js';

export default function PassageSelector({ onStart, onLocked }) {
  const [exams,      setExams]      = useState([]);
  const [pdfs,       setPdfs]       = useState([]);
  const [passages,   setPassages]   = useState([]);
  const [examId,     setExamId]     = useState('');
  const [pdfId,      setPdfId]      = useState('');
  const [passageId,  setPassageId]  = useState('');
  const [loading,    setLoading]    = useState(false);
  const [starting,   setStarting]   = useState(false);
  const [message,    setMessage]    = useState('');

  /* ── Load exams on mount ── */
  useEffect(() => {
    fetch(`${API}/exams`)
      .then((r) => r.json())
      .then((d) => {
        setExams(d.exams || []);
        if (d.exams?.[0]) setExamId(String(d.exams[0].id));
      });
  }, []);

  /* ── Load PDFs when exam changes ── */
  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    setPdfs([]);
    setPdfId('');
    setPassages([]);
    setPassageId('');
    fetch(`${API}/exams/${examId}/pdfs`)
      .then((r) => r.json())
      .then((d) => {
        setPdfs(d.pdfs || []);
        if (d.pdfs?.[0]) setPdfId(String(d.pdfs[0].id));
      })
      .finally(() => setLoading(false));
  }, [examId]);

  /* ── Load passages when PDF changes ── */
  useEffect(() => {
    if (!pdfId) { setPassages([]); setPassageId(''); return; }
    fetch(`${API}/pdfs/${pdfId}/passages`)
      .then((r) => r.json())
      .then((d) => {
        setPassages(d.passages || []);
        setPassageId(d.passages?.[0] ? String(d.passages[0].id) : '');
      });
  }, [pdfId]);

  const selected = passages.find((p) => String(p.id) === String(passageId));

  const start = async () => {
    if (!passageId || starting) return;
    setMessage('');
    setStarting(true);
    const token   = localStorage.getItem('studentToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res  = await fetch(`${API}/passages/${passageId}`, { headers });
    const data = await res.json();
    setStarting(false);
    if (!res.ok) {
      if (data.code === 'LOGIN_REQUIRED')       return onLocked?.('login', selected);
      if (data.code === 'SUBSCRIPTION_REQUIRED') return onLocked?.('subscription', selected);
      return setMessage(data.error || 'Unable to start this passage');
    }
    onStart(data.passage);
  };

  return (
    <div className="card p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Choose Your Passage</h2>
          <p className="mt-1 text-sm text-slate-500">
            Passages 1–4 are completely free. Passage 5 onwards needs a subscription.
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
          First 4 Free — No Login Needed
        </span>
      </div>

      {/* Exam + PDF selectors */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-slate-700">Select Exam</label>
          <select
            className="input"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
          >
            {exams.length === 0 && <option value="">Loading exams…</option>}
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-slate-700">Select PDF / Paper</label>
          <select
            className="input"
            value={pdfId}
            disabled={!examId || loading}
            onChange={(e) => setPdfId(e.target.value)}
          >
            {loading && <option>Loading…</option>}
            {!loading && pdfs.length === 0 && <option value="">No PDFs available</option>}
            {pdfs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      </div>

      {/* Passage cards */}
      {passages.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">Select Passage</p>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {passages.map((p) => {
              const isSelected = String(p.id) === String(passageId);
              const isLocked   = p.locked;
              return (
                <button
                  key={p.id}
                  onClick={() => setPassageId(String(p.id))}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-150 ${
                    isSelected
                      ? isLocked
                        ? 'border-amber-400 bg-amber-50 shadow-sm shadow-amber-100'
                        : 'border-indigo-400 bg-indigo-50 shadow-sm shadow-indigo-100'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                    isSelected
                      ? isLocked ? 'bg-amber-200 text-amber-800' : 'bg-indigo-200 text-indigo-800'
                      : isLocked ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {p.passage_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {p.title || `Passage ${p.passage_number}`}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1">
                      {isLocked
                        ? <><Lock size={11} className="text-amber-500" /><span className="text-xs text-amber-600 font-medium">Subscription</span></>
                        : <><Unlock size={11} className="text-emerald-500" /><span className="text-xs text-emerald-600 font-medium">Free</span></>
                      }
                    </div>
                  </div>
                  {isSelected && <ChevronRight size={16} className={isLocked ? 'text-amber-500' : 'text-indigo-500'} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selection info + Start button */}
      {selected && (
        <div className={`mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl p-4 ${
          selected.locked ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {selected.locked
              ? <Lock size={16} className="text-amber-500" />
              : <PlayCircle size={16} className="text-emerald-600" />
            }
            <span className={`text-sm font-semibold ${selected.locked ? 'text-amber-800' : 'text-emerald-800'}`}>
              {selected.locked
                ? 'This passage requires lifetime subscription.'
                : 'This passage is free — start any time, no login needed.'}
            </span>
          </div>
          <button
            disabled={!passageId || starting}
            onClick={start}
            className="btn-primary disabled:opacity-60"
          >
            {starting ? '⏳ Loading…' : '▶ Start Test'}
          </button>
        </div>
      )}

      {passages.length === 0 && !loading && pdfId && (
        <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-6 text-center text-slate-500 text-sm">
          No passages found for this PDF. Ask the admin to add passages.
        </div>
      )}

      {message && (
        <p className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          {message}
        </p>
      )}
    </div>
  );
}
