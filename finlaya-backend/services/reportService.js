const { supabaseAdmin } = require('../config/supabase');

// ── Get date range for the report period ──────────────────────────────────────
function getDateRange(reportType) {
  const now   = new Date();
  let start, end, periodLabel;

  if (reportType === 'weekly') {
    // Last 7 days
    end   = new Date(now);
    start = new Date(now);
    start.setDate(start.getDate() - 7);

    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    periodLabel = `${fmt(start)} – ${fmt(end)}`;

  } else {
    // Last full calendar month
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    end   = new Date(firstOfThisMonth.getTime() - 1); // last ms of prev month
    start = new Date(end.getFullYear(), end.getMonth(), 1);

    periodLabel = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  return {
    start:       start.toISOString().split('T')[0],
    end:         end.toISOString().split('T')[0],
    periodLabel,
  };
}

// ── Build report summary for one user ─────────────────────────────────────────
async function buildUserReport(userId, reportType) {
  const { start, end, periodLabel } = getDateRange(reportType);

  // Fetch all data in parallel
  const [
    { data: expenses },
    { data: income   },
    { data: cats     },
    { data: emis     },
  ] = await Promise.all([
    supabaseAdmin
      .from('expenses')
      .select('amount, category_id')
      .eq('user_id', userId)
      .gte('expense_date', start)
      .lte('expense_date', end),

    supabaseAdmin
      .from('income')
      .select('amount')
      .eq('user_id', userId)
      .gte('income_date', start)
      .lte('income_date', end),

    supabaseAdmin
      .from('budget_categories')
      .select('category_id, category_name, budget_limit')
      .eq('user_id', userId),

    supabaseAdmin
      .from('emi_payments')
      .select('emi_id')
      .eq('user_id', userId)
      .eq('is_active', true),
  ]);

  // Totals
  const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome   = (income   || []).reduce((s, i) => s + Number(i.amount), 0);
  const totalSavings  = totalIncome - totalExpenses;

  // Category breakdown — spent per category + budget
  const spentMap = {};
  for (const e of (expenses || [])) {
    if (e.category_id)
      spentMap[e.category_id] = (spentMap[e.category_id] || 0) + Number(e.amount);
  }

  const categoryBreakdown = (cats || [])
    .map((cat) => ({
      name:   cat.category_name,
      spent:  spentMap[cat.category_id] || 0,
      budget: Number(cat.budget_limit),
    }))
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  return {
    period: periodLabel,
    summary: {
      totalIncome,
      totalExpenses,
      totalSavings,
      topCategory,
      categoryBreakdown,
      activeEMIs: (emis || []).length,
    },
  };
}

// ── Get all users who have a given report type enabled ────────────────────────
async function getUsersForReport(reportType) {
  const prefColumn = reportType === 'weekly' ? 'weekly_reports' : 'monthly_reports';

  // Get user IDs with preference enabled
  const { data: prefs, error: prefError } = await supabaseAdmin
    .from('notification_preferences')
    .select('user_id')
    .eq(prefColumn, true);

  if (prefError || !prefs || prefs.length === 0) {
    console.log(`[reports] No users opted in for ${reportType} reports`);
    return [];
  }

  const userIds = prefs.map((p) => p.user_id);

  // Get their email + name from auth.users via admin API
  const users = [];
  for (const userId of userIds) {
    const { data: authUser, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !authUser?.user) continue;

    const email    = authUser.user.email;
    const userName =
      authUser.user.user_metadata?.full_name ||
      authUser.user.user_metadata?.name      ||
      email.split('@')[0];

    users.push({ userId, email, userName });
  }

  return users;
}

module.exports = { buildUserReport, getUsersForReport };