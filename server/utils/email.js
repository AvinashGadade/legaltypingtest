import nodemailer from 'nodemailer';

/* ─────────────────────────────────────────────────────────────
   Email utility — uses Gmail App Password via Nodemailer.
   Falls back to console.log if EMAIL_USER / EMAIL_PASS are not set
   (safe for local dev — no crash).
   ───────────────────────────────────────────────────────────── */

let _transport = null;

function transport() {
  if (_transport) return _transport;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  _transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
  return _transport;
}

async function send({ to, subject, html }) {
  const t = transport();
  if (!t) {
    // Dev fallback — just log it
    console.log(`[email:dev] To=${to} | Subject=${subject}`);
    return;
  }
  try {
    await t.sendMail({
      from: `"LegalTypingTest – BHC" <${process.env.EMAIL_USER}>`,
      to, subject, html
    });
  } catch (err) {
    console.error('[email] Failed to send:', err.message);
  }
}

/* ── Shared layout ── */
function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{margin:0;padding:0;background:#f1f5f9;font-family:Georgia,'Times New Roman',Times,serif;color:#1e293b}
  .wrap{max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .hdr{background:linear-gradient(135deg,#1e1b4b,#4338ca);padding:28px 36px;color:#fff}
  .hdr h1{margin:0;font-size:20px;letter-spacing:.5px}
  .hdr p{margin:6px 0 0;font-size:13px;opacity:.7}
  .body{padding:32px 36px}
  .body p{margin:0 0 14px;font-size:15px;line-height:1.7;color:#334155}
  .chip{display:inline-block;background:#e0e7ff;color:#3730a3;padding:6px 16px;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:.3px;margin:4px 0}
  .btn{display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:15px;margin:16px 0}
  .divider{border:none;border-top:1px solid #e2e8f0;margin:24px 0}
  .footer{background:#f8fafc;padding:20px 36px;font-size:12px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <h1>⚖️ LegalTypingTest</h1>
    <p>Bombay High Court Clerk Typing Practice</p>
  </div>
  <div class="body">${body}</div>
  <div class="footer">
    This email was sent from legaltypingtest.online. Do not reply to this email.<br>
    If you did not create an account, ignore this message.
  </div>
</div>
</body></html>`;
}

/* ── Welcome email after registration ── */
export async function sendWelcomeEmail(to, name) {
  const body = `
    <p>Hi <strong>${name}</strong>,</p>
    <p>Welcome to <strong>LegalTypingTest</strong>! Your account has been created successfully. 🎉</p>
    <p>You can now:</p>
    <ul style="margin:0 0 14px;padding-left:20px;color:#334155;font-size:15px;line-height:2">
      <li>Practice with official BHC typing passages</li>
      <li>Get live word-by-word feedback as you type</li>
      <li>Track your WPM, accuracy, and marks</li>
      <li>First 4 passages are free — no payment needed</li>
    </ul>
    <a href="https://www.legaltypingtest.online/practice" class="btn">Start Practicing Now →</a>
    <hr class="divider">
    <p style="font-size:13px;color:#64748b">Qualification criteria: Net WPM ≥ 40 and Marks ≥ 10 out of 20.</p>`;
  await send({ to, subject: '✅ Welcome to LegalTypingTest – Account Created', html: layout('Welcome', body) });
}

/* ── Login notification ── */
export async function sendLoginEmail(to, name) {
  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });
  const body = `
    <p>Hi <strong>${name}</strong>,</p>
    <p>We noticed a new login to your LegalTypingTest account.</p>
    <p style="margin:0 0 6px"><strong>When:</strong></p>
    <div class="chip">🕐 ${now} IST</div>
    <p style="margin:14px 0 0">If this was you, no action is needed.</p>
    <p>If you did <strong>not</strong> log in, please reset your password immediately:</p>
    <a href="https://www.legaltypingtest.online/student/forgot-password" class="btn">Reset Password →</a>`;
  await send({ to, subject: '🔐 New Login – LegalTypingTest', html: layout('Login Alert', body) });
}

/* ── Password reset email ── */
export async function sendPasswordResetEmail(to, name, resetLink) {
  const body = `
    <p>Hi <strong>${name}</strong>,</p>
    <p>We received a request to reset your LegalTypingTest password.</p>
    <p>Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
    <a href="${resetLink}" class="btn">Reset My Password →</a>
    <hr class="divider">
    <p style="font-size:13px;color:#64748b">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>
    <p style="font-size:12px;color:#94a3b8;word-break:break-all">Or copy this link: ${resetLink}</p>`;
  await send({ to, subject: '🔑 Reset Your LegalTypingTest Password', html: layout('Password Reset', body) });
}
