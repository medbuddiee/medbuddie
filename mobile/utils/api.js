import { storage } from './storage';

// EXPO_PUBLIC_* vars are inlined at build time by Metro
const BASE = process.env.EXPO_PUBLIC_API_URL || 'https://medbuddie.up.railway.app';

export const API_BASE = BASE;

export async function apiFetch(path, options = {}) {
  const token = await storage.get('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  return res;
}
