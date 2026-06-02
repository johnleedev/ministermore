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
};

export function FormKeyboardScreen({
  children,
  backgroundColor = '#ffffff',
  contentContainerStyle,
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
    <FormKeyboardScrollContext.Provider value={scrollFocusedInput}>
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
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
      </KeyboardAvoidingView>
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
