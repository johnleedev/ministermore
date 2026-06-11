export interface CastingReturnState {
  sort: string;
  searchWord?: string;
  isSearching?: boolean;
  scrollY?: number;
  currentPage?: number;
}

const CASTING_LIST_RESTORE_KEY = 'casting-list-scroll-restore';
const CASTING_LIST_AWAITING_KEY = 'casting-list-awaiting-restore';

type StoredCastingListRestore = CastingReturnState & { savedAt: number };

export function saveCastingListRestore(state: CastingReturnState) {
  const payload: StoredCastingListRestore = { ...state, savedAt: Date.now() };
  sessionStorage.setItem(CASTING_LIST_RESTORE_KEY, JSON.stringify(payload));
  sessionStorage.setItem(CASTING_LIST_AWAITING_KEY, '1');
}

export function shouldRestoreCastingList(): boolean {
  return sessionStorage.getItem(CASTING_LIST_AWAITING_KEY) === '1';
}

export function loadCastingListRestore(ttlMs = 10 * 60 * 1000): CastingReturnState | null {
  const raw = sessionStorage.getItem(CASTING_LIST_RESTORE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredCastingListRestore;
    if (Date.now() - parsed.savedAt > ttlMs) {
      clearCastingListRestore();
      return null;
    }
    const { savedAt: _savedAt, ...state } = parsed;
    return state;
  } catch {
    return null;
  }
}

export function clearCastingListRestore() {
  sessionStorage.removeItem(CASTING_LIST_RESTORE_KEY);
  sessionStorage.removeItem(CASTING_LIST_AWAITING_KEY);
}

export interface CastingListLocationState {
  castingReturn?: CastingReturnState;
}

export interface CastingDetailLocationState {
  castingReturn?: CastingReturnState;
}

export const CASTING_LIST_PATH = '/retreat/casting';
