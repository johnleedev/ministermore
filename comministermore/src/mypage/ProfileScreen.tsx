import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSetAtom } from 'jotai';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  clearSession,
  loadSessionUser,
  updateSessionUser,
} from '../login/sessionStorage';
import { isLoggedInAtom } from '../state/atoms';
import {
  changeProfile,
  changeProfilePassword,
  deleteAccount,
  fetchUserProfile,
  formatJoinPath,
  type UserProfile,
} from './mypageApi';
import { SubStackScreenShell } from '../navigation/SubStackScreenShell';
import { PrimaryButton, mpScreenContentStyle } from '../screens/shared/mypageUi';
import { mpColors } from '../screens/shared/mypageTheme';
import { useScrollViewScrollToTop } from '../screens/shared/listScrollUi';

const DELETE_NOTICES = [
  '회원 탈퇴 시, 즉시 탈퇴 처리되며, 서비스 이용이 불가합니다.',
  '기존에 작성한 게시물 및 댓글은 자동으로 삭제되지 않습니다. 탈퇴 이후에는 작성자 본인을 확인할 수 없으므로, 모든 게시물의 권한은 전적으로 운영진에게 위임됩니다.',
  '회원 정보는 탈퇴 즉시 삭제되지만, 부정 이용 거래 방지 및 전법에 따라 보관이 필요할 경우 해당 기간 동안 회원 정보가 보관될 수 있습니다.',
];

