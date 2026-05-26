# Bombay High Court Clerk Typing Practice & Evaluation System

A production web app for Bombay High Court Clerk typing practice. Students can register/login, download passage PDFs, select passages, take timed typing tests, and view saved history with WPM, accuracy, marks, qualification, and error analysis. Admins can upload PDFs and manage passage text manually.

## Features

- First 4 passages are free without login
- Passage 5 onwards requires student login and active lifetime subscription
- Cashfree-ready Rs. 100 lifetime subscription flow
- Student registration and login
- Student profile/history saved in PostgreSQL
- Download uploaded passage PDFs from Supabase Storage
- Passage selection by exam, PDF, and passage number
- 5/10/15 minute typing tests
- Timer starts on first typed character
- Auto-submit when time ends
- Backspace and keystroke tracking
- Copy/paste and right-click disabled in typing box
- Full result page with Gross WPM, Net WPM, accuracy, marks, qualification, and formulas
- Word-level and character-aware error comparison with highlighted mistakes
- Admin login, exam creation, PDF upload, manual passage editing

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express.js
- Database: Supabase PostgreSQL
- PDF Storage: Supabase Storage bucket `passage-pdfs`
- PDF Upload: Multer memory upload
- - Authentication: JWT + bcrypt

## Folder Structure

```text
client/   React app for Vercel
server/   Express API for Render, PostgreSQL, Supabase Storage
```

## Required Backend Environment

```env
NODE_ENV=production
FRONTEND_URL=https://www.legaltypingtest.online
EXTRA_CORS_ORIGINS=https://legaltypingtest.online
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=passage-pdfs
DATABASE_URL=
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
CASHFREE_ENV=sandbox
ALLOW_MOCK_PAYMENTS=false
```

The backend is online-only now. It requires `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.

## Required Frontend Environment

```env
VITE_API_BASE_URL=https://YOUR_RENDER_BACKEND_URL/api

```

## Admin Login

Use the credentials from Render environment variables:

```text
ADMIN_EMAIL
ADMIN_PASSWORD_HASH
```

Generate the hash with:

```bash
cd server
node -e "import('bcryptjs').then(b=>console.log(b.default.hashSync('YOUR_ADMIN_PASSWORD', 10)))"
```

## Upload PDF

1. Open `/admin/login`.
2. Login as admin.
3. Go to Upload PDF.
4. Choose exam, title, and PDF file.
5. The backend uploads the PDF to Supabase Storage.
6. PDF metadata is saved in PostgreSQL table `pdfs`.
7. Add or edit passage text manually in `/admin/passages` if needed.

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
- `/student/register` Student registration
- `/student/login` Student login
- `/student/history` Student profile/history
- `/result/:id` Shareable result page
- `/admin/login` Admin login
- `/admin/dashboard` Admin dashboard
- `/admin/upload` Upload PDF
- `/admin/passages` Manage passages
