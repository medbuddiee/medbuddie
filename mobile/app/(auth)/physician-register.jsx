import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { apiFetch } from '../../utils/api';
import { Colors } from '../../constants/colors';

const ALL_SPECIALTIES = [
  'Cardiology','Dermatology','Endocrinology','Gastroenterology',
  'General Practice','Geriatrics','Hematology','Infectious Disease',
  'Internal Medicine','Nephrology','Neurology','Obstetrics & Gynecology',
  'Oncology','Ophthalmology','Orthopedics','Pediatrics',
  'Psychiatry','Pulmonology','Radiology','Rheumatology',
  'Surgery','Urology',
];

export default function PhysicianRegister() {
  const router = useRouter();
  const { login } = useUser();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    npiNumber: '', licenseNumber: '', yearsExperience: '', doctorBio: '',
  });
  const [specialties, setSpecialties] = useState([]);
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [npiStatus, setNpiStatus]     = useState(null); // null | 'checking' | 'verified' | 'error'
  const [npiMsg, setNpiMsg]           = useState('');

  const set = key => val => setForm(f => ({ ...f, [key]: val }));
  const toggleSpec = s => setSpecialties(prev =>
    prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
  );

  const verifyNpi = async () => {
    const npi = form.npiNumber.trim().replace(/\D/g, '');
    if (npi.length !== 10) { setNpiStatus('error'); setNpiMsg('NPI must be exactly 10 digits'); return; }
    setNpiStatus('checking'); setNpiMsg('');
    try {
      const res = await apiFetch(`/api/npi/verify?npi=${npi}`);
      const data = await res.json();
      if (!res.ok || !data.verified) { setNpiStatus('error'); setNpiMsg(data.error || 'NPI not found'); return; }
      setNpiStatus('verified');
      setNpiMsg(`✓ Verified: ${data.name || 'Provider found'}`);
      if (data.specialties?.length) {
        setSpecialties(prev => [...new Set([...prev, ...data.specialties.filter(s => ALL_SPECIALTIES.includes(s))])]);
      }
    } catch { setNpiStatus('error'); setNpiMsg('Could not reach verification service.'); }
  };

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (form.password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
    if (!specialties.length) { Alert.alert('Error', 'Select at least one specialty'); return; }
    if (npiStatus !== 'verified') { Alert.alert('Error', 'Please verify your NPI number first'); return; }

    setLoading(true);
    try {
      const res = await apiFetch('/api/doctor-signup', {
        method: 'POST',
        body: JSON.stringify({
          name:            form.name,
          email:           form.email,
          password:        form.password,
          npiNumber:       form.npiNumber.trim().replace(/\D/g, ''),
          npiVerified:     true,
          licenseNumber:   form.licenseNumber,
          specialties,
          doctorBio:       form.doctorBio,
          yearsExperience: parseInt(form.yearsExperience) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Registration failed', data.error || 'Could not register.'); return; }
      await login(data.user, data.token);
      router.replace('/(tabs)/feed');
    } catch { Alert.alert('Error', 'Cannot reach the server.'); }
    finally { setLoading(false); }
  };

  const npiColor = npiStatus === 'verified' ? Colors.primary : npiStatus === 'error' ? Colors.danger : Colors.textMuted;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="local-hospital" size={32} color="#fff" />
          </View>
          <Text style={styles.brand}>Physician Registration</Text>
          <Text style={styles.tagline}>Join MedBuddie as a verified doctor</Text>
        </View>

        <View style={styles.card}>

          {/* Basic info */}
          <Text style={styles.sectionTitle}>Personal Info</Text>
          {[
            { label: 'Full name', key: 'name', placeholder: 'Dr. Jane Smith' },
            { label: 'Email', key: 'email', placeholder: 'doctor@hospital.com', type: 'email-address' },
          ].map(({ label, key, placeholder, type }) => (
            <View key={key}>
              <Text style={styles.label}>{label}</Text>
              <TextInput style={styles.input} placeholder={placeholder} value={form[key]}
                onChangeText={set(key)} keyboardType={type || 'default'} autoCapitalize={key === 'email' ? 'none' : 'words'} />
            </View>
          ))}

          <Text style={styles.label}>Password</Text>
          <View style={styles.pwRow}>
            <TextInput style={[styles.input, styles.pwInput]} placeholder="Min 8 characters"
              value={form.password} onChangeText={set('password')} secureTextEntry={!showPw} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(s => !s)}>
              <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm password</Text>
          <TextInput style={styles.input} placeholder="Repeat password"
            value={form.confirmPassword} onChangeText={set('confirmPassword')} secureTextEntry={!showPw} />

          {/* NPI Verification */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>NPI Verification</Text>
          <Text style={styles.hint}>Your 10-digit National Provider Identifier (NPI) number</Text>
          <View style={styles.npiRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="1234567890"
              value={form.npiNumber}
              onChangeText={set('npiNumber')}
              keyboardType="number-pad"
              maxLength={10}
            />
            <TouchableOpacity
              style={[styles.verifyBtn, npiStatus === 'checking' && styles.disabledBtn]}
              onPress={verifyNpi}
              disabled={npiStatus === 'checking'}
            >
              {npiStatus === 'checking'
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.verifyBtnLabel}>Verify</Text>
              }
            </TouchableOpacity>
          </View>
          {npiMsg ? <Text style={[styles.npiMsg, { color: npiColor }]}>{npiMsg}</Text> : null}

          {/* Professional info */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Professional Info</Text>
          {[
            { label: 'License number', key: 'licenseNumber', placeholder: 'State license #' },
            { label: 'Years of experience', key: 'yearsExperience', placeholder: '10', type: 'number-pad' },
          ].map(({ label, key, placeholder, type }) => (
            <View key={key}>
              <Text style={styles.label}>{label}</Text>
              <TextInput style={styles.input} placeholder={placeholder} value={form[key]}
                onChangeText={set(key)} keyboardType={type || 'default'} />
            </View>
          ))}

          <Text style={styles.label}>Bio (optional)</Text>
          <TextInput
            style={[styles.input, { minHeight: 70, textAlignVertical: 'top', paddingTop: 10 }]}
            placeholder="Brief professional bio…"
            value={form.doctorBio}
            onChangeText={set('doctorBio')}
            multiline
          />

          {/* Specialties */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Specialties *</Text>
          <View style={styles.specGrid}>
            {ALL_SPECIALTIES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.specChip, specialties.includes(s) && styles.specChipActive]}
                onPress={() => toggleSpec(s)}
              >
                <Text style={[styles.specChipText, specialties.includes(s) && styles.specChipTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnLabel}>Complete Registration</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.signinLink} onPress={() => router.back()}>
            <Text style={styles.signinLinkText}>Already registered? <Text style={styles.signinLinkBold}>Sign in →</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#1a3a5c' },
  container: { flexGrow: 1, alignItems: 'center', paddingBottom: 40 },
  hero: { alignItems: 'center', paddingTop: 50, paddingBottom: 24 },
  heroIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  brand: { fontSize: 22, fontWeight: '800', color: '#fff' },
  tagline: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  card: {
    width: '100%', backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    flex: 1, padding: 24, paddingTop: 28,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1a3a5c', marginBottom: 8, letterSpacing: 0.3 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 5, marginTop: 10 },
  hint: { fontSize: 11, color: Colors.textMuted, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14,
    color: Colors.textPrimary, backgroundColor: '#fafafa',
  },
  pwRow: { position: 'relative' },
  pwInput: { paddingRight: 40 },
  eyeBtn: { position: 'absolute', right: 12, top: 12 },
  npiRow: { flexDirection: 'row', gap: 8 },
  verifyBtn: {
    backgroundColor: '#1a3a5c', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 11, justifyContent: 'center',
  },
  verifyBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },
  npiMsg: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  specChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fafafa',
  },
  specChipActive: { backgroundColor: '#1a3a5c', borderColor: '#1a3a5c' },
  specChipText: { fontSize: 12, color: Colors.textSecondary },
  specChipTextActive: { color: '#fff', fontWeight: '600' },
  primaryBtn: {
    backgroundColor: '#1a3a5c', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 24,
  },
  primaryBtnLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disabledBtn: { opacity: 0.5 },
  signinLink: { alignItems: 'center', marginTop: 14 },
  signinLinkText: { color: Colors.textSecondary, fontSize: 13 },
  signinLinkBold: { color: '#1a3a5c', fontWeight: '700' },
});
