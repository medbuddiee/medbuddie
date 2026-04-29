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

async function fetchAndroidData() {
  const available = await HealthConnect.getSdkStatus();
  if (available !== HealthConnect.SdkAvailabilityStatus.SDK_AVAILABLE) {
    throw new Error('Health Connect is not available on this device. Install it from the Play Store.');
  }
  await HealthConnect.requestPermission(ANDROID_PERMISSIONS);

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now - 7 * 86400000);

  const timeRangeFilter = {
    operator: 'between',
    startTime: weekAgo.toISOString(),
    endTime: now.toISOString(),
  };
  const todayFilter = {
    operator: 'between',
    startTime: startOfDay.toISOString(),
    endTime: now.toISOString(),
  };

  const [steps, heartRate, weight, height, bp, glucose, restingHR, calories] = await Promise.all([
    HealthConnect.readRecords('Steps', { timeRangeFilter: todayFilter }),
    HealthConnect.readRecords('HeartRate', { timeRangeFilter, limit: 1 }),
    HealthConnect.readRecords('Weight', { timeRangeFilter, limit: 1 }),
    HealthConnect.readRecords('Height', { timeRangeFilter, limit: 1 }),
    HealthConnect.readRecords('BloodPressure', { timeRangeFilter, limit: 1 }),
    HealthConnect.readRecords('BloodGlucose', { timeRangeFilter, limit: 1 }),
    HealthConnect.readRecords('RestingHeartRate', { timeRangeFilter, limit: 1 }),
    HealthConnect.readRecords('ActiveCaloriesBurned', { timeRangeFilter: todayFilter }),
  ]);

  const totalSteps  = steps.records?.reduce((s, r) => s + (r.count || 0), 0) || null;
  const latestHR    = heartRate.records?.[0]?.samples?.[0]?.beatsPerMinute;
  const latestRestHR = restingHR.records?.[0]?.beatsPerMinute;
  const latestWeight = weight.records?.[0]?.weight?.inKilograms;
  const latestHeight = height.records?.[0]?.height?.inMeters;
  const latestBP    = bp.records?.[0];
  const latestGlucose = glucose.records?.[0]?.level?.inMillimolesPerLiter;
  const totalCal    = calories.records?.reduce((s, r) => s + (r.energy?.inKilocalories || 0), 0) || null;

  return {
    steps:          totalSteps,
    heartRate:      latestHR ? Math.round(latestHR) : null,
    restingHeartRate: latestRestHR ? Math.round(latestRestHR) : null,
    weight:         latestWeight ? Math.round(latestWeight * 2.20462) : null,
    height:         latestHeight ? metersToFeetInches(latestHeight) : null,
    bloodPressure:  latestBP
      ? `${Math.round(latestBP.systolic?.inMillimetersOfMercury)}/${Math.round(latestBP.diastolic?.inMillimetersOfMercury)}`
      : null,
    bloodGlucose:   latestGlucose ? Math.round(latestGlucose * 18) : null,
    hrv:            null,
    calories:       totalCal ? Math.round(totalCal) : null,
    source:         'Google Health Connect',
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

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function metersToFeetInches(m) {
  const totalInches = m * 39.3701;
  const feet   = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}
