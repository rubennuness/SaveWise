export type ExpenseCategory =
  | 'Groceries'
  | 'Dining'
  | 'Transport'
  | 'Housing'
  | 'Utilities'
  | 'Health'
  | 'Entertainment'
  | 'Shopping'
  | 'Education'
  | 'Travel'
  | 'Income'
  | 'Other';

export interface Expense {
  id: string;
  amount: number; // positive number; use category 'Income' for inflows
  category: ExpenseCategory;
  description?: string;
  dateISO: string; // e.g., 2025-08-01T12:00:00.000Z
}

export interface ExpensesState {
  expenses: Expense[];
}


