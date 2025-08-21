import { StyleSheet, Image, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center' }}>
        <Image source={{ uri: 'https://dummyimage.com/80x80/ebe9fe/4f46e5&text=✓' }} style={{ width: 64, height: 64, borderRadius: 32 }} />
        <Text style={styles.welcome}>Welcome to</Text>
        <Text style={styles.brand}>Linear</Text>
        <Text style={styles.subtitle}>A place where you can track all your expenses and incomes…</Text>
      </View>

      <View style={{ marginTop: 24 }}>
        <Pressable style={styles.cta} onPress={() => router.replace('/(tabs)')}>
          <Text>Continue with Email</Text>
        </Pressable>
        <Pressable style={styles.cta} onPress={() => router.push('/(auth)/register')}>
          <Text>Create account</Text>
        </Pressable>
      </View>

      <Text style={{ marginTop: 16, textAlign: 'center' }}>
        Already have an account? <Link href="/(tabs)">Login</Link>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  welcome: { marginTop: 12, opacity: 0.7 },
  brand: { fontSize: 36, fontWeight: '800' },
  subtitle: { marginTop: 8, opacity: 0.7, textAlign: 'center' },
  cta: {
    height: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.03)'
  },
});


