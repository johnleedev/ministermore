import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { CommunityBoardConfig } from './boardTypes';
import { API_BASE, ensureBoardLogin } from './boardShared';
import { boardColors } from './boardTheme';
import {
  formatPostDate,
  pickBoardPostImages,
  type BoardPostImage,
} from './boardPostImages';
import { useRetreatSession } from '../retreat/useRetreatSession';
import { PageHeader } from '../retreat/RetreatComponents';
import { retreatStyles } from '../retreat/retreatShared';
import { FormKeyboardScreen, useFormInputFocusScroll } from '../shared/FormKeyboardScreen';

const getPostRoute = (c: CommunityBoardConfig) => c.postRoute ?? `${c.routePrefix}post`;

export function BoardPostView({
  config,
  onBack,
  onSuccess,
}: {
  config: CommunityBoardConfig;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const session = useRetreatSession();
  const scrollInputIntoView = useFormInputFocusScroll();
  const hasRegion = Boolean(config.regionOptions?.length);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<BoardPostImage[]>([]);
  const [pickingImages, setPickingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePickImages = async (replace = false) => {
    const user = await ensureBoardLogin(session.isLoggedIn, session.user);
    if (!user) return;

    setPickingImages(true);
    try {
      const { images: picked, cancelled } = await pickBoardPostImages(user.userAccount);
      if (cancelled || picked.length === 0) return;
      setImages(prev => (replace ? picked : [...prev, ...picked]));
    } catch {
      Alert.alert('', '사진을 불러오지 못했습니다.');
    } finally {
      setPickingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const registerPost = async () => {
    if (!selectedCategory) {
      Alert.alert('', '구분을 선택해주세요.');
      return;
    }
    if (hasRegion && !selectedRegion) {
      Alert.alert('', '지역을 선택해주세요.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('', '제목을 작성해주세요.');
      return;
    }

    const user = await ensureBoardLogin(session.isLoggedIn, session.user);
    if (!user) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      const imageNames = images.map(item => item.name);
      images.forEach(item => {
        formData.append('img', {
          uri: item.uri,
          type: item.type,
          name: item.name,
        } as unknown as Blob);
      });

      const params: Record<string, string> = {
        title: title.trim(),
        content,
        date: formatPostDate(),
        sort: selectedCategory,
        userAccount: user.userAccount,
        userNickName: user.userNickName,
        postImage: JSON.stringify(imageNames),
      };
      if (hasRegion) params.region = selectedRegion;

      const res = await axios.post(`${API_BASE}/${config.apiBase}/${getPostRoute(config)}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params,
      });
      if (res.data) {
        Alert.alert('', '등록되었습니다.');
        onSuccess();
      } else {
        Alert.alert('', '등록에 실패했습니다.');
      }
    } catch {
      Alert.alert('', '등록에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormKeyboardScreen backgroundColor={boardColors.bg}>
      <PageHeader title={config.boardTitle} onBack={onBack} secondaryActionLabel="목록" onSecondaryAction={onBack} />

      <View style={retreatStyles.noticeBox}>
        <Text style={retreatStyles.noticeText}>
          장난스러운 글이나, 불건전하거나, 불법적인 내용 작성시, 경고 없이 곧바로 글은 삭제됩니다. 또한 사용자
          계정은 서비스 사용에 제한이 있을 수 있습니다.
        </Text>
        <Text style={[retreatStyles.noticeText, { marginTop: 8, color: '#0f386e' }]}>
          수련회 관련 글이나 등업관련 글은 수련회 게시판(상단 수련회 메뉴)을 사용해주세요.
        </Text>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={retreatStyles.formLabel}>구분 *</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {config.categoryOptions.map(item => (
            <Pressable
              key={item}
              style={[
                retreatStyles.regionTab,
                selectedCategory === item && retreatStyles.regionTabOn,
                { borderRadius: 8 },
              ]}
              onPress={() => setSelectedCategory(item)}>
              <Text
                style={[
                  retreatStyles.regionTabText,
                  selectedCategory === item && retreatStyles.regionTabTextOn,
                ]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {hasRegion && config.regionOptions ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={retreatStyles.formLabel}>지역 *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {config.regionOptions.map(item => (
              <Pressable
                key={item}
                style={[
                  retreatStyles.regionTab,
                  selectedRegion === item && retreatStyles.regionTabOn,
                  { borderRadius: 8 },
                ]}
                onPress={() => setSelectedRegion(item)}>
                <Text
                  style={[
                    retreatStyles.regionTabText,
                    selectedRegion === item && retreatStyles.regionTabTextOn,
                  ]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={retreatStyles.formField}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={retreatStyles.formLabel}>제목</Text>
          <Text style={{ fontSize: 12, color: '#888' }}>* 최대 200자</Text>
        </View>
        <TextInput
          style={retreatStyles.formInput}
          value={title}
          onChangeText={setTitle}
          maxLength={200}
          onFocus={scrollInputIntoView}
        />
      </View>

      <View style={retreatStyles.formField}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={retreatStyles.formLabel}>본문</Text>
          <Text style={{ fontSize: 12, color: '#888' }}>* 최대 2000자</Text>
        </View>
        <TextInput
          style={[retreatStyles.formTextarea, { minHeight: 160 }]}
          value={content}
          onChangeText={setContent}
          maxLength={2000}
          multiline
          onFocus={scrollInputIntoView}
        />
      </View>

      <Text style={{ marginTop: 8, marginBottom: 12, fontSize: 15, fontWeight: '600' }}>사진 첨부</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <Pressable
          style={postStyles.imagePickBtn}
          disabled={pickingImages}
          onPress={() => void handlePickImages(images.length === 0)}>
          {pickingImages ? (
            <ActivityIndicator color={boardColors.primary} />
          ) : (
            <Text style={postStyles.imagePickBtnText}>
              {images.length === 0 ? '+ 사진 첨부하기' : '+ 사진 추가하기'}
            </Text>
          )}
        </Pressable>
        {images.length > 0 ? (
          <Pressable
            style={[postStyles.imagePickBtn, postStyles.imagePickBtnSecondary]}
            disabled={pickingImages}
            onPress={() => void handlePickImages(true)}>
            <Text style={postStyles.imagePickBtnTextSecondary}>다시 선택하기</Text>
          </Pressable>
        ) : null}
      </View>

      {images.length > 0 ? (
        <View style={postStyles.imageGrid}>
          {images.map((item, index) => (
            <View key={`${item.name}-${index}`} style={postStyles.imageCard}>
              <Image source={{ uri: item.uri }} style={postStyles.imagePreview} resizeMode="cover" />
              <Text style={postStyles.imageName} numberOfLines={1}>
                {item.name}
              </Text>
              <Pressable style={postStyles.imageRemoveBtn} onPress={() => removeImage(index)}>
                <MaterialIcons name="cancel" size={20} color="#E53935" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        style={[retreatStyles.primaryBtn, { marginTop: 16, opacity: submitting ? 0.6 : 1 }]}
        disabled={submitting}
        onPress={() => void registerPost()}>
        <Text style={retreatStyles.primaryBtnText}>{submitting ? '등록 중...' : '작성 완료'}</Text>
      </Pressable>
    </FormKeyboardScreen>
  );
}

const postStyles = {
  imagePickBtn: {
    minWidth: 140,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: boardColors.card,
  },
  imagePickBtnSecondary: {
    borderStyle: 'solid' as const,
    borderColor: boardColors.border,
  },
  imagePickBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
  imagePickBtnTextSecondary: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: boardColors.textMuted,
  },
  imageGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 8,
  },
  imageCard: {
    width: 108,
    borderWidth: 1,
    borderColor: boardColors.border,
    borderRadius: 10,
    overflow: 'hidden' as const,
    backgroundColor: boardColors.card,
  },
  imagePreview: {
    width: '100%' as const,
    height: 88,
    backgroundColor: '#f3f4f6',
  },
  imageName: {
    fontSize: 10,
    color: boardColors.textMuted,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  imageRemoveBtn: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
  },
};
