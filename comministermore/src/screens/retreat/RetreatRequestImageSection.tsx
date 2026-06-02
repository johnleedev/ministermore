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
import {
  moveRetreatRequestImage,
  pickRetreatRequestImages,
  type RetreatRequestImage,
} from './retreatRequestImages';
import { retreatColors } from './retreatShared';

type Props = {
  images: RetreatRequestImage[];
  onChange: (images: RetreatRequestImage[]) => void;
};

export function RetreatRequestImageSection({ images, onChange }: Props) {
  const [picking, setPicking] = useState(false);

  const handlePick = async (replace: boolean) => {
    setPicking(true);
    try {
      const { images: picked, cancelled } = await pickRetreatRequestImages();
      if (cancelled || picked.length === 0) return;
      onChange(replace ? picked : [...images, ...picked]);
    } catch {
      Alert.alert('', '사진을 불러오지 못했습니다.');
    } finally {
      setPicking(false);
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    onChange(moveRetreatRequestImage(images, index, direction));
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>사진 첨부</Text>
      <View style={styles.btnRow}>
        <Pressable
          style={styles.pickBtn}
          disabled={picking}
          onPress={() => void handlePick(images.length === 0)}>
          {picking ? (
            <ActivityIndicator color={retreatColors.primary} />
          ) : (
            <Text style={styles.pickBtnText}>
              {images.length === 0 ? '+ 사진 첨부하기' : '+ 사진 추가하기'}
            </Text>
          )}
        </Pressable>
        {images.length > 0 ? (
          <Pressable
            style={[styles.pickBtn, styles.pickBtnSecondary]}
            disabled={picking}
            onPress={() => void handlePick(true)}>
            <Text style={styles.pickBtnTextSecondary}>다시 선택하기</Text>
          </Pressable>
        ) : null}
      </View>

      {images.length > 1 ? (
        <Text style={styles.hint}>▲▼ 버튼으로 사진 순서를 변경할 수 있습니다. 첫 번째 사진이 대표 이미지입니다.</Text>
      ) : null}

      {images.length > 0 ? (
        <View style={styles.grid}>
          {images.map((item, index) => (
            <View key={`${item.name}-${index}`} style={styles.card}>
              <Image source={{ uri: item.uri }} style={styles.preview} resizeMode="cover" />
              {images.length > 1 ? (
                <View style={styles.orderRow}>
                  <Pressable
                    style={[styles.orderBtn, index === 0 && styles.orderBtnDisabled]}
                    disabled={index === 0}
                    onPress={() => moveImage(index, 'up')}>
                    <MaterialIcons name="keyboard-arrow-up" size={18} color="#334155" />
                  </Pressable>
                  <Pressable
                    style={[styles.orderBtn, index === images.length - 1 && styles.orderBtnDisabled]}
                    disabled={index === images.length - 1}
                    onPress={() => moveImage(index, 'down')}>
                    <MaterialIcons name="keyboard-arrow-down" size={18} color="#334155" />
                  </Pressable>
                </View>
              ) : null}
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Pressable style={styles.removeBtn} onPress={() => removeImage(index)}>
                <MaterialIcons name="cancel" size={20} color="#E53935" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, marginBottom: 8 },
  label: { fontSize: 15, fontWeight: '600', color: retreatColors.text, marginBottom: 12 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pickBtn: {
    minWidth: 140,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#BDBDBD',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  pickBtnSecondary: {
    borderStyle: 'solid',
    borderColor: retreatColors.border,
  },
  pickBtnText: { fontSize: 14, fontWeight: '600', color: '#333' },
  pickBtnTextSecondary: { fontSize: 14, fontWeight: '600', color: retreatColors.textMuted },
  hint: { fontSize: 12, color: retreatColors.textMuted, marginBottom: 10, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: 108,
    borderWidth: 1,
    borderColor: retreatColors.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  preview: { width: '100%', height: 88, backgroundColor: '#f3f4f6' },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 4,
  },
  orderBtn: {
    padding: 2,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  orderBtnDisabled: { opacity: 0.35 },
  name: { fontSize: 10, color: retreatColors.textMuted, paddingHorizontal: 6, paddingVertical: 4 },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
  },
});
