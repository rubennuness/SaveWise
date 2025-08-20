import { useState } from 'react';
import { Platform, StyleSheet, TextInput, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { ExpenseCategory } from '@/types/expense';
import { useExpenses } from '@/store/ExpensesContext';
import { useRouter } from 'expo-router';

const categories: ExpenseCategory[] = [
  'Income',
  'Groceries',
  'Dining',
  'Transport',
  'Housing',
  'Utilities',
  'Health',
  'Entertainment',
  'Shopping',
  'Education',
  'Travel',
  'Other',
];

export default function ModalScreen() {
  const { addExpense } = useExpenses();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Groceries');
  const [description, setDescription] = useState('');

  const save = () => {
    const numeric = parseFloat(amount.replace(',', '.'));
    if (isNaN(numeric) || numeric <= 0) return;
    addExpense({ amount: numeric, category, description: description || undefined, dateISO: new Date().toISOString() });
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Entry</Text>

      <Text style={styles.label}>Amount (EUR)</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipsRow}>
        {categories.map((c) => (
          <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 44 }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Optional"
      />

      <View style={{ height: 12 }} />
      <Pressable onPress={save} style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  label: {
    marginTop: 16,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    height: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.04)'
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.06)'
  },
  chipActive: {
    backgroundColor: '#111827',
  },
  chipText: {
    fontSize: 12,
  },
  chipTextActive: {
    color: 'white',
  },
  primaryBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: '600',
  },
});
