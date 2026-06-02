export interface CommunityPost {
  id: number;
  sort: string;
  region?: string;
  title: string;
  content: string;
  userAccount: string;
  userNickName: string;
  isLiked?: string;
  date: string;
  views: string | number;
  images: string;
  commentCount?: number;
}

export interface CommunityComment {
  id: number;
  post_id: number;
  content: string;
  userAccount: string;
  userNickName: string;
  date: string;
}

export interface CommunityBoardConfig {
  boardTitle: string;
  detailTitle: string;
  apiBase: string;
  routePrefix: string;
  /** 라우팅·API 기본 구분값 (free / used / events) */
  sort: string;
  /** 글쓰기 시 선택 가능한 구분 */
  categoryOptions: string[];
  /** 중고·집회 게시판 지역 선택 (DB region 컬럼) */
  regionOptions?: string[];
  imagePath: string;
  listPath: string;
  postPath: string;
  detailPath: string;
  listRoute?: string;
  searchRoute?: string;
  viewsRoute?: string;
  postRoute?: string;
  getAllCommentsRoute?: string;
  getIsLikedRoute?: string;
  deletePostRoute?: string;
  editPostRoute?: string;
  adminSetNoticeRoute?: string;
  commentsInputRoute?: string;
  commentDeleteRoute?: string;
  isLikedToggleRoute?: string;
  searchLabel?: string;
  searchHint?: string;
  searchPlaceholder?: string;
}
