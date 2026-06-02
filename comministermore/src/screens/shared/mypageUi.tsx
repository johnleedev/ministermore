import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { mpColors, MP_SCREEN_PADDING_H } from './mypageTheme';

export function MmLogo({ size = 42 }: { size?: number }) {
  const radius = Math.round(size * 0.33);
  const fontSize = Math.round(size * 0.52);
  return (
    <View style={[styles.logo, { width: size, height: size, borderRadius: radius }]}>
      <Text style={[styles.logoText, { fontSize }]}>M</Text>
    </View>
  );
}

export function PageDots({ total, active }: { total: number; active: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
      ))}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, style]}>
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}>
      <Text style={styles.ghostBtnText}>{label}</Text>
    </Pressable>
  );
}

export function IconCircleButton({
  icon,
  onPress,
  showDot,
}: {
  icon: string;
  onPress?: () => void;
  showDot?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
      <MaterialIcons name={icon} size={20} color="#374151" />
      {showDot ? <View style={styles.iconDot} /> : null}
    </Pressable>
  );
}

export function TogglePill({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.toggle, value ? styles.toggleOn : styles.toggleOff]}>
      <View style={[styles.toggleKnob, value ? styles.toggleKnobOn : styles.toggleKnobOff]} />
    </Pressable>
  );
}

export function ScreenHeader({
  title,
  left,
  right,
}: {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <View style={styles.screenHeader}>
      <View style={styles.screenHeaderLeft}>
        {left}
        <Text style={styles.screenTitle}>{title}</Text>
      </View>
      {right ? <View style={styles.screenHeaderRight}>{right}</View> : null}
    </View>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
      <MaterialIcons name="chevron-left" size={28} color="#374151" />
    </Pressable>
  );
}

/** 알림 설정 등 — 뒤로가기 + 가운데 제목 */
export function BackCenterHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.subHeader}>
      <BackButton onPress={onBack} />
      <Text style={[styles.subHeaderTitle, styles.subHeaderTitleCenter]}>{title}</Text>
      <View style={styles.backBtnPlaceholder} />
    </View>
  );
}

/** 알림 상세 — 뒤로가기 + 제목 + 우측 액션 */
export function SubScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={styles.subHeader}>
      <View style={styles.subHeaderLeft}>
        <BackButton onPress={onBack} />
        <Text style={styles.subHeaderTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function mpScreenContentStyle(paddingBottom: number) {
  return {
    paddingHorizontal: MP_SCREEN_PADDING_H,
    paddingTop: 16,
    paddingBottom,
  };
}

const styles = StyleSheet.create({
  logo: {
    backgroundColor: mpColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  logoText: { color: '#fff', fontWeight: '800' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: mpColors.dotInactive },
  dotActive: { width: 22, borderRadius: 999, backgroundColor: mpColors.primary },
  primaryBtn: {
    height: 54,
    borderRadius: 18,
    backgroundColor: mpColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: mpColors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 15,
    elevation: 3,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  ghostBtn: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  ghostBtnText: { color: mpColors.textMuted, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#e2e8f5',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: mpColors.primary,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 999,
    justifyContent: 'center',
    marginLeft: 'auto' as const,
  },
  toggleOn: { backgroundColor: mpColors.primary },
  toggleOff: { backgroundColor: mpColors.toggleOff },
  toggleKnob: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleKnobOn: { left: 24 },
  toggleKnobOff: { left: 4 },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  screenHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  screenHeaderRight: { flexDirection: 'row', gap: 12 },
  screenTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: mpColors.text,
    letterSpacing: -1.2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#e2e8f5',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: { width: 38 },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  subHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  subHeaderTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: mpColors.text,
    letterSpacing: -0.8,
  },
  subHeaderTitleCenter: { flex: 1, textAlign: 'center' },
});
