import express from 'express';
import multer from 'multer';
import { extractPdfText } from '../utils/pdfExtractor.js';
import { splitIntoPassages } from '../utils/passageSplitter.js';
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

      const extractedText = await extractPdfText(req.file.buffer);
      const manualText = String(req.body.manualText || '').trim();
      const extractedPassages = splitIntoPassages(extractedText);
      const passages = (extractedPassages.length ? extractedPassages : splitIntoPassages(manualText)).map((content, index) => ({
        pdfId,
        examId,
        passageNumber: index + 1,
        title: `Passage ${index + 1}`,
        content
      }));
      await store.createPassages(passages);
      res.json({
        id: pdfId,
        storagePath,
        passagesCreated: passages.length,
        extractedTextLength: extractedText.trim().length,
        warning: passages.length === 0 ? 'PDF uploaded, but no selectable passages were extracted. Add passages manually from Manage Passages.' : ''
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
