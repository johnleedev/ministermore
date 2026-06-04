import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TargetedEvent,
} from 'react-native';
import { useAtomValue } from 'jotai';
import { loadSessionUser } from '../login/sessionStorage';
import { StackAppTopBar } from '../navigation/appTopBarHelpers';
import { FormKeyboardScreen, useFormInputFocusScroll } from '../screens/shared/FormKeyboardScreen';
import { PrimaryButton } from '../screens/shared/mypageUi';
import { mpColors } from '../screens/shared/mypageTheme';
import { isLoggedInAtom } from '../state/atoms';
import { INQUIRY_CATEGORIES, type InquiryCategory } from './inquiryConstants';
import { submitInquiry } from './mypageApi';

export function InquiryScreen() {
  const navigation = useNavigation();
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const [category, setCategory] = useState<InquiryCategory | ''>('');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollInputIntoView = useFormInputFocusScroll();

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert('', '문의 종류를 선택해주세요.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('', '문의 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const user = isLoggedIn ? await loadSessionUser() : null;
      const result = await submitInquiry({
        category,
        content: content.trim(),
        contact: contact.trim(),
        userAccount: user?.userAccount,
        userNickName: user?.userNickName,
        platform: 'app',
      });
      if (!result.success) {
        Alert.alert('', result.message || '문의 접수에 실패했습니다.');
        return;
      }
      Alert.alert('', '문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch {
      Alert.alert('', '문의 접수에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <FormKeyboardScreen backgroundColor={mpColors.bg} showFloatingTop={false}>
        <View style={styles.headerWrap}>
          <StackAppTopBar
            title="문의하기"
            onBack={() => navigation.goBack()}
            hideNotifiAction
            hideMypageAction
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.lead}>
            오류 신고, 기능 제안, 이용 문의 등을 남겨주시면 운영팀이 확인 후 답변드립니다.
          </Text>

          <Text style={styles.sectionLabel}>문의 종류</Text>
          <View style={styles.categoryRow}>
            {INQUIRY_CATEGORIES.map(item => {
              const selected = category === item;
              return (
                <Pressable
                  key={item}
                  style={[styles.categoryChip, selected && styles.categoryChipOn]}
                  onPress={() => setCategory(item)}>
                  <Text style={[styles.categoryChipText, selected && styles.categoryChipTextOn]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>문의 내용</Text>
          <View style={styles.textareaWrap}>
            <TextInput
              style={styles.textarea}
              value={content}
              onChangeText={setContent}
              placeholder="문의 내용을 입력해주세요."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              maxLength={5000}
              editable={!submitting}
              onFocus={scrollInputIntoView}
            />
            <Text style={styles.counter}>{content.length}/5000</Text>
          </View>

          <Text style={styles.sectionLabel}>연락받으실 연락처</Text>
          <View style={styles.contactWrap}>
            <TextInput
              style={styles.contactInput}
              value={contact}
              onChangeText={setContact}
              placeholder="전화번호나 메일"
              placeholderTextColor="#9ca3af"
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={100}
              editable={!submitting}
              onFocus={(e: NativeSyntheticEvent<TargetedEvent>) => scrollInputIntoView(e, 200)}
            />
          </View>

          <PrimaryButton
            label={submitting ? '접수 중...' : '문의 접수하기'}
            onPress={() => void handleSubmit()}
            style={styles.submitBtn}
          />
          {submitting ? <ActivityIndicator style={styles.spinner} color={mpColors.primary} /> : null}
        </View>
      </FormKeyboardScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: mpColors.bg },
  headerWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginHorizontal: -16,
    marginTop: -8,
    marginBottom: 8,
  },
  content: { paddingTop: 8, paddingBottom: 24 },
  lead: {
    fontSize: 14,
    lineHeight: 22,
    color: mpColors.textMuted,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: mpColors.textMuted,
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mpColors.chipBorder,
    backgroundColor: '#fff',
  },
  categoryChipOn: {
    backgroundColor: mpColors.primary,
    borderColor: mpColors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: mpColors.textSecondary,
  },
  categoryChipTextOn: {
    color: '#fff',
  },
  textareaWrap: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: mpColors.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  textarea: {
    minHeight: 180,
    fontSize: 15,
    lineHeight: 22,
    color: mpColors.text,
  },
  counter: {
    marginTop: 8,
    fontSize: 12,
    color: mpColors.textLight,
    textAlign: 'right',
  },
  contactWrap: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: mpColors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
  },
  contactInput: {
    minHeight: 48,
    fontSize: 15,
    color: mpColors.text,
  },
  submitBtn: { marginTop: 4 },
  spinner: { marginTop: 12 },
});
