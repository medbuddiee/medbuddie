import { Platform } from 'react-native';

// These native modules only exist in a development/production build, not Expo Go.
// We guard every call so the app doesn't crash in Expo Go.

let AppleHealth = null;
let HealthConnect = null;

try {
  if (Platform.OS === 'ios') {
    AppleHealth = require('react-native-health').default;
  } else {
    HealthConnect = require('react-native-health-connect');
  }
} catch { /* running in Expo Go — health unavailable */ }

export const isHealthAvailable = () => AppleHealth !== null || HealthConnect !== null;

/* ── iOS HealthKit ──────────────────────────────────────────────────────── */

const IOS_PERMISSIONS = {
  permissions: {
    read: [
      'StepCount', 'HeartRate', 'BodyMass', 'Height',
      'BloodPressureSystolic', 'BloodPressureDiastolic',
      'BloodGlucose', 'SleepAnalysis', 'ActiveEnergyBurned',
      'RestingHeartRate', 'HeartRateVariabilitySDNN',
    ],
    write: [],
  },
};

async function requestIOSPermissions() {
  return new Promise((resolve, reject) => {
    AppleHealth.initHealthKit(IOS_PERMISSIONS, (err) => {
      if (err) reject(new Error('HealthKit permission denied'));
      else resolve(true);
    });
  });
}

function iosQuery(method, options) {
  return new Promise((resolve) => {
    AppleHealth[method](options, (err, results) => {
      resolve(err ? [] : results);
    });
  });
}

async function fetchIOSData() {
  await requestIOSPermissions();

  const today = new Date();
  const startOfDay = new Date(today); startOfDay.setHours(0, 0, 0, 0);
  const opts = { startDate: startOfDay.toISOString(), endDate: today.toISOString() };
  const weekAgo = new Date(today - 7 * 86400000);
  const weekOpts = { startDate: weekAgo.toISOString(), endDate: today.toISOString(), ascending: false, limit: 1 };

  const [steps, heartRate, weight, height, bpSystolic, bpDiastolic, glucose, hrv, restingHR, calories] =
    await Promise.all([
      iosQuery('getDailyStepCountSamples', opts),
      iosQuery('getHeartRateSamples', { ...weekOpts }),
      iosQuery('getWeightSamples', weekOpts),
      iosQuery('getHeightSamples', weekOpts),
      iosQuery('getBloodPressureSamples', weekOpts),
      iosQuery('getBloodPressureSamples', weekOpts),
      iosQuery('getBloodGlucoseSamples', weekOpts),
      iosQuery('getHeartRateVariabilitySamples', weekOpts),
      iosQuery('getRestingHeartRateSamples', weekOpts),
      iosQuery('getActiveEnergyBurned', opts),
    ]);

  const totalSteps = steps.reduce((s, r) => s + (r.value || 0), 0);
  const latestHR   = heartRate[0]?.value;
  const latestRestHR = restingHR[0]?.value;
  const latestWeight = weight[0]?.value;    // kg
  const latestHeight = height[0]?.value;    // m
  const latestBPSys  = bpSystolic[0]?.bloodPressureSystolicValue;
  const latestBPDia  = bpDiastolic[0]?.bloodPressureDiastolicValue;
  const latestGlucose = glucose[0]?.value;  // mmol/L or mg/dL
  const latestHRV    = hrv[0]?.value;
  const totalCalories = calories.reduce((s, r) => s + (r.value || 0), 0);

  return {
    steps:          totalSteps || null,
    heartRate:      latestHR   ? Math.round(latestHR)   : null,
    restingHeartRate: latestRestHR ? Math.round(latestRestHR) : null,
    weight:         latestWeight ? Math.round(latestWeight * 2.20462) : null, // kg → lbs
    height:         latestHeight ? metersToFeetInches(latestHeight)   : null,
    bloodPressure:  latestBPSys && latestBPDia ? `${Math.round(latestBPSys)}/${Math.round(latestBPDia)}` : null,
    bloodGlucose:   latestGlucose ? Math.round(latestGlucose * 18) : null,   // mmol/L → mg/dL
    hrv:            latestHRV ? Math.round(latestHRV) : null,
    calories:       totalCalories ? Math.round(totalCalories) : null,
    source:         'Apple Health',
  };
}

/* ── Android Health Connect ─────────────────────────────────────────────── */

const ANDROID_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'Weight' },
  { accessType: 'read', recordType: 'Height' },
  { accessType: 'read', recordType: 'BloodPressure' },
  { accessType: 'read', recordType: 'BloodGlucose' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'RestingHeartRate' },
];

// Safe wrapper — returns null instead of crashing if a record type fails
async function safeRead(recordType, options) {
  try {
    const result = await HealthConnect.readRecords(recordType, options);
    return result?.records ?? [];
  } catch { return []; }
}

