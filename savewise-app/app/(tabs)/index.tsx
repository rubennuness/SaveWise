import { StyleSheet, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useMemo } from 'react';
import { format, startOfMonth } from 'date-fns';
import { useExpenses } from '@/store/ExpensesContext';
import { useBudget } from '@/store/BudgetContext';
import { useBills } from '@/store/BillsContext';
import Svg, { G, Path } from 'react-native-svg';

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
  const totalSpending = useMemo(() => categories.reduce((sum, [, v]) => sum + v, 0), [categories]);
  const donutData = categories.slice(0, 6);
  const donutColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

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

      <Text style={[styles.subtitle, { marginTop: 24 }]}>Spending Breakdown</Text>
      <RNView style={{ alignItems: 'center', marginTop: 8 }}>
        {totalSpending > 0 ? (
          <PieChart data={donutData} size={220} colors={donutColors} />
        ) : (
          <Text style={{ opacity: 0.6 }}>No expenses yet. Tap + to add one.</Text>
        )}
      </RNView>
      {totalSpending > 0 && (
        <RNView style={{ width: '100%', marginTop: 12 }}>
          {donutData.map(([label, value], idx) => {
            const pct = totalSpending === 0 ? 0 : (value / totalSpending) * 100;
            return (
              <RNView key={label} style={styles.legendRow}>
                <RNView style={[styles.legendSwatch, { backgroundColor: donutColors[idx % donutColors.length] }]} />
                <Text style={{ flex: 1 }}>{label}</Text>
                <Text style={styles.legendValue}>€{value.toFixed(2)} ({pct.toFixed(0)}%)</Text>
              </RNView>
            );
          })}
        </RNView>
      )}

      {!!tips.length && (
        <RNView style={{ width: '100%', marginTop: 24, paddingHorizontal: 16 }}>
          <Text style={styles.subtitle}>Saving Tips</Text>
          {tips.map((t, idx) => (
            <RNView key={idx} style={{ flexDirection: 'row', marginTop: 6 }}>
              <Text style={{ marginRight: 6 }}>•</Text>
              <Text style={{ flex: 1 }}>{t}</Text>
            </RNView>
          ))}
        </RNView>
      )}
    </View>
  );
}

type DonutDatum = [string, number];

function PieChart({ data, size, colors }: { data: DonutDatum[]; size: number; colors: string[] }) {
  const total = data.reduce((sum, [, v]) => sum + v, 0);
  const center = size / 2;
  const radius = size / 2;
  let startAngle = -90;

  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const point = (deg: number) => {
    const a = toRadians(deg);
    return { x: center + radius * Math.cos(a), y: center + radius * Math.sin(a) };
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G>
        {data.map(([label, value], idx) => {
          const slice = total === 0 ? 0 : (value / total) * 360;
          const endAngle = startAngle + slice;
          const largeArc = slice > 180 ? 1 : 0;
          const s = point(startAngle);
          const e = point(endAngle);
          const d = `M ${center} ${center} L ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
          startAngle = endAngle;
          return <Path key={label} d={d} fill={colors[idx % colors.length]} />;
        })}
      </G>
    </Svg>
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
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 8,
  },
  legendValue: {
    fontWeight: '600',
  },
});
