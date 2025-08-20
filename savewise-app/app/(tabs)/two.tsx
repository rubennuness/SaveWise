import { StyleSheet, FlatList, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useExpenses } from '@/store/ExpensesContext';
import { format } from 'date-fns';
import { useMemo } from 'react';

export default function ExpensesScreen() {
  const { state, removeExpense } = useExpenses();

  return (
    <View style={styles.container}>
      <FlatList
        data={state.expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.category}</Text>
              <Text style={styles.itemDesc}>{item.description}</Text>
              <Text style={styles.itemDate}>{format(new Date(item.dateISO), 'dd MMM yyyy')}</Text>
            </View>
            <Text style={styles.itemAmount}>€{item.amount.toFixed(2)}</Text>
            <Pressable onPress={() => removeExpense(item.id)} style={{ marginLeft: 12 }}>
              <Text style={{ color: '#ef4444' }}>Delete</Text>
            </Pressable>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={{ opacity: 0.6, textAlign: 'center', marginTop: 40 }}>No expenses yet. Tap + to add one.</Text>}
        contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 16 }}
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemDesc: {
    fontSize: 12,
    opacity: 0.7,
  },
  itemDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'right',
  },
});
