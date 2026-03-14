import { Target } from 'lucide-react';
import { PreviewCard, EmptyRow, fmtNRs } from './ui';
import type { GoalRow } from './types';

interface Props {
  goals: GoalRow[];
}

export default function GoalsSection({ goals }: Props) {
  const totalSaved  = goals.reduce((s, g) => s + g.saved_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const overallPct  = totalTarget > 0
    ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100)
    : 0;
  const completedCount = goals.filter((g) => g.saved_amount >= g.target_amount).length;

  return (
    <PreviewCard
      title="Savings & Goals"
      icon={<Target size={15} className="text-emerald-500" />}
      count={goals.length}
    >
      {goals.length === 0 ? (
        <EmptyRow text="No goals set up yet" />
      ) : (
        <>
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

          {/* Footer */}
          <div className="mt-3 border-t border-gray-100 bg-gray-50 -mx-5 -mb-5 px-5 rounded-b-2xl overflow-hidden">

            {/* Overall progress bar
            <div className="pt-3 pb-2">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-400">Overall progress</span>
                <span className="font-semibold text-gray-600">{overallPct}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-400 transition-all"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div> */}

            {/* Totals row */}
            {/* <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400">
                  Saved:{' '}
                  <span className="font-bold text-emerald-600 tabular-nums">{fmtNRs(totalSaved)}</span>
                </span>
                <span className="text-xs text-gray-400">
                  Target:{' '}
                  <span className="font-bold text-gray-700 tabular-nums">{fmtNRs(totalTarget)}</span>
                </span>
              </div>
              <span className="text-xs text-gray-400">
                <span className="font-semibold text-emerald-600">{completedCount}</span>
                {' '}of {goals.length} complete
              </span>
            </div> */}

          </div>
        </>
      )}
    </PreviewCard>
  );
}