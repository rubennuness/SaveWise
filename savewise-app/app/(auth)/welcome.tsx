import { StyleSheet, Image, Pressable, TextInput } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useEffect } from 'react';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export default function Welcome() {
  const router = useRouter();
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';
  const redirectUri = AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri,
      scopes: ['profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      // You would verify the token and create a session here
      router.replace('/(tabs)');
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center' }}>
        <Image source={{ uri: 'https://dummyimage.com/80x80/ebe9fe/4f46e5&text=✓' }} style={{ width: 64, height: 64, borderRadius: 32 }} />
        <Text style={styles.welcome}>Welcome to</Text>
        <Text style={styles.brand}>Linear</Text>
        <Text style={styles.subtitle}>A place where you can track all your expenses and incomes…</Text>
      </View>

      <View style={{ marginTop: 24 }}>
        <Pressable disabled={!request} style={styles.cta} onPress={() => promptAsync()}>
          <Text>Continue with Google</Text>
        </Pressable>
        <Pressable style={styles.cta} onPress={() => router.replace('/(tabs)')}>
          <Text>Continue with Email</Text>
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


