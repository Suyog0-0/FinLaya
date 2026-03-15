const { supabaseAdmin } = require('../config/supabase');

function getDateRange(reportType) {
  const now = new Date();
  let start, end, periodLabel;

  if (reportType === 'weekly') {
    end   = new Date(now);
    start = new Date(now);
    start.setDate(start.getDate() - 7);
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    periodLabel = `${fmt(start)} – ${fmt(end)}`;
  } else {
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    end   = new Date(firstOfThisMonth.getTime() - 1);
    start = new Date(end.getFullYear(), end.getMonth(), 1);
    periodLabel = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  return {
    start:       start.toISOString().split('T')[0],
    end:         end.toISOString().split('T')[0],
    periodLabel,
  };
}

async function buildUserReport(userId, reportType) {
  const { start, end, periodLabel } = getDateRange(reportType);

  // Current month bounds for EMI payment logs
  const now        = new Date();
  const monthFirst = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthLast  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [
    { data: expenses,  error: expErr  },
    { data: income,    error: incErr  },
    { data: cats,      error: catErr  },
    { data: emis,      error: emiErr  },
    { data: emiLogs,   error: logErr  },
    { data: goals,     error: goalErr },
  ] = await Promise.all([
    supabaseAdmin
      .from('expenses')
      .select('description, amount, expense_date, payment_method, category_id')
      .eq('user_id', userId)
      .gte('expense_date', start)
      .lte('expense_date', end)
      .order('expense_date', { ascending: false }),

    supabaseAdmin
      .from('income')
      .select('description, amount, income_date, payment_method')
      .eq('user_id', userId)
      .gte('income_date', start)
      .lte('income_date', end)
      .order('income_date', { ascending: false }),

    supabaseAdmin
      .from('budget_categories')
      .select('category_id, category_name, budget_limit')
      .eq('user_id', userId),

    supabaseAdmin
      .from('emi_payments')
      .select('emi_id, loan_name, emi_amount, total_amount, payment_day')
      .eq('user_id', userId)
      .eq('is_active', true),

    supabaseAdmin
      .from('emi_payment_logs')
      .select('emi_id')
      .eq('user_id', userId)
      .gte('paid_month', monthFirst)
      .lte('paid_month', monthLast),

    supabaseAdmin
      .from('goals')
      .select('title, target_amount, saved_amount')
      .eq('user_id', userId),
  ]);

  // Log any errors so we can debug
  if (expErr)  console.error('[reportService] expenses error:',  expErr.message);
  if (incErr)  console.error('[reportService] income error:',    incErr.message);
  if (catErr)  console.error('[reportService] categories error:', catErr.message);
  if (emiErr)  console.error('[reportService] emis error:',      emiErr.message);
  if (logErr)  console.error('[reportService] emi logs error:',  logErr.message);
  if (goalErr) console.error('[reportService] goals error:',     goalErr.message);

  // Build category name map from category_id
  const catMap = {};
  for (const c of (cats || [])) catMap[c.category_id] = c.category_name;

  // Attach category name to each expense row
  const expenseRows = (expenses || []).map((e) => ({
    ...e,
    category_name: catMap[e.category_id] || null,
  }));

  // Totals
  const totalExpenses = expenseRows.reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome   = (income || []).reduce((s, i) => s + Number(i.amount), 0);
  const totalSavings  = totalIncome - totalExpenses;

  // Spent per category
  const spentMap = {};
  for (const e of expenseRows) {
    if (e.category_id)
      spentMap[e.category_id] = (spentMap[e.category_id] || 0) + Number(e.amount);
  }

  const categoryBreakdown = (cats || [])
    .map((cat) => ({
      name:   cat.category_name,
      spent:  spentMap[cat.category_id] || 0,
      budget: Number(cat.budget_limit),
    }))
    .filter((c) => c.spent > 0 || c.budget > 0)
    .sort((a, b) => b.spent - a.spent);

  const topCategory = categoryBreakdown.find(c => c.spent > 0) || null;

  // EMIs with paid status
  const paidIds = new Set((emiLogs || []).map(l => l.emi_id));
  const emiRows = (emis || []).map(e => ({
    ...e,
    paid_this_month: paidIds.has(e.emi_id),
  }));

  const goalRows = (goals || []).map(g => ({
    title:         g.title,
    target_amount: Number(g.target_amount),
    saved_amount:  Number(g.saved_amount),
  }));

  console.log(`[reportService] ${reportType} report for ${userId}: income=${totalIncome}, expenses=${totalExpenses}, incomeRows=${(income||[]).length}, expenseRows=${expenseRows.length}`);

  return {
    period: periodLabel,
    summary: {
      totalIncome,
      totalExpenses,
      totalSavings,
      topCategory,
      categoryBreakdown,
      activeEMIs:  emiRows.length,
      incomeRows:  income  || [],
      expenseRows,
      emiRows,
      goalRows,
    },
  };
}

async function getUsersForReport(reportType) {
  const prefColumn = reportType === 'weekly' ? 'weekly_reports' : 'monthly_reports';

  const { data: prefs, error: prefError } = await supabaseAdmin
    .from('notification_preferences')
    .select('user_id')
    .eq(prefColumn, true);

  if (prefError) {
    console.error('[reportService] preferences query error:', prefError.message);
    return [];
  }

  if (!prefs || prefs.length === 0) {
    console.log(`[reports] No users opted in for ${reportType} reports`);
    return [];
  }

  const users = [];
  for (const { user_id } of prefs) {
    const { data: authUser, error } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (error || !authUser?.user) {
      console.error(`[reportService] Could not fetch auth user ${user_id}:`, error?.message);
      continue;
    }

    const email    = authUser.user.email;
    const userName =
      authUser.user.user_metadata?.full_name ||
      authUser.user.user_metadata?.name      ||
      email.split('@')[0];

    users.push({ userId: user_id, email, userName });
  }

  return users;
}

module.exports = { buildUserReport, getUsersForReport };