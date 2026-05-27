import { Link } from 'react-router-dom';
import { Scale, Mail, Trophy } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">

      {/* All the best banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-4 py-5 text-center text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-3">
          <Trophy size={20} className="text-amber-300 shrink-0" />
          <p className="text-sm font-semibold">
            All the best for your BHC exam! You've got this — keep practicing and stay confident.
          </p>
          <Trophy size={20} className="text-amber-300 shrink-0" />
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Scale size={16} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">LegalTypingTest</p>
                <p className="text-[10px] text-indigo-500">Bombay High Court</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Free online typing practice platform built specifically for Bombay High Court clerk exam aspirants.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Quick Links</p>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/',                    label: 'Home' },
                { to: '/practice',            label: 'Start Practice' },
                { to: '/download-passages',   label: 'Download Passages' },
                { to: '/student/login',       label: 'Login / Register' },
                { to: '/contact',             label: 'Contact Us' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-slate-500 transition-colors hover:text-indigo-600">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Legal</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy-policy" className="text-slate-500 transition-colors hover:text-indigo-600">Privacy Policy</Link>
              </li>
            </ul>

            <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-slate-400">Contact</p>
            <a
              href="mailto:noreply.legaltypingtest@gmail.com"
              className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-indigo-600"
            >
              <Mail size={14} />
              noreply.legaltypingtest@gmail.com
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} LegalTypingTest. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
            Qualification: Net WPM ≥ 40 &amp; Marks ≥ 10 / 20
          </p>
        </div>
      </div>
    </footer>
  );
}
