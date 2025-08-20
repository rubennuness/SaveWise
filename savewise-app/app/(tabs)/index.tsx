import { StyleSheet, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useMemo } from 'react';
import { format, startOfMonth } from 'date-fns';
import { useExpenses } from '@/store/ExpensesContext';
import { useBudget } from '@/store/BudgetContext';
import { useBills } from '@/store/BillsContext';

export default function DashboardScreen() {
  const { getMonthlyTotals, getMonthlyByCategory } = useExpenses();
  const { state: budget } = useBudget();
  const { state: bills } = useBills();
  const monthISO = useMemo(() => startOfMonth(new Date()).toISOString(), []);
  const totals = getMonthlyTotals(monthISO);
  const byCat = getMonthlyByCategory(monthISO);

  const categories = useMemo(
    () => Object.entries(byCat).sort((a, b) => b[1] - a[1]),
    [byCat]
  );

  // simple saving tips based on budget vs actuals and upcoming bills
  const tips: string[] = [];
  if (budget.totalMonthlyBudget) {
    const remainingTotal = budget.totalMonthlyBudget - totals.spending;
    if (remainingTotal < budget.totalMonthlyBudget * 0.1) {
      tips.push('You are close to your monthly budget limit. Consider pausing discretionary spend.');
    }
  }
  const biggest = categories[0];
  if (biggest && biggest[1] > totals.spending * 0.35) {
    tips.push(`High spending detected in ${biggest[0]}. Try setting a tighter category budget next month.`);
  }
  const upcomingBills = bills.bills.slice(0, 3).map(b => `${b.name} (€${b.amount.toFixed(2)})`).join(', ');
  if (upcomingBills) tips.push(`Upcoming bills: ${upcomingBills}. Keep funds reserved.`);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>This Month ({format(new Date(monthISO), 'MMM yyyy')})</Text>
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Income</Text>
          <Text style={styles.cardValue}>€{totals.income.toFixed(2)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Spending</Text>
          <Text style={styles.cardValue}>€{totals.spending.toFixed(2)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Net</Text>
          <Text style={[styles.cardValue, { color: totals.net >= 0 ? '#22c55e' : '#ef4444' }]}>€{totals.net.toFixed(2)}</Text>
        </View>
      </View>

      <Text style={[styles.subtitle, { marginTop: 24 }]}>Top Categories</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item[0]}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>{item[0]}</Text>
            <Text style={styles.listValue}>€{item[1].toFixed(2)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ opacity: 0.6 }}>No expenses yet. Tap + to add one.</Text>}
      />

      {!!tips.length && (
        <>
          <Text style={[styles.subtitle, { marginTop: 24 }]}>Saving Tips</Text>
          {tips.map((t, idx) => (
            <Text key={idx} style={{ marginTop: 6 }}>• {t}</Text>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  cardLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  listLabel: {
    fontSize: 14,
  },
  listValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
