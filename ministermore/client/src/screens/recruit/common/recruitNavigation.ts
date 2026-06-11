export interface RecruitReturnState {
  searchWord?: string;
  selectedSort?: string[];
  selectedLocation?: string[];
  selectedReligiousbody?: string[];
  currentPage?: number;
  scrollY?: number;
}

export interface RecruitListLocationState {
  recruitState?: RecruitReturnState;
}

export interface RecruitDetailLocationState {
  recruitState?: RecruitReturnState;
}

const restoreKey = (listPath: string) => `recruit-list-restore:${listPath}`;
const awaitingKey = (listPath: string) => `recruit-list-awaiting:${listPath}`;

type StoredRecruitListRestore = RecruitReturnState & { savedAt: number };

export function saveRecruitListRestore(listPath: string, state: RecruitReturnState) {
  const payload: StoredRecruitListRestore = { ...state, savedAt: Date.now() };
  sessionStorage.setItem(restoreKey(listPath), JSON.stringify(payload));
  sessionStorage.setItem(awaitingKey(listPath), '1');
}

export function shouldRestoreRecruitList(listPath: string): boolean {
  return sessionStorage.getItem(awaitingKey(listPath)) === '1';
}

export function loadRecruitListRestore(listPath: string, ttlMs = 10 * 60 * 1000): RecruitReturnState | null {
  const raw = sessionStorage.getItem(restoreKey(listPath));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredRecruitListRestore;
    if (Date.now() - parsed.savedAt > ttlMs) {
      clearRecruitListRestore(listPath);
      return null;
    }
    const { savedAt: _savedAt, ...state } = parsed;
    return state;
  } catch {
    return null;
  }
}

export function clearRecruitListRestore(listPath: string) {
  sessionStorage.removeItem(restoreKey(listPath));
  sessionStorage.removeItem(awaitingKey(listPath));
}

export const RESTORE_TTL_MS = 10 * 60 * 1000;

export const restoreScroll = (scrollY: number) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  });
};

export const resolveInitialRecruitReturn = (
  locationState: RecruitListLocationState | null,
  listPath: string,
): RecruitReturnState | null => {
  const fromRouter = locationState?.recruitState;
  if (fromRouter) return fromRouter;
  if (shouldRestoreRecruitList(listPath)) return loadRecruitListRestore(listPath, RESTORE_TTL_MS);
  return null;
};

export const recruitReturnHasFilters = (
  state: RecruitReturnState,
  hasSortTab: boolean,
  hasLocationTab: boolean,
  hasReligiousbodyTab: boolean,
) =>
  Boolean(
    (state.searchWord && state.searchWord.trim()) ||
      (hasSortTab && state.selectedSort && state.selectedSort.length) ||
      (hasLocationTab && state.selectedLocation && state.selectedLocation.length) ||
      (hasReligiousbodyTab && state.selectedReligiousbody && state.selectedReligiousbody.length),
  );

export const recruitReturnShouldRestoreScroll = (state: RecruitReturnState) =>
  (state.scrollY ?? 0) > 0 || (state.currentPage ?? 1) > 1;
