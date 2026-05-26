import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Download, Maximize, Minimize, Settings, X } from 'lucide-react';
import { formatTime } from '../utils/formatTime.js';
import { API_BASE_URL as API } from '../utils/api.js';

/* ─────────────────────────────────────────────────────────────
   PassageDisplay — live word-by-word (and char-by-char) view
   ───────────────────────────────────────────────────────────── */
function PassageDisplay({ originalText, typedText, fontSize }) {
  const currentRef = useRef(null);

  /* Tokenize original text, keeping whitespace tokens intact */
  const tokens = useMemo(() => {
    const parts = originalText.split(/(\s+)/g);
    const result = [];
    for (const p of parts) {
      if (!p) continue;
      result.push({ type: /^\s+$/.test(p) ? 'space' : 'word', value: p });
    }
    return result;
  }, [originalText]);

  /* Derive word/completion state from typedText */
  const typedWords       = useMemo(() => typedText.split(/\s+/).filter(Boolean), [typedText]);
  const hasTrailingSpace = typedText.length > 0 && /\s$/.test(typedText);
  const completedCount   = hasTrailingSpace ? typedWords.length : Math.max(0, typedWords.length - 1);
  const currentTyped     = hasTrailingSpace ? '' : (typedWords[typedWords.length - 1] || '');

  /* Auto-scroll current word into view when the completed count changes */
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [completedCount]);

  let wordIdx = 0;
  const fontClass = fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-xl' : 'text-base';

  return (
    <div
      className={`max-h-56 overflow-y-auto whitespace-pre-wrap leading-9 select-none ${fontClass}`}
      style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
      {tokens.map((tok, i) => {
        /* Whitespace — render as-is to preserve paragraph structure */
        if (tok.type === 'space') return <span key={i}>{tok.value}</span>;

        const wi = wordIdx++;

        /* ── Completed words ── */
        if (wi < completedCount) {
          const typed   = typedWords[wi] || '';
          const correct = typed === tok.value;
          return (
            <span
              key={i}
              title={correct ? '' : `You typed: "${typed}"`}
              className={correct ? 'word-done-correct' : 'word-done-error'}
            >
              {tok.value}
            </span>
          );
        }

        /* ── Current word (character level) ── */
        if (wi === completedCount) {
          const chars = tok.value.split('');
          return (
            <span key={i} ref={currentRef} className="word-current-container">
              {chars.map((ch, ci) => {
                if (ci < currentTyped.length) {
                  return (
                    <span key={ci} className={currentTyped[ci] === ch ? 'char-correct' : 'char-error'}>
                      {ch}
                    </span>
                  );
                }
                if (ci === currentTyped.length) {
                  return <span key={ci} className="char-cursor">{ch}</span>;
                }
                return <span key={ci} className="char-pending">{ch}</span>;
              })}
              {/* Extra characters typed beyond the word */}
              {currentTyped.length > chars.length && (
                <span className="char-extra">
                  {currentTyped.slice(chars.length)}
                </span>
              )}
            </span>
          );
        }

        /* ── Pending words ── */
        return <span key={i} className="word-pending">{tok.value}</span>;
      })}

      {/* Cursor at end when passage is fully typed */}
      {!hasTrailingSpace && completedCount >= tokens.filter(t => t.type === 'word').length && (
        <span className="char-cursor">|</span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main TypingTest page
   ───────────────────────────────────────────────────────────── */
export default function TypingTest() {
  const { state }   = useLocation();
  const navigate    = useNavigate();
  const passage     = state?.passage;
  const textareaRef = useRef(null);
  const submittedRef = useRef(false);

  const [typedText,    setTypedText]    = useState('');
  const [duration,     setDuration]     = useState(600);
  const [remaining,    setRemaining]    = useState(600);
  const [started,      setStarted]      = useState(false);
  const [backspaces,   setBackspaces]   = useState(0);
  const [allowBksp,    setAllowBksp]    = useState(true);
  const [fontSize,     setFontSize]     = useState('medium');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* Guard: no passage → back to selector */
  useEffect(() => { if (!passage) navigate('/practice'); }, [passage, navigate]);

  /* Auto-focus textarea */
  useEffect(() => { textareaRef.current?.focus(); }, []);

  /* Countdown timer */
  useEffect(() => {
    if (!started || submittedRef.current) return;
    const id = setInterval(() => setRemaining((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [started]);

  /* Auto-submit when timer hits 0 */
  useEffect(() => { if (started && remaining === 0) handleSubmit(); }, [remaining, started]);

  /* Warn before navigating away mid-test */
  useEffect(() => {
    const guard = (e) => {
      if (started && !submittedRef.current) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [started]);

  /* ── Live Stats ── */
  const elapsed  = started ? Math.max(1, duration - remaining) : 0;
  const liveWpm  = elapsed > 1 ? Math.round((typedText.length / 5) / (elapsed / 60)) : 0;

  const { liveAccuracy, wordsTyped } = useMemo(() => {
    if (!typedText || !passage) return { liveAccuracy: 100, wordsTyped: 0 };
    const tw   = typedText.split(/\s+/).filter(Boolean);
    const ow   = passage.content.split(/\s+/).filter(Boolean);
    const trail = /\s$/.test(typedText);
    const done  = trail ? tw.length : Math.max(0, tw.length - 1);
    let ok = 0;
    for (let i = 0; i < done && i < ow.length; i++) { if (tw[i] === ow[i]) ok++; }
    return {
      liveAccuracy: done > 0 ? Math.round((ok / done) * 100) : 100,
      wordsTyped:   tw.length
    };
  }, [typedText, passage]);

  const totalWords = useMemo(
    () => passage?.content.split(/\s+/).filter(Boolean).length || 0,
    [passage]
  );

  const progressPct = totalWords > 0 ? Math.min(100, (wordsTyped / totalWords) * 100) : 0;

  /* Timer colour */
  const timerClass = remaining < 60
    ? 'timer-danger'
    : remaining < 120
      ? 'timer-warn'
      : 'timer-safe';

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (submittedRef.current || submitting) return;
    if (!typedText.trim()) { alert('Please type something before submitting.'); return; }
    submittedRef.current = true;
    setSubmitting(true);

    const durationSeconds = Math.max(1, duration - remaining);
    const token   = localStorage.getItem('studentToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res  = await fetch(`${API}/results`, {
        method:  'POST',
        headers,
        body:    JSON.stringify({
          examId:          passage.exam_id,
          pdfId:           passage.pdf_id,
          passageId:       passage.id,
          originalText:    passage.content,
          typedText,
          durationSeconds,
          backspaceCount:  backspaces,
          keystrokes:      typedText.length
        })
      });
      const data = await res.json();

      if (!res.ok) {
        submittedRef.current = false;
        setSubmitting(false);
        if (data.code === 'LOGIN_REQUIRED')
          return navigate('/student/login', { state: { from: '/practice', message: 'Please login to save premium passage results.' } });
        if (data.code === 'SUBSCRIPTION_REQUIRED')
          return navigate('/subscription', { state: { message: 'Please unlock lifetime access to submit this passage.' } });
        return alert(data.error || 'Unable to submit result');
      }

      if (!data.id) {
        /* Anonymous preview — pass all result data in state */
        const r = data.result;
        return navigate('/result/preview', {
          state: {
            result: {
              ...r,
              exam_name:   passage.exam_name,
              pdf_title:   passage.pdf_title,
              passage_number: passage.passage_number,
              original_text:  passage.content,
              typed_text:     typedText,
              highlighted_original: r.highlightedOriginal,
              highlighted_typed:    r.highlightedTyped,
              duration_formatted:   r.durationFormatted,
              duration_seconds:     r.durationSeconds,
              keystrokes:           r.totalKeystrokes,
              backspaces:           r.backspaceCount,
              total_words_typed:    r.totalWordsTyped,
              gross_wpm:            r.grossWpm,
              net_wpm:              r.netWpm,
              accuracy:             r.accuracy,
              error_percentage:     r.errorPercentage,
              marks:                r.marks,
              qualified:            r.qualified,
              full_errors:          r.errors.fullErrors,
              half_errors:          r.errors.halfErrors,
              total_errors:         r.errors.totalErrors,
              additions:            r.errors.additions,
              omissions:            r.errors.omissions,
              spelling_substitution_repetition: r.errors.spellingSubstitutionRepetition,
              incomplete_words:     r.errors.incompleteWords,
              spacing_errors:       r.errors.spacing,
              capitalization_errors: r.errors.capitalization,
              punctuation_errors:   r.errors.punctuation,
              transposition_errors: r.errors.transposition,
              paragraphic_errors:   r.errors.paragraphic,
              tab_errors:           r.errors.tab
            },
            preview: true
          }
        });
      }

      navigate(`/result/${data.id}`);
    } catch {
      submittedRef.current = false;
      setSubmitting(false);
      alert('Network error — please try again.');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  if (!passage) return null;

  const taFontClass = fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-xl' : 'text-base';

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top Header Bar ──────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          {/* Exam info */}
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Typing Test</p>
            <h1 className="truncate text-sm font-bold text-white md:text-base">
              {passage.exam_name} — Passage {passage.passage_number}
            </h1>
          </div>

          {/* Big Timer */}
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Time Left</p>
            <p className={`font-black tabular-nums text-3xl md:text-4xl ${timerClass}`}>
              {formatTime(remaining)}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            <a
              href={`${API}/pdfs/${passage.pdf_id}/download`}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700"
            >
              <Download size={13} /><span className="hidden sm:inline">PDF</span>
            </a>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700"
            >
              <Settings size={13} /><span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700"
            >
              {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Live Stats Bar ───────────────────────────────────── */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 text-sm">

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">WPM</span>
            <span className="tabular-nums font-black text-cyan-400 text-lg">{liveWpm}</span>
          </div>

          <div className="hidden h-4 w-px bg-slate-700 sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">Accuracy</span>
            <span className={`tabular-nums font-black text-lg ${
              liveAccuracy >= 95 ? 'text-emerald-400' :
              liveAccuracy >= 85 ? 'text-amber-400' : 'text-rose-400'
            }`}>{liveAccuracy}%</span>
          </div>

          <div className="hidden h-4 w-px bg-slate-700 sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">Words</span>
            <span className="tabular-nums font-bold text-white">{wordsTyped}</span>
            <span className="text-slate-600 text-xs">/ {totalWords}</span>
          </div>

          <div className="hidden h-4 w-px bg-slate-700 sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">Backspaces</span>
            <span className="tabular-nums font-bold text-amber-400">{backspaces}</span>
          </div>

          {/* Backspace toggle */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-slate-500 text-xs">Backspace</span>
            <button
              onClick={() => setAllowBksp((v) => !v)}
              className={`rounded px-2 py-0.5 text-xs font-bold transition-colors ${
                allowBksp
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
              }`}
            >
              {allowBksp ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 py-5">

        {/* Progress bar */}
        <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* ── Original Passage with Live Highlighting ── */}
        <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              📄 Original Passage — words highlight as you type
            </h2>
            <div className="flex gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />Correct
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />Wrong
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-indigo-400" />Current
              </span>
            </div>
          </div>
          <PassageDisplay
            originalText={passage.content}
            typedText={typedText}
            fontSize={fontSize}
          />
        </div>

        {/* ── Typing Textarea ── */}
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              ⌨️ Type here
            </p>
            {!started && (
              <p className="text-[11px] font-medium text-amber-400 animate-pulse">
                Timer starts on first keystroke
              </p>
            )}
            {started && (
              <p className="text-[11px] text-slate-600">
                {typedText.length} characters
              </p>
            )}
          </div>
          <textarea
            ref={textareaRef}
            className={`
              w-full resize-none rounded-lg bg-slate-950 p-4 text-slate-100
              placeholder-slate-700 outline-none transition-all
              focus:ring-2 focus:ring-indigo-500/50 leading-relaxed
              ${taFontClass}
            `}
            style={{ minHeight: '180px', fontFamily: "'Courier New', Courier, monospace" }}
            placeholder="Start typing the passage above..."
            value={typedText}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            onContextMenu={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === 'Backspace') {
                if (!allowBksp) { e.preventDefault(); return; }
                setBackspaces((v) => v + 1);
              }
            }}
            onChange={(e) => {
              if (!started && e.target.value.length > 0) setStarted(true);
              setTypedText(e.target.value);
            }}
          />
        </div>

        {/* ── Action Buttons ── */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            to="/practice"
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-400 transition-all hover:border-slate-600 hover:text-slate-200"
          >
            ← Cancel
          </Link>
          <button
            disabled={submitting || !typedText.trim()}
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '⏳ Submitting…' : '✓ Submit Test'}
          </button>
        </div>
      </main>

      {/* ── Settings Modal ───────────────────────────────── */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setSettingsOpen(false)}
        >
          <div className="pop-in w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Test Settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-5">
              {/* Duration */}
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-300">Test Duration</label>
                <select
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
                  value={duration}
                  disabled={started}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setDuration(v);
                    setRemaining(v);
                  }}
                >
                  <option value={300}>5 minutes</option>
                  <option value={600}>10 minutes (standard)</option>
                  <option value={900}>15 minutes</option>
                </select>
                {started && (
                  <p className="text-xs text-amber-400">Duration cannot be changed after the test starts.</p>
                )}
              </div>

              {/* Font size */}
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-300">Font Size</label>
                <select
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium (recommended)</option>
                  <option value="large">Large</option>
                </select>
              </div>

              {/* Backspace toggle */}
              <div
                className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-800 p-4 transition-colors hover:bg-slate-700/70"
                onClick={() => setAllowBksp((v) => !v)}
              >
                <div>
                  <p className="font-semibold text-white">Allow Backspace</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {allowBksp ? 'Backspace key is currently enabled' : 'Backspace key is currently disabled'}
                  </p>
                </div>
                {/* Toggle switch */}
                <div className={`toggle-track ${allowBksp ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                  <div className={`toggle-thumb ${allowBksp ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </div>
            </div>

            <button
              onClick={() => setSettingsOpen(false)}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Save &amp; Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
