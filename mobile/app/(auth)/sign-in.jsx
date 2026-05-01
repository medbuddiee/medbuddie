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

export default function SignIn() {
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
      if (res.ok) {
        await login(data.user, data.token);
        router.replace('/(tabs)/feed');
      } else {
        Alert.alert('Sign in failed', data.error || 'Invalid credentials');
      }
    } catch {
      Alert.alert('Error', 'Cannot reach the server. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Physician portal link */}
        <TouchableOpacity
          style={styles.physicianBanner}
          onPress={() => router.push('/(auth)/physician-sign-in')}
        >
          <MaterialIcons name="local-hospital" size={16} color="#1a3a5c" />
          <Text style={styles.physicianBannerText}>Are you a physician? <Text style={styles.physicianBannerLink}>Physician Portal →</Text></Text>
        </TouchableOpacity>
        {/* Logo area */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Ionicons name="medical" size={36} color="#fff" />
          </View>
          <Text style={styles.brand}>MedBuddie</Text>
          <Text style={styles.tagline}>Your health community</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Sign in</Text>

          <Text style={styles.label}>Email or username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.pwRow}>
            <TextInput
              style={[styles.input, styles.pwInput]}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw((s) => !s)}>
              <Ionicons name={showPw ? 'eye-off' : 'eye'} size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, (loading || !email.trim() || !password) && styles.disabledBtn]}
            onPress={handleLogin}
            disabled={loading || !email.trim() || !password}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnLabel}>Sign in</Text>
            }
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/(auth)/sign-up')}
          >
            <Text style={styles.createBtnLabel}>Create new account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.primary },
  container: { flexGrow: 1, alignItems: 'center', paddingBottom: 40 },
  hero: { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  brand: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  card: {
    width: '100%', backgroundColor: Colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    flex: 1, padding: 28, paddingTop: 32,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.textPrimary, backgroundColor: '#fafafa',
  },
  pwRow: { position: 'relative' },
  pwInput: { paddingRight: 44 },
  eyeBtn: { position: 'absolute', right: 12, top: 12 },
  primaryBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 24,
  },
  primaryBtnLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabledBtn: { opacity: 0.5 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: 13 },
  createBtn: {
    borderWidth: 2, borderColor: Colors.primary, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  createBtnLabel: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  physicianBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#e8eef7', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
  },
  physicianBannerText: { fontSize: 13, color: '#1a3a5c' },
  physicianBannerLink: { fontWeight: '700' },
});
