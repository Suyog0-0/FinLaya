// finlaya-backend/emails/reportEmail.js

const {
  emailHeader,
  emailFooter,
  ctaButton,
  emailWrapper,
  progressBar,
  fmtNRs,
} = require('./layouts/baseLayout');

// ── Table helpers (used only in reports) ──────────────────────────────────────

function sectionHeading(title) {
  return `
  <tr>
    <td colspan="10" style="padding:28px 0 10px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="4" style="background:#f97316; border-radius:2px;">&nbsp;</td>
          <td width="10">&nbsp;</td>
          <td style="font-size:13px; font-weight:700; color:#111827;
                     letter-spacing:0.3px;">${title}</td>
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
}

function tableHead(cols) {
  return `
  <tr style="background:#f9fafb;">
    ${cols.map(c => `
      <td style="padding:9px 12px; font-size:11px; font-weight:700; color:#6b7280;
                 text-transform:uppercase; letter-spacing:0.5px;
                 border-bottom:1px solid #e5e7eb;">${c}</td>
    `).join('')}
  </tr>
  `;
}

function tableRow(cols, isAlt) {
  return `
  <tr style="background:${isAlt ? '#f9fafb' : '#ffffff'};">
    ${cols.map((c, i) => `
      <td style="padding:9px 12px; font-size:12px; color:#374151;
                 border-bottom:1px solid #f3f4f6;
                 ${i === cols.length - 1
                   ? 'text-align:right; font-weight:600; color:#111827;'
                   : ''}">
        ${c}
      </td>
    `).join('')}
  </tr>
  `;
}

function noDataRow(colCount, msg) {
  return `
  <tr>
    <td colspan="${colCount}"
        style="padding:14px 12px; font-size:12px; color:#9ca3af; font-style:italic;">
      ${msg}
    </td>
  </tr>
  `;
}

function footerRow(colCount, label, value) {
  return `
  <tr style="background:#f9fafb;">
    <td colspan="${colCount - 1}"
        style="padding:10px 12px; font-size:12px; font-weight:600; color:#374151;
               border-top:2px solid #e5e7eb;">${label}</td>
    <td style="padding:10px 12px; font-size:12px; font-weight:700; color:#111827;
               text-align:right; border-top:2px solid #e5e7eb;">${value}</td>
  </tr>
  `;
}

function statBox(label, value, valueColor, bgColor, borderColor) {
  return `
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
}

// ── Section builders ──────────────────────────────────────────────────────────

function buildIncomeSection(incomeRows, totalIncome) {
  return `
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
        ? footerRow(4,
            `${incomeRows.length} ${incomeRows.length === 1 ? 'entry' : 'entries'}`,
            fmtNRs(totalIncome))
        : ''}
    </table>
  </td></tr>
  `;
}

function buildExpensesSection(expenseRows, totalExpenses) {
  return `
  ${sectionHeading('Expenses')}
  <tr><td colspan="10">
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
      ${tableHead(['Description', 'Category', 'Date', 'Method', 'Amount'])}
      ${(expenseRows || []).length === 0
        ? noDataRow(5, 'No expenses recorded in this period.')
        : (expenseRows || []).map((r, i) => tableRow(
            [r.description || '—', r.category_name || '—', r.expense_date || '—',
             r.payment_method || '—', fmtNRs(r.amount)],
            i % 2 === 1
          )).join('')
      }
      ${(expenseRows || []).length > 0
        ? footerRow(5,
            `${expenseRows.length} ${expenseRows.length === 1 ? 'entry' : 'entries'}`,
            fmtNRs(totalExpenses))
        : ''}
    </table>
  </td></tr>
  `;
}

