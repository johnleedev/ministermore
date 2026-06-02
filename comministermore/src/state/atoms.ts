import { atom } from 'jotai';
import { INITIAL_ROOT_TAB_SCROLL_REQUESTS } from '../navigation/rootTabKeys';
import type { HomeinappNotificationItem } from '../types/homeinappNotification';

/** 마지막으로 처리한 딥링크 (FCM / Notifee / URL 스킴 공유). React 19와 호환됩니다. */
export const lastDeepLinkAtom = atom<string | null>(null);

/**
 * 뒤로 탭(첫 탭)에서 `Home`으로 가며 WebView `goBack`을 요청할 때마다 1씩 증가.
 * `HomeScreen`이 포커스된 뒤에만 처리(탭 복귀/전환 이후 goBack).
 */
export const homeWebViewBackRequestAtom = atom(0);

/** 홈 탭 WebView 맨 위로 스크롤(같은 탭 연속 탭). */
export const homeWebViewScrollToTopAtom = atom<(() => void) | null>(null);

/** 알림 목록·상세 스크롤 맨 위로 — 값 증가마다 요청. @deprecated `rootTabScrollToTopRequestAtom` 사용 */
export const notificationsScrollToTopRequestAtom = atom(0);

/** 하단 탭 재탭 시 스크롤 맨 위 — 탭별 카운터 증가 */
export const rootTabScrollToTopRequestAtom = atom(INITIAL_ROOT_TAB_SCROLL_REQUESTS);

/** 앱 시작 시 불러온 알림 목록 전역 상태. */
export const notificationListAtom = atom<HomeinappNotificationItem[]>([]);

/** 앱 최초 실행(온보딩 미완료) 여부. */
export const isFirstLaunchAtom = atom(true);

/** 로그인 완료 여부. */
export const isLoggedInAtom = atom(false);
