import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import ErrorLegend from '../components/ErrorLegend.jsx';
import { API_BASE_URL as API } from '../utils/api.js';

/* ── Small progress bar helper ── */
function Bar({ value, max, color = 'bg-indigo-500' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── Single metric card ── */
function MetricCard({ icon, label, value, unit, sub, color = 'text-slate-900', barValue, barMax, barColor }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className={`text-3xl font-black tabular-nums ${color}`}>{value}</span>
            {unit && <span className="text-sm font-semibold text-slate-400">{unit}</span>}
          </div>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
          {barMax !== undefined && (
            <Bar value={barValue ?? Number(value)} max={barMax} color={barColor} />
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

/* ── Error row ── */
function ErrorRow({ label, value, full }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-bold ${full ? (value > 0 ? 'text-rose-600' : 'text-slate-400') : (value > 0 ? 'text-amber-500' : 'text-slate-400')}`}>
        {value > 0 ? value : '—'}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Result page
   ───────────────────────────────────────────────────────────── */
export default function Result() {
  const { id }     = useParams();
  const { state }  = useLocation();
  const [result, setResult] = useState(state?.result || null);
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (!id || id === 'preview' || state?.result) return;
    fetch(`${API}/results/${id}`)
      .then((r) => r.json())
      .then((d) => d.result ? setResult(d.result) : setError(d.error || 'Result not found'))
      .catch(() => setError('Unable to load result'));
  }, [id, state?.result]);

  /* ── Loading / Error states ── */
  if (!id) return (
    <div><Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-500">No result selected.</main>
    </div>
  );
  if (error) return (
    <div><Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-rose-600">{error}</main>
    </div>
  );
  if (!result) return (
    <div><Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-500">
        <div className="text-4xl mb-4">⏳</div>Loading your result…
      </main>
    </div>
  );

  const qualified  = result.qualified;
  const netWpm     = Number(result.net_wpm)  || 0;
  const accuracy   = Number(result.accuracy) || 0;
  const marks      = Number(result.marks)    || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">

        {/* ── Qualification Banner ──────────────────────── */}
        <div className={`fade-in-up mb-6 overflow-hidden rounded-2xl p-8 text-center shadow-lg ${
          qualified
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
            : 'bg-gradient-to-br from-rose-500 to-pink-600 text-white'
        }`}>
          <div className="text-5xl mb-3">{qualified ? '🏆' : '📝'}</div>
          <h1 className="text-3xl font-black md:text-4xl">
            {qualified ? 'Congratulations — You Qualified!' : 'Keep Practicing — You Can Do It!'}
          </h1>
          <p className="mt-2 text-white/85 text-base">
            {qualified
              ? 'You met the criteria: Net WPM ≥ 40 and Marks ≥ 10 out of 20.'
              : 'Qualification needs Net WPM ≥ 40 and Marks ≥ 10 out of 20.'}
          </p>
          <div className="mt-4 text-sm text-white/70">
            {result.exam_name || 'Bombay High Court Clerk Typing'}
            {result.passage_number ? ` — Passage ${result.passage_number}` : ''}
          </div>
        </div>

        {/* ── Free preview notice ── */}
        {state?.preview && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <span className="text-lg">⚠️</span>
            <div>
              <span className="font-bold">Free preview — result not saved. </span>
              <Link to="/student/register" className="underline font-semibold hover:text-amber-900">
                Create a free account
              </Link>{' '}to save your history and unlock all passages.
            </div>
          </div>
        )}

        {/* ── Key Metrics ──────────────────────────────── */}
        <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon="⚡"
            label="Net WPM"
            value={netWpm}
            unit="WPM"
            sub="Qualification threshold: 40"
            color={netWpm >= 40 ? 'text-emerald-600' : 'text-rose-600'}
            barValue={netWpm}
            barMax={80}
            barColor={netWpm >= 40 ? 'bg-emerald-500' : 'bg-rose-400'}
          />
          <MetricCard
            icon="🎯"
            label="Accuracy"
            value={accuracy}
            unit="%"
            sub={`${result.gross_wpm} WPM gross`}
            color={accuracy >= 90 ? 'text-emerald-600' : accuracy >= 80 ? 'text-amber-500' : 'text-rose-600'}
            barValue={accuracy}
            barMax={100}
            barColor={accuracy >= 90 ? 'bg-emerald-500' : accuracy >= 80 ? 'bg-amber-400' : 'bg-rose-400'}
          />
          <MetricCard
            icon="📊"
            label="Marks"
            value={marks}
            unit="/ 20"
            sub="Qualification threshold: 10"
            color={marks >= 10 ? 'text-emerald-600' : 'text-rose-600'}
            barValue={marks}
            barMax={20}
            barColor={marks >= 10 ? 'bg-emerald-500' : 'bg-rose-400'}
          />
          <MetricCard
            icon="⏱️"
            label="Duration"
            value={result.duration_formatted}
            sub={`${result.keystrokes} keystrokes`}
          />
        </div>

        {/* ── Secondary Stats ─────────────────────────── */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Words Typed', result.total_words_typed, '(Keystrokes ÷ 5)'],
            ['Backspaces', result.backspaces, 'Key presses'],
            ['Error %', `${result.error_percentage}%`, 'Errors ÷ Words × 100'],
            ['Full Errors', result.full_errors, 'Additions + Omissions + Spelling']
          ].map(([label, val, note]) => (
            <div key={label} className="card px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-slate-900">{val}</p>
              <p className="mt-1 text-xs text-slate-400">{note}</p>
            </div>
          ))}
        </div>

        {/* ── Side-by-Side Text Comparison ──────────────── */}
        <div className="card mb-6 p-6">
          <h2 className="mb-1 text-xl font-bold text-slate-900">📝 Text Comparison</h2>
          <p className="mb-5 text-sm text-slate-500">
            Original passage on the left, your typed text on the right. Highlighted words show errors.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Original */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                📄 Original Passage
              </p>
              <div
                className="whitespace-pre-wrap leading-8 text-sm text-slate-700"
                style={{ fontFamily: "'Courier New', Courier, monospace" }}
                dangerouslySetInnerHTML={{
                  __html: result.highlighted_original || escapeHtml(result.original_text || '')
                }}
              />
            </div>
            {/* Typed */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                ⌨️ Your Typed Text
              </p>
              <div
                className="whitespace-pre-wrap leading-8 text-sm text-slate-700"
                style={{ fontFamily: "'Courier New', Courier, monospace" }}
                dangerouslySetInnerHTML={{
                  __html: result.highlighted_typed || escapeHtml(result.typed_text || '')
                }}
              />
            </div>
          </div>
          {/* Legend */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <ErrorLegend />
          </div>
        </div>

        {/* ── Detailed Error Breakdown ───────────────────── */}
        <details className="card mb-5 p-6" open>
          <summary className="cursor-pointer text-lg font-bold text-slate-900 list-none flex items-center justify-between">
            <span>📋 Detailed Error Breakdown</span>
            <span className="text-sm font-normal text-slate-400 select-none">click to toggle ▾</span>
          </summary>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-500">Full Errors (1 error each)</p>
              <div className="grid gap-1.5">
                <ErrorRow label="Additions (extra words)" value={result.additions} full />
                <ErrorRow label="Omissions (missing words)" value={result.omissions} full />
                <ErrorRow label="Spelling / Substitution / Repetition" value={result.spelling_substitution_repetition} full />
                <ErrorRow label="Incomplete Words" value={result.incomplete_words} full />
                <div className="flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3">
                  <span className="text-sm font-bold text-rose-700">Full Errors Total</span>
                  <span className="text-sm font-black text-rose-700">{result.full_errors}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-500">Half Errors (½ error each)</p>
              <div className="grid gap-1.5">
                <ErrorRow label="Spacing Errors" value={result.spacing_errors} />
                <ErrorRow label="Capitalization Errors" value={result.capitalization_errors} />
                <ErrorRow label="Punctuation Errors" value={result.punctuation_errors} />
                <ErrorRow label="Transposition Errors" value={result.transposition_errors} />
                <ErrorRow label="Paragraphic Errors" value={result.paragraphic_errors} />
                <ErrorRow label="Tab Errors" value={result.tab_errors} />
                <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
                  <span className="text-sm font-bold text-amber-700">Half Errors Total</span>
                  <span className="text-sm font-black text-amber-700">{result.half_errors}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-5 py-4 text-white">
            <span className="font-bold">Total Errors</span>
            <span className="text-2xl font-black tabular-nums">{result.total_errors}</span>
          </div>
        </details>

        {/* ── Formulas ───────────────────────────────────── */}
        <details className="card mb-6 p-6">
          <summary className="cursor-pointer text-lg font-bold text-slate-900 list-none flex items-center justify-between">
            <span>🧮 Scoring Formulas</span>
            <span className="text-sm font-normal text-slate-400 select-none">click to expand ▾</span>
          </summary>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              ['Total Words Typed', 'Keystrokes ÷ 5'],
              ['Gross WPM', '(Keystrokes ÷ 5) ÷ Time in minutes'],
              ['Net WPM', '((Keystrokes ÷ 5) − Errors) ÷ Time in minutes'],
              ['Accuracy', '(Net WPM ÷ Gross WPM) × 100'],
              ['Error %', '(Total Errors ÷ Words Typed) × 100'],
              ['Marks', '20 − (Total Errors ÷ 4)  [min 0]'],
              ['Full Errors', 'Additions + Omissions + Spelling + Incomplete'],
              ['Half Errors', 'Spacing + Caps + Punctuation + Transposition + Para + Tab'],
              ['Total Errors', 'Full Errors + Half Errors'],
              ['Qualification', 'Net WPM ≥ 40  AND  Marks ≥ 10']
            ].map(([term, formula]) => (
              <div key={term} className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold text-slate-500">{term}</p>
                <p className="mt-0.5 text-sm font-medium text-slate-800">{formula}</p>
              </div>
            ))}
          </div>
        </details>

        {/* ── Actions ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/practice" className="btn-primary">Take Another Test</Link>
          <Link to="/student/history" className="btn-ghost">View My History</Link>
          <Link to="/" className="btn-ghost">Back to Home</Link>
        </div>
      </main>
    </div>
  );
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));
}
