import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import axios from 'axios';
import { MAIN_API_BASE } from '../../../config/api';
import {
  FloatingScrollActions,
  LIST_FAB_SCROLL_PADDING,
  ListLoadMoreFooter,
  useListScrollToTop,
} from '../../shared/listScrollUi';
import { StickySearchBar } from '../../shared/StickySearchBar';
import { WorshipCategoryTabs } from '../worshipCategoryContext';
import { worshipColors as c } from '../worshipTheme';
import {
  WorshipFilterBtn,
  WorshipFilterGroup,
  WorshipInfoBox,
  WorshipSectionHeading,
  WorshipSelectRow,
  WorshipWhiteCard,
} from '../worshipUi';
import { WORSHIP_THEMES } from './worshipThemes';
import type { SongsStackParamList } from './SongsStack';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');
const PAGE_SIZE = 15;
const TOPIC_COLS = 5;
const TOPIC_GAP = 8;
const FIND_MODE_SECTION_PADDING = 14;

type SongRow = {
  id: number;
  title: string;
  theme: string;
  stateSort: string;
  keySort: string;
  tempoSort: string;
  image: string;
  source: string;
  lyrics: string;
  pptlist?: string;
  youtubelist?: string;
  date?: string;
  [k: string]: unknown;
};

type Filters = {
  searchWord: string;
  stateSort: '' | '찬송가' | '복음송';
  keySort: '' | 'C' | 'Db' | 'D' | 'Eb' | 'E' | 'F' | 'G' | 'Ab' | 'A' | 'Bb' | 'B';
  tempoSort: '' | '느린' | '빠른' | '느림' | '빠름';
};

