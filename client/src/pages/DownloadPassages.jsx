import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, Calendar, HardDrive } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { API_BASE_URL as API } from '../utils/api.js';

function sizeLabel(bytes) {
  if (!bytes) return 'PDF';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DownloadPassages() {
  const [exams,        setExams]        = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [pdfs,         setPdfs]         = useState([]);
  const [loading,      setLoading]      = useState(false);

  const exam = exams.find((e) => String(e.id) === selectedExam);

  useEffect(() => {
    fetch(`${API}/exams`)
      .then((r) => r.json())
      .then((d) => setExams(d.exams || []));
  }, []);

  const show = () => {
    if (!selectedExam) return;
    setLoading(true);
    fetch(`${API}/exams/${selectedExam}/pdfs`)
      .then((r) => r.json())
      .then((d) => setPdfs(d.pdfs || []))
      .finally(() => setLoading(false));
  };

  const clear = () => { setSelectedExam(''); setPdfs([]); };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Download Passages</h1>
          <p className="mt-2 text-slate-500">
            Official Bombay High Court typing practice PDFs. Download and read before you type.
          </p>
        </div>

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="card p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{exams.length}</p>
              <p className="text-sm text-slate-500">Exams available</p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Download size={20} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">
                {exams.reduce((s, e) => s + (e.passage_count || 0), 0)}
              </p>
              <p className="text-sm text-slate-500">Total passages</p>
            </div>
          </div>
        </div>

        {/* Selector */}
        <div className="card mb-6 p-6">
          <h2 className="mb-4 font-bold text-slate-800">Find passages by exam</h2>
          <div className="flex flex-wrap gap-3">
            <select
              className="input max-w-sm"
              value={selectedExam}
              onChange={(e) => { setSelectedExam(e.target.value); setPdfs([]); }}
            >
              <option value="">Choose an exam…</option>
              {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <button onClick={show} disabled={!selectedExam || loading} className="btn-primary disabled:opacity-60">
              {loading ? '⏳ Loading…' : 'Show Passages'}
            </button>
            {pdfs.length > 0 && (
              <button onClick={clear} className="btn-ghost">Clear</button>
            )}
          </div>
        </div>

        {/* PDF cards */}
        {exam && pdfs.length > 0 && (
          <>
            <p className="mb-4 font-semibold text-slate-600">
              Showing {pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''} for{' '}
              <span className="text-slate-900">{exam.name}</span>
            </p>
            <div className="grid gap-4">
              {pdfs.map((pdf) => (
                <div key={pdf.id} className="card-hover flex flex-col gap-4 p-5 md:flex-row md:items-center">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                      <FileText size={22} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{pdf.title}</h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <HardDrive size={11} /> {sizeLabel(pdf.file_size)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText size={11} /> {pdf.passage_count || 0} passage{pdf.passage_count !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {new Date(pdf.upload_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={`${API}/pdfs/${pdf.id}/download`}
                    className="btn-cyan shrink-0"
                    download
                  >
                    <Download size={16} /> Download PDF
                  </a>
                </div>
              ))}
            </div>
          </>
        )}

        {exam && pdfs.length === 0 && !loading && selectedExam && (
          <div className="card p-10 text-center text-slate-400">
            <div className="text-5xl mb-3">📂</div>
            <p>No PDFs found for this exam yet. Check back later.</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="btn-ghost">← Home</Link>
          <Link to="/practice" className="btn-primary">Start Typing Practice</Link>
        </div>
      </main>
    </div>
  );
}
