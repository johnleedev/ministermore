import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
  type NativeScrollEvent,
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
  (e: NativeSyntheticEvent<TargetedEvent>, extraOffset?: number) => void
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
  const scrollYRef = useRef(0);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const lastFocusRef = useRef<{ node: number; offset: number } | null>(null);

  const scrollNodeAboveKeyboard = useCallback(
    (node: number, extraOffset = 120) => {
      if (!scrollRef.current) {
        return;
      }

      if (Platform.OS === 'ios') {
        const responder = scrollRef.current.getScrollResponder?.();
        responder?.scrollResponderScrollNativeHandleToKeyboard?.(node, extraOffset, true);
        return;
      }

      UIManager.measureInWindow(node, (x, y, width, height) => {
        const windowHeight = Dimensions.get('window').height;
        const inputBottom = y + height;
        const visibleBottom = windowHeight - extraOffset;
        if (inputBottom > visibleBottom) {
          scrollRef.current?.scrollTo({
            y: scrollYRef.current + (inputBottom - visibleBottom),
            animated: true,
          });
        }
      });
    },
    [scrollRef],
  );

  const scrollFocusedInput = useCallback(
    (e: NativeSyntheticEvent<TargetedEvent>, extraOffset = 120) => {
      const node = e.target;
      if (!node) {
        return;
      }
      lastFocusRef.current = { node, offset: extraOffset };
      scrollNodeAboveKeyboard(node, extraOffset);
      if (Platform.OS === 'android') {
        [50, 150, 300].forEach(delay => {
          setTimeout(() => scrollNodeAboveKeyboard(node, extraOffset), delay);
        });
      }
    },
    [scrollNodeAboveKeyboard],
  );

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      setKeyboardInset(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardInset(0);
      lastFocusRef.current = null;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android' || keyboardInset <= 0 || !lastFocusRef.current) {
      return;
    }
    const { node, offset } = lastFocusRef.current;
    const scroll = () => scrollNodeAboveKeyboard(node, offset);
    scroll();
    const t1 = setTimeout(scroll, 50);
    const t2 = setTimeout(scroll, 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [keyboardInset, scrollNodeAboveKeyboard]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollYRef.current = event.nativeEvent.contentOffset.y;
      if (showFloatingTop) {
        onScroll(event);
      }
    },
    [showFloatingTop, onScroll],
  );

  const androidKeyboardPad = Platform.OS === 'android' ? keyboardInset : 0;
  const bottomPad =
    (showFloatingTop ? LIST_FAB_SCROLL_PADDING : 48) + insets.bottom + androidKeyboardPad;

  return (
    <FormKeyboardScrollContext.Provider value={scrollFocusedInput}>
      <View style={[styles.flex, { backgroundColor }]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
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
