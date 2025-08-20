import { StyleSheet, SectionList, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useExpenses } from '@/store/ExpensesContext';
import { format, isToday, isYesterday } from 'date-fns';
import { useMemo } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExpenseCategory } from '@/types/expense';

export default function ExpensesScreen() {
  const { state, removeExpense } = useExpenses();

  const sections = useMemo(() => {
    const sorted = [...state.expenses].sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
    const today: typeof sorted = [];
    const yesterday: typeof sorted = [];
    const earlier: typeof sorted = [];
    for (const e of sorted) {
      const d = new Date(e.dateISO);
      if (isToday(d)) today.push(e);
      else if (isYesterday(d)) yesterday.push(e);
      else earlier.push(e);
    }
    const s = [] as { title: string; data: typeof sorted }[];
    if (today.length) s.push({ title: 'Today', data: today });
    if (yesterday.length) s.push({ title: 'Yesterday', data: yesterday });
    if (earlier.length) s.push({ title: 'Earlier', data: earlier });
    return s;
  }, [state.expenses]);

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText}>{title.toUpperCase()}</Text></View>
        )}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={getCategoryIcon(item.category)} size={22} color="#6b7280" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemDesc}>{item.description}</Text>
              <Text style={styles.itemMeta}>{item.category} • {format(new Date(item.dateISO), 'dd MMM')}</Text>
            </View>
            <Text style={styles.itemAmount}>€{item.amount.toFixed(2)}</Text>
            <Pressable onPress={() => removeExpense(item.id)} style={{ marginLeft: 12 }}>
              <Text style={{ color: '#ef4444' }}>Delete</Text>
            </Pressable>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={{ opacity: 0.6, textAlign: 'center', marginTop: 40 }}>No expenses yet. Tap + to add one.</Text>}
        contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
        stickySectionHeadersEnabled
      />
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
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  sectionHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    fontWeight: '700',
    opacity: 0.7,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconWrap: { width: 28, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  itemDesc: { fontSize: 16, fontWeight: '600' },
  itemMeta: { fontSize: 12, opacity: 0.7 },
  itemAmount: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'right',
  },
});

function getCategoryIcon(category: ExpenseCategory): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (category) {
    case 'Groceries':
      return 'cart-outline';
    case 'Dining':
      return 'food-fork-drink';
    case 'Transport':
      return 'car';
    case 'Housing':
      return 'home-outline';
    case 'Utilities':
      return 'flash';
    case 'Health':
      return 'heart-outline';
    case 'Entertainment':
      return 'popcorn';
    case 'Shopping':
      return 'shopping-outline';
    case 'Education':
      return 'school-outline';
    case 'Travel':
      return 'airplane';
    case 'Income':
      return 'cash-plus';
    case 'Other':
    default:
      return 'dots-horizontal-circle-outline';
  }
}
