import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAtomValue } from 'jotai';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import axios from 'axios';
import { MAIN_API_BASE } from '../../../config/api';
import { trackAppCountup } from '../../../analytics/adminStats';
import { RECRUIT_CITY_NAMES } from '../../../data/recruitRegions';
import { jobColors } from '../common/jobsTheme';
import {
  RecruitJobCard,
  RECRUIT_CHURCH_LOGO_PATH_MINISTER,
  RecruitListFilterPanel,
  RecruitResultHeader,
  type FilterDropdownKey,
} from '../common/recruitUi';
import {
  FloatingScrollActions,
  LIST_FAB_SCROLL_PADDING_WITH_WRITE,
  ListLoadMoreFooter,
  useListScrollToTop,
} from '../../shared/listScrollUi';
import { StickySearchBar } from '../../shared/StickySearchBar';
import { JobsCategoryTabs } from '../jobsCategoryContext';
import type { MinisterStackParamList } from './MinisterStack';
import { loadSessionUser } from '../../../login/sessionStorage';
import { promptLogin, requireLogin } from '../../../navigation/authPrompt';
import { isLoggedInAtom } from '../../../state/atoms';
import { fetchScrapStatusMap, scrapKeyOf, toggleScrap } from '../../../shared/scrapApi';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');
const MINISTER_SORTS = ['담임', '전임', '준전임', '파트'];
const RELIGIOUSBODY_LIST = [
  '기독교대한감리회',
  '기독교대한성결교회',
  '기독교대한하나님의성회',
  '기독교한국침례회',
  '대한기독교나사렛성결회',
  '대한예수교장로회고신',
  '대한예수교장로회통합',
  '대한예수교장로회합동',
  '대한예수교장로회합신',
  '예수교대한성결교회',
  '한국기독교장로회',
  '독립교단(KAICAM)',
  '기타교단',
];
const ITEMS_PER_PAGE = 10;

type RecruitRow = {
  id: string;
  title: string;
  source: string;
  date: string;
  church: string;
  religiousbody: string;
  location: string;
  locationDetail: string;
  sort: string;
  pay: string | null;
  part: string | null;
  applytime: string | null;
  [key: string]: unknown;
};

function pad2(n: number) {
  const s = String(n);
  return s.length > 1 ? s : `0${s}`;
}

