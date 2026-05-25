import Database from 'better-sqlite3';
import pg from 'pg';
import { initDb } from './initDb.js';

const { Pool } = pg;

const SAMPLE_PASSAGE = 'The landmark judgment of Kesavananda Bharati v. State of Kerala (1973) 4 SCC 225 remains the most significant judicial pronouncement in the history of Indian constitutional law as it established the "Basic Structure" doctrine which serves as a shield against the misuse of legislative power. This case was heard by the largest ever bench of thirteen judges who deliberated for sixty-eight days to determine the extent of the';

function rowId(info) {
  return info.lastInsertRowid;
}

function normalizeBool(value) {
  return value === true || value === 1 || value === '1';
}

class SqliteStore {
  constructor() {
    this.db = initDb();
  }

  listExams() {
    return this.db.prepare(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM pdfs p WHERE p.exam_id = e.id) AS pdf_count,
        (SELECT COUNT(*) FROM passages pa WHERE pa.exam_id = e.id) AS passage_count
      FROM exams e ORDER BY e.created_at DESC
    `).all();
  }

  stats() {
    return {
      exams: this.db.prepare('SELECT COUNT(*) AS count FROM exams').get().count,
      pdfs: this.db.prepare('SELECT COUNT(*) AS count FROM pdfs').get().count,
      passages: this.db.prepare('SELECT COUNT(*) AS count FROM passages').get().count,
      tests: this.db.prepare('SELECT COUNT(*) AS count FROM test_results').get().count
    };
  }

  pdfsByExam(examId) {
    return this.db.prepare(`
      SELECT p.*, COUNT(pa.id) AS passage_count
      FROM pdfs p
      LEFT JOIN passages pa ON pa.pdf_id = p.id
      WHERE p.exam_id = ?
      GROUP BY p.id
      ORDER BY p.upload_date DESC
    `).all(examId);
  }

  getPdf(id) { return this.db.prepare('SELECT * FROM pdfs WHERE id = ?').get(id); }
  passagesByPdf(pdfId) { return this.db.prepare('SELECT id, pdf_id, exam_id, passage_number, title, content FROM passages WHERE pdf_id = ? ORDER BY passage_number').all(pdfId); }
  getPassage(id) {
    return this.db.prepare(`
      SELECT pa.*, p.title AS pdf_title, e.name AS exam_name
      FROM passages pa
      LEFT JOIN pdfs p ON p.id = pa.pdf_id
      LEFT JOIN exams e ON e.id = pa.exam_id
      WHERE pa.id = ?
    `).get(id);
  }

  createStudent({ name, email, passwordHash }) {
    const info = this.db.prepare('INSERT INTO students (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, passwordHash);
    return { id: Number(info.lastInsertRowid), name, email };
  }

  getStudentByEmail(email) { return this.db.prepare('SELECT id, name, email, password_hash FROM students WHERE email = ?').get(email); }
  getStudentById(id) { return this.db.prepare('SELECT id, name, email FROM students WHERE id = ?').get(id); }

  historyForStudent(studentId) {
    return this.db.prepare(`
      SELECT tr.id, tr.net_wpm AS wpm, tr.backspaces, tr.accuracy, tr.marks, tr.qualified,
             tr.created_at, e.name AS exam_name, p.title AS pdf_title, pa.passage_number
      FROM test_results tr
      LEFT JOIN exams e ON e.id = tr.exam_id
      LEFT JOIN pdfs p ON p.id = tr.pdf_id
      LEFT JOIN passages pa ON pa.id = tr.passage_id
      WHERE tr.student_id = ?
      ORDER BY tr.created_at DESC
    `).all(studentId);
  }

  createResult(row) {
    const info = this.db.prepare(`
      INSERT INTO test_results (
        student_id, exam_id, pdf_id, passage_id, typed_text, original_text, highlighted_original, highlighted_typed,
        duration_seconds, duration_formatted, keystrokes, backspaces, total_words_typed, gross_wpm, net_wpm,
        accuracy, error_percentage, additions, omissions, spelling_substitution_repetition, incomplete_words,
        spacing_errors, capitalization_errors, punctuation_errors, transposition_errors, paragraphic_errors,
        tab_errors, full_errors, half_errors, total_errors, marks, qualified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(...row);
    return Number(info.lastInsertRowid);
  }

  getResult(id) {
    return this.db.prepare(`
      SELECT tr.*, e.name AS exam_name, p.title AS pdf_title, pa.title AS passage_title, pa.passage_number
      FROM test_results tr
      LEFT JOIN exams e ON e.id = tr.exam_id
      LEFT JOIN pdfs p ON p.id = tr.pdf_id
      LEFT JOIN passages pa ON pa.id = tr.passage_id
      WHERE tr.id = ?
    `).get(id);
  }

  adminExams() { return this.db.prepare('SELECT * FROM exams ORDER BY created_at DESC').all(); }
  createExam(name) { return Number(this.db.prepare('INSERT INTO exams (name) VALUES (?)').run(name).lastInsertRowid); }
  deleteExam(id) { this.db.prepare('DELETE FROM exams WHERE id = ?').run(id); }
  createPdf({ examId, title, filename, originalFilename, fileSize }) {
    return Number(this.db.prepare('INSERT INTO pdfs (exam_id, title, filename, original_filename, file_size) VALUES (?, ?, ?, ?, ?)').run(examId, title, filename, originalFilename, fileSize).lastInsertRowid);
  }
  createPassages(passages) {
    const insert = this.db.prepare('INSERT INTO passages (pdf_id, exam_id, passage_number, title, content) VALUES (?, ?, ?, ?, ?)');
    for (const p of passages) insert.run(p.pdfId || null, p.examId, p.passageNumber, p.title, p.content);
  }
  adminPdfs() {
    return this.db.prepare(`
      SELECT p.*, e.name AS exam_name, COUNT(pa.id) AS passage_count
      FROM pdfs p
      LEFT JOIN exams e ON e.id = p.exam_id
      LEFT JOIN passages pa ON pa.pdf_id = p.id
      GROUP BY p.id
      ORDER BY p.upload_date DESC
    `).all();
  }
  deletePdf(id) { this.db.prepare('DELETE FROM pdfs WHERE id = ?').run(id); }
  adminPassages() {
    return this.db.prepare(`
      SELECT pa.*, e.name AS exam_name, p.title AS pdf_title
      FROM passages pa
      LEFT JOIN exams e ON e.id = pa.exam_id
      LEFT JOIN pdfs p ON p.id = pa.pdf_id
      ORDER BY pa.created_at DESC
    `).all();
  }
  createPassage({ examId, pdfId, passageNumber, title, content }) {
    return Number(this.db.prepare('INSERT INTO passages (pdf_id, exam_id, passage_number, title, content) VALUES (?, ?, ?, ?, ?)').run(pdfId || null, examId, passageNumber || 1, title || `Passage ${passageNumber || 1}`, content.trim()).lastInsertRowid);
  }
  updatePassage(id, { pdfId, passageNumber, title, content }) {
    this.db.prepare('UPDATE passages SET pdf_id = ?, passage_number = ?, title = ?, content = ? WHERE id = ?').run(pdfId, passageNumber || 1, title || `Passage ${passageNumber || 1}`, content.trim(), id);
  }
  deletePassage(id) { this.db.prepare('DELETE FROM passages WHERE id = ?').run(id); }
}

class PostgresStore {
  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    this.ready = this.ensureSeed();
  }

