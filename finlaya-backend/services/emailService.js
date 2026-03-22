// finlaya-backend/services/emailService.js
// Only handles email transport and sending.
// All HTML building lives in finlaya-backend/emails/

const nodemailer                    = require('nodemailer');
const { buildReportEmailHTML }      = require('../emails/reportEmail');
const { buildBudgetAlertEmailHTML } = require('../emails/budgetAlertEmail');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

transporter.verify((error) => {
  if (error) console.warn('⚠ Email service not connected:', error.message);
  else       console.log('✓ Email service ready (Gmail)');
});

// ── Send weekly or monthly report email ───────────────────────────────────────
async function sendReportEmail({ toEmail, userName, reportType, period, summary, appUrl }) {
  const subject = reportType === 'weekly'
    ? `FinLaya Weekly Report · ${period}`
    : `FinLaya Monthly Report · ${period}`;

  await transporter.sendMail({
    from: `"FinLaya" <${process.env.GMAIL_USER}>`,
    to:   toEmail,
    subject,
    html: buildReportEmailHTML({ userName, reportType, period, summary, appUrl }),
  });
}

// ── Send budget alert email ───────────────────────────────────────────────────
async function sendBudgetAlertEmail({ toEmail, userName, alerts }) {
  const hasCritical = alerts.some((a) => a.severity === 'critical');
  const subject     = hasCritical
    ? `FinLaya Budget Alert — Action Needed`
    : `FinLaya Budget Alert — Heads Up`;

  await transporter.sendMail({
    from: `"FinLaya" <${process.env.GMAIL_USER}>`,
    to:   toEmail,
    subject,
    html: buildBudgetAlertEmailHTML({ userName, alerts }),
  });
}

module.exports = { sendReportEmail, sendBudgetAlertEmail };