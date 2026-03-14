import { CreditCard, CheckCircle2, Clock } from 'lucide-react';
import { PreviewCard, EmptyRow, fmtNRs } from './ui';
import type { EMIRow } from './types';

interface Props {
  emis: EMIRow[];
}

export default function EMISection({ emis }: Props) {
  const totalMonthly = emis.reduce((s, e) => s + e.emi_amount, 0);
  const paidEmis     = emis.filter((e) => e.paid_this_month);
  const paidTotal    = paidEmis.reduce((s, e) => s + e.emi_amount, 0);

  return (
    <PreviewCard
      title="EMI / Loans"
      icon={<CreditCard size={15} className="text-blue-500" />}
      count={emis.length}
    >
      {emis.length === 0 ? (
        <EmptyRow text="No active loans" />
      ) : (
        <>
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
          </div>

          {/* Two-row footer */}
          <div className="mt-3 border-t border-gray-100 bg-gray-50 -mx-5 -mb-5 px-5 rounded-b-2xl overflow-hidden">

            {/* Row 1 — paid this month */}
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
              <span className="text-xs text-gray-400">
                Paid this month{' '}
                <span className="text-gray-300">·</span>{' '}
                <span className={paidEmis.length === emis.length ? 'text-emerald-500' : 'text-amber-500'}>
                  {paidEmis.length} of {emis.length} loans
                </span>
              </span>
              <span className={`text-sm font-bold tabular-nums ${paidEmis.length === emis.length ? 'text-emerald-600' : 'text-amber-600'}`}>
                {fmtNRs(paidTotal)}
              </span>
            </div>

            {/* Row 2 — total EMI / month */}
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-gray-400">Total EMI / month</span>
              <span className="text-sm font-bold text-gray-800 tabular-nums">
                {fmtNRs(totalMonthly)}
              </span>
            </div>

          </div>
        </>
      )}
    </PreviewCard>
  );
}