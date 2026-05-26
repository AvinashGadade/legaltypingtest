import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { load } from '@cashfreepayments/cashfree-js';
import { CheckCircle2, CreditCard, LockKeyhole } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { API_BASE_URL as API } from '../utils/api.js';

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('studentToken')}` });

export default function Subscription() {
  const { state } = useLocation();
  const [subscription, setSubscription] = useState(null);
  const [message, setMessage] = useState(state?.message || '');
  const [loading, setLoading] = useState(false);

  const load = () => fetch(`${API}/students/subscription`, { headers: auth() })
    .then((res) => res.json())
    .then((data) => setSubscription(data.subscription || null))
    .catch(() => setMessage('Unable to load subscription status'));

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('order_id');
    if (!orderId) return;
    setLoading(true);
    fetch(`${API}/payments/cashfree/verify`, {
      method: 'POST',
      headers: { ...auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        setMessage(ok ? 'Payment verified. Lifetime access is active.' : (data.error || 'Payment verification failed'));
        return load();
      })
      .finally(() => setLoading(false));
  }, []);

  const startPayment = async () => {
    setLoading(true);
    setMessage('Creating Cashfree payment session...');
    const res = await fetch(`${API}/payments/cashfree/order`, { method: 'POST', headers: auth() });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setMessage(data.error || 'Unable to start payment');
    const cashfree = await load({ mode: data.environment === 'production' ? 'production' : 'sandbox' });
    await cashfree.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: '_self' });
  };

  const activateMock = async () => {
    setLoading(true);
    const res = await fetch(`${API}/payments/mock-lifetime`, { method: 'POST', headers: auth() });
    const data = await res.json();
    setLoading(false);
    setMessage(res.ok ? 'Test lifetime access activated.' : (data.error || 'Mock activation is disabled'));
    if (res.ok) load();
  };

  const active = subscription?.active;

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="card p-7">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-100 text-indigo-700"><LockKeyhole /></div>
              <div>
                <h1 className="text-3xl font-extrabold">Lifetime Access</h1>
                <p className="mt-1 text-slate-600">Unlock Passage 5 onwards and all future uploads.</p>
              </div>
            </div>
            <div className="mt-7 rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">One-time payment</p>
              <p className="mt-2 text-5xl font-black text-slate-950">₹100</p>
              <p className="mt-2 text-slate-600">Lifetime access for this account.</p>
            </div>
            <div className="mt-6 grid gap-3 text-sm font-semibold text-slate-700">
              <p className="flex items-center gap-2"><CheckCircle2 className="text-emerald-600" size={18} /> First 4 passages remain free for everyone</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="text-emerald-600" size={18} /> Passage 5 onwards unlocked after subscription</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="text-emerald-600" size={18} /> All future PDFs and manually added passages included</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="text-emerald-600" size={18} /> Test history saved after login</p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <button disabled={loading || active} onClick={startPayment} className="btn-primary disabled:opacity-60"><CreditCard className="mr-2 inline" size={18} /> Pay with Cashfree</button>
              <button disabled={loading || active} onClick={activateMock} className="btn-blue disabled:opacity-60">Activate Test Access</button>
              <Link to="/practice" className="rounded-xl border px-5 py-3 font-bold text-slate-700 hover:bg-slate-50">Back to Practice</Link>
            </div>
            {message && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">{message}</p>}
          </section>

          <aside className="card p-6">
            <h2 className="text-xl font-bold">Subscription Status</h2>
            <div className={`mt-5 rounded-2xl p-5 ${active ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              <p className="text-sm font-semibold">Current Plan</p>
              <p className="mt-2 text-2xl font-black">{active ? 'Lifetime Active' : 'Free'}</p>
              <p className="mt-2 text-sm">{active ? 'You can access all locked passages.' : 'You can practice passages 1-4 only.'}</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
