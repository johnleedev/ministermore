import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ForceUpdateInfo } from './checkAppVersion';
import { APP_VERSION_NAME } from '../config/appVersion';

const APP_LOGO = require('../images/logopng.png');

type Props = {
  info: ForceUpdateInfo;
  onContinueWithoutUpdate: () => void;
};

export function ForceUpdateScreen({ info, onContinueWithoutUpdate }: Props) {
  const openStore = () => {
    if (!info.storeUrl) {
      return;
    }
    Linking.openURL(info.storeUrl).catch(() => {
      // 스토어 URL 미설정·오류 시에도 화면은 유지
    });
  };

  const handleContinueWithoutUpdate = () => {
    Alert.alert('안내', '앱 사용에 제한이 있을 수 있습니다', [
      { text: '취소', style: 'cancel' },
      { text: '확인', onPress: onContinueWithoutUpdate },
    ]);
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>업데이트가 필요합니다</Text>
        <Text style={styles.message}>{info.message}</Text>
        {info.latestVersionName ? (
          <Text style={styles.versionHint}>
            최신 버전 {info.latestVersionName} · 현재 {APP_VERSION_NAME}
          </Text>
        ) : (
          <Text style={styles.versionHint}>현재 버전 {APP_VERSION_NAME}</Text>
        )}
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={openStore}>
          <Text style={styles.buttonText}>스토어에서 업데이트</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.skipButton,
            pressed && styles.skipButtonPressed,
          ]}
          onPress={handleContinueWithoutUpdate}>
          <Text style={styles.skipButtonText}>업데이트 없이 사용하기</Text>
        </Pressable>
        <Text style={styles.footer}>업데이트 후 앱을 다시 실행해 주세요.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f8fd',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8eef8',
  },
  logo: {
    width: 120,
    height: 48,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 12,
  },
  versionHint: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    backgroundColor: '#1967ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  skipButton: {
    width: '100%',
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  skipButtonPressed: {
    backgroundColor: '#f9fafb',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  footer: {
    marginTop: 16,
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
