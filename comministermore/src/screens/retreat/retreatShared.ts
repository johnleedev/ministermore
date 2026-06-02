import { Alert, Linking, StyleSheet } from 'react-native';
import { MAIN_API_BASE } from '../../config/api';
import { retreatColors } from './retreatTheme';

export { retreatColors } from './retreatTheme';

export const API_BASE = MAIN_API_BASE.replace(/\/$/, '');

export const RETREAT_REGIONS = [
  '서울/경기도',
  '강원도',
  '대전/충청도',
  '광주/전라도',
  '대구/부산/경상도',
  '제주도',
] as const;

export const PLACE_SORT_OPTIONS = [
  '선택',
  '기도원',
  '교회',
  '펜션',
  '수련원/수양관/연수원',
  '리조트/호텔',
] as const;

export const PLACE_SIZE_OPTIONS = ['선택', '50명이하', '50~100명', '100명이상'] as const;

export const CASTING_SORT_TABS = ['설교자', '찬양사역자', '특강강사', '기타'] as const;

/** 2열 그리드 FlatList — 가로·세로 카드 간격 */
export const retreatGridColumnStyle = {
  gap: 12,
  marginBottom: 12,
} as const;

export const retreatStyles = StyleSheet.create({
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: retreatColors.text,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: retreatColors.text,
  },
  sectionCount: {
    fontSize: 12.5,
    color: retreatColors.textMuted2,
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: retreatColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#c8d0da',
    backgroundColor: retreatColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: retreatColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  searchBox: {
    borderWidth: 1,
    borderColor: retreatColors.border,
    borderRadius: 14,
    backgroundColor: retreatColors.card,
    padding: 14,
    marginBottom: 16,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: retreatColors.text,
    marginBottom: 3,
  },
  searchHint: {
    fontSize: 12,
    color: retreatColors.textMuted2,
    marginBottom: 10,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: retreatColors.searchBg,
    borderWidth: 1.5,
    borderColor: retreatColors.borderLight,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: retreatColors.textSecondary,
    padding: 0,
  },
  regionTab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: retreatColors.borderLight,
    backgroundColor: retreatColors.card,
  },
  regionTabOn: {
    borderColor: retreatColors.primary,
    backgroundColor: retreatColors.card,
  },
  regionTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: retreatColors.textMuted,
  },
  regionTabTextOn: {
    color: retreatColors.primary,
    fontWeight: '600',
  },
  emptyText: {
    paddingVertical: 40,
    textAlign: 'center',
    color: '#777',
    fontSize: 15,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 12,
  },
  detailLabel: {
    width: 72,
    fontSize: 15,
    fontWeight: '700',
    color: retreatColors.text,
  },
  detailValue: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: retreatColors.border,
    marginVertical: 16,
  },
  noticeBox: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: retreatColors.border,
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  noticeText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  formField: {
    marginBottom: 14,
  },
  formLabel: {
    marginBottom: 6,
    fontSize: 15,
    fontWeight: '700',
    color: retreatColors.text,
  },
  formInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#dde2e8',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 15,
    color: '#333',
  },
  formTextarea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#dde2e8',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 15,
    color: '#333',
    textAlignVertical: 'top',
  },
});

export function formatRelativeDate(dateStr: string) {
  const target = new Date(dateStr).getTime();
  if (Number.isNaN(target)) return dateStr;
  const diff = Date.now() - target;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 31);
  if (months > 0) return `${months}달 전`;
  if (days > 0) return `${days}일 전`;
  return '오늘';
}

export function renderPreview(text: string, max = 40) {
  if (!text) return '';
  if (text.length > max) return `${text.slice(0, max)}...`;
  return text;
}

export function parseImageList(images: string | string[] | null | undefined): string[] {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [images];
  } catch {
    return [images];
  }
}

export function isRetreatVisible(value: string | boolean | number | null | undefined) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

/** 상세·회원 전용 — 로그인 확인 (웹 recoilLoginState와 동일) */
export function checkRetreatLogin(isLoggedIn: boolean): boolean {
  if (!isLoggedIn) {
    Alert.alert('', '로그인이 필요합니다.');
    return false;
  }
  return true;
}

/** 상세·회원 전용 — 정회원 등급 확인 (웹 userData.grade !== '일반회원') */
export function checkRetreatMember(grade: string | undefined | null): boolean {
  if (grade === '일반회원') {
    Alert.alert('', '등업이 필요합니다. 등업신청 게시판에서 신청해주세요');
    return false;
  }
  return true;
}

/** 장소등록요청 등 — 로그인 확인 (웹 PlaceList.openPlaceRequest) */
export function checkRetreatLoginForRequest(isLoggedIn: boolean): boolean {
  if (!isLoggedIn) {
    Alert.alert('', '권한이 없습니다. 로그인이 필요합니다.');
    return false;
  }
  return true;
}

export function openRetreatOnWeb(path: string) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  Linking.openURL(url).catch(() => {
    Alert.alert('안내', '웹 페이지를 열 수 없습니다.');
  });
}
