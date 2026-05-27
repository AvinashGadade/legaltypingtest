import { Mail, Clock, HelpCircle, MessageSquare } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';

const faqs = [
  {
    q: 'Is this platform free to use?',
    a: 'Yes! The first 4 passages are completely free with no login required. Register a free account to save your history and access more passages.'
  },
  {
    q: 'How is the score calculated?',
    a: 'We use the official BHC exam formula — Gross WPM, Net WPM (after deducting errors), accuracy percentage, and marks out of 20. You need Net WPM ≥ 40 and Marks ≥ 10 to qualify.'
  },
  {
    q: 'Are the passages official BHC exam passages?',
    a: 'Yes, all passages are sourced from official Bombay High Court clerk recruitment exams.'
  },
  {
    q: 'I forgot my password. What do I do?',
    a: 'Use the "Forgot Password" link on the login page and we\'ll send a reset link to your registered email.'
  }
];

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-14 text-center text-white">
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />
        <span className="mb-3 inline-block rounded-full bg-indigo-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-300 ring-1 ring-indigo-500/30">
          Contact Us
        </span>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          We're here to help
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-white/70">
          Have a question, found a bug, or need help with your account? Reach out and we'll get back to you.
        </p>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2">

          {/* Contact Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Mail size={24} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Email Support</h2>
            <p className="mt-2 text-slate-500">
              For any queries related to your account, subscription, passages, or technical issues — email us directly.
            </p>

            <a
              href="mailto:noreply.legaltypingtest@gmail.com"
              className="mt-6 flex items-center gap-3 rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-500"
            >
              <Mail size={18} />
              noreply.legaltypingtest@gmail.com
            </a>

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <Clock size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Response Time</p>
                <p className="text-sm text-slate-500">We typically reply within 24–48 hours on working days.</p>
              </div>
            </div>
          </div>

          {/* What to include */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <MessageSquare size={24} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">When emailing us</h2>
            <p className="mt-2 text-slate-500">Help us resolve your issue faster by including:</p>

            <ul className="mt-5 space-y-3">
              {[
                'Your registered email address',
                'A clear description of the issue',
                'Which page or feature is affected',
                'Screenshot (if possible)'
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-700">
              <strong>Note:</strong> This email is for support only. Promotional or spam emails will not be responded to.
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-16">
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <HelpCircle size={20} />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            <p className="mt-2 text-slate-500">Quick answers before you reach out</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-slate-900">{q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
        <p>LegalTypingTest · Bombay High Court Clerk Typing Practice &amp; Evaluation</p>
        <p className="mt-1 text-xs">Qualification criteria: Net WPM ≥ 40 &amp; Marks ≥ 10 out of 20</p>
      </footer>
    </div>
  );
}
