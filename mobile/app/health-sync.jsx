import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, Linking, AppState,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

const IS_EXPO_GO = Constants.appOwnership === 'expo';
import {
  fetchPhoneHealth, isHealthAvailable,
  requestAndroidHealthPermissions, checkAndroidPermissions,
} from '../utils/health';
import {
  connectFitbit, disconnectFitbit, isFitbitConnected, fetchFitbitData,
} from '../utils/fitbit';
import {
  connectWhoop, disconnectWhoop, isWhoopConnected, fetchWhoopData,
} from '../utils/whoop';
import { apiFetch } from '../utils/api';
import { Colors } from '../constants/colors';

/* ── Device card ─────────────────────────────────────────────────────────── */
function DeviceCard({ icon, name, subtitle, connected, onConnect, onDisconnect, loading, requiresBuild }) {
  return (
    <View style={styles.deviceCard}>
      <View style={styles.deviceLeft}>
        <View style={[styles.deviceIcon, connected && styles.deviceIconActive]}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.deviceName}>{name}</Text>
          <Text style={styles.deviceSub} numberOfLines={2}>{connected ? '● Connected' : subtitle}</Text>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : requiresBuild ? (
        <View style={styles.buildBadge}>
          <Text style={styles.buildBadgeText}>Build req.</Text>
        </View>
      ) : connected ? (
        <TouchableOpacity style={styles.disconnectBtn} onPress={onDisconnect}>
          <Text style={styles.disconnectLabel}>Disconnect</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.connectBtn} onPress={onConnect}>
          <Text style={styles.connectLabel}>Connect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ── Metric row ──────────────────────────────────────────────────────────── */
function MetricRow({ label, value, unit, icon, source }) {
  if (value == null) return null;
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricIcon}>{icon}</View>
      <View style={styles.metricInfo}>
        <Text style={styles.metricLabel}>{label}</Text>
        {source && <Text style={styles.metricSource}>{source}</Text>}
      </View>
      <Text style={styles.metricValue}>
        {value}{unit ? <Text style={styles.metricUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function HealthSyncScreen() {
  const router = useRouter();

  const [fitbitConnected,  setFitbitConnected]  = useState(false);
  const [whoopConnected,   setWhoopConnected]   = useState(false);
  const [phoneEnabled,     setPhoneEnabled]     = useState(isHealthAvailable());
  const [samsungConnected, setSamsungConnected] = useState(false);
  const [waitingReturn,    setWaitingReturn]    = useState(false); // waiting for user to return from Samsung Health

  const [syncing,       setSyncing]       = useState(false);
  const [loadingDevice, setLoadingDevice] = useState(null);
  const [lastSync,      setLastSync]      = useState(null);
  const [preview,       setPreview]       = useState(null);

  const appStateRef = useRef(AppState.currentState);

  // Check connection states on mount
  useEffect(() => {
    isFitbitConnected().then(setFitbitConnected);
    isWhoopConnected().then(setWhoopConnected);
    if (Platform.OS === 'android') checkAndroidPermissions().then(setSamsungConnected);
    apiFetch('/api/health/summary').then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        if (d.health_synced_at) setLastSync(new Date(d.health_synced_at));
      }
    }).catch(() => {});
  }, []);

  // When user returns from Samsung Health app, request Health Connect permissions
  useEffect(() => {
    if (!waitingReturn) return;
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        setWaitingReturn(false);
        sub.remove();
        // Give Samsung Health a moment to register the sync setting
        await new Promise(r => setTimeout(r, 800));
        try {
          await requestAndroidHealthPermissions();
          setSamsungConnected(true);
          setPhoneEnabled(true);
          Alert.alert('Connected!', 'Samsung Health is now connected. Tap "Pull Latest Data" to sync.');
        } catch (e) {
          Alert.alert('Permission denied', e.message);
        }
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [waitingReturn]);

  /* ── Gather data from all connected sources ── */
  const gatherData = async () => {
    setSyncing(true);
    setPreview(null);
    const merged = {};
    const sources = [];

    const run = async (label, fn) => {
      try {
        const data = await fn();
        sources.push(label);
        Object.entries(data).forEach(([k, v]) => {
          if (v != null && k !== 'source' && merged[k] == null) merged[k] = v;
        });
      } catch (e) {
        console.warn(`${label} sync failed:`, e?.message ?? e);
        // Show user-facing error for phone health so they know what failed
        if (label !== 'Fitbit' && label !== 'Whoop') {
          Alert.alert(
            `${label} unavailable`,
            e?.message || 'Could not read health data. Make sure Health Connect is installed and Samsung Health is synced.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    try {
      if (phoneEnabled && isHealthAvailable()) {
        await run(Platform.OS === 'ios' ? 'Apple Health' : 'Google Health Connect', fetchPhoneHealth);
      }
      if (fitbitConnected) await run('Fitbit', fetchFitbitData);
      if (whoopConnected)  await run('Whoop',  fetchWhoopData);
    } catch (e) {
      // Top-level catch for any unexpected native crash
      Alert.alert('Sync error', `An unexpected error occurred: ${e?.message ?? 'Unknown error'}. Please try again.`);
    } finally {
      setSyncing(false);
    }

    if (Object.keys(merged).length === 0) return;
    setPreview({ data: merged, sources });
  };

  /* ── Push data to backend ── */
  const saveToMedBuddie = async () => {
    if (!preview) return;
    setSyncing(true);
    try {
      const res = await apiFetch('/api/health/sync', {
        method: 'POST',
        body: JSON.stringify(preview),
      });
      if (res.ok) {
        setLastSync(new Date());
        setPreview(null);
        Alert.alert('Synced!', 'Your health data has been updated in MedBuddie.');
      } else {
        Alert.alert('Error', (await res.json()).error || 'Sync failed.');
      }
    } catch {
      Alert.alert('Error', 'Cannot reach the server.');
    } finally {
      setSyncing(false);
    }
  };

  /* ── Device connect/disconnect ── */
  const handleSamsungConnect = async () => {
    if (samsungConnected) {
      Alert.alert('Disconnect Samsung Health', 'This will remove Health Connect permissions. Continue?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => {
          setSamsungConnected(false);
          setPhoneEnabled(false);
        }},
      ]);
      return;
    }

    setLoadingDevice('samsung');
    try {
      // Step 1: Try to open Samsung Health → Connected Services directly
      const samsungDeepLink = 'com.sec.android.app.shealth://health/connected-services';
      const fallbackLink    = 'com.sec.android.app.shealth://';
      const canOpenDeep = await Linking.canOpenURL(samsungDeepLink);
      const canOpenApp  = await Linking.canOpenURL(fallbackLink);

      if (canOpenDeep) {
        await Linking.openURL(samsungDeepLink);
        setWaitingReturn(true); // AppState listener will handle permissions on return
      } else if (canOpenApp) {
        await Linking.openURL(fallbackLink);
        setWaitingReturn(true);
      } else {
        // Samsung Health not installed — go straight to Health Connect permissions
        await requestAndroidHealthPermissions();
        setSamsungConnected(true);
        setPhoneEnabled(true);
        Alert.alert('Connected!', 'Health Connect permissions granted. Tap "Pull Latest Data" to sync.');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoadingDevice(null);
    }
  };

  const handleFitbit = async () => {
    setLoadingDevice('fitbit');
    try {
      if (fitbitConnected) {
        await disconnectFitbit();
        setFitbitConnected(false);
      } else {
        await connectFitbit();
        setFitbitConnected(true);
      }
    } catch (e) {
      Alert.alert('Fitbit', e.message);
    } finally {
      setLoadingDevice(null);
    }
  };

  const handleWhoop = async () => {
    setLoadingDevice('whoop');
    try {
      if (whoopConnected) {
        await disconnectWhoop();
        setWhoopConnected(false);
      } else {
        await connectWhoop();
        setWhoopConnected(true);
      }
    } catch (e) {
      Alert.alert('Whoop', e.message);
    } finally {
      setLoadingDevice(null);
    }
  };

  const { data: pd, sources: ps } = preview || {};

  return (
    <>
      <Stack.Screen options={{
        title: 'Health Data Sync',
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerShown: true,
      }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <View style={styles.heroCard}>
            <MaterialCommunityIcons name="heart-pulse" size={32} color={Colors.primary} />
            <Text style={styles.heroTitle}>Health Data Sync</Text>
            <Text style={styles.heroSub}>
              Connect your devices to automatically update your MedBuddie health profile.
            </Text>
            {lastSync && (
              <Text style={styles.lastSyncText}>
                Last synced: {lastSync.toLocaleString()}
              </Text>
            )}
          </View>

          {/* ── Expo Go notice ── */}
          {IS_EXPO_GO && (
            <View style={styles.expoGoBanner}>
              <MaterialCommunityIcons name="information-outline" size={18} color="#1565c0" />
              <View style={{ flex: 1 }}>
                <Text style={styles.expoGoBannerTitle}>Native health requires a build</Text>
                <Text style={styles.expoGoBannerSub}>
                  Apple Health, Samsung Health and Google Health Connect need a compiled app.
                  Fitbit and Whoop work now.{'\n'}
                  Run: <Text style={styles.expoGoBannerCode}>eas build --profile preview --platform android</Text>
                </Text>
              </View>
            </View>
          )}

          {/* ── Connected devices ── */}
          <Text style={styles.sectionTitle}>NATIVE HEALTH</Text>

          {/* Apple Health (iOS) */}
          {Platform.OS === 'ios' && (
            <DeviceCard
              name="Apple Health"
              subtitle="Steps, heart rate, weight, blood pressure, HRV"
              icon={<Ionicons name="heart" size={20} color={phoneEnabled ? '#fff' : Colors.textMuted} />}
              connected={phoneEnabled}
              onConnect={() => setPhoneEnabled(true)}
              onDisconnect={() => setPhoneEnabled(false)}
              requiresBuild={IS_EXPO_GO}
            />
          )}

          {/* Apple Watch note (iOS) */}
          {Platform.OS === 'ios' && (
            <View style={styles.setupCard}>
              <View style={styles.setupCardLeft}>
                <View style={[styles.setupIcon, { backgroundColor: '#000' }]}>
                  <MaterialCommunityIcons name="watch" size={18} color="#fff" />
                </View>
                <View style={styles.setupInfo}>
                  <Text style={styles.setupName}>Apple Watch</Text>
                  <Text style={styles.setupStatus}>✓ Syncs automatically via Apple Health</Text>
                </View>
              </View>
              <View style={styles.autobadge}><Text style={styles.autobadgeText}>Auto</Text></View>
            </View>
          )}

          {/* Google Health Connect (Android) */}
          {Platform.OS === 'android' && (
            <DeviceCard
              name="Google Health Connect"
              subtitle="Steps, heart rate, weight, blood pressure, sleep"
              icon={<Ionicons name="fitness" size={20} color={phoneEnabled ? '#fff' : Colors.textMuted} />}
              connected={phoneEnabled}
              onConnect={() => setPhoneEnabled(true)}
              onDisconnect={() => setPhoneEnabled(false)}
              requiresBuild={IS_EXPO_GO}
            />
          )}

          {/* Samsung Health (Android only) */}
          {Platform.OS === 'android' && (
            <DeviceCard
              name="Samsung Health"
              subtitle={samsungConnected
                ? '● Connected · Galaxy Watch syncing'
                : 'Steps, heart rate, sleep, Galaxy Watch data'}
              icon={
                <MaterialCommunityIcons
                  name="android"
                  size={20}
                  color={samsungConnected ? '#fff' : Colors.textMuted}
                />
              }
              connected={samsungConnected}
              onConnect={handleSamsungConnect}
              onDisconnect={handleSamsungConnect}
              loading={loadingDevice === 'samsung'}
              requiresBuild={IS_EXPO_GO}
            />
          )}

          {/* Waiting for user to return from Samsung Health */}
          {waitingReturn && (
            <View style={styles.waitingBanner}>
              <ActivityIndicator color={Colors.primary} size="small" />
              <Text style={styles.waitingText}>
                Enable Health Connect in Samsung Health, then come back here…
              </Text>
            </View>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>WEARABLES & TRACKERS</Text>

          {/* Garmin */}
          <View style={styles.setupCard}>
            <View style={styles.setupCardLeft}>
              <View style={[styles.setupIcon, { backgroundColor: '#007CC3' }]}>
                <MaterialCommunityIcons name="run-fast" size={18} color="#fff" />
              </View>
              <View style={styles.setupInfo}>
                <Text style={styles.setupName}>Garmin</Text>
                <Text style={styles.setupStatus}>
                  Syncs via {Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.setupBtn}
              onPress={() => Alert.alert(
                'Connect Garmin',
                Platform.OS === 'ios'
                  ? '1. Open Garmin Connect app\n2. Tap More → Settings\n3. Tap "Connected Apps"\n4. Find "Apple Health" and tap Connect\n5. Grant permissions\n\nYour Garmin and watch data will sync here automatically.'
                  : '1. Open Garmin Connect app\n2. Tap More → Settings\n3. Tap "Connected Apps"\n4. Find "Google Fit" and tap Connect\n5. Grant permissions\n\nYour Garmin and watch data will sync here automatically.',
                [{ text: 'Got it' }]
              )}
            >
              <Text style={styles.setupBtnLabel}>Setup</Text>
            </TouchableOpacity>
          </View>

          {/* Fitbit */}
          <DeviceCard
            name="Fitbit"
            subtitle="Steps, sleep, heart rate zones, SpO2"
            icon={<MaterialCommunityIcons name="watch-variant" size={20} color={fitbitConnected ? '#fff' : Colors.textMuted} />}
            connected={fitbitConnected}
            onConnect={handleFitbit}
            onDisconnect={handleFitbit}
            loading={loadingDevice === 'fitbit'}
          />

          {/* Whoop */}
          <DeviceCard
            name="Whoop"
            subtitle="Recovery, HRV, strain, sleep performance"
            icon={<MaterialCommunityIcons name="lightning-bolt" size={20} color={whoopConnected ? '#fff' : Colors.textMuted} />}
            connected={whoopConnected}
            onConnect={handleWhoop}
            onDisconnect={handleWhoop}
            loading={loadingDevice === 'whoop'}
          />

          {/* ── Sync button ── */}
          <TouchableOpacity
            style={[styles.syncBtn, syncing && styles.disabledBtn]}
            onPress={gatherData}
            disabled={syncing}
          >
            {syncing
              ? <ActivityIndicator color="#fff" />
              : <>
                  <MaterialCommunityIcons name="sync" size={18} color="#fff" />
                  <Text style={styles.syncBtnLabel}>Pull Latest Data</Text>
                </>
            }
          </TouchableOpacity>

          {/* ── Preview ── */}
          {preview && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>
                Ready to save  ·  {ps?.join(', ')}
              </Text>

              {[
                { label: 'Steps today',       key: 'steps',           unit: 'steps',   icon: <MaterialCommunityIcons name="walk" size={16} color={Colors.primary} /> },
                { label: 'Heart rate',         key: 'heartRate',       unit: 'bpm',     icon: <Ionicons name="heart" size={16} color="#e53935" /> },
                { label: 'Resting HR',         key: 'restingHeartRate',unit: 'bpm',     icon: <Ionicons name="heart-outline" size={16} color="#e53935" /> },
                { label: 'HRV',                key: 'hrv',             unit: 'ms',      icon: <MaterialCommunityIcons name="heart-pulse" size={16} color={Colors.purple} /> },
                { label: 'Weight',             key: 'weight',          unit: 'lbs',     icon: <FontAwesome5 name="weight" size={14} color={Colors.blue} /> },
                { label: 'Height',             key: 'height',          unit: '',        icon: <MaterialCommunityIcons name="human-male-height" size={16} color={Colors.blue} /> },
                { label: 'Blood pressure',     key: 'bloodPressure',   unit: 'mmHg',    icon: <MaterialCommunityIcons name="water" size={16} color="#e53935" /> },
                { label: 'Blood glucose',      key: 'bloodGlucose',    unit: 'mg/dL',   icon: <MaterialCommunityIcons name="water-percent" size={16} color="#fb8c00" /> },
                { label: 'Calories burned',    key: 'calories',        unit: 'kcal',    icon: <MaterialCommunityIcons name="fire" size={16} color="#e65100" /> },
                { label: 'Sleep',              key: 'sleepHours',      unit: 'hrs',     icon: <Ionicons name="moon" size={15} color={Colors.purple} /> },
                { label: 'Sleep score',        key: 'sleepScore',      unit: '%',       icon: <MaterialCommunityIcons name="star" size={16} color={Colors.purple} /> },
                { label: 'Recovery score',     key: 'recoveryScore',   unit: '%',       icon: <MaterialCommunityIcons name="battery-charging" size={16} color="#43a047" /> },
                { label: 'Whoop strain',       key: 'strain',          unit: '/21',     icon: <MaterialCommunityIcons name="lightning-bolt" size={16} color="#e53935" /> },
                { label: 'SpO2',               key: 'spo2',            unit: '%',       icon: <MaterialCommunityIcons name="lungs" size={16} color={Colors.blue} /> },
              ].map(({ label, key, unit, icon }) => (
                <MetricRow key={key} label={label} value={pd?.[key]} unit={unit} icon={icon} />
              ))}

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={saveToMedBuddie}
                disabled={syncing}
              >
                <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                <Text style={styles.saveBtnLabel}>Save to MedBuddie</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.discardBtn} onPress={() => setPreview(null)}>
                <Text style={styles.discardLabel}>Discard</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Expo Go notice ── */}
          {!isHealthAvailable() && (
            <View style={styles.expoGoNotice}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.blue} />
              <Text style={styles.expoGoText}>
                Native health data (Apple Health, Health Connect) requires a development or production build.
                Fitbit and Whoop integrations work in any build.
              </Text>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },

  heroCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 24, gap: 8,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  heroSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  lastSyncText: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 10, letterSpacing: 0.5 },

  deviceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  deviceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  deviceIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  deviceIconActive: { backgroundColor: Colors.primary },
  deviceName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  deviceSub:  { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  connectBtn: {
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  connectLabel: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  disconnectBtn: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  disconnectLabel: { color: Colors.textMuted, fontSize: 13 },

  setupCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  setupCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  setupIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  setupInfo: { flex: 1 },
  setupName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  setupStatus: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  setupBtn: {
    borderWidth: 1.5, borderColor: Colors.blue,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  setupBtnLabel: { color: Colors.blue, fontWeight: '700', fontSize: 13 },
  expoGoBanner: {
    flexDirection: 'row', gap: 10, backgroundColor: '#e3f2fd',
    borderRadius: 14, padding: 14, marginBottom: 16, alignItems: 'flex-start',
  },
  expoGoBannerTitle: { fontSize: 13, fontWeight: '700', color: '#1565c0', marginBottom: 3 },
  expoGoBannerSub: { fontSize: 12, color: '#1565c0', lineHeight: 18 },
  expoGoBannerCode: { fontFamily: 'monospace', fontSize: 11, backgroundColor: '#bbdefb', borderRadius: 4 },
  buildBadge: {
    backgroundColor: '#f5f5f5', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.border,
  },
  buildBadgeText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  waitingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.primaryBg, borderRadius: 12,
    padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  waitingText: { flex: 1, fontSize: 13, color: Colors.primary, lineHeight: 18 },
  autobadge: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  autobadgeText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },

  syncBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 15, marginTop: 8,
  },
  syncBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabledBtn: { opacity: 0.5 },

  previewCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    marginTop: 20,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  previewTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 14 },

  metricRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  metricIcon: { width: 28, alignItems: 'center' },
  metricInfo: { flex: 1 },
  metricLabel: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  metricSource: { fontSize: 10, color: Colors.textMuted },
  metricValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  metricUnit: { fontSize: 11, color: Colors.textMuted, fontWeight: '400' },

  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, marginTop: 16,
  },
  saveBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  discardBtn: { alignItems: 'center', paddingVertical: 10 },
  discardLabel: { color: Colors.textMuted, fontSize: 13 },

  expoGoNotice: {
    flexDirection: 'row', gap: 10, backgroundColor: '#e3f2fd',
    borderRadius: 12, padding: 14, marginTop: 20, alignItems: 'flex-start',
  },
  expoGoText: { flex: 1, fontSize: 12, color: Colors.blue, lineHeight: 18 },
});
