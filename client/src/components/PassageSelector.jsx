import { useEffect, useState } from 'react';
import { Lock, PlayCircle } from 'lucide-react';

import { API_BASE_URL as API } from '../utils/api.js';

export default function PassageSelector({ onStart, onLocked }) {
  const [exams, setExams] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [passages, setPassages] = useState([]);
  const [examId, setExamId] = useState('');
  const [pdfId, setPdfId] = useState('');
  const [passageId, setPassageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API}/exams`).then((res) => res.json()).then((data) => {
      setExams(data.exams || []);
      if (data.exams?.[0]) setExamId(String(data.exams[0].id));
    });
  }, []);

  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    fetch(`${API}/exams/${examId}/pdfs`).then((res) => res.json()).then((data) => {
      setPdfs(data.pdfs || []);
      setPdfId(data.pdfs?.[0] ? String(data.pdfs[0].id) : '');
    }).finally(() => setLoading(false));
  }, [examId]);

  useEffect(() => {
    if (!pdfId) {
      setPassages([]);
      setPassageId('');
      return;
    }
    fetch(`${API}/pdfs/${pdfId}/passages`).then((res) => res.json()).then((data) => {
      setPassages(data.passages || []);
      setPassageId(data.passages?.[0] ? String(data.passages[0].id) : '');
    });
  }, [pdfId]);

  const selectedPassage = passages.find((passage) => String(passage.id) === String(passageId));

  const start = async () => {
    if (!passageId) return;
    setMessage('');
    const token = localStorage.getItem('studentToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API}/passages/${passageId}`, { headers });
    const data = await res.json();
    if (!res.ok) {
      if (data.code === 'LOGIN_REQUIRED') return onLocked?.('login', selectedPassage);
      if (data.code === 'SUBSCRIPTION_REQUIRED') return onLocked?.('subscription', selectedPassage);
      return setMessage(data.error || 'Unable to start this passage');
    }
    onStart(data.passage);
  };

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Select Passage</h2>
          <p className="mt-2 text-sm text-slate-600">Passages 1-4 are free. Passage 5 onwards requires login and lifetime subscription.</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">First 4 Free</span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">Select Exam
          <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">Select PDF
          <select className="input" value={pdfId} onChange={(e) => setPdfId(e.target.value)}>{pdfs.map((pdf) => <option key={pdf.id} value={pdf.id}>{pdf.title}</option>)}</select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">Select Passage Number
          <select className="input" value={passageId} onChange={(e) => setPassageId(e.target.value)}>{passages.map((passage) => <option key={passage.id} value={passage.id}>Passage {passage.passage_number}{passage.locked ? ' - Locked' : ' - Free'}</option>)}</select>
        </label>
      </div>
      {selectedPassage && <div className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${selectedPassage.locked ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>{selectedPassage.locked ? <Lock size={16} /> : <PlayCircle size={16} />}{selectedPassage.locked ? 'This passage is included in lifetime subscription.' : 'This passage is free to practice.'}</div>}
      <button disabled={!passageId || loading} onClick={start} className="btn-primary mt-6 disabled:opacity-60">Start Test</button>
      {message && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-rose-700">{message}</p>}
    </div>
  );
}
