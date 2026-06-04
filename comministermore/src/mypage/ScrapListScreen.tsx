import { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { loadSessionUser } from '../login/sessionStorage';
import { SubStackScreenShell } from '../navigation/SubStackScreenShell';
import { fetchScrapList, type ScrapListItem } from '../shared/scrapApi';
import { mpColors } from '../screens/shared/mypageTheme';
import { useListScrollToTop } from '../screens/shared/listScrollUi';

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'recruit', label: '구인구직' },
  { id: 'retreat_place', label: '수련회 장소' },
  { id: 'retreat_casting', label: '수련회 강사' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

export function ScrapListScreen() {
  const navigation = useNavigation();
  const { listRef, onScroll } = useListScrollToTop<ScrapListItem>();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterId>('all');
  const [list, setList] = useState<ScrapListItem[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await loadSessionUser();
      const userAccount = user?.userAccount || '';
      const data = await fetchScrapList(userAccount);
      setList(data);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const filtered = filter === 'all' ? list : list.filter(item => item.targetType === filter);

  const openItem = (item: ScrapListItem) => {
    const parentNav = navigation.getParent();
    if (!parentNav) {
      Alert.alert('', '화면 이동에 실패했습니다.');
      return;
    }
    const rootNav = parentNav as any;
    if (item.targetType === 'recruit') {
      const category =
        item.tableType === 'church'
          ? 'church'
          : item.tableType === 'institute'
            ? 'institute'
            : 'minister';
      rootNav.navigate('Jobs', { open: { category, id: String(item.targetId) } });
      return;
    }
    if (item.targetType === 'retreat_place') {
      rootNav.navigate('Retreat', { open: { category: 'place', id: Number(item.targetId) } });
      return;
    }
    rootNav.navigate('Retreat', { open: { category: 'casting', id: Number(item.targetId) } });
  };

  return (
    <SubStackScreenShell title="스크랩 관리">
      <View style={styles.content}>
        <View style={styles.filterRow}>
          {FILTERS.map(tab => (
            <Pressable
              key={tab.id}
              style={[styles.filterBtn, filter === tab.id && styles.filterBtnOn]}
              onPress={() => setFilter(tab.id)}>
              <Text style={[styles.filterText, filter === tab.id && styles.filterTextOn]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          ref={listRef}
          data={filtered}
          keyExtractor={item => String(item.id)}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          onScroll={onScroll}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{loading ? '불러오는 중...' : '스크랩한 항목이 없습니다.'}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => void openItem(item)}>
              <View style={styles.cardTop}>
                <Text style={styles.typeTag}>{item.targetType}</Text>
                <MaterialIcons name="open-in-new" size={18} color="#6b7280" />
              </View>
              <Text style={styles.title} numberOfLines={2}>
                {item.title || '(제목 없음)'}
              </Text>
              {item.subtitle ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              ) : null}
              {item.meta ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {item.meta}
                </Text>
              ) : null}
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleString('ko-KR')}</Text>
            </Pressable>
          )}
        />
      </View>
    </SubStackScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16 },
  list: { flex: 1 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  filterBtn: {
    borderWidth: 1,
    borderColor: '#cfd8e6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  filterBtnOn: {
    backgroundColor: mpColors.primary,
    borderColor: mpColors.primary,
  },
  filterText: { fontSize: 12, fontWeight: '700', color: '#4b5563' },
  filterTextOn: { color: '#fff' },
  listContent: { paddingBottom: 30 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeTag: { fontSize: 11, color: mpColors.primary, fontWeight: '800' },
  title: { fontSize: 15, fontWeight: '700', color: '#111827', lineHeight: 22 },
  subtitle: { fontSize: 13, color: '#374151', marginTop: 6 },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  date: { fontSize: 11, color: '#9ca3af', marginTop: 10 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { fontSize: 14, color: '#6b7280' },
});
