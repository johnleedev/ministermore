import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSetAtom } from 'jotai';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { isLoggedInAtom } from '../state/atoms';
import type { AuthStackParamList } from '../navigation/AuthStack';
import { postLoginEmail } from './loginApi';
import { loginColors as c } from './loginTheme';
import {
  isLoginSuccess,
  isNeedsSignup,
  persistSuccessfulLogin,
} from './mapLoginResponse';
import { authenticateWithApple, authenticateWithKakao } from './socialAuth';
import { LoginKeyboardScreen, useLoginInputFocusScroll } from './LoginKeyboardScreen';

const LOGO = require('../images/login/mainlogo.png');
const KAKAO_ICON = require('../images/login/kakao.png');

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);
  const scrollInputIntoView = useLoginInputFocusScroll();

  const [loginAccount, setLoginAccount] = useState('');
  const [loginPasswd, setLoginPasswd] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const showApple = useMemo(
    () => Platform.OS === 'ios' && appleAuth.isSupported,
    [],
  );

  const goSnsRegister = (data: { email?: string; userURL?: string; refreshToken?: string }) => {
    const email = String(data.email ?? '').trim();
    if (!email) {
      Alert.alert('회원가입', '이메일 정보를 가져오지 못했습니다. 이메일로 가입해 주세요.');
      navigation.navigate('RegisterMain');
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

  const handlePostLoginPayload = async (data: unknown) => {
    if (isLoginSuccess(data)) {
      await persistSuccessfulLogin(data);
      setIsLoggedIn(true);
      return;
    }
    if (isNeedsSignup(data)) {
      goSnsRegister(data);
      return;
    }
    Alert.alert('로그인 실패', '다시 시도해주세요.');
  };

  const handleEmailLogin = async () => {
    if (!loginAccount.trim() || !loginPasswd) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await postLoginEmail({
        loginAccount: loginAccount.trim(),
        loginPasswd,
        userURL: 'email',
      });
      await handlePostLoginPayload(res.data);
    } catch {
      Alert.alert('오류', '다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
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
        provider === 'kakao' ? '카카오 로그인' : 'Apple 로그인',
        '로그인에 실패했습니다. 다시 시도해주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LoginKeyboardScreen>
          <View style={styles.screen}>
            <View style={styles.hero}>
              <View style={styles.logoWrap}>
                <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              </View>
              <Text style={styles.heroTitle}>로그인</Text>
              
            </View>

            <View style={styles.card}>
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
                  <Text style={styles.kakaoText}>카카오로 계속하기</Text>
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
                    <Text style={styles.appleText}>Apple로 계속하기</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>또는</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="email" size={20} color={c.textMuted2} />
                  <TextInput
                    style={styles.input}
                    placeholder="이메일 주소"
                    placeholderTextColor={c.textMuted2}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={loginAccount}
                    editable={!submitting}
                    onChangeText={setLoginAccount}
                    onFocus={scrollInputIntoView}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputWrap}>
                  <MaterialIcons name="lock" size={20} color={c.textMuted2} />
                  <TextInput
                    style={styles.input}
                    placeholder="비밀번호"
                    placeholderTextColor={c.textMuted2}
                    secureTextEntry={!showPassword}
                    value={loginPasswd}
                    editable={!submitting}
                    onChangeText={setLoginPasswd}
                    onFocus={scrollInputIntoView}
                    returnKeyType="search"
                    onSubmitEditing={() => void handleEmailLogin()}
                  />
                  <Pressable
                    onPress={() => setShowPassword(v => !v)}
                    hitSlop={8}
                    disabled={submitting}>
                    <Text style={styles.toggle}>{showPassword ? '숨기기' : '보기'}</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.primary,
                  pressed && styles.buttonPressed,
                  submitting && styles.buttonDisabled,
                ]}
                disabled={submitting}
                onPress={() => void handleEmailLogin()}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>이메일로 로그인</Text>
                )}
              </Pressable>

              <View style={styles.links}>
                <Pressable
                  onPress={() => navigation.navigate('RegisterMain')}
                  hitSlop={8}>
                  <Text style={styles.linkText}>회원가입</Text>
                </Pressable>
                <View style={styles.linkSep} />
                <Pressable
                  onPress={() => navigation.navigate('ForgotPassword')}
                  hitSlop={8}>
                  <Text style={styles.linkText}>비밀번호 찾기</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.footerNote}>
              이용약관 및 개인정보처리방침에 동의하고 로그인합니다
            </Text>
          </View>
    </LoginKeyboardScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 22,
  },
  logoWrap: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#1f6bff',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  logo: {
    width: 56,
    height: 56,
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: c.badgeBg,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: c.badgeText,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: c.text,
    letterSpacing: -0.9,
  },
  heroSubtitle: {
    marginTop: 10,
    maxWidth: 290,
    fontSize: 14,
    lineHeight: 22,
    color: c.textMuted,
    textAlign: 'center',
    letterSpacing: -0.14,
  },
  card: {
    backgroundColor: c.cardBg,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 28,
    padding: 22,
    marginHorizontal: 4,
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#1f6bff',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: c.text,
    marginBottom: 16,
    letterSpacing: -0.32,
  },
  socials: { gap: 10 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: c.divider,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  inputGroup: { gap: 12 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: c.text,
    padding: 0,
  },
  toggle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7c8798',
  },
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
  primary: {
    marginTop: 14,
    backgroundColor: c.primary,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.32,
  },
  kakaoIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
  },
  kakao: {
    backgroundColor: c.kakao,
    ...Platform.select({
      ios: {
        shadowColor: '#fee500',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 9,
      },
      android: { elevation: 2 },
    }),
  },
  kakaoText: {
    fontSize: 16,
    fontWeight: '800',
    color: c.kakaoText,
    letterSpacing: -0.32,
  },
  apple: {
    backgroundColor: c.apple,
    ...Platform.select({
      ios: {
        shadowColor: '#111',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 9,
      },
      android: { elevation: 2 },
    }),
  },
  appleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.32,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 18,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: c.textLink,
  },
  linkSep: {
    width: 1,
    height: 12,
    backgroundColor: '#d8e0ec',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 19,
    color: c.footer,
    paddingHorizontal: 18,
  },
});
