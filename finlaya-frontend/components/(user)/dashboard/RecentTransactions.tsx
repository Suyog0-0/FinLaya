import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
}

const transactions: Transaction[] = [
  {
    id: '1',
    title: 'Grocery Store',
    category: 'Food',
    amount: 855.00,
    date: 'Today',
    type: 'expense',
  },
  {
    id: '2',
    title: 'Salary Deposit',
    category: 'Income',
    amount: 52000.00,
    date: 'Dec 25',
    type: 'income',
  },
  {
    id: '3',
    title: 'Netflix',
    category: 'Entertainment',
    amount: 1599.00,
    date: 'Dec 24',
    type: 'expense',
  },
  {
    id: '4',
    title: 'Electric Bill',
    category: 'Utilities',
    amount: 1200.00,
    date: 'Dec 23',
    type: 'expense',
  },
  {
    id: '5',
    title: 'Taxi Ride',
    category: 'Transport',
    amount: 245.00,
    date: 'Dec 22',
    type: 'expense',
  },
];

export default function RecentTransactions() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
        <button className="text-orange-600 text-sm font-semibold hover:text-orange-700">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div 
            key={transaction.id}
            className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                transaction.type === 'income' 
                  ? 'bg-green-100' 
                  : 'bg-orange-100'
              }`}>
                {transaction.type === 'income' ? (
                  <ArrowDownLeft className="text-green-600" size={20} />
                ) : (
                  <ArrowUpRight className="text-orange-600" size={20} />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{transaction.title}</p>
                <p className="text-sm text-gray-500">{transaction.category}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${
                transaction.type === 'income' 
                  ? 'text-green-600' 
                  : 'text-gray-900'
              }`}>
                {transaction.type === 'income' ? '+' : ''}NRs {transaction.amount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{transaction.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}