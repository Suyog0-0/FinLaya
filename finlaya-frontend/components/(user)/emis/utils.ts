export interface EMI {
  emi_id: number;
  loan_name: string;
  total_amount: number;
  emi_amount: number;
  start_date: string;       // ISO date string
  end_date: string | null;
  payment_day: number | null;
  remaining_installments: number | null;
  is_active: boolean;
}

export interface EMIPaymentLog {
  log_id: number;
  emi_id: number;
  paid_month: string; // 'YYYY-MM-DD' first day of month
  paid_at: string;
}

// Returns how many total installments the loan has based on total/emi amounts
export function getTotalInstallments(emi: EMI): number {
  if (!emi.emi_amount || emi.emi_amount <= 0) return 0;
  return Math.round(emi.total_amount / emi.emi_amount);
}

// Returns number of installments paid so far
export function getPaidInstallments(emi: EMI, logs: EMIPaymentLog[]): number {
  return logs.filter((l) => l.emi_id === emi.emi_id).length;
}

// Returns 0–100 progress percentage
export function getProgressPct(emi: EMI, logs: EMIPaymentLog[]): number {
  const total = getTotalInstallments(emi);
  if (total === 0) return 0;
  const paid = getPaidInstallments(emi, logs);
  return Math.min(Math.round((paid / total) * 100), 100);
}

// Returns the current month key as 'YYYY-MM-DD' (first day)
export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

// Returns whether the EMI is marked paid for the current month
export function isPaidThisMonth(emi: EMI, logs: EMIPaymentLog[]): boolean {
  const key = currentMonthKey();
  return logs.some((l) => l.emi_id === emi.emi_id && l.paid_month.startsWith(key.slice(0, 7)));
}

// Returns days until next due date this month
export function getDaysUntilDue(paymentDay: number | null): number | null {
  if (!paymentDay) return null;
  const now = new Date();
  const dueThisMonth = new Date(now.getFullYear(), now.getMonth(), paymentDay);
  if (dueThisMonth < now) {
    // Already passed — next due is next month
    const dueNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, paymentDay);
    return Math.ceil((dueNextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((dueThisMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatNRs(amount: number): string {
  return `NRs ${amount.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}