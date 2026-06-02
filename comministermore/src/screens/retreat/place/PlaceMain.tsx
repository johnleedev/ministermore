import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
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
import { RecruitDetailMap } from '../../jobs/common/RecruitDetailMap';
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
  PLACE_SIZE_OPTIONS,
  PLACE_SORT_OPTIONS,
  retreatGridColumnStyle,
  RETREAT_REGIONS,
  isRetreatVisible,
  parseImageList,
  retreatColors,
  retreatStyles,
} from '../retreatShared';
import { PlaceStack } from './PlaceStack';
import { DetailPressableImage } from '../../shared/ImagePreviewModal';
import { FormKeyboardScreen, useFormInputFocusScroll } from '../../shared/FormKeyboardScreen';
import { loadSessionUser } from '../../../login/sessionStorage';
import { fetchScrapStatusMap, scrapKeyOf, toggleScrap } from '../../../shared/scrapApi';
import { RetreatRequestImageSection } from '../RetreatRequestImageSection';
import {
  appendRetreatImagesToFormData,
  formatRetreatRequestDate,
  type RetreatRequestImage,
} from '../retreatRequestImages';

type PlaceItem = {
  id: number;
  isView: string | boolean | number | null;
  placeName: string;
  sort: string;
  region: string;
  location: string;
  size: string;
  images: string | string[] | null;
};

type PlaceDetailData = PlaceItem & {
  address: string;
  homepage: string;
  phone: string;
};

const PAGE_SIZE = 10;

export function PlaceMain({ initialDetailId }: { initialDetailId?: number }) {
  return <PlaceStack initialDetailId={initialDetailId} />;
}

