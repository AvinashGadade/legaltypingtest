import express from 'express';
import fs from 'fs';
import path from 'path';
import { calculateTypingResult } from '../utils/typingCalculator.js';
import { comparePassword, hashPassword, signToken, tokenFromRequest, verifyToken } from '../utils/auth.js';

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
    return res.json({ token, student: { id: student.id, name: student.name, email: student.email } });
  });

  router.post('/students/logout', (req, res) => res.json({ ok: true }));

  router.get('/students/me', async (req, res) => {
    const student = await getStudentFromRequest(store, req);
    if (!student) return res.status(401).json({ error: 'Student login required' });
    return res.json({ student });
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
    const pdf = await store.getPdf(req.params.id);
    if (!pdf) return res.status(404).json({ error: 'PDF not found' });
    const uploadPath = path.resolve('uploads', pdf.filename);
    const seedPath = path.resolve('seed-pdfs', pdf.filename);
    const filePath = fs.existsSync(uploadPath) ? uploadPath : seedPath;
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'PDF file is missing on server' });
    return res.download(filePath, pdf.original_filename || pdf.filename);
  });

  router.get('/pdfs/:id/passages', async (req, res) => res.json({ passages: await store.passagesByPdf(req.params.id) }));

  router.get('/passages/:id', async (req, res) => {
    const passage = await store.getPassage(req.params.id);
    if (!passage) return res.status(404).json({ error: 'Passage not found' });
    return res.json({ passage });
  });

  router.post('/results', async (req, res) => {
    const student = await requireStudent(store, req, res);
    if (!student) return;
    const { examId, pdfId, passageId, typedText, originalText, durationSeconds, backspaceCount, keystrokes } = req.body;
    if (!originalText || !String(typedText || '').trim()) return res.status(400).json({ error: 'Original and typed text are required' });

    const result = calculateTypingResult({ originalText, typedText, durationSeconds, backspaceCount, keystrokes });
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
    res.json({ id, result });
  });

  router.get('/results/:id', async (req, res) => {
    const result = await store.getResult(req.params.id);
    if (!result) return res.status(404).json({ error: 'Result not found' });
    return res.json({ result });
  });

  return router;
}
