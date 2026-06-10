import type { ReactNode } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TargetedEvent,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { MAIN_API_BASE } from '../../../config/api';
import { useFormInputFocusScroll } from '../../shared/FormKeyboardScreen';
import { jobColors as c } from './jobsTheme';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {children}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

export function FormTextInput({
  value,
  onChangeText,
  placeholder,
  multiline,
  maxLength,
  multilineMinHeight,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  /** multiline일 때 최소 높이 (기본 100) */
  multilineMinHeight?: number;
}) {
  const scrollIntoView = useFormInputFocusScroll();
  return (
    <TextInput
      style={[
        styles.input,
        multiline && styles.textarea,
        multiline && multilineMinHeight != null ? { minHeight: multilineMinHeight } : null,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.textMuted2}
      multiline={multiline}
      maxLength={maxLength}
      onFocus={(e: NativeSyntheticEvent<TargetedEvent>) => scrollIntoView(e)}
    />
  );
}

export function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
    </View>
  );
}

export function SingleChipSelect({
  options,
  value,
  onChange,
  renderOption,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  renderOption?: (item: string, selected: boolean) => ReactNode;
}) {
  return (
    <View style={styles.chipGrid}>
      {options.map(item => {
        const selected = value === item;
        return (
          <Pressable
            key={item}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onChange(selected ? '' : item)}>
            {renderOption ? (
              renderOption(item, selected)
            ) : (
              <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={2}>
                {item}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export function MultiChipSelect({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = value ? value.split(', ').filter(Boolean) : [];
  return (
    <View style={styles.chipGrid}>
      {options.map(item => {
        const active = selected.includes(item);
        return (
          <Pressable
            key={item}
            style={[styles.chip, active && styles.chipSelected]}
            onPress={() => {
              const next = active ? selected.filter(v => v !== item) : [...selected, item];
              onChange(next.join(', '));
            }}>
            <Text style={[styles.chipText, active && styles.chipTextSelected]} numberOfLines={2}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ReligiousBodyChip({ item, selected }: { item: string; selected: boolean }) {
  return (
    <View style={styles.religiousChip}>
      <Image
        source={{ uri: `${API_BASE}/siteimages/religiousbody/${encodeURIComponent(item)}.jpg` }}
        style={styles.religiousIcon}
      />
      <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={2}>
        {item}
      </Text>
    </View>
  );
}

export function SortRowControls({
  sort,
  sortOptions,
  onSortChange,
  onAdd,
  onRemove,
  showRemove,
}: {
  sort: string;
  sortOptions: string[];
  onSortChange: (v: string) => void;
  onAdd: () => void;
  onRemove: () => void;
  showRemove: boolean;
}) {
  return (
    <View style={styles.sortRow}>
      <View style={styles.sortChipWrap}>
        {sortOptions.map(opt => (
          <Pressable
            key={opt}
            style={[styles.sortChip, sort === opt && styles.sortChipOn]}
            onPress={() => onSortChange(opt)}>
            <Text style={[styles.sortChipText, sort === opt && styles.sortChipTextOn]}>{opt}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.iconBtn} onPress={onAdd}>
        <MaterialIcons name="add" size={20} color={c.primary} />
      </Pressable>
      {showRemove ? (
        <Pressable style={styles.iconBtn} onPress={onRemove}>
          <MaterialIcons name="remove" size={20} color="#E53935" />
        </Pressable>
      ) : null}
    </View>
  );
}

export function OptionPickerRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.pickerBlock}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.chipGrid}>
        {options.map(opt => {
          const selected = value === opt;
          return (
            <Pressable
              key={opt}
              style={[styles.miniChip, selected && styles.chipSelected]}
              onPress={() => onChange(opt)}>
              <Text style={[styles.miniChipText, selected && styles.chipTextSelected]}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SubmitBar({ submitting, onSubmit }: { submitting: boolean; onSubmit: () => void }) {
  return (
    <Pressable
      style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
      disabled={submitting}
      onPress={onSubmit}>
      <Text style={styles.submitBtnText}>{submitting ? '등록 중…' : '저장하기'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: c.text,
    marginTop: 8,
    marginBottom: 12,
  },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: c.textSecondary, marginBottom: 8 },
  required: { color: '#E53935' },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: c.text,
    backgroundColor: '#fff',
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: c.borderLight,
    backgroundColor: '#fff',
    maxWidth: '48%',
  },
  chipSelected: { borderColor: c.primary, backgroundColor: c.primarySoft },
  chipText: { fontSize: 12, color: c.textSecondary, textAlign: 'center' },
  chipTextSelected: { color: c.primary, fontWeight: '700' },
  religiousChip: { alignItems: 'center', gap: 4, minWidth: 72 },
  religiousIcon: { width: 28, height: 28, borderRadius: 6 },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sortChipWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sortChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  sortChipOn: { borderColor: c.primary, backgroundColor: c.primarySoft },
  sortChipText: { fontSize: 11, color: c.textMuted },
  sortChipTextOn: { color: c.primary, fontWeight: '700' },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  pickerBlock: { marginBottom: 8 },
  pickerLabel: { fontSize: 12, color: c.textMuted, marginBottom: 6 },
  miniChip: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.borderLight,
    backgroundColor: '#fff',
  },
  miniChipText: { fontSize: 11, color: c.textSecondary },
  submitBtn: {
    marginTop: 8,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
