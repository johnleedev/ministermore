import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

export const DEEP_LINK_KEYS = ['link', 'url', 'deep_link'] as const;

export function extractDeepLinkFromData(
  data: FirebaseMessagingTypes.RemoteMessage['data'] | null | undefined,
): string | null {
  if (!data) {
    return null;
  }
  for (const key of DEEP_LINK_KEYS) {
    const value = data[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return null;
}

export function extractDeepLinkFromNotifeeData(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const record = data as Record<string, unknown>;
  for (const key of DEEP_LINK_KEYS) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return null;
}
