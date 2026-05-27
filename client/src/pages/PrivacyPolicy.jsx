import { Shield } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

const sections = [
  {
    title: '1. Information We Collect',
    content: [
      'When you register, we collect your name, email address, and a hashed (encrypted) password.',
      'If you sign in with Google, we receive your name and email from Google — we never see your Google password.',
      'We collect typing test results (WPM, accuracy, passage, duration) to show you your history.',
      'We do not collect any payment information directly — payments are processed securely by third-party providers.'
    ]
  },
  {
    title: '2. How We Use Your Information',
    content: [
      'To create and manage your account.',
      'To save and display your typing test history and progress.',
      'To send password reset emails when requested.',
      'To improve the platform based on usage patterns (no personally identifiable data is shared).'
    ]
  },
  {
    title: '3. Data Storage & Security',
    content: [
      'Your data is stored securely on our servers. Passwords are never stored in plain text — they are hashed using industry-standard encryption.',
      'We use HTTPS to encrypt all data transmitted between your browser and our servers.',
      'We do not sell, trade, or rent your personal information to any third party.'
    ]
  },
  {
    title: '4. Google OAuth',
    content: [
      'When you use "Sign in with Google," we only request your name and email address.',
      'We do not access your Google Drive, Gmail, contacts, or any other Google services.',
      'Your Google account credentials are never stored by us.'
    ]
  },
  {
    title: '5. Cookies',
    content: [
      'We use browser localStorage to keep you logged in across sessions.',
      'We do not use advertising cookies or third-party tracking cookies.',
      'You can clear your browser data at any time to log out and remove stored data.'
    ]
  },
  {
    title: '6. Your Rights',
    content: [
      'You can request deletion of your account and all associated data by emailing us.',
      'You can update your name or password from your account settings.',
      'You can stop using the platform at any time — no obligations.'
    ]
  },
  {
    title: '7. Changes to This Policy',
    content: [
      'We may update this Privacy Policy occasionally. If we make significant changes, we will notify you by email or a notice on the site.',
      'Continued use of the platform after changes means you accept the updated policy.'
    ]
  },
  {
    title: '8. Contact Us',
    content: [
      'If you have any questions about this Privacy Policy, please email us at noreply.legaltypingtest@gmail.com'
    ]
  }
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-14 text-center text-white">
        <span className="mb-3 inline-block rounded-full bg-indigo-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-300 ring-1 ring-indigo-500/30">
          Legal
        </span>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20">
          <Shield size={26} className="text-indigo-300" />
        </div>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">Privacy Policy</h1>
        <p className="mx-auto mt-4 max-w-lg text-white/70">
          Last updated: May 2025
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/60">
          We respect your privacy. This policy explains what data we collect, why we collect it, and how we protect it.
        </p>
      </section>

      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="space-y-6">
          {sections.map(({ title, content }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="mb-4 text-lg font-extrabold text-slate-900">{title}</h2>
              <ul className="space-y-2">
                {content.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-slate-600">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
