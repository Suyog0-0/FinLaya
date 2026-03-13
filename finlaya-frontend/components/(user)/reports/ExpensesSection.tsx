import { TrendingDown } from 'lucide-react';
import { PreviewCard, SimpleTable, EmptyRow, fmtNRs } from './ui';
import type { ExpenseRow } from './types';

interface Props {
  expenses: ExpenseRow[];
}

export default function ExpensesSection({ expenses }: Props) {
  return (
    <PreviewCard
      title="Expenses"
      icon={<TrendingDown size={15} className="text-red-500" />}
      count={expenses.length}
    >
      {expenses.length === 0 ? (
        <EmptyRow text="No expenses recorded in this period" />
      ) : (
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
      )}
    </PreviewCard>
  );
}