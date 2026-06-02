import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type TargetedEvent,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FloatingScrollActions,
  LIST_FAB_SCROLL_PADDING,
  useScrollViewScrollToTop,
} from './listScrollUi';

const FormKeyboardScrollContext = createContext<
  (e: NativeSyntheticEvent<TargetedEvent>) => void
>(() => {});

export function useFormInputFocusScroll() {
  return useContext(FormKeyboardScrollContext);
}

type Props = {
  children: ReactNode;
  backgroundColor?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** 글쓰기 폼 하단 우측 탑 버튼 (기본 true) */
  showFloatingTop?: boolean;
};

export function FormKeyboardScreen({
  children,
  backgroundColor = '#ffffff',
  contentContainerStyle,
  showFloatingTop = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const { scrollRef, showTopBtn, onScroll, scrollToTop } = useScrollViewScrollToTop();

  const scrollFocusedInput = useCallback((e: NativeSyntheticEvent<TargetedEvent>) => {
    const node = e.target;
    if (!node || !scrollRef.current) {
      return;
    }
    const responder = scrollRef.current.getScrollResponder?.();
    responder?.scrollResponderScrollNativeHandleToKeyboard?.(node, 120, true);
  }, [scrollRef]);

  const bottomPad = showFloatingTop
    ? LIST_FAB_SCROLL_PADDING + insets.bottom
    : 48 + insets.bottom;

  return (
    <FormKeyboardScrollContext.Provider value={scrollFocusedInput}>
      <View style={[styles.flex, { backgroundColor }]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
            onScroll={showFloatingTop ? onScroll : undefined}
            scrollEventThrottle={16}
            onScrollBeginDrag={Keyboard.dismiss}>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
        {showFloatingTop ? (
          <FloatingScrollActions showTop={showTopBtn} onScrollToTop={scrollToTop} />
        ) : null}
      </View>
    </FormKeyboardScrollContext.Provider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
