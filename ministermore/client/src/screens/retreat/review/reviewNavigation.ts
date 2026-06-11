export interface ReviewReturnState {
  currentPage?: number;
  scrollY?: number;
}

const REVIEW_LIST_RESTORE_KEY = 'review-list-scroll-restore';
const REVIEW_LIST_AWAITING_KEY = 'review-list-awaiting-restore';

type StoredReviewListRestore = ReviewReturnState & { savedAt: number };

export function saveReviewListRestore(state: ReviewReturnState) {
  const payload: StoredReviewListRestore = { ...state, savedAt: Date.now() };
  sessionStorage.setItem(REVIEW_LIST_RESTORE_KEY, JSON.stringify(payload));
  sessionStorage.setItem(REVIEW_LIST_AWAITING_KEY, '1');
}

export function shouldRestoreReviewList(): boolean {
  return sessionStorage.getItem(REVIEW_LIST_AWAITING_KEY) === '1';
}

export function loadReviewListRestore(ttlMs = 10 * 60 * 1000): ReviewReturnState | null {
  const raw = sessionStorage.getItem(REVIEW_LIST_RESTORE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredReviewListRestore;
    if (Date.now() - parsed.savedAt > ttlMs) {
      clearReviewListRestore();
      return null;
    }
    const { savedAt: _savedAt, ...state } = parsed;
    return state;
  } catch {
    return null;
  }
}

export function clearReviewListRestore() {
  sessionStorage.removeItem(REVIEW_LIST_RESTORE_KEY);
  sessionStorage.removeItem(REVIEW_LIST_AWAITING_KEY);
}

export interface ReviewListLocationState {
  reviewReturn?: ReviewReturnState;
}

export interface ReviewDetailLocationState {
  reviewReturn?: ReviewReturnState;
}

export const REVIEW_LIST_PATH = '/retreat/review';
