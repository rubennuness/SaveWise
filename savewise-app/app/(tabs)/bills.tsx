import { StyleSheet, FlatList, TextInput, Pressable, View as RNView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useBills } from '@/store/BillsContext';
import { useMemo, useState } from 'react';
import { BillFrequency } from '@/types/bill';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useExpenses } from '@/store/ExpensesContext';
import { ExpenseCategory } from '@/types/expense';

export default function BillsScreen() {
  const { state, addBill, removeBill, markPaidAndRoll, setBillCategory } = useBills();
  const { addExpense } = useExpenses();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<BillFrequency>('Monthly');
  const [nextDue, setNextDue] = useState(''); // YYYY-MM-DD
  const [showNextDuePicker, setShowNextDuePicker] = useState(false);
  const [paidOnById, setPaidOnById] = useState<Record<string, string>>({}); // billId -> YYYY-MM-DD
  const [category, setCategory] = useState<ExpenseCategory>('Utilities');

  const add = () => {
    const n = parseFloat(amount.replace(',', '.'));
    if (!name || isNaN(n) || n <= 0) return;
    const base = nextDue ? new Date(nextDue) : new Date();
    addBill({ name, amount: n, frequency, nextDueISO: base.toISOString(), category });
    setName('');
    setAmount('');
    setNextDue('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recurring Bills</Text>

      <RNView style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <TextInput style={[styles.input, { flex: 1 }]} value={name} onChangeText={setName} placeholder="Bill name" />
        <TextInput style={[styles.input, { width: 100 }]} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
        <Pressable style={[styles.input, styles.dateBtn]} onPress={() => setShowNextDuePicker(true)}>
          <Text style={{ color: nextDue ? '#111827' : 'rgba(0,0,0,0.4)' }}>{nextDue || 'Pick next due date'}</Text>
        </Pressable>
        <Pressable style={styles.addBtn} onPress={add}><Text style={styles.addBtnText}>Add</Text></Pressable>
      </RNView>
      {showNextDuePicker && (
        <DateTimePicker
          value={nextDue ? new Date(nextDue) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, date) => {
            setShowNextDuePicker(false);
            if (date) {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const d = String(date.getDate()).padStart(2, '0');
              setNextDue(`${y}-${m}-${d}`);
            }
          }}
        />
      )}

      <RNView style={styles.chipsRow}>
        {(['Weekly','Monthly','Quarterly','Yearly'] as BillFrequency[]).map(f => (
          <Pressable key={f} onPress={() => setFrequency(f)} style={[styles.chip, frequency === f && styles.chipActive]}>
            <Text style={[styles.chipText, frequency === f && styles.chipTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </RNView>

      <Text style={{ marginTop: 8, fontWeight: '600' }}>Category</Text>
      <RNView style={styles.chipsRow}>
        {(['Groceries','Dining','Transport','Housing','Utilities','Health','Entertainment','Shopping','Education','Travel','Other'] as ExpenseCategory[]).map(c => (
          <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </RNView>

      <FlatList
        style={{ marginTop: 16 }}
        data={state.bills}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => (
          <RNView style={styles.billCard}>
            <RNView style={styles.billHeader}>
              <RNView style={{ flex: 1 }}>
                <Text style={styles.billName}>{item.name}</Text>
                <Text style={styles.billMeta}>{item.frequency} • Due {format(new Date(item.nextDueISO), 'dd MMM yyyy')}</Text>
              </RNView>
              <Text style={styles.billAmount}>€{item.amount.toFixed(2)}</Text>
            </RNView>
            <RNView style={styles.actionsRow}>
              <RNView style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', marginBottom: 4 }}>Category</Text>
                <RNView style={styles.chipsRow}>
                  {(['Groceries','Dining','Transport','Housing','Utilities','Health','Entertainment','Shopping','Education','Travel','Other'] as ExpenseCategory[]).map(c => (
                    <Pressable key={c} onPress={() => setBillCategory(item.id, c)} style={[styles.chip, (item.category || 'Utilities') === c && styles.chipActive]}>
                      <Text style={[styles.chipText, (item.category || 'Utilities') === c && styles.chipTextActive]}>{c}</Text>
                    </Pressable>
                  ))}
                </RNView>
              </RNView>
              <PaidDatePicker value={paidOnById[item.id]} onChange={(v) => setPaidOnById(prev => ({ ...prev, [item.id]: v }))} />
              <Pressable onPress={() => {
                const v = paidOnById[item.id];
                const iso = v ? new Date(v).toISOString() : undefined;
                markPaidAndRoll(item.id, iso);
                // Log as an actual expense so the dashboard updates in the selected category
                const whenISO = iso ?? new Date().toISOString();
                const mappedCategory: ExpenseCategory = (item.category as ExpenseCategory) || category || 'Other';
                addExpense({ amount: item.amount, category: mappedCategory, description: `Bill: ${item.name}`, dateISO: whenISO });
              }} style={[styles.actionBtn, { backgroundColor: '#111827' }]}>
                <Text style={styles.actionBtnText}>Paid</Text>
              </Pressable>
              <Pressable onPress={() => removeBill(item.id)} style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.actionBtnText}>Delete</Text>
              </Pressable>
            </RNView>
          </RNView>
        )}
        ItemSeparatorComponent={() => <RNView style={{ height: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  input: {
    height: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.04)'
  },
  dateBtn: {
    justifyContent: 'center',
    width: 160,
  },
  addBtn: {
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#111827',
  },
  addBtnText: { color: 'white', fontWeight: '600' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.06)' },
  chipActive: { backgroundColor: '#111827' },
  chipText: { fontSize: 12 },
  chipTextActive: { color: 'white' },
  billCard: { padding: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.08)', backgroundColor: 'rgba(0,0,0,0.02)' },
  billHeader: { flexDirection: 'row', alignItems: 'center' },
  billName: { fontWeight: '600', fontSize: 15 },
  billMeta: { opacity: 0.7, fontSize: 12 },
  billAmount: { fontWeight: '700', marginLeft: 12 },
  actionsRow: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 10 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: 'white', fontWeight: '600' },
});

function PaidDatePicker({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <Pressable style={[styles.input, styles.dateBtn, { minWidth: 160 }]} onPress={() => setShow(true)}>
        <Text style={{ color: value ? '#111827' : 'rgba(0,0,0,0.4)' }}>{value || 'Paid on date'}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, date) => {
            setShow(false);
            if (date) {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const d = String(date.getDate()).padStart(2, '0');
              onChange(`${y}-${m}-${d}`);
            }
          }}
        />
      )}
    </>
  );
}


