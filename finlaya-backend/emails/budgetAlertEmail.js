// finlaya-backend/emails/budgetAlertEmail.js

const {
  emailHeader,
  emailFooter,
  ctaButton,
  emailWrapper,
  fmtNRs,
} = require('./layouts/baseLayout');

// Returns color info for a given spend percentage
function getStatusStyle(pct, isOver) {
  if (isOver || pct >= 100) {
    return {
      barColor:    '#ef4444',  // red
      borderColor: '#ef4444',
      bgColor:     '#fff5f5',
      statusText:  'Over budget',
      spentColor:  '#dc2626',
      spentWeight: '700',
    };
  }
  if (pct >= 90) {
    return {
      barColor:    '#f97316',  // orange
      borderColor: '#f97316',
      bgColor:     '#fff7ed',
      statusText:  'Almost at limit',
      spentColor:  '#c2410c',
      spentWeight: '600',
    };
  }
  // 80–89%
  return {
    barColor:    '#eab308',  // yellow
    borderColor: '#eab308',
    bgColor:     '#fefce8',
    statusText:  'Approaching limit',
    spentColor:  '#374151',
    spentWeight: '400',
  };
}

// Picks the header gradient color based on the worst alert in the list
function getHeaderColor(alerts) {
  const hasOver   = alerts.some((a) => a.spent >= a.budget);
  const has90pct  = alerts.some((a) => (a.spent / a.budget) >= 0.9);
  if (hasOver || has90pct) return '#ef4444';  // red
  return '#f97316';                            // orange
}

