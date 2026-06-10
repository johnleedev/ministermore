import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { BOARD_NOTICE_SORT } from './boardConfigs';
import { boardColors as c } from './boardTheme';

export { BOARD_NOTICE_SORT };

export type BoardCategoryKey = 'freeboard' | 'used' | 'events';

export const BOARD_CATEGORY_TABS: { key: BoardCategoryKey; label: string }[] = [
  { key: 'freeboard', label: '자유게시판' },
  { key: 'events', label: '집회세미나' },
  { key: 'used', label: '중고장터' },
];

export function BoardWhiteCard({ children }: { children: ReactNode }) {
  return <View style={uiStyles.boardCard}>{children}</View>;
}

export function BoardHeader({ title }: { title: string }) {
  return (
    <View style={uiStyles.boardHeader}>
      <Text style={uiStyles.boardTitle}>{title}</Text>
    </View>
  );
}

export function BoardFilterPills({
  items,
  selected,
  onSelect,
  showAll = true,
}: {
  items: readonly string[];
  selected: string;
  onSelect: (value: string) => void;
  showAll?: boolean;
}) {
  const allItems = showAll ? (['', ...items] as string[]) : [...items];

  return (
    <View style={uiStyles.filterWrap}>
      {allItems.map(item => {
        const active = selected === item;
        const label = item || '전체';
        return (
          <Pressable
            key={item || 'all'}
            style={[uiStyles.fltBtn, active && uiStyles.fltBtnActive]}
            onPress={() => onSelect(item)}>
            <Text style={[uiStyles.fltBtnText, active && uiStyles.fltBtnTextActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function BoardResultHeader({
  label,
  totalCount,
}: {
  label: string;
  totalCount: number;
}) {
  return (
    <View style={uiStyles.resultHeader}>
      <Text style={uiStyles.resultCount}>
        {label} <Text style={uiStyles.resultCountEm}>{totalCount}</Text>개의 글
      </Text>
      <Pressable style={uiStyles.sortBtn}>
        <Text style={uiStyles.sortBtnText}>최신순</Text>
        <MaterialIcons name="keyboard-arrow-down" size={14} color={c.textMuted2} />
      </Pressable>
    </View>
  );
}

/** 공지 / 게시글 구역 제목 */
export function BoardListSectionHeader({
  title,
  count,
  variant = 'default',
}: {
  title: string;
  count?: number;
  variant?: 'notice' | 'default';
}) {
  return (
    <View
      style={[
        uiStyles.listSectionHeader,
        variant === 'notice' && uiStyles.listSectionHeaderNotice,
      ]}>
      <Text
        style={[
          uiStyles.listSectionTitle,
          variant === 'notice' && uiStyles.listSectionTitleNotice,
        ]}>
        {title}
        {count != null ? (
          <Text style={uiStyles.listSectionCount}>
            {' '}
            <Text style={uiStyles.listSectionCountEm}>{count}</Text>개
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

export type CategoryBadgeVariant = 'info' | 'daily' | 'counsel' | 'mission' | 'notice' | 'default';

export function getCategoryBadgeVariant(sort: string): CategoryBadgeVariant {
  if (sort === BOARD_NOTICE_SORT) return 'notice';
  if (sort === '정보') return 'info';
  if (sort === '일상') return 'daily';
  if (sort === '상담') return 'counsel';
  if (sort === '사역') return 'mission';
  return 'default';
}

export function BoardPostItem({
  sort,
  title,
  contentPreview,
  contentPreviewLines = 2,
  titleNumberOfLines,
  author,
  timeLabel,
  views,
  commentCount,
  isNew,
  onPress,
}: {
  sort: string;
  title: string;
  contentPreview?: string;
  contentPreviewLines?: number;
  titleNumberOfLines?: number;
  author: string;
  timeLabel: string;
  views: string | number;
  commentCount?: number;
  isNew?: boolean;
  onPress: () => void;
}) {
  const variant = getCategoryBadgeVariant(sort);
  const isNotice = variant === 'notice';
  const badgeStyle =
    variant === 'notice'
      ? uiStyles.badgeNotice
      : variant === 'daily'
        ? uiStyles.badgeDaily
        : variant === 'counsel'
          ? uiStyles.badgeCounsel
          : variant === 'mission'
            ? uiStyles.badgeMission
            : variant === 'info'
              ? uiStyles.badgeInfo
              : uiStyles.badgeDefault;
  const badgeTextStyle =
    variant === 'notice'
      ? uiStyles.badgeNoticeText
      : variant === 'daily'
        ? uiStyles.badgeDailyText
        : variant === 'counsel'
          ? uiStyles.badgeCounselText
          : variant === 'mission'
            ? uiStyles.badgeMissionText
            : variant === 'info'
              ? uiStyles.badgeInfoText
              : uiStyles.badgeDefaultText;

  const displayTitle =
    commentCount && commentCount > 0 ? `${title}` : title;

  return (
    <Pressable
      style={({ pressed }) => [
        uiStyles.postItem,
        isNotice && uiStyles.postItemNotice,
        contentPreview ? uiStyles.postItemWithPreview : null,
        pressed && uiStyles.postItemPressed,
      ]}
      onPress={onPress}>
      <View style={[uiStyles.postBadge, badgeStyle]}>
        <Text style={[uiStyles.postBadgeText, badgeTextStyle]} numberOfLines={2}>
          {sort}
        </Text>
      </View>
      <View style={uiStyles.postBody}>
        <View style={uiStyles.postTitleRow}>
          <Text
            style={uiStyles.postTitle}
            {...(titleNumberOfLines != null ? { numberOfLines: titleNumberOfLines } : {})}>
            {displayTitle}
            {commentCount ? (
              <Text style={uiStyles.commentCount}> [{commentCount}]</Text>
            ) : null}
          </Text>
          {isNew ? (
            <View style={uiStyles.newBadge}>
              <Text style={uiStyles.newBadgeText}>N</Text>
            </View>
          ) : null}
        </View>
        {contentPreview ? (
          <Text style={uiStyles.postPreview} numberOfLines={contentPreviewLines}>
            {contentPreview}
          </Text>
        ) : null}
        <View style={uiStyles.postMeta}>
          <View style={uiStyles.postMetaLeft}>
            <MaterialIcons name="person-outline" size={10} color="#c9cdd2" />
            <Text style={uiStyles.postAuthor} numberOfLines={1}>
              {author}
            </Text>
            <Text style={uiStyles.postMetaDot}>·</Text>
            <Text style={uiStyles.postTime}>{timeLabel}</Text>
          </View>
          <View style={uiStyles.postViews}>
            <MaterialIcons name="visibility" size={11} color={c.textMuted2} />
            <Text style={uiStyles.postViewsText}>{views}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const uiStyles = StyleSheet.create({
  boardCard: {
    backgroundColor: c.card,
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: c.border,
  },
  boardHeader: {
    marginBottom: 14,
  },
  boardTitle: { fontSize: 17, fontWeight: '700', color: c.text },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 14,
  },
  fltBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: c.borderLight,
    backgroundColor: c.card,
  },
  fltBtnActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  fltBtnText: { fontSize: 13, fontWeight: '600', color: c.textMuted },
  fltBtnTextActive: { color: '#fff' },
  listSectionHeader: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  listSectionHeaderNotice: {
    paddingTop: 10,
    marginTop: 4,
  },
  listSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: c.text,
  },
  listSectionTitleNotice: {
    color: c.badgeNoticeText,
  },
  listSectionCount: {
    fontSize: 14,
    fontWeight: '500',
    color: c.textMuted,
  },
  listSectionCountEm: {
    fontWeight: '700',
    color: c.text,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  resultCount: { fontSize: 13, fontWeight: '500', color: c.textSecondary },
  resultCountEm: { fontWeight: '700', color: c.text },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sortBtnText: { fontSize: 13, fontWeight: '500', color: c.textSecondary },
  postItem: {
    backgroundColor: c.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 14,
  },
  postItemPressed: { opacity: 0.92 },
  postItemNotice: {
    backgroundColor: c.noticeCardBg,
    borderLeftWidth: 3,
    borderLeftColor: c.noticeCardBorder,
  },
  postItemWithPreview: { alignItems: 'flex-start', paddingVertical: 14 },
  postBadge: {
    flexShrink: 0,
    maxWidth: 52,
    minWidth: 36,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBadgeText: { fontSize: 11, fontWeight: '700', lineHeight: 14 },
  badgeInfo: { backgroundColor: c.badgeInfoBg },
  badgeInfoText: { color: c.badgeInfoText },
  badgeDaily: { backgroundColor: c.badgeDailyBg },
  badgeDailyText: { color: c.badgeDailyText },
  badgeCounsel: { backgroundColor: c.badgeCounselBg },
  badgeCounselText: { color: c.badgeCounselText },
  badgeMission: { backgroundColor: c.badgeMissionBg },
  badgeMissionText: { color: c.badgeMissionText },
  badgeNotice: { backgroundColor: c.badgeNoticeBg },
  badgeNoticeText: { color: c.badgeNoticeText, fontWeight: '800' },
  badgeDefault: { backgroundColor: '#f1f5f9' },
  badgeDefaultText: { color: c.textMuted },
  postBody: { flex: 1, minWidth: 0 },
  postTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginBottom: 5,
  },
  postTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: c.text },
  postPreview: {
    fontSize: 13,
    lineHeight: 19,
    color: c.textMuted,
    marginBottom: 6,
  },
  commentCount: { color: c.primary, fontWeight: '600' },
  newBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: c.newBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 2,
  },
  postMetaLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  postAuthor: { flexShrink: 1, fontSize: 11.5, fontWeight: '500', color: c.textMuted },
  postMetaDot: { fontSize: 11.5, color: c.textMuted2 },
  postTime: { fontSize: 11.5, color: c.textMuted2, flexShrink: 0 },
  postViews: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  postViewsText: { fontSize: 11.5, color: c.textMuted2 },
});
