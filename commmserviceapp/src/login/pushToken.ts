import messaging from '@react-native-firebase/messaging';

export async function getFcmTokenSafe(): Promise<string> {
  try {
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    return String(token || '').trim();
  } catch {
    return '';
  }
}
