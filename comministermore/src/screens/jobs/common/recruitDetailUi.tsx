import type { ReactNode } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { MAIN_API_BASE } from '../../../config/api';
import { jobColors } from './jobsTheme';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');

export function DetailBackButton({ onPress, label = '목록' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable style={styles.backBtn} onPress={onPress}>
      <MaterialIcons name="arrow-back" size={16} color="#fff" />
      <Text style={styles.backBtnText}>{label}</Text>
    </Pressable>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function DetailSubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.subSection}>
      <Text style={styles.subSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldValue}>{children}</View>
    </View>
  );
}

export function DetailText({ children }: { children: ReactNode }) {
  return <Text style={styles.fieldText}>{children}</Text>;
}

export function DetailMultilineText({ text }: { text: string }) {
  if (!text?.trim()) return <DetailText>-</DetailText>;
  return <Text style={[styles.fieldText, styles.preLine]}>{text}</Text>;
}

export function DetailLines({ lines }: { lines: string[] }) {
  if (!lines.length) return <DetailText>-</DetailText>;
  return (
    <>
      {lines.map((line, index) => (
        <Text key={`${line}-${index}`} style={styles.fieldText}>
          {line}
        </Text>
      ))}
    </>
  );
}

export function SourceLinkBanner({
  source,
  link,
}: {
  source: string;
  link: string;
}) {
  if (!source || source === '사역자모아' || !link) return null;

  return (
    <Pressable style={styles.sourceBanner} onPress={() => Linking.openURL(link)}>
      <View style={styles.sourceLeft}>
        <Image
          source={{ uri: `${API_BASE}/siteimages/schoolround/${encodeURIComponent(source)}.jpg` }}
          style={styles.sourceIcon}
        />
        <View>
          <Text style={styles.sourceLabel}>원본보기</Text>
          <Text style={styles.sourceName}>{source}</Text>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={jobColors.textSecondary} />
    </Pressable>
  );
}

export function ChurchLogoBlock({
  church,
  churchLogo,
  onLogoError,
  logoBasePath = 'images/recruit/churchlogo',
}: {
  church: string;
  churchLogo: string;
  onLogoError: () => void;
  logoBasePath?: string;
}) {
  return (
    <View style={styles.churchHeader}>
      <View style={styles.logoBox}>
        {churchLogo ? (
          <Image
            source={{ uri: `${API_BASE}/${logoBasePath}/${churchLogo}` }}
            style={styles.logoImage}
            onError={onLogoError}
          />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoPlaceholderText}>사역자모아</Text>
          </View>
        )}
      </View>
      <Text style={styles.churchName}>{church || '-'}</Text>
    </View>
  );
}

export function ReligiousBodyRow({
  religiousbody,
  imageBasePath = 'siteimages/religiousbody',
}: {
  religiousbody: string;
  imageBasePath?: string;
}) {
  if (!religiousbody) return <DetailText>-</DetailText>;
  return (
    <View style={styles.religiousRow}>
      <Image
        source={{ uri: `${API_BASE}/${imageBasePath}/${encodeURIComponent(religiousbody)}.jpg` }}
        style={styles.religiousIcon}
      />
      <Text style={styles.fieldText}>{religiousbody}</Text>
    </View>
  );
}

export function HomepageRow({ homepage }: { homepage: string }) {
  if (!homepage?.trim()) return <DetailText>-</DetailText>;
  const url = homepage.includes('http') ? homepage : `http://${homepage}`;
  return (
    <Pressable style={styles.homepageRow} onPress={() => Linking.openURL(url)}>
      <Text style={[styles.fieldText, styles.linkText]} numberOfLines={2}>
        {homepage}
      </Text>
      <View style={styles.homepageBtn}>
        <Text style={styles.homepageBtnText}>바로가기</Text>
        <MaterialIcons name="chevron-right" size={14} color="#111" />
      </View>
    </Pressable>
  );
}

export function DetailHtmlContent({ html }: { html: string }) {
  if (!html?.trim()) {
    return <DetailText>-</DetailText>;
  }

  const plain = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  if (!plain) {
    return <DetailText>-</DetailText>;
  }

  return <DetailMultilineText text={plain} />;
}

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#333',
  },
  backBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  section: {
    backgroundColor: jobColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: jobColors.border,
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: jobColors.text,
  },
  subSection: {
    gap: 8,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: jobColors.textSecondary,
    marginBottom: 2,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: jobColors.borderLight,
  },
  fieldLabel: {
    width: 88,
    fontSize: 13,
    fontWeight: '700',
    color: jobColors.textMuted,
    flexShrink: 0,
  },
  fieldValue: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  fieldText: {
    fontSize: 14,
    lineHeight: 21,
    color: jobColors.textSecondary,
  },
  preLine: {
    lineHeight: 22,
  },
  sourceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: jobColors.border,
    backgroundColor: jobColors.card,
  },
  sourceLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sourceIcon: { width: 36, height: 36, borderRadius: 8 },
  sourceLabel: { fontSize: 12, color: jobColors.textMuted },
  sourceName: { fontSize: 14, fontWeight: '600', color: jobColors.text },
  churchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  logoImage: { width: '100%', height: '100%' },
  logoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2f7',
  },
  logoPlaceholderText: { fontSize: 10, fontWeight: '700', color: jobColors.textMuted },
  churchName: { flex: 1, fontSize: 17, fontWeight: '700', color: jobColors.text },
  religiousRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  religiousIcon: { width: 22, height: 22, borderRadius: 4 },
  homepageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  linkText: { color: jobColors.primary, flex: 1 },
  homepageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  homepageBtnText: { fontSize: 12, fontWeight: '600' },
});