function ProfileField({
  label,
  value,
  editable,
  onChangeText,
  secure,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChangeText?: (v: string) => void;
  secure?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editable ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          placeholderTextColor="#9ca3af"
        />
      ) : (
        <Text style={styles.fieldValue}>{value || '-'}</Text>
      )}
    </View>
  );
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);
  const { scrollRef, onScroll } = useScrollViewScrollToTop();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [userNickName, setUserNickName] = useState('');
  const [userSort, setUserSort] = useState('');
  const [userDetail, setUserDetail] = useState('');

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordChange, setPasswordChange] = useState('');

  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [agreeDelete, setAgreeDelete] = useState(false);

  const isEmailAccount = profile?.userURL === 'email';

  const applyProfileToForm = (p: UserProfile) => {
    setProfile(p);
    setUserNickName(p.userNickName);
    setUserSort(p.userSort);
    setUserDetail(p.userDetail);
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const session = await loadSessionUser();
      if (!session?.userAccount) {
        setProfile(null);
        return;
      }
      const fetched = await fetchUserProfile(session.userAccount);
      if (fetched) {
        applyProfileToForm(fetched);
      } else {
        applyProfileToForm({
          grade: session.grade,
          userAccount: session.userAccount,
          userNickName: session.userNickName,
          userSort: session.userSort,
          userDetail: session.userDetail,
          userURL: '',
        });
      }
    } catch {
      Alert.alert('', '프로필을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const handleSaveProfile = async () => {
    if (!profile?.userAccount) return;
    if (!userNickName.trim()) {
      Alert.alert('', '닉네임을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const ok = await changeProfile({
        userAccount: profile.userAccount,
        userNickName: userNickName.trim(),
        userSort: userSort.trim(),
        userDetail: userDetail.trim(),
      });
      if (!ok) {
        Alert.alert('', '수정에 실패했습니다. 다시 시도해주세요.');
        return;
      }
      await updateSessionUser({
        userNickName: userNickName.trim(),
        userSort: userSort.trim(),
        userDetail: userDetail.trim(),
      });
      Alert.alert('', '수정되었습니다.');
      setMode('view');
      setShowPasswordForm(false);
      setShowDeleteForm(false);
      await loadProfile();
    } catch {
      Alert.alert('', '다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!profile?.userAccount) return;
    if (!passwordCurrent || !passwordChange) {
      Alert.alert('', '비밀번호를 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const result = await changeProfilePassword({
        userAccount: profile.userAccount,
        userNickName: userNickName.trim(),
        passwordCurrent,
        passwordChange,
      });
      if (result.ok) {
        Alert.alert('', '비밀번호가 변경되었습니다.');
        setPasswordCurrent('');
        setPasswordChange('');
        setShowPasswordForm(false);
      } else {
        Alert.alert('', result.message);
      }
    } catch {
      Alert.alert('', '다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile?.userAccount) return;
    if (!agreeDelete) {
      Alert.alert('', '유의사항 확인에 체크해주세요.');
      return;
    }
    Alert.alert('회원 탈퇴', '정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '탈퇴하기',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            const ok = await deleteAccount(profile.userAccount);
            if (!ok) {
              Alert.alert('', '탈퇴에 실패했습니다. 다시 시도해주세요.');
              return;
            }
            await clearSession();
            setIsLoggedIn(false);
            Alert.alert('', '탈퇴되었습니다.');
          } catch {
            Alert.alert('', '다시 시도해주세요.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const enterEdit = () => {
    if (profile) {
      setUserNickName(profile.userNickName);
      setUserSort(profile.userSort);
      setUserDetail(profile.userDetail);
    }
    setShowPasswordForm(false);
    setShowDeleteForm(false);
    setAgreeDelete(false);
    setMode('edit');
  };

  if (loading) {
    return (
      <SubStackScreenShell title="프로필 수정">
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={mpColors.primary} />
        </View>
      </SubStackScreenShell>
    );
  }

  return (
    <SubStackScreenShell title="프로필 수정">
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
        contentContainerStyle={mpScreenContentStyle(24 + insets.bottom)}
        keyboardShouldPersistTaps="handled">
      {mode === 'view' ? (
        <>
          <View style={styles.card}>
            <ProfileField label="계정" value={profile?.userAccount ?? ''} />
            <ProfileField label="닉네임" value={profile?.userNickName ?? ''} />
            <ProfileField label="직분" value={profile?.userSort ?? ''} />
            <ProfileField label="상세" value={profile?.userDetail ?? ''} />
            <ProfileField label="가입경로" value={formatJoinPath(profile?.userURL ?? '')} />
            {profile?.grade ? (
              <ProfileField label="등급" value={profile.grade} />
            ) : null}
          </View>
          <PrimaryButton label="프로필 수정하기" onPress={enterEdit} style={styles.mt16} />
        </>
      ) : (
        <>
          <View style={styles.card}>
            <ProfileField label="계정" value={profile?.userAccount ?? ''} />
            <ProfileField
              label="닉네임"
              value={userNickName}
              editable
              onChangeText={setUserNickName}
            />
            <ProfileField label="직분" value={userSort} editable onChangeText={setUserSort} />
            <ProfileField label="상세" value={userDetail} editable onChangeText={setUserDetail} />
          </View>

          {isEmailAccount ? (
            <>
              <Pressable
                style={styles.standaloneOutlineBtn}
                onPress={() => setShowPasswordForm(v => !v)}>
                <Text style={styles.actionBtnSecondaryText}>비밀번호 변경</Text>
              </Pressable>
              {showPasswordForm ? (
                <View style={styles.card}>
                  <ProfileField
                    label="현재 비밀번호"
                    value={passwordCurrent}
                    editable
                    secure
                    onChangeText={setPasswordCurrent}
                  />
                  <ProfileField
                    label="변경할 비밀번호"
                    value={passwordChange}
                    editable
                    secure
                    onChangeText={setPasswordChange}
                  />
                  <PrimaryButton
                    label={saving ? '처리 중...' : '비밀번호 변경 완료'}
                    onPress={() => void handlePasswordChange()}
                    style={styles.mt12}
                  />
                </View>
              ) : null}
            </>
          ) : null}

          <View style={styles.rowBtns}>
            <Pressable
              style={[styles.actionBtnSecondary, styles.flex1]}
              onPress={() => {
                setMode('view');
                setShowPasswordForm(false);
                setShowDeleteForm(false);
              }}>
              <Text style={styles.actionBtnSecondaryText}>이전</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtnPrimary, styles.flex1, saving && styles.disabled]}
              disabled={saving}
              onPress={() => void handleSaveProfile()}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionBtnPrimaryText}>수정완료</Text>
              )}
            </Pressable>
          </View>

          {!showDeleteForm ? (
            <Pressable style={styles.deleteLink} onPress={() => setShowDeleteForm(true)}>
              <Text style={styles.deleteLinkText}>회원탈퇴</Text>
            </Pressable>
          ) : (
            <View style={styles.deleteBox}>
              <Text style={styles.deleteTitle}>
                탈퇴 시 모든 정보가 사라지며, 복구할 수 없습니다.
              </Text>
              <Text style={styles.deleteSubtitle}>* 유의 사항 안내</Text>
              {DELETE_NOTICES.map((line, i) => (
                <Text key={i} style={styles.deleteNotice}>
                  {i + 1}. {line}
                </Text>
              ))}
              <Pressable
                style={styles.checkRow}
                onPress={() => setAgreeDelete(v => !v)}>
                <View style={[styles.checkbox, agreeDelete && styles.checkboxOn]}>
                  {agreeDelete ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
                <Text style={styles.checkLabel}>유의사항을 확인했습니다.</Text>
              </Pressable>
              <View style={styles.rowBtns}>
                <Pressable
                  style={[styles.actionBtnSecondary, styles.flex1]}
                  onPress={() => {
                    setShowDeleteForm(false);
                    setAgreeDelete(false);
                  }}>
                  <Text style={styles.actionBtnSecondaryText}>취소</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.actionBtnDanger,
                    styles.flex1,
                    !agreeDelete && styles.actionBtnDangerDisabled,
                  ]}
                  disabled={!agreeDelete || saving}
                  onPress={() => void handleDeleteAccount()}>
                  <Text
                    style={[
                      styles.actionBtnDangerText,
                      !agreeDelete && styles.actionBtnDangerTextDisabled,
                    ]}>
                    탈퇴하기
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </>
      )}
      </ScrollView>
    </SubStackScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: mpColors.bg },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mpColors.bg,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: mpColors.border,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: mpColors.textMuted },
  fieldValue: { fontSize: 16, color: mpColors.text, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: mpColors.text,
    backgroundColor: '#fff',
  },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  rowBtns: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginTop: 16,
  },
  flex1: { flex: 1 },
  standaloneOutlineBtn: {
    marginTop: 16,
    height: 54,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#d1d9e6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  actionBtnSecondary: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#d1d9e6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  actionBtnSecondaryText: { fontSize: 16, fontWeight: '700', color: mpColors.textSecondary },
  actionBtnPrimary: {
    height: 54,
    borderRadius: 18,
    backgroundColor: mpColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: mpColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 2,
  },
  actionBtnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  actionBtnDanger: {
    height: 54,
    borderRadius: 18,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDangerDisabled: { backgroundColor: '#e5e7eb' },
  actionBtnDangerText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  actionBtnDangerTextDisabled: { color: '#9ca3af' },
  disabled: { opacity: 0.6 },
  deleteLink: { marginTop: 28, alignItems: 'center', paddingVertical: 12 },
  deleteLinkText: { fontSize: 14, fontWeight: '700', color: '#9ca3af', textDecorationLine: 'underline' },
  deleteBox: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
    gap: 10,
  },
  deleteTitle: { fontSize: 16, fontWeight: '800', color: '#991b1b', lineHeight: 24 },
  deleteSubtitle: { fontSize: 14, fontWeight: '700', color: '#b91c1c', marginTop: 4 },
  deleteNotice: { fontSize: 13, color: '#7f1d1d', lineHeight: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: mpColors.primary, borderColor: mpColors.primary },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '800' },
  checkLabel: { fontSize: 14, fontWeight: '600', color: mpColors.textSecondary },
});
