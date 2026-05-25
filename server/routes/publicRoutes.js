import express from 'express';
import fs from 'fs';
import path from 'path';
import { calculateTypingResult } from '../utils/typingCalculator.js';
import { comparePassword, hashPassword, signToken, tokenFromRequest, verifyToken } from '../utils/auth.js';


function getStudentFromRequest(db, req) {
  const decoded = verifyToken(tokenFromRequest(req));
  if (!decoded || decoded.role !== 'student') return null;
  return db.prepare('SELECT id, name, email FROM students WHERE id = ?').get(decoded.sub);
}

function requireStudent(db, req, res) {
  const student = getStudentFromRequest(db, req);
  if (!student) {
    res.status(401).json({ error: 'Student login required' });
    return null;
  }
  return student;
}

export function publicRoutes(db) {
  const router = express.Router();

  router.post('/students/register', (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || !email || password.length < 4) {
      return res.status(400).json({ error: 'Name, email, and password with at least 4 characters are required' });
    }
    try {
      const info = db.prepare('INSERT INTO students (name, email, password_hash) VALUES (?, ?, ?)')
        .run(name, email, hashPassword(password));
      const token = signToken({ sub: info.lastInsertRowid, role: 'student' });
      return res.json({ token, student: { id: info.lastInsertRowid, name, email } });
    } catch (error) {
      return res.status(400).json({ error: 'Email is already registered' });
    }
  });

  router.post('/students/login', (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const student = db.prepare('SELECT id, name, email, password_hash FROM students WHERE email = ?').get(email);
    if (!student || !comparePassword(password, student.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken({ sub: student.id, role: 'student' });
    return res.json({ token, student: { id: student.id, name: student.name, email: student.email } });
  });

  router.post('/students/logout', (req, res) => {
    res.json({ ok: true });
  });

  router.get('/students/me', (req, res) => {
    const student = getStudentFromRequest(db, req);
    if (!student) return res.status(401).json({ error: 'Student login required' });
    return res.json({ student });
  });

  router.get('/students/history', (req, res) => {
    const student = requireStudent(db, req, res);
    if (!student) return;
    const history = db.prepare(`
      SELECT tr.id, tr.net_wpm AS wpm, tr.backspaces, tr.accuracy, tr.marks, tr.qualified,
             tr.created_at, e.name AS exam_name, p.title AS pdf_title, pa.passage_number
      FROM test_results tr
      LEFT JOIN exams e ON e.id = tr.exam_id
      LEFT JOIN pdfs p ON p.id = tr.pdf_id
      LEFT JOIN passages pa ON pa.id = tr.passage_id
      WHERE tr.student_id = ?
      ORDER BY tr.created_at DESC
    `).all(student.id);
    res.json({ history });
  });

  router.get('/exams', (req, res) => {
    const exams = db.prepare(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM pdfs p WHERE p.exam_id = e.id) AS pdf_count,
        (SELECT COUNT(*) FROM passages pa WHERE pa.exam_id = e.id) AS passage_count
      FROM exams e ORDER BY e.created_at DESC
    `).all();
    res.json({ exams });
  });

  router.get('/stats', (req, res) => {
    const exams = db.prepare('SELECT COUNT(*) AS count FROM exams').get().count;
    const pdfs = db.prepare('SELECT COUNT(*) AS count FROM pdfs').get().count;
    const passages = db.prepare('SELECT COUNT(*) AS count FROM passages').get().count;
    const tests = db.prepare('SELECT COUNT(*) AS count FROM test_results').get().count;
    res.json({ exams, pdfs, passages, tests });
  });

  router.get('/exams/:id/pdfs', (req, res) => {
    const pdfs = db.prepare(`
      SELECT p.*, COUNT(pa.id) AS passage_count
      FROM pdfs p
      LEFT JOIN passages pa ON pa.pdf_id = p.id
      WHERE p.exam_id = ?
      GROUP BY p.id
      ORDER BY p.upload_date DESC
    `).all(req.params.id);
    res.json({ pdfs });
  });

  router.get('/pdfs/:id/download', (req, res) => {
    const pdf = db.prepare('SELECT * FROM pdfs WHERE id = ?').get(req.params.id);
    if (!pdf) return res.status(404).json({ error: 'PDF not found' });
    const uploadPath = path.resolve('uploads', pdf.filename);
    const seedPath = path.resolve('seed-pdfs', pdf.filename);
    const filePath = fs.existsSync(uploadPath) ? uploadPath : seedPath;
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'PDF file is missing on server' });
    return res.download(filePath, pdf.original_filename || pdf.filename);
  });

  router.get('/pdfs/:id/passages', (req, res) => {
    const passages = db.prepare('SELECT id, pdf_id, exam_id, passage_number, title, content FROM passages WHERE pdf_id = ? ORDER BY passage_number').all(req.params.id);
    res.json({ passages });
  });

  router.get('/passages/:id', (req, res) => {
    const passage = db.prepare(`
      SELECT pa.*, p.title AS pdf_title, e.name AS exam_name
      FROM passages pa
      LEFT JOIN pdfs p ON p.id = pa.pdf_id
      LEFT JOIN exams e ON e.id = pa.exam_id
      WHERE pa.id = ?
    `).get(req.params.id);
    if (!passage) return res.status(404).json({ error: 'Passage not found' });
    return res.json({ passage });
  });

  router.post('/results', (req, res) => {
    const student = requireStudent(db, req, res);
    if (!student) return;
    const { examId, pdfId, passageId, typedText, originalText, durationSeconds, backspaceCount, keystrokes } = req.body;
    if (!originalText || !String(typedText || '').trim()) {
      return res.status(400).json({ error: 'Original and typed text are required' });
    }

    const result = calculateTypingResult({ originalText, typedText, durationSeconds, backspaceCount, keystrokes });
    const info = db.prepare(`
      INSERT INTO test_results (
        student_id, exam_id, pdf_id, passage_id, typed_text, original_text, highlighted_original, highlighted_typed,
        duration_seconds, duration_formatted, keystrokes, backspaces, total_words_typed, gross_wpm, net_wpm,
        accuracy, error_percentage, additions, omissions, spelling_substitution_repetition, incomplete_words,
        spacing_errors, capitalization_errors, punctuation_errors, transposition_errors, paragraphic_errors,
        tab_errors, full_errors, half_errors, total_errors, marks, qualified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
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
      result.qualified ? 1 : 0
    );

    res.json({ id: info.lastInsertRowid, result });
  });

  router.get('/results/:id', (req, res) => {
    const row = db.prepare(`
      SELECT tr.*, e.name AS exam_name, p.title AS pdf_title, pa.title AS passage_title, pa.passage_number
      FROM test_results tr
      LEFT JOIN exams e ON e.id = tr.exam_id
      LEFT JOIN pdfs p ON p.id = tr.pdf_id
      LEFT JOIN passages pa ON pa.id = tr.passage_id
      WHERE tr.id = ?
    `).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Result not found' });
    return res.json({ result: row });
  });

  return router;
}
