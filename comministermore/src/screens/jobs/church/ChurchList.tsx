import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import axios from 'axios';
import { MAIN_API_BASE } from '../../../config/api';
import { RECRUIT_CITY_NAMES } from '../../../data/recruitRegions';
import { jobColors } from '../common/jobsTheme';
import {
  RecruitJobCard,
  RECRUIT_CHURCH_LOGO_PATH_SITE,
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
import type { ChurchStackParamList } from './ChurchStack';
import { loadSessionUser } from '../../../login/sessionStorage';
import { fetchScrapStatusMap, scrapKeyOf, toggleScrap } from '../../../shared/scrapApi';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');
const CHURCH_JOB_SORTS = ['찬양대', '방송', '직원'];
const ITEMS_PER_PAGE = 10;

type RecruitRow = {
  id: string;
  title: string;
  source: string;
  date: string;
  church: string;
  churchLogo?: string;
  religiousbody: string;
  location: string;
  locationDetail: string;
  sort?: string;
  pay?: string | null;
  part: string | null;
  applytime: string | null;
  [key: string]: unknown;
};

function pad2(n: number) {
  const s = String(n);
  return s.length > 1 ? s : `0${s}`;
}

function churchSortLabel(title: string): string {
  for (const label of CHURCH_JOB_SORTS) {
    if (title.includes(label)) return label;
  }
  return String(title || '').slice(0, 8);
}

export function ChurchList() {
  const navigation = useNavigation<NativeStackNavigationProp<ChurchStackParamList, 'List'>>();
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
          `${API_BASE}/recruitchurch/getrecruitdata/${currentPage}`,
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
          selectedSort.some(s => String(item.title || '').indexOf(s) >= 0);
        const locationOk =
          selectedLocation.length === 0 ||
          selectedLocation.some(
            loc =>
              String(item.location || '') === loc ||
              String(item.location || '').indexOf(loc) >= 0,
          );
        return sortOk && locationOk;
      }),
    [selectedLocation, selectedSort],
  );

  const currentSearchTerms = useMemo(() => {
    const terms = [...selectedSort, ...selectedLocation];
    if (searchWord.trim()) terms.push(searchWord.trim());
    return terms;
  }, [selectedSort, selectedLocation, searchWord]);

  const hasFilterSelection = useMemo(
    () => selectedSort.length > 0 || selectedLocation.length > 0,
    [selectedSort, selectedLocation],
  );

  const handleSelect = (item: string, type: '직무' | '지역') => {
    if (type === '직무') {
      setSelectedSort(prev =>
        prev.indexOf(item) >= 0 ? prev.filter(i => i !== item) : [...prev, item],
      );
      return;
    }
    setSelectedLocation(prev =>
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
    setSearchWord('');
    resetToDefaultList();
  };

  const runSearch = useCallback(async () => {
    setSearching(true);
    setCurrentPage(1);
    setSearchVisibleCount(ITEMS_PER_PAGE);
    try {
      const res = await axios.post(`${API_BASE}/recruitchurch/recruitsearchunified`, {
        searchWord: searchWord || '',
        sort: selectedSort,
        location: selectedLocation,
        religiousbody: [],
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
  }, [searchWord, selectedSort, selectedLocation, filterByAllConditions]);

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
  }, [selectedSort, selectedLocation]);

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
    const today = new Date();
    const date = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
    axios.post(`${API_BASE}/admin/countup`, { date, type: 'recruitview' }).catch(() => null);
    navigation.navigate('Detail', { id: String(item.id) });
  };

  const openPostPage = () => {
    navigation.navigate('Write');
  };

  const filterItems = activeDropdown === '지역' ? [...RECRUIT_CITY_NAMES] : [];
  const allSelectedTags = useMemo(
    () => [...selectedSort, ...selectedLocation],
    [selectedSort, selectedLocation],
  );

  const clearAllFilters = () => {
    setSelectedSort([]);
    setSelectedLocation([]);
  };

  const removeFilterTag = (item: string) => {
    handleSelect(item, selectedSort.indexOf(item) >= 0 ? '직무' : '지역');
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
          tableType: 'church',
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
      Alert.alert('', '로그인이 필요합니다.');
      return;
    }
    const payload = {
      targetType: 'recruit' as const,
      targetId: String(item.id),
      tableType: 'church',
      title: String(item.title || ''),
      subtitle: String(item.church || ''),
      meta: `${String(item.location || '')} ${String(item.locationDetail || '')}`.trim(),
      linkPath: `/recruit/recruitchoirdetail?id=${item.id}`,
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
    const title = String(item.title || '');
    return (
      <View style={styles.cardWrap}>
        <RecruitJobCard
          item={{
            id: String(item.id),
            title,
            church: String(item.church || ''),
            religiousbody: String(item.religiousbody || ''),
            source: String(item.source || ''),
            location: String(item.location || ''),
            locationDetail: String(item.locationDetail || ''),
            sort: String(item.sort || '') || churchSortLabel(title),
            pay: (item.pay as string | null) ?? null,
            date: String(item.date || ''),
          }}
          onPress={() => openDetail(item)}
          onToggleScrap={() => void onToggleScrap(item)}
          scrapped={Boolean(scrapMap[scrapKeyOf({ targetType: 'recruit', targetId: String(item.id), tableType: 'church' })])}
          highlight={highlight}
          highlightTerms={currentSearchTerms}
          churchLogoBasePath={RECRUIT_CHURCH_LOGO_PATH_SITE}
        />
      </View>
    );
  };

  const listHeader = (
    <>
      <RecruitListFilterPanel
        title="찬양대/방송/직원 구인"
        dropdowns={['직무', '지역']}
        activeDropdown={activeDropdown}
        onDropdownChange={setActiveDropdown}
        filterItems={filterItems}
        isFilterSelected={item => selectedLocation.indexOf(item) >= 0}
        onFilterPress={item =>
          handleSelect(item, activeDropdown === '지역' ? '지역' : '직무')
        }
        quickRoles={CHURCH_JOB_SORTS}
        selectedRoles={selectedSort}
        onRolePress={role => handleSelect(role, '직무')}
        selectedTags={allSelectedTags}
        onRemoveTag={removeFilterTag}
        onClearAllTags={clearAllFilters}
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
