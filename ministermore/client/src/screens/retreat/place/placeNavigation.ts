export type PlaceListViewMode = 'list' | 'map';

export interface PlaceReturnState {
  viewMode: PlaceListViewMode;
  region: string;
  searchWord?: string;
  isSearching?: boolean;
  scrollY?: number;
  currentPage?: number;
}

const PLACE_LIST_RESTORE_KEY = 'place-list-scroll-restore';
const PLACE_LIST_AWAITING_KEY = 'place-list-awaiting-restore';

type StoredPlaceListRestore = PlaceReturnState & { savedAt: number };

export function savePlaceListRestore(state: PlaceReturnState) {
  const payload: StoredPlaceListRestore = { ...state, savedAt: Date.now() };
  sessionStorage.setItem(PLACE_LIST_RESTORE_KEY, JSON.stringify(payload));
  sessionStorage.setItem(PLACE_LIST_AWAITING_KEY, '1');
}

export function shouldRestorePlaceList(): boolean {
  return sessionStorage.getItem(PLACE_LIST_AWAITING_KEY) === '1';
}

export function loadPlaceListRestore(ttlMs = 10 * 60 * 1000): PlaceReturnState | null {
  const raw = sessionStorage.getItem(PLACE_LIST_RESTORE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredPlaceListRestore;
    if (Date.now() - parsed.savedAt > ttlMs) {
      clearPlaceListRestore();
      return null;
    }
    const { savedAt: _savedAt, ...state } = parsed;
    return state;
  } catch {
    return null;
  }
}

export function clearPlaceListRestore() {
  sessionStorage.removeItem(PLACE_LIST_RESTORE_KEY);
  sessionStorage.removeItem(PLACE_LIST_AWAITING_KEY);
}

export interface PlaceListLocationState {
  placeReturn?: PlaceReturnState;
}

export interface PlaceDetailLocationState {
  placeReturn?: PlaceReturnState;
}

export const PLACE_LIST_PATH = '/retreat/place';
