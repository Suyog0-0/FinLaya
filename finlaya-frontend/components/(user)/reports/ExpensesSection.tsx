import { TrendingDown } from 'lucide-react';
import { PreviewCard, SimpleTable, EmptyRow, fmtNRs } from './ui';
import type { ExpenseRow } from './types';

interface Props {
  expenses: ExpenseRow[];
}

export default function ExpensesSection({ expenses }: Props) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <PreviewCard
      title="Expenses"
      icon={<TrendingDown size={15} className="text-red-500" />}
      count={expenses.length}
    >
      {expenses.length === 0 ? (
        <EmptyRow text="No expenses recorded in this period" />
      ) : (
        <>
          <SimpleTable
            headers={['Description', 'Category', 'Date', 'Amount']}
            rows={expenses.slice(0, 5).map((e) => [
              e.description,
              e.category_name || '—',
              e.expense_date,
              <span key="a" className="text-red-500 font-semibold">
                {fmtNRs(e.amount)}
              </span>,
            ])}
            more={Math.max(0, expenses.length - 5)}
          />

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 bg-gray-50 -mx-5 -mb-5 px-5 py-2.5 rounded-b-2xl">
            <span className="text-xs text-gray-400">
              {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}
            </span>
            <span className="text-sm font-bold text-red-500 tabular-nums">
              {fmtNRs(total)}
            </span>
          </div>
        </>
      )}
    </PreviewCard>
  );
}