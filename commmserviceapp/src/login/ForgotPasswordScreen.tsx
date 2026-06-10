import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { AuthStackParamList } from '../navigation/AuthStack';
import { loginColors as c } from './loginTheme';
import { isValidEmail, requestPasswordReset } from './registerApi';
import { LoginKeyboardScreen, useLoginInputFocusScroll } from './LoginKeyboardScreen';

const LOGO = require('../images/login/mainlogo.png');

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const scrollInputIntoView = useLoginInputFocusScroll();
  const [email, setEmail] = useState('');
  const [userNickname, setUserNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedNickname = userNickname.trim();

    if (!trimmedEmail || !trimmedNickname) {
      Alert.alert('', '이메일과 닉네임을 입력해주세요.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      Alert.alert('', '이메일 형식이 아닙니다.');
      return;
    }

    setSubmitting(true);
    try {
      const ok = await requestPasswordReset(trimmedEmail, trimmedNickname);
      if (ok) {
        Alert.alert(
          '비밀번호 발급',
          '입력하신 이메일로 임시 비밀번호(8자리)를 보냈습니다.\n메일을 확인한 뒤 로그인해주세요.',
          [{ text: '확인', onPress: () => navigation.navigate('Login') }],
        );
      } else {
        Alert.alert(
          '',
          '이메일과 닉네임이 일치하지 않거나, 이메일 가입 계정이 아닙니다.\nSNS로 가입하셨다면 해당 SNS로 로그인해주세요.',
        );
      }
    } catch {
      Alert.alert('', '다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LoginKeyboardScreen>
          <View style={styles.screen}>
            <Pressable
              style={styles.backRow}
              onPress={() => navigation.navigate('Login')}
              hitSlop={8}>
              <MaterialIcons name="chevron-left" size={28} color={c.text} />
              <Text style={styles.backText}>로그인</Text>
            </Pressable>

            <View style={styles.hero}>
              <View style={styles.logoWrap}>
                <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              </View>
              <Text style={styles.heroTitle}>비밀번호 찾기</Text>
              <Text style={styles.heroSubtitle}>
                가입 시 사용한 이메일과 닉네임을 입력해주세요.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.notice}>
                확인되면 이메일로 임시 비밀번호(영문·숫자 8자리)를 보내드립니다. 받은
                비밀번호로 로그인한 뒤 마이페이지에서 변경할 수 있습니다.
              </Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  이메일 <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="email" size={20} color={c.textMuted2} />
                  <TextInput
                    style={styles.input}
                    placeholder="이메일 주소"
                    placeholderTextColor={c.textMuted2}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    editable={!submitting}
                    onChangeText={setEmail}
                    onFocus={scrollInputIntoView}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  닉네임 <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="person-outline" size={20} color={c.textMuted2} />
                  <TextInput
                    style={styles.input}
                    placeholder="가입 시 닉네임"
                    placeholderTextColor={c.textMuted2}
                    value={userNickname}
                    editable={!submitting}
                    onChangeText={setUserNickname}
                    onFocus={scrollInputIntoView}
                  />
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                  submitting && styles.buttonDisabled,
                ]}
                disabled={submitting}
                onPress={() => void handleSubmit()}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>임시 비밀번호 받기</Text>
                )}
              </Pressable>
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
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: c.textMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: c.cardBg,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 28,
    padding: 22,
    gap: 16,
    marginHorizontal: 4,
  },
  notice: {
    fontSize: 13,
    lineHeight: 20,
    color: c.textMuted,
  },
  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: c.text },
  required: { color: '#ef4444' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: c.text,
    padding: 0,
  },
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonPressed: { opacity: 0.92 },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
