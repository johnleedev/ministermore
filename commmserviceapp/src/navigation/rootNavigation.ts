import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './RootNavigator';

export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToAuth() {
  if (rootNavigationRef.isReady()) {
    rootNavigationRef.navigate('Auth');
  }
}

export function closeAuth() {
  if (rootNavigationRef.isReady() && rootNavigationRef.canGoBack()) {
    rootNavigationRef.goBack();
  }
}