// ── Category section — colored left border based on spend status ──────────────
function buildCategorySection(categoryBreakdown) {
  const catsWithData = (categoryBreakdown || []).filter(c => c.spent > 0 || c.budget > 0);

  // Pick left border color based on spend percentage
  function getBorderColor(spent, budget) {
    if (budget <= 0) return '#e5e7eb';          // grey — no budget set
    const pct = spent / budget;
    if (pct >= 1)   return '#ef4444';           // red   — over budget
    if (pct >= 0.9) return '#f97316';           // orange — 90%+
    if (pct >= 0.8) return '#eab308';           // yellow — 80%+
    return '#22c55e';                           // green  — on track
  }

  return `
  ${sectionHeading('Category Breakdown')}
  <tr><td colspan="10">
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">

      <!-- Column headers — extra first column for the left border -->
      <tr style="background:#f9fafb;">
        <td width="4" style="padding:0; border-bottom:1px solid #e5e7eb;">&nbsp;</td>
        <td style="padding:9px 12px; font-size:11px; font-weight:700; color:#6b7280;
                   text-transform:uppercase; letter-spacing:0.5px;
                   border-bottom:1px solid #e5e7eb;">Category</td>
        <td style="padding:9px 12px; font-size:11px; font-weight:700; color:#6b7280;
                   text-transform:uppercase; letter-spacing:0.5px;
                   border-bottom:1px solid #e5e7eb; text-align:right;">Budget</td>
        <td style="padding:9px 12px; font-size:11px; font-weight:700; color:#6b7280;
                   text-transform:uppercase; letter-spacing:0.5px;
                   border-bottom:1px solid #e5e7eb; text-align:right;">Spent</td>
        <td style="padding:9px 12px; font-size:11px; font-weight:700; color:#6b7280;
                   text-transform:uppercase; letter-spacing:0.5px;
                   border-bottom:1px solid #e5e7eb; text-align:right;">Remaining</td>
        <td style="padding:9px 12px; font-size:11px; font-weight:700; color:#6b7280;
                   text-transform:uppercase; letter-spacing:0.5px;
                   border-bottom:1px solid #e5e7eb; min-width:90px;">Usage</td>
      </tr>

      ${catsWithData.length === 0
        ? `<tr><td colspan="6"
                 style="padding:14px 12px; font-size:12px; color:#9ca3af; font-style:italic;">
             No category data available.
           </td></tr>`
        : catsWithData.map((c) => {
            const rem         = c.budget - c.spent;
            const pct         = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : null;
            const borderColor = getBorderColor(c.spent, c.budget);
            const isOver      = c.budget > 0 && c.spent > c.budget;
            const statusLabel = c.budget <= 0
              ? '<span style="color:#9ca3af;">—</span>'
              : isOver
                ? '<span style="color:#dc2626; font-weight:700;">Over budget</span>'
                : '<span style="color:#16a34a; font-weight:700;">On track</span>';

            return `
              <tr style="background:#ffffff;">
                <!-- Colored left border -->
                <td width="4" style="background:${borderColor};
                             border-bottom:1px solid #f3f4f6; padding:0;">&nbsp;</td>
                <td style="padding:9px 12px; font-size:12px; font-weight:500;
                           color:#374151; border-bottom:1px solid #f3f4f6;">
                  ${c.name}
                </td>
                <td style="padding:9px 12px; font-size:12px; color:#6b7280;
                           border-bottom:1px solid #f3f4f6; text-align:right;">
                  ${c.budget > 0 ? fmtNRs(c.budget) : '—'}
                </td>
                <td style="padding:9px 12px; font-size:12px;
                           color:${isOver ? '#dc2626' : '#111827'};
                           font-weight:${isOver ? '700' : '600'};
                           border-bottom:1px solid #f3f4f6; text-align:right;">
                  ${fmtNRs(c.spent)}
                </td>
                <td style="padding:9px 12px; font-size:12px; color:#374151;
                           border-bottom:1px solid #f3f4f6; text-align:right;">
                  ${c.budget > 0 ? fmtNRs(rem) : '—'}
                </td>
                <td style="padding:9px 12px; font-size:12px;
                           border-bottom:1px solid #f3f4f6; min-width:90px;">
                  ${pct !== null
                    ? `<span style="font-size:11px; color:#6b7280;
                                   font-weight:600;">${pct}%</span>${progressBar(pct)}`
                    : statusLabel}
                </td>
              </tr>
            `;
          }).join('')
      }
    </table>
  </td></tr>
  `;
}