export function MinisterList() {
  const navigation = useNavigation<NativeStackNavigationProp<MinisterStackParamList, 'List'>>();
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const [listView, setListView] = useState<RecruitRow[]>([]);
  const [searchResult, setSearchResult] = useState<RecruitRow[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [listAllLength, setListAllLength] = useState(0);
  const [listAllLengthOrigin, setListAllLengthOrigin] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchVisibleCount, setSearchVisibleCount] = useState(ITEMS_PER_PAGE);

  const [activeDropdown, setActiveDropdown] = useState<FilterDropdownKey>('직무');
  const [searchWord, setSearchWord] = useState('');
  const [selectedSort, setSelectedSort] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string[]>([]);
  const [selectedReligiousbody, setSelectedReligiousbody] = useState<string[]>(
    [],
  );
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

  useEffect(() => {
    if (searchResult != null) return;
    let cancelled = false;
    const isFirstPage = currentPage === 1;
    if (isFirstPage) setLoading(true);
    else setLoadingMore(true);
    (async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/recruitminister/getrecruitdata/${currentPage}`,
        );
        if (cancelled) return;
        if (res.data?.resultData) {
          const total = res.data.totalCount ?? 0;
          const newItems = res.data.resultData as RecruitRow[];
          setListView(prev => (isFirstPage ? newItems : [...prev, ...newItems]));
          setListAllLength(total);
          if (isFirstPage) setListAllLengthOrigin(total);
        }
      } catch {
        if (!cancelled && isFirstPage) setListView([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentPage, refresh, searchResult]);

  const filterByAllConditions = useCallback(
    (data: RecruitRow[]) =>
      data.filter(item => {
        const sortOk =
          selectedSort.length === 0 ||
          selectedSort.some(s => String(item.sort || '').indexOf(s) >= 0);
        const locationOk =
          selectedLocation.length === 0 ||
          selectedLocation.some(
            loc =>
              String(item.location || '') === loc ||
              String(item.location || '').indexOf(loc) >= 0,
          );
        const religiousbodyOk =
          selectedReligiousbody.length === 0 ||
          selectedReligiousbody.indexOf(String(item.religiousbody || '')) >= 0;
        return sortOk && locationOk && religiousbodyOk;
      }),
    [selectedLocation, selectedReligiousbody, selectedSort],
  );

  const currentSearchTerms = useMemo(() => {
    const terms = [...selectedSort, ...selectedLocation, ...selectedReligiousbody];
    if (searchWord.trim()) terms.push(searchWord.trim());
    return terms;
  }, [selectedSort, selectedLocation, selectedReligiousbody, searchWord]);

  const hasFilterSelection = useMemo(
    () =>
      selectedSort.length > 0 ||
      selectedLocation.length > 0 ||
      selectedReligiousbody.length > 0,
    [selectedSort, selectedLocation, selectedReligiousbody],
  );

  const handleSelect = (item: string, type: '직무' | '지역' | '교단') => {
    if (type === '직무') {
      setSelectedSort(prev =>
        prev.indexOf(item) >= 0 ? prev.filter(i => i !== item) : [...prev, item],
      );
      return;
    }
    if (type === '지역') {
      setSelectedLocation(prev =>
        prev.indexOf(item) >= 0 ? prev.filter(i => i !== item) : [...prev, item],
      );
      return;
    }
    setSelectedReligiousbody(prev =>
      prev.indexOf(item) >= 0 ? prev.filter(i => i !== item) : [...prev, item],
    );
  };

  const resetToDefaultList = useCallback(() => {
    setSearchResult(null);
    setCurrentPage(1);
    setListView([]);
    setSearchVisibleCount(ITEMS_PER_PAGE);
    setListAllLength(listAllLengthOrigin);
    setRefresh(r => !r);
  }, [listAllLengthOrigin]);

  const handleClearSearch = () => {
    setSelectedSort([]);
    setSelectedLocation([]);
    setSelectedReligiousbody([]);
    setSearchWord('');
    resetToDefaultList();
  };

  const runSearch = useCallback(async () => {
    setSearching(true);
    setCurrentPage(1);
    setSearchVisibleCount(ITEMS_PER_PAGE);
    try {
      const res = await axios.post(`${API_BASE}/recruitminister/recruitsearchunified`, {
        searchWord: searchWord || '',
        sort: selectedSort,
        location: selectedLocation,
        religiousbody: selectedReligiousbody,
      });
      if (res.data?.resultData) {
        const filtered = filterByAllConditions(res.data.resultData);
        const sorted = filtered.sort(
          (a: RecruitRow, b: RecruitRow) => Number(b.id) - Number(a.id),
        );
        setSearchResult(sorted);
        setListAllLength(sorted.length);
      } else {
        setSearchResult([]);
        setListAllLength(0);
      }
    } catch {
      setSearchResult([]);
      setListAllLength(0);
    } finally {
      setSearching(false);
    }
  }, [
    searchWord,
    selectedSort,
    selectedLocation,
    selectedReligiousbody,
    filterByAllConditions,
  ]);

  const handleUnifiedSearch = () => {
    if (!searchWord.trim() && !hasFilterSelection) {
      Alert.alert('', '검색 조건을 입력/선택해주세요');
      return;
    }
    void runSearch();
  };

  useEffect(() => {
    if (!hasFilterSelection) {
      if (!searchWord.trim()) {
        if (searchResult !== null) {
          resetToDefaultList();
        }
        return;
      }
      if (searchResult !== null) {
        void runSearch();
      }
      return;
    }
    void runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 필터 변경 시에만 즉시 검색
  }, [selectedSort, selectedLocation, selectedReligiousbody]);

  const displayList = searchResult
    ? searchResult.slice(0, searchVisibleCount)
    : listView;
  const hasMore = searchResult
    ? searchVisibleCount < searchResult.length
    : listView.length < listAllLength;

  const loadMore = useCallback(() => {
    if (loading || loadingMore || searching) return;
    if (searchResult) {
      if (searchVisibleCount < searchResult.length) {
        setSearchVisibleCount(c =>
          Math.min(c + ITEMS_PER_PAGE, searchResult.length),
        );
      }
      return;
    }
    if (listView.length < listAllLength) {
      setCurrentPage(p => p + 1);
    }
  }, [
    loading,
    loadingMore,
    searching,
    searchResult,
    searchVisibleCount,
    listView.length,
    listAllLength,
  ]);

  const openDetail = (item: RecruitRow) => {
    void trackAppCountup('recruitview');
    navigation.navigate('Detail', { id: String(item.id) });
  };

  const openPostPage = () => {
    if (!requireLogin(isLoggedIn)) return;
    navigation.navigate('Write');
  };

  const filterItems =
    activeDropdown === '지역'
      ? [...RECRUIT_CITY_NAMES]
      : activeDropdown === '교단'
        ? RELIGIOUSBODY_LIST
        : [];
  const allSelectedTags = useMemo(
    () => [...selectedSort, ...selectedLocation, ...selectedReligiousbody],
    [selectedSort, selectedLocation, selectedReligiousbody],
  );

  const clearAllFilters = () => {
    setSelectedSort([]);
    setSelectedLocation([]);
    setSelectedReligiousbody([]);
  };

  const removeFilterTag = (item: string) => {
    if (selectedSort.indexOf(item) >= 0) {
      handleSelect(item, '직무');
    } else if (selectedLocation.indexOf(item) >= 0) {
      handleSelect(item, '지역');
    } else {
      handleSelect(item, '교단');
    }
  };

  const { listRef, showTopBtn, onScroll, scrollToTop } = useListScrollToTop<RecruitRow>();

  useEffect(() => {
    if (!userAccount || displayList.length === 0) {
      setScrapMap({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const targets = displayList.map(item => ({
          targetType: 'recruit' as const,
          targetId: String(item.id),
          tableType: 'minister',
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
  }, [userAccount, displayList]);

  const onToggleScrap = async (item: RecruitRow) => {
    if (!userAccount) {
      promptLogin();
      return;
    }
    const payload = {
      targetType: 'recruit' as const,
      targetId: String(item.id),
      tableType: 'minister',
      title: String(item.title || ''),
      subtitle: String(item.church || ''),
      meta: `${String(item.location || '')} ${String(item.locationDetail || '')}`.trim(),
      linkPath: `/recruit/recruitministerdetail?id=${item.id}`,
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

  const renderRecruitItem = ({ item }: { item: RecruitRow }) => {
    const highlight = !!searchResult;
    return (
      <View style={styles.cardWrap}>
        <RecruitJobCard
          item={{
            id: String(item.id),
            title: String(item.title || ''),
            church: String(item.church || ''),
            churchLogo: item.churchLogo ? String(item.churchLogo) : undefined,
            religiousbody: String(item.religiousbody || ''),
            source: String(item.source || ''),
            location: String(item.location || ''),
            locationDetail: String(item.locationDetail || ''),
            sort: String(item.sort || ''),
            pay: item.pay as string | null,
            date: String(item.date || ''),
          }}
          onPress={() => openDetail(item)}
          onToggleScrap={() => void onToggleScrap(item)}
          scrapped={Boolean(scrapMap[scrapKeyOf({ targetType: 'recruit', targetId: String(item.id), tableType: 'minister' })])}
          highlight={highlight}
          highlightTerms={currentSearchTerms}
          churchLogoBasePath={RECRUIT_CHURCH_LOGO_PATH_MINISTER}
        />
      </View>
    );
  };

  const listHeader = (
    <>
      <RecruitListFilterPanel
        title="사역자구인"
        dropdowns={['직무', '지역', '교단']}
        activeDropdown={activeDropdown}
        onDropdownChange={setActiveDropdown}
        filterItems={filterItems}
        isFilterSelected={item =>
          (activeDropdown === '지역' && selectedLocation.indexOf(item) >= 0) ||
          (activeDropdown === '교단' && selectedReligiousbody.indexOf(item) >= 0)
        }
        onFilterPress={item => handleSelect(item, activeDropdown)}
        quickRoles={MINISTER_SORTS}
        selectedRoles={selectedSort}
        onRolePress={role => handleSelect(role, '직무')}
        selectedTags={allSelectedTags}
        onRemoveTag={removeFilterTag}
        onClearAllTags={clearAllFilters}
        renderFilterItem={
          activeDropdown === '교단'
            ? item => (
                <View style={styles.filterWithIcon}>
                  <Image
                    source={{
                      uri: `${API_BASE}/siteimages/religiousbody/${encodeURIComponent(item)}.jpg`,
                    }}
                    style={styles.filterTinyIcon}
                  />
                  <Text style={styles.filterChipLabel} numberOfLines={2}>
                    {item}
                  </Text>
                </View>
              )
            : undefined
        }
      />
      <RecruitResultHeader
        totalCount={listAllLength}
        loading={(loading || searching) && displayList.length === 0}
      />
    </>
  );

  return (
    <View style={styles.root}>
      <JobsCategoryTabs />
      <StickySearchBar
        placeholder="교회명, 제목으로 검색"
        value={searchWord}
        onChangeText={setSearchWord}
        onSubmitSearch={handleUnifiedSearch}
        onClear={handleClearSearch}
        showClearWhenEmpty={hasFilterSelection || searchResult != null}
      />
      <FlatList
        ref={listRef}
        data={displayList}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderRecruitItem}
        ItemSeparatorComponent={() => <View style={styles.cardGap} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          loading && !searchResult ? (
            <ActivityIndicator style={styles.loader} color="#4f5460" />
          ) : searching ? (
            <ActivityIndicator style={styles.loader} color="#4f5460" />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
            </View>
          )
        }
        ListFooterComponent={loadingMore ? <ListLoadMoreFooter /> : null}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: LIST_FAB_SCROLL_PADDING_WITH_WRITE },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.35}
      />
      <FloatingScrollActions
        showTop={showTopBtn}
        onScrollToTop={scrollToTop}
        onWrite={openPostPage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: jobColors.bg },
  scrollContent: { paddingTop: 4, paddingBottom: 8 },
  cardWrap: { paddingHorizontal: 16 },
  cardGap: { height: 8 },
  filterWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  filterTinyIcon: { width: 18, height: 18, borderRadius: 4 },
  filterChipLabel: { fontSize: 11, color: jobColors.textSecondary, flex: 1 },
  loader: { paddingVertical: 40 },
  emptyBox: {
    marginHorizontal: 16,
    paddingVertical: 60,
    alignItems: 'center',
    backgroundColor: jobColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: jobColors.border,
    marginVertical: 16,
  },
  emptyText: { fontSize: 16, color: jobColors.textMuted },
});
