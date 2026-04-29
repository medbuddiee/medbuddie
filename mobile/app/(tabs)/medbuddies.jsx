import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserAvatar from '../../components/UserAvatar';
import { apiFetch } from '../../utils/api';
import { getSocket } from '../../utils/socket';
import { useUser } from '../../context/UserContext';
import { Colors } from '../../constants/colors';

export default function MedBuddiesScreen() {
  const { user } = useUser();
  const [people, setPeople]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery]           = useState('');
  const [following, setFollowing]   = useState(new Set());

  const fetchPeople = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiFetch('/api/users');
      const data = res.ok ? await res.json() : [];
      setPeople(data);
      setFollowing(new Set(data.filter((u) => u.isFollowing).map((u) => u.id)));
    } catch { setPeople([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPeople(); }, [fetchPeople]);

  const handleRefresh = () => { setRefreshing(true); fetchPeople(true); };

  // Real-time follow count updates
  useEffect(() => {
    const socket = getSocket();
    const onFollowChanged = ({ followingId, followerId, following: isFollowing, followersCount, followingCount }) => {
      setPeople(prev => prev.map(p => {
        if (p.id === followingId) return { ...p, followersCount };
        if (p.id === followerId)  return { ...p, followingCount };
        return p;
      }));
    };
    socket.on('follow:changed', onFollowChanged);
    return () => socket.off('follow:changed', onFollowChanged);
  }, []);

  const handleFollow = async (targetId) => {
    const wasFollowing = following.has(targetId);
    setFollowing((prev) => {
      const next = new Set(prev);
      wasFollowing ? next.delete(targetId) : next.add(targetId);
      return next;
    });
    try {
      await apiFetch(`/api/users/${targetId}/follow`, { method: 'POST' });
    } catch {
      // revert
      setFollowing((prev) => {
        const next = new Set(prev);
        wasFollowing ? next.add(targetId) : next.delete(targetId);
        return next;
      });
    }
  };

  const filtered = query.trim()
    ? people.filter((p) =>
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.username?.toLowerCase().includes(query.toLowerCase())
      )
    : people;

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search people…"
              value={query}
              onChangeText={setQuery}
            />
          </View>
        }
        renderItem={({ item }) => {
          const isMe       = user?.id === item.id;
          const isFollowed = following.has(item.id);
          return (
            <View style={styles.card}>
              <UserAvatar name={item.name || item.username} avatarUrl={item.avatarUrl} size={46} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.name || item.username}</Text>
                {item.isVerifiedDoctor && (
                  <View style={styles.doctorRow}>
                    <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
                    <Text style={styles.doctorLabel}> Verified Doctor</Text>
                  </View>
                )}
                {item.bio ? <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text> : null}
              </View>
              {!isMe && (
                <TouchableOpacity
                  style={[styles.followBtn, isFollowed && styles.followingBtn]}
                  onPress={() => handleFollow(item.id)}
                >
                  <Text style={[styles.followLabel, isFollowed && styles.followingLabel]}>
                    {isFollowed ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No MedBuddies found.</Text>
        }
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 12, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12,
    padding: 14, marginBottom: 10, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  doctorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  doctorLabel: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  bio: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  followBtn: {
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  followingBtn: { backgroundColor: Colors.primary },
  followLabel: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  followingLabel: { color: '#fff' },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 15 },
});
