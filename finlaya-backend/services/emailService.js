const nodemailer = require('nodemailer');

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

// ── Formatters ─────────────────────────────────────────────────────────────────
const fmtNRs = (n) =>
  `NRs ${Math.round(Math.abs(n)).toLocaleString('en-IN')}`;

// ── Section heading ────────────────────────────────────────────────────────────
const sectionHeading = (title) => `
  <tr>
    <td colspan="10" style="padding: 28px 0 10px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="4" style="background:#f97316; border-radius:2px;">&nbsp;</td>
          <td width="10">&nbsp;</td>
          <td style="font-size:13px; font-weight:700; color:#111827; letter-spacing:0.3px;">${title}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding-top:8px;">
            <div style="height:1px; background:#e5e7eb;"></div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

// ── Table helpers ──────────────────────────────────────────────────────────────
const tableHead = (cols) => `
  <tr style="background:#f9fafb;">
    ${cols.map(c => `
      <td style="padding:9px 12px; font-size:11px; font-weight:700; color:#6b7280;
                 text-transform:uppercase; letter-spacing:0.5px;
                 border-bottom:1px solid #e5e7eb;">${c}</td>
    `).join('')}
  </tr>
`;

const tableRow = (cols, isAlt) => `
  <tr style="background:${isAlt ? '#f9fafb' : '#ffffff'};">
    ${cols.map((c, i) => `
      <td style="padding:9px 12px; font-size:12px; color:#374151;
                 border-bottom:1px solid #f3f4f6;
                 ${i === cols.length - 1 ? 'text-align:right; font-weight:600; color:#111827;' : ''}">
        ${c}
      </td>
    `).join('')}
  </tr>
`;

const noDataRow = (colCount, msg) => `
  <tr>
    <td colspan="${colCount}"
        style="padding:14px 12px; font-size:12px; color:#9ca3af; font-style:italic;">
      ${msg}
    </td>
  </tr>
`;

const footerRow = (colCount, label, value) => `
  <tr style="background:#f9fafb;">
    <td colspan="${colCount - 1}"
        style="padding:10px 12px; font-size:12px; font-weight:600; color:#374151;
               border-top:2px solid #e5e7eb;">${label}</td>
    <td style="padding:10px 12px; font-size:12px; font-weight:700; color:#111827;
               text-align:right; border-top:2px solid #e5e7eb;">${value}</td>
  </tr>
`;

// ── Progress bar ───────────────────────────────────────────────────────────────
const progressBar = (pct) => {
  const clamped = Math.min(pct, 100);
  const color   =
    pct >= 100 ? '#ef4444' :
    pct >= 90  ? '#f97316' :
    pct >= 80  ? '#eab308' : '#22c55e';
  return `
    <div style="height:4px; background:#f1f5f9; border-radius:2px; margin-top:4px;">
      <div style="height:4px; width:${clamped}%; background:${color}; border-radius:2px;"></div>
    </div>
  `;
};

// ── Stat box ───────────────────────────────────────────────────────────────────
const statBox = (label, value, valueColor, bgColor, borderColor) => `
  <td width="25%" style="padding-right:8px;">
    <div style="background:${bgColor}; border:1px solid ${borderColor};
                border-radius:10px; padding:16px 14px;">
      <p style="margin:0; font-size:10px; font-weight:600; color:#6b7280;
                text-transform:uppercase; letter-spacing:0.8px;">${label}</p>
      <p style="margin:8px 0 0; font-size:17px; font-weight:800; color:${valueColor};
                letter-spacing:-0.3px;">${value}</p>
    </div>
  </td>
