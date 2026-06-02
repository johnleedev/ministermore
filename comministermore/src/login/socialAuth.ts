import axios from 'axios';
import { login as kakaoLogin } from '@react-native-seoul/kakao-login';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { jwtDecode } from 'jwt-decode';
import { MAIN_API_BASE } from './constants';
import {
  isLoginSuccess,
  isNeedsSignup,
  type LoginSuccessPayload,
  type NeedsSignupPayload,
} from './mapLoginResponse';

export type SocialAuthResult =
  | { status: 'success'; data: LoginSuccessPayload }
  | { status: 'signup'; data: NeedsSignupPayload }
  | { status: 'cancelled' }
  | { status: 'error' };

function isCancelledError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : '';
  return msg.toLowerCase().includes('cancel');
}

export async function authenticateWithKakao(): Promise<SocialAuthResult> {
  try {
    const token = await kakaoLogin();
    const res = await axios.post(`${MAIN_API_BASE}/login/login`, {
      url: 'kakao',
      AccessToken: token.accessToken,
    });
    const data = res.data;
    if (isLoginSuccess(data)) return { status: 'success', data };
    if (isNeedsSignup(data)) return { status: 'signup', data };
    return { status: 'error' };
  } catch (e) {
    if (isCancelledError(e)) return { status: 'cancelled' };
    return { status: 'error' };
  }
}

export async function authenticateWithApple(): Promise<SocialAuthResult> {
  try {
    const appleAuthRequestResponse = await appleAuth.performRequest({
      nonceEnabled: false,
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });

    const credentialState = await appleAuth.getCredentialStateForUser(
      appleAuthRequestResponse.user,
    );
    if (credentialState !== appleAuth.State.AUTHORIZED) {
      return { status: 'error' };
    }

    const identityToken = appleAuthRequestResponse.identityToken;
    if (!identityToken) {
      return { status: 'error' };
    }

    const userInfo = jwtDecode(identityToken);
    const res = await axios.post(`${MAIN_API_BASE}/login/loginsocial/apple`, {
      userInfo,
      userFullName: appleAuthRequestResponse.fullName,
      AccessToken: identityToken,
    });
    const data = res.data;
    if (isLoginSuccess(data)) return { status: 'success', data };
    if (isNeedsSignup(data)) return { status: 'signup', data };
    return { status: 'error' };
  } catch (e) {
    if (isCancelledError(e)) return { status: 'cancelled' };
    return { status: 'error' };
  }
}
