import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar.jsx';

import { API_BASE_URL as API } from '../utils/api.js';
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });
const emptyForm = { examId: '', pdfId: '', passageNumber: 1, title: '', content: '' };

export default function AdminPassages() {
  const [passages, setPassages] = useState([]);
  const [exams, setExams] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  const filteredPdfs = useMemo(
    () => pdfs.filter((pdf) => String(pdf.exam_id) === String(form.examId)),
    [pdfs, form.examId]
  );

  const load = async () => {
    const [passageRes, examRes, pdfRes] = await Promise.all([
      fetch(`${API}/admin/passages`, { headers: auth() }),
      fetch(`${API}/admin/exams`, { headers: auth() }),
      fetch(`${API}/admin/pdfs`, { headers: auth() })
    ]);
    const passageData = await passageRes.json();
    const examData = await examRes.json();
    const pdfData = await pdfRes.json();
    setPassages(passageData.passages || []);
    setExams(examData.exams || []);
    setPdfs(pdfData.pdfs || []);
    const firstExam = examData.exams?.[0];
    const firstPdf = pdfData.pdfs?.find((pdf) => pdf.exam_id === firstExam?.id);
    if (!form.examId && firstExam) {
      setForm((prev) => ({ ...prev, examId: String(firstExam.id), pdfId: firstPdf ? String(firstPdf.id) : '' }));
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!form.examId || editing) return;
    const firstPdf = filteredPdfs[0];
    if (firstPdf && !filteredPdfs.some((pdf) => String(pdf.id) === String(form.pdfId))) {
      setForm((prev) => ({ ...prev, pdfId: String(firstPdf.id) }));
    }
  }, [form.examId, form.pdfId, filteredPdfs, editing]);

  const reset = () => {
    const firstExam = exams[0];
    const firstPdf = pdfs.find((pdf) => pdf.exam_id === firstExam?.id);
    setEditing(null);
    setForm({ ...emptyForm, examId: firstExam ? String(firstExam.id) : '', pdfId: firstPdf ? String(firstPdf.id) : '' });
  };

  const save = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!form.examId) return setMessage('Please select an exam.');
    if (!form.pdfId) return setMessage('Please select a PDF. Manual passages must be linked to a PDF so students can see them.');
    if (!form.content.trim()) return setMessage('Passage content is required.');

    const url = editing ? `${API}/admin/passages/${editing.id}` : `${API}/admin/passages`;
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { ...auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setMessage(res.ok ? 'Saved passage. It will now appear for students under the selected PDF.' : data.error);
    if (res.ok) { reset(); load(); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this passage?')) return;
    await fetch(`${API}/admin/passages/${id}`, { method: 'DELETE', headers: auth() });
    load();
  };

  const edit = (passage) => {
    setEditing(passage);
    setForm({
      examId: String(passage.exam_id || ''),
      pdfId: String(passage.pdf_id || ''),
      passageNumber: passage.passage_number || 1,
      title: passage.title || '',
      content: passage.content || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <Navbar admin />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold">Manage Passages</h1>
          <a href="/admin/upload" className="btn-cyan">Upload PDF</a>
        </div>

        <form onSubmit={save} className="card mt-6 p-6">
          <h2 className="text-xl font-bold">{editing ? 'Edit Passage' : 'Add Passage Manually'}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <label className="grid gap-2 text-sm font-semibold">Exam
              <select className="input" value={form.examId} onChange={(e) => setForm({ ...form, examId: e.target.value, pdfId: '' })}>
                {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">PDF
              <select className="input" value={form.pdfId} onChange={(e) => setForm({ ...form, pdfId: e.target.value })}>
                <option value="">Select PDF</option>
                {filteredPdfs.map((pdf) => <option key={pdf.id} value={pdf.id}>{pdf.title}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">Passage Number
              <input className="input" type="number" value={form.passageNumber} onChange={(e) => setForm({ ...form, passageNumber: e.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Title
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
          </div>
          <label className="mt-4 grid gap-2 text-sm font-semibold">Content
            <textarea className="input min-h-48" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="btn-primary">Save Passage</button>
            {editing && <button type="button" onClick={reset} className="rounded-xl border px-5 py-3 font-semibold">Cancel Edit</button>}
          </div>
          {message && <p className="mt-4 rounded-lg bg-slate-100 p-3">{message}</p>}
        </form>

        <section className="mt-6 grid gap-4">
          {passages.map((passage) => (
            <article key={passage.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{passage.title || `Passage ${passage.passage_number}`}</h3>
                  <p className="text-sm text-slate-500">{passage.exam_name} · {passage.pdf_title || 'No PDF linked'} · Passage {passage.passage_number}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => edit(passage)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Edit</button>
                  <button onClick={() => remove(passage.id)} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white">Delete</button>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{passage.content}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
