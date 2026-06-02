import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import {
  HOMEINAPP_API_BASE,
  HOMEINAPP_CHURCH_ID,
} from '../config/api';

const USER_WANTS_PUSH_KEY = `user_wants_push:${HOMEINAPP_CHURCH_ID}`;

type UserActiveUpdateResponse = {
  success?: boolean;
  message?: string;
};

/**
 * 시스템 알림 허용 여부(실기기 설정과 동기).
 * - iOS: APNs/FCM이 쓰는 `messaging().hasPermission()` — Notifee getNotificationSettings는
 *   iOS에서 실제 권한과 어긋날 수 있어 사용하지 않음.
 * - Android: Notifee + (API 33+) POST_NOTIFICATIONS.
 */
export async function getOsNotificationsAllowed(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const auth = await messaging().hasPermission();
    return (
      auth === messaging.AuthorizationStatus.AUTHORIZED ||
      auth === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  const deviceSettings = await notifee.getNotificationSettings();
  const notifeeAllowed =
    deviceSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    deviceSettings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const post = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return notifeeAllowed && post;
  }
  return notifeeAllowed;
}

/** null이면 “아직 저장 전” → true로 취급(기존 가입/푸시 흐름과 맞춤). */
export async function loadUserWantsPush(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(USER_WANTS_PUSH_KEY);
  if (raw === null) {
    return true;
  }
  return raw === '1';
}

export async function saveUserWantsPush(wants: boolean): Promise<void> {
  await AsyncStorage.setItem(USER_WANTS_PUSH_KEY, wants ? '1' : '0');
}

/** OS 허용 && 사용자가 앱에서 “받기” — 서버 isActive·스위치 표시와 일치. */
export async function getEffectivePushEnabled(): Promise<boolean> {
  const [os, userWants] = await Promise.all([
    getOsNotificationsAllowed(),
    loadUserWantsPush(),
  ]);
  return os && userWants;
}

export async function fetchFcmTokenForSync(): Promise<string> {
  try {
    await messaging().registerDeviceForRemoteMessages();
    return await messaging().getToken();
  } catch {
    return '';
  }
}

/**
 * users.isActive(및 fcm) 동기화. 앱 기동/포그라운드/토큰갱신·설정 토글 후 호출.
 */
export async function syncUserActiveToServer(): Promise<void> {
  const token = await fetchFcmTokenForSync();
  const isActive: '0' | '1' = (await getEffectivePushEnabled()) ? '1' : '0';

  try {
    const res = await fetch(`${HOMEINAPP_API_BASE}/updateUserActive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        churchId: HOMEINAPP_CHURCH_ID,
        fcmToken: token,
        isActive,
      }),
    });
    const payload: UserActiveUpdateResponse = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.success) {
      console.log(
        '[push] isActive sync failed:',
        payload?.message || res.status,
      );
    }
  } catch (e) {
    console.log('[push] isActive sync error:', e);
  }
}
