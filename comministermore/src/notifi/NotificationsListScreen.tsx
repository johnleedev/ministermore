import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNotificationsScrollToTopOnRequest } from '../navigation/useNotificationsScrollToTopOnRequest';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAtom } from 'jotai';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NotificationsStackParamList } from '../navigation/NotificationsStack';
import { notificationListAtom } from '../state/atoms';
import type { HomeinappNotificationItem } from '../types/homeinappNotification';
import { HOMEINAPP_API_BASE, HOMEINAPP_CHURCH_ID } from '../config/api';
import {
  NOTIFICATION_TABS,
  categoryPillStyle,
  formatNotificationListTime,
  inferNotificationCategory,
  notificationDaySection,
  mpColors,
  MP_SCREEN_PADDING_H,
  type NotificationCategory,
} from '../screens/shared/mypageTheme';

type Props = NativeStackScreenProps<NotificationsStackParamList, 'NotificationsList'>;

const READ_NOTIFICATION_IDS_KEY = `notifications_read_ids:${HOMEINAPP_CHURCH_ID}`;

type NotificationListResponse = {
  success?: boolean;
  message?: string;
  data?: {
    list: HomeinappNotificationItem[];
  };
};

type SectionRow =
  | { type: 'section'; key: string; label: string }
  | { type: 'item'; key: string; item: HomeinappNotificationItem };

async function fetchNotificationList(): Promise<HomeinappNotificationItem[]> {
  const churchId = HOMEINAPP_CHURCH_ID;
  if (!churchId) throw new Error('churchId is required');
  const url = `${HOMEINAPP_API_BASE}/notifications/${encodeURIComponent(churchId)}/list?limit=30&offset=0`;
  const res = await fetch(url, { method: 'GET' });
  const payload: NotificationListResponse = await res.json().catch(() => ({}));
  if (!res.ok || !payload?.success || !payload?.data) {
    throw new Error(payload?.message || `알림 목록 조회 실패 (${res.status})`);
  }
  return Array.isArray(payload.data.list) ? payload.data.list : [];
}

async function markNotificationRead(id: number): Promise<void> {
  const churchId = HOMEINAPP_CHURCH_ID;
  if (!churchId) return;
  const url = `${HOMEINAPP_API_BASE}/notifications/${encodeURIComponent(churchId)}/${id}/read`;
  await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
}

export function NotificationsListScreen({ navigation }: Props) {
  const listRef = useRef<FlatList<SectionRow>>(null);
  useNotificationsScrollToTopOnRequest(listRef);
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useAtom(notificationListAtom);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(READ_NOTIFICATION_IDS_KEY)
      .then(saved => {
        if (!saved || !mounted) return;
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setReadIds(new Set(parsed.map(String)));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchNotificationList()
        .then(list => {
          if (active) setNotifications(list);
        })
        .catch(error => console.log('[notification] list refresh failed:', error));
      return () => {
        active = false;
      };
    }, [setNotifications]),
  );

  const filtered = useMemo(() => {
    if (activeTab === 'all') return notifications;
    return notifications.filter(item => {
      const cat = inferNotificationCategory(item.title, item.content);
      return cat === activeTab;
    });
  }, [notifications, activeTab]);

  const rows = useMemo(() => {
    const result: SectionRow[] = [];
    let lastSection = '';
    filtered.forEach(item => {
      const section = notificationDaySection(item.sent_at);
      if (section !== lastSection) {
        result.push({ type: 'section', key: `section-${section}`, label: section });
        lastSection = section;
      }
      result.push({ type: 'item', key: String(item.id), item });
    });
    return result;
  }, [filtered]);

  const onOpen = useCallback(
    async (id: number) => {
      const idText = String(id);
      setReadIds(prev => {
        const next = new Set(prev);
        next.add(idText);
        AsyncStorage.setItem(READ_NOTIFICATION_IDS_KEY, JSON.stringify(Array.from(next))).catch(() => {});
        return next;
      });
      markNotificationRead(id).catch(() => {});
      navigation.navigate('NotificationDetail', { id: idText });
    },
    [navigation],
  );

  const renderRow: ListRenderItem<SectionRow> = ({ item: row }) => {
    if (row.type === 'section') {
      return <Text style={styles.sectionLabel}>{row.label}</Text>;
    }

    const { item } = row;
    const read = readIds.has(String(item.id));
    const category = inferNotificationCategory(item.title, item.content);
    const pill = categoryPillStyle(category);

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => void onOpen(item.id)}>
        {!read ? <View style={styles.newDot} /> : null}
        <View style={styles.cardRow}>
          <View style={[styles.pill, { backgroundColor: pill.bg }]}>
            <Text style={[styles.pillText, { color: pill.text }]}>{pill.label}</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, !read && styles.cardTitleUnread]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardPreview} numberOfLines={2}>
              {item.content}
            </Text>
            <View style={styles.cardMeta}>
              <Text style={styles.cardTime}>{formatNotificationListTime(item.sent_at)}</Text>
              <Text style={styles.cardLink}>자세히 보기 ›</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const listHeader = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
      {NOTIFICATION_TABS.map(tab => (
        <Pressable
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          onPress={() => setActiveTab(tab.key)}>
          <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={rows}
        keyExtractor={row => row.key}
        renderItem={renderRow}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[styles.listContent, { paddingBottom: 24 + insets.bottom }]}
        ListEmptyComponent={
          <Text style={styles.empty}>받은 알림이 없습니다.</Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: mpColors.bg },
  tabs: { gap: 10, paddingBottom: 16, paddingHorizontal: 2 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e4eaf7',
    backgroundColor: '#fff',
  },
  tabActive: {
    backgroundColor: mpColors.primary,
    borderColor: mpColors.primary,
    shadowColor: mpColors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: '700', color: mpColors.textSecondary },
  tabTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: MP_SCREEN_PADDING_H, paddingTop: 16 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: mpColors.textMuted,
    marginBottom: 10,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: mpColors.border,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    shadowColor: mpColors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
    position: 'relative',
  },
  cardPressed: { opacity: 0.85 },
  newDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: mpColors.primary,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  pill: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '800' },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: mpColors.text,
    lineHeight: 23,
    letterSpacing: -0.3,
    marginBottom: 7,
  },
  cardTitleUnread: { fontWeight: '800' },
  cardPreview: { fontSize: 13, color: mpColors.textMuted, lineHeight: 20 },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 11,
  },
  cardTime: { fontSize: 12, color: mpColors.textLight },
  cardLink: { fontSize: 12, color: mpColors.textLight, fontWeight: '600' },
  empty: {
    textAlign: 'center',
    fontSize: 15,
    color: mpColors.textMuted,
    paddingVertical: 60,
  },
});
