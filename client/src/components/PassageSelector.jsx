import { useEffect, useState } from 'react';

import { API_BASE_URL as API } from '../utils/api.js';

export default function PassageSelector({ onStart }) {
  const [exams, setExams] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [passages, setPassages] = useState([]);
  const [examId, setExamId] = useState('');
  const [pdfId, setPdfId] = useState('');
  const [passageId, setPassageId] = useState('');
  const [loading, setLoading] = useState(false);

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

  const start = async () => {
    if (!passageId) return;
    const res = await fetch(`${API}/passages/${passageId}`);
    const data = await res.json();
    onStart(data.passage);
  };

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold text-slate-900">Select Passage</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">Select Exam
          <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">Select PDF
          <select className="input" value={pdfId} onChange={(e) => setPdfId(e.target.value)}>{pdfs.map((pdf) => <option key={pdf.id} value={pdf.id}>{pdf.title}</option>)}</select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">Select Passage Number
          <select className="input" value={passageId} onChange={(e) => setPassageId(e.target.value)}>{passages.map((passage) => <option key={passage.id} value={passage.id}>Passage {passage.passage_number}</option>)}</select>
        </label>
      </div>
      <button disabled={!passageId || loading} onClick={start} className="btn-primary mt-6 disabled:opacity-60">Start Test</button>
    </div>
  );
}
