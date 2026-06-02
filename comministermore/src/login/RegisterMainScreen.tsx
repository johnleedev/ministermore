import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSetAtom } from 'jotai';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { isLoggedInAtom } from '../state/atoms';
import type { AuthStackParamList } from '../navigation/AuthStack';
import { loginColors as c } from './loginTheme';
import { persistSuccessfulLogin } from './mapLoginResponse';
import { authenticateWithApple, authenticateWithKakao } from './socialAuth';
import { LoginKeyboardScreen } from './LoginKeyboardScreen';

const LOGO = require('../images/login/mainlogo.png');
const KAKAO_ICON = require('../images/login/kakao.png');

type Nav = NativeStackNavigationProp<AuthStackParamList, 'RegisterMain'>;

export function RegisterMainScreen() {
  const navigation = useNavigation<Nav>();
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);
  const [submitting, setSubmitting] = useState(false);

  const showApple = useMemo(
    () => Platform.OS === 'ios' && appleAuth.isSupported,
    [],
  );

  const goSnsRegister = (data: { email?: string; userURL?: string; refreshToken?: string }) => {
    const email = String(data.email ?? '').trim();
    if (!email) {
      Alert.alert('회원가입', '이메일 정보를 가져오지 못했습니다. 이메일로 가입해 주세요.');
      return;
    }
    navigation.navigate('RegisterDetail', {
      sort: 'sns',
      snsData: {
        email,
        userURL: String(data.userURL ?? ''),
        refreshToken: data.refreshToken,
      },
    });
  };

  const handleSocial = async (provider: 'kakao' | 'apple') => {
    setSubmitting(true);
    try {
      const result =
        provider === 'kakao' ? await authenticateWithKakao() : await authenticateWithApple();

      if (result.status === 'cancelled') return;

      if (result.status === 'success') {
        await persistSuccessfulLogin(result.data);
        setIsLoggedIn(true);
        return;
      }

      if (result.status === 'signup') {
        goSnsRegister(result.data);
        return;
      }

      Alert.alert(
        provider === 'kakao' ? '카카오' : 'Apple',
        '처리에 실패했습니다. 다시 시도해주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LoginKeyboardScreen>
          <View style={styles.screen}>
            <Pressable style={styles.backRow} onPress={() => navigation.navigate('Login')} hitSlop={8}>
              <MaterialIcons name="chevron-left" size={28} color={c.text} />
              <Text style={styles.backText}>로그인</Text>
            </Pressable>

            <View style={styles.hero}>
              <View style={styles.logoWrap}>
                <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              </View>
              <Text style={styles.heroTitle}>회원가입</Text>
              <Text style={styles.heroSubtitle}>다음 정보를 입력해주세요.</Text>
            </View>

            <View style={styles.steps}>
              <Text style={styles.stepActive}>간편가입</Text>
              <MaterialIcons name="chevron-right" size={18} color="#94a3b8" />
              <Text style={styles.stepMuted}>동의</Text>
              <MaterialIcons name="chevron-right" size={18} color="#94a3b8" />
              <Text style={styles.stepMuted}>정보입력</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>SNS 계정으로 간편하게 시작하세요!</Text>

              <View style={styles.socials}>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    styles.kakao,
                    pressed && styles.buttonPressed,
                    submitting && styles.buttonDisabled,
                  ]}
                  disabled={submitting}
                  onPress={() => void handleSocial('kakao')}>
                  <Image source={KAKAO_ICON} style={styles.kakaoIcon} resizeMode="contain" />
                  <Text style={styles.kakaoText}>카카오로 회원가입</Text>
                </Pressable>

                {showApple ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.button,
                      styles.apple,
                      pressed && styles.buttonPressed,
                      submitting && styles.buttonDisabled,
                    ]}
                    disabled={submitting}
                    onPress={() => void handleSocial('apple')}>
                    <MaterialIcons name="apple" size={20} color="#fff" />
                    <Text style={styles.appleText}>Apple로 회원가입</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    styles.email,
                    pressed && styles.buttonPressed,
                    submitting && styles.buttonDisabled,
                  ]}
                  disabled={submitting}
                  onPress={() => navigation.navigate('RegisterDetail', { sort: 'email' })}>
                  <MaterialIcons name="email" size={20} color={c.primary} />
                  <Text style={styles.emailText}>이메일로 회원가입</Text>
                </Pressable>
              </View>

              {submitting ? (
                <ActivityIndicator style={styles.loader} color={c.primary} />
              ) : null}
            </View>
          </View>
    </LoginKeyboardScreen>
  );
}

const styles = StyleSheet.create({
  screen: { maxWidth: 430, width: '100%', alignSelf: 'center' },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 16, fontWeight: '700', color: c.text },
  hero: { alignItems: 'center', paddingHorizontal: 12, paddingBottom: 16 },
  logoWrap: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  logo: { width: 56, height: 56 },
  heroTitle: { fontSize: 28, fontWeight: '700', color: c.text, letterSpacing: -0.8 },
  heroSubtitle: { marginTop: 8, fontSize: 14, color: c.textMuted, textAlign: 'center' },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 16,
  },
  stepActive: { fontSize: 13, fontWeight: '800', color: c.text },
  stepMuted: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  card: {
    backgroundColor: c.cardBg,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 28,
    padding: 22,
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: c.text,
    marginBottom: 16,
    letterSpacing: -0.32,
  },
  socials: { gap: 10 },
  button: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonPressed: { opacity: 0.92 },
  buttonDisabled: { opacity: 0.65 },
  kakaoIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
  },
  kakao: { backgroundColor: c.kakao },
  kakaoText: { fontSize: 16, fontWeight: '800', color: c.kakaoText },
  apple: { backgroundColor: c.apple },
  appleText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  email: {
    borderWidth: 1.5,
    borderColor: c.border,
    backgroundColor: '#fff',
  },
  emailText: { fontSize: 16, fontWeight: '800', color: c.text },
  loader: { marginTop: 16 },
});
