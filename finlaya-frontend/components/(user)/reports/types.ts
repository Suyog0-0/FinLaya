// Shared types used across all report section components

export interface ExpenseRow {
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  category_name: string | null;
}

export interface IncomeRow {
  description: string;
  amount: number;
  income_date: string;
  payment_method: string;
}

export interface CategoryBreakdown {
  name: string;
  spent: number;
  budget: number;
}

export interface EMIRow {
  emi_id: number;
  loan_name: string;
  emi_amount: number;
  total_amount: number;
  payment_day: number | null;
  start_date: string;
  is_active: boolean;
  paid_this_month: boolean; // derived from emi_payment_logs
}

export interface GoalRow {
  title: string;
  target_amount: number;
  saved_amount: number;
}

export interface ReportData {
  expenses:   ExpenseRow[];
  income:     IncomeRow[];
  categories: CategoryBreakdown[];
  emis:       EMIRow[];   // includes both active and paid-off this month
  goals:      GoalRow[];
  salary:     number;
}

// The shape Supabase returns for expenses joined with budget_categories.
// expenses.category_id → budget_categories.category_id is many-to-one,
// so Supabase returns it as a SINGLE OBJECT, not an array.
export interface ExpenseFromDB {
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  budget_categories: { category_name: string } | null;
}