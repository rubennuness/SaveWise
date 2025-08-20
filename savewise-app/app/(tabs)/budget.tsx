import { StyleSheet, TextInput, FlatList, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useBudget } from '@/store/BudgetContext';
import { useExpenses } from '@/store/ExpensesContext';
import { ExpenseCategory } from '@/types/expense';
import { useMemo, useState } from 'react';

const spendingCategories: ExpenseCategory[] = [
  'Groceries','Dining','Transport','Housing','Utilities','Health','Entertainment','Shopping','Education','Travel','Other'
];

export default function BudgetScreen() {
  const { state, setTotalMonthlyBudget, setCategoryBudget } = useBudget();
  const { getMonthlyByCategory } = useExpenses();
  const [overall, setOverall] = useState(state.totalMonthlyBudget?.toString() ?? '');
  const monthISO = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), []);
  const actualByCat = getMonthlyByCategory(monthISO);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Budget</Text>

      <Text style={styles.label}>Overall Budget (EUR)</Text>
      <TextInput
        style={styles.input}
        value={overall}
        onChangeText={(v) => {
          setOverall(v);
          const n = parseFloat(v.replace(',', '.'));
          setTotalMonthlyBudget(isNaN(n) ? undefined : n);
        }}
        placeholder="e.g. 1500"
        keyboardType="decimal-pad"
      />

      <Text style={[styles.title, { marginTop: 16 }]}>Per Category</Text>
      <FlatList
        data={spendingCategories}
        keyExtractor={(c) => c}
        renderItem={({ item: c }) => {
          const planned = state.categoryBudgets[c] ?? 0;
          const actual = actualByCat[c] ?? 0;
          const remaining = planned - actual;
          return (
            <RNView style={styles.row}>
              <Text style={{ flex: 1 }}>{c}</Text>
              <TextInput
                style={[styles.input, { width: 100 }]}
                value={planned ? String(planned) : ''}
                onChangeText={(v) => {
                  const n = parseFloat(v.replace(',', '.'));
                  setCategoryBudget(c, isNaN(n) ? 0 : n);
                }}
                placeholder="0"
                keyboardType="decimal-pad"
              />
              <Text style={{ width: 120, textAlign: 'right' }}>Spent: €{actual.toFixed(2)}</Text>
              <Text style={{ width: 120, textAlign: 'right', color: remaining >= 0 ? '#22c55e' : '#ef4444' }}>Left: €{remaining.toFixed(2)}</Text>
            </RNView>
          );
        }}
        ItemSeparatorComponent={() => <RNView style={{ height: 8 }} />}
        contentContainerStyle={{ paddingVertical: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  label: { marginTop: 12, marginBottom: 6, fontWeight: '600' },
  input: {
    height: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.04)'
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});


