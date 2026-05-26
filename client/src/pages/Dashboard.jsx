import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Keyboard, Download, BookOpen, Clock, BarChart2,
  CheckCircle2, ArrowRight, Trophy, Zap, Shield
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { API_BASE_URL as API } from '../utils/api.js';

const steps = [
  {
    num: '01',
    icon: BookOpen,
    title: 'Choose a Passage',
    desc: 'Select from official Bombay High Court exam passages. Passages 1–4 are free — no login needed.'
  },
  {
    num: '02',
    icon: Keyboard,
    title: 'Type & See Live Feedback',
    desc: 'Type the passage as the timer counts down. Every word lights up green or red in real time as you type.'
  },
  {
    num: '03',
    icon: BarChart2,
    title: 'Get Your Full Analysis',
    desc: 'See your WPM, accuracy, marks, and a detailed breakdown of every error — just like the real exam.'
  }
];

const features = [
  {
    icon: Zap,
    color: 'bg-amber-50 text-amber-600',
    title: 'Live Word Highlighting',
    desc: 'Every word you type is compared in real time — correct words glow green, errors show red instantly.'
  },
  {
    icon: BarChart2,
    color: 'bg-indigo-50 text-indigo-600',
    title: 'BHC Exam Scoring',
    desc: 'Gross WPM, Net WPM, error percentage, and marks calculated exactly as per the official exam formula.'
  },
  {
    icon: Clock,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Timed Tests — 5, 10, 15 min',
    desc: 'Practice with the standard 10-minute timer or adjust for short sprint or long-form endurance sessions.'
  },
  {
    icon: Trophy,
    color: 'bg-rose-50 text-rose-600',
    title: 'Qualification Check',
    desc: 'Instantly know if you qualify: you need Net WPM ≥ 40 and Marks ≥ 10 out of 20.'
  },
  {
    icon: CheckCircle2,
    color: 'bg-purple-50 text-purple-600',
    title: 'Detailed Error Breakdown',
    desc: 'Full errors, half errors, omissions, additions, capitalization, punctuation — all categorised clearly.'
  },
  {
    icon: Shield,
    color: 'bg-slate-50 text-slate-600',
    title: 'Exam-like Environment',
    desc: 'Copy-paste disabled, right-click blocked, optional backspace control — mirrors real exam conditions.'
  }
];

export default function Dashboard() {
  const [stats, setStats] = useState({ exams: 0, passages: 0, pdfs: 0, tests: 0 });
  const studentName = localStorage.getItem('studentName');

  useEffect(() => {
    fetch(`${API}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-16 text-white md:py-24">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <span className="mb-4 inline-block rounded-full bg-indigo-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-300 ring-1 ring-indigo-500/30">
            Official Exam Preparation
          </span>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Bombay High Court<br />
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Clerk Typing Practice
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/70 leading-relaxed">
            Practice with real BHC exam passages. Live word-by-word comparison, accurate WPM
            scoring, and full error analysis — so you know exactly where you stand.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/practice"
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-7 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-400 hover:shadow-xl hover:shadow-indigo-500/40"
            >
              <Keyboard size={18} /> Start Typing Practice
            </Link>
            <Link
              to="/download-passages"
              className="flex items-center gap-2 rounded-xl bg-white/10 px-7 py-3.5 font-bold text-white ring-1 ring-white/20 transition-all hover:bg-white/15"
            >
              <Download size={18} /> Download Passages
            </Link>
          </div>
          {!studentName && (
            <p className="mt-5 text-sm text-white/50">
              First 4 passages are free — no account needed.{' '}
              <Link to="/student/register" className="font-semibold text-indigo-300 hover:text-indigo-200 underline underline-offset-2">
                Register free
              </Link>{' '}
              to save your history.
            </p>
          )}
          {studentName && (
            <p className="mt-5 text-sm text-white/60">
              Welcome back, <span className="font-semibold text-white">{studentName}</span>! Ready to beat your last score?
            </p>
          )}
        </div>
      </section>

      {/* ── Live Stats Strip ──────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-slate-100 sm:grid-cols-4">
          {[
            { label: 'Exams Available', value: stats.exams || '—' },
            { label: 'Practice Passages', value: stats.passages || '—' },
            { label: 'PDFs Uploaded', value: stats.pdfs || '—' },
            { label: 'Tests Taken', value: stats.tests || '—' }
          ].map(({ label, value }) => (
            <div key={label} className="px-6 py-5 text-center">
              <p className="text-2xl font-black text-indigo-700">{value}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-16">

        {/* ── How it Works ──────────────────────────────── */}
        <div className="mb-20">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900">How it works</h2>
            <p className="mt-2 text-slate-500">Three simple steps to know your exact exam readiness</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map(({ num, icon: Icon, title, desc }) => (
              <div key={num} className="card-hover relative p-7">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon size={22} />
                  </div>
                  <span className="text-4xl font-black text-slate-100">{num}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Features ───────────────────────────────────── */}
        <div className="mb-20">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900">Everything you need to qualify</h2>
            <p className="mt-2 text-slate-500">Built specifically for the Bombay High Court Clerk exam</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="card-hover p-6">
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA Banner ─────────────────────────────────── */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-10 text-center text-white shadow-xl shadow-indigo-500/20">
          <h2 className="text-3xl font-extrabold">Ready to start practicing?</h2>
          <p className="mt-3 text-white/80">
            Jump right in — no sign-up required for the first 4 passages.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/practice"
              className="flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-bold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50"
            >
              Start Free Test <ArrowRight size={16} />
            </Link>
            <Link
              to="/student/register"
              className="flex items-center gap-2 rounded-xl bg-white/15 px-7 py-3.5 font-bold text-white ring-1 ring-white/25 transition-all hover:bg-white/20"
            >
              Create Account — it's free
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
        <p>LegalTypingTest · Bombay High Court Clerk Typing Practice &amp; Evaluation</p>
        <p className="mt-1 text-xs">Qualification criteria: Net WPM ≥ 40 &amp; Marks ≥ 10 out of 20</p>
      </footer>
    </div>
  );
}
