export const ROOT_TAB_KEYS = [
  'Home',
  'Jobs',
  'Retreat',
  'Worship',
  'Board',
  'Notifi',
  'Mypage',
] as const;

export type RootTabKey = (typeof ROOT_TAB_KEYS)[number];

export const INITIAL_ROOT_TAB_SCROLL_REQUESTS: Record<RootTabKey, number> = {
  Home: 0,
  Jobs: 0,
  Retreat: 0,
  Worship: 0,
  Board: 0,
  Notifi: 0,
  Mypage: 0,
};
