import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, FileText, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import PassageSelector from '../components/PassageSelector.jsx';

const modes = [
  {
    id:    'onscreen',
    icon:  Monitor,
    label: 'On-Screen Passage',
    badge: 'Most Common',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    desc:  'The passage is shown at the top of the screen. Words highlight green or red in real time as you type below it.',
    detail: [
      'Live word-by-word highlighting as you type',
      'Cursor shows your current position in the passage',
      'Instant visual feedback — great for practice'
    ]
  },
  {
    id:    'paper',
    icon:  FileText,
    label: 'Hard Copy / Paper Mode',
    badge: 'Exam Realistic',
    badgeColor: 'bg-amber-100 text-amber-700',
    desc:  'No passage shown on screen — just like the real exam when you type from a printed paper. Screen shows only the typing area.',
    detail: [
      'Passage is hidden — type from your printed copy',
      'Mirrors the actual BHC exam experience',
      'Results and error analysis shown after submit'
    ]
  }
];

export default function PracticeSetup() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('onscreen');

  const locked = (type, passage) => {
    if (type === 'login') {
      navigate('/student/login', {
        state: {
          from:    '/practice',
          message: `Please sign in to access Passage ${passage?.passage_number || 5} and above.`
        }
      });
      return;
    }
    navigate('/subscription', {
      state: { message: `Passage ${passage?.passage_number || 5} requires lifetime subscription access.` }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Typing Practice</h1>
          <p className="mt-1 text-slate-500">
            Choose your practice mode, select a passage, and start your timed test.
          </p>
        </div>

        {/* ── Step 1: Mode selector ────────────────────────── */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">1</span>
            <h2 className="font-bold text-slate-800">Choose Your Practice Mode</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {modes.map(({ id, icon: Icon, label, badge, badgeColor, desc, detail }) => {
              const selected = mode === id;
              return (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={`relative w-full rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                    selected
                      ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Selected ring */}
                  {selected && (
                    <div className="absolute right-4 top-4">
                      <CheckCircle2 size={20} className="text-indigo-600" />
                    </div>
                  )}

                  {/* Icon + badge row */}
                  <div className="mb-3 flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon size={21} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900">{label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeColor}`}>
                          {badge}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
                    </div>
                  </div>

                  {/* Feature bullets */}
                  <ul className="grid gap-1 pl-0">
                    {detail.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${selected ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Context hint */}
          <div className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-xs ${
            mode === 'paper'
              ? 'bg-amber-50 border border-amber-200 text-amber-800'
              : 'bg-indigo-50 border border-indigo-100 text-indigo-700'
          }`}>
            <span className="text-base">{mode === 'paper' ? '📄' : '🖥️'}</span>
            <span>
              {mode === 'paper'
                ? 'Paper mode: Print your passage PDF first (Download section), place it beside your keyboard, then start the test. The screen will only show the typing area — just like the real exam hall.'
                : 'On-screen mode: The passage appears at the top of the typing screen. Words light up as you type so you always know if you\'re on track.'}
            </span>
          </div>
        </div>

        {/* ── Step 2: Passage selector ──────────────────────── */}
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">2</span>
            <h2 className="font-bold text-slate-800">Select Passage &amp; Start</h2>
          </div>

          <PassageSelector
            onStart={(passage) => navigate('/practice/test', { state: { passage, mode } })}
            onLocked={locked}
          />
        </div>
      </main>
    </div>
  );
}
