import type { StoredUserData } from './sessionStorage';
import { saveSession } from './sessionStorage';

/** 서버 `/login/loginemail` 또는 `/login/login` 성공 시 user 행 형태 */
export type LoginSuccessPayload = {
  isUser: true;
  refreshToken?: string;
  userAccount?: string;
  userNickName?: string;
  userChurch?: string;
  userSort?: string;
  userDetail?: string;
  grade?: string;
  authInstitution?: string;
  authChurch?: string;
  authDepartment?: string;
  authGroup?: string;
} & Record<string, unknown>;

export type NeedsSignupPayload = {
  isUser: false;
  email?: string;
  name?: string;
  userURL?: string;
  refreshToken?: string;
};

export function rowToStoredUser(data: Record<string, unknown>): StoredUserData {
  return {
    userAccount: String(data.userAccount ?? ''),
    userNickName: String(data.userNickName ?? ''),
    userChurch: String(data.userChurch ?? ''),
    userSort: String(data.userSort ?? ''),
    userDetail: String(data.userDetail ?? ''),
    grade: String(data_grade(data)),
    authInstitution: String(data.authInstitution ?? ''),
    authChurch: String(data.authChurch ?? ''),
    authDepartment: String(data.authDepartment ?? ''),
    authGroup: String(data.authGroup ?? ''),
  };
}

function data_grade(data: Record<string, unknown>): string {
  const g = data.grade;
  return g != null ? String(g) : '';
}

export function isLoginSuccess(data: unknown): data is LoginSuccessPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as LoginSuccessPayload).isUser === true
  );
}

export function isNeedsSignup(data: unknown): data is NeedsSignupPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as NeedsSignupPayload).isUser === false
  );
}

export async function persistSuccessfulLogin(
  data: LoginSuccessPayload,
): Promise<void> {
  const token = String(data.refreshToken ?? '');
  await saveSession(token, rowToStoredUser(data));
}
