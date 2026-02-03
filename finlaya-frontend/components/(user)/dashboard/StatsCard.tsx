import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  amount: string;
  percentage: string;
  isPositive: boolean;
  icon: LucideIcon;
  iconBg: string;
}

export default function StatsCard({ title, amount, percentage, isPositive, icon: Icon, iconBg }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconBg}`}>
          <Icon size={24} className="text-orange-600" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          <span>{isPositive ? '↑' : '↓'}</span>
          <span>{percentage}</span>
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900 mb-1">{amount}</h3>
        <p className="text-gray-500 text-sm">{title}</p>
      </div>
    </div>
  );
}