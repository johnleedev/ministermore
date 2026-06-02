import { useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { MAIN_API_BASE } from '../../../config/api';
import { jobColors as c } from './jobsTheme';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');

/** @see client recruitConfigs — 사역자 구인 */
export const RECRUIT_CHURCH_LOGO_PATH_MINISTER = 'images/recruit/churchlogo';
/** @see client recruitConfigs — 교회·기관 구인 */
export const RECRUIT_CHURCH_LOGO_PATH_SITE = 'siteimages/churchlogos';
/** @see client RecruitList — 목록 교단 아이콘 */
export const RECRUIT_RELIGIOUSBODY_IMAGE_PATH = 'siteimages/religiousbody';

export type RecruitListItem = {
  id: string;
  title: string;
  church: string;
  churchLogo?: string;
  religiousbody: string;
  location: string;
  locationDetail?: string;
  sort: string;
  pay: string | null;
  date?: string;
};

type BadgeVariant = 'blue' | 'red' | 'orange';

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function extractPayLabel(payRaw: string | null): string {
  const payArr = safeParseJson<{ inputCost?: string }[]>(payRaw, []);
  const first = payArr[0];
  if (!first) return '협의 후 결정';
  const input = String(first.inputCost || '').trim();
  if (input === '교회내규에따라') return '교회 내규';
  if (input === '협의후결정') return '협의 후 결정';
  if (input.includes('월') || input.includes('사례')) return '월 사례비 지급';
  if (input) return input.length > 10 ? `${input.slice(0, 10)}…` : input;
  return '협의 후 결정';
}

function payBadgeVariant(label: string): BadgeVariant {
  if (label.includes('교회')) return 'red';
  if (label.includes('월') || label.includes('사례')) return 'orange';
  return 'blue';
}

function employmentLabel(sort: string): string {
  return sort;
}

export function formatRecruitRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${Math.max(1, diffMin)}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일 전`;
  return d.toLocaleDateString('ko-KR');
}

function PayBadge({ label }: { label: string }) {
  const variant = payBadgeVariant(label);
  const badgeStyle =
    variant === 'red' ? styles.badgeRed : variant === 'orange' ? styles.badgeOrange : styles.badgeBlue;
  const textStyle =
    variant === 'red'
      ? styles.badgeTextRed
      : variant === 'orange'
        ? styles.badgeTextOrange
        : styles.badgeTextBlue;

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.badgeText, textStyle]}>{label}</Text>
    </View>
  );
}

export function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function HighlightedText({
  text,
  terms,
  style,
  highlightStyle,
}: {
  text: string;
  terms: string[];
  style?: object;
  highlightStyle?: object;
}) {
  const valid = terms.filter(t => !!t && !!t.trim());
  if (!valid.length) return <Text style={style}>{text}</Text>;
  const pattern = new RegExp(`(${valid.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(pattern).filter(Boolean);
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        const isMatch = valid.some(v => part.toLowerCase() === v.toLowerCase());
        return (
          <Text key={`${part}-${i}`} style={isMatch ? highlightStyle : undefined}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

function CardChurchLogo({
  churchLogo,
  basePath,
}: {
  churchLogo?: string;
  basePath: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(churchLogo?.trim()) && !failed;

  return (
    <View style={styles.cardLogo}>
      {showImage ? (
        <Image
          source={{ uri: `${API_BASE}/${basePath}/${churchLogo}` }}
          style={styles.cardLogoImage}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.cardLogoPlaceholder}>
          <Text style={styles.cardLogoPlaceholderText}>사역자모아</Text>
        </View>
      )}
    </View>
  );
}

type RecruitJobCardProps = {
  item: RecruitListItem;
  onPress: () => void;
  highlight?: boolean;
  highlightTerms?: string[];
  /** 교회 로고 이미지 경로 (apiBase 하위) */
  churchLogoBasePath: string;
};

export function RecruitJobCard({
  item,
  onPress,
  highlight = false,
  highlightTerms = [],
  churchLogoBasePath,
}: RecruitJobCardProps) {
  const payLabel = extractPayLabel(item.pay);
  const locationLine = [item.location, item.locationDetail].filter(Boolean).join(' ');
  const timeLabel = formatRecruitRelativeTime(item.date);
  const empLabel = employmentLabel(item.sort);

  const churchName = highlight ? (
    <HighlightedText
      text={String(item.church || '')}
      terms={highlightTerms}
      style={styles.churchName}
      highlightStyle={styles.highlightText}
    />
  ) : (
    <Text style={styles.churchName} numberOfLines={1}>
      {item.church}
    </Text>
  );

  const title = highlight ? (
    <HighlightedText
      text={String(item.title || '')}
      terms={highlightTerms}
      style={styles.cardTitle}
      highlightStyle={styles.highlightText}
    />
  ) : (
    <Text style={styles.cardTitle} numberOfLines={1}>
      {item.title}
    </Text>
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.jobCard, pressed && styles.jobCardPressed]}
      onPress={onPress}>
      <CardChurchLogo churchLogo={item.churchLogo} basePath={churchLogoBasePath} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          {churchName}
          <PayBadge label={payLabel} />
          <Pressable hitSlop={8} style={styles.bookmarkBtn}>
            <MaterialIcons name="bookmark-border" size={20} color="#b0b8c1" />
          </Pressable>
        </View>
        {title}
        <View style={styles.cardMeta}>
          {locationLine ? (
            <View style={styles.metaRow}>
              <MaterialIcons name="place" size={14} color={c.textMuted2} />
              <Text style={styles.metaText} numberOfLines={1}>
                {locationLine}
              </Text>
            </View>
          ) : null}
          {item.religiousbody ? (
            <View style={styles.metaRow}>
              <Image
                source={{
                  uri: `${API_BASE}/${RECRUIT_RELIGIOUSBODY_IMAGE_PATH}/${encodeURIComponent(item.religiousbody)}.jpg`,
                }}
                style={styles.religiousIcon}
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.religiousbody}
              </Text>
            </View>
          ) : null}
          {item.sort ? (
            <View style={styles.metaRow}>
              <MaterialIcons name="schedule" size={14} color={c.textMuted2} />
              <Text style={styles.metaText} numberOfLines={1}>
                {empLabel}
              </Text>
            </View>
          ) : null}
        </View>
        {timeLabel ? (
          <View style={styles.cardTimeRow}>
            <MaterialIcons name="schedule" size={14} color={c.textTime} />
            <Text style={styles.cardTime}>{timeLabel}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export type FilterDropdownKey = '직무' | '지역' | '교단';

type RecruitListFilterPanelProps = {
  title: string;
  dropdowns: FilterDropdownKey[];
  activeDropdown: FilterDropdownKey;
  onDropdownChange: (key: FilterDropdownKey) => void;
  filterItems: string[];
  isFilterSelected: (item: string) => boolean;
  onFilterPress: (item: string) => void;
  quickRoles?: string[];
  selectedRoles: string[];
  onRolePress: (role: string) => void;
  /** 직무·지역·교단 등 선택된 키워드 전체 — 버튼 영역 아래 태그로 표시 */
  selectedTags?: string[];
  onRemoveTag?: (tag: string) => void;
  onClearAllTags?: () => void;
  renderFilterItem?: (item: string) => ReactNode;
};

const KEYWORD_COLS = 3;
const KEYWORD_ROW_GAP = 8;

function groupKeywordRows<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += KEYWORD_COLS) {
    rows.push(items.slice(i, i + KEYWORD_COLS));
  }
  return rows;
}

/** 마지막 줄 1개 → 1/3, 2개 → 각 1/3(합 2/3), 3개 → 균등 3분할 */
function keywordCellStyle(_colIndex: number, rowLength: number) {
  if (rowLength === 1 || rowLength === 2) {
    return styles.keywordCellOneThird;
  }
  return styles.keywordCellEqual;
}

function SelectedFilterTags({
  tags,
  onRemove,
  onClearAll,
}: {
  tags: string[];
  onRemove?: (tag: string) => void;
  onClearAll?: () => void;
}) {
  if (!tags.length) return null;

  return (
    <View style={styles.tagRow}>
      {tags.map(tag => (
        <Pressable
          key={tag}
          style={styles.tag}
          onPress={() => onRemove?.(tag)}
          disabled={!onRemove}>
          <Text style={styles.tagText} numberOfLines={1}>
            {tag}
          </Text>
          {onRemove ? (
            <MaterialIcons name="close" size={14} color={c.primary} />
          ) : null}
        </Pressable>
      ))}
      {onClearAll ? (
        <Pressable style={styles.tagReset} onPress={onClearAll}>
          <Text style={styles.tagResetText}>초기화</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function RecruitListFilterPanel({
  title,
  dropdowns,
  activeDropdown,
  onDropdownChange,
  filterItems,
  isFilterSelected,
  onFilterPress,
  quickRoles,
  selectedRoles,
  onRolePress,
  selectedTags = [],
  onRemoveTag,
  onClearAllTags,
  renderFilterItem,
}: RecruitListFilterPanelProps) {
  const showRoleRows = activeDropdown === '직무' && !!quickRoles?.length;
  const showFilterGrid = activeDropdown !== '직무' && filterItems.length > 0;

  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>

      <View style={styles.dropdownRow}>
        {dropdowns.map(key => (
          <Pressable
            key={key}
            style={[styles.dropdownBtn, activeDropdown === key && styles.dropdownBtnActive]}
            onPress={() => onDropdownChange(key)}>
            <Text
              style={[
                styles.dropdownBtnText,
                activeDropdown === key && styles.dropdownBtnTextActive,
              ]}>
              {key}
            </Text>
            <MaterialIcons
              name="keyboard-arrow-down"
              size={16}
              color={activeDropdown === key ? c.primary : c.textMuted2}
            />
          </Pressable>
        ))}
      </View>

      {showRoleRows
        ? groupKeywordRows(quickRoles!).map((row, rowIndex) => (
            <View key={`role-row-${rowIndex}`} style={styles.keywordRow}>
              {row.map((role, colIndex) => {
                const active = selectedRoles.indexOf(role) >= 0;
                return (
                  <Pressable
                    key={role}
                    style={[
                      styles.roleBtn,
                      keywordCellStyle(colIndex, row.length),
                      active && styles.roleBtnActive,
                    ]}
                    onPress={() => onRolePress(role)}>
                    <MaterialIcons
                      name={active ? 'check' : 'person-outline'}
                      size={14}
                      color={active ? '#fff' : c.textMuted2}
                    />
                    <Text style={[styles.roleBtnText, active && styles.roleBtnTextActive]}>
                      {role}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))
        : null}

      {showFilterGrid
        ? groupKeywordRows(filterItems).map((row, rowIndex) => (
            <View key={`filter-row-${rowIndex}`} style={styles.keywordRow}>
              {row.map((item, colIndex) => {
                const selected = isFilterSelected(item);
                return (
                  <Pressable
                    key={item}
                    style={[
                      styles.filterChip,
                      keywordCellStyle(colIndex, row.length),
                      selected && styles.filterChipSelected,
                    ]}
                    onPress={() => onFilterPress(item)}>
                    {renderFilterItem ? (
                      renderFilterItem(item)
                    ) : (
                      <Text
                        style={[styles.filterChipText, selected && styles.filterChipTextSelected]}
                        numberOfLines={2}>
                        {item}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))
        : null}

      <SelectedFilterTags tags={selectedTags} onRemove={onRemoveTag} onClearAll={onClearAllTags} />
    </View>
  );
}

export function RecruitResultHeader({
  totalCount,
  loading,
}: {
  totalCount: number;
  loading?: boolean;
}) {
  return (
    <View style={styles.resultHeader}>
      <Text style={styles.resultCount}>
        총 <Text style={styles.resultCountEm}>{loading ? '…' : totalCount}</Text>건의 공고
      </Text>
      <Pressable style={styles.sortBtn}>
        <Text style={styles.sortBtnText}>최신순</Text>
        <MaterialIcons name="keyboard-arrow-down" size={16} color={c.textMuted2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  jobCard: {
    backgroundColor: c.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  jobCardPressed: { opacity: 0.92 },
  cardLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    flexShrink: 0,
    marginTop: 2,
  },
  cardLogoImage: { width: '100%', height: '100%' },
  cardLogoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  cardLogoPlaceholderText: {
    fontSize: 10,
    fontWeight: '700',
    color: c.textMuted2,
    textAlign: 'center',
  },
  religiousIcon: {
    width: 17,
    height: 17,
    borderRadius: 3,
    flexShrink: 0,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  churchName: {
    fontSize: 15,
    fontWeight: '600',
    color: c.primary,
    flexShrink: 1,
  },
  bookmarkBtn: { marginLeft: 'auto', padding: 2 },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 20,
  },
  badgeBlue: { backgroundColor: c.badgeBlueBg },
  badgeRed: { backgroundColor: c.badgeRedBg },
  badgeOrange: { backgroundColor: c.badgeOrangeBg },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextBlue: { color: c.primary },
  badgeTextRed: { color: c.badgeRed },
  badgeTextOrange: { color: c.badgeOrange },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: c.text,
    marginBottom: 6,
    lineHeight: 23,
  },
  cardMeta: { gap: 4, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14, color: c.textMuted, flex: 1, lineHeight: 19 },
  cardTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardTime: { fontSize: 13, color: c.textTime },
  highlightText: { color: 'rgb(30, 0, 199)', fontWeight: '700' },

  filterSection: {
    backgroundColor: c.card,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: c.border,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
    marginBottom: 12,
  },
  dropdownRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  dropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: c.borderLight,
    borderRadius: 10,
    backgroundColor: c.card,
  },
  dropdownBtnActive: {
    borderColor: c.primary,
    backgroundColor: '#f8faff',
  },
  dropdownBtnText: { fontSize: 13, fontWeight: '500', color: c.textSecondary },
  dropdownBtnTextActive: { color: c.primary, fontWeight: '600' },
  keywordRow: {
    flexDirection: 'row',
    gap: KEYWORD_ROW_GAP,
    marginBottom: 8,
  },
  keywordCellEqual: {
    flex: 1,
    minWidth: 0,
  },
  keywordCellOneThird: {
    width: '31%',
    flexGrow: 0,
    flexShrink: 0,
  },
  roleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: c.borderLight,
    borderRadius: 10,
    backgroundColor: c.card,
  },
  roleBtnActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  roleBtnText: { fontSize: 13, fontWeight: '500', color: c.textMuted },
  roleBtnTextActive: { color: '#fff', fontWeight: '600' },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: c.borderLight,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipSelected: {
    borderColor: c.primary,
    backgroundColor: '#f8faff',
  },
  filterChipText: {
    fontSize: 12,
    color: c.textSecondary,
    textAlign: 'center',
  },
  filterChipTextSelected: { color: c.primary, fontWeight: '600' },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 999,
    backgroundColor: c.primarySoft,
    borderWidth: 1,
    borderColor: '#d9e4f7',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: c.primary,
    flexShrink: 1,
  },
  tagReset: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.borderLight,
    backgroundColor: c.card,
  },
  tagResetText: {
    fontSize: 12,
    fontWeight: '700',
    color: c.textSecondary,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  resultCount: { fontSize: 13, fontWeight: '500', color: c.textSecondary },
  resultCountEm: { color: c.primary, fontWeight: '700' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortBtnText: { fontSize: 13, fontWeight: '500', color: c.textSecondary },
});
