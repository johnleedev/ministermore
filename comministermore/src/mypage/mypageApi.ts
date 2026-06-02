import axios from 'axios';
import { MAIN_API_BASE } from '../config/api';

export type UserProfile = {
  grade: string;
  userAccount: string;
  userNickName: string;
  userSort: string;
  userDetail: string;
  userURL: string;
};

export async function fetchUserProfile(userAccount: string): Promise<UserProfile | null> {
  const res = await axios.get(`${MAIN_API_BASE}/mypage/getprofile/${encodeURIComponent(userAccount)}`);
  const row = res.data?.[0];
  if (!row) return null;
  return {
    grade: String(row.grade ?? ''),
    userAccount: String(row.userAccount ?? ''),
    userNickName: String(row.userNickName ?? ''),
    userSort: String(row.userSort ?? ''),
    userDetail: String(row.userDetail ?? ''),
    userURL: String(row.userURL ?? ''),
  };
}

export async function changeProfile(params: {
  userAccount: string;
  userNickName: string;
  userSort: string;
  userDetail: string;
}): Promise<boolean> {
  const res = await axios.post(`${MAIN_API_BASE}/mypage/changeprofile`, params);
  return res.data === true;
}

export async function changeProfilePassword(params: {
  userAccount: string;
  userNickName: string;
  passwordCurrent: string;
  passwordChange: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await axios.post(`${MAIN_API_BASE}/mypage/profilechangepassword`, params);
  if (res.data === true) return { ok: true };
  return { ok: false, message: typeof res.data === 'string' ? res.data : '다시 시도해주세요.' };
}

export async function deleteAccount(userAccount: string): Promise<boolean> {
  const res = await axios.post(`${MAIN_API_BASE}/mypage/deleteaccount`, { userAccount });
  return res.data === true;
}

export function formatJoinPath(userURL: string): string {
  if (userURL === 'email') return '이메일';
  if (userURL === 'kakao') return '카카오';
  if (userURL === 'naver') return '네이버';
  if (userURL === 'apple') return 'Apple';
  return userURL || '-';
}
