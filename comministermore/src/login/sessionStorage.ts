import AsyncStorage from '@react-native-async-storage/async-storage';

export const SESSION_LOGGED_IN_KEY = 'ministermore_logged_in';
export const SESSION_REFRESH_TOKEN_KEY = 'ministermore_refreshToken';
export const SESSION_USER_DATA_KEY = 'ministermore_user_data';

export type StoredUserData = {
  userAccount: string;
  userNickName: string;
  userChurch: string;
  userSort: string;
  userDetail: string;
  grade: string;
  authInstitution: string;
  authChurch: string;
  authDepartment: string;
  authGroup: string;
};

export async function saveSession(
  refreshToken: string,
  user: StoredUserData,
): Promise<void> {
  await AsyncStorage.multiSet([
    [SESSION_LOGGED_IN_KEY, 'true'],
    [SESSION_REFRESH_TOKEN_KEY, refreshToken],
    [SESSION_USER_DATA_KEY, JSON.stringify(user)],
  ]);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    SESSION_LOGGED_IN_KEY,
    SESSION_REFRESH_TOKEN_KEY,
    SESSION_USER_DATA_KEY,
  ]);
}

export async function isLoggedInStorage(): Promise<boolean> {
  const v = await AsyncStorage.getItem(SESSION_LOGGED_IN_KEY);
  const token = await AsyncStorage.getItem(SESSION_REFRESH_TOKEN_KEY);
  return v === 'true' && Boolean(token && token.length > 0);
}

export async function loadSessionUser(): Promise<StoredUserData | null> {
  const raw = await AsyncStorage.getItem(SESSION_USER_DATA_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredUserData;
  } catch {
    return null;
  }
}

export async function loadRefreshToken(): Promise<string> {
  return (await AsyncStorage.getItem(SESSION_REFRESH_TOKEN_KEY)) ?? '';
}

export async function updateSessionUser(
  partial: Partial<StoredUserData>,
): Promise<StoredUserData | null> {
  const user = await loadSessionUser();
  if (!user) return null;
  const next = { ...user, ...partial };
  const token = await loadRefreshToken();
  await saveSession(token, next);
  return next;
}
