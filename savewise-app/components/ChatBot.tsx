import React, { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View as RNView, FlatList, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useExpenses } from '@/store/ExpensesContext';
import { startOfMonth } from 'date-fns';
import Constants from 'expo-constants';

type Message = { id: string; role: 'user' | 'assistant'; content: string };

export default function ChatBotFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.fab}>
        <FontAwesome name="comments" size={22} color="#fff" />
      </Pressable>
      {open && <ChatBotModal onClose={() => setOpen(false)} />}
    </>
  );
}

function ChatBotModal({ onClose }: { onClose: () => void }) {
  const { state } = useExpenses();
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm0', role: 'assistant', content: 'Hi! Ask me anything about your spendings and savings.' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const snapshot = useMemo(() => {
    // Simple snapshot of this month for the prompt
    const monthISO = startOfMonth(new Date()).toISOString();
    let income = 0; let spending = 0;
    for (const e of state.expenses) {
      if (e.dateISO >= monthISO) {
        if (e.category === 'Income') income += e.amount; else spending += e.amount;
      }
    }
    return `This month: income €${income.toFixed(2)}, spending €${spending.toFixed(2)}, net €${(income-spending).toFixed(2)}`;
  }, [state.expenses]);

  async function send() {
    const content = input.trim();
    if (!content || sending) return;
    setInput('');
    const userMsg: Message = { id: String(Date.now()), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || (Constants.expoConfig?.extra as any)?.openaiKey;
      if (!apiKey) {
        setMessages(prev => [...prev, { id: userMsg.id + '-err', role: 'assistant', content: 'API key not set. Add EXPO_PUBLIC_OPENAI_API_KEY to use the assistant.' }]);
      } else {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a budgeting assistant. Provide concise, actionable tips. Currency is EUR.' },
              { role: 'system', content: snapshot },
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content },
            ],
            temperature: 0.4,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          const err = json?.error?.message || `HTTP ${res.status}`;
          setMessages(prev => [...prev, { id: userMsg.id + '-err3', role: 'assistant', content: `Error: ${err}` }]);
          return;
        }
        const text = json?.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not generate a response.';
        setMessages(prev => [...prev, { id: userMsg.id + '-ai', role: 'assistant', content: text }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: userMsg.id + '-err2', role: 'assistant', content: 'Network error. Try again.' }]);
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <RNView style={styles.backdrop}>
        <RNView style={styles.sheet}>
          <RNView style={styles.header}>
            <Text style={{ fontWeight: '700' }}>Assistant</Text>
            <Pressable onPress={onClose}><FontAwesome name="close" size={20} /></Pressable>
          </RNView>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <RNView style={[styles.msg, item.role === 'user' ? styles.userMsg : styles.aiMsg]}>
                <Text>{item.content}</Text>
              </RNView>
            )}
            contentContainerStyle={{ padding: 12 }}
          />
          <RNView style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask for tips..."
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <Pressable onPress={send} style={styles.sendBtn} disabled={sending}>
              {sending ? <ActivityIndicator color="#fff" /> : <FontAwesome name="send" size={16} color="#fff" />}
            </Pressable>
          </RNView>
        </RNView>
      </RNView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', elevation: 3,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: 'white', maxHeight: '70%', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.1)' },
  msg: { marginVertical: 4, padding: 10, borderRadius: 10, maxWidth: '80%' },
  userMsg: { alignSelf: 'flex-end', backgroundColor: 'rgba(17,24,39,0.1)' },
  aiMsg: { alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.05)' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  input: { flex: 1, height: 40, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.2)', borderRadius: 8, paddingHorizontal: 10 },
  sendBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
});


