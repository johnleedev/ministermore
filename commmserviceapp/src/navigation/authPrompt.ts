import { Alert } from 'react-native';
import { navigateToAuth } from './rootNavigation';

export function promptLogin(message = '로그인이 필요합니다.') {
  Alert.alert('안내', message, [
    { text: '취소', style: 'cancel' },
    { text: '로그인', onPress: () => navigateToAuth() },
  ]);
}

export function requireLogin(isLoggedIn: boolean, message?: string): boolean {
  if (isLoggedIn) {
    return true;
  }
  promptLogin(message);
  return false;
}
