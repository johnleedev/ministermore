import type { SubscriptionAccess } from '../api/dashboardApi';

export const SERVICE_TYPE_KEYS = [
  'FLYER_RETREAT',
  'CHURCH_APP',
  'ATTENDANCE',
  'FLYER_INTRO',
  'FLYER_EVENT',
] as const;

export type ServiceTypeKey = (typeof SERVICE_TYPE_KEYS)[number];

export type ServiceSubscriptions = Record<ServiceTypeKey, SubscriptionAccess>;

export const EMPTY_SERVICE_SUBSCRIPTIONS: ServiceSubscriptions = Object.fromEntries(
  SERVICE_TYPE_KEYS.map((key) => [key, { hasAccess: false, expireDate: null }]),
) as ServiceSubscriptions;

export type ServiceCatalogItem = {
  key: ServiceTypeKey;
  title: string;
  description: string;
  icon: string;
  path: string;
  applyUrl: string;
  /** Main.scss 서비스 카드 modifier 클래스 */
  cardClass: string;
};

export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  {
    key: 'FLYER_RETREAT',
    title: '수련회 전단지 관리',
    description: '수련회·집회 안내 전단지를 제작하고 수정하세요.',
    icon: '🏕️',
    path: '/retreat',
    applyUrl: 'https://ministermore.co.kr/service/retreat',
    cardClass: 'card-retreat',
  },
  {
    key: 'CHURCH_APP',
    title: '교회 전용앱 관리',
    description: '푸시 알림 발송과 교회 전용앱 설정을 관리하세요.',
    icon: '📲',
    path: '/church-app',
    applyUrl: 'https://ministermore.co.kr/service/churchapp',
    cardClass: 'card-church-app',
  },
  {
    key: 'ATTENDANCE',
    title: '주일학교 출석부 관리',
    description: '학생 목록과 주일학교 출석을 체크하고 관리하세요.',
    icon: '✅',
    path: '/attendance',
    applyUrl: 'https://ministermore.co.kr/service',
    cardClass: 'card-attendance',
  },
  {
    key: 'FLYER_INTRO',
    title: '교회소개 전단지 관리',
    description: '교회 소개 모바일 전단지를 편집하고 공유하세요.',
    icon: '⛪',
    path: '/intro',
    applyUrl: 'https://ministermore.co.kr/service/notice',
    cardClass: 'card-intro',
  },
  {
    key: 'FLYER_EVENT',
    title: '행사 전단지 관리',
    description: '행사·집회 안내 페이지를 제작하고 수정하세요.',
    icon: '📣',
    path: '/event',
    applyUrl: 'https://ministermore.co.kr/service/event',
    cardClass: 'card-event',
  },
];
