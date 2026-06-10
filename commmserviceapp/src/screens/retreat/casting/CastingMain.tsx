import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import axios from 'axios';
import {
  FloatingScrollActions,
  LIST_FAB_SCROLL_PADDING,
  LIST_FAB_SCROLL_PADDING_WITH_WRITE,
  ListLoadMoreFooter,
  useListScrollToTop,
  useScrollViewScrollToTop,
} from '../../shared/listScrollUi';
import { StickySearchBar } from '../../shared/StickySearchBar';
import { RetreatCategoryTabs } from '../retreatCategoryContext';
import {
  ChipSelect,
  DetailRow,
  ListLoading,
  PageHeader,
  RegionTabs,
  SectionHeader,
  VenueCard,
  VenueHeader,
} from '../RetreatComponents';
import {
  API_BASE,
  CASTING_SORT_TABS,
  isRetreatVisible,
  parseImageList,
  retreatColors,
  retreatGridColumnStyle,
  retreatStyles,
} from '../retreatShared';
import { CastingStack } from './CastingStack';
import { DetailPressableImage } from '../../shared/ImagePreviewModal';
import { FormKeyboardScreen, useFormInputFocusScroll } from '../../shared/FormKeyboardScreen';
import { loadSessionUser } from '../../../login/sessionStorage';
import { promptLogin } from '../../../navigation/authPrompt';
import { fetchScrapStatusMap, scrapKeyOf, toggleScrap } from '../../../shared/scrapApi';
import { RetreatRequestImageSection } from '../RetreatRequestImageSection';
import {
  appendRetreatImagesToFormData,
  formatRetreatRequestDate,
  type RetreatRequestImage,
} from '../retreatRequestImages';

type CastingItem = {
  id: number;
  isView: string | boolean | number | null;
  sort: string;
  name: string;
  images: string | string[] | null;
};

type CastingDetailItem = CastingItem & {
  date: string;
  phone: string;
  profile: string;
};

const PAGE_SIZE = 10;

export function CastingMain({ initialDetailId }: { initialDetailId?: number }) {
  return <CastingStack initialDetailId={initialDetailId} />;
}

