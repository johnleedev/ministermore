import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  SectionList,
  Text,
  TextInput,
  View,
} from 'react-native';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { CommunityBoardConfig, CommunityComment, CommunityPost } from './boardTypes';
import {
  API_BASE,
  formatRelativeDate,
  isPostNew,
  parseBoardListPayload,
  parsePostImages,
  ensureBoardLogin,
  stripPostContentPreview,
} from './boardShared';
import { useRetreatSession } from '../retreat/useRetreatSession';
import { boardColors } from './boardTheme';
import { useBoardCategory } from './boardCategoryContext';
import {
  BOARD_CATEGORY_TABS,
  BoardFilterPills,
  BoardHeader,
  BoardListSectionHeader,
  BoardPostItem,
  BoardWhiteCard,
} from './boardUi';
import { ScreenCategoryTabs } from '../shared/ScreenCategoryTabs';
import { StickySearchBar } from '../shared/StickySearchBar';
import { ListLoading, PageHeader } from '../retreat/RetreatComponents';
import { retreatStyles } from '../retreat/retreatShared';
import {
  FloatingScrollActions,
  LIST_FAB_SCROLL_PADDING_WITH_WRITE,
  ListLoadMoreFooter,
  useSectionListScrollToTop,
  useScrollViewScrollToTop,
  LIST_FAB_SCROLL_PADDING,
} from '../shared/listScrollUi';
import { DetailPressableImage } from '../shared/ImagePreviewModal';
import { LinkableText } from '../shared/LinkableText';

const getListRoute = (c: CommunityBoardConfig) => c.listRoute ?? `${c.routePrefix}getposts`;
const getSearchRoute = (c: CommunityBoardConfig) => c.searchRoute ?? `${c.routePrefix}getpostssearch`;
const getViewsRoute = (c: CommunityBoardConfig) => c.viewsRoute ?? `${c.routePrefix}postsviews`;
const getAllCommentsRoute = (c: CommunityBoardConfig) =>
  c.getAllCommentsRoute ?? `${c.routePrefix}getallcomments`;
const getIsLikedRoute = (c: CommunityBoardConfig) => c.getIsLikedRoute ?? `${c.routePrefix}getisliked`;
const getDeletePostRoute = (c: CommunityBoardConfig) => c.deletePostRoute ?? `${c.routePrefix}deletepost`;
const getCommentsInputRoute = (c: CommunityBoardConfig) =>
  c.commentsInputRoute ?? `${c.routePrefix}commentsinput`;
const getCommentDeleteRoute = (c: CommunityBoardConfig) =>
  c.commentDeleteRoute ?? `${c.routePrefix}commentdelete`;
const getIsLikedToggleRoute = (c: CommunityBoardConfig) =>
  c.isLikedToggleRoute ?? `${c.routePrefix}islikedtoggle`;

/** 목록 상단에 노출할 공지 최대 개수 (최신순) */
const MAX_NOTICE_LIST_ITEMS = 3;

type Props = {
  config: CommunityBoardConfig;
};

import { BoardStack } from './BoardStack';

export function BoardMain({ config }: Props) {
  return <BoardStack config={config} />;
}

