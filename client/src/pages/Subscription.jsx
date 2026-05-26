import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { load } from '@cashfreepayments/cashfree-js';
import {
  CheckCircle2, CreditCard, LockKeyhole, Unlock,
  BookOpen, History, Star
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { API_BASE_URL as API } from '../utils/api.js';

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('studentToken')}` });

const perks = [
  { icon: Unlock,    text: 'Access Passage 5 onwards (all locked passages)' },
  { icon: Star,      text: 'All future PDFs and manually added passages included' },
  { icon: History,   text: 'Full test history saved and accessible any time' },
  { icon: BookOpen,  text: 'First 4 passages remain free for everyone' },
  { icon: CheckCircle2, text: 'Lifetime access — pay once, use forever' }
];

export default function Subscription() {
  const { state }   = useLocation();
  const [sub,       setSub]     = useState(null);
  const [message,   setMessage] = useState(state?.message || '');
  const [loading,   setLoading] = useState(false);

  const fetchSub = () =>
    fetch(`${API}/students/subscription`, { headers: auth() })
      .then((r) => r.json())
      .then((d) => setSub(d.subscription || null))
      .catch(() => setMessage('Unable to load subscription status'));

  useEffect(() => { fetchSub(); }, []);

  /* Verify Cashfree payment redirect */
  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('order_id');
    if (!orderId) return;
    setLoading(true);
    fetch(`${API}/payments/cashfree/verify`, {
      method:  'POST',
      headers: { ...auth(), 'Content-Type': 'application/json' },
      body:    JSON.stringify({ orderId })
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        setMessage(ok ? '✅ Payment verified. Lifetime access is now active!' : (d.error || 'Payment verification failed'));
        fetchSub();
      })
      .finally(() => setLoading(false));
  }, []);

  const startPayment = async () => {
    setLoading(true);
    setMessage('Creating payment session…');
    const res  = await fetch(`${API}/payments/cashfree/order`, { method: 'POST', headers: auth() });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMessage(data.error || 'Unable to start payment'); return; }
    const cashfree = await load({ mode: data.environment === 'production' ? 'production' : 'sandbox' });
    await cashfree.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: '_self' });
  };

  const activateMock = async () => {
    setLoading(true);
    const res  = await fetch(`${API}/payments/mock-lifetime`, { method: 'POST', headers: auth() });
    const data = await res.json();
    setLoading(false);
    setMessage(res.ok ? '✅ Test access activated successfully.' : (data.error || 'Mock activation is disabled'));
    if (res.ok) fetchSub();
  };

  const active = sub?.active;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">

        {/* Active subscription banner */}
        {active && (
          <div className="mb-8 fade-in-up overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center text-white shadow-xl shadow-emerald-500/25">
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="text-3xl font-black">You have Lifetime Access!</h1>
            <p className="mt-2 text-white/85">All passages are unlocked. Keep practicing and ace the exam!</p>
            <Link to="/practice" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 font-bold text-emerald-700 hover:bg-emerald-50">
              ▶ Start Practicing
            </Link>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">

          {/* ── Pricing Card ── */}
          <section className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${active ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {active ? <Unlock size={22} /> : <LockKeyhole size={22} />}
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Lifetime Access</h2>
                <p className="text-sm text-slate-500">Unlock everything, once — forever.</p>
              </div>
            </div>

            {/* Price */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white mb-6">
              <p className="text-sm font-medium text-white/60 uppercase tracking-wider">One-time payment</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-6xl font-black">₹100</span>
                <span className="text-white/60">only</span>
              </div>
              <p className="mt-2 text-white/70 text-sm">No subscriptions, no renewals. Pay once, use always.</p>
            </div>

            {/* Perks */}
            <ul className="mb-7 grid gap-3">
              {perks.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm text-slate-700">
                  <Icon size={17} className="mt-0.5 shrink-0 text-emerald-500" />
                  {text}
                </li>
              ))}
            </ul>

            {/* Buttons */}
            <div className="grid gap-3">
              <button
                disabled={loading || active}
                onClick={startPayment}
                className="btn-primary w-full disabled:opacity-60"
              >
                <CreditCard size={17} />
                {active ? 'Already Subscribed' : 'Pay ₹100 with Cashfree'}
              </button>
              <button
                disabled={loading || active}
                onClick={activateMock}
                className="btn-ghost w-full text-sm disabled:opacity-60"
              >
                ⚙️ Activate Test Access (Dev Mode)
              </button>
              <Link to="/practice" className="btn-ghost w-full text-center text-sm">
                ← Back to Practice
              </Link>
            </div>

            {message && (
              <div className={`mt-5 flex gap-2 rounded-xl p-4 text-sm ${
                message.startsWith('✅')
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}>
                <span>{message}</span>
              </div>
            )}
          </section>

          {/* ── Status Panel ── */}
          <aside className="flex flex-col gap-5">
            <div className="card p-6">
              <h3 className="font-bold text-slate-900 mb-4">Your Subscription</h3>
              <div className={`rounded-2xl p-5 ${active ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-100 border border-slate-200'}`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Plan</p>
                <p className={`mt-2 text-3xl font-black ${active ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {active ? 'Lifetime ✓' : 'Free'}
                </p>
                <p className={`mt-1.5 text-sm ${active ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {active
                    ? 'All passages are unlocked for you.'
                    : 'Passages 1–4 available. Passage 5+ locked.'}
                </p>
              </div>

              {sub?.paid_at && (
                <p className="mt-3 text-xs text-slate-400">
                  Subscribed on {new Date(sub.paid_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'long', year: 'numeric'
                  })}
                </p>
              )}
            </div>

            {/* What's free */}
            <div className="card p-6">
              <h3 className="font-bold text-slate-900 mb-3">What's always free</h3>
              <ul className="grid gap-2 text-sm text-slate-600">
                {['Passages 1, 2, 3, and 4', 'Live word highlighting during test', 'Full WPM & accuracy analysis', 'Error breakdown report', 'PDF download'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
