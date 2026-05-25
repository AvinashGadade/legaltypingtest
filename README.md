# Bombay High Court Clerk Typing Practice & Evaluation System

A local full-stack web app for Bombay High Court Clerk typing practice. Students can download passages, select a passage, take a timed typing test, and view detailed WPM, accuracy, marks, qualification, and error analysis. Admins can upload PDFs, extract passages, and manage passage text.

## Features

- Student dashboard with exam, PDF, passage, and practice-test statistics
- Download uploaded passage PDFs
- Passage selection by exam, PDF, and passage number
- 5/10/15 minute typing tests
- Timer starts on first typed character
- Auto-submit when time ends
- Backspace and keystroke tracking
- Copy/paste and right-click disabled in typing box
- Full result page with Gross WPM, Net WPM, accuracy, marks, qualification, and formulas
- Word-level and character-aware error comparison with highlighted mistakes
- Admin login, exam creation, PDF upload, passage extraction, manual passage editing

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express.js
- Database: SQLite via better-sqlite3
- PDF Upload: Multer
- PDF Text Extraction: pdf-parse
- Authentication: Simple admin login from `.env`

## Folder Structure

```text
client/   React app
server/   Express API, SQLite database, uploads
```

## Install

```bash
cd /home/avinash/bombay-high-court-typing-practice
npm run install:all
```

## Run Backend

```bash
cd /home/avinash/bombay-high-court-typing-practice/server
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

## Run Frontend

```bash
cd /home/avinash/bombay-high-court-typing-practice/client
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Admin Login

Default credentials are stored in `server/.env`:

```text
Username: admin
Password: admin123
```

## Upload PDF

1. Open `/admin/login`
2. Login as admin
3. Go to Upload PDF
4. Choose exam, title, and PDF file
5. The backend stores the PDF in `server/uploads`
6. Text is extracted and split into passages
7. Edit passages in `/admin/passages` if needed

## Typing Result Calculation

- Total Keystrokes = characters in final typed text
- Backspace Pressed = number of Backspace key presses
- Total Words Typed = Total Keystrokes / 5
- Gross WPM = (Keystrokes / 5) / Time in minutes
- Full Errors = additions + omissions + spelling/substitution/repetition + incomplete words
- Half Errors = spacing + capitalization + punctuation + transposition + paragraphic + tab
- Total Errors = Full Errors + Half Errors
- Net WPM = ((Keystrokes / 5) - Total Errors) / Time in minutes
- Accuracy = (Net WPM / Gross WPM) x 100
- Error Percentage = (Total Errors / Total Words Typed) x 100
- Marks = max(0, 20 - (Total Errors / 4))
- Qualified = Net WPM >= 40 and Marks >= 10

## Pages

- `/` Dashboard
- `/download-passages` Download passages
- `/practice` Passage selection
- `/practice/test` Typing test
- `/result/:id` Shareable result page
- `/admin/login` Admin login
- `/admin/dashboard` Admin dashboard
- `/admin/upload` Upload PDF
- `/admin/passages` Manage passages