export function BoardListView({
  config,
  refreshKey,
  onOpenDetail,
  onOpenPost,
}: {
  config: CommunityBoardConfig;
  refreshKey: number;
  onOpenDetail: (post: CommunityPost) => void;
  onOpenPost: () => void;
}) {
  const { category, setCategory } = useBoardCategory();
  const hasRegion = Boolean(config.regionOptions?.length);

  const [currentPage, setCurrentPage] = useState(1);
  const [noticeList, setNoticeList] = useState<CommunityPost[]>([]);
  const [list, setList] = useState<CommunityPost[]>([]);
  const [listAllLength, setListAllLength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchWord, setSearchWord] = useState('');
  const [activeSearchWord, setActiveSearchWord] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [activeRegions, setActiveRegions] = useState<string[]>([]);
  const endReachedLockRef = useRef(false);

  const hasMore =
    !isLoading && !loadingMore && list.length > 0 && list.length < listAllLength;
  const isFiltering =
    Boolean(activeSearchWord) || activeCategories.length > 0 || activeRegions.length > 0;

  useEffect(() => {
    let cancelled = false;
    const isFirstPage = currentPage === 1;
    if (isFirstPage) setIsLoading(true);
    else setLoadingMore(true);

    const hasFilter =
      Boolean(activeSearchWord) ||
      activeCategories.length > 0 ||
      activeRegions.length > 0;

    (async () => {
      try {
        const res = hasFilter
          ? await axios.post(`${API_BASE}/${config.apiBase}/${getSearchRoute(config)}`, {
              word: activeSearchWord,
              categories: activeCategories,
              regions: activeRegions,
              page: currentPage,
            })
          : await axios.get(
              `${API_BASE}/${config.apiBase}/${getListRoute(config)}/${currentPage}`,
            );

        if (cancelled) return;
        if (res.data) {
          const { notices, regular } = parseBoardListPayload(
            res.data.resultData as CommunityPost[],
            res.data.noticePosts as CommunityPost[],
          );
          if (isFirstPage) {
            setNoticeList(notices);
            setList(regular);
            setListAllLength(res.data.totalCount || 0);
          } else if (regular.length === 0) {
            setList(prev => {
              setListAllLength(prev.length);
              return prev;
            });
          } else {
            setList(prev => [...prev, ...regular]);
            setListAllLength(res.data.totalCount || 0);
          }
        } else if (isFirstPage) {
          setNoticeList([]);
          setList([]);
          setListAllLength(0);
        }
      } catch {
        if (!cancelled) {
          if (isFirstPage) {
            setNoticeList([]);
            setList([]);
            setListAllLength(0);
          } else {
            setList(prev => {
              setListAllLength(prev.length);
              return prev;
            });
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setLoadingMore(false);
          endReachedLockRef.current = false;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    config,
    currentPage,
    refreshKey,
    activeSearchWord,
    activeCategories,
    activeRegions,
  ]);

  const loadMore = useCallback(() => {
    if (isLoading || loadingMore || !hasMore || endReachedLockRef.current) {
      return;
    }
    endReachedLockRef.current = true;
    setCurrentPage(p => p + 1);
  }, [isLoading, loadingMore, hasMore]);

  const applySearchFilters = useCallback(
    ({
      word,
      categories,
      regions,
    }: {
      word: string;
      categories: string[];
      regions: string[];
    }) => {
      const sameWord = word === activeSearchWord;
      const sameCategories =
        categories.length === activeCategories.length &&
        categories.every((item, index) => item === activeCategories[index]);
      const sameRegions =
        regions.length === activeRegions.length &&
        regions.every((item, index) => item === activeRegions[index]);
      if (sameWord && sameCategories && sameRegions) {
        return;
      }

      endReachedLockRef.current = false;
      setNoticeList([]);
      setList([]);
      setListAllLength(0);
      setActiveSearchWord(word);
      setActiveCategories(categories);
      setActiveRegions(regions);
      setCurrentPage(1);
    },
    [activeCategories, activeRegions, activeSearchWord],
  );

  const openPostDetails = async (post: CommunityPost) => {
    try {
      await axios.post(`${API_BASE}/${config.apiBase}/${getViewsRoute(config)}`, {
        postId: post.id,
        sort: config.sort,
      });
    } catch { /* ignore */ }
    onOpenDetail(post);
  };

  const handleUnifiedSearch = () => {
    const trimmed = searchWord.trim();
    if (!trimmed && !selectedCategory && !selectedRegion) {
      Alert.alert('', '검색 조건을 입력/선택해주세요');
      return;
    }
    if (trimmed && trimmed.length < 2) {
      Alert.alert('', '2글자이상 입력해주세요');
      return;
    }
    applySearchFilters({
      word: trimmed,
      categories: selectedCategory ? [selectedCategory] : [],
      regions: selectedRegion ? [selectedRegion] : [],
    });
  };

  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value);
    applySearchFilters({
      word: activeSearchWord,
      categories: value ? [value] : [],
      regions: selectedRegion ? [selectedRegion] : [],
    });
  };

  const handleRegionSelect = (value: string) => {
    setSelectedRegion(value);
    applySearchFilters({
      word: activeSearchWord,
      categories: selectedCategory ? [selectedCategory] : [],
      regions: value ? [value] : [],
    });
  };

  const resetSearch = () => {
    endReachedLockRef.current = false;
    setSearchWord('');
    setActiveSearchWord('');
    setSelectedCategory('');
    setSelectedRegion('');
    setActiveCategories([]);
    setActiveRegions([]);
    setNoticeList([]);
    setList([]);
    setListAllLength(0);
    setCurrentPage(1);
  };

  const resultLabel = isFiltering ? '검색' : '전체';
  const displayNoticeList = useMemo(
    () => noticeList.slice(0, MAX_NOTICE_LIST_ITEMS),
    [noticeList],
  );
  const hasNotices = displayNoticeList.length > 0;

  type BoardListSection = {
    key: 'notice' | 'posts';
    title: string;
    count?: number;
    variant: 'notice' | 'default';
    data: CommunityPost[];
  };

  const sections = useMemo((): BoardListSection[] => {
    const out: BoardListSection[] = [];
    if (hasNotices) {
      out.push({
        key: 'notice',
        title: '',
        variant: 'notice',
        data: displayNoticeList,
      });
    }
    out.push({
      key: 'posts',
      title: hasNotices ? '게시글' : resultLabel,
      count: listAllLength,
      variant: 'default',
      data: list,
    });
    return out;
  }, [hasNotices, displayNoticeList, list, listAllLength, resultLabel]);

  const listHeader = (
    <BoardWhiteCard>
      <BoardHeader title={config.boardTitle} />

      <BoardFilterPills
        items={config.categoryOptions}
        selected={selectedCategory}
        onSelect={handleCategorySelect}
      />

      {hasRegion && config.regionOptions ? (
        <BoardFilterPills
          items={config.regionOptions}
          selected={selectedRegion}
          onSelect={handleRegionSelect}
        />
      ) : null}

    </BoardWhiteCard>
  );

  const { listRef, showTopBtn, onScroll, scrollToTop } =
    useSectionListScrollToTop<CommunityPost, BoardListSection>();

  const isListEmpty = !isLoading && noticeList.length === 0 && list.length === 0;

  const renderPostItem = ({ item }: { item: CommunityPost }) => (
    <BoardPostItem
      sort={item.sort}
      title={item.title}
      contentPreview={
        config.showListContentPreview
          ? stripPostContentPreview(item.content)
          : undefined
      }
      contentPreviewLines={config.sort === 'free' ? 3 : 2}
      author={item.userNickName}
      timeLabel={formatRelativeDate(item.date)}
      views={item.views}
      commentCount={item.commentCount}
      isNew={isPostNew(item.date)}
      onPress={() => void openPostDetails(item)}
    />
  );

  return (
    <View style={listStyles.root}>
      <ScreenCategoryTabs
        tabs={BOARD_CATEGORY_TABS}
        active={category}
        onChange={setCategory}
      />
      <StickySearchBar
        placeholder={config.searchPlaceholder ?? '검색어를 입력해주세요'}
        value={searchWord}
        onChangeText={setSearchWord}
        onSubmitSearch={handleUnifiedSearch}
        onClear={resetSearch}
        showClearWhenEmpty={isFiltering}
      />
      <SectionList
        ref={listRef}
        style={listStyles.list}
        sections={sections}
        keyExtractor={(item, index) => `post-${item.id}-${index}`}
        renderItem={renderPostItem}
        renderSectionHeader={({ section }) =>
          section.key === 'notice' ? null : (
            <BoardListSectionHeader
              title={section.title}
              count={section.count}
              variant={section.variant}
            />
          )
        }
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={listStyles.rowGap} />}
        SectionSeparatorComponent={() => <View style={listStyles.sectionGap} />}
        ListEmptyComponent={
          isLoading ? (
            <ListLoading />
          ) : isListEmpty ? (
            <View style={listStyles.emptyBox}>
              <Text style={listStyles.emptyText}>
                {isFiltering ? '검색 결과가 없습니다.' : '등록된 글이 없습니다.'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={loadingMore ? <ListLoadMoreFooter /> : null}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[
          listStyles.listContent,
          { paddingBottom: LIST_FAB_SCROLL_PADDING_WITH_WRITE },
        ]}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.2}
      />
      <FloatingScrollActions
        showTop={showTopBtn}
        onScrollToTop={scrollToTop}
        onWrite={onOpenPost}
      />
    </View>
  );
}

export function BoardDetailView({
  config,
  post,
  onBack,
}: {
  config: CommunityBoardConfig;
  post: CommunityPost;
  onBack: () => void;
}) {
  const { scrollRef, showTopBtn, onScroll, scrollToTop } = useScrollViewScrollToTop();
  const session = useRetreatSession();
  const images = parsePostImages(post.images);
  const [commentsList, setCommentsList] = useState<CommunityComment[]>([]);
  const [isLikedLength, setIsLikedLength] = useState(0);
  const [checkIsLiked, setCheckIsLiked] = useState(false);
  const [inputComments, setInputComments] = useState('');
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resComment = await axios.get(
          `${API_BASE}/${config.apiBase}/${getAllCommentsRoute(config)}/${post.id}`,
        );
        if (!cancelled) {
          setCommentsList(resComment.data ? [...resComment.data].reverse() : []);
        }

        const resLiked = await axios.get(
          `${API_BASE}/${config.apiBase}/${getIsLikedRoute(config)}/${post.id}`,
        );
        if (!cancelled && resLiked.data) {
          setIsLikedLength(resLiked.data.length);
          setCheckIsLiked(false);
        }
      } catch { /* ignore */ }
    })();
    return () => {
      cancelled = true;
    };
  }, [config, post.id, refresh]);

  const registerComment = async () => {
    if (!inputComments.trim()) {
      Alert.alert('', '댓글을 입력해주세요.');
      return;
    }
    const user = await ensureBoardLogin(session.isLoggedIn, session.user);
    if (!user) return;
    try {
      const res = await axios.post(`${API_BASE}/${config.apiBase}/${getCommentsInputRoute(config)}`, {
        postId: post.id,
        commentText: inputComments.trim(),
        date: new Date().toISOString().slice(0, 10),
        userAccount: user.userAccount,
        userNickName: user.userNickName,
      });
      if (res.data) {
        setInputComments('');
        setRefresh(r => !r);
        Alert.alert('', '입력되었습니다.');
      }
    } catch {
      Alert.alert('', '댓글 등록에 실패했습니다.');
    }
  };

  return (
    <View style={listStyles.detailRoot}>
      <ScrollView
        ref={scrollRef}
        style={listStyles.detailScroll}
        contentContainerStyle={[listStyles.detailContent, { paddingBottom: LIST_FAB_SCROLL_PADDING }]}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}>
      <PageHeader
        title={config.detailTitle}
        onBack={onBack}
        secondaryActionLabel="목록"
        onSecondaryAction={onBack}
      />

      <View
        style={{
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderColor: '#ddd',
          gap: 8,
        }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#222' }}>{post.title}</Text>
        <Text style={{ fontSize: 14, color: '#555' }}>구분: {post.sort}</Text>
        {post.region ? <Text style={{ fontSize: 14, color: '#555' }}>지역: {post.region}</Text> : null}
        <Text style={{ fontSize: 14, color: '#555' }}>글쓴이: {post.userNickName}님</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <MetaRow icon="schedule" text={formatRelativeDate(post.date)} />
          <MetaRow icon="visibility" text={String(post.views)} />
          <MetaRow icon="thumb-up" text={String(isLikedLength)} />
        </View>
      </View>

      {images.length > 0 ? (
        <View style={listStyles.detailImageListWrap}>
          {images.map((item, index) => (
            <DetailPressableImage
              key={`${item}-${index}`}
              uri={`${API_BASE}/images/postimage/${config.imagePath}/${item}`}
              style={listStyles.detailImage}
            />
          ))}
        </View>
      ) : null}

      <View style={listStyles.detailBody}>
        <LinkableText text={post.content} style={{ fontSize: 16, lineHeight: 26, color: '#333' }} />

        <Pressable
          style={{
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 20,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 5,
            borderWidth: checkIsLiked ? 2 : 1,
            borderColor: checkIsLiked ? '#325382' : '#cbcbcb',
          }}
          onPress={() => Alert.alert('안내', '좋아요는 로그인 후 이용 가능합니다.')}>
          <MaterialIcons name="thumb-up" size={18} color="#325382" />
          <Text style={{ fontSize: 15, color: '#333' }}>좋아요</Text>
        </Pressable>
      </View>

      <View style={{ height: 2, backgroundColor: '#EAEAEA', marginVertical: 10 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <MaterialIcons name="edit" size={18} color="#334968" />
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#334968' }}>댓글 입력하기</Text>
        <Text style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>* 최대 500자</Text>
      </View>
      <TextInput
        style={retreatStyles.formTextarea}
        value={inputComments}
        onChangeText={setInputComments}
        maxLength={500}
        multiline
        placeholder="댓글을 입력해주세요"
      />
      <Pressable
        style={[retreatStyles.primaryBtn, { alignSelf: 'flex-end', marginTop: 8, marginBottom: 16 }]}
        onPress={() => void registerComment()}>
        <Text style={retreatStyles.primaryBtnText}>댓글 입력</Text>
      </Pressable>

      {commentsList.length > 0 ? (
        commentsList.map(item => (
          <View
            key={item.id}
            style={{ paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#e8ebef' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700', color: '#33383f' }}>{item.userNickName}님</Text>
              <Text style={{ color: '#888', fontSize: 13 }}>{formatRelativeDate(item.date)}</Text>
            </View>
            <View style={{ marginTop: 8 }}>
              <LinkableText text={item.content} style={{ fontSize: 15, lineHeight: 22, color: '#333' }} />
            </View>
          </View>
        ))
      ) : (
        <Text style={retreatStyles.emptyText}>입력된 댓글이 없습니다.</Text>
      )}
      </ScrollView>
      <FloatingScrollActions showTop={showTopBtn} onScrollToTop={scrollToTop} />
    </View>
  );
}

function MetaRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <MaterialIcons name={icon} size={16} color="#325382" />
      <Text style={{ fontSize: 13, color: '#555' }}>{text}</Text>
    </View>
  );
}

const listStyles = {
  root: { flex: 1, backgroundColor: boardColors.bg },
  list: { flex: 1 },
  listContent: { paddingBottom: 8 },
  rowGap: { height: 8 },
  sectionGap: { height: 4 },
  emptyBox: {
    marginHorizontal: 14,
    marginTop: 8,
    paddingVertical: 48,
    alignItems: 'center' as const,
    backgroundColor: boardColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: boardColors.border,
  },
  emptyText: { fontSize: 15, color: boardColors.textMuted },
  detailRoot: { flex: 1, backgroundColor: boardColors.bg },
  detailScroll: { flex: 1 },
  detailContent: { padding: 16 },
  detailImageListWrap: {
    marginHorizontal: -16,
    marginTop: 16,
    gap: 4,
    backgroundColor: '#ffffff',
  },
  detailImage: {
    width: '100%' as const,
    aspectRatio: 4 / 3,
    backgroundColor: '#ffffff',
  },
  detailBody: { paddingTop: 16, paddingBottom: 16 },
};
