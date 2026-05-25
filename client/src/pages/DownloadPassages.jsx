import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';

import { API_BASE_URL as API } from '../utils/api.js';

function sizeLabel(bytes) {
  if (!bytes) return 'Sample';
  return `${Math.round(bytes / 1024)} KB`;
}

export default function DownloadPassages() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [pdfs, setPdfs] = useState([]);
  const exam = exams.find((item) => String(item.id) === selectedExam);
  useEffect(() => { fetch(`${API}/exams`).then((res) => res.json()).then((data) => setExams(data.exams || [])); }, []);
  const show = () => selectedExam && fetch(`${API}/exams/${selectedExam}/pdfs`).then((res) => res.json()).then((data) => setPdfs(data.pdfs || []));
  const clear = () => { setSelectedExam(''); setPdfs([]); };
  return (
    <div><Navbar /><main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900">Download Passages</h1>
      <p className="mt-2 text-slate-600">Access official typing practice PDFs uploaded by admin</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="card p-5"><p className="text-slate-500">Available Exams</p><p className="text-3xl font-bold">{exams.length}</p></div><div className="card p-5"><p className="text-slate-500">Passages Found</p><p className="text-3xl font-bold">{exams.reduce((sum, e) => sum + (e.passage_count || 0), 0)}</p></div></div>
      <section className="card mt-6 p-6"><label className="grid gap-2 text-sm font-semibold text-slate-700">Select Exam<select className="input" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}><option value="">Choose exam</option>{exams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="mt-4 flex gap-3"><button onClick={show} className="btn-primary">Show Passages</button><button onClick={clear} className="rounded-xl border px-5 py-3 font-semibold">Clear</button></div></section>
      {exam && <p className="mt-6 font-semibold text-slate-700">Showing passages for {exam.name}</p>}
      <div className="mt-4 grid gap-4">{pdfs.map((pdf) => <div key={pdf.id} className="card flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"><div><h2 className="text-xl font-bold">{pdf.title}</h2><p className="mt-1 text-sm text-slate-500">{sizeLabel(pdf.file_size)} · {pdf.passage_count} passage(s) · {new Date(pdf.upload_date).toLocaleDateString()}</p></div><a className="btn-cyan text-center" href={`${API}/pdfs/${pdf.id}/download`}><Download className="mr-2 inline" size={18}/>Download PDF</a></div>)}</div>
      <div className="mt-8 flex flex-wrap gap-3"><Link className="rounded-xl border px-5 py-3 font-semibold" to="/">Back to Dashboard</Link><Link className="btn-primary" to="/practice">Start Typing Practice</Link></div>
    </main></div>
  );
}
