'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

import type { ReportData, ExpenseFromDB } from '@/components/(user)/reports/types';
import { fmtNRs } from '@/components/(user)/reports/ui';
import SummarySection  from '@/components/(user)/reports/SummarySection';
import IncomeSection   from '@/components/(user)/reports/IncomeSection';
import ExpensesSection from '@/components/(user)/reports/ExpensesSection';
import CategorySection from '@/components/(user)/reports/CategorySection';
import EMISection      from '@/components/(user)/reports/EMISection';
import GoalsSection    from '@/components/(user)/reports/GoalsSection';

// ─── Date range helpers ───────────────────────────────────────────────────────

type RangeKey = 'this_month' | 'last_month' | 'last_3_months' | 'this_year';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'this_month',    label: 'This Month'    },
  { key: 'last_month',    label: 'Last Month'    },
  { key: 'last_3_months', label: 'Last 3 Months' },
  { key: 'this_year',     label: 'This Year'     },
];

function getDateRange(key: RangeKey): { from: string; to: string; label: string } {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const fmt   = (d: Date) => d.toISOString().split('T')[0];

  switch (key) {
    case 'this_month':
      return {
        from:  fmt(new Date(year, month, 1)),
        to:    fmt(new Date(year, month + 1, 0)),
        label: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      };
    case 'last_month': {
      const lm = new Date(year, month - 1, 1);
      return {
        from:  fmt(new Date(year, month - 1, 1)),
        to:    fmt(new Date(year, month, 0)),
        label: lm.toLocaleString('default', { month: 'long', year: 'numeric' }),
      };
    }
    case 'last_3_months':
      return {
        from:  fmt(new Date(year, month - 2, 1)),
        to:    fmt(new Date(year, month + 1, 0)),
        label: 'Last 3 Months',
      };
    case 'this_year':
      return {
        from:  fmt(new Date(year, 0, 1)),
        to:    fmt(new Date(year, 11, 31)),
        label: `Year ${year}`,
      };
  }
}