export function CastingListView({
  onOpenDetail,
  onOpenRequest,
}: {
  onOpenDetail: (id: number) => void;
  onOpenRequest: () => void;
}) {
  const [list, setList] = useState<CastingItem[]>([]);
  const [selectSort, setSelectSort] = useState('all');
  const [searchWord, setSearchWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [userAccount, setUserAccount] = useState('');
  const [scrapMap, setScrapMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await loadSessionUser();
      if (!cancelled) setUserAccount(user?.userAccount || '');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchPosts = useCallback(async (page: number, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await axios.post(`${API_BASE}/retreatcasting/getdatacasting`, {
        sort: selectSort,
        page,
        pageSize: PAGE_SIZE,
      });

      if (res.data?.data) {
        const newItems = [...res.data.data] as CastingItem[];
        setList(prev => (append ? [...prev, ...newItems] : newItems));
        setTotalCount(res.data.count ?? 0);
        setEmpty(false);
        setHasMore(newItems.length >= PAGE_SIZE);
      } else {
        if (!append) {
          setList([]);
          setTotalCount(res.data?.count ?? 0);
          setEmpty(true);
        }
        setHasMore(false);
      }
    } catch {
      if (!append) {
        setList([]);
        setEmpty(true);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectSort]);

  const resetListState = useCallback(() => {
    setList([]);
    setCurrentPage(1);
    setHasMore(true);
    setIsSearching(false);
    setEmpty(false);
    setTotalCount(0);
  }, []);

  useEffect(() => {
    resetListState();
    void fetchPosts(1);
  }, [selectSort, resetListState, fetchPosts]);

  const handleLoadMore = () => {
    if (isSearching || !hasMore || isLoadingMore || isLoading) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    void fetchPosts(nextPage, true);
  };

  const handleSearch = async () => {
    if (searchWord.trim().length < 2) {
      Alert.alert('', '2글자이상 입력해주세요');
      return;
    }

    setIsSearching(true);
    setIsLoading(true);
    setHasMore(false);
    setCurrentPage(1);

    try {
      const res = await axios.post(`${API_BASE}/retreatcasting/getdatacastingsearch`, {
        word: searchWord.trim(),
      });

      if (res.data?.data) {
        const visible = (res.data.data as CastingItem[]).filter(item => isRetreatVisible(item.isView));
        const filtered =
          selectSort === 'all' ? visible : visible.filter(item => item.sort === selectSort);
        setList(filtered);
        setTotalCount(filtered.length);
        setEmpty(false);
      } else {
        setList([]);
        setTotalCount(0);
        setEmpty(true);
      }
    } catch {
      setList([]);
      setEmpty(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchWord('');
    resetListState();
    void fetchPosts(1);
  };

  const listTitle = selectSort === 'all' ? '전체' : selectSort;
  const hasResults = list.length > 0;
  const { listRef, showTopBtn, onScroll, scrollToTop } = useListScrollToTop<CastingItem>();

  useEffect(() => {
    if (!userAccount || list.length === 0) {
      setScrapMap({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const targets = list.map(item => ({
          targetType: 'retreat_casting' as const,
          targetId: String(item.id),
          tableType: '',
        }));
        const map = await fetchScrapStatusMap(userAccount, targets);
        if (!cancelled) setScrapMap(map);
      } catch {
        if (!cancelled) setScrapMap({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userAccount, list]);

  const onToggleScrap = async (item: CastingItem) => {
    if (!userAccount) {
      promptLogin();
      return;
    }
    const first = parseImageList(item.images)[0] || '';
    const payload = {
      targetType: 'retreat_casting' as const,
      targetId: String(item.id),
      tableType: '',
      title: item.name,
      subtitle: item.sort,
      meta: '',
      thumb: first,
      linkPath: `/retreat/casting/detail?id=${item.id}`,
    };
    const key = scrapKeyOf(payload);
    const before = Boolean(scrapMap[key]);
    setScrapMap(prev => ({ ...prev, [key]: !before }));
    try {
      const res = await toggleScrap(userAccount, payload);
      setScrapMap(prev => ({ ...prev, [key]: res.scrapped }));
    } catch {
      setScrapMap(prev => ({ ...prev, [key]: before }));
      Alert.alert('', '스크랩 처리에 실패했습니다.');
    }
  };

  const renderCastingCard = ({ item }: { item: CastingItem }) => {
    const first = parseImageList(item.images)[0];
    return (
      <VenueCard
        placeName={item.name}
        location={item.sort}
        sort={item.sort}
        imageUri={first ? `${API_BASE}/images/retreat/castingimage/${first}` : undefined}
        imageAlignTop
        onToggleScrap={() => void onToggleScrap(item)}
        scrapped={Boolean(scrapMap[scrapKeyOf({ targetType: 'retreat_casting', targetId: String(item.id), tableType: '' })])}
        onPress={() => onOpenDetail(item.id)}
      />
    );
  };

  const listHeader = (
    <View style={listStyles.headerWrap}>
      <VenueHeader title="수련회강사" />

      <RegionTabs tabs={CASTING_SORT_TABS} selected={selectSort} onSelect={setSelectSort} />

      {hasResults && !empty ? (
        <SectionHeader title={listTitle} count={totalCount} countSuffix="명" />
      ) : null}
    </View>
  );

  return (
    <View style={listStyles.root}>
      <RetreatCategoryTabs />
      <StickySearchBar
        placeholder="예: 홍길동, 찬양사역자"
        value={searchWord}
        onChangeText={setSearchWord}
        onSubmitSearch={() => void handleSearch()}
        onClear={resetSearch}
      />
      <FlatList
        ref={listRef}
        style={listStyles.list}
        contentContainerStyle={[
          listStyles.listContent,
          { paddingBottom: LIST_FAB_SCROLL_PADDING_WITH_WRITE },
        ]}
        keyboardShouldPersistTaps="handled"
        data={hasResults && !empty ? list : []}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        columnWrapperStyle={retreatGridColumnStyle}
        renderItem={renderCastingCard}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          isLoading ? (
            <ListLoading />
          ) : (
            <Text style={retreatStyles.emptyText}>검색 결과가 없습니다.</Text>
          )
        }
        ListFooterComponent={isLoadingMore ? <ListLoadMoreFooter /> : null}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
      />
      <FloatingScrollActions
        showTop={showTopBtn}
        onScrollToTop={scrollToTop}
        onWrite={onOpenRequest}
      />
    </View>
  );
}

export function CastingDetailView({ id, onBack }: { id: number; onBack: () => void }) {
  const { scrollRef, showTopBtn, onScroll, scrollToTop } = useScrollViewScrollToTop();
  const [detail, setDetail] = useState<CastingDetailItem | null>(null);
  const images = parseImageList(detail?.images);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.post(`${API_BASE}/retreatcasting/getdatacastingpart`, { id });
        if (!cancelled && res.data?.[0]) setDetail(res.data[0]);
      } catch {
        if (!cancelled) setDetail(null);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (!detail) {
    return (
      <View style={listStyles.detailRoot}>
        <PageHeader title="수련회강사" onBack={onBack} />
        <ListLoading />
      </View>
    );
  }

  return (
    <View style={listStyles.detailRoot}>
      <ScrollView
        ref={scrollRef}
        style={listStyles.detailScroll}
        contentContainerStyle={[listStyles.detailContent, { paddingBottom: LIST_FAB_SCROLL_PADDING }]}
        onScroll={onScroll}
        scrollEventThrottle={16}>
      <PageHeader title={detail.name} onBack={onBack} secondaryActionLabel="목록으로" onSecondaryAction={onBack} />

      <DetailRow label="구분">
        <Text style={retreatStyles.detailValue}>{detail.sort}</Text>
      </DetailRow>
      <DetailRow label="연락처">
        {detail.phone ? (
          <Text style={[retreatStyles.detailValue, { color: retreatColors.link, textDecorationLine: 'underline' }]} onPress={() => Linking.openURL(`tel:${detail.phone}`)}>
            {detail.phone}
          </Text>
        ) : (
          <Text style={retreatStyles.detailValue}>-</Text>
        )}
      </DetailRow>
      <DetailRow label="프로필">
        <Text style={retreatStyles.detailValue}>{detail.profile || '-'}</Text>
      </DetailRow>

      <View style={retreatStyles.divider} />

      {images.length > 0 ? (
        <View style={listStyles.imageListWrap}>
          {images.map((item, idx) => (
            <DetailPressableImage
              key={`${item}-${idx}`}
              uri={`${API_BASE}/images/retreat/castingimage/${item}`}
              style={listStyles.detailImage}
            />
          ))}
        </View>
      ) : (
        <Text style={retreatStyles.emptyText}>등록된 사진이 없습니다.</Text>
      )}
      </ScrollView>
      <FloatingScrollActions showTop={showTopBtn} onScrollToTop={scrollToTop} />
    </View>
  );
}

export function CastingRequestView({ onBack }: { onBack: () => void }) {
  const scrollInputIntoView = useFormInputFocusScroll();
  const [sort, setSort] = useState('선택');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profile, setProfile] = useState('');
  const [userContact, setUserContact] = useState('');
  const [images, setImages] = useState<RetreatRequestImage[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const registerPost = async () => {
    if (sort === '선택' || !name.trim() || !profile.trim() || !userContact.trim()) {
      Alert.alert('', '필수 항목을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      appendRetreatImagesToFormData(formData, images);
      formData.append('sort', sort);
      formData.append('name', name.trim());
      formData.append('phone', phone);
      formData.append('profile', profile.trim());
      formData.append('userContact', userContact.trim());
      formData.append('date', formatRetreatRequestDate());
      formData.append('images', JSON.stringify(images.map(item => item.name)));

      const res = await axios.post(`${API_BASE}/retreatcasting/postscasting`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data) {
        Alert.alert('', '요청되었습니다. 운영진이 검토후에 업로드 됩니다.');
        onBack();
      } else {
        Alert.alert('', '요청에 실패했습니다.');
      }
    } catch {
      Alert.alert('', '요청 중 오류가 발생했습니다. 사진 용량·개수를 확인해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormKeyboardScreen backgroundColor={retreatColors.bg} contentContainerStyle={listStyles.detailContent}>
      <PageHeader title="강사등록요청" onBack={onBack} secondaryActionLabel="목록으로" onSecondaryAction={onBack} />

      <View style={retreatStyles.noticeBox}>
        <Text style={retreatStyles.noticeText}>등록 요청된 자료는 운영진 검토 후 업로드됩니다.</Text>
        <Text style={[retreatStyles.noticeText, { marginTop: 8 }]}>
          자료에 이상이 있을 경우 작성자 연락처로 연락드릴 수 있습니다.
        </Text>
      </View>

      <View style={{ borderWidth: 1, borderColor: '#e8ebef', borderRadius: 18, padding: 16 }}>
        <View style={retreatStyles.formField}>
          <Text style={retreatStyles.formLabel}>구분</Text>
          <ChipSelect options={['선택', ...CASTING_SORT_TABS]} value={sort} onChange={setSort} />
        </View>
        <View style={retreatStyles.formField}>
          <Text style={retreatStyles.formLabel}>이름</Text>
          <TextInput
            style={retreatStyles.formInput}
            value={name}
            onChangeText={setName}
            onFocus={scrollInputIntoView}
          />
        </View>
        <View style={retreatStyles.formField}>
          <Text style={retreatStyles.formLabel}>연락처</Text>
          <TextInput
            style={retreatStyles.formInput}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            onFocus={scrollInputIntoView}
          />
        </View>
        <View style={retreatStyles.formField}>
          <Text style={retreatStyles.formLabel}>프로필</Text>
          <TextInput
            style={retreatStyles.formTextarea}
            value={profile}
            onChangeText={setProfile}
            multiline
            onFocus={scrollInputIntoView}
          />
        </View>
        <View style={retreatStyles.formField}>
          <Text style={retreatStyles.formLabel}>작성자 연락처 *</Text>
          <TextInput
            style={retreatStyles.formInput}
            value={userContact}
            onChangeText={setUserContact}
            keyboardType="phone-pad"
            onFocus={scrollInputIntoView}
          />
        </View>

        <RetreatRequestImageSection images={images} onChange={setImages} />

        <Pressable
          style={[retreatStyles.primaryBtn, { marginTop: 20, opacity: submitting ? 0.6 : 1 }]}
          disabled={submitting}
          onPress={() => void registerPost()}>
          <Text style={retreatStyles.primaryBtnText}>{submitting ? '등록 중...' : '등록 요청 하기'}</Text>
        </Pressable>
      </View>
    </FormKeyboardScreen>
  );
}

const listStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: retreatColors.bg },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 14 },
  headerWrap: { paddingBottom: 4 },
  detailRoot: { flex: 1, backgroundColor: retreatColors.bg },
  detailScroll: { flex: 1 },
  detailContent: { padding: 16 },
  imageListWrap: {
    marginHorizontal: -16,
    marginTop: 8,
    gap: 4,
    backgroundColor: '#ffffff',
  },
  detailImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#ffffff',
  },
});
