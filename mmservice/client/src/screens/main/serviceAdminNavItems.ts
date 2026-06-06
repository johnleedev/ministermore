export type ServiceAdminNavItem = {
  id: string;
  label: string;
  /** mmservice 내부 경로 — null이면 미구현 */
  path: string | null;
  /** 활성 탭 판별용 경로 접두사 (path와 다를 수 있음) */
  activePrefixes?: string[];
};

export const SERVICE_ADMIN_NAV_ITEMS: ServiceAdminNavItem[] = [
  { id: 'dashboard', label: '대시보드', path: '/' },
  {
    id: 'booklet',
    label: '모바일 전단지',
    path: '/service/notice',
    activePrefixes: ['/service/notice', '/service/bookletnotice'],
  },
  {
    id: 'event',
    label: '행사 전단지',
    path: '/service/event',
    activePrefixes: ['/service/event', '/service/bookletevent'],
  },
  {
    id: 'churchapp',
    label: '교회 앱',
    path: '/service/churchapp',
    activePrefixes: ['/service/churchapp'],
  },
  {
    id: 'webapp',
    label: '웹앱',
    path: '/service/homeinapp',
    activePrefixes: ['/service/homeinapp'],
  },
  { id: 'stats', label: '통계', path: null },
  { id: 'settings', label: '설정', path: null },
];

export function isServiceAdminNavActive(pathname: string, item: ServiceAdminNavItem): boolean {
  if (item.id === 'dashboard') return pathname === '/';
  if (!item.path) return false;

  const prefixes = item.activePrefixes ?? [item.path];
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
