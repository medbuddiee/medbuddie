import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { storage } from './storage';

// Register your Fitbit app at dev.fitbit.com
// Set the OAuth 2.0 redirect URI to: medbuddie://fitbit-callback
const CLIENT_ID     = process.env.EXPO_PUBLIC_FITBIT_CLIENT_ID || '';
const FITBIT_BASE   = 'https://api.fitbit.com';
const AUTH_ENDPOINT = 'https://www.fitbit.com/oauth2/authorize';
const TOKEN_ENDPOINT = 'https://api.fitbit.com/oauth2/token';

const SCOPES = [
  'activity', 'heartrate', 'weight', 'profile',
  'sleep', 'oxygen_saturation',
].join(' ');

WebBrowser.maybeCompleteAuthSession();

/* ── OAuth ──────────────────────────────────────────────────────────────── */

export async function connectFitbit() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'medbuddie', path: 'fitbit-callback' });

  const discovery = {
    authorizationEndpoint: AUTH_ENDPOINT,
    tokenEndpoint: TOKEN_ENDPOINT,
  };

  const request = new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    scopes: SCOPES.split(' '),
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync(discovery);
  if (result.type !== 'success') throw new Error('Fitbit authorisation cancelled.');

  // Exchange code for tokens
  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:      CLIENT_ID,
      code:           result.params.code,
      code_verifier:  request.codeVerifier,
      grant_type:     'authorization_code',
      redirect_uri:   redirectUri,
    }).toString(),
  });

  const tokens = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(tokens.errors?.[0]?.message || 'Token exchange failed');

  await storage.set('fitbit_access_token',  tokens.access_token);
  await storage.set('fitbit_refresh_token', tokens.refresh_token);
  await storage.set('fitbit_user_id',       tokens.user_id);
  return true;
}

export async function disconnectFitbit() {
  await storage.remove('fitbit_access_token');
  await storage.remove('fitbit_refresh_token');
  await storage.remove('fitbit_user_id');
}

export async function isFitbitConnected() {
  const token = await storage.get('fitbit_access_token');
  return !!token;
}

/* ── API calls ──────────────────────────────────────────────────────────── */

async function fitbitGet(path) {
  const token = await storage.get('fitbit_access_token');
  if (!token) throw new Error('Fitbit not connected');

  const res = await fetch(`${FITBIT_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    // Try refresh
    const refreshed = await refreshFitbitToken();
    if (!refreshed) throw new Error('Fitbit session expired. Please reconnect.');
    return fitbitGet(path); // retry once
  }

  return res.json();
}

async function refreshFitbitToken() {
  const refreshToken = await storage.get('fitbit_refresh_token');
  if (!refreshToken) return false;

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     CLIENT_ID,
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!res.ok) return false;
  const tokens = await res.json();
  await storage.set('fitbit_access_token',  tokens.access_token);
  await storage.set('fitbit_refresh_token', tokens.refresh_token);
  return true;
}

export async function fetchFitbitData() {
  const today = new Date().toISOString().slice(0, 10);

  const [activities, heartRate, weight, sleep, spo2] = await Promise.all([
    fitbitGet(`/1/user/-/activities/date/${today}.json`),
    fitbitGet(`/1/user/-/activities/heart/date/${today}/1d.json`),
    fitbitGet('/1/user/-/body/log/weight/list.json?afterDate=' + new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10) + '&sort=asc&limit=1&offset=0'),
    fitbitGet(`/1.2/user/-/sleep/date/${today}.json`),
    fitbitGet(`/1/user/-/spo2/date/${today}.json`).catch(() => null),
  ]);

  const restingHR  = heartRate?.['activities-heart']?.[0]?.value?.restingHeartRate;
  const hrZones    = heartRate?.['activities-heart']?.[0]?.value?.heartRateZones;
  const latestWeight = weight?.weight?.[0]?.weight;  // kg
  const sleepData  = sleep?.summary;
  const totalSleep = sleepData ? Math.round(sleepData.totalMinutesAsleep / 60 * 10) / 10 : null;

  return {
    steps:           activities?.summary?.steps    || null,
    calories:        activities?.summary?.caloriesOut || null,
    distance:        activities?.summary?.distances?.find(d => d.activity === 'total')?.distance || null,
    activeMinutes:   activities?.summary?.veryActiveMinutes || null,
    restingHeartRate: restingHR || null,
    heartRateZones:  hrZones   || null,
    weight:          latestWeight ? Math.round(latestWeight * 2.20462) : null,  // kg → lbs
    sleepHours:      totalSleep,
    sleepScore:      sleep?.sleep?.[0]?.efficiency || null,
    spo2:            spo2?.value?.avg || null,
    source:          'Fitbit',
  };
}
