import { TrendingUp } from 'lucide-react';
import { PreviewCard, SimpleTable, EmptyRow, fmtNRs } from './ui';
import type { IncomeRow } from './types';

interface Props {
  income: IncomeRow[];
}

export default function IncomeSection({ income }: Props) {
  return (
    <PreviewCard
      title="Income"
      icon={<TrendingUp size={15} className="text-emerald-500" />}
      count={income.length}
    >
      {income.length === 0 ? (
        <EmptyRow text="No income recorded in this period" />
      ) : (
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
      )}
    </PreviewCard>
  );
}