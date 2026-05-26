import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import ResultCard from '../components/ResultCard.jsx';
import ErrorLegend from '../components/ErrorLegend.jsx';
import FormulaBox from '../components/FormulaBox.jsx';

import { API_BASE_URL as API } from '../utils/api.js';

export default function Result() {
  const { id } = useParams();
  const { state } = useLocation();
  const [result, setResult] = useState(state?.result || null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!id || id === 'preview' || state?.result) return;
    fetch(`${API}/results/${id}`).then((res) => res.json()).then((data) => data.result ? setResult(data.result) : setError(data.error || 'Result not found')).catch(() => setError('Unable to load result'));
  }, [id, state?.result]);
  if (!id) return <div><Navbar /><main className="mx-auto max-w-4xl px-4 py-8"><div className="card p-6">No result selected.</div></main></div>;
  if (error) return <div><Navbar /><main className="mx-auto max-w-4xl px-4 py-8"><div className="card p-6 text-rose-600">{error}</div></main></div>;
  if (!result) return <div><Navbar /><main className="mx-auto max-w-4xl px-4 py-8">Loading result...</main></div>;

  const cards = [
    ['Full Errors', result.full_errors, 'Additions, omissions, substitutions, spelling, repetitions, incomplete words'],
    ['Total Errors', result.total_errors, 'Full Errors + Half Errors'],
    ['Error Percentage', `${result.error_percentage}%`, 'Total Errors / Total Words Typed x 100'],
    ['Keystrokes Typed', result.keystrokes, 'Letters, numbers, punctuation, spaces'],
    ['Backspace Pressed', result.backspaces, 'Number of backspace key presses'],
    ['Words Typed', result.total_words_typed, 'Total Keystrokes Typed / 5'],
    ['Gross WPM', `${result.gross_wpm} WPM`, '(Keystrokes Typed / 5) / Time (min)'],
    ['Net WPM', `${result.net_wpm} WPM`, '((Keystrokes / 5) - Error) / Time (min)'],
    ['Accuracy', `${result.accuracy}%`, '(Net WPM / Gross WPM) x 100'],
    ['Test Duration', result.duration_formatted, 'Time taken for the test']
  ];

  return (
    <div><Navbar /><main className="mx-auto max-w-7xl px-4 py-8">
      {state?.preview && <div className="mb-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Free preview result is not saved. Login to save history and unlock premium passages.</div>}<div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-extrabold text-slate-900">Typing Test Result: {result.exam_name || 'Bombay High Court Clerk Typing'} {result.passage_number || ''}</h1><p className="mt-2 text-lg font-semibold text-slate-600">Total Keystrokes Typed: {result.keystrokes}</p></div><Link className="btn-primary" to="/practice">Take Another Test</Link></div>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([title, value, note]) => <ResultCard key={title} title={title} value={value} note={note} />)}<ResultCard danger title="Marks Obtained" value={`${result.marks} / 20`} note="Deduct 1 mark per 4 mistakes" /><ResultCard danger title="Qualification" value={result.qualified ? 'Qualified' : 'Not Qualified'} note="Net WPM >= 40 & Marks >= 10" /></section>
      <details className="card mt-6 p-6" open><summary className="cursor-pointer text-xl font-bold">Error Breakdown</summary><div className="mt-4 grid gap-2 text-slate-700 sm:grid-cols-2"><p>Full Errors: {result.full_errors}</p><p>Additions: {result.additions}</p><p>Omissions: {result.omissions}</p><p>Spelling/Substitutions/Repetitions Errors: {result.spelling_substitution_repetition}</p><p>Incomplete Words: {result.incomplete_words}</p><p>Half Errors: {result.half_errors}</p><p>Spacing Errors: {result.spacing_errors}</p><p>Capitalization Errors: {result.capitalization_errors}</p><p>Punctuation Errors: {result.punctuation_errors}</p><p>Transposition Errors: {result.transposition_errors}</p><p>Paragraphic Errors: {result.paragraphic_errors}</p><p>Tab Errors: {result.tab_errors}</p></div></details>
      <details className="card mt-6 p-6"><summary className="cursor-pointer text-xl font-bold">Calculation Formulas</summary><div className="mt-4"><FormulaBox /></div></details>
      <section className="card mt-6 p-6"><h2 className="text-xl font-bold">Original Text</h2><div className="mt-4 whitespace-pre-wrap rounded-xl border bg-slate-50 p-4 leading-8" dangerouslySetInnerHTML={{ __html: result.highlighted_original || result.original_text }} /><ErrorLegend omitOriginal /></section>
      <section className="card mt-6 p-6"><h2 className="text-xl font-bold">Your Typed Text</h2><div className="mt-4 whitespace-pre-wrap rounded-xl border bg-slate-50 p-4 leading-8" dangerouslySetInnerHTML={{ __html: result.highlighted_typed || result.typed_text }} /><ErrorLegend /></section>
    </main></div>
  );
}
