import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addMonths, addWeeks, addYears, isAfter, parseISO } from 'date-fns';
import { Bill, BillsState } from '@/types/bill';

type BillsContextValue = {
  state: BillsState;
  addBill: (bill: Omit<Bill, 'id'>) => void;
  removeBill: (id: string) => void;
  markPaidAndRoll: (id: string, paidOnISO?: string) => void; // advance nextDueISO by frequency from paid date
  setBillCategory: (id: string, category?: string) => void;
  clearAll: () => void;
};

const BillsContext = createContext<BillsContextValue | undefined>(undefined);
const STORAGE_KEY = 'savewise.bills.v1';

export const BillsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BillsState>({ bills: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState(JSON.parse(raw) as BillsState);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const addBill = useCallback((bill: Omit<Bill, 'id'>) => {
    setState(prev => ({ bills: [{ ...bill, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }, ...prev.bills] }));
  }, []);

  const removeBill = useCallback((id: string) => {
    setState(prev => ({ bills: prev.bills.filter(b => b.id !== id) }));
  }, []);

  const markPaidAndRoll = useCallback((id: string, paidOnISO?: string) => {
    setState(prev => ({
      bills: prev.bills.map(b => {
        if (b.id !== id) return b;
        const current = paidOnISO ? parseISO(paidOnISO) : parseISO(b.nextDueISO);
        let next: Date = current;
        switch (b.frequency) {
          case 'Weekly':
            next = addWeeks(current, 1);
            break;
          case 'Monthly':
            next = addMonths(current, 1);
            break;
          case 'Quarterly':
            next = addMonths(current, 3);
            break;
          case 'Yearly':
            next = addYears(current, 1);
            break;
        }
        return { ...b, nextDueISO: next.toISOString() };
      })
    }));
  }, []);

  const clearAll = useCallback(() => setState({ bills: [] }), []);
  const setBillCategory = useCallback((id: string, category?: string) => {
    setState(prev => ({
      bills: prev.bills.map(b => (b.id === id ? { ...b, category } : b)),
    }));
  }, []);

  const value = useMemo(
    () => ({ state, addBill, removeBill, markPaidAndRoll, setBillCategory, clearAll }),
    [state, addBill, removeBill, markPaidAndRoll, setBillCategory, clearAll]
  );

  return <BillsContext.Provider value={value}>{children}</BillsContext.Provider>;
};

export const useBills = () => {
  const ctx = useContext(BillsContext);
  if (!ctx) throw new Error('useBills must be used within BillsProvider');
  return ctx;
};