function buildEmiSection(emiRows) {
  return `
  ${sectionHeading('EMI / Loan Details')}
  <tr><td colspan="10">
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
      ${tableHead(['Loan Name', 'Monthly EMI', 'Total Amount', 'Due Day', 'Status'])}
      ${(emiRows || []).length === 0
        ? noDataRow(5, 'No active loans.')
        : (emiRows || []).map((e, i) => `
            <tr style="background:${i % 2 === 1 ? '#f9fafb' : '#ffffff'};">
              <td style="padding:9px 12px; font-size:12px; font-weight:500;
                         color:#374151; border-bottom:1px solid #f3f4f6;">${e.loan_name}</td>
              <td style="padding:9px 12px; font-size:12px; color:#111827; font-weight:600;
                         border-bottom:1px solid #f3f4f6; text-align:right;">
                ${fmtNRs(e.emi_amount)}
              </td>
              <td style="padding:9px 12px; font-size:12px; color:#374151;
                         border-bottom:1px solid #f3f4f6; text-align:right;">
                ${fmtNRs(e.total_amount)}
              </td>
              <td style="padding:9px 12px; font-size:12px; color:#374151;
                         border-bottom:1px solid #f3f4f6; text-align:center;">
                Day ${e.payment_day || '—'}
              </td>
              <td style="padding:9px 12px; font-size:12px;
                         border-bottom:1px solid #f3f4f6; text-align:center;">
                <span style="display:inline-block; padding:2px 8px; border-radius:20px;
                             font-size:11px; font-weight:600;
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
}

function buildGoalsSection(goalRows) {
  return `
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
                <td style="padding:9px 12px; font-size:12px; font-weight:500;
                           color:#374151; border-bottom:1px solid #f3f4f6;">${g.title}</td>
                <td style="padding:9px 12px; font-size:12px; color:#374151;
                           border-bottom:1px solid #f3f4f6; text-align:right;">
                  ${fmtNRs(g.target_amount)}
                </td>
                <td style="padding:9px 12px; font-size:12px; font-weight:600;
                           color:#16a34a; border-bottom:1px solid #f3f4f6; text-align:right;">
                  ${fmtNRs(g.saved_amount)}
                </td>
                <td style="padding:9px 12px; font-size:12px; color:#374151;
                           border-bottom:1px solid #f3f4f6; text-align:right;">
                  ${fmtNRs(rem)}
                </td>
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
}

// ── Main builder ──────────────────────────────────────────────────────────────
function buildReportEmailHTML({ userName, reportType, period, summary, appUrl }) {
  const {
    totalIncome, totalExpenses,
    topCategory, categoryBreakdown, activeEMIs,
    incomeRows, expenseRows, emiRows, goalRows,
  } = summary;

  const isWeekly   = reportType === 'weekly';
  const reportsUrl = `${appUrl || 'http://localhost:3000'}/reports`;

  const subtitleLeft = `
    ${isWeekly ? 'Weekly' : 'Monthly'} Financial Report
    &nbsp;&#183;&nbsp;
    <span style="color:#f97316; font-weight:600;">${period}</span>
  `;

  const innerRows = `
    ${emailHeader(subtitleLeft)}

    <!-- Greeting -->
    <tr>
      <td style="padding:24px 32px 0;">
        <p style="margin:0; font-size:14px; color:#374151; line-height:1.6;">
          Hi <strong style="color:#111827;">${userName}</strong>,
          here is your ${isWeekly ? 'weekly' : 'monthly'} financial summary for
          <strong style="color:#111827;">${period}</strong>.
        </p>
      </td>
    </tr>

    <!-- Stat boxes -->
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
                <p style="margin:8px 0 0; font-size:17px; font-weight:800;
                          color:#111827; letter-spacing:-0.3px;">${activeEMIs}</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Top category callout -->
    ${topCategory ? `
    <tr>
      <td style="padding:16px 32px 0;">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#fafafa; border:1px solid #e5e7eb;
                      border-radius:8px; overflow:hidden;">
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

    <!-- All sections -->
    <tr>
      <td style="padding:0 32px 8px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${buildIncomeSection(incomeRows, totalIncome)}
          ${buildExpensesSection(expenseRows, totalExpenses)}
          ${buildCategorySection(categoryBreakdown)}
          ${buildEmiSection(emiRows)}
          ${buildGoalsSection(goalRows)}
        </table>
      </td>
    </tr>

    ${ctaButton(reportsUrl, 'View Full Report in App')}

    ${emailFooter(`
      To stop receiving these emails, go to
      <strong style="color:#6b7280;">Settings &rarr; Notifications</strong>
      and turn off ${isWeekly ? 'Weekly' : 'Monthly'} Reports.
    `)}
  `;

  return emailWrapper(innerRows);
}

module.exports = { buildReportEmailHTML };