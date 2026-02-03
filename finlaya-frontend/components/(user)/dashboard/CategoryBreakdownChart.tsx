'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
// import Legend from 'recharts';


const data = [
  { name: 'Housing', value: 15000, color: '#fb923c' },
  { name: 'Food', value: 8000, color: '#fbbf24' },
  { name: 'Transport', value: 4000, color: '#fcd34d' },
  { name: 'Entertainment', value: 3000, color: '#f97316' },
  { name: 'Others', value: 2400, color: '#9ca3af' },
];

export default function CategoryBreakdownChart() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Category Breakdown</h2>
      
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Pie Chart */}
        <div className="w-full lg:w-1/2">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full lg:w-1/2 space-y-3">
          {data.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm text-gray-700">{category.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                NRs {category.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}