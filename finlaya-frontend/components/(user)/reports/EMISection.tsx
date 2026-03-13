import { CreditCard, CheckCircle2, Clock } from 'lucide-react';
import { PreviewCard, EmptyRow, fmtNRs } from './ui';
import type { EMIRow } from './types';

interface Props {
  emis: EMIRow[];
}

export default function EMISection({ emis }: Props) {
  return (
    <PreviewCard
      title="EMI / Loans"
      icon={<CreditCard size={15} className="text-blue-500" />}
      count={emis.length}
    >
      {emis.length === 0 ? (
        <EmptyRow text="No active loans" />
      ) : (
        <div className="space-y-2.5">
          {emis.map((e) => (
            <div
              key={e.emi_id}
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              {/* Left: name + status badge */}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    e.paid_this_month
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {e.paid_this_month
                    ? <CheckCircle2 size={13} />
                    : <Clock size={13} />
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{e.loan_name}</p>
                  <p className="text-[10px] text-gray-400">
                    {e.paid_this_month ? 'Paid this month' : 'Due this month'}
                    {e.payment_day ? ` · Due day ${e.payment_day}` : ''}
                  </p>
                </div>
              </div>

              {/* Right: amount */}
              <div className="text-right flex-shrink-0 ml-3">
                <p className="text-xs font-bold text-gray-800">{fmtNRs(e.emi_amount)}</p>
                <p className="text-[10px] text-gray-400">/ month</p>
              </div>
            </div>
          ))}

          {/* Summary row */}
          <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {emis.filter((e) => e.paid_this_month).length} of {emis.length} paid this month
            </span>
            <span className="text-xs font-bold text-gray-800">
              Total: {fmtNRs(emis.reduce((s, e) => s + e.emi_amount, 0))}
            </span>
          </div>
        </div>
      )}
    </PreviewCard>
  );
}