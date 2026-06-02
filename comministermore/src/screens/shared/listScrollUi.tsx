import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type SectionList,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useRootTabScrollToTopOnRequest } from '../../navigation/useRootTabScrollToTopOnRequest';

const FAB_SIZE = 56;
const FAB_GAP = 12;
const FAB_BOTTOM = 24;

export function ListLoadMoreFooter() {
  return (
    <View style={loadMoreStyles.wrap}>
      <ActivityIndicator size="large" color="#4f5460" />
      <Text style={loadMoreStyles.label}>불러오는 중...</Text>
    </View>
  );
}

type FloatingScrollActionsProps = {
  showTop: boolean;
  onScrollToTop: () => void;
  onWrite?: () => void;
};

export function FloatingScrollActions({
  showTop,
  onScrollToTop,
  onWrite,
}: FloatingScrollActionsProps) {
  const topBottom = onWrite ? FAB_BOTTOM + FAB_SIZE + FAB_GAP : FAB_BOTTOM;

  return (
    <>
      {showTop ? (
        <Pressable
          style={({ pressed }) => [
            fabStyles.fab,
            fabStyles.topFab,
            { bottom: topBottom },
            pressed && fabStyles.fabPressed,
          ]}
          onPress={onScrollToTop}
          hitSlop={8}
          accessibilityLabel="맨 위로">
          <MaterialIcons name="keyboard-arrow-up" size={32} color="#FFFFFF" />
        </Pressable>
      ) : null}
      {onWrite ? (
        <Pressable
          style={({ pressed }) => [
            fabStyles.fab,
            fabStyles.writeFab,
            { bottom: FAB_BOTTOM },
            pressed && fabStyles.fabPressed,
          ]}
          onPress={onWrite}
          hitSlop={8}
          accessibilityLabel="글쓰기">
          <MaterialIcons name="edit" size={24} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </>
  );
}

function useScrollToTopState() {
  const [showTopBtn, setShowTopBtn] = useState(false);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setShowTopBtn(event.nativeEvent.contentOffset.y > 320);
  }, []);

  const scrollToOffsetTop = useCallback(
    (ref: { scrollToOffset: (opts: { offset: number; animated: boolean }) => void } | null) => {
      ref?.scrollToOffset({ offset: 0, animated: true });
    },
    [],
  );

  return { showTopBtn, onScroll, scrollToOffsetTop };
}

export function useListScrollToTop<T>() {
  const listRef = useRef<FlatList<T>>(null);
  const { showTopBtn, onScroll, scrollToOffsetTop } = useScrollToTopState();

  const scrollToTop = useCallback(() => {
    scrollToOffsetTop(listRef.current);
  }, [scrollToOffsetTop]);

  useRootTabScrollToTopOnRequest(scrollToTop);

  return { listRef, showTopBtn, onScroll, scrollToTop };
}

export function useSectionListScrollToTop<T, S>() {
  const listRef = useRef<SectionList<T, S>>(null);
  const { showTopBtn, onScroll, scrollToOffsetTop } = useScrollToTopState();

  const scrollToTop = useCallback(() => {
    scrollToOffsetTop(listRef.current);
  }, [scrollToOffsetTop]);

  useRootTabScrollToTopOnRequest(scrollToTop);

  return { listRef, showTopBtn, onScroll, scrollToTop };
}

export function useScrollViewScrollToTop() {
  const scrollRef = useRef<ScrollView>(null);
  const { showTopBtn, onScroll } = useScrollToTopState();

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  useRootTabScrollToTopOnRequest(scrollToTop);

  return { scrollRef, showTopBtn, onScroll, scrollToTop };
}

export const LIST_FAB_SCROLL_PADDING = FAB_BOTTOM + FAB_SIZE + 24;

/** 글쓰기 FAB + 탑 버튼이 함께 있을 때 리스트 하단 여백 */
export const LIST_FAB_SCROLL_PADDING_WITH_WRITE =
  FAB_BOTTOM + FAB_SIZE + FAB_GAP + FAB_SIZE + 24;

const loadMoreStyles = StyleSheet.create({
  wrap: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 16,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4f5460',
  },
});

const fabStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 8,
  },
  topFab: {
    backgroundColor: '#4f5460',
  },
  writeFab: {
    backgroundColor: '#333',
  },
  fabPressed: {
    opacity: 0.88,
  },
});
