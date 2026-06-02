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
  sort: string;
  categoryOptions: string[];
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
  commentsInputRoute?: string;
  commentDeleteRoute?: string;
  isLikedToggleRoute?: string;
  searchLabel?: string;
  searchHint?: string;
  searchPlaceholder?: string;
  /** 목록에서 본문 일부 미리보기 (자유게시판 등) */
  showListContentPreview?: boolean;
}
