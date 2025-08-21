import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { startOfMonth } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This file defines a background task that reads persisted expenses from AsyncStorage
// and sends a notification when net for current month is close to zero.

const TASK_NAME = 'savewise.netMonitor';
const EXPENSES_KEY = 'savewise.expenses.v1';

type StoredState = { expenses: Array<{ amount: number; category: string; dateISO: string }>; };

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const raw = await AsyncStorage.getItem(EXPENSES_KEY);
    if (!raw) return BackgroundFetch.BackgroundFetchResult.NoData;
    const state = JSON.parse(raw) as StoredState;
    const monthISO = startOfMonth(new Date()).toISOString();
    let income = 0;
    let spending = 0;
    for (const e of state.expenses) {
      if (e.dateISO >= monthISO) {
        if (e.category === 'Income') income += e.amount;
        else spending += e.amount;
      }
    }
    const net = income - spending;
    if (income > 0 && net <= income * 0.05) {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        await Notifications.scheduleNotificationAsync({
          content: { title: 'SaveWise alert', body: `Only €${net.toFixed(2)} left this month.` },
          trigger: null,
        });
      }
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerNetMonitor() {
  try {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 60, // every hour
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {}
}


