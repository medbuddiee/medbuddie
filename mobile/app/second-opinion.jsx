import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, FlatList, Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserAvatar from '../components/UserAvatar';
import { apiFetch } from '../utils/api';
import { useUser } from '../context/UserContext';
import { Colors } from '../constants/colors';

/* ── Doctor picker modal ────────────────────────────────────────────────── */
function DoctorPicker({ visible, onSelect, onClose }) {
  const [doctors, setDoctors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');

  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/api/users/doctors/list');
        setDoctors(res.ok ? await res.json() : []);
      } catch { setDoctors([]); }
      finally { setLoading(false); }
    })();
  }, [visible]);

  const filtered = query.trim()
    ? doctors.filter(d =>
        d.name?.toLowerCase().includes(query.toLowerCase()) ||
        d.doctorSpecialties?.some(s => s.toLowerCase().includes(query.toLowerCase()))
      )
    : doctors;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select a Doctor</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or specialty…"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 30 }} />
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyText}>No verified doctors found.</Text>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.doctorRow} onPress={() => { onSelect(item); onClose(); }}>
                <UserAvatar name={item.name} avatarUrl={item.avatarUrl} size={44} />
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{item.name}</Text>
                  <Text style={styles.doctorSpec}>
                    {item.doctorSpecialties?.join(', ') || 'General Practice'}
                  </Text>
                  {item.completedConsultations > 0 && (
                    <Text style={styles.doctorMeta}>{item.completedConsultations} consultations</Text>
                  )}
                </View>
                <MaterialIcons name="verified" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ padding: 16 }}
          />
        )}
      </View>
    </Modal>
  );
}

/* ── Main screen ────────────────────────────────────────────────────────── */
export default function SecondOpinionScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [opinions, setOpinions]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [concern, setConcern]         = useState('');
  const [medicalHistory, setMedHistory] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [showPicker, setShowPicker]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/second-opinions');
        setOpinions(res.ok ? await res.json() : []);
      } catch { setOpinions([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!concern.trim()) {
      Alert.alert('Required', 'Please describe your concern.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/second-opinions', {
        method: 'POST',
        body: JSON.stringify({
          concern: concern.trim(),
          medicalHistory: medicalHistory.trim(),
          doctorName:      selectedDoctor?.name || '',
          doctorSpecialty: selectedDoctor?.doctorSpecialties?.[0] || '',
        }),
      });
      if (res.ok) {
        const newOp = await res.json();
        setOpinions(prev => [newOp, ...prev]);
        setConcern(''); setMedHistory(''); setSelectedDoctor(null);
        Alert.alert('Submitted!', 'Your second opinion request has been submitted.');
      } else {
        Alert.alert('Error', (await res.json()).error || 'Could not submit request.');
      }
    } catch {
      Alert.alert('Error', 'Cannot reach the server.');
    } finally { setSubmitting(false); }
  };

  return (
    <>
      <Stack.Screen options={{
        title: 'Second Opinion',
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerShown: true,
      }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* ── Request form ── */}
          {user && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Request a Second Opinion</Text>
              <Text style={styles.cardSub}>
                Describe your situation and optionally choose a specific doctor.
              </Text>

              {/* Doctor selection */}
              <Text style={styles.label}>Preferred doctor (optional)</Text>
              <TouchableOpacity
                style={styles.doctorPickerBtn}
                onPress={() => setShowPicker(true)}
              >
                {selectedDoctor ? (
                  <View style={styles.selectedDoctorRow}>
                    <UserAvatar name={selectedDoctor.name} avatarUrl={selectedDoctor.avatarUrl} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedDoctorName}>{selectedDoctor.name}</Text>
                      <Text style={styles.selectedDoctorSpec}>
                        {selectedDoctor.doctorSpecialties?.join(', ')}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedDoctor(null)}>
                      <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.pickDoctorRow}>
                    <Ionicons name="person-add" size={18} color={Colors.primary} />
                    <Text style={styles.pickDoctorText}>Choose a verified doctor</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Concern */}
              <Text style={styles.label}>Describe your concern *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your symptoms, current diagnosis, medications, and your question…"
                value={concern}
                onChangeText={setConcern}
                multiline
                maxLength={2000}
              />

              {/* Medical history */}
              <Text style={styles.label}>Relevant medical history (optional)</Text>
              <TextInput
                style={[styles.input, { minHeight: 70, textAlignVertical: 'top', paddingTop: 10 }]}
                placeholder="Previous conditions, surgeries, allergies…"
                value={medicalHistory}
                onChangeText={setMedHistory}
                multiline
                maxLength={2000}
              />

              <TouchableOpacity
                style={[styles.submitBtn, (!concern.trim() || submitting) && styles.disabledBtn]}
                onPress={handleSubmit}
                disabled={!concern.trim() || submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitBtnLabel}>Submit Request</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {/* ── Past requests ── */}
          <Text style={styles.sectionTitle}>Your Requests</Text>
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
          ) : opinions.length === 0 ? (
            <Text style={styles.emptyText}>No requests yet.</Text>
          ) : (
            opinions.map(op => (
              <View key={op.id} style={styles.opCard}>
                <View style={styles.opHeader}>
                  <View style={[styles.statusBadge,
                    op.status === 'pending' ? styles.pendingBadge : styles.resolvedBadge]}>
                    <Text style={styles.statusLabel}>{op.status || 'pending'}</Text>
                  </View>
                  <Text style={styles.opDate}>
                    {new Date(op.submittedAt).toLocaleDateString()}
                  </Text>
                </View>
                {op.doctorName ? (
                  <Text style={styles.opDoctor}>
                    <Ionicons name="person" size={12} /> {op.doctorName}
                    {op.doctorSpecialty ? ` · ${op.doctorSpecialty}` : ''}
                  </Text>
                ) : null}
                <Text style={styles.opConcern} numberOfLines={3}>{op.concern}</Text>
              </View>
            ))
          )}
        </ScrollView>

        <DoctorPicker
          visible={showPicker}
          onSelect={setSelectedDoctor}
          onClose={() => setShowPicker(false)}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  cardSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#fafafa',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top', paddingTop: 10 },
  doctorPickerBtn: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    backgroundColor: '#fafafa', padding: 12,
  },
  pickDoctorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickDoctorText: { flex: 1, color: Colors.textMuted, fontSize: 14 },
  selectedDoctorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedDoctorName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  selectedDoctorSpec: { fontSize: 12, color: Colors.textMuted },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 20,
  },
  submitBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabledBtn: { opacity: 0.5 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 20 },
  opCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 10 },
  opHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  pendingBadge: { backgroundColor: '#fff3e0' },
  resolvedBadge: { backgroundColor: Colors.primaryBg },
  statusLabel: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary },
  opDate: { fontSize: 11, color: Colors.textMuted },
  opDoctor: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginBottom: 4 },
  opConcern: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, padding: 12, backgroundColor: Colors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14 },
  doctorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 12,
    padding: 14, marginBottom: 10,
  },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  doctorSpec: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  doctorMeta: { fontSize: 11, color: Colors.primary, marginTop: 2 },
});
