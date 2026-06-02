import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  ListLoading,
  PageHeader,
  PaginationBar,
} from '../RetreatComponents';
import {
  FloatingScrollActions,
  LIST_FAB_SCROLL_PADDING,
  LIST_FAB_SCROLL_PADDING_WITH_WRITE,
  useListScrollToTop,
  useScrollViewScrollToTop,
} from '../../shared/listScrollUi';
import { RetreatCategoryTabs } from '../retreatCategoryContext';
import {
  API_BASE,
  formatRelativeDate,
  openRetreatOnWeb,
  parseImageList,
  renderPreview,
  checkRetreatLogin,
  retreatColors,
  retreatGridColumnStyle,
  retreatStyles,
} from '../retreatShared';
import { useRetreatSession } from '../useRetreatSession';
import { ReviewStack } from './ReviewStack';
import { DetailPressableImage } from '../../shared/ImagePreviewModal';

type ReviewPost = {
  id: number;
  title: string;
  content: string;
  userAccount: string;
  userNickName: string;
  date: string;
  views: number;
  commentCount?: number;
  images: string | null;
};

type ReviewComment = {
  id: number;
  post_id: number;
  content: string;
  userAccount: string;
  userNickName: string;
  date: string;
};

const REVIEW_PLACEHOLDER = `수련회명 :

날짜 :

수련회장소 :

내용 :
`;

export function ReviewMain() {
  return <ReviewStack />;
}

