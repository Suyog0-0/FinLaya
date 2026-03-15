const nodemailer = require('nodemailer');

// ── Gmail transporter ──────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Google app password, not your login password
  },
});

// ── Verify connection on startup ───────────────────────────────────────────────
transporter.verify((error) => {
  if (error) {
    console.warn('⚠ Email service not connected:', error.message);
  } else {
    console.log('✓ Email service ready (Gmail)');
  }
});

// ── Build HTML email ───────────────────────────────────────────────────────────
function buildEmailHTML({ userName, reportType, period, summary }) {
  const { totalIncome, totalExpenses, totalSavings, topCategory, categoryBreakdown, activeEMIs } = summary;

  const savingsColor  = totalSavings >= 0 ? '#16a34a' : '#dc2626';
  const savingsLabel  = totalSavings >= 0 ? 'Saved' : 'Deficit';
  const isWeekly      = reportType === 'weekly';

  const categoryRows = (categoryBreakdown || [])
    .slice(0, 5)
    .map((cat) => {
      const pct     = cat.budget > 0 ? Math.round((cat.spent / cat.budget) * 100) : null;
      const barColor =
        pct === null     ? '#94a3b8' :
        pct >= 100       ? '#ef4444' :
        pct >= 90        ? '#f97316' :
        pct >= 80        ? '#eab308' : '#22c55e';

      return `
        <tr>
          <td style="padding:8px 0; font-size:13px; color:#374151;">${cat.name}</td>
          <td style="padding:8px 0; font-size:13px; color:#374151; text-align:right;">
            NRs ${Math.round(cat.spent).toLocaleString('en-IN')}
          </td>
          <td style="padding:8px 0; font-size:13px; color:#6b7280; text-align:right;">
            ${pct !== null ? `${pct}% of budget` : 'No budget set'}
          </td>
        </tr>
        <tr>
          <td colspan="3" style="padding-bottom:8px;">
            <div style="height:4px; background:#f1f5f9; border-radius:2px;">
              <div style="height:4px; width:${Math.min(pct ?? 50, 100)}%; background:${barColor}; border-radius:2px;"></div>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0; padding:0; background:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <div style="max-width:560px; margin:32px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#f97316,#ea580c); padding:32px 32px 24px;">
      <p style="margin:0 0 4px; font-size:12px; color:#fed7aa; letter-spacing:1px; text-transform:uppercase;">
        FinLaya · ${isWeekly ? 'Weekly' : 'Monthly'} Report
      </p>
      <h1 style="margin:0; font-size:24px; font-weight:700; color:#ffffff;">
        ${isWeekly ? 'Your Week in Review' : 'Monthly Summary'}
      </h1>
      <p style="margin:8px 0 0; font-size:13px; color:#fed7aa;">${period}</p>
    </div>

    <!-- Greeting -->
    <div style="padding:24px 32px 0;">
      <p style="margin:0; font-size:14px; color:#6b7280;">
        Hi <strong style="color:#111827;">${userName}</strong>, here's your ${isWeekly ? 'weekly' : 'monthly'} financial snapshot.
      </p>
    </div>

    <!-- Stats row -->
    <div style="padding:20px 32px; display:flex; gap:12px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="33%" style="padding-right:8px;">
            <div style="background:#f0fdf4; border-radius:12px; padding:16px; text-align:center;">
              <p style="margin:0; font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px;">Income</p>
              <p style="margin:6px 0 0; font-size:18px; font-weight:700; color:#16a34a;">
                NRs ${Math.round(totalIncome).toLocaleString('en-IN')}
              </p>
            </div>
          </td>
          <td width="33%" style="padding-right:8px;">
            <div style="background:#fef2f2; border-radius:12px; padding:16px; text-align:center;">
              <p style="margin:0; font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px;">Expenses</p>
              <p style="margin:6px 0 0; font-size:18px; font-weight:700; color:#dc2626;">
                NRs ${Math.round(totalExpenses).toLocaleString('en-IN')}
              </p>
            </div>
          </td>
          <td width="33%">
            <div style="background:#fff7ed; border-radius:12px; padding:16px; text-align:center;">
              <p style="margin:0; font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px;">${savingsLabel}</p>
              <p style="margin:6px 0 0; font-size:18px; font-weight:700; color:${savingsColor};">
                NRs ${Math.abs(Math.round(totalSavings)).toLocaleString('en-IN')}
              </p>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Top category callout -->
    ${topCategory ? `
    <div style="margin:0 32px; padding:14px 16px; background:#fff7ed; border-left:3px solid #f97316; border-radius:8px;">
      <p style="margin:0; font-size:13px; color:#92400e;">
        🏆 <strong>Top spending category:</strong> ${topCategory.name}
        — NRs ${Math.round(topCategory.spent).toLocaleString('en-IN')}
      </p>
    </div>` : ''}

    <!-- Category breakdown -->
    ${categoryRows ? `
    <div style="padding:20px 32px 0;">
      <p style="margin:0 0 12px; font-size:13px; font-weight:600; color:#374151;">Category Breakdown</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${categoryRows}
      </table>
    </div>` : ''}

    <!-- Active EMIs -->
    ${activeEMIs > 0 ? `
    <div style="margin:16px 32px 0; padding:14px 16px; background:#f0f9ff; border-radius:8px;">
      <p style="margin:0; font-size:13px; color:#0369a1;">
        💳 You have <strong>${activeEMIs} active loan${activeEMIs > 1 ? 's' : ''}</strong> with ongoing EMI payments.
      </p>
    </div>` : ''}

    <!-- Footer -->
    <div style="padding:24px 32px; margin-top:24px; border-top:1px solid #f1f5f9;">
      <p style="margin:0; font-size:12px; color:#9ca3af; text-align:center;">
        This report was generated automatically by FinLaya.<br/>
        You can turn off these emails in your notification settings.
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

// ── Send report email ──────────────────────────────────────────────────────────
async function sendReportEmail({ toEmail, userName, reportType, period, summary }) {
  const isWeekly = reportType === 'weekly';
  const subject  = isWeekly
    ? `FinLaya Weekly Report · ${period}`
    : `FinLaya Monthly Report · ${period}`;

  const html = buildEmailHTML({ userName, reportType, period, summary });

  await transporter.sendMail({
    from:    `"FinLaya" <${process.env.GMAIL_USER}>`,
    to:      toEmail,
    subject,
    html,
  });
}

module.exports = { sendReportEmail };