export interface PraiseReturnState {
  scrollY?: number;
  currentPage?: number;
  isSearching?: boolean;
  searchWord?: string;
  sortFilter?: string;
  keyFilter?: string;
  tempoFilter?: string;
  selectedThemes?: string[];
}

export interface PraiseListLocationState {
  praiseReturn?: PraiseReturnState;
}

export interface PraiseDetailLocationState {
  praiseReturn?: PraiseReturnState;
}

export const PRAISE_LIST_PATH = '/worship';

const PRAISE_LIST_RESTORE_KEY = 'praise-list-scroll-restore';
const PRAISE_LIST_AWAITING_KEY = 'praise-list-awaiting-restore';

type StoredPraiseListRestore = PraiseReturnState & { savedAt: number };

export const RESTORE_TTL_MS = 10 * 60 * 1000;

export function savePraiseListRestore(state: PraiseReturnState) {
  const payload: StoredPraiseListRestore = { ...state, savedAt: Date.now() };
  sessionStorage.setItem(PRAISE_LIST_RESTORE_KEY, JSON.stringify(payload));
  sessionStorage.setItem(PRAISE_LIST_AWAITING_KEY, '1');
}

export function shouldRestorePraiseList(): boolean {
  return sessionStorage.getItem(PRAISE_LIST_AWAITING_KEY) === '1';
}

export function loadPraiseListRestore(ttlMs = RESTORE_TTL_MS): PraiseReturnState | null {
  const raw = sessionStorage.getItem(PRAISE_LIST_RESTORE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredPraiseListRestore;
    if (Date.now() - parsed.savedAt > ttlMs) {
      clearPraiseListRestore();
      return null;
    }
    const { savedAt: _savedAt, ...state } = parsed;
    return state;
  } catch {
    return null;
  }
}

export function clearPraiseListRestore() {
  sessionStorage.removeItem(PRAISE_LIST_RESTORE_KEY);
  sessionStorage.removeItem(PRAISE_LIST_AWAITING_KEY);
}

export const restoreScroll = (scrollY: number) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  });
};

export const resolveInitialPraiseReturn = (
  locationState: PraiseListLocationState | null,
): PraiseReturnState | null => {
  const fromRouter = locationState?.praiseReturn;
  if (fromRouter) return fromRouter;
  if (shouldRestorePraiseList()) return loadPraiseListRestore(RESTORE_TTL_MS);
  return null;
};

export const praiseReturnHasUnifiedFilters = (state: PraiseReturnState) =>
  Boolean(
    state.isSearching &&
      (state.searchWord?.trim() ||
        state.sortFilter ||
        state.keyFilter ||
        state.tempoFilter),
  );

export const praiseReturnHasThemeFilters = (state: PraiseReturnState) =>
  Boolean(state.selectedThemes && state.selectedThemes.length > 0);

export const praiseReturnShouldRestoreScroll = (state: PraiseReturnState) =>
  (state.scrollY ?? 0) > 0 || (state.currentPage ?? 1) > 1;
