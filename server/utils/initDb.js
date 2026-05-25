import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const SAMPLE_PASSAGE = 'The landmark judgment of Kesavananda Bharati v. State of Kerala (1973) 4 SCC 225 remains the most significant judicial pronouncement in the history of Indian constitutional law as it established the "Basic Structure" doctrine which serves as a shield against the misuse of legislative power. This case was heard by the largest ever bench of thirteen judges who deliberated for sixty-eight days to determine the extent of the';

export function initDb() {
  const databaseDir = path.resolve('database');
  fs.mkdirSync(databaseDir, { recursive: true });
  const db = new Database(path.join(databaseDir, 'app.db'));
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pdfs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_filename TEXT,
      file_size INTEGER,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS passages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pdf_id INTEGER,
      exam_id INTEGER,
      passage_number INTEGER,
      title TEXT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(pdf_id) REFERENCES pdfs(id) ON DELETE CASCADE,
      FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_sessions (
      token TEXT PRIMARY KEY,
      student_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS test_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      exam_id INTEGER,
      pdf_id INTEGER,
      passage_id INTEGER,
      typed_text TEXT,
      original_text TEXT,
      highlighted_original TEXT,
      highlighted_typed TEXT,
      duration_seconds INTEGER,
      duration_formatted TEXT,
      keystrokes INTEGER,
      backspaces INTEGER,
      total_words_typed REAL,
      gross_wpm REAL,
      net_wpm REAL,
      accuracy REAL,
      error_percentage REAL,
      additions INTEGER,
      omissions INTEGER,
      spelling_substitution_repetition INTEGER,
      incomplete_words INTEGER,
      spacing_errors INTEGER,
      capitalization_errors INTEGER,
      punctuation_errors INTEGER,
      transposition_errors INTEGER,
      paragraphic_errors INTEGER,
      tab_errors INTEGER,
      full_errors INTEGER,
      half_errors INTEGER,
      total_errors REAL,
      marks REAL,
      qualified INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE SET NULL
    );
  `);

  const columns = db.prepare('PRAGMA table_info(test_results)').all().map((column) => column.name);
  if (!columns.includes('student_id')) {
    db.prepare('ALTER TABLE test_results ADD COLUMN student_id INTEGER').run();
  }

  const examCount = db.prepare('SELECT COUNT(*) AS count FROM exams').get().count;
  if (examCount === 0) {
    const exam = db.prepare('INSERT INTO exams (name) VALUES (?)').run('Bombay High Court Clerk Typing');
    const pdf = db.prepare('INSERT INTO pdfs (exam_id, title, filename, original_filename, file_size) VALUES (?, ?, ?, ?, ?)')
      .run(exam.lastInsertRowid, 'Bombay High Court Typing Sample', 'sample-passage.pdf', 'sample-passage.pdf', 0);
    db.prepare('INSERT INTO passages (pdf_id, exam_id, passage_number, title, content) VALUES (?, ?, ?, ?, ?)')
      .run(pdf.lastInsertRowid, exam.lastInsertRowid, 1, 'Sample Passage 1', SAMPLE_PASSAGE);
  }

  return db;
}
