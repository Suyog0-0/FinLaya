'use client';

import { getBarColor } from './utils';

interface ProgressBarProps {
  spent: number;
  budget: number;
}

export default function ProgressBar({ spent, budget }: ProgressBarProps) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const barColor = getBarColor(spent, budget);
  const isOver = spent > budget && budget > 0;

  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-8 text-right tabular-nums ${isOver ? 'text-red-500' : 'text-gray-500'}`}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}