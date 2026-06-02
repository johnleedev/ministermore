import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type RecruitListSearchHeaderProps<TTab extends string = string> = {
  searchWord: string;
  onSearchWordChange: (value: string) => void;
  onSubmitSearch: () => void;
  onClearAll: () => void;
  tabs?: readonly TTab[];
  activeTab?: TTab;
  onTabChange?: (tab: TTab) => void;
  filterItems: string[];
  isFilterSelected: (item: string) => boolean;
  onFilterPress: (item: string) => void;
  selectedTags: string[];
  onRemoveTag: (item: string) => void;
  renderFilterContent?: (item: string) => ReactNode;
};

export function RecruitListSearchHeader<TTab extends string = string>({
  searchWord,
  onSearchWordChange,
  onSubmitSearch,
  onClearAll,
  tabs,
  activeTab,
  onTabChange,
  filterItems,
  isFilterSelected,
  onFilterPress,
  selectedTags,
  onRemoveTag,
  renderFilterContent,
}: RecruitListSearchHeaderProps<TTab>) {
  return (
    <>
      <View style={styles.searchInputRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="교회명, 제목으로 검색"
          placeholderTextColor="#9CA3AF"
          value={searchWord}
          onChangeText={onSearchWordChange}
          returnKeyType="search"
          onSubmitEditing={onSubmitSearch}
        />
        <Pressable onPress={onClearAll} hitSlop={8} style={styles.clearBtn}>
          <MaterialIcons name="close" size={22} color="#888" />
        </Pressable>
      </View>

      {tabs && tabs.length > 0 && activeTab && onTabChange ? (
        <View style={styles.tabRow}>
          {tabs.map(tab => (
            <Pressable
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => onTabChange(tab)}>
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.filterGrid}>
        {filterItems.map(item => {
          const selected = isFilterSelected(item);
          return (
            <Pressable
              key={item}
              style={[styles.checkInputBox, selected && styles.checkInputBoxSelected]}
              onPress={() => onFilterPress(item)}>
              {renderFilterContent ? (
                renderFilterContent(item)
              ) : (
                <Text style={styles.checkInputBoxText}>{item}</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {selectedTags.length > 0 ? (
        <View style={styles.tagRow}>
          {selectedTags.map(item => (
            <View key={item} style={styles.tag}>
              <Text style={styles.tagText}>{item}</Text>
              <Pressable onPress={() => onRemoveTag(item)} hitSlop={8} style={styles.tagRemove}>
                <Text style={styles.tagRemoveText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
    paddingRight: 4,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 10,
    fontSize: 15,
    color: '#111',
  },
  clearBtn: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tabBtn: {
    width: 100,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: { backgroundColor: '#333', borderColor: '#333' },
  tabBtnText: { fontSize: 16, fontWeight: '500', color: '#888' },
  tabBtnTextActive: { color: '#fff', fontWeight: '700' },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  checkInputBox: {
    flexBasis: '48%',
    flexGrow: 1,
    maxWidth: '48%',
    paddingVertical: 10,
    paddingHorizontal: 7,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInputBoxSelected: { borderColor: '#3f51b5', backgroundColor: '#f5f7ff' },
  checkInputBoxText: { fontSize: 14, color: '#111', textAlign: 'center' },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 4,
    borderRadius: 999,
    backgroundColor: '#f0f2f8',
    borderWidth: 1,
    borderColor: '#d0d7e8',
  },
  tagText: { fontSize: 14, color: '#1a237e', fontWeight: '600' },
  tagRemove: { marginLeft: 2, paddingHorizontal: 6 },
  tagRemoveText: { fontSize: 18, color: '#666', lineHeight: 20 },
});
