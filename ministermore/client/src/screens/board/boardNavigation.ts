import type { CommunityPost } from './BoardTypes';

export interface BoardReturnState {
  currentPage?: number;
  scrollY?: number;
  activeCategory?: string | null;
  activeRegion?: string | null;
}

export interface BoardListLocationState {
  boardReturn?: BoardReturnState;
}

export interface BoardDetailLocationState {
  data?: CommunityPost;
  sort?: string;
  menuNum?: number;
  boardReturn?: BoardReturnState;
}

const restoreKey = (listPath: string) => `board-list-restore:${listPath}`;
const awaitingKey = (listPath: string) => `board-list-awaiting:${listPath}`;

type StoredBoardListRestore = BoardReturnState & { savedAt: number };

export const RESTORE_TTL_MS = 10 * 60 * 1000;

export function saveBoardListRestore(listPath: string, state: BoardReturnState) {
  const payload: StoredBoardListRestore = { ...state, savedAt: Date.now() };
  sessionStorage.setItem(restoreKey(listPath), JSON.stringify(payload));
  sessionStorage.setItem(awaitingKey(listPath), '1');
}

export function shouldRestoreBoardList(listPath: string): boolean {
  return sessionStorage.getItem(awaitingKey(listPath)) === '1';
}

export function loadBoardListRestore(listPath: string, ttlMs = RESTORE_TTL_MS): BoardReturnState | null {
  const raw = sessionStorage.getItem(restoreKey(listPath));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredBoardListRestore;
    if (Date.now() - parsed.savedAt > ttlMs) {
      clearBoardListRestore(listPath);
      return null;
    }
    const { savedAt: _savedAt, ...state } = parsed;
    return state;
  } catch {
    return null;
  }
}

export function clearBoardListRestore(listPath: string) {
  sessionStorage.removeItem(restoreKey(listPath));
  sessionStorage.removeItem(awaitingKey(listPath));
}

export const restoreScroll = (scrollY: number) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  });
};

export const resolveInitialBoardReturn = (
  locationState: BoardListLocationState | null,
  listPath: string,
): BoardReturnState | null => {
  const fromRouter = locationState?.boardReturn;
  if (fromRouter) return fromRouter;
  if (shouldRestoreBoardList(listPath)) return loadBoardListRestore(listPath, RESTORE_TTL_MS);
  return null;
};

export const boardReturnShouldRestoreScroll = (state: BoardReturnState) =>
  (state.scrollY ?? 0) > 0 ||
  (state.currentPage ?? 1) > 1 ||
  state.activeCategory != null ||
  state.activeRegion != null;
