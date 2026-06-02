import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = 'app_onboarding_completed';

export async function loadOnboardingCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
  return value === 'true';
}

export async function markOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
}
