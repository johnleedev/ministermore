import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { screenUiColors as c } from './screenUiTheme';

export type ScreenTabItem<T extends string> = {
  key: T;
  label: string;
};

type ScreenCategoryTabsProps<T extends string> = {
  tabs: readonly ScreenTabItem<T>[];
  active: T;
  onChange: (key: T) => void;
};

/**
 * 구인·수련회·예배·게시판 상단 2~4개 서브탭 — mockup category-tabs(pill) 통일
 */
export function ScreenCategoryTabs<T extends string>({
  tabs,
  active,
  onChange,
}: ScreenCategoryTabsProps<T>) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.content}>
        {tabs.map(tab => {
          const isActive = active === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onChange(tab.key)}>
              <Text style={[styles.pillText, isActive && styles.pillTextActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: c.card,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: c.borderLight,
    backgroundColor: c.card,
  },
  pillActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  pillText: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '600',
    color: c.textMuted,
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: 'center' },
      default: {},
    }),
  },
  pillTextActive: {
    color: '#fff',
  },
});
