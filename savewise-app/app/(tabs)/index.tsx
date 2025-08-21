import { StyleSheet, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { useExpenses } from '@/store/ExpensesContext';
import { useBudget } from '@/store/BudgetContext';
import { useBills } from '@/store/BillsContext';
import Svg, { G, Path } from 'react-native-svg';
import * as Notifications from 'expo-notifications';

export default function DashboardScreen() {
  const { getMonthlyTotals, getMonthlyByCategory, state: expensesState } = useExpenses();
  const { state: budget } = useBudget();
  const { state: billsState } = useBills();
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

  // Year-end projection based on rolling 3-month average
  const projection = useMemo(() => {
    const now = new Date();
    const startThis = startOfMonth(now);
    const endThis = endOfMonth(now);
    const msMonth = endThis.getTime() - startThis.getTime();
    const msElapsed = Math.max(0, Math.min(msMonth, now.getTime() - startThis.getTime()));
    const fractionElapsed = msMonth ? msElapsed / msMonth : 1;

    let incomeSum = 0;
    let discSum = 0;
    let months = 0;
    for (let i = 0; i < 3; i++) {
      const s = startOfMonth(addMonths(now, -i));
      const e = endOfMonth(s);
      months++;
      for (const exp of expensesState.expenses) {
        const d = new Date(exp.dateISO);
        if (d >= s && d <= e) {
          if (exp.category === 'Income') incomeSum += exp.amount;
          else if (!exp.sourceBillId) discSum += exp.amount; // discretionary only
        }
      }
    }
    const avgIncome = incomeSum / (months || 1);
    const avgDisc = discSum / (months || 1);

    let billsMonthly = 0;
    for (const b of billsState.bills) {
      switch (b.frequency) {
        case 'Weekly': billsMonthly += (b.amount * 52) / 12; break;
        case 'Monthly': billsMonthly += b.amount; break;
        case 'Quarterly': billsMonthly += b.amount / 3; break;
        case 'Yearly': billsMonthly += b.amount / 12; break;
      }
    }

    const monthlyNet = avgIncome - (avgDisc + billsMonthly);
    const monthsRemaining = 12 - (now.getMonth() + 1) + (1 - fractionElapsed);
    const yearEndDelta = monthlyNet * monthsRemaining;
    return { monthlyNet, monthsRemaining, yearEndDelta };
  }, [expensesState.expenses, billsState.bills]);

  // Notify when monthly net approaches 0 (threshold 5% of income)
  useEffect(() => {
    const threshold = totals.income * 0.05;
    const net = totals.income - totals.spending;
    if (totals.income > 0 && net <= threshold) {
      Notifications.requestPermissionsAsync().then(({ status }) => {
        if (status === 'granted') {
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Heads up',
              body: `You have €${net.toFixed(2)} left this month. Consider pausing discretionary spending.`,
            },
            trigger: null,
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [totals.income, totals.spending]);

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
  // Skip bill-based tips because recurring bills are fixed and already planned

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
          <RNView style={{ marginTop: 8 }}>
            <Text style={{ opacity: 0.7 }}>Projected year-end savings if you keep this pace:</Text>
            <Text style={{ fontWeight: '700' }}>€{projection.yearEndDelta.toFixed(2)}</Text>
          </RNView>
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
