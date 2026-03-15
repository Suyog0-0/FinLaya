const cron                                   = require('node-cron');
const { buildUserReport, getUsersForReport } = require('../services/reportService');
const { sendReportEmail }                    = require('../services/emailService');
const { supabaseAdmin }                      = require('../config/supabase');

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function insertReportNotification(userId, reportType, period, summary) {
  const isWeekly = reportType === 'weekly';
  const { topCategory, totalExpenses, totalIncome } = summary;

  const topCatText = topCategory
    ? ` Top category: ${topCategory.name} (NRs ${Math.round(topCategory.spent).toLocaleString('en-IN')}).`
    : '';

  const title   = isWeekly
    ? `Weekly report sent to your email`
    : `Monthly report sent to your email`;

  const message = `${period} · Spent NRs ${Math.round(totalExpenses).toLocaleString('en-IN')}, earned NRs ${Math.round(totalIncome).toLocaleString('en-IN')}.${topCatText}`;

  // dedup_key uses period so it only fires once per period
  const dedupKey = `${reportType}_report_${period.replace(/[\s–\/]/g, '_')}`;

  const { error } = await supabaseAdmin.from('notifications').insert({
    user_id:   userId,
    type:      'budget_alert',
    title,
    message,
    dedup_key: dedupKey,
    is_read:   false,
    severity:  'info',
    link:      '/reports',          // frontend uses this to navigate on click
  });

  if (error && error.code !== '23505') {
    console.error(`[reports] notification insert error for ${userId}:`, error.message);
  }
}

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
      const { period, summary } = await buildUserReport(user.userId, reportType);

      await sendReportEmail({
        toEmail:    user.email,
        userName:   user.userName,
        reportType,
        period,
        summary,
        appUrl:     APP_URL,
      });

      await insertReportNotification(user.userId, reportType, period, summary);

      console.log(`  ✓ ${reportType} report sent to ${user.email}`);
    } catch (err) {
      console.error(`  ✗ Failed for ${user.email}:`, err.message);
    }
  }

  console.log(`[reports] ${reportType} job complete.\n`);
}

function startReportScheduler() {
  // Every Monday at 8:00 AM
  cron.schedule('0 8 * * 1', () => runReportJob('weekly'),  { timezone: 'Asia/Kathmandu' });

  // 1st of every month at 8:00 AM
  cron.schedule('0 8 1 * *', () => runReportJob('monthly'), { timezone: 'Asia/Kathmandu' });

  console.log('✓ Report scheduler started (weekly: Mon 8am, monthly: 1st 8am, Asia/Kathmandu)');
}

module.exports = { startReportScheduler, runReportJob };