`;

// ── Main email builder ─────────────────────────────────────────────────────────
function buildEmailHTML({ userName, reportType, period, summary, appUrl }) {
  const {
    totalIncome, totalExpenses,
    topCategory, categoryBreakdown, activeEMIs,
    incomeRows, expenseRows, emiRows, goalRows,
  } = summary;

  const isWeekly   = reportType === 'weekly';
  const reportsUrl = `${appUrl || 'http://localhost:3000'}/reports`;
  const generatedOn = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  // ── Income section ──────────────────────────────────────────────────────────
  const incomeSection = `
    ${sectionHeading('Income')}
    <tr><td colspan="10">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
        ${tableHead(['Description', 'Date', 'Method', 'Amount'])}
        ${(incomeRows || []).length === 0
          ? noDataRow(4, 'No income recorded in this period.')
          : (incomeRows || []).map((r, i) => tableRow(
              [r.description || '—', r.income_date || '—', r.payment_method || '—', fmtNRs(r.amount)],
              i % 2 === 1
            )).join('')
        }
        ${(incomeRows || []).length > 0
          ? footerRow(4, `${(incomeRows || []).length} ${(incomeRows || []).length === 1 ? 'entry' : 'entries'}`, fmtNRs(totalIncome))
          : ''}
      </table>
    </td></tr>
  `;

  // ── Expenses section ────────────────────────────────────────────────────────
  const expensesSection = `
    ${sectionHeading('Expenses')}
    <tr><td colspan="10">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
        ${tableHead(['Description', 'Category', 'Date', 'Method', 'Amount'])}
        ${(expenseRows || []).length === 0
          ? noDataRow(5, 'No expenses recorded in this period.')
          : (expenseRows || []).map((r, i) => tableRow(
              [r.description || '—', r.category_name || '—', r.expense_date || '—', r.payment_method || '—', fmtNRs(r.amount)],
              i % 2 === 1
            )).join('')
        }
        ${(expenseRows || []).length > 0
          ? footerRow(5, `${(expenseRows || []).length} ${(expenseRows || []).length === 1 ? 'entry' : 'entries'}`, fmtNRs(totalExpenses))
          : ''}
      </table>
    </td></tr>
  `;

  // ── Category breakdown ──────────────────────────────────────────────────────
  const catsWithData = (categoryBreakdown || []).filter(c => c.spent > 0 || c.budget > 0);
  const categorySection = `
    ${sectionHeading('Category Breakdown')}
    <tr><td colspan="10">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
        ${tableHead(['Category', 'Budget', 'Spent', 'Remaining', 'Usage'])}
        ${catsWithData.length === 0
          ? noDataRow(5, 'No category data available.')
          : catsWithData.map((c, i) => {
              const rem    = c.budget - c.spent;
              const pct    = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : null;
              const status =
                c.budget <= 0  ? '<span style="color:#9ca3af;">—</span>' :
                rem >= 0
                  ? '<span style="color:#16a34a; font-weight:700;">On track</span>'
                  : '<span style="color:#dc2626; font-weight:700;">Over budget</span>';
              return `
                <tr style="background:${i % 2 === 1 ? '#f9fafb' : '#ffffff'};">
                  <td style="padding:9px 12px; font-size:12px; color:#374151; border-bottom:1px solid #f3f4f6; font-weight:500;">${c.name}</td>
                  <td style="padding:9px 12px; font-size:12px; color:#6b7280; border-bottom:1px solid #f3f4f6; text-align:right;">${c.budget > 0 ? fmtNRs(c.budget) : '—'}</td>
                  <td style="padding:9px 12px; font-size:12px; color:#111827; border-bottom:1px solid #f3f4f6; text-align:right; font-weight:600;">${fmtNRs(c.spent)}</td>
                  <td style="padding:9px 12px; font-size:12px; color:#374151; border-bottom:1px solid #f3f4f6; text-align:right;">${c.budget > 0 ? fmtNRs(rem) : '—'}</td>
                  <td style="padding:9px 12px; font-size:12px; border-bottom:1px solid #f3f4f6; min-width:90px;">
                    ${pct !== null
                      ? `<span style="font-size:11px; color:#6b7280; font-weight:600;">${pct}%</span>${progressBar(pct)}`
                      : status}
                  </td>
                </tr>
              `;
            }).join('')
        }
      </table>
    </td></tr>
  `;

  // ── EMI section ─────────────────────────────────────────────────────────────
  const emiSection = `
    ${sectionHeading('EMI / Loan Details')}
    <tr><td colspan="10">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
        ${tableHead(['Loan Name', 'Monthly EMI', 'Total Amount', 'Due Day', 'Status'])}
        ${(emiRows || []).length === 0
          ? noDataRow(5, 'No active loans.')
          : (emiRows || []).map((e, i) => `
              <tr style="background:${i % 2 === 1 ? '#f9fafb' : '#ffffff'};">
                <td style="padding:9px 12px; font-size:12px; font-weight:500; color:#374151; border-bottom:1px solid #f3f4f6;">${e.loan_name}</td>
                <td style="padding:9px 12px; font-size:12px; color:#111827; border-bottom:1px solid #f3f4f6; text-align:right; font-weight:600;">${fmtNRs(e.emi_amount)}</td>
                <td style="padding:9px 12px; font-size:12px; color:#374151; border-bottom:1px solid #f3f4f6; text-align:right;">${fmtNRs(e.total_amount)}</td>
                <td style="padding:9px 12px; font-size:12px; color:#374151; border-bottom:1px solid #f3f4f6; text-align:center;">Day ${e.payment_day || '—'}</td>
                <td style="padding:9px 12px; font-size:12px; border-bottom:1px solid #f3f4f6; text-align:center;">
                  <span style="display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:600;
                               background:${e.paid_this_month ? '#dcfce7' : '#fef2f2'};
                               color:${e.paid_this_month ? '#16a34a' : '#dc2626'};">
                    ${e.paid_this_month ? 'Paid' : 'Pending'}
                  </span>
                </td>
              </tr>
            `).join('')
        }
      </table>
    </td></tr>
  `;

  // ── Goals section ────────────────────────────────────────────────────────────
  const goalsSection = `
    ${sectionHeading('Savings &amp; Goals')}
    <tr><td colspan="10">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
        ${tableHead(['Goal', 'Target', 'Saved', 'Remaining', 'Progress'])}
        ${(goalRows || []).length === 0
          ? noDataRow(5, 'No goals set up yet.')
          : (goalRows || []).map((g, i) => {
              const rem = Math.max(0, g.target_amount - g.saved_amount);
              const pct = g.target_amount > 0
                ? Math.min(Math.round((g.saved_amount / g.target_amount) * 100), 100)
                : 0;
              return `
                <tr style="background:${i % 2 === 1 ? '#f9fafb' : '#ffffff'};">
                  <td style="padding:9px 12px; font-size:12px; font-weight:500; color:#374151; border-bottom:1px solid #f3f4f6;">${g.title}</td>
                  <td style="padding:9px 12px; font-size:12px; color:#374151; border-bottom:1px solid #f3f4f6; text-align:right;">${fmtNRs(g.target_amount)}</td>
                  <td style="padding:9px 12px; font-size:12px; font-weight:600; color:#16a34a; border-bottom:1px solid #f3f4f6; text-align:right;">${fmtNRs(g.saved_amount)}</td>
                  <td style="padding:9px 12px; font-size:12px; color:#374151; border-bottom:1px solid #f3f4f6; text-align:right;">${fmtNRs(rem)}</td>
                  <td style="padding:9px 12px; border-bottom:1px solid #f3f4f6; min-width:90px;">
                    <span style="font-size:11px; color:#16a34a; font-weight:600;">${pct}%</span>
                    ${progressBar(pct)}
                  </td>
                </tr>
              `;
            }).join('')
        }
      </table>
    </td></tr>
  `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>FinLaya ${isWeekly ? 'Weekly' : 'Monthly'} Report</title>
</head>
<body style="margin:0; padding:0; background:#f1f5f9;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9; padding:32px 16px;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0"
       style="background:#ffffff; border-radius:12px; overflow:hidden;
              box-shadow:0 1px 6px rgba(0,0,0,0.07);">

  <!-- ── HEADER ── -->
  <tr>
    <td style="background:#111827; padding:28px 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <!-- Logo row -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f97316; border-radius:6px;
                           width:32px; height:32px; text-align:center; vertical-align:middle;">
                  <span style="font-size:16px; font-weight:900; color:#ffffff;
                               line-height:32px; display:block;">F</span>
                </td>
                <td style="padding-left:10px; vertical-align:middle;">
                  <span style="font-size:18px; font-weight:800; color:#ffffff;
                               letter-spacing:-0.3px;">FinLaya</span>
                </td>
              </tr>
            </table>
            <!-- Report type + period -->
            <p style="margin:14px 0 0; font-size:13px; color:#9ca3af; font-weight:400;">
              ${isWeekly ? 'Weekly' : 'Monthly'} Financial Report
              &nbsp;&#183;&nbsp;
              <span style="color:#f97316; font-weight:600;">${period}</span>
            </p>
          </td>
          <td align="right" valign="bottom">
            <p style="margin:0; font-size:11px; color:#6b7280;">Generated ${generatedOn}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── ORANGE ACCENT LINE ── -->
  <tr>
    <td style="height:3px; background:linear-gradient(90deg, #f97316, #fb923c, #fdba74);"></td>
  </tr>

  <!-- ── GREETING ── -->
  <tr>
    <td style="padding:24px 32px 0;">
      <p style="margin:0; font-size:14px; color:#374151; line-height:1.6;">
        Hi <strong style="color:#111827;">${userName}</strong>,
        here is your ${isWeekly ? 'weekly' : 'monthly'} financial summary for
        <strong style="color:#111827;">${period}</strong>.
      </p>
    </td>
  </tr>

  <!-- ── STAT BOXES: Monthly Income | Income | Expenses | Active EMIs ── -->
  <tr>
    <td style="padding:20px 32px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${statBox('Monthly Income',  fmtNRs(totalIncome),   '#16a34a', '#f0fdf4', '#bbf7d0')}
          ${statBox('Income',          fmtNRs(totalIncome),   '#0369a1', '#f0f9ff', '#bae6fd')}
          ${statBox('Expenses',        fmtNRs(totalExpenses), '#dc2626', '#fef2f2', '#fecaca')}
          <td width="25%">
            <div style="background:#f9fafb; border:1px solid #e5e7eb;
                        border-radius:10px; padding:16px 14px;">
              <p style="margin:0; font-size:10px; font-weight:600; color:#6b7280;
                        text-transform:uppercase; letter-spacing:0.8px;">Active EMIs</p>
              <p style="margin:8px 0 0; font-size:17px; font-weight:800; color:#111827;
                        letter-spacing:-0.3px;">${activeEMIs}</p>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── TOP CATEGORY CALLOUT (no emoji) ── -->
  ${topCategory ? `
  <tr>
    <td style="padding:16px 32px 0;">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#fafafa; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
        <tr>
          <td width="4" style="background:#f97316;">&nbsp;</td>
          <td style="padding:12px 14px;">
            <p style="margin:0; font-size:12px; color:#374151; line-height:1.5;">
              <strong style="color:#111827;">Top spending category:</strong>
              &nbsp;${topCategory.name}&nbsp;&mdash;&nbsp;${fmtNRs(topCategory.spent)}
              ${topCategory.budget > 0
                ? `<span style="color:#6b7280; font-size:11px;">
                     &nbsp;(${Math.round((topCategory.spent / topCategory.budget) * 100)}% of budget)
                   </span>`
                : ''}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ''}

  <!-- ── DETAILED SECTIONS ── -->
  <tr>
    <td style="padding:0 32px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${incomeSection}
        ${expensesSection}
        ${categorySection}
        ${emiSection}
        ${goalsSection}
      </table>
    </td>
  </tr>

  <!-- ── CTA BUTTON ── -->
  <tr>
    <td style="padding:8px 32px 28px; text-align:center;">
      <a href="${reportsUrl}"
         style="display:inline-block; background:#111827; color:#ffffff;
                font-size:13px; font-weight:600; padding:12px 28px;
                border-radius:8px; text-decoration:none; letter-spacing:0.2px;">
        View Full Report in App
        &nbsp;&#8594;
      </a>
    </td>
  </tr>

  <!-- ── FOOTER ── -->
  <tr>
    <td style="background:#f9fafb; padding:16px 32px; border-top:1px solid #e5e7eb;">
      <p style="margin:0; font-size:11px; color:#9ca3af; text-align:center; line-height:1.7;">
        This report was generated automatically by FinLaya.<br/>
        To stop receiving these emails, go to
        <strong style="color:#6b7280;">Settings &rarr; Notifications</strong>
        and turn off ${isWeekly ? 'Weekly' : 'Monthly'} Reports.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>
  `;
}

async function sendReportEmail({ toEmail, userName, reportType, period, summary, appUrl }) {
  const subject = reportType === 'weekly'
    ? `FinLaya Weekly Report · ${period}`
    : `FinLaya Monthly Report · ${period}`;

  await transporter.sendMail({
    from: `"FinLaya" <${process.env.GMAIL_USER}>`,
    to:   toEmail,
    subject,
    html: buildEmailHTML({ userName, reportType, period, summary, appUrl }),
  });
}

module.exports = { sendReportEmail };