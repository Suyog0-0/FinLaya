import { TrendingUp, TrendingDown, CreditCard, PiggyBank, FileText } from 'lucide-react';
import { PreviewCard, fmtNRs } from './ui';

interface Props {
  totalIncome:   number;
  totalExpenses: number;
  totalEMI:      number;
  netBalance:    number;
}

export default function SummarySection({
  totalIncome, totalExpenses, totalEMI, netBalance,
}: Props) {
  const stats = [
    {
      label: 'Total Income',
      value: fmtNRs(totalIncome),
      color: 'text-emerald-600',
      icon: <TrendingUp size={14} />,
    },
    {
      label: 'Total Expenses',
      value: fmtNRs(totalExpenses),
      color: 'text-red-500',
      icon: <TrendingDown size={14} />,
    },
    {
      label: 'Monthly EMIs',
      value: fmtNRs(totalEMI),
      color: 'text-blue-600',
      icon: <CreditCard size={14} />,
    },
    {
      label: 'Net Balance',
      value: fmtNRs(netBalance),
      color: netBalance >= 0 ? 'text-emerald-600' : 'text-red-500',
      icon: <PiggyBank size={14} />,
    },
  ];

  return (
    <PreviewCard title="Summary" icon={<FileText size={15} className="text-orange-500" />}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"
          >
            <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
            <p className={`text-base font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </PreviewCard>
  );
}