import express from 'express';
import { calculateTypingResult } from '../utils/typingCalculator.js';
import { signedPdfUrl } from '../utils/storage.js';
import { comparePassword, hashPassword, signToken, tokenFromRequest, verifyToken } from '../utils/auth.js';

function hasActiveSubscription(student) {
  return student?.subscription_status === 'active';
}

function isFreePassage(passage) {
  return Number(passage?.passage_number) <= 4 || passage?.is_free === true;
}

async function getStudentFromRequest(store, req) {
  const decoded = verifyToken(tokenFromRequest(req));
  if (!decoded || decoded.role !== 'student') return null;
  return store.getStudentById(decoded.sub);
}

async function requireStudent(store, req, res) {
  const student = await getStudentFromRequest(store, req);
  if (!student) {
    res.status(401).json({ error: 'Student login required' });
    return null;
  }
  return student;
}

export function publicRoutes(store) {
  const router = express.Router();

  router.post('/students/register', async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || !email || password.length < 4) {
      return res.status(400).json({ error: 'Name, email, and password with at least 4 characters are required' });
    }
    try {
      const student = await store.createStudent({ name, email, passwordHash: hashPassword(password) });
      const token = signToken({ sub: student.id, role: 'student' });
      return res.json({ token, student });
    } catch {
      return res.status(400).json({ error: 'Email is already registered' });
    }
  });

  router.post('/students/login', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const student = await store.getStudentByEmail(email);
    if (!student || !comparePassword(password, student.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken({ sub: student.id, role: 'student' });
    return res.json({ token, student: { id: student.id, name: student.name, email: student.email, subscription_status: student.subscription_status, subscription_type: student.subscription_type, paid_at: student.paid_at } });
  });

  router.post('/students/logout', (req, res) => res.json({ ok: true }));

  router.get('/students/me', async (req, res) => {
    const student = await getStudentFromRequest(store, req);
    if (!student) return res.status(401).json({ error: 'Student login required' });
    return res.json({ student });
  });

  router.get('/students/subscription', async (req, res) => {
    const student = await requireStudent(store, req, res);
    if (!student) return;
    return res.json({ subscription: { status: student.subscription_status || 'free', type: student.subscription_type || null, paidAt: student.paid_at || null, active: hasActiveSubscription(student) } });
  });

  router.get('/students/history', async (req, res) => {
    const student = await requireStudent(store, req, res);
    if (!student) return;
    const history = await store.historyForStudent(student.id);
    res.json({ history });
  });

  router.get('/exams', async (req, res) => res.json({ exams: await store.listExams() }));
  router.get('/stats', async (req, res) => res.json(await store.stats()));
  router.get('/exams/:id/pdfs', async (req, res) => res.json({ pdfs: await store.pdfsByExam(req.params.id) }));

  router.get('/pdfs/:id/download', async (req, res) => {
    try {
      const pdf = await store.getPdf(req.params.id);
      if (!pdf) return res.status(404).json({ error: 'PDF not found' });
      const url = await signedPdfUrl(pdf.filename);
      return res.redirect(url);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  });

  router.get('/pdfs/:id/passages', async (req, res) => res.json({ passages: await store.passagesByPdf(req.params.id) }));

  router.get('/passages/:id', async (req, res) => {
    const passage = await store.getPassage(req.params.id);
    if (!passage) return res.status(404).json({ error: 'Passage not found' });
    if (!isFreePassage(passage)) {
      const student = await getStudentFromRequest(store, req);
      if (!student) return res.status(401).json({ error: 'Login required for passage 5 onwards', code: 'LOGIN_REQUIRED' });
      if (!hasActiveSubscription(student)) return res.status(402).json({ error: 'Subscription required for passage 5 onwards', code: 'SUBSCRIPTION_REQUIRED' });
    }
    return res.json({ passage });
  });

  router.post('/results', async (req, res) => {
    const { examId, pdfId, passageId, typedText, originalText, durationSeconds, backspaceCount, keystrokes } = req.body;
    if (!originalText || !String(typedText || '').trim()) return res.status(400).json({ error: 'Original and typed text are required' });

    const passage = passageId ? await store.getPassage(passageId) : null;
    const student = await getStudentFromRequest(store, req);
    if (!isFreePassage(passage)) {
      if (!student) return res.status(401).json({ error: 'Login required for passage 5 onwards', code: 'LOGIN_REQUIRED' });
      if (!hasActiveSubscription(student)) return res.status(402).json({ error: 'Subscription required for passage 5 onwards', code: 'SUBSCRIPTION_REQUIRED' });
    }

    const result = calculateTypingResult({ originalText, typedText, durationSeconds, backspaceCount, keystrokes });
    if (!student) return res.json({ id: null, result, saved: false });

    const id = await store.createResult([
      student.id,
      examId || null,
      pdfId || null,
      passageId || null,
      typedText,
      originalText,
      result.highlightedOriginal,
      result.highlightedTyped,
      result.durationSeconds,
      result.durationFormatted,
      result.totalKeystrokes,
      result.backspaceCount,
      result.totalWordsTyped,
      result.grossWpm,
      result.netWpm,
      result.accuracy,
      result.errorPercentage,
      result.errors.additions,
      result.errors.omissions,
      result.errors.spellingSubstitutionRepetition,
      result.errors.incompleteWords,
      result.errors.spacing,
      result.errors.capitalization,
      result.errors.punctuation,
      result.errors.transposition,
      result.errors.paragraphic,
      result.errors.tab,
      result.errors.fullErrors,
      result.errors.halfErrors,
      result.errors.totalErrors,
      result.marks,
      result.qualified
    ]);
    res.json({ id, result, saved: true });
  });

  router.post('/payments/cashfree/order', async (req, res) => {
    const student = await requireStudent(store, req, res);
    if (!student) return;
    const amount = 100;
    const orderId = `lt_${Date.now()}_${String(student.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`;
    const returnUrl = `${process.env.FRONTEND_URL || 'https://www.legaltypingtest.online'}/subscription?order_id={order_id}`;

    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return res.status(501).json({ error: 'Cashfree is not configured yet. Add CASHFREE_APP_ID and CASHFREE_SECRET_KEY in Render.' });
    }

    const endpoint = process.env.CASHFREE_ENV === 'production' ? 'https://api.cashfree.com/pg/orders' : 'https://sandbox.cashfree.com/pg/orders';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: String(student.id),
          customer_name: student.name,
          customer_email: student.email,
          customer_phone: '9999999999'
        },
        order_meta: { return_url: returnUrl }
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(400).json({ error: data.message || 'Unable to create Cashfree order', details: data });
    await store.createCashfreePayment({ studentId: student.id, orderId, paymentSessionId: data.payment_session_id, amount });
    res.json({ orderId, paymentSessionId: data.payment_session_id, environment: process.env.CASHFREE_ENV || 'sandbox' });
  });

  router.post('/payments/cashfree/verify', async (req, res) => {
    const student = await requireStudent(store, req, res);
    if (!student) return;
    const orderId = String(req.body.orderId || req.query.order_id || '').trim();
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) return res.status(501).json({ error: 'Cashfree is not configured yet' });

    const base = process.env.CASHFREE_ENV === 'production' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com';
    const response = await fetch(`${base}/pg/orders/${encodeURIComponent(orderId)}/payments`, {
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY
      }
    });
    const data = await response.json();
    if (!response.ok) return res.status(400).json({ error: data.message || 'Unable to verify payment', details: data });
    const paid = Array.isArray(data) && data.some((payment) => payment.payment_status === 'SUCCESS');
    if (!paid) return res.status(402).json({ error: 'Payment not completed', details: data });
    const updatedStudent = await store.markCashfreePaymentPaid(orderId);
    res.json({ ok: true, student: updatedStudent });
  });

  router.post('/payments/mock-lifetime', async (req, res) => {
    const student = await requireStudent(store, req, res);
    if (!student) return;
    if (process.env.ALLOW_MOCK_PAYMENTS !== 'true') return res.status(403).json({ error: 'Mock payments are disabled' });
    const updatedStudent = await store.activateLifetimeSubscription(student.id);
    res.json({ ok: true, student: updatedStudent });
  });

  router.get('/results/:id', async (req, res) => {
    const result = await store.getResult(req.params.id);
    if (!result) return res.status(404).json({ error: 'Result not found' });
    return res.json({ result });
  });

  return router;
}
