import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { AuthStackParamList } from '../navigation/AuthStack';
import { POLICY_PERSONAL_URL, POLICY_USING_URL } from './constants';
import { loginColors as c } from './loginTheme';
import {
  isAccountDuplicate,
  isValidEmail,
  sendEmailAuthCode,
  submitRegister,
  type RegisterUserData,
} from './registerApi';
import { LoginKeyboardScreen, useLoginInputFocusScroll } from './LoginKeyboardScreen';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'RegisterDetail'>;
type Route = RouteProp<AuthStackParamList, 'RegisterDetail'>;

type AgreementKey =
  | 'checkUsingPolicy'
  | 'checkPersonalInfo'
  | 'checkContentsRestrict'
  | 'checkInfoToOthers'
  | 'checkServiceNotifi';

const AGREEMENT_ITEMS: {
  key: AgreementKey;
  label: string;
  required: boolean;
  link?: string;
}[] = [
  { key: 'checkUsingPolicy', label: '[필수] 서비스 이용약관 동의', required: true, link: POLICY_USING_URL },
  { key: 'checkPersonalInfo', label: '[필수] 개인정보 수집/이용 동의', required: true, link: POLICY_PERSONAL_URL },
  { key: 'checkContentsRestrict', label: '[필수] 유해 컨텐츠에 대한 제재 동의', required: true },
  { key: 'checkInfoToOthers', label: '[필수] 제3자 정보 제공 동의', required: true },
  { key: 'checkServiceNotifi', label: '[선택] 혜택성 정보수신 동의', required: false },
];

