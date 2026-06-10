import { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { loadSessionUser } from '../login/sessionStorage';
import type { RootTabParamList } from '../navigation/RootTabs';
import { SubStackScreenShell } from '../navigation/SubStackScreenShell';
import { mpColors } from '../screens/shared/mypageTheme';
import { useListScrollToTop } from '../screens/shared/listScrollUi';
import { fetchUserPosts, type UserPost } from './mypageApi';

function categoryLabel(tableType: UserPost['tableType']) {
  if (tableType === 'church') return '찬양대/방송/직원';
  if (tableType === 'institute') return '학교/기관/단체';
  return '사역자';
}

export function UserPostsScreen() {
  const navigation = useNavigation();
  const { listRef, onScroll } = useListScrollToTop<UserPost>();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<UserPost[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await loadSessionUser();
      const data = await fetchUserPosts(user?.userAccount || '');
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

  const openPost = (post: UserPost) => {
    const tabNav = navigation.getParent<BottomTabNavigationProp<RootTabParamList>>();
    if (!tabNav) {
      Alert.alert('', '화면 이동에 실패했습니다.');
      return;
    }
    tabNav.navigate('Jobs', {
      open: { category: post.tableType, id: String(post.id) },
    });
  };

  return (
    <SubStackScreenShell title="내 게시글">
      <FlatList
        ref={listRef}
        data={list}
        keyExtractor={item => `${item.tableType}-${item.id}`}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loader} color={mpColors.primary} />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>작성한 게시글이 없습니다.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openPost(item)}>
            <View style={styles.cardTop}>
              <Text style={styles.typeTag}>{categoryLabel(item.tableType)}</Text>
              <MaterialIcons name="open-in-new" size={18} color="#6b7280" />
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {item.title || '(제목 없음)'}
            </Text>
            {item.church ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.church}
              </Text>
            ) : null}
            {item.sort ? (
              <Text style={styles.meta} numberOfLines={1}>
                {item.sort}
              </Text>
            ) : null}
            <Text style={styles.date}>{item.date || '-'}</Text>
          </Pressable>
        )}
      />
    </SubStackScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 30, flexGrow: 1 },
  loader: { marginTop: 100 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeTag: { fontSize: 11, color: mpColors.primary, fontWeight: '800' },
  title: { fontSize: 15, fontWeight: '700', color: '#111827', lineHeight: 22 },
  subtitle: { fontSize: 13, color: '#374151', marginTop: 6 },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  date: { fontSize: 11, color: '#9ca3af', marginTop: 10 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { fontSize: 14, color: '#6b7280' },
});
