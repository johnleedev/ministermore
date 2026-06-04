import axios from 'axios';
import { MAIN_API_BASE } from './constants';
import { getFcmTokenSafe } from './pushToken';

export type LoginEmailBody = {
  loginAccount: string;
  loginPasswd: string;
  userURL: string;
  token?: string;
};

/** 이메일 로그인 — server POST /login/loginemail */
export async function postLoginEmail(body: LoginEmailBody) {
  const token = body.token ?? (await getFcmTokenSafe());
  return axios.post(`${MAIN_API_BASE}/login/loginemail`, {
    ...body,
    token,
  });
}