function buildBudgetAlertEmailHTML({ userName, alerts }) {
  const appUrl      = process.env.APP_URL || 'http://localhost:3000';
  const headerColor = getHeaderColor(alerts);
  const hasCritical = alerts.some(
    (a) => a.spent >= a.budget || (a.spent / a.budget) >= 0.9
  );

  // ── Alert rows with colored left border ──────────────────────────────────
  const alertRows = alerts.map((alert) => {
    const pct    = Math.round((alert.spent / alert.budget) * 100);
    const isOver = alert.spent >= alert.budget;
    const clamped = Math.min(pct, 100);
    const {
      barColor, borderColor, bgColor,
      statusText, spentColor, spentWeight,
    } = getStatusStyle(pct, isOver);

    return `
      <tr style="background:${bgColor};">
        <!-- Colored left border based on status -->
        <td width="4" style="background:${borderColor}; padding:0;">&nbsp;</td>

        <td style="padding:12px 14px; font-size:13px; font-weight:600;
                   color:#111827; border-bottom:1px solid #f3f4f6;">
          ${alert.categoryName}
        </td>
        <td style="padding:12px 14px; font-size:13px; color:#374151;
                   text-align:right; border-bottom:1px solid #f3f4f6;">
          ${fmtNRs(alert.budget)}
        </td>
        <td style="padding:12px 14px; font-size:13px;
                   color:${spentColor}; font-weight:${spentWeight};
                   text-align:right; border-bottom:1px solid #f3f4f6;">
          ${fmtNRs(alert.spent)}
        </td>
        <td style="padding:12px 14px; border-bottom:1px solid #f3f4f6; min-width:130px;">
          <span style="font-size:12px; font-weight:700; color:${barColor};">${pct}%</span>
          <div style="height:4px; background:#e5e7eb; border-radius:2px; margin-top:5px;">
            <div style="height:4px; width:${clamped}%; background:${barColor};
                        border-radius:2px;"></div>
          </div>
          <span style="font-size:11px; color:#6b7280; margin-top:4px; display:block;">
            ${statusText}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  // ── Header subtitle ───────────────────────────────────────────────────────
  const alertCountText = alerts.length === 1
    ? 'category needs attention'
    : 'categories need attention';

  const subtitleLeft = `
    Budget Alert
    &nbsp;&#183;&nbsp;
    <span style="color:${headerColor}; font-weight:600;">
      ${alerts.length} ${alertCountText}
    </span>
  `;

  // ── Legend row — shown above the table ────────────────────────────────────
  const legendRow = `
    <tr>
      <td style="padding:0 32px 10px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right:16px;">
              <span style="display:inline-flex; align-items:center; gap:6px;
                           font-size:11px; color:#6b7280;">
                <span style="display:inline-block; width:10px; height:10px;
                             border-radius:2px; background:#ef4444;"></span>
                Over budget
              </span>
            </td>
            <td style="padding-right:16px;">
              <span style="display:inline-flex; align-items:center; gap:6px;
                           font-size:11px; color:#6b7280;">
                <span style="display:inline-block; width:10px; height:10px;
                             border-radius:2px; background:#f97316;"></span>
                Almost at limit (90%+)
              </span>
            </td>
            <td>
              <span style="display:inline-flex; align-items:center; gap:6px;
                           font-size:11px; color:#6b7280;">
                <span style="display:inline-block; width:10px; height:10px;
                             border-radius:2px; background:#eab308;"></span>
                Approaching (80%+)
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  const greetingMsg = hasCritical
    ? 'have exceeded or are very close to their limit'
    : 'are approaching their limit';

  const innerRows = `
    ${emailHeader(subtitleLeft)}

    <!-- Greeting -->
    <tr>
      <td style="padding:24px 32px 0;">
        <p style="margin:0; font-size:14px; color:#374151; line-height:1.6;">
          Hi <strong style="color:#111827;">${userName}</strong>,
          one or more of your budget categories ${greetingMsg} this month.
        </p>
      </td>
    </tr>

    <!-- Legend -->
    <tr>
      <td style="padding:16px 32px 0;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right:16px; white-space:nowrap;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:10px; height:10px; background:#ef4444;
                           border-radius:2px; vertical-align:middle;"></td>
                <td style="padding-left:6px; font-size:11px; color:#6b7280;
                           vertical-align:middle;">Over budget</td>
              </tr></table>
            </td>
            <td style="padding-right:16px; white-space:nowrap;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:10px; height:10px; background:#f97316;
                           border-radius:2px; vertical-align:middle;"></td>
                <td style="padding-left:6px; font-size:11px; color:#6b7280;
                           vertical-align:middle;">Almost at limit (90%+)</td>
              </tr></table>
            </td>
            <td style="white-space:nowrap;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:10px; height:10px; background:#eab308;
                           border-radius:2px; vertical-align:middle;"></td>
                <td style="padding-left:6px; font-size:11px; color:#6b7280;
                           vertical-align:middle;">Approaching limit (80%+)</td>
              </tr></table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Alert Table -->
    <tr>
      <td style="padding:12px 32px 8px;">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
          <!-- Table header -->
          <tr style="background:#f9fafb;">
            <td width="4" style="padding:0; border-bottom:1px solid #e5e7eb;">&nbsp;</td>
            <td style="padding:9px 14px; font-size:11px; font-weight:700; color:#6b7280;
                       text-transform:uppercase; letter-spacing:0.5px;
                       border-bottom:1px solid #e5e7eb;">Category</td>
            <td style="padding:9px 14px; font-size:11px; font-weight:700; color:#6b7280;
                       text-transform:uppercase; letter-spacing:0.5px;
                       border-bottom:1px solid #e5e7eb; text-align:right;">Budget</td>
            <td style="padding:9px 14px; font-size:11px; font-weight:700; color:#6b7280;
                       text-transform:uppercase; letter-spacing:0.5px;
                       border-bottom:1px solid #e5e7eb; text-align:right;">Spent</td>
            <td style="padding:9px 14px; font-size:11px; font-weight:700; color:#6b7280;
                       text-transform:uppercase; letter-spacing:0.5px;
                       border-bottom:1px solid #e5e7eb;">Usage</td>
          </tr>
          ${alertRows}
        </table>
      </td>
    </tr>


    ${ctaButton(`${appUrl}/categories`, 'View Budget Categories')}

    ${emailFooter(`
      To stop receiving budget alerts, go to
      <strong style="color:#6b7280;">Settings &rarr; Notifications</strong>
      and turn off Budget Alerts.
    `)}
  `;

  return emailWrapper(innerRows);
}

module.exports = { buildBudgetAlertEmailHTML };