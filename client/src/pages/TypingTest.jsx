import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Download, Maximize, Minimize, Settings, Sun, Moon, X } from 'lucide-react';
import { formatTime } from '../utils/formatTime.js';
import { API_BASE_URL as API } from '../utils/api.js';

/* ─────────────────────────────────────────────────────────────
   PassageDisplay — live word-by-word (and char-by-char) view
   Supports dark and light themes via `dark` prop
   ───────────────────────────────────────────────────────────── */
function PassageDisplay({ originalText, typedText, fontSize, dark }) {
  const currentRef = useRef(null);

  const tokens = useMemo(() => {
    const parts = originalText.split(/(\s+)/g);
    const result = [];
    for (const p of parts) {
      if (!p) continue;
      result.push({ type: /^\s+$/.test(p) ? 'space' : 'word', value: p });
    }
    return result;
  }, [originalText]);

  const typedWords       = useMemo(() => typedText.split(/\s+/).filter(Boolean), [typedText]);
  const hasTrailingSpace = typedText.length > 0 && /\s$/.test(typedText);
  const completedCount   = hasTrailingSpace ? typedWords.length : Math.max(0, typedWords.length - 1);
  const currentTyped     = hasTrailingSpace ? '' : (typedWords[typedWords.length - 1] || '');

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [completedCount]);

  let wordIdx = 0;
  const fontClass = fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-xl' : 'text-base';

  /* CSS class helpers — switch between dark and light palettes */
  const cls = {
    correct:  dark ? 'word-done-correct'        : 'word-done-correct-light',
    error:    dark ? 'word-done-error'           : 'word-done-error-light',
    current:  dark ? 'word-current-container'   : 'word-current-container-light',
    pending:  dark ? 'word-pending'              : 'word-pending-light',
    cCorrect: dark ? 'char-correct'              : 'char-correct-light',
    cError:   dark ? 'char-error'                : 'char-error-light',
    cCursor:  dark ? 'char-cursor'               : 'char-cursor-light',
    cPending: dark ? 'char-pending'              : 'char-pending-light',
    cExtra:   dark ? 'char-extra'                : 'char-extra-light',
  };

  return (
    <div
      className={`max-h-56 overflow-y-auto whitespace-pre-wrap leading-9 select-none ${fontClass}`}
      style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
      {tokens.map((tok, i) => {
        if (tok.type === 'space') return <span key={i}>{tok.value}</span>;

        const wi = wordIdx++;

        if (wi < completedCount) {
          const typed   = typedWords[wi] || '';
          const correct = typed === tok.value;
          return (
            <span
              key={i}
              title={correct ? '' : `You typed: "${typed}"`}
              className={correct ? cls.correct : cls.error}
            >
              {tok.value}
            </span>
          );
        }

        if (wi === completedCount) {
          const chars = tok.value.split('');
          return (
            <span key={i} ref={currentRef} className={cls.current}>
              {chars.map((ch, ci) => {
                if (ci < currentTyped.length)
                  return <span key={ci} className={currentTyped[ci] === ch ? cls.cCorrect : cls.cError}>{ch}</span>;
                if (ci === currentTyped.length)
                  return <span key={ci} className={cls.cCursor}>{ch}</span>;
                return <span key={ci} className={cls.cPending}>{ch}</span>;
              })}
              {currentTyped.length > chars.length && (
                <span className={cls.cExtra}>{currentTyped.slice(chars.length)}</span>
              )}
            </span>
          );
        }

        return <span key={i} className={cls.pending}>{tok.value}</span>;
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main TypingTest page
   ───────────────────────────────────────────────────────────── */
export default function TypingTest() {
  const { state }    = useLocation();
  const navigate     = useNavigate();
  const passage      = state?.passage;
  const mode         = state?.mode || 'onscreen'; // 'onscreen' | 'paper'
  const textareaRef  = useRef(null);
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

  // ── Theme: dark = typing focused, light = regular ──
  const [dark, setDark] = useState(true);

  useEffect(() => { if (!passage) navigate('/practice'); }, [passage, navigate]);
  useEffect(() => { textareaRef.current?.focus(); }, []);

  useEffect(() => {
    if (!started || submittedRef.current) return;
    const id = setInterval(() => setRemaining((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [started]);

  useEffect(() => { if (started && remaining === 0) handleSubmit(); }, [remaining, started]);

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
    const tw    = typedText.split(/\s+/).filter(Boolean);
    const ow    = passage.content.split(/\s+/).filter(Boolean);
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

  const timerClass = remaining < 60
    ? 'timer-danger'
    : remaining < 120
      ? 'timer-warn'
      : dark ? 'timer-safe' : 'text-slate-900';

  /* ── Theme-based Tailwind classes ── */
  const t = dark ? {
    page:       'bg-slate-950 text-white',
    header:     'bg-slate-900 border-slate-800',
    headerText: 'text-slate-500',
    statsBar:   'bg-slate-900/60 border-slate-800',
    dimText:    'text-slate-500',
    sep:        'bg-slate-700',
    ctrl:       'bg-slate-800 text-slate-300 hover:bg-slate-700',
    card:       'bg-slate-900 border-slate-700',
    cardLabel:  'text-slate-500',
    progBg:     'bg-slate-800',
    tareaBase:  'bg-slate-950 text-slate-100 placeholder-slate-700 focus:ring-indigo-500/50',
    cancelBtn:  'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200',
    modal:      'bg-slate-900 border-slate-700',
    mLabel:     'text-slate-300',
    mInput:     'border-slate-700 bg-slate-800 text-white focus:border-indigo-500',
    mToggleBg:  'bg-slate-800 hover:bg-slate-700/70',
  } : {
    page:       'bg-slate-50 text-slate-900',
    header:     'bg-white border-slate-200',
    headerText: 'text-slate-400',
    statsBar:   'bg-white border-slate-200',
    dimText:    'text-slate-500',
    sep:        'bg-slate-200',
    ctrl:       'bg-slate-100 text-slate-600 hover:bg-slate-200',
    card:       'bg-white border-slate-200',
    cardLabel:  'text-slate-400',
    progBg:     'bg-slate-200',
    tareaBase:  'bg-white text-slate-900 placeholder-slate-400 border border-slate-200 focus:ring-indigo-500/30',
    cancelBtn:  'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700',
    modal:      'bg-white border-slate-200',
    mLabel:     'text-slate-700',
    mInput:     'border-slate-200 bg-slate-50 text-slate-900 focus:border-indigo-500',
    mToggleBg:  'bg-slate-50 hover:bg-slate-100',
  };

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
          examId:         passage.exam_id,
          pdfId:          passage.pdf_id,
          passageId:      passage.id,
          originalText:   passage.content,
          typedText,
          durationSeconds,
          backspaceCount: backspaces,
          keystrokes:     typedText.length
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
        const r = data.result;
        return navigate('/result/preview', {
          state: {
            result: {
              ...r,
              exam_name: passage.exam_name,
              pdf_title: passage.pdf_title,
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

  const isPaper   = mode === 'paper';
  const taFontCls = fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-xl' : 'text-base';

  return (
    <div className={`min-h-screen ${t.page}`} style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <header className={`border-b ${t.header} px-4 py-3`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">

          {/* Exam info + mode badge */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-xs font-medium uppercase tracking-wider ${t.headerText}`}>Typing Test</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                isPaper
                  ? 'bg-amber-100 text-amber-700'
                  : dark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {isPaper ? '📄 Paper Mode' : '🖥️ On-Screen Mode'}
              </span>
            </div>
            <h1 className="truncate text-sm font-bold md:text-base">
              {passage.exam_name} — Passage {passage.passage_number}
            </h1>
          </div>

          {/* Big Timer */}
          <div className="text-center">
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${t.headerText}`}>Time Left</p>
            <p className={`font-black tabular-nums text-3xl md:text-4xl ${timerClass}`}>
              {formatTime(remaining)}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            {/* Light / Dark toggle */}
            <button
              onClick={() => setDark((v) => !v)}
              title={dark ? 'Switch to Light mode' : 'Switch to Dark mode'}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${t.ctrl}`}
            >
              {dark ? <Sun size={13} /> : <Moon size={13} />}
              <span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span>
            </button>

            <a
              href={`${API}/pdfs/${passage.pdf_id}/download`}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${t.ctrl}`}
            >
              <Download size={13} /><span className="hidden sm:inline">PDF</span>
            </a>
            <button
              onClick={() => setSettingsOpen(true)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${t.ctrl}`}
            >
              <Settings size={13} /><span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${t.ctrl}`}
            >
              {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Live Stats Bar ───────────────────────────────────── */}
      <div className={`border-b ${t.statsBar} px-4 py-2`}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 text-sm">

          <div className="flex items-center gap-2">
            <span className={`text-xs ${t.dimText}`}>WPM</span>
            <span className="tabular-nums font-black text-cyan-500 text-lg">{liveWpm}</span>
          </div>

          <div className={`hidden h-4 w-px sm:block ${t.sep}`} />

          <div className="flex items-center gap-2">
            <span className={`text-xs ${t.dimText}`}>Accuracy</span>
            <span className={`tabular-nums font-black text-lg ${
              liveAccuracy >= 95 ? 'text-emerald-500' :
              liveAccuracy >= 85 ? 'text-amber-500' : 'text-rose-500'
            }`}>{liveAccuracy}%</span>
          </div>

          <div className={`hidden h-4 w-px sm:block ${t.sep}`} />

          <div className="flex items-center gap-2">
            <span className={`text-xs ${t.dimText}`}>Words</span>
            <span className="tabular-nums font-bold">{wordsTyped}</span>
            <span className={`text-xs ${t.dimText}`}>/ {totalWords}</span>
          </div>

          <div className={`hidden h-4 w-px sm:block ${t.sep}`} />

          <div className="flex items-center gap-2">
            <span className={`text-xs ${t.dimText}`}>Backspaces</span>
            <span className="tabular-nums font-bold text-amber-500">{backspaces}</span>
          </div>

          {/* Backspace toggle */}
          <div className="ml-auto flex items-center gap-2">
            <span className={`text-xs ${t.dimText}`}>Backspace</span>
            <button
              onClick={() => setAllowBksp((v) => !v)}
              className={`rounded px-2 py-0.5 text-xs font-bold transition-colors ${
                allowBksp
                  ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25'
                  : 'bg-rose-500/15 text-rose-500 hover:bg-rose-500/25'
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
        <div className={`mb-4 h-1 w-full overflow-hidden rounded-full ${t.progBg}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* ── ON-SCREEN MODE: Live passage highlighting ── */}
        {!isPaper && (
          <div className={`mb-4 rounded-xl border ${t.card} p-5`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className={`text-[11px] font-bold uppercase tracking-widest ${t.cardLabel}`}>
                📄 Original Passage — words highlight as you type
              </h2>
              <div className={`flex gap-3 text-[11px] ${t.dimText}`}>
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
              dark={dark}
            />
          </div>
        )}

        {/* ── PAPER MODE: Reminder card ── */}
        {isPaper && (
          <div className="mb-4 rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <span className="text-3xl">📄</span>
              <div>
                <h2 className="font-bold text-amber-900">Paper / Hard Copy Mode</h2>
                <p className="mt-1 text-sm text-amber-800">
                  The passage is intentionally hidden. Type from your <strong>printed paper</strong> placed
                  next to your keyboard — exactly as in the real BHC exam hall.
                </p>
                <p className="mt-2 text-xs text-amber-700">
                  Don't have the paper yet?{' '}
                  <a
                    href={`${API}/pdfs/${passage.pdf_id}/download`}
                    className="font-bold underline hover:text-amber-900"
                  >
                    Download the PDF
                  </a>{' '}
                  and print it first.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Typing Area ── */}
        <div className={`rounded-xl border ${t.card} p-4`}>
          <div className="mb-2 flex items-center justify-between">
            <p className={`text-[11px] font-bold uppercase tracking-widest ${t.cardLabel}`}>
              ⌨️ Type here
            </p>
            {!started && (
              <p className="text-[11px] font-medium text-amber-500 animate-pulse">
                Timer starts on first keystroke
              </p>
            )}
            {started && (
              <p className={`text-[11px] ${t.dimText}`}>{typedText.length} chars</p>
            )}
          </div>
          <textarea
            ref={textareaRef}
            className={`
              w-full resize-none rounded-lg p-4 outline-none transition-all
              focus:ring-2 leading-relaxed ${taFontCls} ${t.tareaBase}
            `}
            style={{ minHeight: '180px', fontFamily: "'Courier New', Courier, monospace" }}
            placeholder="Start typing the passage here…"
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
            className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-all ${t.cancelBtn}`}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setSettingsOpen(false)}
        >
          <div className={`pop-in w-full max-w-md rounded-2xl border ${t.modal} p-6 shadow-2xl`}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Test Settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className={`rounded-lg p-1.5 ${t.dimText} transition-colors hover:opacity-70`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-5">
              {/* Duration */}
              <div className="grid gap-2">
                <label className={`text-sm font-semibold ${t.mLabel}`}>Test Duration</label>
                <select
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${t.mInput}`}
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
                {started && <p className="text-xs text-amber-500">Duration can't change after test starts.</p>}
              </div>

              {/* Font size */}
              <div className="grid gap-2">
                <label className={`text-sm font-semibold ${t.mLabel}`}>Font Size</label>
                <select
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${t.mInput}`}
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium (recommended)</option>
                  <option value="large">Large</option>
                </select>
              </div>

              {/* Theme toggle */}
              <div
                className={`flex cursor-pointer items-center justify-between rounded-xl p-4 transition-colors ${t.mToggleBg}`}
                onClick={() => setDark((v) => !v)}
              >
                <div>
                  <p className="font-semibold">{dark ? '🌙 Dark Mode' : '☀️ Light Mode'}</p>
                  <p className={`mt-0.5 text-xs ${t.dimText}`}>
                    {dark ? 'Easier on eyes in low light' : 'Bright mode for well-lit rooms'}
                  </p>
                </div>
                <div className={`toggle-track ${dark ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                  <div className={`toggle-thumb ${dark ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </div>

              {/* Backspace toggle */}
              <div
                className={`flex cursor-pointer items-center justify-between rounded-xl p-4 transition-colors ${t.mToggleBg}`}
                onClick={() => setAllowBksp((v) => !v)}
              >
                <div>
                  <p className="font-semibold">Allow Backspace</p>
                  <p className={`mt-0.5 text-xs ${t.dimText}`}>
                    {allowBksp ? 'Backspace key is enabled' : 'Backspace key is disabled'}
                  </p>
                </div>
                <div className={`toggle-track ${allowBksp ? 'bg-indigo-600' : 'bg-slate-500'}`}>
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
