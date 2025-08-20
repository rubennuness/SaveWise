import { StyleSheet, FlatList, TextInput, Pressable, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useBills } from '@/store/BillsContext';
import { useState } from 'react';
import { BillFrequency } from '@/types/bill';
import { format } from 'date-fns';

export default function BillsScreen() {
  const { state, addBill, removeBill, markPaidAndRoll } = useBills();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<BillFrequency>('Monthly');

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

      <RNView style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <TextInput style={[styles.input, { flex: 1 }]} value={name} onChangeText={setName} placeholder="Bill name" />
        <TextInput style={[styles.input, { width: 100 }]} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
        <Pressable style={styles.addBtn} onPress={add}><Text style={styles.addBtnText}>Add</Text></Pressable>
      </RNView>

      <FlatList
        style={{ marginTop: 16 }}
        data={state.bills}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => (
          <RNView style={styles.billRow}>
            <RNView style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ opacity: 0.7, fontSize: 12 }}>{item.frequency} • Due {format(new Date(item.nextDueISO), 'dd MMM yyyy')}</Text>
            </RNView>
            <Text style={{ fontWeight: '700' }}>€{item.amount.toFixed(2)}</Text>
            <Pressable onPress={() => markPaidAndRoll(item.id)} style={[styles.smallBtn, { backgroundColor: '#111827' }]}>
              <Text style={{ color: 'white' }}>Paid</Text>
            </Pressable>
            <Pressable onPress={() => removeBill(item.id)} style={[styles.smallBtn, { backgroundColor: '#ef4444' }]}>
              <Text style={{ color: 'white' }}>Delete</Text>
            </Pressable>
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
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallBtn: { marginLeft: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
});


