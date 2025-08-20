import { StyleSheet, FlatList, TextInput, Pressable, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useBills } from '@/store/BillsContext';
import { useMemo, useState } from 'react';
import { BillFrequency } from '@/types/bill';
import { format } from 'date-fns';

export default function BillsScreen() {
  const { state, addBill, removeBill, markPaidAndRoll } = useBills();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<BillFrequency>('Monthly');
  const [paidOnById, setPaidOnById] = useState<Record<string, string>>({}); // billId -> YYYY-MM-DD

  const add = () => {
    const n = parseFloat(amount.replace(',', '.'));
    if (!name || isNaN(n) || n <= 0) return;
    const next = new Date();
    addBill({ name, amount: n, frequency, nextDueISO: next.toISOString() });
    setName('');
    setAmount('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recurring Bills</Text>

      <RNView style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <TextInput style={[styles.input, { flex: 1 }]} value={name} onChangeText={setName} placeholder="Bill name" />
        <TextInput style={[styles.input, { width: 100 }]} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
        <Pressable style={styles.addBtn} onPress={add}><Text style={styles.addBtnText}>Add</Text></Pressable>
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
              <TextInput
                style={[styles.input, { flex: 1, minWidth: 140 }]}
                value={paidOnById[item.id] ?? ''}
                onChangeText={(v) => setPaidOnById(prev => ({ ...prev, [item.id]: v }))}
                placeholder="Paid on YYYY-MM-DD"
              />
              <Pressable onPress={() => {
                const v = paidOnById[item.id];
                const iso = v ? new Date(v).toISOString() : undefined;
                markPaidAndRoll(item.id, iso);
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
  addBtn: {
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#111827',
  },
  addBtnText: { color: 'white', fontWeight: '600' },
  billCard: { padding: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.08)', backgroundColor: 'rgba(0,0,0,0.02)' },
  billHeader: { flexDirection: 'row', alignItems: 'center' },
  billName: { fontWeight: '600', fontSize: 15 },
  billMeta: { opacity: 0.7, fontSize: 12 },
  billAmount: { fontWeight: '700', marginLeft: 12 },
  actionsRow: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 10 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: 'white', fontWeight: '600' },
});