export function PlaceListView({
  onOpenDetail,
  onOpenRequest,
}: {
  onOpenDetail: (id: number) => void;
  onOpenRequest: () => void;
}) {
  const [list, setList] = useState<PlaceItem[]>([]);
  const [selectRegion, setSelectRegion] = useState('all');
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
      const res = await axios.post(`${API_BASE}/retreat/getdataplace`, {
        region: selectRegion,
        sort: 'all',
        page,
        pageSize: PAGE_SIZE,
      });

      if (res.data?.data) {
        const newItems = [...res.data.data] as PlaceItem[];
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
  }, [selectRegion]);

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
  }, [selectRegion, resetListState, fetchPosts]);

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
      const res = await axios.post(`${API_BASE}/retreat/getdataplacesearch`, {
        region: selectRegion,
        word: searchWord.trim(),
      });

      if (res.data?.data) {
        const visible = (res.data.data as PlaceItem[]).filter(item => isRetreatVisible(item.isView));
        setList(visible);
        setTotalCount(visible.length);
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

  const listTitle = selectRegion === 'all' ? '전체' : selectRegion;
  const hasResults = list.length > 0;
  const { listRef, showTopBtn, onScroll, scrollToTop } = useListScrollToTop<PlaceItem>();

  useEffect(() => {
    if (!userAccount || list.length === 0) {
      setScrapMap({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const targets = list.map(item => ({
          targetType: 'retreat_place' as const,
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

  const onToggleScrap = async (item: PlaceItem) => {
    if (!userAccount) {
      Alert.alert('', '로그인이 필요합니다.');
      return;
    }
    const first = parseImageList(item.images)[0] || '';
    const payload = {
      targetType: 'retreat_place' as const,
      targetId: String(item.id),
      tableType: '',
      title: item.placeName,
      subtitle: item.sort,
      meta: item.location,
      thumb: first,
      linkPath: `/retreat/place/detail?id=${item.id}`,
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

  const renderPlaceCard = ({ item }: { item: PlaceItem }) => {
    const first = parseImageList(item.images)[0];
    return (
      <VenueCard
        placeName={item.placeName}
        location={item.location}
        sort={item.sort}
        size={item.size}
        imageUri={first ? `${API_BASE}/images/retreat/placeimage/${first}` : undefined}
        onToggleScrap={() => void onToggleScrap(item)}
        scrapped={Boolean(scrapMap[scrapKeyOf({ targetType: 'retreat_place', targetId: String(item.id), tableType: '' })])}
        onPress={() => onOpenDetail(item.id)}
      />
    );
  };

  const listHeader = (
    <View style={listStyles.headerWrap}>
      <VenueHeader title="수련회장소" />

      <RegionTabs tabs={RETREAT_REGIONS} selected={selectRegion} onSelect={setSelectRegion} />

      {hasResults && !empty ? <SectionHeader title={listTitle} count={totalCount} /> : null}
    </View>
  );

  return (
    <View style={listStyles.root}>
      <RetreatCategoryTabs />
      <StickySearchBar
        placeholder="예: 가평, 수련원, 교회명"
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
        renderItem={renderPlaceCard}
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

export function PlaceDetailView({ id, onBack }: { id: number; onBack: () => void }) {
  const { scrollRef, showTopBtn, onScroll, scrollToTop } = useScrollViewScrollToTop();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<PlaceDetailData | null>(null);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.post(`${API_BASE}/retreat/getdataplacepart`, { id });
        if (cancelled) return;
        if (res.data?.[0]) {
          const copy = res.data[0] as PlaceDetailData;
          const imageList = parseImageList(copy.images);
          setDetail(copy);
          setImages(imageList);
        } else {
          setDetail(null);
        }
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={listStyles.detailRoot}>
        <PageHeader title="수련회장소" onBack={onBack} />
        <ListLoading />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={listStyles.detailRoot}>
        <PageHeader title="수련회장소" onBack={onBack} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={retreatStyles.emptyText}>상세 데이터를 찾을 수 없습니다.</Text>
          <Pressable style={[retreatStyles.secondaryBtn, { marginTop: 16 }]} onPress={onBack}>
            <Text style={retreatStyles.secondaryBtnText}>목록으로</Text>
          </Pressable>
        </View>
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
      <PageHeader title={detail.placeName} onBack={onBack} secondaryActionLabel="목록으로" onSecondaryAction={onBack} />

      <View style={retreatStyles.divider} />

      <DetailRow label="장소명">
        <Text style={retreatStyles.detailValue}>{detail.placeName || '-'}</Text>
      </DetailRow>
      <DetailRow label="형태">
        <Text style={retreatStyles.detailValue}>{detail.sort || '-'}</Text>
      </DetailRow>
      <DetailRow label="지역">
        <Text style={retreatStyles.detailValue}>{detail.region || '-'}</Text>
      </DetailRow>
      <DetailRow label="위치">
        <Text style={retreatStyles.detailValue}>{detail.location || '-'}</Text>
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
      <DetailRow label="크기">
        <Text style={retreatStyles.detailValue}>{detail.size || '-'}</Text>
      </DetailRow>
      <DetailRow label="홈페이지">
        {detail.homepage?.trim() ? (
          <Text
            style={[retreatStyles.detailValue, { color: retreatColors.link, textDecorationLine: 'underline' }]}
            onPress={() => {
              const url = detail.homepage.includes('http') ? detail.homepage : `http://${detail.homepage}`;
              Linking.openURL(url);
            }}>
            {detail.homepage}
          </Text>
        ) : (
          <Text style={retreatStyles.detailValue}>-</Text>
        )}
      </DetailRow>
      <DetailRow label="주소">
        <Text style={retreatStyles.detailValue}>{detail.address || '-'}</Text>
      </DetailRow>

      {(detail.address?.trim() || detail.location?.trim() || detail.region?.trim()) ? (
        <View style={{ marginTop: 16 }}>
          <RecruitDetailMap
            address={detail.address}
            location={detail.region}
            locationDetail={detail.location}
            geocodePath="/retreat/geocode"
            caption={detail.placeName}
          />
        </View>
      ) : null}

      <View style={listStyles.imageListWrap}>
        {images.length > 0 ? (
          images.map((item, idx) => (
            <DetailPressableImage
              key={`${item}-${idx}`}
              uri={`${API_BASE}/images/retreat/placeimage/${item}`}
              style={listStyles.placeImage}
            />
          ))
        ) : (
          <View style={listStyles.imageEmpty}>
            <Text style={{ color: '#777' }}>등록된 사진이 없습니다.</Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 32 }}>
        <Pressable style={retreatStyles.secondaryBtn} onPress={onBack}>
          <Text style={retreatStyles.secondaryBtnText}>목록으로</Text>
        </Pressable>
      </View>
      </ScrollView>
      <FloatingScrollActions showTop={showTopBtn} onScrollToTop={scrollToTop} />
    </View>
  );
}

const listStyles = {
  root: { flex: 1, backgroundColor: retreatColors.bg },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 14 },
  headerWrap: { paddingBottom: 4 },
  detailRoot: { flex: 1, backgroundColor: retreatColors.bg },
  detailScroll: { flex: 1 },
  detailContent: { padding: 16 },
  imageListWrap: {
    marginHorizontal: -16,
    marginTop: 16,
    gap: 4,
    backgroundColor: '#ffffff',
  },
  placeImage: {
    width: '100%' as const,
    aspectRatio: 4 / 3,
    backgroundColor: '#ffffff',
  },
  imageEmpty: {
    paddingVertical: 48,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#ffffff',
  },
};

export function PlaceRequestView({ onBack }: { onBack: () => void }) {
  const scrollInputIntoView = useFormInputFocusScroll();
  const [placeName, setPlaceName] = useState('');
  const [sort, setSort] = useState('선택');
  const [region, setRegion] = useState('선택');
  const [size, setSize] = useState('선택');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [homepage, setHomepage] = useState('');
  const [userContact, setUserContact] = useState('');
  const [images, setImages] = useState<RetreatRequestImage[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const registerPost = async () => {
    if (!placeName || sort === '선택' || region === '선택' || size === '선택' || !address || !userContact) {
      Alert.alert('', '필수 항목을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      appendRetreatImagesToFormData(formData, images);
      formData.append('placeName', placeName);
      formData.append('sort', sort);
      formData.append('region', region);
      formData.append('location', location);
      formData.append('size', size);
      formData.append('address', address);
      formData.append('phone', phone);
      formData.append('date', formatRetreatRequestDate());
      formData.append('homepage', homepage);
      formData.append('userContact', userContact);
      formData.append('postImage', JSON.stringify(images.map(item => item.name)));

      const res = await axios.post(`${API_BASE}/retreat/postsplace`, formData, {
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
      <PageHeader title="장소등록요청" onBack={onBack} secondaryActionLabel="목록으로" onSecondaryAction={onBack} />

      <View style={retreatStyles.noticeBox}>
        <Text style={retreatStyles.noticeText}>등록 요청된 자료는 운영진 검토 후 업로드됩니다.</Text>
        <Text style={[retreatStyles.noticeText, { marginTop: 8 }]}>
          자료에 이상이 있을 경우 작성자 연락처로 연락드릴 수 있습니다.
        </Text>
      </View>

      <View style={{ borderWidth: 1, borderColor: '#e8ebef', borderRadius: 18, padding: 16 }}>
        <View style={retreatStyles.formField}>
          <Text style={retreatStyles.formLabel}>형식</Text>
          <ChipSelect options={PLACE_SORT_OPTIONS} value={sort} onChange={setSort} />
        </View>
        <View style={retreatStyles.formField}>
          <Text style={retreatStyles.formLabel}>지역</Text>
          <ChipSelect options={['선택', ...RETREAT_REGIONS]} value={region} onChange={setRegion} />
        </View>
        <View style={retreatStyles.formField}>
          <Text style={retreatStyles.formLabel}>장소명</Text>
          <TextInput
            style={retreatStyles.formInput}
            value={placeName}
            onChangeText={setPlaceName}
            onFocus={scrollInputIntoView}
          />
        </View>
        <View style={retreatStyles.formField}>
          <Text style={retreatStyles.formLabel}>크기</Text>
          <ChipSelect options={PLACE_SIZE_OPTIONS} value={size} onChange={setSize} />
        </View>
        <View style={retreatStyles.formField}>
          <Text style={retreatStyles.formLabel}>위치</Text>
          <TextInput
            style={retreatStyles.formInput}
            value={location}
            onChangeText={setLocation}
            placeholder="시/군/구"
            onFocus={scrollInputIntoView}
          />
        </View>
        <View style={retreatStyles.formField}>
          <Text style={retreatStyles.formLabel}>주소</Text>
          <TextInput
            style={retreatStyles.formInput}
            value={address}
            onChangeText={setAddress}
            placeholder="상세 주소"
            onFocus={scrollInputIntoView}
          />
        </View>
        <View style={retreatStyles.formField}>
          <Text style={retreatStyles.formLabel}>장소연락처</Text>
          <TextInput
            style={retreatStyles.formInput}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            onFocus={scrollInputIntoView}
          />
        </View>
        <View style={retreatStyles.formField}>
          <Text style={retreatStyles.formLabel}>홈페이지</Text>
          <TextInput
            style={retreatStyles.formInput}
            value={homepage}
            onChangeText={setHomepage}
            autoCapitalize="none"
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
