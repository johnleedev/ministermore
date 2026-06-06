import { BOARD_NOTICE_SORT } from './boardConfigs';
import type { CommunityPost } from './BoardTypes';

export function isBoardNoticePost(post: CommunityPost | null | undefined): boolean {
  return String(post?.sort ?? '').trim() === BOARD_NOTICE_SORT;
}

/**
 * API 응답 → 공지(상단 고정) / 일반 글 분리
 * noticePosts가 비어 있어도 resultData에 섞인 공지를 추출합니다.
 */
export function parseBoardListPayload(
  resultData: CommunityPost[] | undefined,
  noticePosts: CommunityPost[] | undefined,
): { notices: CommunityPost[]; regular: CommunityPost[] } {
  const regularRaw = Array.isArray(resultData) ? resultData : [];
  const noticeById = new Map<number, CommunityPost>();

  for (const post of noticePosts ?? []) {
    if (isBoardNoticePost(post)) {
      noticeById.set(post.id, post);
    }
  }

  for (const post of regularRaw) {
    if (isBoardNoticePost(post)) {
      noticeById.set(post.id, post);
    }
  }

  const notices = Array.from(noticeById.values()).sort((a, b) => b.id - a.id);
  const regular = regularRaw.filter(p => !noticeById.has(p.id));

  return { notices, regular };
}
