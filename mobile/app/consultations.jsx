import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserAvatar from '../components/UserAvatar';
import { apiFetch } from '../utils/api';
import { useUser } from '../context/UserContext';
import { Colors } from '../constants/colors';

const STATUS_COLORS = {
  pending:   { bg: '#fff8e1', color: '#f57f17' },
  accepted:  { bg: Colors.primaryBg, color: Colors.primary },
  declined:  { bg: '#ffebee', color: Colors.danger },
  completed: { bg: '#e8f5e9', color: '#2e7d32' },
};

export default function ConsultationsScreen() {
  const router      = useRouter();
  const { user }    = useUser();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

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

  const renderItem = ({ item }) => {
    const isDoctor  = user?.id === item.doctorId;
    const other     = isDoctor
      ? { name: item.patientName, avatar: item.patientAvatar, role: 'Patient' }
      : { name: item.doctorName,  avatar: item.doctorAvatar,  role: 'Dr.' };
    const s = STATUS_COLORS[item.status] || STATUS_COLORS.pending;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/consultation/${item.id}`)}
      >
        <UserAvatar name={other.name} avatarUrl={other.avatar} size={46} />
        <View style={styles.cardBody}>
          <Text style={styles.cardName}>{other.role} {other.name}</Text>
          <Text style={styles.cardConcern} numberOfLines={2}>{item.concern}</Text>
          <Text style={styles.cardDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.color }]}>{item.status}</Text>
          </View>
          {item.meetingUrl && item.status === 'accepted' && (
            <View style={styles.videoBadge}>
              <Ionicons name="videocam" size={11} color={Colors.primary} />
              <Text style={styles.videoText}> Ready</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen options={{
        title: 'My Consultations',
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerShown: true,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push('/second-opinion')}
            style={{ marginRight: 14 }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {loading ? (
          <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>
        ) : (
          <FlatList
            data={consultations}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="videocam-outline" size={52} color={Colors.border} />
                <Text style={styles.emptyTitle}>No consultations yet</Text>
                <Text style={styles.emptySub}>
                  Request a second opinion and choose a doctor to start a consultation.
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => router.push('/second-opinion')}
                >
                  <Text style={styles.emptyBtnLabel}>Request Second Opinion</Text>
                </TouchableOpacity>
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
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 12,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  cardConcern: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  cardDate: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignItems: 'center' },
  statusText: { fontSize: 11, fontWeight: '700' },
  videoBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  videoText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { backgroundColor: Colors.primary, borderRadius: 24, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
