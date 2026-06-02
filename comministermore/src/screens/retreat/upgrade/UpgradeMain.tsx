import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import axios from 'axios';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ListLoading, PageHeader, PaginationBar } from '../RetreatComponents';
import {
  FloatingScrollActions,
  LIST_FAB_SCROLL_PADDING_WITH_WRITE,
  useScrollViewScrollToTop,
} from '../../shared/listScrollUi';
import { RetreatCategoryTabs } from '../retreatCategoryContext';
import {
  API_BASE,
  formatRelativeDate,
  renderPreview,
  checkRetreatLogin,
  retreatColors,
  retreatStyles,
} from '../retreatShared';
import { useRetreatSession } from '../useRetreatSession';
import { UpgradeStack } from './UpgradeStack';
import type { UpgradeStackParamList } from './UpgradeStack';

type UpgradePost = {
  id: number;
  title: string;
  content: string;
  userAccount: string;
  userNickName: string;
  date: string;
  views: number;
};

export function UpgradeMain() {
  return <UpgradeStack />;
}

export function UpgradeListScreen() {
  const { scrollRef, onScroll, scrollToTop } = useScrollViewScrollToTop();
  const session = useRetreatSession();
  const navigation = useNavigation<NativeStackNavigationProp<UpgradeStackParamList, 'List'>>();
  const [currentPage, setCurrentPage] = useState(1);
  const [list, setList] = useState<UpgradePost[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  const fetchDatas = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/retreatupgrade/getposts/${currentPage}`);
      if (res.data) {
        setList(res.data.resultData || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch {
      setList([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useFocusEffect(
    useCallback(() => {
      void fetchDatas();
    }, [fetchDatas]),
  );

  const openWriteBox = async () => {
    if (!checkRetreatLogin(session.isLoggedIn)) return;
    try {
      const res = await axios.post(`${API_BASE}/retreatupgrade/checkisposting`, {
        userAccount: session.user?.userAccount ?? '',
      });
      if (res.data) {
        navigation.navigate('Write');
      } else {
        Alert.alert(
          '',
          '먼저 장소후기 게시글에 1개 이상의 댓글을 작성후에 등업신청을 하셔야, 등업이 완료됩니다.',
        );
      }
    } catch {
      Alert.alert('', '등업신청 가능 여부를 확인하지 못했습니다.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: retreatColors.bg }}>
      <RetreatCategoryTabs />
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: LIST_FAB_SCROLL_PADDING_WITH_WRITE }}
        keyboardShouldPersistTaps="handled">
        <PageHeader title="등업신청" />

        <View style={retreatStyles.noticeBox}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: retreatColors.text, marginBottom: 8 }}>
            등업 안내
          </Text>
          <Text style={retreatStyles.noticeText}>
            사이트 활성화 및 허위가입·악성 광고 차단을 위한 제도입니다.
          </Text>
          <Text style={[retreatStyles.noticeText, { marginTop: 10, fontWeight: '600' }]}># 등업신청 방법</Text>
          <Text style={retreatStyles.noticeText}>1. 장소후기 게시판에 게시글 1개 이상 작성</Text>
          <Text style={retreatStyles.noticeText}>2. 후기에 댓글 1개 이상 작성 후 등업 게시판에 신청</Text>
        </View>

        {isLoading ? (
          <ListLoading />
        ) : list.length > 0 ? (
          <View style={{ gap: 12 }}>
            {list.map(item => (
              <View
                key={item.id}
                style={{ padding: 16, borderWidth: 1, borderColor: '#e8ebef', borderRadius: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: '#888' }}>no. {item.id}</Text>
                  <Text style={{ fontSize: 13, color: '#888' }}>{formatRelativeDate(item.date)}</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{item.userNickName}</Text>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#222' }}>
                  {renderPreview(item.title)}
                </Text>
                <Text style={{ marginTop: 8, fontSize: 14, color: '#555', lineHeight: 22 }}>{item.content}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={retreatStyles.emptyText}>작성된 글이 없습니다.</Text>
        )}

        <PaginationBar currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
      </ScrollView>
      <FloatingScrollActions showTop={false} onScrollToTop={scrollToTop} onWrite={() => void openWriteBox()} />
    </View>
  );
}

export function UpgradeWriteScreen() {
  const session = useRetreatSession();
  const navigation = useNavigation<NativeStackNavigationProp<UpgradeStackParamList, 'Write'>>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const registerPost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('', '제목과 내용을 입력해주세요.');
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/retreatupgrade/posts`, {
        title: title.trim(),
        content: content.trim(),
        userAccount: session.user?.userAccount ?? '',
        userNickName: session.user?.userNickName ?? '',
        date: new Date().toISOString(),
      });
      if (res.data) {
        Alert.alert('', '등업신청이 완료되었습니다.');
        navigation.goBack();
      }
    } catch {
      Alert.alert('', '등록에 실패했습니다. 로그인 후 이용해 주세요.');
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: retreatColors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled">
      <PageHeader title="등업신청 작성" onBack={() => navigation.goBack()} />
      <Text style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
        간단한 가입인사와 등업신청 사유를 남겨주세요.
      </Text>
      <View style={retreatStyles.formField}>
        <Text style={retreatStyles.formLabel}>제목</Text>
        <TextInput
          style={retreatStyles.formInput}
          value={title}
          onChangeText={setTitle}
          maxLength={200}
          placeholder="예: 등업신청합니다."
        />
      </View>
      <View style={retreatStyles.formField}>
        <Text style={retreatStyles.formLabel}>내용</Text>
        <TextInput
          style={retreatStyles.formTextarea}
          value={content}
          onChangeText={setContent}
          maxLength={2000}
          multiline
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
        <Pressable style={retreatStyles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Text style={retreatStyles.secondaryBtnText}>취소</Text>
        </Pressable>
        <Pressable style={retreatStyles.primaryBtn} onPress={() => void registerPost()}>
          <Text style={retreatStyles.primaryBtnText}>등록</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
