export type ServiceAdminNavItem = {
  id: string;
  label: string;
  path: string | null;
  activePrefixes?: string[];
};

export const SERVICE_ADMIN_NAV_ITEMS: ServiceAdminNavItem[] = [
  { id: 'dashboard', label: '대시보드', path: '/' },
  { id: 'retreat', label: '수련회 전단지', path: '/retreat', activePrefixes: ['/retreat'] },
  { id: 'church-app', label: '교회 전용앱', path: '/church-app', activePrefixes: ['/church-app'] },
  { id: 'attendance', label: '출석부', path: '/attendance', activePrefixes: ['/attendance'] },
  { id: 'intro', label: '교회소개 전단지', path: '/intro', activePrefixes: ['/intro'] },
  { id: 'event', label: '행사 전단지', path: '/event', activePrefixes: ['/event'] },
];

const ENABLED_NAV_IDS = new Set(['dashboard', 'retreat']);

export function isServiceAdminNavEnabled(item: ServiceAdminNavItem): boolean {
  return ENABLED_NAV_IDS.has(item.id);
}

export function isServiceAdminNavActive(pathname: string, item: ServiceAdminNavItem): boolean {
  if (item.id === 'dashboard') return pathname === '/';
  if (!item.path) return false;

  const prefixes = item.activePrefixes ?? [item.path];
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
