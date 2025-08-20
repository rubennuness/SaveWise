export type BillFrequency = 'Monthly' | 'Weekly' | 'Yearly' | 'Quarterly';

export interface Bill {
  id: string;
  name: string;
  amount: number; // EUR
  dueDay?: number; // for Monthly (1-28/30/31)
  frequency: BillFrequency;
  nextDueISO: string; // next due date in ISO
  autoPay?: boolean;
}

export interface BillsState {
  bills: Bill[];
}


