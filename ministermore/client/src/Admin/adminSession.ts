export const ADMIN_USER_STORAGE_KEY = 'adminUser';
export const ADMIN_LEGACY_USER_KEY = 'user';

export type AdminSession = {
  id: number;
  email: string;
  name: string;
  department: string | null;
  position: string | null;
  role: string | null;
  status?: string;
  statusDb?: string;
};

export function normalizeAdminSession(admin: unknown): AdminSession | null {
  if (!admin || typeof admin !== 'object') return null;
  const row = admin as Record<string, unknown>;
  const id = Number(row.id);
  const email = String(row.email ?? '').trim();
  const name = String(row.name ?? '').trim();
  if (!Number.isInteger(id) || id <= 0 || !email) return null;

  return {
    id,
    email,
    name: name || email,
    department: row.department != null ? String(row.department) : null,
    position: row.position != null ? String(row.position) : null,
    role: row.role != null ? String(row.role) : null,
    status: row.status != null ? String(row.status) : undefined,
    statusDb: row.statusDb != null ? String(row.statusDb) : undefined,
  };
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_USER_STORAGE_KEY);
    if (!raw) return null;
    return normalizeAdminSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function isSuperAdmin(session: AdminSession | null = getAdminSession()): boolean {
  return session?.role === 'admin';
}

export function getAdminEmail(session: AdminSession | null = getAdminSession()): string {
  return session?.email?.trim() || '';
}

export function getAdminDisplayName(session: AdminSession | null = getAdminSession()): string {
  if (!session) return '';
  return session.name?.trim() || session.email?.trim() || '';
}

export function saveAdminSession(admin: unknown) {
  const normalized = normalizeAdminSession(admin);
  if (!normalized) return;
  sessionStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(normalized));
  sessionStorage.setItem(ADMIN_LEGACY_USER_KEY, normalized.email);
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_USER_STORAGE_KEY);
  sessionStorage.removeItem(ADMIN_LEGACY_USER_KEY);
}
