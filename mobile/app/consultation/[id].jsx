import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert, Linking, ScrollView,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserAvatar from '../../components/UserAvatar';
import { apiFetch } from '../../utils/api';
import { useUser } from '../../context/UserContext';
import { Colors } from '../../constants/colors';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_COLOR = {
  pending:   '#f57f17',
  accepted:  Colors.primary,
  declined:  Colors.danger,
  completed: '#2e7d32',
};

export default function ConsultationDetailScreen() {
  const { id }    = useLocalSearchParams();
  const router    = useRouter();
  const { user }  = useUser();
  const listRef   = useRef(null);

  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [msgText, setMsgText]           = useState('');
  const [sending, setSending]           = useState(false);
  const [updating, setUpdating]         = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [customLink, setCustomLink]       = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [cRes, mRes] = await Promise.all([
        apiFetch('/api/consultations'),
        apiFetch(`/api/consultations/${id}/messages`),
      ]);
      if (cRes.ok) {
        const all = await cRes.json();
        setConsultation(all.find(c => String(c.id) === String(id)) || null);
      }
      if (mRes.ok) setMessages(await mRes.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!msgText.trim() || sending) return;
    const text = msgText.trim();
    setMsgText('');
    setSending(true);
    try {
      const res = await apiFetch(`/api/consultations/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, { ...msg, senderName: user?.name, senderId: user?.id }]);
      }
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      const res = await apiFetch(`/api/consultations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setConsultation(prev => ({ ...prev, ...updated }));
      }
    } catch { Alert.alert('Error', 'Could not update status.'); }
    finally { setUpdating(false); }
  };

  const joinVideoCall = async () => {
    const url = consultation?.meetingUrl;
    if (!url) return;
    const can = await Linking.canOpenURL(url);
    if (can) await Linking.openURL(url);
    else Alert.alert('Cannot open', 'Could not open the video call link.');
  };

  const saveMeetingLink = async () => {
    const url = customLink.trim();
    if (!url) return;
    setUpdating(true);
    try {
      const res = await apiFetch(`/api/consultations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ meetingUrl: url }),
      });
      if (res.ok) {
        const updated = await res.json();
        setConsultation(prev => ({ ...prev, ...updated }));
        setShowLinkInput(false);
        setCustomLink('');
      }
    } catch { Alert.alert('Error', 'Could not save link.'); }
    finally { setUpdating(false); }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Consultation', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: '#fff', headerShown: true }} />
        <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>
      </>
    );
  }

  if (!consultation) {
    return (
      <>
        <Stack.Screen options={{ title: 'Consultation', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: '#fff', headerShown: true }} />
        <View style={styles.centered}><Text style={styles.notFound}>Consultation not found.</Text></View>
      </>
    );
  }

  const isDoctor  = user?.id === consultation.doctorId;
  const other     = isDoctor
    ? { name: consultation.patientName, avatar: consultation.patientAvatar }
    : { name: consultation.doctorName,  avatar: consultation.doctorAvatar };
  const statusColor = STATUS_COLOR[consultation.status] || Colors.textMuted;

  return (
    <>
      <Stack.Screen options={{
        title: other.name || 'Consultation',
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerShown: true,
      }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>

        {/* ── Info banner ── */}
        <View style={styles.infoBanner}>
          <UserAvatar name={other.name} avatarUrl={other.avatar} size={40} />
          <View style={styles.infoText}>
            <Text style={styles.infoName}>{other.name}</Text>
            <Text style={styles.infoConcern} numberOfLines={1}>{consultation.concern}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>
              {consultation.status}
            </Text>
          </View>
        </View>

        {/* ── Video call button (when accepted + URL exists) ── */}
        {consultation.meetingUrl && consultation.status === 'accepted' && (
          <View style={styles.videoRow}>
            <TouchableOpacity style={[styles.videoCallBtn, { flex: 1 }]} onPress={joinVideoCall}>
              <Ionicons name="videocam" size={20} color="#fff" />
              <Text style={styles.videoCallLabel}>Join Video Call</Text>
            </TouchableOpacity>
            {isDoctor && (
              <TouchableOpacity style={styles.editLinkBtn} onPress={() => { setCustomLink(consultation.meetingUrl || ''); setShowLinkInput(s => !s); }}>
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Doctor: set custom meeting link ── */}
        {isDoctor && consultation.status === 'accepted' && !consultation.meetingUrl && (
          <TouchableOpacity style={styles.addLinkBtn} onPress={() => setShowLinkInput(s => !s)}>
            <Ionicons name="link" size={16} color={Colors.primary} />
            <Text style={styles.addLinkText}>Add video call link (Zoom / Google Meet / Jitsi)</Text>
          </TouchableOpacity>
        )}

        {isDoctor && showLinkInput && (
          <View style={styles.linkInputBox}>
            <Text style={styles.linkInputLabel}>Paste your meeting link</Text>
            <Text style={styles.linkInputHint}>Works with Zoom, Google Meet, Microsoft Teams, Jitsi, or any URL</Text>
            <TextInput
              style={styles.linkInput}
              placeholder="https://zoom.us/j/... or meet.google.com/..."
              value={customLink}
              onChangeText={setCustomLink}
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={styles.linkActions}>
              <TouchableOpacity onPress={() => setShowLinkInput(false)}>
                <Text style={styles.linkCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.linkSaveBtn, (!customLink.trim() || updating) && styles.sendBtnDisabled]}
                onPress={saveMeetingLink}
                disabled={!customLink.trim() || updating}
              >
                {updating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.linkSaveBtnText}>Save link</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Doctor actions (accept/decline) ── */}
        {isDoctor && consultation.status === 'pending' && (
          <View style={styles.doctorActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => Alert.alert('Decline?', 'Decline this consultation?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Decline', style: 'destructive', onPress: () => updateStatus('declined') },
              ])}
              disabled={updating}
            >
              <Text style={styles.declineBtnLabel}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => updateStatus('accepted')}
              disabled={updating}
            >
              {updating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.acceptBtnLabel}>Accept</Text>}
            </TouchableOpacity>
          </View>
        )}

        {isDoctor && consultation.status === 'accepted' && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => updateStatus('completed')}
            disabled={updating}
          >
            <Text style={styles.completeBtnLabel}>Mark as Completed</Text>
          </TouchableOpacity>
        )}

        {/* ── Messages ── */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => {
            const isMe = item.senderId === user?.id;
            return (
              <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                {!isMe && <UserAvatar name={item.senderName} avatarUrl={item.senderAvatar} size={28} />}
                <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleThem]}>
                  {!isMe && <Text style={styles.msgSender}>{item.senderName}</Text>}
                  <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.content}</Text>
                  <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{timeAgo(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.noMsgs}>No messages yet. Start the conversation.</Text>
          }
          contentContainerStyle={styles.msgList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        {/* ── Input ── */}
        {consultation.status !== 'declined' && consultation.status !== 'completed' && (
          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              placeholder="Type a message…"
              value={msgText}
              onChangeText={setMsgText}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!msgText.trim() || sending) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!msgText.trim() || sending}
            >
              {sending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="send" size={16} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 15, color: Colors.textMuted },

  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, padding: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  infoText: { flex: 1 },
  infoName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  infoConcern: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  videoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12 },
  videoCallBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary,
    borderRadius: 12, paddingVertical: 13,
  },
  videoCallLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  editLinkBtn: {
    width: 44, height: 44, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  addLinkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 12, marginBottom: 4,
    padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
  },
  addLinkText: { color: Colors.primary, fontSize: 13, fontWeight: '600', flex: 1 },
  linkInputBox: {
    marginHorizontal: 12, marginBottom: 8,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
  },
  linkInputLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  linkInputHint: { fontSize: 11, color: Colors.textMuted, marginBottom: 10 },
  linkInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, backgroundColor: '#fafafa',
  },
  linkActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 14, marginTop: 10 },
  linkCancelText: { color: Colors.textMuted, fontSize: 13 },
  linkSaveBtn: { backgroundColor: Colors.primary, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  linkSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  doctorActions: { flexDirection: 'row', gap: 10, margin: 12 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  declineBtn: { backgroundColor: '#ffebee' },
  declineBtnLabel: { color: Colors.danger, fontWeight: '700' },
  acceptBtn: { backgroundColor: Colors.primary },
  acceptBtnLabel: { color: '#fff', fontWeight: '700' },
  completeBtn: {
    margin: 12, borderRadius: 10, paddingVertical: 11,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primary,
  },
  completeBtnLabel: { color: Colors.primary, fontWeight: '700' },

  msgList: { padding: 14, paddingBottom: 8, flexGrow: 1 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgBubble: { maxWidth: '75%', borderRadius: 16, padding: 10 },
  msgBubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  msgBubbleThem: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4 },
  msgSender: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  msgText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  msgTextMe: { color: '#fff' },
  msgTime: { fontSize: 10, color: Colors.textMuted, marginTop: 3 },
  msgTimeMe: { color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
  noMsgs: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 14 },

  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 10, borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9, fontSize: 14,
    maxHeight: 100, backgroundColor: '#fafafa',
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
