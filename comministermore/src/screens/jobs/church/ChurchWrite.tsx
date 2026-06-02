import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import axios from 'axios';
import { MAIN_API_BASE } from '../../../config/api';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');

type Props = {
  onBack: () => void;
  onSuccess?: () => void;
};

function pad2(n: number) {
  const s = String(n);
  return s.length > 1 ? s : `0${s}`;
}

function todayYmd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

export function ChurchWrite({ onBack, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const [userAccount, setUserAccount] = useState('');
  const [writer, setWriter] = useState('');
  const [title, setTitle] = useState('');

  const [church, setChurch] = useState('');
  const [religiousbody, setReligiousbody] = useState('');
  const [location, setLocation] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [address, setAddress] = useState('');
  const [mainpastor, setMainpastor] = useState('');
  const [homepage, setHomepage] = useState('');
  const [sort, setSort] = useState('');
  const [recruitNum, setRecruitNum] = useState('');
  const [applyhow, setApplyhow] = useState('');
  const [etcNotice, setEtcNotice] = useState('');
  const [customInput, setCustomInput] = useState('');

  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');

  const inquiry = useMemo(
    () => ({ inquiryName, email: inquiryEmail, phone: inquiryPhone }),
    [inquiryEmail, inquiryName, inquiryPhone],
  );

  const registerPost = async () => {
    if (submitting) return;
    if (!title.trim() || !church.trim()) {
      Alert.alert('', '제목과 교회명을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      const params = {
        userAccount,
        title,
        source: '사역자모아',
        writer,
        date: todayYmd(),
        church,
        religiousbody,
        location,
        locationDetail,
        address,
        mainpastor,
        homepage,
        school: JSON.stringify([{ sort: '전임', content: '' }]),
        career: JSON.stringify([{ sort: '전임', content: '' }]),
        sort,
        recruitNum,
        applydoc: JSON.stringify([{ sort: '전임', content: '' }]),
        applyhow,
        applytime: JSON.stringify({ startDay: '', endDay: '', daySort: '' }),
        etcNotice,
        inquiry: JSON.stringify(inquiry),
        churchLogo: '',
        customInput,
      };

      const res = await axios.post(`${API_BASE}/recruitchurch/postsrecruit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params,
      });

      if (res.data?.success || res.data) {
        Alert.alert('', '등록이 완료되었습니다.');
        onSuccess?.();
        onBack();
      } else {
        Alert.alert('', '등록에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch {
      Alert.alert('', '등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Text style={styles.headerBtnText}>목록</Text>
        </Pressable>
        <Text style={styles.headerTitle}>공고등록</Text>
        <Pressable
          style={[styles.headerBtn, submitting && styles.headerBtnDisabled]}
          onPress={registerPost}
          disabled={submitting}>
          <Text style={styles.headerBtnText}>{submitting ? '등록중' : '등록'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="userAccount(선택)" value={userAccount} onChangeText={setUserAccount} />
        <Field label="작성자(선택)" value={writer} onChangeText={setWriter} />
        <Field label="제목*" value={title} onChangeText={setTitle} />
        <Field label="교회명*" value={church} onChangeText={setChurch} />
        <Field label="교단" value={religiousbody} onChangeText={setReligiousbody} />
        <Field label="지역" value={location} onChangeText={setLocation} />
        <Field label="지역 상세" value={locationDetail} onChangeText={setLocationDetail} />
        <Field label="주소" value={address} onChangeText={setAddress} />
        <Field label="담임목사" value={mainpastor} onChangeText={setMainpastor} />
        <Field label="홈페이지" value={homepage} onChangeText={setHomepage} />
        <Field label="직무(sort)" value={sort} onChangeText={setSort} />
        <Field label="모집인원" value={recruitNum} onChangeText={setRecruitNum} />
        <Field label="지원방법" value={applyhow} onChangeText={setApplyhow} />

        <Text style={styles.sectionTitle}>문의</Text>
        <Field label="이름" value={inquiryName} onChangeText={setInquiryName} />
        <Field label="이메일" value={inquiryEmail} onChangeText={setInquiryEmail} />
        <Field label="전화번호" value={inquiryPhone} onChangeText={setInquiryPhone} />

        <Text style={styles.sectionTitle}>기타/상세</Text>
        <MultilineField label="기타사항" value={etcNotice} onChangeText={setEtcNotice} />
        <MultilineField label="상세내용(HTML/텍스트)" value={customInput} onChangeText={setCustomInput} />
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} />
    </View>
  );
}

function MultilineField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        multiline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 56,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#111827',
    minWidth: 64,
    alignItems: 'center',
  },
  headerBtnDisabled: { opacity: 0.6 },
  headerBtnText: { color: '#fff', fontWeight: '700' },
  content: { padding: 14, paddingBottom: 24, gap: 12 },
  sectionTitle: { marginTop: 8, fontSize: 15, fontWeight: '700', color: '#111827' },
  field: { gap: 6 },
  label: { fontSize: 13, color: '#374151', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
});

