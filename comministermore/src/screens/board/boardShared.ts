import { Alert, Linking } from 'react-native';
import {
  isLoggedInStorage,
  loadSessionUser,
  type StoredUserData,
} from '../../login/sessionStorage';
import { promptLogin, requireLogin } from '../../navigation/authPrompt';
import { API_BASE } from '../retreat/retreatShared';
import { BOARD_NOTICE_SORT } from './boardConfigs';
import type { CommunityPost } from './boardTypes';

export { API_BASE, BOARD_NOTICE_SORT };

/** API 응답 → 공지 목록 / 일반 글 목록 (noticePosts 없으면 resultData에서 공지 추출) */
export function parseBoardListPayload(
  resultData: CommunityPost[] | undefined,
  noticePosts: CommunityPost[] | undefined,
): { notices: CommunityPost[]; regular: CommunityPost[] } {
  const regularRaw = Array.isArray(resultData) ? resultData : [];
  const noticeById = new Map<number, CommunityPost>();

  for (const post of noticePosts ?? []) {
    if (post?.sort === BOARD_NOTICE_SORT) {
      noticeById.set(post.id, post);
    }
  }

  for (const post of regularRaw) {
    if (post?.sort === BOARD_NOTICE_SORT) {
      noticeById.set(post.id, post);
    }
  }

  const notices = Array.from(noticeById.values()).sort((a, b) => b.id - a.id);
  const regular = regularRaw.filter(p => !noticeById.has(p.id));

  return { notices, regular };
}

export function parsePostImages(images: string | null | undefined): string[] {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function renderPreview(value: string, max = 40) {
  if (!value) return '';
  if (value.length > max) return `${value.slice(0, max)}...`;
  return value;
}

/** HTML·엔티티 제거 후 목록용 본문 미리보기 */
export function stripPostContentPreview(content: string, max = 100): string {
  if (!content?.trim()) return '';
  const plain = content
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return renderPreview(plain, max);
}

export function formatRelativeDate(dateStr: string) {
  const target = new Date(dateStr).getTime();
  if (Number.isNaN(target)) return dateStr;
  const diff = Date.now() - target;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 31);
  if (months > 0) return `${months}달 전`;
  if (days === 1) return '어제';
  if (days > 1) return `${days}일 전`;
  return '오늘';
}

export function isPostNew(dateStr: string) {
  const target = new Date(dateStr).getTime();
  if (Number.isNaN(target)) return false;
  const days = Math.floor((Date.now() - target) / (1000 * 60 * 60 * 24));
  return days < 1;
}

/** 글쓰기·댓글 등 — 앱 로그인 여부 확인 */
export function checkBoardLogin(isLoggedIn: boolean): boolean {
  return requireLogin(isLoggedIn);
}

/** 로그인 사용자 (Jotai + AsyncStorage). 글·댓글 API용 */
export async function resolveBoardUser(
  isLoggedIn: boolean,
  cachedUser: StoredUserData | null,
): Promise<StoredUserData | null> {
  if (cachedUser?.userAccount?.trim()) {
    return cachedUser;
  }
  if (isLoggedIn || (await isLoggedInStorage())) {
    const user = await loadSessionUser();
    if (user?.userAccount?.trim()) {
      return user;
    }
  }
  return null;
}

export async function ensureBoardLogin(
  isLoggedIn: boolean,
  cachedUser: StoredUserData | null,
): Promise<StoredUserData | null> {
  const user = await resolveBoardUser(isLoggedIn, cachedUser);
  if (!user) {
    promptLogin();
    return null;
  }
  return user;
}

export function openBoardOnWeb(path: string) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  Linking.openURL(url).catch(() => {
    Alert.alert('안내', '웹 페이지를 열 수 없습니다.');
  });
}

export const boardListStyles = {
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  itemRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#333',
  },
  cellText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500' as const,
  },
  colNum: { width: 44, textAlign: 'center' as const },
  colSort: { width: 72 },
  colTitle: { flex: 1, minWidth: 80, paddingHorizontal: 4 },
  colName: { width: 64 },
  colDate: { width: 56 },
  colViews: { width: 44, textAlign: 'right' as const },
};
