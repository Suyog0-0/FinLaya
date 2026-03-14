import { TrendingUp } from 'lucide-react';
import { PreviewCard, SimpleTable, EmptyRow, fmtNRs } from './ui';
import type { IncomeRow } from './types';

interface Props {
  income: IncomeRow[];
}

export default function IncomeSection({ income }: Props) {
  const total = income.reduce((s, i) => s + i.amount, 0);

  return (
    <PreviewCard
      title="Income"
      icon={<TrendingUp size={15} className="text-emerald-500" />}
      count={income.length}
    >
      {income.length === 0 ? (
        <EmptyRow text="No income recorded in this period" />
      ) : (
        <>
          <SimpleTable
            headers={['Description', 'Date', 'Amount']}
            rows={income.slice(0, 5).map((i) => [
              i.description,
              i.income_date,
              <span key="a" className="text-emerald-600 font-semibold">
                {fmtNRs(i.amount)}
              </span>,
            ])}
            more={Math.max(0, income.length - 5)}
          />

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 bg-gray-50 -mx-5 -mb-5 px-5 py-2.5 rounded-b-2xl">
            <span className="text-xs text-gray-400">
              {income.length} {income.length === 1 ? 'entry' : 'entries'}
            </span>
            <span className="text-sm font-bold text-emerald-600 tabular-nums">
              {fmtNRs(total)}
            </span>
          </div>
        </>
      )}
    </PreviewCard>
  );
}