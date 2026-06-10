import {
  createContext,
  useCallback,
  useContext,
  useRef,
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
import { loginColors as c } from './loginTheme';

const LoginKeyboardScrollContext = createContext<
  (e: NativeSyntheticEvent<TargetedEvent>) => void
>(() => {});

/** TextInput `onFocus`에 연결 — 포커스된 입력창이 키보드 위로 스크롤 */
export function useLoginInputFocusScroll() {
  return useContext(LoginKeyboardScrollContext);
}

type Props = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  withGlow?: boolean;
};

/** 로그인·회원가입 화면 — 키보드가 입력창을 가리지 않도록 스크롤·패딩 처리 */
export function LoginKeyboardScreen({
  children,
  contentContainerStyle,
  withGlow = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const scrollFocusedInput = useCallback((e: NativeSyntheticEvent<TargetedEvent>) => {
    const node = e.target;
    if (!node || !scrollRef.current) {
      return;
    }
    const responder = scrollRef.current.getScrollResponder?.();
    responder?.scrollResponderScrollNativeHandleToKeyboard?.(node, 120, true);
  }, []);

  return (
    <LoginKeyboardScrollContext.Provider value={scrollFocusedInput}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <View style={styles.bg}>
          {withGlow ? <View style={styles.topGlow} pointerEvents="none" /> : null}
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: 48 + insets.bottom },
              contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={Keyboard.dismiss}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </LoginKeyboardScrollContext.Provider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bg: { flex: 1, backgroundColor: c.bg },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: c.bgGlow,
    opacity: 0.55,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
});
