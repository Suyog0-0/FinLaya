import { FileText } from 'lucide-react';
import { PreviewCard, EmptyRow, fmtNRs } from './ui';
import type { CategoryBreakdown } from './types';

interface Props {
  categories: CategoryBreakdown[];
}

export default function CategorySection({ categories }: Props) {
  const withSpend = categories
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  return (
    <PreviewCard
      title="Category Breakdown"
      icon={<FileText size={15} className="text-orange-500" />}
    >
      {withSpend.length === 0 ? (
        <EmptyRow text="No category spending data available" />
      ) : (
        <div className="space-y-2.5">
          {withSpend.map((c) => {
            const pct  = c.budget > 0 ? Math.min((c.spent / c.budget) * 100, 100) : 0;
            const over = c.budget > 0 && c.spent > c.budget;
            return (
              <div key={c.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{c.name}</span>
                  <span className={over ? 'text-red-500 font-semibold' : 'text-gray-500'}>
                    {fmtNRs(c.spent)}
                    {c.budget > 0 ? ` / ${fmtNRs(c.budget)}` : ''}
                  </span>
                </div>
                {c.budget > 0 && (
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${over ? 'bg-red-400' : 'bg-orange-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PreviewCard>
  );
}