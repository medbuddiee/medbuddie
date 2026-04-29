import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../../utils/api';
import { Colors } from '../../constants/colors';

const CARD_COLORS = [Colors.primary, Colors.blue, Colors.purple, Colors.red];

export default function GuidelinesScreen() {
  const router = useRouter();
  const [guidelines, setGuidelines] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery]           = useState('');

  const fetchGuidelines = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiFetch('/api/guidelines?limit=50');
      setGuidelines(res.ok ? await res.json() : []);
    } catch { setGuidelines([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchGuidelines(); }, [fetchGuidelines]);

  const handleRefresh = () => { setRefreshing(true); fetchGuidelines(true); };

  const filtered = query.trim()
    ? guidelines.filter((g) =>
        g.title?.toLowerCase().includes(query.toLowerCase()) ||
        g.specialty?.toLowerCase().includes(query.toLowerCase())
      )
    : guidelines;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
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
              placeholder="Search guidelines…"
              value={query}
              onChangeText={setQuery}
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.card, { borderLeftColor: CARD_COLORS[index % CARD_COLORS.length] }]}
            onPress={() => router.push(`/guideline/${item.id}`)}
          >
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardSource}>{item.source}</Text>
              {item.specialty && (
                <View style={styles.specialtyBadge}>
                  <Text style={styles.specialtyText}>{item.specialty}</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No guidelines found.</Text>
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
    padding: 14, marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  cardBody: { flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  cardSource: { fontSize: 12, color: Colors.textMuted },
  specialtyBadge: {
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: Colors.primaryBg, paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: 10,
  },
  specialtyText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 15 },
});
