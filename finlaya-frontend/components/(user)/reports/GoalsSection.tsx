import { Target } from 'lucide-react';
import { PreviewCard, EmptyRow, fmtNRs } from './ui';
import type { GoalRow } from './types';

interface Props {
  goals: GoalRow[];
}

export default function GoalsSection({ goals }: Props) {
  return (
    <PreviewCard
      title="Savings & Goals"
      icon={<Target size={15} className="text-emerald-500" />}
      count={goals.length}
    >
      {goals.length === 0 ? (
        <EmptyRow text="No goals set up yet" />
      ) : (
        <div className="space-y-3.5">
          {goals.map((g) => {
            const pct = g.target_amount > 0
              ? Math.min(Math.round((g.saved_amount / g.target_amount) * 100), 100)
              : 0;
            const isComplete = g.saved_amount >= g.target_amount;
            const remaining  = Math.max(0, g.target_amount - g.saved_amount);

            return (
              <div key={g.title}>
                {/* Title row */}
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-800">{g.title}</span>
                    {isComplete && (
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                        COMPLETE
                      </span>
                    )}
                  </div>
                  <span className={`font-semibold ${isComplete ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {pct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full ${isComplete ? 'bg-emerald-400' : 'bg-orange-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Amounts row */}
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>
                    Saved: <span className="font-semibold text-gray-600">{fmtNRs(g.saved_amount)}</span>
                  </span>
                  {!isComplete && (
                    <span>
                      Left: <span className="font-semibold text-orange-500">{fmtNRs(remaining)}</span>
                    </span>
                  )}
                  <span>
                    Target: <span className="font-semibold text-gray-600">{fmtNRs(g.target_amount)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PreviewCard>
  );
}