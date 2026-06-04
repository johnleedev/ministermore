import { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  clearSession,
  loadSessionUser,
  type StoredUserData,
} from '../login/sessionStorage';
import { isLoggedInAtom, notificationListAtom } from '../state/atoms';
import { navigateToAuth } from '../navigation/rootNavigation';
import { promptLogin } from '../navigation/authPrompt';
import type { RootTabParamList } from '../navigation/RootTabs';
import type { MypageStackParamList } from './MypageStack';
import { fetchUserPosts } from './mypageApi';
import { mpScreenContentStyle } from '../screens/shared/mypageUi';
import { mpColors } from '../screens/shared/mypageTheme';
import { useScrollViewScrollToTop } from '../screens/shared/listScrollUi';
import {
  getEffectivePushEnabled,
  getOsNotificationsAllowed,
  loadUserWantsPush,
  saveUserWantsPush,
  syncUserActiveToServer,
} from '../notifi/notificationSettings';
import { fetchScrapList } from '../shared/scrapApi';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Nav = NativeStackNavigationProp<MypageStackParamList, 'MypageMain'>;

const KAKAO_CHANNEL_URL = 'http://pf.kakao.com/_Xzwrn';
const KAKAO_ICON = require('../images/login/kakao.png');

const MENU_ITEMS = [
  {
    icon: 'history',
    title: '내 활동',
    desc: '내가 작성한 글, 댓글, 신청 내역 확인',
    action: 'activity' as const,
  },
  {
    icon: 'bookmark',
    title: '스크랩',
    desc: '저장한 공고, 장소, 콘텐츠 모아보기',
    action: 'scrap' as const,
  },
  {
    icon: 'notifications-none',
    title: '알림 설정',
    desc: '맞춤 공고, 게시판, 추천 알림 관리',
    action: 'notifications' as const,
  },
  // {
  //   icon: 'settings',
  //   title: '앱 설정',
  //   desc: '화면, 계정, 개인정보 및 이용 설정',
  //   action: 'settings' as const,
  // },
  {
    icon: 'mail-outline',
    title: '문의하기',
    desc: '오류 신고, 제안, 운영팀 문의 접수',
    action: 'contact' as const,
  },
] as const;

