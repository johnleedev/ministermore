import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { retreatColors } from './retreatTheme';
import { retreatStyles } from './retreatShared';

type PageHeaderProps = {
  title: string;
  onBack?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

export function PageHeader({
  title,
  onBack,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: PageHeaderProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={headerStyles.row}>
        <View style={headerStyles.left}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={24} color={retreatColors.textSecondary} />
            </Pressable>
          ) : null}
          <Text style={retreatStyles.pageTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <View style={headerStyles.actions}>
          {secondaryActionLabel && onSecondaryAction ? (
            <Pressable style={retreatStyles.secondaryBtn} onPress={onSecondaryAction}>
              <Text style={retreatStyles.secondaryBtnText}>{secondaryActionLabel}</Text>
            </Pressable>
          ) : null}
          {actionLabel && onAction ? (
            <Pressable style={retreatStyles.primaryBtn} onPress={onAction}>
              <Text style={retreatStyles.primaryBtnText}>{actionLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function VenueHeader({ title }: { title: string }) {
  return (
    <View style={headerStyles.venueRow}>
      <Text style={headerStyles.venueTitle}>{title}</Text>
    </View>
  );
}

type RegionTabsProps = {
  tabs: readonly string[];
  selected: string;
  onSelect: (value: string) => void;
  allLabel?: string;
};

export function RegionTabs({ tabs, selected, onSelect, allLabel = '전체' }: RegionTabsProps) {
  return (
    <View style={regionStyles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={regionStyles.scroll}
        contentContainerStyle={regionStyles.content}>
        <Pressable
          style={[retreatStyles.regionTab, selected === 'all' && retreatStyles.regionTabOn]}
          onPress={() => onSelect('all')}>
          <Text
            style={[
              retreatStyles.regionTabText,
              selected === 'all' && retreatStyles.regionTabTextOn,
            ]}>
            {allLabel}
          </Text>
        </Pressable>
        {tabs.map(tab => (
          <Pressable
            key={tab}
            style={[retreatStyles.regionTab, selected === tab && retreatStyles.regionTabOn]}
            onPress={() => onSelect(tab)}>
            <Text
              style={[
                retreatStyles.regionTabText,
                selected === tab && retreatStyles.regionTabTextOn,
              ]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}


export function ListLoading() {
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center' }}>
      <ActivityIndicator size="large" color={retreatColors.primary} />
    </View>
  );
}

export function SectionHeader({ title, count, countSuffix = '개' }: { title: string; count: number; countSuffix?: string }) {
  return (
    <View style={retreatStyles.sectionHeaderRow}>
      <Text style={retreatStyles.sectionTitle}>{title}</Text>
      <Text style={retreatStyles.sectionCount}>
        총 {count}
        {countSuffix}
      </Text>
    </View>
  );
}

type VenueCardProps = {
  placeName: string;
  location: string;
  sort: string;
  size?: string;
  imageUri?: string;
  imageAlignTop?: boolean;
  onPress: () => void;
  onToggleScrap?: () => void;
  scrapped?: boolean;
  style?: StyleProp<ViewStyle>;
};

function VenueCardImage({ uri, alignTop, wrapWidth }: { uri: string; alignTop: boolean; wrapWidth: number }) {
  const [imgSize, setImgSize] = useState({ w: 1, h: 1 });

  if (!alignTop) {
    return <Image source={{ uri }} style={venueCardStyles.img} resizeMode="cover" />;
  }

  const containerHeight = wrapWidth * (3 / 4);
  const scaledHeight = wrapWidth > 0 ? (wrapWidth / imgSize.w) * imgSize.h : containerHeight;
  const imageHeight = Math.max(scaledHeight, containerHeight);

  return (
    <Image
      source={{ uri }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: wrapWidth || '100%',
        height: imageHeight || undefined,
      }}
      resizeMode="cover"
      onLoad={event => {
        const { width, height } = event.nativeEvent.source;
        if (width && height) setImgSize({ w: width, h: height });
      }}
    />
  );
}

export function VenueCard({
  placeName,
  location,
  sort,
  size,
  imageUri,
  imageAlignTop = false,
  onPress,
  onToggleScrap,
  scrapped = false,
  style,
}: VenueCardProps) {
  const showSize = !!size?.trim();
  const [wrapWidth, setWrapWidth] = useState(0);

  return (
    <Pressable style={[venueCardStyles.card, style]} onPress={onPress}>
      <View
        style={venueCardStyles.imgWrap}
        onLayout={event => {
          if (imageAlignTop) {
            const width = event.nativeEvent.layout.width;
            if (width > 0) setWrapWidth(width);
          }
        }}>
        {imageUri ? (
          imageAlignTop ? (
            <VenueCardImage uri={imageUri} alignTop wrapWidth={wrapWidth} />
          ) : (
            <Image source={{ uri: imageUri }} style={venueCardStyles.img} resizeMode="cover" />
          )
        ) : (
          <View style={venueCardStyles.imgPlaceholder}>
            <MaterialIcons name="image-not-supported" size={28} color={retreatColors.textMuted2} />
          </View>
        )}
        {location ? (
          <View style={venueCardStyles.locationBadge}>
            <MaterialIcons name="place" size={9} color={retreatColors.primary} />
            <Text style={venueCardStyles.locationBadgeText} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
        <Pressable style={venueCardStyles.heartBtn} onPress={() => onToggleScrap?.()} disabled={!onToggleScrap}>
          <MaterialIcons
            name={scrapped ? 'favorite' : 'favorite-border'}
            size={13}
            color={scrapped ? '#ef4444' : retreatColors.textMuted2}
          />
        </Pressable>
      </View>
      <View style={venueCardStyles.body}>
        <Text style={venueCardStyles.name} numberOfLines={2}>
          {placeName}
        </Text>
        {sort ? (
          <View style={venueCardStyles.metaRow}>
            <MaterialIcons name="business" size={10} color={retreatColors.textMuted2} />
            <Text style={venueCardStyles.metaText} numberOfLines={2}>
              <Text style={venueCardStyles.metaLabel}>종류 </Text>
              {sort}
            </Text>
          </View>
        ) : null}
        {showSize ? (
          <View style={venueCardStyles.metaRow}>
            <MaterialIcons name="groups" size={10} color={retreatColors.textMuted2} />
            <Text style={venueCardStyles.metaText} numberOfLines={1}>
              <Text style={venueCardStyles.metaLabel}>규모 </Text>
              {size}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/** @deprecated Use VenueCard */
export const PlaceCard = VenueCard;

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={retreatStyles.detailRow}>
      <Text style={retreatStyles.detailLabel}>{label}</Text>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export function PaginationBar({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const maxShow = 4;
  let start = Math.max(1, currentPage - 1);
  let end = Math.min(totalPages, start + maxShow - 1);
  if (end - start + 1 < maxShow) start = Math.max(1, end - maxShow + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <View style={paginationStyles.wrap}>
      <Pressable style={pageBtnStyle(currentPage === 1)} disabled={currentPage === 1} onPress={() => onChange(1)}>
        <Text style={pageBtnTextStyle(currentPage === 1)}>{'<<'}</Text>
      </Pressable>
      <Pressable
        style={pageBtnStyle(currentPage === 1)}
        disabled={currentPage === 1}
        onPress={() => onChange(currentPage - 1)}>
        <Text style={pageBtnTextStyle(currentPage === 1)}>{'<'}</Text>
      </Pressable>
      {pages.map(p => (
        <Pressable
          key={p}
          style={[pageBtnStyle(false), currentPage === p && paginationStyles.pageOn]}
          onPress={() => onChange(p)}>
          <Text style={[pageBtnTextStyle(false), currentPage === p && paginationStyles.pageOnText]}>{p}</Text>
        </Pressable>
      ))}
      <Pressable
        style={pageBtnStyle(currentPage === totalPages)}
        disabled={currentPage === totalPages}
        onPress={() => onChange(currentPage + 1)}>
        <Text style={pageBtnTextStyle(currentPage === totalPages)}>{'>'}</Text>
      </Pressable>
      <Pressable
        style={pageBtnStyle(currentPage === totalPages)}
        disabled={currentPage === totalPages}
        onPress={() => onChange(totalPages)}>
        <Text style={pageBtnTextStyle(currentPage === totalPages)}>{'>>'}</Text>
      </Pressable>
    </View>
  );
}

function pageBtnStyle(disabled: boolean) {
  return {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: disabled ? '#f0f0f0' : retreatColors.card,
    borderWidth: 1,
    borderColor: retreatColors.borderLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

function pageBtnTextStyle(disabled: boolean) {
  return { fontSize: 14, color: disabled ? '#ccc' : retreatColors.textSecondary, fontWeight: '600' as const };
}

export function ChipSelect({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={regionStyles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={regionStyles.scroll}
        contentContainerStyle={regionStyles.content}>
        {options.map(opt => (
          <Pressable
            key={opt}
            style={[retreatStyles.regionTab, value === opt && retreatStyles.regionTabOn]}
            onPress={() => onChange(opt)}>
            <Text style={[retreatStyles.regionTabText, value === opt && retreatStyles.regionTabTextOn]}>
              {opt}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  venueTitle: { fontSize: 18, fontWeight: '700', color: retreatColors.text },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: retreatColors.primary,
    borderRadius: 12,
  },
  registerBtnText: { fontSize: 12.5, fontWeight: '600', color: '#fff' },
});

const regionStyles = StyleSheet.create({
  wrap: { flexGrow: 0, flexShrink: 0, marginBottom: 14 },
  scroll: { flexGrow: 0, flexShrink: 0, maxHeight: 40 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingBottom: 2 },
});

const venueCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: retreatColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: retreatColors.border,
    overflow: 'hidden',
  },
  imgWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: retreatColors.imagePlaceholder,
    position: 'relative',
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  imgTop: { width: '100%', height: undefined },
  imgPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 9,
    maxWidth: '75%',
  },
  locationBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: retreatColors.primary,
    flexShrink: 1,
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingVertical: 10, paddingHorizontal: 10 },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: retreatColors.text,
    marginBottom: 6,
    lineHeight: 18,
  },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginBottom: 3 },
  metaText: { flex: 1, fontSize: 11, color: retreatColors.textMuted, lineHeight: 15 },
  metaLabel: { fontWeight: '600', color: retreatColors.textSecondary },
});

const paginationStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 20,
    flexWrap: 'wrap',
  },
  pageOn: { backgroundColor: retreatColors.primary, borderColor: retreatColors.primary },
  pageOnText: { color: '#fff' },
});
