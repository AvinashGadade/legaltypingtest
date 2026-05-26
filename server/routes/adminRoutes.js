import express from 'express';
import multer from 'multer';
import { comparePassword, signToken, tokenFromRequest, verifyToken } from '../utils/auth.js';
import { makeStoragePath, removePdfObject, uploadPdfBuffer } from '../utils/storage.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF files are allowed'));
    cb(null, true);
  }
});

function requireAdmin(req, res, next) {
  const decoded = verifyToken(tokenFromRequest(req));
  if (!decoded || decoded.role !== 'admin') return res.status(401).json({ error: 'Unauthorized' });
  next();
}

export function adminRoutes(store) {
  const router = express.Router();

  router.post('/login', (req, res) => {
    const email = String(req.body.email || req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const adminEmail = String(process.env.ADMIN_EMAIL || process.env.ADMIN_USERNAME || '').trim().toLowerCase();
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';
    const legacyAdminPassword = process.env.ADMIN_PASSWORD || '';
    const validPassword = adminPasswordHash ? comparePassword(password, adminPasswordHash) : Boolean(legacyAdminPassword && password === legacyAdminPassword);
    if (email === adminEmail && validPassword) return res.json({ token: signToken({ sub: 'admin', role: 'admin' }), username: email });
    return res.status(401).json({ error: 'Invalid admin credentials' });
  });

  router.use(requireAdmin);

  router.get('/me', (req, res) => res.json({ admin: true }));

  router.get('/exams', async (req, res) => res.json({ exams: await store.adminExams() }));

  router.post('/exams', async (req, res) => {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Exam name is required' });
    const id = await store.createExam(name);
    res.json({ id, name });
  });

  router.delete('/exams/:id', async (req, res) => {
    await store.deleteExam(req.params.id);
    res.json({ ok: true });
  });

  router.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {
      const examId = Number(req.body.examId);
      const title = String(req.body.title || '').trim();
      if (!examId || !title || !req.file) return res.status(400).json({ error: 'Exam, title, and PDF are required' });

      const storagePath = makeStoragePath(req.file.originalname);
      await uploadPdfBuffer({ path: storagePath, buffer: req.file.buffer, contentType: req.file.mimetype });

      const pdfId = await store.createPdf({
        examId,
        title,
        storagePath,
        originalFilename: req.file.originalname,
        fileSize: req.file.size
      });

      res.json({
        id: pdfId,
        storagePath,
        message: 'PDF uploaded. Add or edit passage text manually from Manage Passages.'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/pdfs', async (req, res) => res.json({ pdfs: await store.adminPdfs() }));

  router.delete('/pdfs/:id', async (req, res) => {
    const pdf = await store.getPdf(req.params.id);
    if (pdf) await removePdfObject(pdf.filename);
    await store.deletePdf(req.params.id);
    res.json({ ok: true });
  });

  /* ── Student management ── */
  router.get('/students', async (req, res) => {
    const search = String(req.query.search || '').trim();
    const students = await store.listStudents({ search });
    res.json({ students });
  });

  router.post('/students/:id/subscription', async (req, res) => {
    const status = String(req.body.status || '').trim();
    if (!['active', 'free'].includes(status)) return res.status(400).json({ error: 'status must be active or free' });
    const student = await store.setStudentSubscription(req.params.id, status);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ ok: true, student });
  });

  router.get('/passages', async (req, res) => res.json({ passages: await store.adminPassages() }));

  router.post('/passages', async (req, res) => {
    const { examId, pdfId, passageNumber, title, content } = req.body;
    if (!examId || !String(content || '').trim()) return res.status(400).json({ error: 'Exam and passage content are required' });
    if (!pdfId) return res.status(400).json({ error: 'PDF is required so students can access this passage' });
    const id = await store.createPassage({ examId, pdfId, passageNumber, title, content });
    res.json({ id });
  });

  router.put('/passages/:id', async (req, res) => {
    const { pdfId, passageNumber, title, content } = req.body;
    if (!pdfId) return res.status(400).json({ error: 'PDF is required so students can access this passage' });
    if (!String(content || '').trim()) return res.status(400).json({ error: 'Passage content is required' });
    await store.updatePassage(req.params.id, { pdfId, passageNumber, title, content });
    res.json({ ok: true });
  });

  router.delete('/passages/:id', async (req, res) => {
    await store.deletePassage(req.params.id);
    res.json({ ok: true });
  });

  return router;
}