function avatarInitials(user: StoredUserData | null): string {
  const name = user?.userNickName?.trim() || user?.userAccount?.trim() || 'MM';
  if (name.length <= 2) return name.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function MypageMainScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { scrollRef, onScroll } = useScrollViewScrollToTop();
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);
  const notifications = useAtomValue(notificationListAtom);
  const [user, setUser] = useState<StoredUserData | null>(null);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [nightOff, setNightOff] = useState(false);
  const [scrapCount, setScrapCount] = useState(0);
  const [postCount, setPostCount] = useState(0);

  const loadProfile = useCallback(async () => {
    const savedUser = await loadSessionUser();
    setUser(savedUser);
    const effective = await getEffectivePushEnabled();
    setPushEnabled(effective);
    const wants = await loadUserWantsPush();
    if (!wants) setPushEnabled(false);
    if (savedUser?.userAccount) {
      const [scrapList, posts] = await Promise.all([
        fetchScrapList(savedUser.userAccount).catch(() => []),
        fetchUserPosts(savedUser.userAccount).catch(() => []),
      ]);
      setScrapCount(scrapList.length);
      setPostCount(posts.length);
    } else {
      setScrapCount(0);
      setPostCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const regionText = user?.userChurch
    ? `${user.userChurch} · ${user.grade || '일반 회원'}`
    : user?.grade || '일반 회원';

  const onMenuPress = (action: (typeof MENU_ITEMS)[number]['action']) => {
    if (action !== 'contact' && !isLoggedIn) {
      promptLogin();
      return;
    }
    switch (action) {
      case 'activity':
        navigation.navigate('UserPosts');
        break;
      case 'notifications':
        navigation.navigate('NotificationSettings');
        break;
      case 'scrap':
        navigation.navigate('ScrapList');
        break;
      // case 'settings':
      //   Alert.alert('', '준비 중인 기능입니다.');
      //   break;
      case 'contact':
        navigation.navigate('Inquiry');
        break;
      default:
        Alert.alert('', '준비 중인 기능입니다.');
    }
  };

  const openKakaoChannel = () => {
    Linking.openURL(KAKAO_CHANNEL_URL).catch(() => {
      Alert.alert('', '카카오 채널을 열 수 없습니다.');
    });
  };

  const openScrapList = () => {
    if (!isLoggedIn) {
      promptLogin();
      return;
    }
    navigation.navigate('ScrapList');
  };

  const openUserPosts = () => {
    if (!isLoggedIn) {
      promptLogin();
      return;
    }
    navigation.navigate('UserPosts');
  };

  const openNotifications = () => {
    if (!isLoggedIn) {
      promptLogin();
      return;
    }
    const tabNav = navigation.getParent<BottomTabNavigationProp<RootTabParamList>>();
    tabNav?.navigate('Notifi');
  };

  const onTogglePush = async (next: boolean) => {
    if (next) {
      const os = await getOsNotificationsAllowed();
      if (!os) {
        Alert.alert('알림 권한', '기기 설정에서 알림 권한을 허용해주세요.', [
          { text: '취소', style: 'cancel' },
          { text: '설정 열기', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
    }
    await saveUserWantsPush(next);
    setPushEnabled(next);
    await syncUserActiveToServer().catch(() => {});
  };

  return (
    <ScrollView
      ref={scrollRef}
      onScroll={onScroll}
      scrollEventThrottle={16}
      style={styles.root}
      contentContainerStyle={[styles.content, mpScreenContentStyle(24 + insets.bottom)]}>

      <View style={styles.profileCard}>
        {isLoggedIn ? (
          <>
            <View style={styles.profileTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarInitials(user)}</Text>
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {user?.userNickName || '회원'}
                  </Text>
                  <Pressable style={styles.editBtn} onPress={() => navigation.navigate('Profile')}>
                    <Text style={styles.editBtnText}>프로필 수정</Text>
                  </Pressable>
                </View>
                <Text style={styles.account} numberOfLines={1} ellipsizeMode="middle">
                  {user?.userAccount || '-'}
                </Text>
                <Text style={styles.role}>{regionText}</Text>
              </View>
            </View>
            <View style={styles.stats}>
              <Pressable
                style={({ pressed }) => [styles.stat, pressed && styles.statPressed]}
                onPress={openScrapList}
                accessibilityRole="button"
                accessibilityLabel="스크랩 공고">
                <Text style={styles.statValue}>{scrapCount}</Text>
                <Text style={styles.statLabel}>스크랩 공고</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.stat, pressed && styles.statPressed]}
                onPress={openUserPosts}
                accessibilityRole="button"
                accessibilityLabel="내 게시글">
                <Text style={styles.statValue}>{postCount}</Text>
                <Text style={styles.statLabel}>내 게시글</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.stat, pressed && styles.statPressed]}
                onPress={openNotifications}
                accessibilityRole="button"
                accessibilityLabel="최근 알림">
                <Text style={styles.statValue}>{notifications.length}</Text>
                <Text style={styles.statLabel}>최근 알림</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.guestBlock}>
            <Text style={styles.guestTitle}>로그인하고 더 많은 기능을 이용하세요</Text>
            <Text style={styles.guestDesc}>
              글쓰기·댓글, 수련회 신청, 스크랩, 알림 설정 등은 로그인 후 이용할 수 있습니다.
            </Text>
            <Pressable style={styles.loginCta} onPress={() => navigateToAuth()}>
              <Text style={styles.loginCtaText}>로그인 · 회원가입</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Text style={styles.sectionLabel}>바로가기</Text>
      <View style={styles.menuCard}>
        {MENU_ITEMS.map((item, idx) => (
          <Pressable
            key={item.title}
            style={[styles.menuItem, idx < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
            onPress={() => onMenuPress(item.action)}>
            <View style={styles.menuIcon}>
              <MaterialIcons name={item.icon} size={22} color={mpColors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
          </Pressable>
        ))}
      </View>

      {isLoggedIn ? (
        <View style={styles.settingPanel}>
          <Text style={styles.settingPanelTitle}>빠른 설정</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>푸시 알림 받기</Text>
            <Switch value={pushEnabled} onValueChange={onTogglePush} trackColor={{ true: mpColors.primary }} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>야간 알림 끄기</Text>
            <Switch value={nightOff} onValueChange={setNightOff} trackColor={{ true: mpColors.primary }} />
          </View>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.kakaoChannelBtn, pressed && styles.kakaoChannelBtnPressed]}
        onPress={openKakaoChannel}
        accessibilityRole="link"
        accessibilityLabel="카카오 채널 문의하기">
        <Image source={KAKAO_ICON} style={styles.kakaoChannelIcon} resizeMode="contain" />
        <View style={styles.kakaoChannelTextWrap}>
          <Text style={styles.kakaoChannelTitle}>카카오채널로 문의하기</Text>
        </View>
        <MaterialIcons name="open-in-new" size={20} color="#3c1e1e" style={styles.kakaoChannelArrow} />
      </Pressable>

      {isLoggedIn ? (
        <Pressable
          style={styles.logoutBtn}
          onPress={() =>
            Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
              { text: '취소', style: 'cancel' },
              {
                text: '로그아웃',
                style: 'destructive',
                onPress: async () => {
                  await clearSession();
                  setIsLoggedIn(false);
                },
              },
            ])
          }>
          <Text style={styles.logoutBtnText}>로그아웃</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: mpColors.bg },
  content: {},
  profileCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6edf9',
    borderRadius: 28,
    padding: 20,
    shadowColor: mpColors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 3,
  },
  profileTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#1d4ed8' },
  profileInfo: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: mpColors.text,
    letterSpacing: -0.8,
  },
  account: { fontSize: 13, color: mpColors.textMuted, lineHeight: 20, marginTop: 4 },
  role: { fontSize: 13, color: mpColors.textMuted, lineHeight: 20, marginTop: 2 },
  editBtn: {
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mpColors.chipBorder,
    backgroundColor: '#fff',
  },
  editBtnText: { fontSize: 13, fontWeight: '800', color: mpColors.primary },
  guestBlock: { gap: 12 },
  guestTitle: { fontSize: 18, fontWeight: '800', color: mpColors.text, letterSpacing: -0.5 },
  guestDesc: { fontSize: 13, color: mpColors.textMuted, lineHeight: 20 },
  loginCta: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: mpColors.primary,
  },
  loginCtaText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  stats: { flexDirection: 'row', gap: 10, marginTop: 18 },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6edf9',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statPressed: {
    backgroundColor: '#f0f6ff',
    borderColor: mpColors.primary,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: mpColors.primary, marginBottom: 6 },
  statLabel: { fontSize: 12, color: mpColors.textMuted },
  sectionLabel: {
    marginTop: 22,
    marginBottom: 10,
    paddingHorizontal: 4,
    fontSize: 13,
    fontWeight: '700',
    color: mpColors.textMuted,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: mpColors.border,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: mpColors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 17,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#eef3fb' },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: mpColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '700', color: mpColors.text, marginBottom: 4 },
  menuDesc: { fontSize: 12, color: mpColors.textMuted, lineHeight: 18 },
  settingPanel: {
    marginTop: 14,
    backgroundColor: '#f8fbff',
    borderWidth: 1,
    borderColor: '#e4ecfb',
    borderRadius: 20,
    padding: 16,
  },
  settingPanelTitle: { fontSize: 15, fontWeight: '700', color: mpColors.text, marginBottom: 10 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  toggleLabel: { fontSize: 14, color: mpColors.textSecondary },
  kakaoChannelBtn: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#fee500',
    borderWidth: 1,
    borderColor: '#f0d800',
  },
  kakaoChannelBtnPressed: { opacity: 0.88 },
  kakaoChannelIcon: { width: 40, height: 30 },
  kakaoChannelTextWrap: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  kakaoChannelTitle: { fontSize: 15, fontWeight: '800', color: '#3c1e1e' },
  kakaoChannelArrow: { opacity: 0.7 },
  logoutBtn: {
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d1d9e6',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  logoutBtnText: { fontSize: 16, fontWeight: '800', color: mpColors.textSecondary },
});
