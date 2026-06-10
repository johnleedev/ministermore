import { useCallback, useRef, type RefObject } from 'react';
import type { FlatList, ScrollView } from 'react-native';
import { useRootTabScrollToTopOnRequest } from './useRootTabScrollToTopOnRequest';

/**
 * 알림 탭(`TabScrollProvider tab="Notifi"`)에서 같은 탭 재탭 시 스크롤 맨 위.
 */
export function useNotificationsScrollToTopOnRequest<T>(
  listRef?: RefObject<FlatList<T> | null>,
  scrollRef?: RefObject<ScrollView | null>,
) {
  const isAtTopRef = useRef(true);

  const scrollToTop = useCallback((): boolean => {
    if (isAtTopRef.current) {
      return true;
    }
    listRef?.current?.scrollToOffset({ offset: 0, animated: true });
    scrollRef?.current?.scrollTo({ y: 0, animated: true });
    return false;
  }, [listRef, scrollRef]);

  const onScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    isAtTopRef.current = event.nativeEvent.contentOffset.y <= 8;
  }, []);

  useRootTabScrollToTopOnRequest(scrollToTop);

  return { onScroll };
}
