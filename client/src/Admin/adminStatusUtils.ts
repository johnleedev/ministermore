export type AdminStatusCanonical = 'pending' | 'active' | 'rejected';

/** DB/API status → 화면·버튼용 (statusDb 우선) */
export function canonicalAdminStatus(
  status?: string | null,
  statusDb?: string | null
): AdminStatusCanonical {
  const s = String(statusDb ?? status ?? '').trim();
  if (!s) return 'pending';

  if (/^active$/i.test(s)) return 'active';
  if (/^pending$/i.test(s)) return 'pending';
  if (/^rejected$/i.test(s)) return 'rejected';

  if (/reject|거절/i.test(s)) return 'rejected';
  if (/pending|대기|waiting/i.test(s) && !/완료|approved|active|활성/i.test(s)) {
    return 'pending';
  }
  if (/active|approved|활성/i.test(s)) return 'active';
  if (/승인\s*완료|승인완료/i.test(s)) return 'active';
  if (/승인/i.test(s) && !/대기|pending/i.test(s)) return 'active';

  return 'pending';
}

export const ADMIN_STATUS_LABEL: Record<AdminStatusCanonical, string> = {
  pending: '승인 대기',
  active: '승인됨',
  rejected: '거절',
};

export function adminStatusLabel(status?: string | null, statusDb?: string | null): string {
  const canon = canonicalAdminStatus(status, statusDb);
  return ADMIN_STATUS_LABEL[canon];
}
