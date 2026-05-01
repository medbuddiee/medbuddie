import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { apiFetch } from '../../utils/api';
import { Colors } from '../../constants/colors';

export default function PhysicianSignIn() {
  const router = useRouter();
  const { login } = useUser();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Sign in failed', data.error || 'Invalid credentials'); return; }
      if (!data.user.isDoctor && !data.user.isVerifiedDoctor) {
        Alert.alert('Access denied', 'This portal is for verified physicians only. Use Member Login instead.');
        return;
      }
      await login(data.user, data.token);
      router.replace('/(tabs)/feed');
    } catch {
      Alert.alert('Error', 'Cannot reach the server.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="local-hospital" size={36} color="#fff" />
          </View>
          <Text style={styles.brand}>Physician Portal</Text>
          <Text style={styles.tagline}>MedBuddie for Doctors</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Physician Sign In</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="doctor@hospital.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.pwRow}>
            <TextInput
              style={[styles.input, styles.pwInput]}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(s => !s)}>
              <Ionicons name={showPw ? 'eye-off' : 'eye'} size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, (loading || !email.trim() || !password) && styles.disabledBtn]}
            onPress={handleLogin}
            disabled={loading || !email.trim() || !password}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnLabel}>Sign in as Physician</Text>}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>new to MedBuddie?</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.push('/(auth)/physician-register')}
          >
            <Text style={styles.registerBtnLabel}>Register as Physician</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.memberLink} onPress={() => router.replace('/(auth)/sign-in')}>
            <Text style={styles.memberLinkText}>Not a physician? <Text style={styles.memberLinkBold}>Member login →</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#1a3a5c' },
  container: { flexGrow: 1, alignItems: 'center', paddingBottom: 40 },
  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 28 },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  brand: { fontSize: 26, fontWeight: '800', color: '#fff' },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  card: {
    width: '100%', backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    flex: 1, padding: 28, paddingTop: 32,
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.textPrimary, backgroundColor: '#fafafa',
  },
  pwRow: { position: 'relative' },
  pwInput: { paddingRight: 44 },
  eyeBtn: { position: 'absolute', right: 12, top: 12 },
  primaryBtn: {
    backgroundColor: '#1a3a5c', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 24,
  },
  primaryBtnLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabledBtn: { opacity: 0.5 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: 12 },
  registerBtn: {
    borderWidth: 2, borderColor: '#1a3a5c', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  registerBtnLabel: { color: '#1a3a5c', fontSize: 15, fontWeight: '700' },
  memberLink: { alignItems: 'center', marginTop: 16 },
  memberLinkText: { color: Colors.textSecondary, fontSize: 13 },
  memberLinkBold: { color: Colors.primary, fontWeight: '700' },
});