export function ReviewListView({
  onOpenDetail,
  onOpenPost,
}: {
  onOpenDetail: (id: number) => void;
  onOpenPost: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [list, setList] = useState<ReviewPost[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  const fetchDatas = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/retreatreview/getposts/${currentPage}`);
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

  useEffect(() => {
    void fetchDatas();
  }, [fetchDatas]);

  const openPostDetails = async (post: ReviewPost) => {
    try {
      await axios.post(`${API_BASE}/retreatreview/postsviews`, { postId: post.id });
    } catch { /* ignore */ }
    onOpenDetail(post.id);
  };

  const renderReviewCard = ({ item }: { item: ReviewPost }) => {
    const images = parseImageList(item.images);
    const firstImage = images[0];
    return (
      <Pressable style={reviewCardStyles.card} onPress={() => void openPostDetails(item)}>
        <View style={reviewCardStyles.imgWrap}>
          {firstImage ? (
            <Image
              source={{ uri: `${API_BASE}/images/retreat/postimage/${firstImage}` }}
              style={reviewCardStyles.img}
              resizeMode="cover"
            />
          ) : (
            <View style={reviewCardStyles.imgPlaceholder}>
              <Text style={reviewCardStyles.noImageText}>등록된 사진이 없습니다.</Text>
            </View>
          )}
        </View>
        <View style={reviewCardStyles.body}>
          <Text style={reviewCardStyles.title} numberOfLines={2}>
            {renderPreview(item.title)}
            {item.commentCount ? ` [${item.commentCount}]` : ''}
          </Text>
          <Text style={reviewCardStyles.content} numberOfLines={2}>
            {renderPreview(item.content)}
          </Text>
          <View style={reviewCardStyles.metaRow}>
            <Meta icon="edit" text={item.userNickName} compact />
            <Meta icon="schedule" text={formatRelativeDate(item.date)} compact />
            <Meta icon="visibility" text={String(item.views)} compact />
          </View>
        </View>
      </Pressable>
    );
  };

  const listHeader = (
    <>
      <PageHeader title="장소후기" />
      <View style={retreatStyles.noticeBox}>
        <Text style={retreatStyles.noticeText}>수련회 장소 이용 후기를 공유해 주세요.</Text>
      </View>
    </>
  );

  const { listRef, showTopBtn, onScroll, scrollToTop } = useListScrollToTop<ReviewPost>();

  return (
    <View style={listStyles.root}>
      <RetreatCategoryTabs />
      <FlatList
        ref={listRef}
        style={listStyles.list}
        contentContainerStyle={[
          listStyles.content,
          { paddingBottom: LIST_FAB_SCROLL_PADDING_WITH_WRITE },
        ]}
        data={list}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        columnWrapperStyle={list.length > 0 ? retreatGridColumnStyle : undefined}
        renderItem={renderReviewCard}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          isLoading ? (
            <ListLoading />
          ) : (
            <Text style={retreatStyles.emptyText}>작성된 글이 없습니다.</Text>
          )
        }
        ListFooterComponent={
          <PaginationBar currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
      <FloatingScrollActions
        showTop={showTopBtn}
        onScrollToTop={scrollToTop}
        onWrite={onOpenPost}
      />
    </View>
  );
}

function Meta({ icon, text, compact }: { icon: string; text: string; compact?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
      <MaterialIcons name={icon} size={compact ? 11 : 14} color="#325382" />
      <Text style={{ fontSize: compact ? 11 : 13, color: '#555' }} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

export function ReviewDetailView({ id, onBack }: { id: number; onBack: () => void }) {
  const { scrollRef, showTopBtn, onScroll, scrollToTop } = useScrollViewScrollToTop();
  const session = useRetreatSession();
  const [post, setPost] = useState<ReviewPost | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [inputComments, setInputComments] = useState('');
  const [isLikedLength, setIsLikedLength] = useState(0);
  const [checkIsLiked, setCheckIsLiked] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const images = parseImageList(post?.images);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/retreatreview/getpost/${id}`);
        if (!cancelled && res.data) setPost(res.data);

        const resComment = await axios.get(`${API_BASE}/retreatreview/getallcomments/${id}`);
        if (!cancelled) setComments(resComment.data ? [...resComment.data].reverse() : []);

        const resLiked = await axios.get(`${API_BASE}/retreatreview/getisliked/${id}`);
        if (!cancelled && resLiked.data) {
          setIsLikedLength(resLiked.data.length);
          setCheckIsLiked(false);
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [id, refresh]);

  const registerComment = async () => {
    if (!checkRetreatLogin(session.isLoggedIn)) return;
    if (!inputComments.trim()) {
      Alert.alert('', '댓글을 입력해주세요.');
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/retreatreview/commentsinput`, {
        postId: id,
        commentText: inputComments.trim(),
        date: new Date().toISOString().slice(0, 10),
        userAccount: session.user?.userAccount ?? '',
        userNickName: session.user?.userNickName ?? '',
      });
      if (res.data) {
        setInputComments('');
        setRefresh(r => !r);
        Alert.alert('', '입력되었습니다.');
      }
    } catch {
      Alert.alert('', '댓글 등록에 실패했습니다. 로그인 후 이용해 주세요.');
    }
  };

  if (!post) {
    return (
      <View style={{ flex: 1, padding: 14 }}>
        <PageHeader title="장소후기" onBack={onBack} />
        <ListLoading />
      </View>
    );
  }

  return (
    <View style={detailStyles.detailRoot}>
      <ScrollView
        ref={scrollRef}
        style={detailStyles.detailScroll}
        contentContainerStyle={[detailStyles.detailContent, { paddingBottom: LIST_FAB_SCROLL_PADDING }]}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}>
      <PageHeader title={renderPreview(post.title, 30)} onBack={onBack} secondaryActionLabel="목록" onSecondaryAction={onBack} />

      <View style={{ borderTopWidth: 2, borderTopColor: '#33383f', paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e8ebef' }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#222' }}>{post.title}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
          <Meta icon="schedule" text={formatRelativeDate(post.date)} />
          <Meta icon="visibility" text={String(post.views)} />
          <Meta icon="thumb-up" text={String(isLikedLength)} />
        </View>
      </View>

      {images.length > 0 ? (
        <View style={detailStyles.imageListWrap}>
          {images.map((img, idx) => (
            <DetailPressableImage
              key={`${img}-${idx}`}
              uri={`${API_BASE}/images/retreat/postimage/${img}`}
              style={detailStyles.detailImage}
            />
          ))}
        </View>
      ) : null}

      <View style={{ paddingVertical: 20 }}>
        <Text style={{ fontSize: 16, lineHeight: 26, color: '#333' }}>{post.content}</Text>

        <Pressable
          style={{
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 24,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 22,
            borderWidth: checkIsLiked ? 2 : 1,
            borderColor: checkIsLiked ? '#325382' : '#cbcbcb',
          }}
          onPress={() => Alert.alert('안내', '좋아요는 로그인 후 이용 가능합니다.')}>
          <MaterialIcons name="thumb-up" size={18} color="#325382" />
          <Text>좋아요</Text>
        </Pressable>
      </View>

      <View style={retreatStyles.divider} />

      <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>댓글 입력하기</Text>
      <TextInput
        style={retreatStyles.formTextarea}
        value={inputComments}
        onChangeText={setInputComments}
        maxLength={500}
        multiline
        placeholder="댓글을 입력해주세요 (최대 500자)"
      />
      <Pressable style={[retreatStyles.primaryBtn, { alignSelf: 'flex-end', marginTop: 8 }]} onPress={() => void registerComment()}>
        <Text style={retreatStyles.primaryBtnText}>댓글 입력</Text>
      </Pressable>

      {comments.length > 0 ? (
        comments.map(item => (
          <View key={item.id} style={{ paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#e8ebef' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700', color: '#33383f' }}>{item.userNickName}님</Text>
              <Text style={{ color: '#888', fontSize: 13 }}>{formatRelativeDate(item.date)}</Text>
            </View>
            <Text style={{ marginTop: 8, fontSize: 15, lineHeight: 22, color: '#333' }}>{item.content}</Text>
          </View>
        ))
      ) : (
        <Text style={[retreatStyles.emptyText, { marginTop: 16 }]}>입력된 댓글이 없습니다.</Text>
      )}
      </ScrollView>
      <FloatingScrollActions showTop={showTopBtn} onScrollToTop={scrollToTop} />
    </View>
  );
}

export function ReviewPostView({ onBack }: { onBack: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(REVIEW_PLACEHOLDER);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: retreatColors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <PageHeader title="후기 작성" onBack={onBack} />

      <View style={retreatStyles.noticeBox}>
        <Text style={retreatStyles.noticeText}>후기 작성 시 사진 3장 이상이 필요합니다.</Text>
        <Text style={[retreatStyles.noticeText, { marginTop: 8, color: '#0f386e' }]}>앱에서는 텍스트만 미리보기 가능하며, 사진 포함 작성은 웹을 이용해 주세요.</Text>
      </View>

      <View style={retreatStyles.formField}>
        <Text style={retreatStyles.formLabel}>제목</Text>
        <TextInput style={retreatStyles.formInput} value={title} onChangeText={setTitle} maxLength={200} />
      </View>
      <View style={retreatStyles.formField}>
        <Text style={retreatStyles.formLabel}>본문</Text>
        <TextInput style={[retreatStyles.formTextarea, { minHeight: 200 }]} value={content} onChangeText={setContent} maxLength={2000} multiline />
      </View>

      <Pressable
        style={retreatStyles.primaryBtn}
        onPress={() => openRetreatOnWeb('/retreat/review/post')}>
        <Text style={retreatStyles.primaryBtnText}>웹에서 후기 작성하기</Text>
      </Pressable>
    </ScrollView>
  );
}

const listStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: retreatColors.bg },
  list: { flex: 1 },
  content: { padding: 16 },
});

const reviewCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e8ebef',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  imgWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#ffffff',
  },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  noImageText: { color: '#777', fontSize: 12, textAlign: 'center' },
  body: { padding: 10, gap: 4 },
  title: { fontSize: 14, fontWeight: '700', color: '#222', lineHeight: 19 },
  content: { fontSize: 12, color: '#666', lineHeight: 17 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
});

const detailStyles = StyleSheet.create({
  detailRoot: { flex: 1, backgroundColor: retreatColors.bg },
  detailScroll: { flex: 1 },
  detailContent: { padding: 16 },
  imageListWrap: {
    marginHorizontal: -16,
    marginTop: 16,
    gap: 4,
    backgroundColor: '#ffffff',
  },
  detailImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#ffffff',
  },
});
