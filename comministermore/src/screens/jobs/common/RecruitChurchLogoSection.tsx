import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { pickRecruitChurchLogo, type RecruitChurchLogo } from './recruitPostImages';
import { jobColors as c } from './jobsTheme';

type Props = {
  logo: RecruitChurchLogo | null;
  onChange: (logo: RecruitChurchLogo | null) => void;
  userAccount: string;
};

export function RecruitChurchLogoSection({ logo, onChange, userAccount }: Props) {
  const [picking, setPicking] = useState(false);

  const handlePick = async () => {
    setPicking(true);
    try {
      const { logo: picked, cancelled } = await pickRecruitChurchLogo(userAccount);
      if (cancelled) return;
      if (picked) onChange(picked);
    } catch {
      Alert.alert('', '사진을 불러오지 못했습니다.');
    } finally {
      setPicking(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>교회로고</Text>
      <Text style={styles.hint}>JPG, PNG, JPEG 파일만 가능합니다.</Text>
      {logo ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: logo.uri }} style={styles.preview} resizeMode="cover" />
          <Text style={styles.name} numberOfLines={1}>
            {logo.name}
          </Text>
          <View style={styles.btnRow}>
            <Pressable style={styles.secondaryBtn} disabled={picking} onPress={() => void handlePick()}>
              <Text style={styles.secondaryBtnText}>다시 선택</Text>
            </Pressable>
            <Pressable style={styles.removeBtn} onPress={() => onChange(null)}>
              <MaterialIcons name="cancel" size={20} color="#E53935" />
              <Text style={styles.removeText}>삭제</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.pickBtn} disabled={picking} onPress={() => void handlePick()}>
          {picking ? (
            <ActivityIndicator color={c.primary} />
          ) : (
            <Text style={styles.pickBtnText}>+ 사진첨부하기</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  label: { fontSize: 15, fontWeight: '600', color: c.text, marginBottom: 4 },
  hint: { fontSize: 12, color: c.textMuted, marginBottom: 10 },
  pickBtn: {
    paddingVertical: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#BDBDBD',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pickBtnText: { fontSize: 14, fontWeight: '600', color: '#333' },
  previewWrap: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
  },
  preview: { width: '100%', height: 120, borderRadius: 8, backgroundColor: '#f3f4f6' },
  name: { fontSize: 11, color: c.textMuted, marginTop: 6 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  secondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  removeText: { fontSize: 13, color: '#E53935', fontWeight: '600' },
});
