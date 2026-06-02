import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export type StickySearchBarProps = {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmitSearch: () => void;
  onClear: () => void;
  /** 입력값이 비어 있어도 X 표시 (필터만 적용된 경우 등) */
  showClearWhenEmpty?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  inputBgColor?: string;
};

export function StickySearchBar({
  placeholder = '검색어를 입력해주세요',
  value,
  onChangeText,
  onSubmitSearch,
  onClear,
  showClearWhenEmpty = false,
  backgroundColor = '#ffffff',
  borderColor = '#e8ecf0',
  inputBgColor = '#ffffff',
}: StickySearchBarProps) {
  const showClear = value.length > 0 || showClearWhenEmpty;

  return (
    <View style={[styles.stickyWrap, { backgroundColor, borderBottomColor: borderColor }]}>
      <View style={[styles.bar, { backgroundColor: inputBgColor, borderColor }]}>
        <MaterialIcons name="search" size={18} color="#9aa3ad" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#b0b8c1"
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          onSubmitEditing={onSubmitSearch}
          clearButtonMode="never"
        />
        {showClear ? (
          <Pressable
            onPress={onClear}
            hitSlop={8}
            accessibilityLabel="검색어 지우기"
            style={styles.clearBtn}>
            <MaterialIcons name="close" size={20} color="#888" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stickyWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    padding: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
