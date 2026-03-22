// finlaya-backend/emails/layouts/baseLayout.js
// Shared HTML pieces reused across all FinLaya emails

const generatedOn = () =>
  new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

// ── Dark header with FinLaya logo ─────────────────────────────────────────────
function emailHeader(subtitleLeft, subtitleRight) {
  return `
  <tr>
    <td style="background:#111827; padding:28px 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
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
            <p style="margin:14px 0 0; font-size:13px; color:#9ca3af; font-weight:400;">
              ${subtitleLeft}
            </p>
          </td>
          <td align="right" valign="bottom">
            <p style="margin:0; font-size:11px; color:#6b7280;">
              ${subtitleRight || `Generated ${generatedOn()}`}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Orange accent line -->
  <tr>
    <td style="height:3px; background:linear-gradient(90deg, #f97316, #fb923c, #fdba74);"></td>
  </tr>
  `;
}

// ── Footer ────────────────────────────────────────────────────────────────────
function emailFooter(unsubscribeText) {
  return `
  <tr>
    <td style="background:#f9fafb; padding:16px 32px; border-top:1px solid #e5e7eb;">
      <p style="margin:0; font-size:11px; color:#9ca3af; text-align:center; line-height:1.7;">
        This email was sent automatically by FinLaya.<br/>
        ${unsubscribeText}
      </p>
    </td>
  </tr>
  `;
}

// ── CTA button ────────────────────────────────────────────────────────────────
function ctaButton(href, label) {
  return `
  <tr>
    <td style="padding:8px 32px 28px; text-align:center;">
      <a href="${href}"
         style="display:inline-block; background:#111827; color:#ffffff;
                font-size:13px; font-weight:600; padding:12px 28px;
                border-radius:8px; text-decoration:none; letter-spacing:0.2px;">
        ${label} &nbsp;&#8594;
      </a>
    </td>
  </tr>
  `;
}

// ── Outer wrapper — wraps the full email table ────────────────────────────────
function emailWrapper(innerRows) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0; padding:0; background:#f1f5f9;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f1f5f9; padding:32px 16px;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0"
       style="background:#ffffff; border-radius:12px; overflow:hidden;
              box-shadow:0 1px 6px rgba(0,0,0,0.07);">

  ${innerRows}

</table>
</td></tr>
</table>

</body>
</html>
  `;
}

// ── Progress bar (used in report category table + budget alert table) ─────────
function progressBar(pct) {
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
}

// ── NRs formatter ─────────────────────────────────────────────────────────────
const fmtNRs = (n) =>
  `NRs ${Math.round(Math.abs(n)).toLocaleString('en-IN')}`;

module.exports = {
  emailHeader,
  emailFooter,
  ctaButton,
  emailWrapper,
  progressBar,
  fmtNRs,
};