import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { MAIN_API_BASE } from '../../config/api';
import type { RootTabParamList } from '../../navigation/RootTabs';
import {
  RecruitJobCard,
  RECRUIT_CHURCH_LOGO_PATH_MINISTER,
} from '../jobs/common/recruitUi';
import { useScrollViewScrollToTop } from '../shared/listScrollUi';
import { homeColors as c } from './homeTheme';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');

type RecruitRow = {
  id: string;
  title: string;
  church: string;
  churchLogo?: string;
  religiousbody: string;
  location: string;
  locationDetail?: string;
  sort: string;
  pay: string | null;
  date?: string;
};

type InstituteLink = {
  name: string;
  home: string;
};

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { scrollRef, onScroll } = useScrollViewScrollToTop();
  const [activeTab, setActiveTab] = useState<'denomination' | 'school'>('denomination');
  const [recruitList, setRecruitList] = useState<RecruitRow[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  /** @see client/src/screens/main/Main.tsx religiousbodyList */
  const denominationList = useMemo<InstituteLink[]>(
    () => [
      { name: '구세군대한본영', home: 'https://www.thesalvationarmy.or.kr/' },
      { name: '기독교대한감리회', home: 'https://kmc.or.kr/' },
      { name: '기독교대한성결교회', home: 'https://www.kehc.org/' },
      { name: '기독교대한하나님의성회', home: 'http://agk.or.kr/' },
      { name: '기독교한국침례회', home: 'http://www.koreabaptist.or.kr/' },
      { name: '대한기독교나사렛성결회', home: 'https://na.or.kr/' },
      { name: '대한예수교장로회고신', home: 'http://kosin.org/' },
      { name: '대한예수교장로회통합', home: 'https://www.pck.or.kr/' },
      { name: '대한예수교장로회합동', home: 'https://alpha.gapck.org/' },
      { name: '대한예수교장로회합신', home: 'https://www.hapshin.org/' },
      { name: '예수교대한성결교회', home: 'https://www.sungkyul.org/' },
      { name: '한국기독교장로회', home: 'https://www.prok.org/gnu/index.php' },
      { name: '독립교단(KAICAM)', home: 'https://home.kaicam.org/index.asp' },
    ],
    [],
  );

  /** @see client/src/screens/main/Main.tsx schoolList */
  const schoolList = useMemo<InstituteLink[]>(
    () => [
      { name: '고려신학대학원', home: 'https://www.kts.ac.kr/home/' },
      { name: '광신대학교', home: 'https://www.kwangshin.ac.kr/home/index.do' },
      { name: '구세군군사관대학원대학교', home: 'https://gufot.ac.kr' },
      { name: '대전신학대학교', home: 'https://www.daejeon.ac.kr' },
      { name: '대신대학교', home: 'https://www.daeshin.ac.kr/html/00_main/' },
      { name: '부산장신대학교', home: 'https://www.bpu.ac.kr/Default.aspx' },
      { name: '서울장신대학교', home: 'https://www.sjs.ac.kr' },
      { name: '서울신학대학교신대원', home: 'https://gs.stu.ac.kr/CmsHome/StuGs0207_0101.eznic' },
      { name: '성결교신대원', home: 'http://www.skts.org/' },
      { name: '영남신학대학교', home: 'https://www.ytus.ac.kr/html/index.php' },
      { name: '웨스트민스터신학대학원대학교', home: 'http://www.wgst.ac.kr/wgst_renew' },
      { name: '장로회신학대학교', home: 'https://www.puts.ac.kr' },
      { name: '총신대학교', home: 'https://www.csu.ac.kr/' },
      { name: '한세대학교', home: 'https://www.hansei.ac.kr/sites/kor/index.do' },
      { name: '한신대학교', home: 'https://www.hs.ac.kr/gradseoulcampus/index.do' },
      { name: '한일장신대학교', home: 'https://www.hanil.ac.kr' },
      { name: '한국침례신학대학교신대원', home: 'https://gtheology.kbtus.ac.kr/gtheology/Main.do' },
      { name: '호남신학대학교', home: 'https://www.htus.ac.kr/index.php#' },
    ],
    [],
  );

  const currentInstituteList =
    activeTab === 'denomination' ? denominationList : schoolList;

  const fetchLatestJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await axios.get(`${API_BASE}/recruitminister/getrecruitdata/1`);
      if (res.data?.resultData) {
        setRecruitList((res.data.resultData as RecruitRow[]).slice(0, 3));
      } else {
        setRecruitList([]);
      }
    } catch {
      setRecruitList([]);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    void fetchLatestJobs();
  }, [fetchLatestJobs]);

  const openJobsTab = () => {
    navigation.navigate('Jobs');
  };

  const openNotifications = () => {
    navigation.navigate('Notifi');
  };

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최신 채용공고</Text>
            <Pressable style={styles.viewAllBtn} onPress={openJobsTab}>
              <Text style={styles.viewAllText}>전체보기</Text>
              <MaterialIcons name="chevron-right" size={14} color={c.primary} />
            </Pressable>
          </View>

          {loadingJobs ? (
            <View style={styles.jobsLoading}>
              <ActivityIndicator size="large" color={c.primary} />
            </View>
          ) : recruitList.length === 0 ? (
            <Text style={styles.emptyJobs}>등록된 채용공고가 없습니다.</Text>
          ) : (
            recruitList.map(item => (
              <View key={item.id} style={styles.homeJobCardWrap}>
                <RecruitJobCard
                  item={{
                    id: String(item.id),
                    title: String(item.title || ''),
                    church: String(item.church || ''),
                    churchLogo: item.churchLogo ? String(item.churchLogo) : undefined,
                    religiousbody: String(item.religiousbody || ''),
                    location: String(item.location || ''),
                    locationDetail: item.locationDetail
                      ? String(item.locationDetail)
                      : undefined,
                    sort: String(item.sort || ''),
                    pay: item.pay,
                    date: item.date ? String(item.date) : undefined,
                  }}
                  onPress={openJobsTab}
                  churchLogoBasePath={RECRUIT_CHURCH_LOGO_PATH_MINISTER}
                />
              </View>
            ))
          )}

          <View style={styles.alertBanner}>
            <View style={styles.alertIconWrap}>
              <MaterialIcons name="campaign" size={18} color="#fff" />
            </View>
            <View style={styles.alertTextWrap}>
              <Text style={styles.alertMain}>새로운 사역의 기회가 매일 업데이트됩니다</Text>
              <Text style={styles.alertSub}>관심 있는 공고를 놓치지 마세요!</Text>
            </View>
            <Pressable style={styles.alertBtn} onPress={openNotifications}>
              <Text style={styles.alertBtnText}>알림 설정</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitleStandalone}>바로가기</Text>

          <View style={styles.tabMenu}>
            <Pressable
              style={[styles.tabBtn, activeTab === 'denomination' && styles.tabBtnActive]}
              onPress={() => setActiveTab('denomination')}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'denomination' && styles.tabBtnTextActive,
                ]}>
                총회 홈페이지
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, activeTab === 'school' && styles.tabBtnActive]}
              onPress={() => setActiveTab('school')}>
              <Text
                style={[styles.tabBtnText, activeTab === 'school' && styles.tabBtnTextActive]}>
                신학교 홈페이지
              </Text>
            </Pressable>
          </View>

          <View style={styles.shortcutList}>
            {currentInstituteList.map((item, index) => (
              <Pressable
                key={item.name}
                style={({ pressed }) => [
                  styles.shortcutItem,
                  index < currentInstituteList.length - 1 && styles.shortcutItemBorder,
                  pressed && styles.shortcutItemPressed,
                ]}
                onPress={() => {
                  Linking.openURL(item.home).catch(() => null);
                }}>
                <View
                  style={[
                    styles.shortcutLogo,
                    activeTab === 'school' && styles.shortcutLogoSchoolWrap,
                  ]}>
                  <Image
                    source={{
                      uri:
                        activeTab === 'denomination'
                          ? `${API_BASE}/siteimages/religiousbody/${encodeURIComponent(item.name)}.jpg`
                          : `${API_BASE}/siteimages/schoollogos/${encodeURIComponent(item.name)}.png`,
                    }}
                    style={
                      activeTab === 'denomination'
                        ? styles.shortcutLogoDenomination
                        : styles.shortcutLogoSchool
                    }
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.shortcutName} numberOfLines={1}>
                  {item.name}
                </Text>
                <MaterialIcons name="chevron-right" size={16} color={c.arrow} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.bg,
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.text,
  },
  sectionTitleStandalone: {
    fontSize: 18,
    fontWeight: '700',
    color: c.text,
    marginBottom: 12,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: '#e0e4ea',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '500',
    color: c.primary,
  },
  jobsLoading: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyJobs: {
    fontSize: 14,
    color: c.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  homeJobCardWrap: {
    marginBottom: 10,
  },
  alertBanner: {
    marginTop: 4,
    backgroundColor: c.alertGradientStart,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#d6e8ff',
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  alertMain: {
    fontSize: 12.5,
    fontWeight: '700',
    color: c.text,
    marginBottom: 2,
    lineHeight: 18,
  },
  alertSub: {
    fontSize: 11,
    color: '#4E5968',
  },
  alertBtn: {
    backgroundColor: c.card,
    borderWidth: 1.5,
    borderColor: c.primary,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  alertBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: c.primary,
  },
  tabMenu: {
    flexDirection: 'row',
    backgroundColor: c.tabTrack,
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
    gap: 2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: c.primary,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  shortcutList: {
    backgroundColor: c.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
  },
  shortcutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  shortcutItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: c.bg,
  },
  shortcutItemPressed: {
    backgroundColor: '#f8faff',
  },
  shortcutLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  /** 웹 Main.scss school: max-width 150px, height 70px — 가로형 로고 */
  shortcutLogoSchoolWrap: {
    width: 92,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8ebef',
  },
  shortcutLogoDenomination: {
    width: 30,
    height: 30,
    borderRadius: 6,
  },
  shortcutLogoSchool: {
    width: 84,
    height: 36,
  },
  shortcutName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
  },
});
