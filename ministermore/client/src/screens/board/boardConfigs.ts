import type { CommunityBoardConfig } from './BoardTypes';

/** 관리자·게시판 공지 글 구분(sort) 값 */
export const BOARD_NOTICE_SORT = '공지';

const defaultSearchFields = {
  searchLabel: '게시글 검색',
  searchHint: '제목, 내용, 작성자 닉네임으로 검색할 수 있습니다.',
} as const;

/** 중고·집회 게시판 지역 (MySQL region 컬럼) */
export const COMMUNITY_REGION_OPTIONS = [
  '서울/경기도',
  '강원도',
  '대전/충청도',
  '광주/전라도',
  '대구/부산/경상도',
  '제주도',
] as const;

export const FREE_BOARD_CONFIG: CommunityBoardConfig = {
  boardTitle: '자유게시판',
  detailTitle: '자유게시판',
  apiBase: 'freeboard',
  routePrefix: 'free',
  sort: 'free',
  categoryOptions: ['사역', '상담', '교회행정', '신학', '일상', '정보'],
  imagePath: 'free',
  listPath: '/board',
  postPath: '/board/freepost',
  detailPath: '/board/freedetail',
  ...defaultSearchFields,
  searchPlaceholder: '예: 기도, 간증, 질문',
};

export const EVENTS_BOARD_CONFIG: CommunityBoardConfig = {
  boardTitle: '집회세미나',
  detailTitle: '집회세미나',
  apiBase: 'eventsboard',
  routePrefix: 'events',
  sort: 'events',
  categoryOptions: ['목회/신학', '다음세대/교육', '찬양/미디어', '부흥회/캠프', '선교/전도'],
  regionOptions: [...COMMUNITY_REGION_OPTIONS],
  imagePath: 'events',
  listPath: '/board/events',
  postPath: '/board/eventspost',
  detailPath: '/board/eventsdetail',
  ...defaultSearchFields,
  searchPlaceholder: '예: 수련회, 세미나, 집회',
};

export const USED_BOARD_CONFIG: CommunityBoardConfig = {
  boardTitle: '중고장터',
  detailTitle: '중고장터',
  apiBase: 'usedboard',
  routePrefix: 'used',
  sort: 'used',
  categoryOptions: ['교회물품', '미디어/음향', '도서/자료', '교육/행사', '의류/기타'],
  regionOptions: [...COMMUNITY_REGION_OPTIONS],
  imagePath: 'used',
  listPath: '/board/used',
  postPath: '/board/usedpost',
  detailPath: '/board/useddetail',
  listRoute: 'getusedposts',
  searchRoute: 'getusedpostssearch',
  viewsRoute: 'usedpostsviews',
  postRoute: 'usedpost',
  getAllCommentsRoute: 'getallusedcomments',
  getIsLikedRoute: 'getusedisliked',
  deletePostRoute: 'useddeletepost',
  commentsInputRoute: 'usedcommentsinput',
  commentDeleteRoute: 'usedcommentdelete',
  isLikedToggleRoute: 'usedislikedtoggle',
  ...defaultSearchFields,
  searchPlaceholder: '예: 찬양, 교재, 강단',
};
