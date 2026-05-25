import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { extractPdfText } from '../utils/pdfExtractor.js';
import { splitIntoPassages } from '../utils/passageSplitter.js';
import { comparePassword, hashPassword, signToken, tokenFromRequest, verifyToken } from '../utils/auth.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '-')}`)
});

const upload = multer({
  storage,
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

export function adminRoutes(db) {
  const router = express.Router();

  router.post('/login', (req, res) => {
    const email = String(req.body.email || req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const adminEmail = String(process.env.ADMIN_EMAIL || process.env.ADMIN_USERNAME || '').trim().toLowerCase();
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';
    const legacyAdminPassword = process.env.ADMIN_PASSWORD || '';
    const validPassword = adminPasswordHash
      ? comparePassword(password, adminPasswordHash)
      : Boolean(legacyAdminPassword && password === legacyAdminPassword);
    if (email === adminEmail && validPassword) {
      return res.json({ token: signToken({ sub: 'admin', role: 'admin' }), username: email });
    }
    return res.status(401).json({ error: 'Invalid admin credentials' });
  });

  router.use(requireAdmin);

  router.get('/exams', (req, res) => {
    res.json({ exams: db.prepare('SELECT * FROM exams ORDER BY created_at DESC').all() });
  });

  router.post('/exams', (req, res) => {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Exam name is required' });
    const info = db.prepare('INSERT INTO exams (name) VALUES (?)').run(name);
    res.json({ id: info.lastInsertRowid, name });
  });

  router.delete('/exams/:id', (req, res) => {
    db.prepare('DELETE FROM exams WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  router.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {
      const examId = Number(req.body.examId);
      const title = String(req.body.title || '').trim();
      if (!examId || !title || !req.file) return res.status(400).json({ error: 'Exam, title, and PDF are required' });

      const pdfInfo = db.prepare('INSERT INTO pdfs (exam_id, title, filename, original_filename, file_size) VALUES (?, ?, ?, ?, ?)')
        .run(examId, title, req.file.filename, req.file.originalname, req.file.size);

      const extractedText = await extractPdfText(req.file.path);
      const manualText = String(req.body.manualText || '').trim();
      const extractedPassages = splitIntoPassages(extractedText);
      const passages = extractedPassages.length ? extractedPassages : splitIntoPassages(manualText);
      const insertPassage = db.prepare('INSERT INTO passages (pdf_id, exam_id, passage_number, title, content) VALUES (?, ?, ?, ?, ?)');
      passages.forEach((content, index) => {
        insertPassage.run(pdfInfo.lastInsertRowid, examId, index + 1, `Passage ${index + 1}`, content);
      });

      res.json({
        id: pdfInfo.lastInsertRowid,
        passagesCreated: passages.length,
        extractedTextLength: extractedText.trim().length,
        warning: passages.length === 0
          ? 'PDF uploaded, but no selectable passages were extracted. This usually happens with scanned/image PDFs. Add passages manually from Manage Passages.'
          : ''
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/pdfs', (req, res) => {
    const pdfs = db.prepare(`
      SELECT p.*, e.name AS exam_name, COUNT(pa.id) AS passage_count
      FROM pdfs p
      LEFT JOIN exams e ON e.id = p.exam_id
      LEFT JOIN passages pa ON pa.pdf_id = p.id
      GROUP BY p.id
      ORDER BY p.upload_date DESC
    `).all();
    res.json({ pdfs });
  });

  router.delete('/pdfs/:id', (req, res) => {
    const pdf = db.prepare('SELECT * FROM pdfs WHERE id = ?').get(req.params.id);
    if (pdf) {
      const filePath = path.resolve('uploads', pdf.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    db.prepare('DELETE FROM pdfs WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  router.get('/passages', (req, res) => {
    const passages = db.prepare(`
      SELECT pa.*, e.name AS exam_name, p.title AS pdf_title
      FROM passages pa
      LEFT JOIN exams e ON e.id = pa.exam_id
      LEFT JOIN pdfs p ON p.id = pa.pdf_id
      ORDER BY pa.created_at DESC
    `).all();
    res.json({ passages });
  });

  router.post('/passages', (req, res) => {
    const { examId, pdfId, passageNumber, title, content } = req.body;
    if (!examId || !String(content || '').trim()) return res.status(400).json({ error: 'Exam and passage content are required' });
    const info = db.prepare('INSERT INTO passages (pdf_id, exam_id, passage_number, title, content) VALUES (?, ?, ?, ?, ?)')
      .run(pdfId || null, examId, passageNumber || 1, title || `Passage ${passageNumber || 1}`, content.trim());
    res.json({ id: info.lastInsertRowid });
  });

  router.put('/passages/:id', (req, res) => {
    const { pdfId, passageNumber, title, content } = req.body;
    if (!pdfId) return res.status(400).json({ error: 'PDF is required so students can access this passage' });
    if (!String(content || '').trim()) return res.status(400).json({ error: 'Passage content is required' });
    db.prepare('UPDATE passages SET pdf_id = ?, passage_number = ?, title = ?, content = ? WHERE id = ?')
      .run(pdfId, passageNumber || 1, title || `Passage ${passageNumber || 1}`, content.trim(), req.params.id);
    res.json({ ok: true });
  });

  router.delete('/passages/:id', (req, res) => {
    db.prepare('DELETE FROM passages WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  return router;
}