function CheckRow({
  checked,
  label,
  onToggle,
  link,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
  link?: string;
}) {
  return (
    <View style={styles.checkRow}>
      <Pressable style={styles.checkPress} onPress={onToggle}>
        <MaterialIcons
          name={checked ? 'check-circle' : 'radio-button-unchecked'}
          size={22}
          color={checked ? c.text : '#d1d5db'}
          style={styles.checkIcon}
        />
        <Text style={styles.checkLabel}>{label}</Text>
      </Pressable>
      {link ? (
        <Pressable
          style={styles.policyLinkBtn}
          onPress={() => void Linking.openURL(link)}
          hitSlop={8}>
          <Text style={styles.policyLink}>보기</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function RegisterDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const scrollInputIntoView = useLoginInputFocusScroll();
  const { sort, snsData } = route.params;
  const isSns = sort === 'sns';

  const [tab, setTab] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  const [agreements, setAgreements] = useState<Record<AgreementKey, boolean>>({
    checkUsingPolicy: false,
    checkPersonalInfo: false,
    checkContentsRestrict: false,
    checkInfoToOthers: false,
    checkServiceNotifi: false,
  });

  const [email, setEmail] = useState(isSns ? snsData?.email ?? '' : '');
  const [emailChecked, setEmailChecked] = useState(isSns);
  const [authCode, setAuthCode] = useState<number | null>(null);
  const [authInput, setAuthInput] = useState('');
  const [authVerified, setAuthVerified] = useState(isSns);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [church, setChurch] = useState('');
  const [userSort, setUserSort] = useState('');
  const [userDetail, setUserDetail] = useState('');

  const requiredAgreed =
    agreements.checkUsingPolicy &&
    agreements.checkPersonalInfo &&
    agreements.checkContentsRestrict &&
    agreements.checkInfoToOthers;

  const allAgreed = Object.values(agreements).every(Boolean);

  const toggleAll = () => {
    const next = !allAgreed;
    setAgreements({
      checkUsingPolicy: next,
      checkPersonalInfo: next,
      checkContentsRestrict: next,
      checkInfoToOthers: next,
      checkServiceNotifi: next,
    });
  };

  const toggleOne = (key: AgreementKey) => {
    setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCheckEmail = async () => {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      Alert.alert('', '이메일 형식이 아닙니다.');
      return;
    }
    setSubmitting(true);
    try {
      const duplicate = await isAccountDuplicate(trimmed);
      if (duplicate) {
        Alert.alert('', '중복된 이메일 계정이 있습니다.');
        setEmailChecked(false);
        return;
      }
      const num = await sendEmailAuthCode(trimmed);
      if (num == null) {
        Alert.alert('', '인증번호 발송에 실패했습니다.');
        return;
      }
      setAuthCode(num);
      setAuthVerified(false);
      setAuthInput('');
      setEmailChecked(true);
      Alert.alert('', '사용할 수 있는 이메일입니다. 해당 메일로 인증번호를 보냈습니다.');
    } catch {
      Alert.alert('', '다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyAuth = () => {
    if (String(authCode) === authInput.trim()) {
      setAuthVerified(true);
      Alert.alert('', '인증되었습니다.');
    } else {
      Alert.alert('', '인증 번호가 일치하지 않습니다.');
    }
  };

  const buildUserData = (): RegisterUserData => ({
    checkUsingPolicy: agreements.checkUsingPolicy,
    checkPersonalInfo: agreements.checkPersonalInfo,
    checkContentsRestrict: agreements.checkContentsRestrict,
    checkInfoToOthers: agreements.checkInfoToOthers,
    checkServiceNotifi: agreements.checkServiceNotifi,
    email: email.trim(),
    password: isSns ? '' : password,
    userNickname: nickname.trim(),
    userChurch: church.trim(),
    userSort,
    userDetail: userDetail.trim(),
    userURL: isSns ? snsData?.userURL ?? '' : 'email',
  });

  const handleRegister = async () => {
    if (!isSns && !emailChecked) {
      Alert.alert('', '이메일 중복확인을 해주세요.');
      return;
    }
    if (!isSns && !authVerified) {
      Alert.alert('', '이메일 인증을 완료해주세요.');
      return;
    }
    if (!isSns && password !== passwordConfirm) {
      Alert.alert('', '비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!email.trim() || !nickname.trim() || !church.trim() || !userSort) {
      Alert.alert('', '필수항목을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const ok = await submitRegister(buildUserData());
      if (ok) {
        Alert.alert('', '가입이 완료되었습니다. 다시 로그인 해주세요.', [
          { text: '확인', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('', '가입에 실패했습니다. 다시 시도해주세요.');
      }
    } catch {
      Alert.alert('', '다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabel = isSns ? 'SNS가입' : '이메일가입';

  return (
    <LoginKeyboardScreen withGlow={false}>
        <View style={styles.screen}>
          <Pressable
            style={styles.backRow}
            onPress={() => (tab === 2 ? setTab(1) : navigation.goBack())}
            hitSlop={8}>
            <MaterialIcons name="chevron-left" size={28} color={c.text} />
            <Text style={styles.backText}>{tab === 2 ? '이전' : '뒤로'}</Text>
          </Pressable>

          <Text style={styles.heroTitle}>회원가입</Text>
          <Text style={styles.heroSubtitle}>
            {tab === 1 ? '서비스 약관에 동의를 해주세요.' : '다음 정보를 입력해주세요.'}
          </Text>

          <View style={styles.steps}>
            <Text style={styles.stepMuted}>{stepLabel}</Text>
            <MaterialIcons name="chevron-right" size={18} color="#94a3b8" />
            <Text style={[tab === 1 ? styles.stepActive : styles.stepMuted]}>동의</Text>
            <MaterialIcons name="chevron-right" size={18} color="#94a3b8" />
            <Text style={[tab === 2 ? styles.stepActive : styles.stepMuted]}>정보입력</Text>
          </View>

          {tab === 1 ? (
            <View style={styles.card}>
              <Pressable style={styles.checkPress} onPress={toggleAll}>
                <MaterialIcons
                  name={allAgreed ? 'check-circle' : 'radio-button-unchecked'}
                  size={24}
                  color={allAgreed ? c.text : '#d1d5db'}
                />
                <Text style={styles.checkAllLabel}>모두 동의 합니다.</Text>
              </Pressable>

              <View style={styles.divider} />

              {AGREEMENT_ITEMS.map(item => (
                <CheckRow
                  key={item.key}
                  checked={agreements[item.key]}
                  label={item.label}
                  link={item.link}
                  onToggle={() => toggleOne(item.key)}
                />
              ))}

              <Pressable
                style={[
                  styles.primaryBtn,
                  !requiredAgreed && styles.primaryBtnDisabled,
                ]}
                disabled={!requiredAgreed || submitting}
                onPress={() => setTab(2)}>
                <Text style={styles.primaryBtnText}>다음</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>필수항목</Text>

              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <Text style={styles.fieldLabel}>
                    이메일주소 <Text style={styles.required}>*</Text>
                  </Text>
                  {!isSns && email.length > 0 ? (
                    <MaterialIcons
                      name={emailChecked ? 'check-circle' : 'error-outline'}
                      size={20}
                      color={emailChecked ? '#22c55e' : '#ef4444'}
                    />
                  ) : null}
                  {!isSns ? (
                    <Pressable style={styles.smallBtn} onPress={() => void handleCheckEmail()}>
                      <Text style={styles.smallBtnText}>중복확인</Text>
                    </Pressable>
                  ) : null}
                </View>
                <TextInput
                  style={[styles.input, isSns && styles.inputDisabled]}
                  value={email}
                  editable={!isSns && !submitting}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={scrollInputIntoView}
                  onChangeText={v => {
                    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(v)) {
                      Alert.alert('', '한글은 입력할 수 없습니다.');
                      return;
                    }
                    setEmail(v);
                    setEmailChecked(false);
                    setAuthVerified(false);
                  }}
                />
              </View>

              {!isSns && emailChecked ? (
                <View style={styles.field}>
                  <View style={styles.fieldHeader}>
                    <Text style={styles.fieldLabel}>
                      이메일 인증 <Text style={styles.required}>*</Text>
                    </Text>
                    <MaterialIcons
                      name={authVerified ? 'check-circle' : 'error-outline'}
                      size={20}
                      color={authVerified ? '#22c55e' : '#ef4444'}
                    />
                    <Pressable style={styles.smallBtn} onPress={handleVerifyAuth}>
                      <Text style={styles.smallBtnText}>인증하기</Text>
                    </Pressable>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={authInput}
                    keyboardType="number-pad"
                    onFocus={scrollInputIntoView}
                    onChangeText={v => {
                      if (!/^[0-9]*$/.test(v)) return;
                      setAuthInput(v);
                    }}
                  />
                </View>
              ) : null}

              {!isSns ? (
                <>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>
                      비밀번호 <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      secureTextEntry
                      onFocus={scrollInputIntoView}
                      onChangeText={setPassword}
                    />
                  </View>
                  <View style={styles.field}>
                    <View style={styles.fieldHeader}>
                      <Text style={styles.fieldLabel}>비밀번호확인</Text>
                      {password && passwordConfirm ? (
                        <MaterialIcons
                          name={password === passwordConfirm ? 'check-circle' : 'error-outline'}
                          size={20}
                          color={password === passwordConfirm ? '#22c55e' : '#ef4444'}
                        />
                      ) : null}
                    </View>
                    <TextInput
                      style={styles.input}
                      value={passwordConfirm}
                      secureTextEntry
                      onFocus={scrollInputIntoView}
                      onChangeText={setPasswordConfirm}
                    />
                  </View>
                </>
              ) : null}

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  닉네임 <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={nickname}
                  onFocus={scrollInputIntoView}
                  onChangeText={setNickname}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  교회명 <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={church}
                  onFocus={scrollInputIntoView}
                  onChangeText={setChurch}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  직분이 무엇인가요? <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.sortRow}>
                  <Pressable
                    style={[styles.sortChip, userSort === '교역자' && styles.sortChipOn]}
                    onPress={() => setUserSort('교역자')}>
                    <Text
                      style={[
                        styles.sortChipText,
                        userSort === '교역자' && styles.sortChipTextOn,
                      ]}>
                      교역자
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.sortChip, userSort === '성도' && styles.sortChipOn]}
                    onPress={() => setUserSort('성도')}>
                    <Text
                      style={[styles.sortChipText, userSort === '성도' && styles.sortChipTextOn]}>
                      일반성도
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>이용하시고자 하시는 서비스가 무엇인가요?</Text>
                <TextInput
                  style={styles.input}
                  value={userDetail}
                  onFocus={scrollInputIntoView}
                  onChangeText={setUserDetail}
                />
              </View>

              <Pressable
                style={[
                  styles.primaryBtn,
                  (!email.trim() || !nickname.trim() || !church.trim() || !userSort) &&
                    styles.primaryBtnDisabled,
                ]}
                disabled={
                  submitting ||
                  !email.trim() ||
                  !nickname.trim() ||
                  !church.trim() ||
                  !userSort
                }
                onPress={() => void handleRegister()}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>회원가입</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
    </LoginKeyboardScreen>
  );
}

const styles = StyleSheet.create({
  screen: { maxWidth: 430, width: '100%', alignSelf: 'center' },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 16, fontWeight: '700', color: c.text },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: c.text,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    marginTop: 8,
    marginBottom: 14,
    fontSize: 14,
    color: c.textMuted,
    textAlign: 'center',
  },
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
    gap: 12,
  },
  divider: { height: 1, backgroundColor: '#e8eef7', marginVertical: 4 },
  checkPress: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkIcon: { marginTop: 1 },
  checkAllLabel: { fontSize: 15, fontWeight: '800', color: c.text, flexShrink: 1 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
  },
  checkLabel: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    color: c.textMuted,
    lineHeight: 20,
  },
  policyLinkBtn: {
    flexShrink: 0,
    paddingTop: 2,
    paddingLeft: 4,
  },
  policyLink: { fontSize: 13, fontWeight: '700', color: c.primary },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: c.text, marginBottom: 4 },
  field: { gap: 8 },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: c.text },
  required: { color: '#ef4444' },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: c.text,
    backgroundColor: '#fff',
  },
  inputDisabled: { backgroundColor: '#f3f4f6', color: c.textMuted },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
  },
  smallBtnText: { fontSize: 12, fontWeight: '800', color: c.primary },
  sortRow: { flexDirection: 'row', gap: 10 },
  sortChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: c.border,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  sortChipOn: { borderColor: c.primary, backgroundColor: '#eef4ff' },
  sortChipText: { fontSize: 14, fontWeight: '700', color: c.textMuted },
  sortChipTextOn: { color: c.primary },
  primaryBtn: {
    marginTop: 8,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#33383f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { backgroundColor: '#bfbfbf' },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
