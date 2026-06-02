import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  EventType,
} from '@notifee/react-native';
import { AppState, Linking, PermissionsAndroid, Platform } from 'react-native';
import { dequeueDeepLink, enqueueDeepLink } from '../../pendingDeepLink';
import {
  extractDeepLinkFromData,
  extractDeepLinkFromNotifeeData,
} from '../deepLink';
import {
  HOMEINAPP_API_BASE,
  HOMEINAPP_CHURCH_ID,
} from '../config/api';
import { syncUserActiveToServer } from '../notifi/notificationSettings';

type OpenDeepLink = (url: string | null | undefined) => void;

type PushCleanup = () => void;

let activeCleanup: PushCleanup | null = null;

function resolveDeviceType(): 'android' | 'ios' | 'web' {
  if (Platform.OS === 'ios') {
    return 'ios';
  }
  if (Platform.OS === 'android') {
    return 'android';
  }
  return 'web';
}

async function resolveChurchId(): Promise<string> {
  return HOMEINAPP_CHURCH_ID;
}

async function syncTokenToServer(
  endpoint: 'registerUserToken' | 'refreshUserToken',
  token: string,
  userToken?: string,
) {
  const churchId = await resolveChurchId();
  if (!churchId) {
    console.log('[push] churchId missing, token sync skipped');
    return;
  }

  try {
    const res = await fetch(`${HOMEINAPP_API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        churchId,
        fcmToken: token,
        deviceType: resolveDeviceType(),
        ...(userToken ? { userToken } : {}),
      }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.success) {
      console.log('[push] token sync failed:', payload?.message || res.status);
      return;
    }
    console.log('[push] token synced:', endpoint, payload?.data?.mode || '-');
  } catch (error) {
    console.log('[push] token sync error:', error);
  }
}

/** FCM 원격 알림용 권한 (iOS에서 시스템 대화상자, Android에서는 대부분 즉시 허용). */
async function requestUserPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }

  return enabled;
}

async function setupPushNotifications(userToken?: string) {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }
    await notifee.requestPermission();

    await messaging().registerDeviceForRemoteMessages();
    const isAuthorized = await requestUserPermission();

    await syncUserActiveToServer();

    if (!isAuthorized) {
      console.log('Push permission denied by user.');
      return;
    }

    const token = await messaging().getToken();
    console.log('FCM token:', token);
    await syncTokenToServer('registerUserToken', token, userToken);
  } catch (error) {
    console.log('Push setup error:', error);
  }
}

async function consumeQueuedAndInitial(openDeepLink: OpenDeepLink) {
  const queued = dequeueDeepLink();
  if (queued) {
    openDeepLink(queued);
  }

  const linkingUrl = await Linking.getInitialURL();
  if (linkingUrl) {
    openDeepLink(linkingUrl);
  }

  const fcmInitial = await messaging().getInitialNotification();
  const fromFcm = extractDeepLinkFromData(fcmInitial?.data);
  if (fromFcm) {
    openDeepLink(fromFcm);
  }

  const notifeeInitial = await notifee.getInitialNotification();
  const fromNotifee = extractDeepLinkFromNotifeeData(
    notifeeInitial?.notification?.data,
  );
  if (fromNotifee) {
    openDeepLink(fromNotifee);
  }
}

/** React 마운트 전에도 동작하는 백그라운드 핸들러 (모듈 로드 시 1회 등록). */
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message received:', remoteMessage?.messageId);
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) {
    return;
  }
  const data = detail.notification?.data;
  const link =
    (typeof data?.link === 'string' && data.link) ||
    (typeof data?.url === 'string' && data.url) ||
    (typeof data?.deep_link === 'string' && data.deep_link);
  if (link) {
    enqueueDeepLink(link);
  }
});

/**
 * 로그인 완료 후 `LoggedInApp`에서 호출합니다.
 * @param openDeepLink 딥링크 수신 시 Jotai 등으로 전달할 콜백
 * @param userToken 서버 토큰 동기화 시 함께 보낼 값 (선택)
 */
export function initPushServices(
  openDeepLink: OpenDeepLink,
  userToken?: string,
): void {
  cleanupPushServices();

  setupPushNotifications(userToken).catch(() => {});
  consumeQueuedAndInitial(openDeepLink).catch(() => {});

  const appStateSub = AppState.addEventListener('change', state => {
    if (state === 'active') {
      syncUserActiveToServer().catch(() => {});
      consumeQueuedAndInitial(openDeepLink).catch(() => {});
    }
  });

  const urlSub = Linking.addEventListener('url', ({ url }) => {
    openDeepLink(url);
  });

  const unsubscribeOpened = messaging().onNotificationOpenedApp(
    remoteMessage => {
      openDeepLink(extractDeepLinkFromData(remoteMessage.data));
    },
  );

  const unsubscribeNotifeeForeground = notifee.onForegroundEvent(
    ({ type, detail }) => {
      if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) {
        return;
      }
      const link = extractDeepLinkFromNotifeeData(detail.notification?.data);
      if (link) {
        openDeepLink(link);
      }
    },
  );

  const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
    const title = remoteMessage.notification?.title ?? '새 알림';
    const body = remoteMessage.notification?.body ?? '메시지가 도착했습니다.';
    const deepLink = extractDeepLinkFromData(remoteMessage.data);
    const dataPayload: Record<string, string> = {};
    if (deepLink) {
      dataPayload.link = deepLink;
    }
    if (remoteMessage.data) {
      for (const k of Object.keys(remoteMessage.data)) {
        const v = remoteMessage.data[k];
        if (typeof v === 'string') {
          dataPayload[k] = v;
        }
      }
    }

    let channelId = 'default';
    if (Platform.OS === 'android') {
      channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Notifications',
        importance: AndroidImportance.HIGH,
      });
    }

    await notifee.displayNotification({
      title,
      body,
      data: Object.keys(dataPayload).length ? dataPayload : undefined,
      android: {
        channelId,
        pressAction: { id: 'default' },
      },
      ios: {
        foregroundPresentationOptions: {
          banner: true,
          list: true,
          sound: true,
        },
      },
    });

    console.log('Foreground message received:', remoteMessage?.messageId);
  });

  const unsubscribeTokenRefresh = messaging().onTokenRefresh(
    async refreshedToken => {
      console.log('FCM token refreshed:', refreshedToken);
      await syncUserActiveToServer();
      await syncTokenToServer('refreshUserToken', refreshedToken, userToken);
    },
  );

  activeCleanup = () => {
    appStateSub.remove();
    urlSub.remove();
    unsubscribeOpened();
    unsubscribeNotifeeForeground();
    unsubscribeOnMessage();
    unsubscribeTokenRefresh();
    activeCleanup = null;
  };
}

/** `initPushServices`로 등록한 리스너를 해제합니다. */
export function cleanupPushServices(): void {
  activeCleanup?.();
}
