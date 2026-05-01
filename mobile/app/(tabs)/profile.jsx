import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserAvatar from '../../components/UserAvatar';
import { apiFetch } from '../../utils/api';
import { useUser } from '../../context/UserContext';
import { Colors } from '../../constants/colors';

const TABS = ['Health Overview', 'My Posts'];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useUser();
  const [profile, setProfile]       = useState(null);
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab]   = useState(0);

  const fetchProfile = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const res = await apiFetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        updateUser(data);
      } else {
        setProfile(user);
      }
    } catch { setProfile(user); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleRefresh = () => { setRefreshing(true); fetchProfile(true); };

  useEffect(() => {
    if (activeTab !== 1 || !user?.id) return;
    (async () => {
      try {
        const res = await apiFetch(`/api/posts?userId=${user.id}`);
        if (res.ok) setPosts(await res.json());
      } catch { /* silent */ }
    })();
  }, [activeTab, user?.id]);

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } },
    ]);
  };

  if (!user) return null;
  const display = profile || user;
  const meds = display.medications?.filter((m) => m.name) || [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <UserAvatar name={display.name} avatarUrl={display.avatarUrl} size={72} />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{display.name || 'No name'}</Text>
            {display.bio ? <Text style={styles.bio}>{display.bio}</Text> : null}
            {display.isVerifiedDoctor && (
              <View style={styles.doctorRow}>
                <MaterialIcons name="verified" size={14} color={Colors.primary} />
                <Text style={styles.doctorLabel}> Verified Doctor</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
            <Ionicons name="create-outline" size={15} color={Colors.primary} />
            <Text style={styles.editBtnLabel}> Edit profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={15} color={Colors.danger} />
            <Text style={styles.logoutBtnLabel}> Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Consultations banner */}
        <TouchableOpacity style={styles.syncBanner} onPress={() => router.push('/consultations')}>
          <Ionicons name="videocam-outline" size={18} color={Colors.primary} />
          <View style={styles.syncBannerText}>
            <Text style={styles.syncBannerTitle}>My Consultations</Text>
            <Text style={styles.syncBannerSub}>Video calls with verified doctors</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Health sync banner */}
        <TouchableOpacity style={styles.syncBanner} onPress={() => router.push('/health-sync')}>
          <MaterialCommunityIcons name="heart-pulse" size={18} color={Colors.primary} />
          <View style={styles.syncBannerText}>
            <Text style={styles.syncBannerTitle}>Sync Health Data</Text>
            <Text style={styles.syncBannerSub}>Apple Health · Fitbit · Whoop · Garmin</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((t, i) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, activeTab === i && styles.tabActive]}
              onPress={() => setActiveTab(i)}
            >
              <Text style={[styles.tabLabel, activeTab === i && styles.tabLabelActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />}

        {/* Health Overview */}
        {!loading && activeTab === 0 && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Personal Stats</Text>
              <View style={styles.statsGrid}>
                {[
                  ['Weight',         display.weight     ? `${display.weight} lbs` : '—'],
                  ['Height',         display.height     || '—'],
                  ['Blood Pressure', display.bloodPressure ? `${display.bloodPressure} mmHg` : '—'],
                  ['HbA1c',          display.hba1c      ? `${display.hba1c}%`   : '—'],
                ].map(([label, val]) => (
                  <View key={label} style={styles.statItem}>
                    <Text style={styles.statLabel}>{label}</Text>
                    <Text style={styles.statValue}>{val}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Medications</Text>
              {meds.length > 0 ? (
                meds.map((m, i) => (
                  <View key={i} style={styles.medRow}>
                    <Ionicons name="medical" size={14} color={Colors.primary} />
                    <Text style={styles.medName}>{m.name}</Text>
                    <Text style={styles.medFreq}>{m.frequency}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyCard}>
                  No medications listed.{' '}
                  <Text style={styles.link} onPress={() => router.push('/edit-profile')}>
                    Add medications →
                  </Text>
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.secondOpinionBtn}
              onPress={() => router.push('/second-opinion')}
            >
              <Ionicons name="chatbubbles-outline" size={16} color="#fff" />
              <Text style={styles.secondOpinionLabel}> Get a Second Opinion</Text>
            </TouchableOpacity>
          </>
        )}

        {/* My Posts */}
        {!loading && activeTab === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>My Posts</Text>
            {posts.length === 0 ? (
              <Text style={styles.emptyCard}>No posts yet.</Text>
            ) : (
              posts.map((p) => (
                <View key={p.id} style={styles.postItem}>
                  <Text style={styles.postContent} numberOfLines={3}>{p.content}</Text>
                  <Text style={styles.postDate}>{new Date(p.created_at).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 12 },
  headerInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  bio: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  doctorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  doctorLabel: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 10, paddingVertical: 9,
  },
  editBtnLabel: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.danger, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16,
  },
  logoutBtnLabel: { color: Colors.danger, fontWeight: '600', fontSize: 14 },
  syncBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.primaryBg, borderRadius: 12,
    padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  syncBannerText: { flex: 1 },
  syncBannerTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  syncBannerSub: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
  card: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statItem: { width: '50%', marginBottom: 12 },
  statLabel: { fontSize: 12, color: Colors.textMuted },
  statValue: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  medName: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  medFreq: { fontSize: 12, color: Colors.textMuted },
  emptyCard: { fontSize: 14, color: Colors.textMuted },
  link: { color: Colors.primary, fontWeight: '600' },
  secondOpinionBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14,
  },
  secondOpinionLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  postItem: {
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  postContent: { fontSize: 14, color: Colors.textPrimary },
  postDate: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
});
