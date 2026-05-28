export type AdminSession = {
  id: number;
  email: string;
  name: string;
  department: string | null;
  position: string | null;
  role: string | null;
};

export function getAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem('adminUser');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.id || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isSuperAdmin(session: AdminSession | null = getAdminSession()): boolean {
  return session?.role === 'admin';
}

export function saveAdminSession(admin: AdminSession) {
  sessionStorage.setItem('user', admin.email);
  sessionStorage.setItem('adminUser', JSON.stringify(admin));
}

export function clearAdminSession() {
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('adminUser');
}
