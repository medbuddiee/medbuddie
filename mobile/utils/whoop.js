import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { storage } from './storage';

// Register at developer.whoop.com → create app → set redirect to: medbuddie://whoop-callback
const CLIENT_ID      = process.env.EXPO_PUBLIC_WHOOP_CLIENT_ID || '';
const CLIENT_SECRET  = process.env.EXPO_PUBLIC_WHOOP_CLIENT_SECRET || '';
const WHOOP_BASE     = 'https://api.prod.whoop.com/developer';
const AUTH_ENDPOINT  = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const TOKEN_ENDPOINT = 'https://api.prod.whoop.com/oauth/oauth2/token';

const SCOPES = [
  'read:recovery', 'read:cycles', 'read:sleep',
  'read:workout', 'read:profile', 'read:body_measurement',
];

WebBrowser.maybeCompleteAuthSession();

/* ── OAuth ──────────────────────────────────────────────────────────────── */

export async function connectWhoop() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'medbuddie', path: 'whoop-callback' });

  const request = new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    scopes: SCOPES,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const discovery = { authorizationEndpoint: AUTH_ENDPOINT, tokenEndpoint: TOKEN_ENDPOINT };
  const result = await request.promptAsync(discovery);
  if (result.type !== 'success') throw new Error('Whoop authorisation cancelled.');

  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code:          result.params.code,
      code_verifier: request.codeVerifier,
      grant_type:    'authorization_code',
      redirect_uri:  redirectUri,
    }).toString(),
  });

  const tokens = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(tokens.error_description || 'Whoop token exchange failed');

  await storage.set('whoop_access_token',  tokens.access_token);
  await storage.set('whoop_refresh_token', tokens.refresh_token);
  return true;
}

export async function disconnectWhoop() {
  await storage.remove('whoop_access_token');
  await storage.remove('whoop_refresh_token');
}

export async function isWhoopConnected() {
  const token = await storage.get('whoop_access_token');
  return !!token;
}

/* ── API calls ──────────────────────────────────────────────────────────── */

async function whoopGet(path) {
  const token = await storage.get('whoop_access_token');
  if (!token) throw new Error('Whoop not connected');

  const res = await fetch(`${WHOOP_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    const refreshed = await refreshWhoopToken();
    if (!refreshed) throw new Error('Whoop session expired. Please reconnect.');
    return whoopGet(path);
  }

  return res.json();
}

async function refreshWhoopToken() {
  const refreshToken = await storage.get('whoop_refresh_token');
  if (!refreshToken) return false;

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!res.ok) return false;
  const tokens = await res.json();
  await storage.set('whoop_access_token',  tokens.access_token);
  await storage.set('whoop_refresh_token', tokens.refresh_token);
  return true;
}

export async function fetchWhoopData() {
  const [recovery, cycles, sleep, profile] = await Promise.all([
    whoopGet('/v1/recovery?limit=1'),
    whoopGet('/v1/cycle?limit=1'),
    whoopGet('/v1/activity/sleep?limit=1'),
    whoopGet('/v1/user/measurement/body'),
  ]);

  const latestRecovery = recovery?.records?.[0]?.score;
  const latestCycle    = cycles?.records?.[0]?.score;
  const latestSleep    = sleep?.records?.[0]?.score;

  return {
    recoveryScore:    latestRecovery?.recovery_score                      || null,  // 0–100
    hrv:              latestRecovery?.hrv_rmssd_milli
                        ? Math.round(latestRecovery.hrv_rmssd_milli)      : null,  // ms
    restingHeartRate: latestRecovery?.resting_heart_rate                  || null,  // bpm
    strain:           latestCycle?.strain                                 || null,  // 0–21
    calories:         latestCycle?.kilojoule ? Math.round(latestCycle.kilojoule / 4.184) : null,
    sleepPerformance: latestSleep?.sleep_performance_percentage           || null,  // %
    sleepHours:       latestSleep?.stage_summary?.total_in_bed_time_milli
                        ? Math.round(latestSleep.stage_summary.total_in_bed_time_milli / 3600000 * 10) / 10
                        : null,
    weight:           profile?.weight ? Math.round(profile.weight * 2.20462) : null,
    height:           profile?.height ? metersToFeetInches(profile.height / 100) : null,
    source:           'Whoop',
  };
}

function metersToFeetInches(m) {
  const totalInches = m * 39.3701;
  const feet   = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}
