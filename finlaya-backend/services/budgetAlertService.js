const { supabaseAdmin }        = require('../config/supabase');
const { sendBudgetAlertEmail } = require('./emailService');

// Returns current month start/end as ISO date strings
function currentMonthRange() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split('T')[0];
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString().split('T')[0];
  return { start, end };
}

// Checks if an email was already sent this month for this category+threshold.
// Uses a SEPARATE table from notifications — because the frontend also writes
// to the notifications table, which was causing false "already done" results.
async function wasEmailAlreadySent(userId, dedupKey) {
  const { data, error } = await supabaseAdmin
    .from('budget_alert_emails_sent')
    .select('id')
    .eq('user_id', userId)
    .eq('dedup_key', dedupKey)
    .maybeSingle();

  if (error) {
    console.error('[budgetAlert] wasEmailAlreadySent error:', error.message);
    return false;
  }

  return !!data;
}

// Records that an email was sent so we don't send it again this month
async function markEmailAsSent(userId, dedupKey) {
  const { error } = await supabaseAdmin
    .from('budget_alert_emails_sent')
    .insert({ user_id: userId, dedup_key: dedupKey });

  if (error && error.code !== '23505') {
    console.error('[budgetAlert] markEmailAsSent error:', error.message);
  }
}

// Also inserts into notifications table for the bell icon
// Frontend may have already done this — the unique index handles duplicates silently
async function insertNotification(userId, title, message, dedupKey, severity) {
  const { error } = await supabaseAdmin.from('notifications').insert({
    user_id:   userId,
    type:      'budget_alert',
    title,
    message,
    dedup_key: dedupKey,
    is_read:   false,
    severity,
    link:      '/categories',
  });

  if (error && error.code !== '23505') {
    console.error('[budgetAlert] notification insert error:', error.message);
  }
}

// Main function — checks one user's budgets and sends email for new alerts
async function checkAndSendBudgetAlerts(userId) {
  const { start, end } = currentMonthRange();

  const [
    { data: categories, error: catErr  },
    { data: expenses,   error: expErr  },
    { data: prefRow,    error: prefErr },
  ] = await Promise.all([
    supabaseAdmin
      .from('budget_categories')
      .select('category_id, category_name, budget_limit')
      .eq('user_id', userId),

    supabaseAdmin
      .from('expenses')
      .select('amount, category_id')
      .eq('user_id', userId)
      .gte('expense_date', start)
      .lte('expense_date', end),

    supabaseAdmin
      .from('notification_preferences')
      .select('budget_alerts')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  if (catErr)  console.error('[budgetAlert] categories error:', catErr.message);
  if (expErr)  console.error('[budgetAlert] expenses error:', expErr.message);
  if (prefErr) console.error('[budgetAlert] prefs error:', prefErr.message);

  // Default to true if no preferences row exists yet (new user)
  const budgetAlertsEnabled = prefRow?.budget_alerts ?? true;
  if (!budgetAlertsEnabled) {
    console.log(`[budgetAlert] Budget alert emails disabled for user ${userId}`);
    return;
  }

  if (!categories || !expenses) return;

  // Build spent map: category_id -> total spent this month
  const spentMap = {};
  for (const exp of expenses) {
    if (exp.category_id) {
      spentMap[exp.category_id] =
        (spentMap[exp.category_id] || 0) + Number(exp.amount);
    }
  }

  // Get user email and name from Supabase auth
  const { data: authUser, error: authErr } =
    await supabaseAdmin.auth.admin.getUserById(userId);

  if (authErr || !authUser?.user) {
    console.error('[budgetAlert] could not fetch user:', authErr?.message);
    return;
  }

  const email    = authUser.user.email;
  const userName =
    authUser.user.user_metadata?.full_name ||
    authUser.user.user_metadata?.name      ||
    email.split('@')[0];

  const now      = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const newAlerts = [];

  for (const cat of categories) {
    const budget = Number(cat.budget_limit);
    if (budget <= 0) continue;

    const spent = spentMap[cat.category_id] || 0;
    const pct   = spent / budget;

    let threshold = null;
    let severity  = 'warning';
    let title     = '';
    let message   = '';

    if (pct >= 1) {
      threshold = 'over';
      severity  = 'critical';
      title     = `${cat.category_name} budget exceeded`;
      message   = `You've spent NRs ${Math.round(spent).toLocaleString('en-IN')} — NRs ${Math.round(spent - budget).toLocaleString('en-IN')} over your NRs ${Math.round(budget).toLocaleString('en-IN')} budget.`;
    } else if (pct >= 0.9) {
      threshold    = '90pct';
      severity     = 'critical';
      const roundedPct = Math.round(pct * 100);
      title   = `${cat.category_name} at ${roundedPct}% of budget`;
      message = `You've used ${roundedPct}% of your NRs ${Math.round(budget).toLocaleString('en-IN')} ${cat.category_name} budget this month.`;
    } else if (pct >= 0.8) {
      threshold    = '80pct';
      severity     = 'warning';
      const roundedPct = Math.round(pct * 100);
      title   = `${cat.category_name} at ${roundedPct}% of budget`;
      message = `You've used ${roundedPct}% of your NRs ${Math.round(budget).toLocaleString('en-IN')} ${cat.category_name} budget this month.`;
    }

    if (!threshold) continue;

    // Bell icon notification dedup key (same as frontend uses)
    const notifDedupKey = `budget_${cat.category_id}_${monthKey}_${threshold}`;

    // Email dedup key — prefixed with "email_" so it's completely independent
    // of the notifications table that the frontend also writes to
    const emailDedupKey = `email_budget_${cat.category_id}_${monthKey}_${threshold}`;

    // Always ensure bell icon notification exists
    await insertNotification(userId, title, message, notifDedupKey, severity);

    // Only send email if we haven't already sent one for this threshold this month
    const alreadySent = await wasEmailAlreadySent(userId, emailDedupKey);
    if (!alreadySent) {
      newAlerts.push({ categoryName: cat.category_name, budget, spent, severity });
      await markEmailAsSent(userId, emailDedupKey);
    } else {
      console.log(`[budgetAlert] Email already sent for ${cat.category_name} (${threshold})`);
    }
  }

  if (newAlerts.length === 0) {
    console.log(`[budgetAlert] No new email alerts for ${email}`);
    return;
  }

  try {
    await sendBudgetAlertEmail({ toEmail: email, userName, alerts: newAlerts });
    console.log(`[budgetAlert] Email sent to ${email} with ${newAlerts.length} alert(s)`);
  } catch (err) {
    console.error(`[budgetAlert] Email send failed for ${email}:`, err.message);
  }
}

module.exports = { checkAndSendBudgetAlerts };