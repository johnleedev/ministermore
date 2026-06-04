import { closeAuth } from './rootNavigation';

/** 로그인·회원가입 완료 후 메인으로 복귀 */
export function completeAuthLogin() {
  closeAuth();
}
