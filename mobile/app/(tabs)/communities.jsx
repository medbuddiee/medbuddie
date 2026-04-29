import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../../utils/api';
import { useUser } from '../../context/UserContext';
import { Colors } from '../../constants/colors';

export default function CommunitiesScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [query, setQuery]             = useState('');
  const [showCreate, setShowCreate]   = useState(false);
  const [newName, setNewName]         = useState('');
  const [newDesc, setNewDesc]         = useState('');
  const [creating, setCreating]       = useState(false);

  const fetchCommunities = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiFetch('/api/communities');
      setCommunities(res.ok ? await res.json() : []);
    } catch { setCommunities([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchCommunities(); }, [fetchCommunities]);

  const handleRefresh = () => { setRefreshing(true); fetchCommunities(true); };

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await apiFetch('/api/communities', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      if (res.ok) {
        const c = await res.json();
        setCommunities((prev) => [c, ...prev]);
        setNewName(''); setNewDesc(''); setShowCreate(false);
      } else {
        Alert.alert('Error', (await res.json()).error || 'Could not create community.');
      }
    } catch {
      Alert.alert('Error', 'Cannot reach the server.');
    } finally { setCreating(false); }
  };

  const filtered = query.trim()
    ? communities.filter((c) => c.name?.toLowerCase().includes(query.toLowerCase()))
    : communities;

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search communities…"
                value={query}
                onChangeText={setQuery}
              />
            </View>
            {user && (
              <TouchableOpacity style={styles.createTrigger} onPress={() => setShowCreate((s) => !s)}>
                <Ionicons name="add-circle" size={18} color={Colors.primary} />
                <Text style={styles.createTriggerLabel}>Create community</Text>
              </TouchableOpacity>
            )}
            {showCreate && (
              <View style={styles.createBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Community name"
                  value={newName}
                  onChangeText={setNewName}
                />
                <TextInput
                  style={[styles.input, { marginTop: 8, minHeight: 60, textAlignVertical: 'top' }]}
                  placeholder="Description (optional)"
                  value={newDesc}
                  onChangeText={setNewDesc}
                  multiline
                />
                <View style={styles.createActions}>
                  <TouchableOpacity onPress={() => setShowCreate(false)}>
                    <Text style={styles.cancelLabel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.createBtn, (!newName.trim() || creating) && styles.disabledBtn]}
                    onPress={handleCreate}
                    disabled={!newName.trim() || creating}
                  >
                    {creating
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.createBtnLabel}>Create</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/community/${item.id}`)}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="people" size={22} color={Colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              ) : null}
              {item.member_count != null && (
                <Text style={styles.cardMeta}>{item.member_count} members</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No communities yet. Be the first to create one!</Text>
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
    paddingHorizontal: 12, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14 },
  createTrigger: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  createTriggerLabel: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  createBox: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
  },
  createActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 14, marginTop: 10 },
  cancelLabel: { color: Colors.textSecondary, fontSize: 14 },
  createBtn: { backgroundColor: Colors.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  createBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  disabledBtn: { opacity: 0.5 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 15 },
});
