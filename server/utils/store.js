import pg from 'pg';

const { Pool } = pg;

const DEFAULT_EXAM = 'Bombay High Court Clerk Typing';

export class PostgresStore {
  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required. This backend is configured for online PostgreSQL only.');
    }
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    this.ready = this.ensureSchemaAndSeed();
  }

  async ensureSchemaAndSeed() {
    await this.pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
        subscription_status text NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'blocked')),
        subscription_type text,
        paid_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS exams (
        id bigserial PRIMARY KEY,
        name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS pdfs (
        id bigserial PRIMARY KEY,
        exam_id bigint REFERENCES exams(id) ON DELETE CASCADE,
        title text NOT NULL,
        storage_path text NOT NULL,
        original_filename text,
        file_size bigint,
        upload_date timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS passages (
        id bigserial PRIMARY KEY,
        pdf_id bigint REFERENCES pdfs(id) ON DELETE CASCADE,
        exam_id bigint REFERENCES exams(id) ON DELETE CASCADE,
        passage_number integer NOT NULL,
        title text,
        content text NOT NULL,
        is_free boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS test_results (
        id bigserial PRIMARY KEY,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        exam_id bigint REFERENCES exams(id) ON DELETE SET NULL,
        pdf_id bigint REFERENCES pdfs(id) ON DELETE SET NULL,
        passage_id bigint REFERENCES passages(id) ON DELETE SET NULL,
        typed_text text,
        original_text text,
        highlighted_original text,
        highlighted_typed text,
        duration_seconds integer,
        duration_formatted text,
        keystrokes integer,
        backspaces integer,
        total_words_typed numeric,
        gross_wpm numeric,
        net_wpm numeric,
        accuracy numeric,
        error_percentage numeric,
        additions integer,
        omissions integer,
        spelling_substitution_repetition integer,
        incomplete_words integer,
        spacing_errors integer,
        capitalization_errors integer,
        punctuation_errors integer,
        transposition_errors integer,
        paragraphic_errors integer,
        tab_errors integer,
        full_errors integer,
        half_errors integer,
        total_errors numeric,
        marks numeric,
        qualified boolean,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS coupons (
        id bigserial PRIMARY KEY,
        code text NOT NULL UNIQUE,
        discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
        discount_value numeric NOT NULL,
        usage_limit integer,
        used_count integer NOT NULL DEFAULT 0,
        active boolean NOT NULL DEFAULT true,
        expires_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id bigserial PRIMARY KEY,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        coupon_id bigint REFERENCES coupons(id) ON DELETE SET NULL,
        razorpay_order_id text,
        razorpay_payment_id text,
        razorpay_signature text,
        amount integer NOT NULL,
        currency text NOT NULL DEFAULT 'INR',
        status text NOT NULL DEFAULT 'created',
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_passages_pdf_id ON passages(pdf_id);
      CREATE INDEX IF NOT EXISTS idx_results_user_id ON test_results(user_id);
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
    `);

    await this.pool.query(
      'INSERT INTO exams (name) SELECT $1 WHERE NOT EXISTS (SELECT 1 FROM exams WHERE name = $1)',
      [DEFAULT_EXAM]
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
      SELECT p.id, p.exam_id, p.title, p.storage_path AS filename, p.original_filename, p.file_size,
             p.upload_date, COUNT(pa.id)::int AS passage_count
      FROM pdfs p
      LEFT JOIN passages pa ON pa.pdf_id = p.id
      WHERE p.exam_id = $1
      GROUP BY p.id
      ORDER BY p.upload_date DESC
    `, [examId]);
    return rows;
  }

  async getPdf(id) {
    const { rows } = await this.q(
      'SELECT id, exam_id, title, storage_path AS filename, original_filename, file_size, upload_date FROM pdfs WHERE id = $1',
      [id]
    );
    return rows[0];
  }

  async passagesByPdf(pdfId) {
    const { rows } = await this.q('SELECT id, pdf_id, exam_id, passage_number, title, content FROM passages WHERE pdf_id = $1 ORDER BY passage_number', [pdfId]);
    return rows;
  }

  async getPassage(id) {
    const { rows } = await this.q(`
      SELECT pa.*, p.title AS pdf_title, e.name AS exam_name
      FROM passages pa
      LEFT JOIN pdfs p ON p.id = pa.pdf_id
      LEFT JOIN exams e ON e.id = pa.exam_id
      WHERE pa.id = $1
    `, [id]);
    return rows[0];
  }

  async createStudent({ name, email, passwordHash }) {
    const { rows } = await this.q(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
      [name, email, passwordHash, 'student']
    );
    return rows[0];
  }

  async getStudentByEmail(email) {
    const { rows } = await this.q("SELECT id, name, email, password_hash FROM users WHERE email = $1 AND role = 'student'", [email]);
    return rows[0];
  }

  async getStudentById(id) {
    const { rows } = await this.q("SELECT id, name, email FROM users WHERE id = $1 AND role = 'student'", [id]);
    return rows[0];
  }

  async historyForStudent(studentId) {
    const { rows } = await this.q(`
      SELECT tr.id, tr.net_wpm AS wpm, tr.backspaces, tr.accuracy, tr.marks, tr.qualified,
             tr.created_at, e.name AS exam_name, p.title AS pdf_title, pa.passage_number
      FROM test_results tr
      LEFT JOIN exams e ON e.id = tr.exam_id
      LEFT JOIN pdfs p ON p.id = tr.pdf_id
      LEFT JOIN passages pa ON pa.id = tr.passage_id
      WHERE tr.user_id = $1
      ORDER BY tr.created_at DESC
    `, [studentId]);
    return rows;
  }

  async createResult(row) {
    const pgRow = [...row];
    const studentId = pgRow.shift();
    const { rows } = await this.q(`
      INSERT INTO test_results (
        user_id, exam_id, pdf_id, passage_id, typed_text, original_text, highlighted_original, highlighted_typed,
        duration_seconds, duration_formatted, keystrokes, backspaces, total_words_typed, gross_wpm, net_wpm,
        accuracy, error_percentage, additions, omissions, spelling_substitution_repetition, incomplete_words,
        spacing_errors, capitalization_errors, punctuation_errors, transposition_errors, paragraphic_errors,
        tab_errors, full_errors, half_errors, total_errors, marks, qualified
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)
      RETURNING id
    `, [studentId, ...pgRow]);
    return rows[0].id;
  }

  async getResult(id) {
    const { rows } = await this.q(`
      SELECT tr.*, e.name AS exam_name, p.title AS pdf_title, pa.title AS passage_title, pa.passage_number
      FROM test_results tr
      LEFT JOIN exams e ON e.id = tr.exam_id
      LEFT JOIN pdfs p ON p.id = tr.pdf_id
      LEFT JOIN passages pa ON pa.id = tr.passage_id
      WHERE tr.id = $1
    `, [id]);
    return rows[0];
  }

  async adminExams() {
    const { rows } = await this.q('SELECT * FROM exams ORDER BY created_at DESC');
    return rows;
  }

  async createExam(name) {
    const { rows } = await this.q('INSERT INTO exams (name) VALUES ($1) RETURNING id', [name]);
    return rows[0].id;
  }

  async deleteExam(id) { await this.q('DELETE FROM exams WHERE id = $1', [id]); }

  async createPdf({ examId, title, storagePath, originalFilename, fileSize }) {
    const { rows } = await this.q(
      'INSERT INTO pdfs (exam_id, title, storage_path, original_filename, file_size) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [examId, title, storagePath, originalFilename, fileSize]
    );
    return rows[0].id;
  }

  async createPassages(passages) {
    for (const p of passages) await this.createPassage(p);
  }

  async adminPdfs() {
    const { rows } = await this.q(`
      SELECT p.id, p.exam_id, p.title, p.storage_path AS filename, p.original_filename, p.file_size,
             p.upload_date, e.name AS exam_name, COUNT(pa.id)::int AS passage_count
      FROM pdfs p
      LEFT JOIN exams e ON e.id = p.exam_id
      LEFT JOIN passages pa ON pa.pdf_id = p.id
      GROUP BY p.id, e.name
      ORDER BY p.upload_date DESC
    `);
    return rows;
  }

  async deletePdf(id) { await this.q('DELETE FROM pdfs WHERE id = $1', [id]); }

  async adminPassages() {
    const { rows } = await this.q(`
      SELECT pa.*, e.name AS exam_name, p.title AS pdf_title
      FROM passages pa
      LEFT JOIN exams e ON e.id = pa.exam_id
      LEFT JOIN pdfs p ON p.id = pa.pdf_id
      ORDER BY pa.created_at DESC
    `);
    return rows;
  }

  async createPassage({ examId, pdfId, passageNumber, title, content }) {
    const number = Number(passageNumber) || 1;
    const { rows } = await this.q(
      'INSERT INTO passages (pdf_id, exam_id, passage_number, title, content) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [pdfId || null, examId, number, title || `Passage ${number}`, content.trim()]
    );
    return rows[0].id;
  }

  async updatePassage(id, { pdfId, passageNumber, title, content }) {
    const number = Number(passageNumber) || 1;
    await this.q(
      'UPDATE passages SET pdf_id = $1, passage_number = $2, title = $3, content = $4 WHERE id = $5',
      [pdfId, number, title || `Passage ${number}`, content.trim(), id]
    );
  }

  async deletePassage(id) { await this.q('DELETE FROM passages WHERE id = $1', [id]); }
}

export function createStore() {
  return new PostgresStore();
}
