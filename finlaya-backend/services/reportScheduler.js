const cron                              = require('node-cron');
const { buildUserReport, getUsersForReport } = require('../services/reportService');
const { sendReportEmail }               = require('../services/emailService');
const { supabaseAdmin }                 = require('../config/supabase');

// ── Insert a bell notification after email is sent ────────────────────────────
async function insertReportNotification(userId, reportType, period, summary) {
  const isWeekly = reportType === 'weekly';
  const { topCategory, totalExpenses, totalIncome } = summary;

  const title = isWeekly
    ? `Weekly report sent to your email`
    : `Monthly report sent to your email`;

  const topCatText = topCategory
    ? ` Top category: ${topCategory.name} (NRs ${Math.round(topCategory.spent).toLocaleString('en-IN')}).`
    : '';

  const message = isWeekly
    ? `${period} · Spent NRs ${Math.round(totalExpenses).toLocaleString('en-IN')}, earned NRs ${Math.round(totalIncome).toLocaleString('en-IN')}.${topCatText}`
    : `${period} · Spent NRs ${Math.round(totalExpenses).toLocaleString('en-IN')}, earned NRs ${Math.round(totalIncome).toLocaleString('en-IN')}.${topCatText}`;

  const dedupKey = `${reportType}_report_${period.replace(/\s|–/g, '_')}`;

  const { error } = await supabaseAdmin.from('notifications').insert({
    user_id:   userId,
    type:      'budget_alert',      // reuse existing type — shows in bell normally
    title,
    message,
    dedup_key: dedupKey,
    is_read:   false,
    severity:  'info',
  });

  // Silently ignore duplicate (report already sent this period)
  if (error && error.code !== '23505') {
    console.error(`[reports] Failed to insert notification for ${userId}:`, error.message);
  }
}

// ── Core: run a report job for all opted-in users ─────────────────────────────
async function runReportJob(reportType) {
  console.log(`\n[reports] Starting ${reportType} report job...`);

  let users;
  try {
    users = await getUsersForReport(reportType);
  } catch (err) {
    console.error(`[reports] Failed to fetch users:`, err.message);
    return;
  }

  if (users.length === 0) {
    console.log(`[reports] No users to send ${reportType} reports to.`);
    return;
  }

  console.log(`[reports] Sending ${reportType} reports to ${users.length} user(s)...`);

  for (const user of users) {
    try {
      // 1. Build summary data
      const { period, summary } = await buildUserReport(user.userId, reportType);

      // 2. Send email
      await sendReportEmail({
        toEmail:    user.email,
        userName:   user.userName,
        reportType,
        period,
        summary,
      });

      // 3. Insert bell notification
      await insertReportNotification(user.userId, reportType, period, summary);

      console.log(`  ✓ ${reportType} report sent to ${user.email}`);
    } catch (err) {
      console.error(`  ✗ Failed for ${user.email}:`, err.message);
      // Continue to next user even if one fails
    }
  }

  console.log(`[reports] ${reportType} report job complete.\n`);
}

// ── Schedule jobs ──────────────────────────────────────────────────────────────
function startReportScheduler() {
  // Weekly: every Monday at 8:00 AM
  // Cron: minute hour dayOfMonth month dayOfWeek
  cron.schedule('0 8 * * 1', () => {
    runReportJob('weekly');
  }, {
    timezone: 'Asia/Kathmandu',
  });

  // Monthly: 1st of every month at 8:00 AM
  cron.schedule('0 8 1 * *', () => {
    runReportJob('monthly');
  }, {
    timezone: 'Asia/Kathmandu',
  });

  console.log('✓ Report scheduler started (weekly: Mon 8am, monthly: 1st 8am, Asia/Kathmandu)');
}

module.exports = { startReportScheduler, runReportJob };