  async ensureSeed() {
    await this.pool.query(
      "INSERT INTO exams (name) SELECT $1 WHERE NOT EXISTS (SELECT 1 FROM exams WHERE name = $1)",
      ["Bombay High Court Clerk Typing"]
    );

    const pdfCount = await this.pool.query("SELECT COUNT(*)::int AS count FROM pdfs");
    if (pdfCount.rows[0].count > 0) return;

    const exam = await this.pool.query(
      "SELECT id FROM exams WHERE name = $1 ORDER BY id LIMIT 1",
      ["Bombay High Court Clerk Typing"]
    );
    const examId = exam.rows[0].id;
    const pdf = await this.pool.query(
      "INSERT INTO pdfs (exam_id, title, storage_path, original_filename, file_size) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [examId, "Bombay High Court Typing Sample", "sample-passage.pdf", "sample-passage.pdf", 0]
    );
    await this.pool.query(
      "INSERT INTO passages (pdf_id, exam_id, passage_number, title, content, is_free) VALUES ($1, $2, $3, $4, $5, true)",
      [pdf.rows[0].id, examId, 1, "Sample Passage 1", SAMPLE_PASSAGE]
    );
  }

  async q(sql, params = []) {
    await this.ready;
    return this.pool.query(sql, params);
  }
  async listExams() {
    const { rows } = await this.q(`
      SELECT e.*, 
        (SELECT COUNT(*)::int FROM pdfs p WHERE p.exam_id = e.id) AS pdf_count,
        (SELECT COUNT(*)::int FROM passages pa WHERE pa.exam_id = e.id) AS passage_count
      FROM exams e ORDER BY e.created_at DESC
    `);
    return rows;
  }
  async stats() {
    const { rows } = await this.q(`SELECT
      (SELECT COUNT(*)::int FROM exams) AS exams,
      (SELECT COUNT(*)::int FROM pdfs) AS pdfs,
      (SELECT COUNT(*)::int FROM passages) AS passages,
      (SELECT COUNT(*)::int FROM test_results) AS tests`);
    return rows[0];
  }
  async pdfsByExam(examId) {
    const { rows } = await this.q(`
      SELECT p.id, p.exam_id, p.title, p.storage_path AS filename, p.original_filename, p.file_size, p.upload_date, COUNT(pa.id)::int AS passage_count
      FROM pdfs p LEFT JOIN passages pa ON pa.pdf_id = p.id
      WHERE p.exam_id = $1 GROUP BY p.id ORDER BY p.upload_date DESC
    `, [examId]);
    return rows;
  }
  async getPdf(id) { const { rows } = await this.q('SELECT id, exam_id, title, storage_path AS filename, original_filename, file_size, upload_date FROM pdfs WHERE id = $1', [id]); return rows[0]; }
  async passagesByPdf(pdfId) { const { rows } = await this.q('SELECT id, pdf_id, exam_id, passage_number, title, content FROM passages WHERE pdf_id = $1 ORDER BY passage_number', [pdfId]); return rows; }
  async getPassage(id) { const { rows } = await this.q(`SELECT pa.*, p.title AS pdf_title, e.name AS exam_name FROM passages pa LEFT JOIN pdfs p ON p.id = pa.pdf_id LEFT JOIN exams e ON e.id = pa.exam_id WHERE pa.id = $1`, [id]); return rows[0]; }
  async createStudent({ name, email, passwordHash }) { const { rows } = await this.q('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email', [name, email, passwordHash, 'student']); return rows[0]; }
  async getStudentByEmail(email) { const { rows } = await this.q("SELECT id, name, email, password_hash FROM users WHERE email = $1 AND role = 'student'", [email]); return rows[0]; }
  async getStudentById(id) { const { rows } = await this.q("SELECT id, name, email FROM users WHERE id = $1 AND role = 'student'", [id]); return rows[0]; }
  async historyForStudent(studentId) { const { rows } = await this.q(`SELECT tr.id, tr.net_wpm AS wpm, tr.backspaces, tr.accuracy, tr.marks, tr.qualified, tr.created_at, e.name AS exam_name, p.title AS pdf_title, pa.passage_number FROM test_results tr LEFT JOIN exams e ON e.id = tr.exam_id LEFT JOIN pdfs p ON p.id = tr.pdf_id LEFT JOIN passages pa ON pa.id = tr.passage_id WHERE tr.user_id = $1 ORDER BY tr.created_at DESC`, [studentId]); return rows; }
  async createResult(row) { const pgRow = [...row]; const studentId = pgRow.shift(); const { rows } = await this.q(`INSERT INTO test_results (user_id, exam_id, pdf_id, passage_id, typed_text, original_text, highlighted_original, highlighted_typed, duration_seconds, duration_formatted, keystrokes, backspaces, total_words_typed, gross_wpm, net_wpm, accuracy, error_percentage, additions, omissions, spelling_substitution_repetition, incomplete_words, spacing_errors, capitalization_errors, punctuation_errors, transposition_errors, paragraphic_errors, tab_errors, full_errors, half_errors, total_errors, marks, qualified) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32) RETURNING id`, [studentId, ...pgRow]); return rows[0].id; }
  async getResult(id) { const { rows } = await this.q(`SELECT tr.*, e.name AS exam_name, p.title AS pdf_title, pa.title AS passage_title, pa.passage_number FROM test_results tr LEFT JOIN exams e ON e.id = tr.exam_id LEFT JOIN pdfs p ON p.id = tr.pdf_id LEFT JOIN passages pa ON pa.id = tr.passage_id WHERE tr.id = $1`, [id]); return rows[0]; }
  async adminExams() { const { rows } = await this.q('SELECT * FROM exams ORDER BY created_at DESC'); return rows; }
  async createExam(name) { const { rows } = await this.q('INSERT INTO exams (name) VALUES ($1) RETURNING id', [name]); return rows[0].id; }
  async deleteExam(id) { await this.q('DELETE FROM exams WHERE id = $1', [id]); }
  async createPdf({ examId, title, filename, originalFilename, fileSize }) { const { rows } = await this.q('INSERT INTO pdfs (exam_id, title, storage_path, original_filename, file_size) VALUES ($1, $2, $3, $4, $5) RETURNING id', [examId, title, filename, originalFilename, fileSize]); return rows[0].id; }
  async createPassages(passages) { for (const p of passages) await this.createPassage(p); }
  async adminPdfs() { const { rows } = await this.q(`SELECT p.id, p.exam_id, p.title, p.storage_path AS filename, p.original_filename, p.file_size, p.upload_date, e.name AS exam_name, COUNT(pa.id)::int AS passage_count FROM pdfs p LEFT JOIN exams e ON e.id = p.exam_id LEFT JOIN passages pa ON pa.pdf_id = p.id GROUP BY p.id, e.name ORDER BY p.upload_date DESC`); return rows; }
  async deletePdf(id) { await this.q('DELETE FROM pdfs WHERE id = $1', [id]); }
  async adminPassages() { const { rows } = await this.q(`SELECT pa.*, e.name AS exam_name, p.title AS pdf_title FROM passages pa LEFT JOIN exams e ON e.id = pa.exam_id LEFT JOIN pdfs p ON p.id = pa.pdf_id ORDER BY pa.created_at DESC`); return rows; }
  async createPassage({ examId, pdfId, passageNumber, title, content }) { const { rows } = await this.q('INSERT INTO passages (pdf_id, exam_id, passage_number, title, content) VALUES ($1, $2, $3, $4, $5) RETURNING id', [pdfId || null, examId, passageNumber || 1, title || `Passage ${passageNumber || 1}`, content.trim()]); return rows[0].id; }
  async updatePassage(id, { pdfId, passageNumber, title, content }) { await this.q('UPDATE passages SET pdf_id = $1, passage_number = $2, title = $3, content = $4 WHERE id = $5', [pdfId, passageNumber || 1, title || `Passage ${passageNumber || 1}`, content.trim(), id]); }
  async deletePassage(id) { await this.q('DELETE FROM passages WHERE id = $1', [id]); }
}

export function createStore() {
  if (process.env.DATA_PROVIDER === 'postgres' || (process.env.DATABASE_URL && process.env.NODE_ENV === 'production')) {
    return new PostgresStore();
  }
  return new SqliteStore();
}
