import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSetAtom } from 'jotai';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { PageDots, PrimaryButton } from '../shared/mypageUi';
import { mpColors } from '../shared/mypageTheme';
import { isFirstLaunchAtom } from '../../state/atoms';
import { markOnboardingCompleted } from '../../state/appLaunchStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LOGO = require('../../images/logopng.png');

const CHIPS = ['구인구직', '수련회', '예배사역', '게시판'];

const HERO_ICONS = ['work-outline', 'library-music', 'home', 'forum'] as const;

const FEATURE_CARDS = [
  { icon: 'work-outline', title: '구인구직', desc: '교회와 사역자, 찬양대·기관 채용정보를 조건별로 탐색' },
  { icon: 'terrain', title: '수련회', desc: '장소 검색, 후기 확인, 강사/등록 요청까지 한눈에 확인' },
  { icon: 'library-music', title: '예배사역', desc: '적용찬양, 콘티 작성, 예배 준비에 필요한 자료 추천' },
  { icon: 'forum', title: '게시판', desc: '자유게시판, 중고장터, 세미나 등 다양한 소통 공간 제공' },
] as const;

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const setIsFirstLaunch = useSetAtom(isFirstLaunchAtom);
  const listRef = useRef<FlatList<number>>(null);
  const [page, setPage] = useState(0);

  const finishOnboarding = useCallback(async () => {
    await markOnboardingCompleted();
    setIsFirstLaunch(false);
  }, [setIsFirstLaunch]);

  const goToPage = (index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
    setPage(index);
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setPage(next);
  };

  const renderPage: ListRenderItem<number> = ({ index }) => {
    if (index === 0) {
      return (
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <View style={styles.brandRow}>
            <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
          </View>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <View style={[styles.circle, styles.c1]} />
              <View style={[styles.circle, styles.c2]} />
              <View style={[styles.circle, styles.c3]} />
              <View style={styles.cluster}>
                {HERO_ICONS.map(icon => (
                  <View key={icon} style={styles.mini}>
                    <MaterialIcons name={icon} size={30} color={mpColors.primary} />
                  </View>
                ))}
              </View>
            </View>
            <Text style={styles.h1}>사역의 모든 연결,{'\n'}한곳에서</Text>
            <Text style={styles.sub}>
              교회 구인구직, 수련회 장소, 예배사역 자료, 게시판 소식을 하나의 앱에서 편하게 만나보세요.
            </Text>
            <View style={styles.chips}>
              {CHIPS.map(chip => (
                <View key={chip} style={styles.chip}>
                  <Text style={styles.chipText}>{chip}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      );
    }

    return (
      <ScrollView
        style={{ width: SCREEN_WIDTH }}
        contentContainerStyle={styles.page2Content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <Image source={LOGO} style={styles.logoImageSm} resizeMode="contain" />
        </View>
        <Text style={styles.h1Small}>필요한 사역 정보를{'\n'}빠르게 찾을 수 있어요</Text>
        <Text style={styles.subLeft}>탭별로 정리된 기능으로 원하는 정보를 쉽고 빠르게 탐색해보세요.</Text>
        <View style={styles.grid}>
          {FEATURE_CARDS.map(card => (
            <View key={card.title} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <MaterialIcons name={card.icon} size={26} color={mpColors.primary} />
              </View>
              <Text style={styles.featureTitle}>{card.title}</Text>
              <Text style={styles.featureDesc}>{card.desc}</Text>
            </View>
          ))}
        </View>
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            자주 보는 기능은 홈에서 더 빠르게 접근하고, 관심 공고와 답변은 알림으로 받아볼 수 있어요.
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <FlatList
        ref={listRef}
        data={[0, 1]}
        keyExtractor={item => String(item)}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      <View style={styles.bottom}>
        {page === 0 ? (
          <PrimaryButton label="다음" onPress={() => goToPage(1)} />
        ) : (
          <PrimaryButton label="시작하기" onPress={() => void finishOnboarding()} />
        )}
        <PageDots total={2} active={page} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  page: { flex: 1, paddingHorizontal: 20, paddingBottom: 180 },
  page2Content: { paddingHorizontal: 20, paddingBottom: 160 },
  brandRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  logoImage: { width: 48, height: 42 },
  logoImageSm: { width: 46, height: 40 },
  hero: { alignItems: 'center', marginTop: 28 },
  heroIcon: {
    width: 210,
    height: 210,
    borderRadius: 50,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
    position: 'relative',
  },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: '#bfdbfe' },
  c1: { width: 32, height: 32, top: 28, left: 30 },
  c2: { width: 18, height: 18, top: 54, right: 35, backgroundColor: '#93c5fd' },
  c3: { width: 22, height: 22, bottom: 36, left: 45, backgroundColor: '#dbeafe' },
  cluster: { flexDirection: 'row', flexWrap: 'wrap', width: 154, gap: 14 },
  mini: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe7fb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: mpColors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  h1: {
    fontSize: 30,
    fontWeight: '800',
    color: mpColors.text,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.8,
    marginBottom: 14,
  },
  h1Small: {
    fontSize: 28,
    fontWeight: '800',
    color: mpColors.text,
    lineHeight: 37,
    letterSpacing: -0.8,
    marginTop: 18,
    marginBottom: 10,
  },
  sub: {
    fontSize: 15,
    color: mpColors.textMuted,
    textAlign: 'center',
    lineHeight: 25,
    maxWidth: 290,
    marginBottom: 8,
  },
  subLeft: {
    fontSize: 15,
    color: mpColors.textMuted,
    lineHeight: 25,
    marginBottom: 22,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 26,
    marginBottom: 36,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mpColors.chipBorder,
    backgroundColor: '#fff',
  },
  chipText: { color: mpColors.primary, fontSize: 13, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  featureCard: {
    width: (SCREEN_WIDTH - 40 - 14) / 2,
    borderWidth: 1,
    borderColor: mpColors.borderSoft,
    borderRadius: 24,
    padding: 16,
    backgroundColor: '#fbfdff',
    shadowColor: mpColors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: mpColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  featureTitle: { fontSize: 17, fontWeight: '800', color: mpColors.text, marginBottom: 8, letterSpacing: -0.3 },
  featureDesc: { fontSize: 13, color: mpColors.textMuted, lineHeight: 21 },
  tipBox: {
    marginTop: 18,
    padding: 16,
    backgroundColor: '#f8fbff',
    borderWidth: 1,
    borderColor: mpColors.borderSoft,
    borderRadius: 18,
  },
  tipText: { fontSize: 13, color: mpColors.textSecondary, lineHeight: 21 },
  bottom: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 30,
    backgroundColor: '#fff',
  },
});
