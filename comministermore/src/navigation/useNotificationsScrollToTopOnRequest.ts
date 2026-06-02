import { useCallback, type RefObject } from 'react';
import type { FlatList, ScrollView } from 'react-native';
import { useRootTabScrollToTopOnRequest } from './useRootTabScrollToTopOnRequest';

/**
 * 알림 탭(`TabScrollProvider tab="Notifi"`)에서 같은 탭 재탭 시 스크롤 맨 위.
 */
export function useNotificationsScrollToTopOnRequest<T>(
  listRef?: RefObject<FlatList<T> | null>,
  scrollRef?: RefObject<ScrollView | null>,
) {
  const scrollToTop = useCallback(() => {
    listRef?.current?.scrollToOffset({ offset: 0, animated: true });
    scrollRef?.current?.scrollTo({ y: 0, animated: true });
  }, [listRef, scrollRef]);

  useRootTabScrollToTopOnRequest(scrollToTop);
}
