import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { worshipColors as c } from './worshipTheme';

export function WorshipWhiteCard({ children }: { children: ReactNode }) {
  return <View style={cardStyles.whiteCard}>{children}</View>;
}

export function WorshipSectionHeading({ title }: { title: string }) {
  return (
    <View style={cardStyles.sectionHeading}>
      <MaterialIcons name="search" size={20} color={c.primary} />
      <Text style={cardStyles.sectionHeadingText}>{title}</Text>
    </View>
  );
}

type SelectSummary = { label: string; value: string };

export function WorshipSelectRow({ items }: { items: SelectSummary[] }) {
  return (
    <View style={cardStyles.dropdownRow}>
      {items.map(item => (
        <View key={item.label} style={cardStyles.selectBox}>
          <Text style={cardStyles.selectBoxLabel}>{item.label}</Text>
          <View style={cardStyles.selectBoxValue}>
            <Text style={cardStyles.selectBoxValueText} numberOfLines={1}>
              {item.value}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={14} color={c.textMuted2} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function WorshipFilterGroup({
  label,
  icon,
  onReset,
  children,
}: {
  label: string;
  icon: string;
  onReset: () => void;
  children: ReactNode;
}) {
  return (
    <View style={cardStyles.filterGroup}>
      <View style={cardStyles.filterGroupHeader}>
        <View style={cardStyles.filterGroupLabel}>
          <MaterialIcons name={icon as 'percent'} size={13} color={c.primary} />
          <Text style={cardStyles.filterGroupLabelText}>{label}</Text>
        </View>
        <Pressable onPress={onReset} hitSlop={8}>
          <Text style={cardStyles.filterResetBtn}>초기화</Text>
        </Pressable>
      </View>
      <View style={cardStyles.filterBtnRow}>{children}</View>
    </View>
  );
}

export function WorshipFilterBtn({
  label,
  active,
  onPress,
  variant = 'pill',
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  variant?: 'pill' | 'key';
}) {
  return (
    <Pressable
      style={[
        cardStyles.filterBtn,
        variant === 'key' && cardStyles.filterBtnKey,
        active && cardStyles.filterBtnActive,
      ]}
      onPress={onPress}>
      <Text style={[cardStyles.filterBtnText, active && cardStyles.filterBtnTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function WorshipInfoBox({ children }: { children: ReactNode }) {
  return (
    <View style={cardStyles.infoBox}>
      <View style={cardStyles.infoBoxIcon}>
        <MaterialIcons name="lightbulb" size={14} color="#fff" />
      </View>
      <Text style={cardStyles.infoBoxText}>{children}</Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  whiteCard: {
    backgroundColor: c.card,
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: c.border,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionHeadingText: { fontSize: 18, fontWeight: '700', color: c.text },
  dropdownRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  selectBox: {
    flex: 1,
    backgroundColor: c.searchBg,
    borderWidth: 1.5,
    borderColor: c.borderLight,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  selectBoxLabel: { fontSize: 10, color: c.textMuted2, fontWeight: '500', marginBottom: 3 },
  selectBoxValue: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectBoxValueText: { fontSize: 13.5, fontWeight: '600', color: c.text, flex: 1 },
  filterGroup: { marginBottom: 16 },
  filterGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  filterGroupLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterGroupLabelText: { fontSize: 13, fontWeight: '700', color: c.text },
  filterResetBtn: { fontSize: 12, fontWeight: '500', color: c.primary },
  filterBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  filterBtn: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: c.borderLight,
    backgroundColor: c.card,
  },
  filterBtnKey: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: c.textMuted },
  filterBtnTextActive: { color: '#fff' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: c.infoBg,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 13,
    marginHorizontal: 14,
    marginTop: 10,
  },
  infoBoxIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: c.textSecondary,
    lineHeight: 19,
  },
});
