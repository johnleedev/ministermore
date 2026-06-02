import axios from 'axios';
import { MAIN_API_BASE } from './constants';

export type RegisterUserData = {
  checkUsingPolicy: boolean;
  checkPersonalInfo: boolean;
  checkContentsRestrict: boolean;
  checkInfoToOthers: boolean;
  checkServiceNotifi: boolean;
  email: string;
  password: string;
  userNickname: string;
  userChurch: string;
  userSort: string;
  userDetail: string;
  userURL: string;
};

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/** true = 이미 사용 중(중복) */
export async function isAccountDuplicate(account: string): Promise<boolean> {
  const res = await axios.get(
    `${MAIN_API_BASE}/login/logincheckaccount/${encodeURIComponent(account)}`,
  );
  return res.data === true;
}

export async function sendEmailAuthCode(email: string): Promise<number | null> {
  const res = await axios.post(`${MAIN_API_BASE}/login/loginaccountauth`, { email });
  if (res.data && typeof res.data.num === 'number') {
    return res.data.num;
  }
  return null;
}

export async function submitRegister(userData: RegisterUserData): Promise<boolean> {
  const res = await axios.post(`${MAIN_API_BASE}/login/logisterdo`, { userData });
  return Boolean(res.data);
}

export async function requestPasswordReset(
  email: string,
  userNickname: string,
): Promise<boolean> {
  const res = await axios.post(`${MAIN_API_BASE}/login/changepassword`, {
    email: email.trim(),
    userNickname: userNickname.trim(),
  });
  return res.data === true;
}