// Returns the first and last day of the current month as ISO strings.
// Used to query emi_payment_logs with gte/lte instead of LIKE —
// because paid_month is a DATE column and LIKE does not work on dates in Postgres.
function currentMonthBounds(): { first: string; last: string } {
  const now = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const fmt   = (d: Date) => d.toISOString().split('T')[0];
  return {
    first: fmt(new Date(year, month, 1)),
    last:  fmt(new Date(year, month + 1, 0)),
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportsMainContent() {
  const { user } = useAuth();

  const [range, setRange]               = useState<RangeKey>('this_month');
  const [data, setData]                 = useState<ReportData | null>(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { from, to, label } = getDateRange(range);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    // Use gte/lte for the date column — .like() does not work on Postgres date types
    const { first: monthFirst, last: monthLast } = currentMonthBounds();

    const [expRes, incRes, catRes, emiRes, logRes, goalRes, userRes] = await Promise.all([
      supabase
        .from('expenses')
        .select('description, amount, expense_date, payment_method, budget_categories(category_name)')
        .eq('user_id', user.id)
        .gte('expense_date', from)
        .lte('expense_date', to)
        .order('expense_date', { ascending: false }),

      supabase
        .from('income')
        .select('description, amount, income_date, payment_method')
        .eq('user_id', user.id)
        .gte('income_date', from)
        .lte('income_date', to)
        .order('income_date', { ascending: false }),

      supabase
        .from('budget_categories')
        .select('category_name, budget_limit')
        .eq('user_id', user.id),

      supabase
        .from('emi_payments')
        .select('emi_id, loan_name, emi_amount, total_amount, payment_day, start_date, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true),

      // Fix: paid_month is a DATE column — use gte/lte, not .like()
      // This matches exactly how isPaidThisMonth works in utils.ts
      supabase
        .from('emi_payment_logs')
        .select('emi_id')
        .eq('user_id', user.id)
        .gte('paid_month', monthFirst)
        .lte('paid_month', monthLast),

      supabase
        .from('goals')
        .select('title, target_amount, saved_amount')
        .eq('user_id', user.id),

      supabase
        .from('users')
        .select('monthly_salary')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    // Set of emi_ids paid this month
    const paidEmiIds = new Set((logRes.data || []).map((l) => l.emi_id));

    // budget_categories is many-to-one → Supabase returns a SINGLE OBJECT not array
    const rawExpenses = (expRes.data || []) as unknown as ExpenseFromDB[];

    const spentMap: Record<string, number> = {};
    for (const e of rawExpenses) {
      const name = e.budget_categories?.category_name ?? null;
      if (name) spentMap[name] = (spentMap[name] || 0) + Number(e.amount);
    }

    setData({
      expenses: rawExpenses.map((e) => ({
        description:    e.description,
        amount:         Number(e.amount),
        expense_date:   e.expense_date,
        payment_method: e.payment_method,
        category_name:  e.budget_categories?.category_name ?? null,
      })),

      income: (incRes.data || []).map((i) => ({
        description:    i.description,
        amount:         Number(i.amount),
        income_date:    i.income_date,
        payment_method: i.payment_method,
      })),

      categories: (catRes.data || []).map((c) => ({
        name:   c.category_name,
        spent:  spentMap[c.category_name] || 0,
        budget: Number(c.budget_limit),
      })),

      emis: (emiRes.data || []).map((e) => ({
        emi_id:          e.emi_id,
        loan_name:       e.loan_name,
        emi_amount:      Number(e.emi_amount),
        total_amount:    Number(e.total_amount),
        payment_day:     e.payment_day,
        start_date:      e.start_date,
        is_active:       e.is_active,
        paid_this_month: paidEmiIds.has(e.emi_id),
      })),

      goals: (goalRes.data || []).map((g) => ({
        title:         g.title,
        target_amount: Number(g.target_amount),
        saved_amount:  Number(g.saved_amount),
      })),

      salary: Number(userRes.data?.monthly_salary ?? 0),
    });

    setIsLoading(false);
  }, [user?.id, from, to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived totals ─────────────────────────────────────────────────────────

  const totalExpenses = data?.expenses.reduce((s, e) => s + e.amount, 0) ?? 0;
  const totalIncome   = (data?.income.reduce((s, i) => s + i.amount, 0) ?? 0) + (data?.salary ?? 0);
  const totalEMI      = data?.emis.reduce((s, e) => s + e.emi_amount, 0) ?? 0;
  const netBalance    = totalIncome - totalExpenses - totalEMI;

  // ── PDF ───────────────────────────────────────────────────────────────────

  const handleDownload = async () => {
    if (!data) return;
    setIsGenerating(true);

    const { default: jsPDF }     = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const PAGE_H = 297; // A4 height mm
    const FOOTER = 12;  // space reserved at bottom for footer
    const PW = 210;
    const M  = 16;
    const CW = PW - M * 2;

    type RGB = [number, number, number];
    const ORANGE  : RGB = [249, 115,  22];
    const ORANGE_D: RGB = [234,  88,  12];
    const ORANGE_L: RGB = [255, 237, 213];
    const WHITE   : RGB = [255, 255, 255];
    const DARK    : RGB = [ 17,  24,  39];
    const MID     : RGB = [107, 114, 128];
    const GRAY100 : RGB = [243, 244, 246];
    const GRAY200 : RGB = [229, 231, 235];
    const GREEN   : RGB = [ 22, 163,  74];
    const RED     : RGB = [239,  68,  68];

    // ── Header ────────────────────────────────────────────────────────────
    doc.setFillColor(...ORANGE);
    doc.rect(0, 0, PW, 28, 'F');
    doc.setFillColor(...ORANGE_D);
    doc.rect(0, 22, PW, 6, 'F');

    doc.setTextColor(...WHITE);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FinLaya', M, 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 220, 180);
    doc.text('Financial Report', M + 33, 14);

    doc.setTextColor(...WHITE);
    doc.setFontSize(7.5);
    doc.text(`${label}  ·  ${from}  →  ${to}`, M, 19.5);
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      PW - M, 19.5, { align: 'right' }
    );

    let y = 34;

    // ── Summary card ──────────────────────────────────────────────────────
    doc.setFillColor(...ORANGE_L);
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y, CW, 28, 3, 3, 'FD');

    const colW = CW / 4;
    const summaryItems: { label: string; value: string; color: RGB }[] = [
      { label: 'Total Income',   value: fmtNRs(totalIncome),   color: GREEN },
      { label: 'Total Expenses', value: fmtNRs(totalExpenses), color: RED   },
      { label: 'Monthly EMIs',   value: fmtNRs(totalEMI),      color: DARK  },
      { label: 'Net Balance',    value: fmtNRs(netBalance),    color: netBalance >= 0 ? GREEN : RED },
    ];

    summaryItems.forEach((item, i) => {
      const x = M + i * colW + colW / 2;
      if (i > 0) {
        doc.setDrawColor(...GRAY200);
        doc.setLineWidth(0.3);
        doc.line(M + i * colW, y + 4, M + i * colW, y + 24);
      }
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MID);
      doc.text(item.label, x, y + 10, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...item.color);
      doc.text(item.value, x, y + 20, { align: 'center' });
    });

    y += 36;

    // ── Helpers ───────────────────────────────────────────────────────────

    // If less than `needed` mm remain on the page, add a new page.
    // This prevents a heading from appearing alone at the bottom of a page.
    const ensureSpace = (needed: number) => {
      if (y + needed > PAGE_H - FOOTER) {
        doc.addPage();
        y = 16;
      }
    };

    // Section heading — always ensure at least 50mm below it for the table
    const section = (title: string) => {
      ensureSpace(50);
      y += 2;
      doc.setFillColor(...ORANGE);
      doc.rect(M, y, 3, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...DARK);
      doc.text(title, M + 6, y + 4.5);
      doc.setDrawColor(...GRAY200);
      doc.setLineWidth(0.3);
      doc.line(M, y + 7, M + CW, y + 7);
      y += 12;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const afterTable = () => { y = (doc as any).lastAutoTable.finalY + 6; };

    const noData = (msg: string) => {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...MID);
      doc.text(msg, M + 4, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);
      y += 8;
    };

    const tbl = {
      margin: { left: M, right: M },
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
        textColor: DARK,
        lineColor: GRAY200,
        lineWidth: 0.2,
        font: 'helvetica',
      } as const,
      headStyles: {
        fillColor: GRAY100,
        textColor: DARK,
        fontStyle: 'bold' as const,
        lineColor: GRAY200,
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: WHITE },
      tableLineColor: GRAY200,
      tableLineWidth: 0.2,
    };

    // ── 1. Income ─────────────────────────────────────────────────────────
    section('Income');
    if (data.income.length === 0) {
      noData('No income recorded in this period.');
    } else {
      autoTable(doc, {
        ...tbl, startY: y,
        head: [['Description', 'Date', 'Payment Method', 'Amount']],
        body: data.income.map((i) => [i.description, i.income_date, i.payment_method || '—', fmtNRs(i.amount)]),
        columnStyles: { 3: { halign: 'right' as const, fontStyle: 'bold' as const } },
      });
      afterTable();
    }

    // ── 2. Expenses ───────────────────────────────────────────────────────
    section('Expenses');
    if (data.expenses.length === 0) {
      noData('No expenses recorded in this period.');
    } else {
      autoTable(doc, {
        ...tbl, startY: y,
        head: [['Description', 'Category', 'Date', 'Method', 'Amount']],
        body: data.expenses.map((e) => [
          e.description, e.category_name || '—', e.expense_date, e.payment_method || '—', fmtNRs(e.amount),
        ]),
        columnStyles: { 4: { halign: 'right' as const, fontStyle: 'bold' as const } },
      });
      afterTable();
    }

    // ── 3. Category Breakdown ─────────────────────────────────────────────
    section('Category-wise Breakdown');
    const catsWithData = data.categories.filter((c) => c.spent > 0 || c.budget > 0);
    if (catsWithData.length === 0) {
      noData('No category data available.');
    } else {
      autoTable(doc, {
        ...tbl, startY: y,
        head: [['Category', 'Budget', 'Spent', 'Remaining', 'Status']],
        body: catsWithData.map((c) => {
          const rem    = c.budget - c.spent;
          const status = c.budget <= 0 ? '—' : rem >= 0 ? 'On track' : 'Over budget';
          return [c.name, c.budget > 0 ? fmtNRs(c.budget) : '—', fmtNRs(c.spent), c.budget > 0 ? fmtNRs(rem) : '—', status];
        }),
        columnStyles: {
          1: { halign: 'right'  as const },
          2: { halign: 'right'  as const },
          3: { halign: 'right'  as const },
          4: { halign: 'center' as const },
        },
        didParseCell: (d) => {
          if (d.section === 'body' && d.column.index === 4) {
            d.cell.styles.textColor = d.cell.raw === 'Over budget' ? RED : d.cell.raw === 'On track' ? GREEN : MID;
            if (d.cell.raw !== '—') d.cell.styles.fontStyle = 'bold';
          }
        },
      });
      afterTable();
    }

    // ── 4. EMI / Loans ────────────────────────────────────────────────────
    section('EMI / Loan Details');
    if (data.emis.length === 0) {
      noData('No active loans.');
    } else {
      autoTable(doc, {
        ...tbl, startY: y,
        head: [['Loan Name', 'Monthly EMI', 'Total Amount', 'Est. Months', 'Due Day', 'This Month']],
        body: data.emis.map((e) => [
          e.loan_name,
          fmtNRs(e.emi_amount),
          fmtNRs(e.total_amount),
          e.emi_amount > 0 ? String(Math.ceil(e.total_amount / e.emi_amount)) : '—',
          e.payment_day ? `Day ${e.payment_day}` : '—',
          e.paid_this_month ? 'Paid ✓' : 'Pending',
        ]),
        columnStyles: {
          1: { halign: 'right'  as const },
          2: { halign: 'right'  as const },
          3: { halign: 'center' as const },
          5: { halign: 'center' as const },
        },
        didParseCell: (d) => {
          if (d.section === 'body' && d.column.index === 5) {
            d.cell.styles.textColor = d.cell.raw === 'Paid ✓' ? GREEN : RED;
            d.cell.styles.fontStyle = 'bold';
          }
        },
      });
      afterTable();
    }

    // ── 5. Goals ──────────────────────────────────────────────────────────
    section('Savings & Goals');
    if (data.goals.length === 0) {
      noData('No goals set up yet.');
    } else {
      autoTable(doc, {
        ...tbl, startY: y,
        head: [['Goal', 'Target', 'Saved', 'Remaining', 'Progress']],
        body: data.goals.map((g) => {
          const rem = Math.max(0, g.target_amount - g.saved_amount);
          const pct = g.target_amount > 0
            ? `${Math.min(Math.round((g.saved_amount / g.target_amount) * 100), 100)}%`
            : '—';
          return [g.title, fmtNRs(g.target_amount), fmtNRs(g.saved_amount), fmtNRs(rem), pct];
        }),
        columnStyles: {
          1: { halign: 'right'  as const },
          2: { halign: 'right'  as const },
          3: { halign: 'right'  as const },
          4: { halign: 'center' as const, fontStyle: 'bold' as const },
        },
        didParseCell: (d) => {
          if (d.section === 'body' && d.column.index === 4) {
            d.cell.styles.textColor = GREEN;
          }
        },
      });
    }

    // ── Footer on every page ──────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalPages = (doc as any).internal.getNumberOfPages() as number;
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(...GRAY200);
      doc.setLineWidth(0.3);
      doc.line(M, 288, PW - M, 288);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MID);
      doc.text(`Page ${p} of ${totalPages}`, PW - M, 292, { align: 'right' });
    }

    doc.save(`FinLaya_Report_${range}_${new Date().toISOString().split('T')[0]}.pdf`);
    setIsGenerating(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── Page header — title + period dropdown + download button ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Reports</h1>
            <p className="text-gray-500 text-sm mt-1">Your financial summary</p>
          </div>

          {/* Right side: dropdown + download */}
          <div className="flex items-center gap-2">

            {/* Period dropdown */}
            <div className="relative">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value as RangeKey)}
                className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-4 py-2.5 pr-8 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 cursor-pointer transition-all"
              >
                {RANGES.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
              {/* Custom chevron */}
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Download button — icon only with tooltip on hover */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              disabled={isGenerating || isLoading || !data}
              title="Download PDF report"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <Download size={16} />
              )}
            </motion.button>
          </div>
        </div>

        {/* Period label shown below header as small text */}
        <p className="text-xs text-gray-400 mb-6">{from} → {to}</p>

        {/* Skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-3" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-3 bg-gray-50 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sections */}
        {!isLoading && data && (
          <div className="space-y-5">
            <SummarySection
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              totalEMI={totalEMI}
              netBalance={netBalance}
            />
            <IncomeSection    income={data.income}         />
            <ExpensesSection  expenses={data.expenses}     />
            <CategorySection  categories={data.categories} />
            <EMISection       emis={data.emis}             />
            <GoalsSection     goals={data.goals}           />
          </div>
        )}

      </div>
    </div>
  );
}