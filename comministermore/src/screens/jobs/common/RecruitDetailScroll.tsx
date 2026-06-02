import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  FloatingScrollActions,
  LIST_FAB_SCROLL_PADDING,
  useScrollViewScrollToTop,
} from '../../shared/listScrollUi';
import { jobColors } from './jobsTheme';

type Props = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function RecruitDetailScroll({ children, contentContainerStyle }: Props) {
  const { scrollRef, showTopBtn, onScroll, scrollToTop } = useScrollViewScrollToTop();

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <FloatingScrollActions showTop={showTopBtn} onScrollToTop={scrollToTop} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: jobColors.bg },
  scroll: { flex: 1 },
  content: { padding: 14, paddingBottom: LIST_FAB_SCROLL_PADDING, gap: 14 },
});
