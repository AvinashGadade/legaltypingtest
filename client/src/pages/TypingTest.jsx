import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Download, Maximize, Settings } from 'lucide-react';
import { formatTime } from '../utils/formatTime.js';

import { API_BASE_URL as API } from '../utils/api.js';

export default function TypingTest() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const passage = state?.passage;
  const [typedText, setTypedText] = useState('');
  const [duration, setDuration] = useState(600);
  const [remaining, setRemaining] = useState(600);
  const [started, setStarted] = useState(false);
  const [backspaces, setBackspaces] = useState(0);
  const [allowBackspace, setAllowBackspace] = useState(true);
  const [fontSize, setFontSize] = useState('medium');
  const [showOriginal, setShowOriginal] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => { if (!passage) navigate('/practice'); }, [passage, navigate]);
  useEffect(() => {
    if (!started || submittedRef.current) return;
    const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [started]);
  useEffect(() => { if (started && remaining === 0) submit(); }, [remaining, started]);
  useEffect(() => {
    const warn = (event) => { if (started && !submittedRef.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [started]);

  const submit = async () => {
    if (submittedRef.current || submitting) return;
    if (!typedText.trim()) return alert('Please type something before submitting.');
    submittedRef.current = true;
    setSubmitting(true);
    const durationSeconds = duration - remaining || 1;
    const token = localStorage.getItem('studentToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API}/results`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        examId: passage.exam_id,
        pdfId: passage.pdf_id,
        passageId: passage.id,
        originalText: passage.content,
        typedText,
        durationSeconds,
        backspaceCount: backspaces,
        keystrokes: typedText.length
      })
    });
    const data = await res.json();
    if (!res.ok) {
      submittedRef.current = false;
      setSubmitting(false);
      if (data.code === 'LOGIN_REQUIRED') return navigate('/student/login', { state: { from: '/practice', message: 'Please login to save premium passage results.' } });
      if (data.code === 'SUBSCRIPTION_REQUIRED') return navigate('/subscription', { state: { message: 'Please unlock lifetime access to submit this passage.' } });
      return alert(data.error || 'Unable to submit result');
    }
    if (!data.id) {
      return navigate('/result/preview', { state: { result: { ...data.result, exam_name: passage.exam_name, pdf_title: passage.pdf_title, passage_number: passage.passage_number, original_text: passage.content, typed_text: typedText, highlighted_original: data.result.highlightedOriginal, highlighted_typed: data.result.highlightedTyped, duration_formatted: data.result.durationFormatted, duration_seconds: data.result.durationSeconds, keystrokes: data.result.totalKeystrokes, backspaces: data.result.backspaceCount, total_words_typed: data.result.totalWordsTyped, gross_wpm: data.result.grossWpm, net_wpm: data.result.netWpm, error_percentage: data.result.errorPercentage, full_errors: data.result.errors.fullErrors, half_errors: data.result.errors.halfErrors, total_errors: data.result.errors.totalErrors, spelling_substitution_repetition: data.result.errors.spellingSubstitutionRepetition, incomplete_words: data.result.errors.incompleteWords, spacing_errors: data.result.errors.spacing, capitalization_errors: data.result.errors.capitalization, punctuation_errors: data.result.errors.punctuation, transposition_errors: data.result.errors.transposition, paragraphic_errors: data.result.errors.paragraphic, tab_errors: data.result.errors.tab, additions: data.result.errors.additions, omissions: data.result.errors.omissions }, preview: true } });
    }
    navigate(`/result/${data.id}`);
  };

  if (!passage) return null;
  const textSize = fontSize === 'small' ? 'text-base' : fontSize === 'large' ? 'text-2xl' : 'text-xl';
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-blue-700 px-4 py-4 text-center text-xl font-bold text-white">Typing Test - {passage.exam_name} {passage.passage_number}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
        <span>{passage.exam_name}</span><span>Time left: {formatTime(remaining)}</span>
        <a className="text-cyan-300" href={`${API}/pdfs/${passage.pdf_id}/download`}><Download className="mr-1 inline" size={16}/>Click to Download Passage PDF</a>
        <button onClick={() => setAllowBackspace((value) => !value)} className={allowBackspace ? 'text-emerald-300' : 'text-rose-300'}>{allowBackspace ? 'Backspace: Allowed' : 'Backspace: Disabled'}</button>
        <button onClick={() => setSettingsOpen(true)}><Settings className="mr-1 inline" size={16}/>Settings</button>
        <button onClick={() => document.documentElement.requestFullscreen?.()}><Maximize className="mr-1 inline" size={16}/>Full Screen</button>
      </div>
      <div className="bg-sky-500 px-4 py-2 text-center text-sm font-bold text-white">Keyboard Layout: QWERTY &nbsp;&nbsp; Language: English</div>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {showOriginal && <section className="card mb-4 p-5"><h2 className="font-bold">Original Passage</h2><p className="mt-3 whitespace-pre-wrap leading-8 text-slate-700">{passage.content}</p></section>}
        <textarea
          className={`h-[350px] w-full resize-none border-2 border-slate-950 bg-white p-4 leading-[1.7] outline-none ${textSize}`}
          placeholder="Start typing here to begin the test..."
          value={typedText}
          spellCheck="false"
          autoComplete="off"
          onContextMenu={(e) => e.preventDefault()}
          onPaste={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
          onKeyDown={(e) => { if (e.key === 'Backspace') { if (!allowBackspace) { e.preventDefault(); return; } setBackspaces((value) => value + 1); } }}
          onChange={(e) => { if (!started && e.target.value.length > 0) setStarted(true); setTypedText(e.target.value); }}
        />
        <div className="mt-5 flex justify-end gap-3"><Link to="/practice" className="btn-red">Cancel</Link><button disabled={submitting} onClick={submit} className="btn-blue disabled:opacity-60">Submit</button></div>
      </main>
      {settingsOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="card w-full max-w-lg p-6"><h2 className="text-2xl font-bold">Settings</h2><div className="mt-5 grid gap-4"><label className="grid gap-2 text-sm font-semibold">Test duration<select className="input" value={duration} onChange={(e) => { const next = Number(e.target.value); setDuration(next); setRemaining(next); }} disabled={started}><option value={300}>5 min</option><option value={600}>10 min</option><option value={900}>15 min</option></select></label><label className="grid gap-2 text-sm font-semibold">Font size<select className="input" value={fontSize} onChange={(e) => setFontSize(e.target.value)}><option value="small">small</option><option value="medium">medium</option><option value="large">large</option></select></label><label className="flex items-center gap-3 font-semibold"><input type="checkbox" checked={showOriginal} onChange={(e) => setShowOriginal(e.target.checked)} /> Show original passage while typing</label><label className="flex items-center gap-3 font-semibold"><input type="checkbox" checked={allowBackspace} onChange={(e) => setAllowBackspace(e.target.checked)} /> Allow backspace</label></div><button className="btn-primary mt-6" onClick={() => setSettingsOpen(false)}>Save Settings</button></div></div>}
    </div>
  );
}
