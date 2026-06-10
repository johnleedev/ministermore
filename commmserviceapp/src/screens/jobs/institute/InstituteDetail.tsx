import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import axios from 'axios';
import { MAIN_API_BASE } from '../../../config/api';
import { RecruitDetailMap } from '../common/RecruitDetailMap';
import { RecruitDetailScroll } from '../common/RecruitDetailScroll';
import {
  ChurchLogoBlock,
  DetailBackButton,
  DetailField,
  DetailHtmlContent,
  DetailLines,
  DetailMultilineText,
  DetailSection,
  DetailSubSection,
  DetailText,
  HomepageRow,
  ReligiousBodyRow,
  SourceLinkBanner,
} from '../common/recruitDetailUi';
import {
  formatApplyPeriod,
  formatSortContentLines,
  safeParseArray,
  safeParseObject,
  type ApplyTime,
  type InquiryInfo,
  type SortContentItem,
} from '../common/recruitDetailUtils';
import { jobColors } from '../common/jobsTheme';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');
const INSTITUTE_LOGO_PATH = 'siteimages/churchlogos';
const RELIGIOUSBODY_PATH = 'images/recruit/religiousbody';

type Props = {
  id: string;
  onBack: () => void;
};

type InstituteDetailData = {
  title?: string;
  link?: string;
  source?: string;
  date?: string;
  location?: string;
  locationDetail?: string;
  applyhow?: string;
  etcNotice?: string;
  church?: string;
  churchLogo?: string;
  religiousbody?: string;
  address?: string;
  mainPastor?: string;
  homepage?: string;
  customInput?: string;
  school?: string;
  career?: string;
  applydoc?: string;
  applytime?: string;
  inquiry?: string;
};

export function InstituteDetail({ id, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InstituteDetailData | null>(null);
  const [churchLogo, setChurchLogo] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.post(`${API_BASE}/recruitinstitute/getrecruitdatapart`, { id });
        if (!cancelled && res.data?.[0]) {
          const row = res.data[0] as InstituteDetailData;
          setData(row);
          setChurchLogo(row.churchLogo || '');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const parsed = useMemo(() => {
    if (!data) return null;
    return {
      school: safeParseArray<SortContentItem>(data.school, [{ content: '' }]),
      career: safeParseArray<SortContentItem>(data.career, [{ content: '' }]),
      applydoc: safeParseArray<SortContentItem>(data.applydoc, [{ content: '' }]),
      applytime: safeParseObject<ApplyTime>(data.applytime, {}),
      inquiry: safeParseObject<InquiryInfo>(data.inquiry, {}),
    };
  }, [data]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#4f5460" />
      </View>
    );
  }

  if (!data || !parsed) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>상세 데이터를 찾을 수 없습니다.</Text>
        <Pressable style={styles.emptyBackBtn} onPress={onBack}>
          <Text style={styles.emptyBackBtnText}>목록으로</Text>
        </Pressable>
      </View>
    );
  }

  const regionText = [data.location, data.locationDetail].filter(Boolean).join(' ') || '-';
  const inquiryPhone = parsed.inquiry.phone?.trim();

  return (
    <RecruitDetailScroll>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{data.title || '-'}</Text>
        <DetailBackButton onPress={onBack} />
      </View>

      <SourceLinkBanner source={data.source || ''} link={data.link || ''} />

      <Text style={styles.postId}>게시글ID: {id}</Text>

      <DetailSection title="채용정보">
        <DetailSubSection title="사역요약">
          <DetailField label="지역">
            <DetailText>{regionText}</DetailText>
          </DetailField>
        </DetailSubSection>

        <DetailSubSection title="지원자격">
          <DetailField label="학력">
            <DetailLines lines={formatSortContentLines(parsed.school)} />
          </DetailField>
          <DetailField label="경력">
            <DetailLines lines={formatSortContentLines(parsed.career)} />
          </DetailField>
        </DetailSubSection>
      </DetailSection>

      <DetailSection title="지원방법">
        <DetailField label="등록일">
          <DetailText>{data.date || '-'}</DetailText>
        </DetailField>
        <DetailField label="기간">
          <DetailText>{formatApplyPeriod(parsed.applytime)}</DetailText>
        </DetailField>
        <DetailField label="서류">
          <DetailLines lines={formatSortContentLines(parsed.applydoc)} />
        </DetailField>
        <DetailField label="지원방법">
          <DetailMultilineText text={data.applyhow || '-'} />
        </DetailField>
        <DetailField label="담당자">
          <DetailText>이름 : {parsed.inquiry.inquiryName || '-'}</DetailText>
          <DetailText>이메일 : {parsed.inquiry.email || '-'}</DetailText>
          {inquiryPhone ? (
            <Pressable onPress={() => Linking.openURL(`tel:${inquiryPhone}`)}>
              <Text style={[styles.fieldText, styles.linkText]}>
                전화번호 : {inquiryPhone}
              </Text>
            </Pressable>
          ) : (
            <DetailText>전화번호 : -</DetailText>
          )}
        </DetailField>
        <DetailField label="기타사항">
          <DetailMultilineText text={data.etcNotice || '-'} />
        </DetailField>
      </DetailSection>

      <DetailSection title="상세내용">
        <DetailHtmlContent html={data.customInput || ''} />
      </DetailSection>

      <DetailSection title="교회 정보">
        <ChurchLogoBlock
          church={data.church || ''}
          churchLogo={churchLogo}
          logoBasePath={INSTITUTE_LOGO_PATH}
          onLogoError={() => setChurchLogo('')}
        />
        <DetailField label="교단">
          <ReligiousBodyRow
            religiousbody={data.religiousbody || ''}
            imageBasePath={RELIGIOUSBODY_PATH}
          />
        </DetailField>
        <DetailField label="지역">
          <DetailText>{regionText}</DetailText>
        </DetailField>
        <DetailField label="주소">
          <DetailText>{data.address || '-'}</DetailText>
        </DetailField>
        <DetailField label="담임목사">
          <DetailText>{data.mainPastor || '-'}</DetailText>
        </DetailField>
        <DetailField label="홈페이지">
          <HomepageRow homepage={data.homepage || ''} />
        </DetailField>
      </DetailSection>

      {(data.address?.trim() || data.location?.trim() || data.locationDetail?.trim()) ? (
        <RecruitDetailMap
          address={data.address}
          location={data.location}
          locationDetail={data.locationDetail}
          geocodePath="/recruitinstitute/geocode"
          caption={data.church || data.title}
        />
      ) : null}

      <View style={styles.footer}>
        <DetailBackButton onPress={onBack} />
      </View>
    </RecruitDetailScroll>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: jobColors.bg,
  },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#6B7280', marginBottom: 14 },
  emptyBackBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  emptyBackBtnText: { color: '#fff', fontWeight: '600' },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: { flex: 1, fontSize: 22, fontWeight: '700', color: jobColors.text },
  postId: { fontSize: 12, color: jobColors.textMuted2, paddingHorizontal: 2 },
  fieldText: { fontSize: 14, lineHeight: 21, color: jobColors.textSecondary },
  linkText: { color: jobColors.primary, textDecorationLine: 'underline' },
  footer: { alignItems: 'flex-end', marginTop: 8 },
});
