'use client';

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// import { LineChart, Line } from 'recharts';

const data = [
  { month: 'Jan', amount: 25000 },
  { month: 'Feb', amount: 15000 },
  { month: 'Mar', amount: 35000 },
  { month: 'Apr', amount: 38000 },
  { month: 'May', amount: 48000 },
  { month: 'Jun', amount: 42000 },
  { month: 'Jul', amount: 45000 },
];

export default function SpendingTrendChart() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Spending Trend</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="amount" 
            stroke="#f97316" 
            strokeWidth={3}
            fill="url(#colorAmount)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}