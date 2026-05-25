import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';

import { API_BASE_URL as API } from '../utils/api.js';
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

export default function AdminUpload() {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [newExam, setNewExam] = useState('');
  const [title, setTitle] = useState('');
  const [pdf, setPdf] = useState(null);
  const [manualText, setManualText] = useState('');
  const [message, setMessage] = useState('');
  const load = () => fetch(`${API}/admin/exams`, { headers: auth() }).then((res) => res.json()).then((data) => { setExams(data.exams || []); if (data.exams?.[0]) setExamId(String(data.exams[0].id)); });
  useEffect(load, []);
  const addExam = async () => { if (!newExam.trim()) return; await fetch(`${API}/admin/exams`, { method: 'POST', headers: { ...auth(), 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newExam }) }); setNewExam(''); load(); };
  const upload = async (event) => {
    event.preventDefault(); setMessage('Uploading and extracting PDF...');
    if (!pdf || pdf.type !== 'application/pdf') return setMessage('Please select a valid PDF file.');
    const form = new FormData(); form.append('examId', examId); form.append('title', title); form.append('manualText', manualText); form.append('pdf', pdf);
    const res = await fetch(`${API}/admin/upload-pdf`, { method: 'POST', headers: auth(), body: form });
    const data = await res.json(); setMessage(res.ok ? (data.warning || `Uploaded. ${data.passagesCreated} passage(s) extracted.`) : data.error);
  };
  return <div><Navbar admin /><main className="mx-auto max-w-5xl px-4 py-8"><h1 className="text-3xl font-extrabold">Upload PDF</h1><section className="card mt-6 p-6"><h2 className="text-xl font-bold">Add Exam Name</h2><div className="mt-4 flex gap-3"><input className="input" value={newExam} onChange={(e) => setNewExam(e.target.value)} placeholder="Exam name" /><button onClick={addExam} className="btn-blue">Add</button></div></section><form onSubmit={upload} className="card mt-6 p-6"><label className="grid gap-2 text-sm font-semibold">Exam name<select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select></label><label className="mt-4 grid gap-2 text-sm font-semibold">PDF title<input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required /></label><label className="mt-4 grid gap-2 text-sm font-semibold">Upload PDF file<input className="input" type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files[0])} required /></label><label className="mt-4 grid gap-2 text-sm font-semibold">Optional manual passage text for scanned PDFs<textarea className="input min-h-40" value={manualText} onChange={(e) => setManualText(e.target.value)} placeholder="Paste passage text here if the PDF is scanned or extraction gives 0 passages." /></label><button className="btn-primary mt-6">Upload PDF</button>{message && <p className="mt-4 rounded-lg bg-slate-100 p-3 text-slate-700">{message}</p>}</form></main></div>;
}
