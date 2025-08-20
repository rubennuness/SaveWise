import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BudgetState, CategoryBudgets } from '@/types/budget';

type BudgetContextValue = {
  state: BudgetState;
  setTotalMonthlyBudget: (amount?: number) => void;
  setCategoryBudget: (category: string, amount?: number) => void;
  clearAllBudgets: () => void;
};

const BudgetContext = createContext<BudgetContextValue | undefined>(undefined);
const STORAGE_KEY = 'savewise.budget.v1';

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BudgetState>({ categoryBudgets: {} });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState(JSON.parse(raw) as BudgetState);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const setTotalMonthlyBudget = useCallback((amount?: number) => {
    setState(prev => ({ ...prev, totalMonthlyBudget: amount }));
  }, []);

  const setCategoryBudget = useCallback((category: string, amount?: number) => {
    setState(prev => ({
      ...prev,
      categoryBudgets: { ...prev.categoryBudgets, [category]: amount ?? 0 },
    }));
  }, []);

  const clearAllBudgets = useCallback(() => setState({ categoryBudgets: {} }), []);

  const value = useMemo(
    () => ({ state, setTotalMonthlyBudget, setCategoryBudget, clearAllBudgets }),
    [state, setTotalMonthlyBudget, setCategoryBudget, clearAllBudgets]
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};

export const useBudget = () => {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
};


