import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import PostCard from '../../components/PostCard';
import { apiFetch } from '../../utils/api';
import { getSocket } from '../../utils/socket';
import { useUser } from '../../context/UserContext';
import { Colors } from '../../constants/colors';

const POST_TYPES = [
  { id: 'medical_question', label: 'Question' },
  { id: 'medical_opinion',  label: 'Opinion'  },
  { id: 'personal',         label: 'Personal'  },
];

const FILTERS = [
  { id: 'new',       label: 'New'      },
  { id: 'popular',   label: 'Popular'  },
  { id: 'physicians', label: 'Doctors' },
];

export default function FeedScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [content, setContent]     = useState('');
  const [postType, setPostType]   = useState('medical_question');
  const [filter, setFilter]       = useState('new');
  const [posting, setPosting]     = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  const fetchPosts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiFetch('/api/posts?limit=30');
      setPosts(res.ok ? await res.json() : []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Real-time feed updates
  useEffect(() => {
    const socket = getSocket();

    const onCreated = (post) => {
      setPosts(prev => prev.some(p => p.id === post.id) ? prev : [post, ...prev]);
    };
    const onLiked = ({ id, likes, likedByMe }) => {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes, likedByMe } : p));
    };
    const onDeleted = ({ id }) => {
      setPosts(prev => prev.filter(p => p.id !== id));
    };

    socket.on('post:created', onCreated);
    socket.on('post:liked',   onLiked);
    socket.on('post:deleted', onDeleted);

    return () => {
      socket.off('post:created', onCreated);
      socket.off('post:liked',   onLiked);
      socket.off('post:deleted', onDeleted);
    };
  }, []);

  const handleRefresh = () => { setRefreshing(true); fetchPosts(true); };

  const handlePost = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    try {
      const res = await apiFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content: content.trim(), type: postType, tags: [] }),
      });
      if (res.ok) {
        const newPost = await res.json();
        setPosts((prev) => [newPost, ...prev]);
        setContent('');
        setShowCompose(false);
      } else {
        Alert.alert('Error', (await res.json()).error || 'Could not create post.');
      }
    } catch {
      Alert.alert('Error', 'Cannot reach the server.');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    setPosts((prev) => prev.map((p) =>
      p.id !== postId ? p
        : { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? Math.max(0, p.likes - 1) : p.likes + 1 }
    ));
    try {
      const res = await apiFetch(`/api/posts/${postId}/like`, { method: 'POST' });
      if (res.ok) {
        const { likes, likedByMe } = await res.json();
        setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes, likedByMe } : p));
      }
    } catch { /* silent - optimistic already applied */ }
  };

  const handleDelete = async (postId) => {
    try {
      const res = await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch { /* silent */ }
  };

  const visible = (() => {
    let list = filter === 'physicians' ? posts.filter((p) => p.type === 'medical_opinion') : [...posts];
    if (filter === 'popular') list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return list;
  })();

  const ListHeader = (
    <View>
      {/* Welcome */}
      <View style={styles.welcomeRow}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.name?.split(' ')[0] || 'there'}!
        </Text>
        <TouchableOpacity onPress={() => router.push('/second-opinion')} style={styles.opinionBtn}>
          <Text style={styles.opinionBtnLabel}>2nd Opinion</Text>
        </TouchableOpacity>
      </View>

      {/* Compose toggle */}
      {!showCompose ? (
        <TouchableOpacity style={styles.composeTrigger} onPress={() => setShowCompose(true)}>
          <Ionicons name="add-circle" size={20} color={Colors.primary} />
          <Text style={styles.composeTriggerText}>Start a MedPost…</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.composeBox}>
          <View style={styles.typeRow}>
            {POST_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.typeBtn, postType === t.id && styles.typeBtnActive]}
                onPress={() => setPostType(t.id)}
              >
                <Text style={[styles.typeBtnLabel, postType === t.id && styles.typeBtnLabelActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.composeInput}
            placeholder="Share a medical question, opinion, or personal update…"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={2000}
          />
          <View style={styles.composeActions}>
            <TouchableOpacity onPress={() => { setShowCompose(false); setContent(''); }}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.postBtn, (!content.trim() || posting) && styles.disabledBtn]}
              onPress={handlePost}
              disabled={!content.trim() || posting}
            >
              {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.postBtnLabel}>Post</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterBtn, filter === f.id && styles.filterBtnActive]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterLabel, filter === f.id && styles.filterLabelActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

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
        data={visible}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={user?.id}
            onLike={handleLike}
            onDelete={handleDelete}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No posts yet — be the first to share!</Text>
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
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  welcomeText: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  opinionBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  opinionBtnLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  composeTrigger: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  composeTriggerText: { color: Colors.textMuted, fontSize: 14 },
  composeBox: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  typeBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnLabel: { fontSize: 12, color: Colors.textSecondary },
  typeBtnLabelActive: { color: '#fff', fontWeight: '600' },
  composeInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top',
  },
  composeActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 10 },
  cancelLabel: { fontSize: 14, color: Colors.textSecondary },
  postBtn: { backgroundColor: Colors.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  postBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  disabledBtn: { opacity: 0.5 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  filterLabelActive: { color: '#fff', fontWeight: '700' },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 15 },
});
