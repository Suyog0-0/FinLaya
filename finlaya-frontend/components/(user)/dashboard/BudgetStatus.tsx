interface BudgetItem {
  category: string;
  spent: number;
  budget: number;
  color: string;
}

const budgetData: BudgetItem[] = [
  { category: 'Housing', spent: 15000, budget: 15000, color: 'bg-orange-500' },
  { category: 'Food', spent: 6800, budget: 8000, color: 'bg-amber-400' },
  { category: 'Transport', spent: 2800, budget: 4000, color: 'bg-orange-500' },
  { category: 'Entertainment', spent: 3500, budget: 3000, color: 'bg-red-500' },
  { category: 'Savings', spent: 8000, budget: 10000, color: 'bg-orange-500' },
];

export default function BudgetStatus() {
  const getPercentage = (spent: number, budget: number) => {
    return Math.min((spent / budget) * 100, 100);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Budget Status</h2>
      
      <div className="space-y-6">
        {budgetData.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{item.category}</span>
              <span className="text-sm text-gray-600">
                NRs {item.spent.toLocaleString()} / NRs {item.budget.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full ${item.color} transition-all duration-500`}
                style={{ width: `${getPercentage(item.spent, item.budget)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}