import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://192.168.85.51:5000';

export const AUTH_TOKEN_KEY = '@futurex_access_token';
export const REFRESH_TOKEN_KEY = '@futurex_refresh_token';
export const DEVICE_ID_KEY = '@futurex_unique_device_id';

export async function getOrCreateDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `fx-${Platform.OS}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getDeviceLabel(): string {
  return Platform.OS === 'ios' ? 'iPhone / iOS Device' : 'Android Phone';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
  requiresAuth?: boolean;
}

async function tryRefreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data?.accessToken) return null;

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
    if (data.refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {},
  hasRetried = false
): Promise<T> {
  const { method = 'GET', body, timeoutMs = 20000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      signal: controller.signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Auto-refresh expired access token once and retry seamlessly
    if (response.status === 401 && !hasRetried && !endpoint.startsWith('/api/auth/')) {
      clearTimeout(timer);
      const newToken = await tryRefreshAccessToken();
      if (newToken) {
        return apiRequest<T>(endpoint, options, true);
      }
    }

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg = data?.error || data?.message || `HTTP ${response.status}`;
      throw new Error(String(msg));
    }

    return data as T;
  } finally {
    clearTimeout(timer);
  }
}