import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../../utils/api';
import { Colors } from '../../constants/colors';

const DISCLAIMER = 'MedBuddie AI provides general health information only — not medical advice. Always consult a qualified healthcare provider for diagnosis and treatment.';

const SUGGESTIONS = [
  'What does my blood pressure reading mean?',
  'What are common side effects of Metformin?',
  'When should I be concerned about chest pain?',
  'Explain HbA1c in simple terms',
];

function TypingIndicator() {
  return (
    <View style={styles.typingRow}>
      <View style={styles.aiBubble}>
        <Text style={styles.typingDots}>●  ●  ●</Text>
      </View>
    </View>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <MaterialCommunityIcons name="robot" size={14} color="#fff" />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>
          {msg.content}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const [accepted, setAccepted]   = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');

    const userMsg = { role: 'user', content };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    try {
      const res = await apiFetch('/api/chat/sync', {
        method: 'POST',
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([...history, { role: 'assistant', content: data.content }]);
      } else {
        Alert.alert('Error', data.error || 'Could not get a response.');
        setMessages(history); // remove optimistic user msg on failure
      }
    } catch {
      Alert.alert('Error', 'Cannot reach the server. Check your connection.');
      setMessages(history);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    Alert.alert('Clear chat', 'Start a new conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setMessages([]) },
    ]);
  };

  /* ── Disclaimer screen ── */
  if (!accepted) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.disclaimerContainer}>
          <View style={styles.disclaimerIcon}>
            <MaterialCommunityIcons name="robot" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.disclaimerTitle}>MedBuddie AI</Text>
          <Text style={styles.disclaimerSubtitle}>Your personal health assistant</Text>
          <View style={styles.disclaimerCard}>
            <Ionicons name="information-circle" size={20} color="#e65100" style={{ marginBottom: 8 }} />
            <Text style={styles.disclaimerText}>{DISCLAIMER}</Text>
          </View>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => setAccepted(true)}>
            <Text style={styles.acceptBtnLabel}>I understand — start chatting</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Chat screen ── */
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="robot" size={52} color={Colors.border} />
              <Text style={styles.emptyTitle}>Ask me anything</Text>
              <Text style={styles.emptySubtitle}>
                I can answer health questions based on your profile and medical guidelines.
              </Text>
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.suggestionBtn}
                    onPress={() => sendMessage(s)}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          ListFooterComponent={loading ? <TypingIndicator /> : null}
        />

        {/* Input row */}
        <View style={styles.inputArea}>
          {messages.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearChat}>
              <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
          <TextInput
            style={styles.input}
            placeholder="Ask a health question…"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="send" size={16} color="#fff" />
            }
          </TouchableOpacity>
        </View>
        <Text style={styles.footerNote}>Not medical advice · Consult a doctor for treatment</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  /* Disclaimer */
  disclaimerContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28,
  },
  disclaimerIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  disclaimerTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  disclaimerSubtitle: { fontSize: 14, color: Colors.textMuted, marginBottom: 24 },
  disclaimerCard: {
    backgroundColor: '#fff8e1', borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 28, width: '100%',
  },
  disclaimerText: { fontSize: 13, color: '#555', lineHeight: 20, textAlign: 'center' },
  acceptBtn: {
    backgroundColor: Colors.primary, borderRadius: 26,
    paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center',
  },
  acceptBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },

  /* Messages */
  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, gap: 8 },
  msgRowUser: { flexDirection: 'row-reverse' },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bubble: {
    maxWidth: '78%', padding: 12, borderRadius: 18,
  },
  aiBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21 },
  userBubbleText: { color: '#fff' },

  /* Typing indicator */
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, gap: 8 },
  typingDots: { fontSize: 18, color: Colors.textMuted, letterSpacing: 2 },

  /* Empty state */
  emptyState: { flex: 1, alignItems: 'center', paddingTop: 40, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: 14 },
  emptySubtitle: {
    fontSize: 13, color: Colors.textMuted, textAlign: 'center',
    marginTop: 6, marginBottom: 24, lineHeight: 20,
  },
  suggestions: { width: '100%', gap: 10 },
  suggestionBtn: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, padding: 12,
  },
  suggestionText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },

  /* Input */
  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  clearBtn: { paddingBottom: 8 },
  input: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9, fontSize: 14,
    maxHeight: 100, backgroundColor: '#fafafa',
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendBtnDisabled: { opacity: 0.4 },
  footerNote: {
    textAlign: 'center', fontSize: 10, color: Colors.textMuted,
    paddingVertical: 5, backgroundColor: Colors.surface,
  },
});
