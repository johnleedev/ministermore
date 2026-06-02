import axios from 'axios';
import { MAIN_API_BASE } from './constants';

export type LoginEmailBody = {
  loginAccount: string;
  loginPasswd: string;
  userURL: string;
};

/** 이메일 로그인 — server POST /login/loginemail */
export async function postLoginEmail(body: LoginEmailBody) {
  return axios.post(`${MAIN_API_BASE}/login/loginemail`, body);
}