const STATE_OPTIONS = ['', '찬송가', '복음송'] as const;
const KEY_OPTIONS = ['', 'C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const TEMPO_OPTIONS = ['', '느린', '빠른'] as const;

function normalizeTempo(t: string) {
  if (t === '느린') return '느림';
  if (t === '빠른') return '빠름';
  return t;
}

function labelOrAll(value: string, all = '전체') {
  return value || all;
}

export function SongsList() {
  const navigation = useNavigation<NativeStackNavigationProp<SongsStackParamList, 'List'>>();
  const { width: windowWidth } = useWindowDimensions();
  const topicCellWidth =
    (windowWidth -
      FIND_MODE_SECTION_PADDING * 2 -
      TOPIC_GAP * (TOPIC_COLS - 1)) /
    TOPIC_COLS;

  const [listView, setListView] = useState<SongRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({
    searchWord: '',
    stateSort: '',
    keySort: '',
    tempoSort: '',
  });

  const [findMode, setFindMode] = useState<'theme' | 'song'>('theme');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchPage = useCallback(async (page: number, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await axios.get(`${API_BASE}/worshipsongs/getsongs/${page}`);
      const newItems: SongRow[] = Array.isArray(res.data?.resultData)
        ? res.data.resultData
        : [];
      setListView(prev => (append ? [...prev, ...newItems] : newItems));
      setHasMore(newItems.length >= PAGE_SIZE);
    } catch {
      if (!append) {
        setListView([]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setIsSearching(false);
    setSelectedThemes([]);
    setCurrentPage(1);
    setHasMore(true);
    void fetchPage(1);
  }, [fetchPage]);

  const handleLoadMore = () => {
    if (isLoading || isLoadingMore || isSearching || !hasMore) return;
    const next = currentPage + 1;
    setCurrentPage(next);
    void fetchPage(next, true);
  };

  const resetToDefaultList = useCallback(() => {
    setIsSearching(false);
    setSelectedThemes([]);
    setCurrentPage(1);
    setHasMore(true);
    void fetchPage(1);
  }, [fetchPage]);

  const runFilterSearch = useCallback(
    async (next: Filters) => {
      const { searchWord, stateSort, keySort, tempoSort } = next;
      const active =
        !!searchWord.trim() || !!stateSort || !!keySort || !!tempoSort;

      setFilters(next);

      if (!active) {
        resetToDefaultList();
        return;
      }

      setIsSearching(true);
      setIsLoading(true);
      setHasMore(false);
      try {
        const res = await axios.post(`${API_BASE}/worshipsongs/getsongsfilter`, {
          word: searchWord || '',
          stateSort: stateSort || '',
          keySort: keySort || '',
          tempoSort: normalizeTempo(tempoSort || ''),
        });
        const rows: SongRow[] = Array.isArray(res.data?.resultData)
          ? res.data.resultData
          : [];
        setListView(rows);
      } finally {
        setIsLoading(false);
      }
    },
    [resetToDefaultList],
  );

  const handleThemeSearching = async (themes: string[]) => {
    setIsSearching(true);
    setIsLoading(true);
    setHasMore(false);
    setSelectedThemes(themes);
    try {
      const res = await axios.post(`${API_BASE}/worshipsongs/getsongssearchtheme`, {
        theme: themes,
      });
      const rows: SongRow[] = Array.isArray(res.data?.resultData)
        ? res.data.resultData
        : [];
      setListView(rows);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    void runFilterSearch({ searchWord: '', stateSort: '', keySort: '', tempoSort: '' });
  };

  const renderSongRow = ({ item }: { item: SongRow }) => {
    const themes = String(item.theme || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    return (
      <Pressable
        style={({ pressed }) => [styles.songRow, pressed && styles.songRowPressed]}
        onPress={() => navigation.navigate('Detail', { id: Number(item.id) })}>
        <View style={styles.songRowTop}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.stateSort}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.keySort}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.tempoSort}</Text>
          </View>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <View style={styles.songRowBottom}>
          <View style={styles.themeLine}>
            {themes.slice(0, 6).map(t => (
              <Text
                key={`${item.id}-${t}`}
                style={[
                  styles.themeText,
                  selectedThemes.indexOf(t) >= 0 && styles.themeTextSelected,
                ]}>
                {t}
              </Text>
            ))}
          </View>
          <Text style={styles.moreText}>자세히</Text>
        </View>
      </Pressable>
    );
  };

  const switchToThemeMode = () => {
    setFindMode('theme');
  };

  const switchToSongMode = () => {
    setFindMode('song');
    if (selectedThemes.length > 0) {
      resetToDefaultList();
    }
  };

  const themePickerCollapsed = selectedThemes.length > 0;
  const visibleThemes = themePickerCollapsed
    ? WORSHIP_THEMES.filter(t => selectedThemes.indexOf(t) >= 0)
    : WORSHIP_THEMES;

  const listHeader = (
    <>
      <View style={styles.findModeSection}>
        <View style={styles.findModeRow}>
          <Pressable
            style={[styles.findModeBtn, findMode === 'theme' && styles.findModeBtnActive]}
            onPress={switchToThemeMode}>
            <Text
              style={[
                styles.findModeBtnText,
                findMode === 'theme' && styles.findModeBtnTextActive,
              ]}>
              주제어로 찾기
            </Text>
          </Pressable>
          <Pressable
            style={[styles.findModeBtn, findMode === 'song' && styles.findModeBtnActive]}
            onPress={switchToSongMode}>
            <Text
              style={[
                styles.findModeBtnText,
                findMode === 'song' && styles.findModeBtnTextActive,
              ]}>
              곡목
            </Text>
          </Pressable>
        </View>

        {findMode === 'song' ? (
          <WorshipWhiteCard>
            <WorshipFilterGroup
              label="구분"
              icon="category"
              onReset={() => void runFilterSearch({ ...filters, stateSort: '' })}>
              {STATE_OPTIONS.map(v => (
                <WorshipFilterBtn
                  key={`state-${v || 'all'}`}
                  label={v || '전체'}
                  active={filters.stateSort === v}
                  onPress={() => void runFilterSearch({ ...filters, stateSort: v })}
                />
              ))}
            </WorshipFilterGroup>

            <WorshipFilterGroup
              label="KEY"
              icon="music-note"
              onReset={() => void runFilterSearch({ ...filters, keySort: '' })}>
              {KEY_OPTIONS.map(v => (
                <WorshipFilterBtn
                  key={`key-${v || 'all'}`}
                  label={v || '전체'}
                  active={filters.keySort === v}
                  variant="key"
                  onPress={() => void runFilterSearch({ ...filters, keySort: v })}
                />
              ))}
            </WorshipFilterGroup>

            <WorshipFilterGroup
              label="TEMPO"
              icon="speed"
              onReset={() => void runFilterSearch({ ...filters, tempoSort: '' })}>
              {TEMPO_OPTIONS.map(v => (
                <WorshipFilterBtn
                  key={`tempo-${v || 'all'}`}
                  label={v || '전체'}
                  active={filters.tempoSort === v}
                  onPress={() => void runFilterSearch({ ...filters, tempoSort: v })}
                />
              ))}
            </WorshipFilterGroup>
          </WorshipWhiteCard>
        ) : (
          <>
            {!themePickerCollapsed ? (
              <WorshipInfoBox>
                설교 후 부를 찬양을 찾으시려면, 설교 주제와 동일한 주제어를 아래에서 찾아
                누르면 해당 주제의 찬양이 나옵니다.
              </WorshipInfoBox>
            ) : null}

            <View
              style={[
                styles.topicGrid,
                themePickerCollapsed && styles.topicGridCollapsed,
              ]}>
              {visibleThemes.map(theme => {
                const selected = selectedThemes.indexOf(theme) >= 0;
                return (
                  <Pressable
                    key={theme}
                    style={[
                      styles.topicItem,
                      !themePickerCollapsed && { width: topicCellWidth },
                      themePickerCollapsed && styles.topicItemCollapsed,
                      themePickerCollapsed && selected && styles.topicItemCollapsedSelected,
                      !themePickerCollapsed && selected && styles.topicItemSelected,
                    ]}
                    onPress={() => {
                      if (themePickerCollapsed) return;
                      void handleThemeSearching([theme]);
                    }}>
                    <Text
                      style={[
                        styles.topicItemText,
                        themePickerCollapsed && selected && styles.topicItemTextCollapsedSelected,
                        !themePickerCollapsed && selected && styles.topicItemTextSelected,
                      ]}
                      numberOfLines={2}>
                      {theme}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {themePickerCollapsed ? (
              <Pressable
                style={({ pressed }) => [
                  styles.themeReselectBtn,
                  pressed && styles.themeReselectBtnPressed,
                ]}
                onPress={resetToDefaultList}>
                <Text style={styles.themeReselectBtnText}>다시 선택</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>

      {listView.length > 0 ? (
        <Text style={styles.resultsLabel}>
          {isSearching ? '검색 결과' : '찬양 목록'} · {listView.length}곡
        </Text>
      ) : null}
    </>
  );

  const { listRef, showTopBtn, onScroll, scrollToTop } = useListScrollToTop<SongRow>();

  const submitSongSearch = () => {
    const active =
      !!filters.searchWord.trim() ||
      !!filters.stateSort ||
      !!filters.keySort ||
      !!filters.tempoSort;
    if (!active) {
      Alert.alert('', '검색 조건을 입력/선택해주세요');
      return;
    }
    void runFilterSearch(filters);
  };

  const hasActiveSongFilters =
    isSearching ||
    !!filters.stateSort ||
    !!filters.keySort ||
    !!filters.tempoSort ||
    selectedThemes.length > 0;

  return (
    <View style={styles.root}>
      <WorshipCategoryTabs />
      <StickySearchBar
        placeholder="곡명 검색"
        value={filters.searchWord}
        onChangeText={t => setFilters(prev => ({ ...prev, searchWord: t }))}
        onSubmitSearch={submitSongSearch}
        onClear={handleReset}
        showClearWhenEmpty={hasActiveSongFilters}
      />
      <FlatList
        ref={listRef}
        data={listView}
        keyExtractor={item => String(item.id)}
        renderItem={renderSongRow}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[styles.content, { paddingBottom: LIST_FAB_SCROLL_PADDING }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.rowGap} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={styles.loader} color={c.primary} />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
            </View>
          )
        }
        ListFooterComponent={isLoadingMore ? <ListLoadMoreFooter /> : null}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
      />
      <FloatingScrollActions showTop={showTopBtn} onScrollToTop={scrollToTop} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { paddingBottom: 8 },
  findModeSection: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4, gap: 12 },
  findModeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  findModeBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: c.border,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findModeBtnActive: {
    borderColor: c.primary,
    backgroundColor: c.infoBg,
  },
  findModeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: c.textMuted,
  },
  findModeBtnTextActive: {
    color: c.primary,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TOPIC_GAP,
  },
  topicGridCollapsed: {
    width: '100%',
    flexDirection: 'column',
  },
  topicItem: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  topicItemCollapsed: {
    width: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  topicItemCollapsedSelected: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  topicItemSelected: {
    backgroundColor: c.infoBg,
    borderColor: c.primary,
  },
  topicItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  topicItemTextSelected: {
    color: c.primary,
    fontWeight: '700',
  },
  topicItemTextCollapsedSelected: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  themeReselectBtn: {
    alignSelf: 'center',
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.card,
  },
  themeReselectBtnPressed: { opacity: 0.88 },
  themeReselectBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textMuted,
  },
  resultsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  loader: { paddingVertical: 30, marginHorizontal: 16 },
  emptyBox: {
    marginHorizontal: 16,
    paddingVertical: 50,
    alignItems: 'center',
    backgroundColor: c.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
  },
  emptyText: { fontSize: 15, color: c.textMuted },
  rowGap: { height: 8 },
  songRow: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: c.card,
    gap: 10,
  },
  songRowPressed: { opacity: 0.92 },
  songRowTop: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: c.infoBg,
  },
  badgeText: { fontSize: 11, color: c.primary, fontWeight: '700' },
  songTitle: { flex: 1, minWidth: 120, fontSize: 15, fontWeight: '700', color: c.text },
  songRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  themeLine: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  themeText: { fontSize: 11, color: c.textMuted },
  themeTextSelected: { color: c.primary, fontWeight: '700' },
  moreText: { fontSize: 12, color: c.primary, fontWeight: '600' },
});
