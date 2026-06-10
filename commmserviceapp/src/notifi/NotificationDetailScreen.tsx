import { useMemo, useRef } from 'react';
import { useNotificationsScrollToTopOnRequest } from '../navigation/useNotificationsScrollToTopOnRequest';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAtomValue } from 'jotai';
import type { NotificationsStackParamList } from '../navigation/NotificationsStack';
import { notificationListAtom } from '../state/atoms';
import {
  categoryPillStyle,
  formatNotificationListTime,
  inferNotificationCategory,
  mpColors,
} from '../screens/shared/mypageTheme';
import { SubStackScreenShell } from '../navigation/SubStackScreenShell';
import { mpScreenContentStyle } from '../screens/shared/mypageUi';

type Props = NativeStackScreenProps<NotificationsStackParamList, 'NotificationDetail'>;

function categoryFromTopic(topic: string | null | undefined) {
  const key = String(topic || '').trim().toLowerCase();
  if (!key) return null;
  if (key === 'notice' || key === '공지') return 'notice' as const;
  if (key === 'job' || key === 'recruit' || key === '구인구직') return 'job' as const;
  if (key === 'retreat' || key === '수련회') return 'retreat' as const;
  if (key === 'community' || key === 'board' || key === '게시판') return 'community' as const;
  if (key === 'worship' || key === '예배사역') return 'worship' as const;
  return null;
}

export function NotificationDetailScreen({ route, navigation }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const { onScroll } = useNotificationsScrollToTopOnRequest(undefined, scrollRef);
  const tabNav = useNavigation();
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const notifications = useAtomValue(notificationListAtom);

  const item = useMemo(
    () => notifications.find(notification => String(notification.id) === id),
    [id, notifications],
  );

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>알림을 찾을 수 없습니다.</Text>
        <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>목록으로</Text>
        </Pressable>
      </View>
    );
  }

  const category = categoryFromTopic(item.topic) || inferNotificationCategory(item.title, item.content);
  const pill = categoryPillStyle(category);
  const timeLabel = formatNotificationListTime(item.sent_at);

  return (
    <SubStackScreenShell title="알림 상세" hideNotifiAction>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.root}
        contentContainerStyle={mpScreenContentStyle(32 + insets.bottom)}
        showsVerticalScrollIndicator={false}>

      <View style={styles.card}>
        <View style={[styles.pill, { backgroundColor: pill.bg }]}>
          <Text style={[styles.pillText, { color: pill.text }]}>{pill.label}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        {timeLabel ? <Text style={styles.time}>{timeLabel}</Text> : null}
        <Text style={styles.body}>{item.content}</Text>

        <View style={styles.actions}>
          <Pressable style={styles.btnSecondary} onPress={() => navigation.goBack()}>
            <Text style={styles.btnSecondaryText}>목록으로</Text>
          </Pressable>
          <Pressable
            style={styles.btnPrimary}
            onPress={() => {
              if (category === 'job') tabNav.navigate('Jobs' as never);
              else if (category === 'retreat') tabNav.navigate('Retreat' as never);
              else if (category === 'worship') tabNav.navigate('Worship' as never);
              else tabNav.navigate('Board' as never);
            }}>
            <Text style={styles.btnPrimaryText}>관련 화면으로 이동</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.footerNote}>
        이 알림은 사용자의 스크랩 및 관심 조건을 기반으로 발송되었습니다.
      </Text>
      </ScrollView>
    </SubStackScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: mpColors.bg },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: mpColors.border,
    borderRadius: 26,
    padding: 22,
    shadowColor: mpColors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 3,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  pillText: { fontSize: 12, fontWeight: '800' },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: mpColors.text,
    lineHeight: 32,
    letterSpacing: -0.7,
    marginBottom: 10,
  },
  time: { fontSize: 13, color: mpColors.textLight, marginBottom: 20 },
  body: {
    fontSize: 15,
    color: mpColors.textSecondary,
    lineHeight: 27,
    marginBottom: 20,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btnPrimary: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: mpColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: mpColors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 15,
    elevation: 3,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  btnSecondary: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dfe8f7',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { color: mpColors.textSecondary, fontWeight: '800', fontSize: 14 },
  footerNote: {
    marginTop: 18,
    fontSize: 12,
    color: mpColors.textLight,
    lineHeight: 19,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: mpColors.bg,
  },
  notFound: { fontSize: 16, color: mpColors.textSecondary, textAlign: 'center' },
  backLink: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 16 },
  backLinkText: { fontSize: 16, color: mpColors.primary, fontWeight: '600' },
});
