import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Linking,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserAvatar from '../components/UserAvatar';
import { apiFetch } from '../utils/api';
import { useUser } from '../context/UserContext';
import { Colors } from '../constants/colors';

const FILTERS = [
  { id: 'all',       label: 'All'       },
  { id: 'pending',   label: 'Pending'   },
  { id: 'accepted',  label: 'Active'    },
  { id: 'completed', label: 'Completed' },
];

const STATUS_META = {
  pending:   { bg: '#fff8e1', color: '#f57f17', label: 'Pending'   },
  accepted:  { bg: Colors.primaryBg, color: Colors.primary, label: 'Active' },
  declined:  { bg: '#ffebee', color: Colors.danger, label: 'Declined'  },
  completed: { bg: '#e8eaf6', color: '#3949ab', label: 'Completed' },
};

/* ── Stats card ─────────────────────────────────────────────────────────── */
function StatsBar({ consultations }) {
  const pending   = consultations.filter(c => c.status === 'pending').length;
  const active    = consultations.filter(c => c.status === 'accepted').length;
  const completed = consultations.filter(c => c.status === 'completed').length;

  return (
    <View style={styles.statsBar}>
      {[
        { label: 'Pending',   value: pending,   color: '#f57f17' },
        { label: 'Active',    value: active,    color: Colors.primary },
        { label: 'Completed', value: completed, color: '#3949ab' },
      ].map(({ label, value, color }) => (
        <View key={label} style={styles.statItem}>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

/* ── Consultation card ───────────────────────────────────────────────────── */
function ConsultationCard({ item, onAccept, onDecline, onOpen, updating }) {
  const s = STATUS_META[item.status] || STATUS_META.pending;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onOpen(item)}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <UserAvatar name={item.patientName} avatarUrl={item.patientAvatar} size={42} />
        <View style={styles.cardMeta}>
          <Text style={styles.cardPatient}>{item.patientName}</Text>
          <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
          <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>

      {/* Concern */}
      <Text style={styles.cardConcern} numberOfLines={2}>{item.concern}</Text>

      {/* Video call ready badge */}
      {item.meetingUrl && item.status === 'accepted' && (
        <View style={styles.videoBadge}>
          <Ionicons name="videocam" size={12} color={Colors.primary} />
          <Text style={styles.videoBadgeText}> Video call ready</Text>
        </View>
      )}

      {/* Pending actions */}
      {item.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={() => onDecline(item)}
            disabled={updating === item.id}
          >
            <Ionicons name="close" size={14} color={Colors.danger} />
            <Text style={styles.declineLabel}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => onAccept(item)}
            disabled={updating === item.id}
          >
            {updating === item.id
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                  <Text style={styles.acceptLabel}>Accept</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Open chat hint */}
      {(item.status === 'accepted' || item.status === 'completed') && (
        <View style={styles.openHint}>
          <Ionicons name="chatbubble-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.openHintText}>Tap to open chat</Text>
          <Ionicons name="chevron-forward" size={13} color={Colors.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function DoctorDashboard() {
  const router    = useRouter();
  const { user, logout } = useUser();

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [filter, setFilter]               = useState('all');
  const [updating, setUpdating]           = useState(null);

  const fetchConsultations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiFetch('/api/consultations');
      setConsultations(res.ok ? await res.json() : []);
    } catch { setConsultations([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchConsultations(); }, [fetchConsultations]);

  const handleRefresh = () => { setRefreshing(true); fetchConsultations(true); };

  const updateStatus = async (item, status) => {
    setUpdating(item.id);
    try {
      const res = await apiFetch(`/api/consultations/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setConsultations(prev =>
          prev.map(c => c.id === item.id ? { ...c, ...updated } : c)
        );
      }
    } catch { Alert.alert('Error', 'Could not update consultation.'); }
    finally { setUpdating(null); }
  };

  const handleAccept = (item) => {
    Alert.alert('Accept consultation', `Accept request from ${item.patientName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: () => updateStatus(item, 'accepted') },
    ]);
  };

  const handleDecline = (item) => {
    Alert.alert('Decline consultation', `Decline request from ${item.patientName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => updateStatus(item, 'declined') },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Sign out', 'Sign out of your physician account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } },
    ]);
  };

  const visible = filter === 'all'
    ? consultations
    : consultations.filter(c => c.status === filter);

  return (
    <>
      <Stack.Screen options={{
        title: 'Doctor Workspace',
        headerStyle: { backgroundColor: '#1a3a5c' },
        headerTintColor: '#fff',
        headerShown: true,
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 14 }}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        ),
      }} />

      <SafeAreaView style={styles.safe} edges={['bottom']}>

        {/* Doctor info header */}
        <View style={styles.docHeader}>
          <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size={50} />
          <View style={styles.docInfo}>
            <Text style={styles.docName}>{user?.name}</Text>
            <View style={styles.verifiedRow}>
              <MaterialIcons name="verified" size={13} color="#4caf50" />
              <Text style={styles.verifiedText}> Verified Physician</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        {!loading && <StatsBar consultations={consultations} />}

        {/* Filter bar */}
        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterBtn, filter === f.id && styles.filterBtnActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[styles.filterLabel, filter === f.id && styles.filterLabelActive]}>
                {f.label}
                {f.id !== 'all' && consultations.filter(c => c.status === f.id).length > 0
                  ? ` (${consultations.filter(c => c.status === f.id).length})`
                  : ''
                }
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Consultation list */}
        {loading ? (
          <View style={styles.centered}><ActivityIndicator color="#1a3a5c" size="large" /></View>
        ) : (
          <FlatList
            data={visible}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <ConsultationCard
                item={item}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onOpen={item => router.push(`/consultation/${item.id}`)}
                updating={updating}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1a3a5c" />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="stethoscope" size={52} color={Colors.border} />
                <Text style={styles.emptyTitle}>
                  {filter === 'all' ? 'No consultations yet' : `No ${filter} consultations`}
                </Text>
                <Text style={styles.emptySub}>
                  Patients can request consultations through the Second Opinion feature.
                </Text>
              </View>
            }
            contentContainerStyle={styles.list}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  docHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1a3a5c', paddingHorizontal: 16, paddingVertical: 14,
  },
  docInfo: { flex: 1 },
  docName: { fontSize: 17, fontWeight: '700', color: '#fff' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  verifiedText: { fontSize: 12, color: '#a5d6a7', fontWeight: '500' },

  statsBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  filterRow: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: 8, paddingVertical: 6, gap: 6,
  },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: '#1a3a5c', borderColor: '#1a3a5c' },
  filterLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  filterLabelActive: { color: '#fff', fontWeight: '700' },

  list: { padding: 12, paddingBottom: 40, flexGrow: 1 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 14,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardMeta: { flex: 1 },
  cardPatient: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardConcern: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 10 },

  videoBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primaryBg, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8,
  },
  videoBadgeText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 10 },
  declineBtn: { backgroundColor: '#ffebee' },
  declineLabel: { color: Colors.danger, fontWeight: '700', fontSize: 13 },
  acceptBtn: { backgroundColor: '#1a3a5c' },
  acceptLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },

  openHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  openHintText: { flex: 1, fontSize: 12, color: Colors.textMuted },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