async function initAndroidHealthConnect() {
  if (!HealthConnect) throw new Error('Health Connect requires a development build — not available in Expo Go.');
  try {
    await HealthConnect.initialize();
  } catch (e) {
    throw new Error(`Health Connect could not be initialised: ${e?.message || e}`);
  }
  // SDK status check — compare against numeric value 3 (SDK_AVAILABLE)
  // avoids crashing if SdkAvailabilityStatus enum is not accessible
  try {
    const status = await HealthConnect.getSdkStatus();
    const SDK_AVAILABLE = HealthConnect.SdkAvailabilityStatus?.SDK_AVAILABLE ?? 3;
    if (status !== SDK_AVAILABLE) {
      throw new Error('Health Connect is not installed on this device. Install it from the Play Store.');
    }
  } catch (e) {
    if (e.message?.includes('Play Store')) throw e;
    // getSdkStatus() crashed — device may still work, continue
  }
}

async function fetchAndroidData() {
  await initAndroidHealthConnect();

  // Only request permissions if not already granted — avoids repeated dialog
  try {
    const granted = await HealthConnect.getGrantedPermissions();
    const grantedTypes = new Set((granted || []).map(p => p.recordType));
    const needsPermission = ANDROID_PERMISSIONS.some(p => !grantedTypes.has(p.recordType));
    if (needsPermission) {
      await HealthConnect.requestPermission(ANDROID_PERMISSIONS);
    }
  } catch {
    // If getGrantedPermissions fails, request anyway
    await HealthConnect.requestPermission(ANDROID_PERMISSIONS);
  }

  const now      = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const weekAgo  = new Date(now - 7 * 86400000);

  const timeRange = { operator: 'between', startTime: weekAgo.toISOString(), endTime: now.toISOString() };
  const today     = { operator: 'between', startTime: startOfDay.toISOString(), endTime: now.toISOString() };

  // Fetch each record type independently so one failure never crashes the others
  const [steps, heartRate, weight, height, bp, glucose, restingHR, calories] = await Promise.all([
    safeRead('Steps',                { timeRangeFilter: today }),
    safeRead('HeartRate',            { timeRangeFilter: timeRange }),
    safeRead('Weight',               { timeRangeFilter: timeRange }),
    safeRead('Height',               { timeRangeFilter: timeRange }),
    safeRead('BloodPressure',        { timeRangeFilter: timeRange }),
    safeRead('BloodGlucose',         { timeRangeFilter: timeRange }),
    safeRead('RestingHeartRate',     { timeRangeFilter: timeRange }),
    safeRead('ActiveCaloriesBurned', { timeRangeFilter: today }),
  ]);

  const totalSteps   = steps.reduce((s, r) => s + (r.count || 0), 0) || null;
  const latestHR     = heartRate[0]?.samples?.[0]?.beatsPerMinute;
  const latestRestHR = restingHR[0]?.beatsPerMinute;
  const latestWeight = weight[0]?.weight?.inKilograms;
  const latestHeight = height[0]?.height?.inMeters;
  const latestBP     = bp[0];
  const latestGluc   = glucose[0]?.level?.inMillimolesPerLiter;
  const totalCal     = calories.reduce((s, r) => s + (r.energy?.inKilocalories || 0), 0) || null;

  return {
    steps:           totalSteps,
    heartRate:       latestHR     ? Math.round(latestHR)                   : null,
    restingHeartRate:latestRestHR ? Math.round(latestRestHR)               : null,
    weight:          latestWeight ? Math.round(latestWeight * 2.20462)     : null,
    height:          latestHeight ? metersToFeetInches(latestHeight)       : null,
    bloodPressure:   latestBP
      ? `${Math.round(latestBP.systolic?.inMillimetersOfMercury ?? 0)}/${Math.round(latestBP.diastolic?.inMillimetersOfMercury ?? 0)}`
      : null,
    bloodGlucose:    latestGluc ? Math.round(latestGluc * 18)             : null,
    hrv:             null,
    calories:        totalCal,
    source:          'Google Health Connect',
  };
}

/* ── Public API ─────────────────────────────────────────────────────────── */

export async function fetchPhoneHealth() {
  if (!isHealthAvailable()) {
    throw new Error('Health data is not available in Expo Go. Build the app with EAS to enable this feature.');
  }
  if (Platform.OS === 'ios') return fetchIOSData();
  return fetchAndroidData();
}

// Request Health Connect permissions — used by Samsung Health connect flow
export async function requestAndroidHealthPermissions() {
  await initAndroidHealthConnect();
  return HealthConnect.requestPermission(ANDROID_PERMISSIONS);
}

// Check if Health Connect permissions are already granted
export async function checkAndroidPermissions() {
  if (!HealthConnect) return false;
  try {
    await HealthConnect.initialize();
    const granted = await HealthConnect.getGrantedPermissions();
    return granted && granted.length > 0;
  } catch { return false; }
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function metersToFeetInches(m) {
  const totalInches = m * 39.3701;
  const feet   = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}
