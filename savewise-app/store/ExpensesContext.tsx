import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addMonths, endOfMonth, formatISO, isWithinInterval, parseISO, startOfMonth } from 'date-fns';
import { Expense, ExpensesState, ExpenseCategory } from '@/types/expense';

type ExpensesContextValue = {
  state: ExpensesState;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  removeExpense: (id: string) => void;
  removeExpensesByBillId: (billId: string) => void;
  updateExpensesCategoryByBillId: (billId: string, category: ExpenseCategory) => void;
  clearAll: () => void;
  getMonthlyTotals: (monthISO: string) => { income: number; spending: number; net: number };
  getMonthlyByCategory: (monthISO: string) => Record<string, number>;
};

const ExpensesContext = createContext<ExpensesContextValue | undefined>(undefined);

const STORAGE_KEY = 'savewise.expenses.v1';

export const ExpensesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ExpensesState>({ expenses: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as ExpensesState;
          setState(parsed);
        }
      } catch (e) {
        // ignore read errors
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    setState(prev => ({
      expenses: [
        { ...expense, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
        ...prev.expenses,
      ],
    }));
  }, []);

  const removeExpense = useCallback((id: string) => {
    setState(prev => ({ expenses: prev.expenses.filter(e => e.id !== id) }));
  }, []);

  const removeExpensesByBillId = useCallback((billId: string) => {
    setState(prev => ({ expenses: prev.expenses.filter(e => e.sourceBillId !== billId) }));
  }, []);

  const updateExpensesCategoryByBillId = useCallback((billId: string, category: ExpenseCategory) => {
    setState(prev => ({
      expenses: prev.expenses.map(e => (e.sourceBillId === billId ? { ...e, category } : e)),
    }));
  }, []);

  const clearAll = useCallback(() => {
    setState({ expenses: [] });
  }, []);

  const getMonthlyInterval = (monthISO: string) => {
    const monthStart = startOfMonth(parseISO(monthISO));
    const monthEnd = endOfMonth(monthStart);
    return { start: monthStart, end: monthEnd };
  };

  const getMonthlyTotals = useCallback(
    (monthISO: string) => {
      const { start, end } = getMonthlyInterval(monthISO);
      let income = 0;
      let spending = 0;
      for (const e of state.expenses) {
        const d = parseISO(e.dateISO);
        if (!isWithinInterval(d, { start, end })) continue;
        if (e.category === 'Income') income += e.amount;
        else spending += e.amount;
      }
      return { income, spending, net: income - spending };
    },
    [state.expenses]
  );

  const getMonthlyByCategory = useCallback(
    (monthISO: string) => {
      const { start, end } = getMonthlyInterval(monthISO);
      const byCat: Record<string, number> = {};
      for (const e of state.expenses) {
        const d = parseISO(e.dateISO);
        if (!isWithinInterval(d, { start, end })) continue;
        if (e.category === 'Income') continue;
        byCat[e.category] = (byCat[e.category] ?? 0) + e.amount;
      }
      return byCat;
    },
    [state.expenses]
  );

  const value = useMemo(
    () => ({ state, addExpense, removeExpense, removeExpensesByBillId, updateExpensesCategoryByBillId, clearAll, getMonthlyTotals, getMonthlyByCategory }),
    [state, addExpense, removeExpense, removeExpensesByBillId, updateExpensesCategoryByBillId, clearAll, getMonthlyTotals, getMonthlyByCategory]
  );

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
};

export const useExpenses = () => {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpensesProvider');
  return ctx;
};


