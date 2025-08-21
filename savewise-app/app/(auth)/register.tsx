import { StyleSheet, TextInput, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message); else router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize='none' value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {!!error && <Text style={{ color: '#ef4444', marginBottom: 8 }}>{error}</Text>}
      <Pressable style={styles.btn} onPress={signUp} disabled={loading}>
        <Text style={{ color: 'white', fontWeight: '600' }}>{loading ? 'Creating…' : 'Create account'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  input: { height: 44, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.2)', borderRadius: 8, paddingHorizontal: 10, marginBottom: 10 },
  btn: { height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
});


