import { ExpenseCategory } from '@/types/expense';

export interface CategoryBudgets {
  [category: string]: number; // positive EUR values
}

export interface BudgetState {
  totalMonthlyBudget?: number; // optional overall monthly budget
  categoryBudgets: CategoryBudgets; // per-category budgets (spending categories only)
}


