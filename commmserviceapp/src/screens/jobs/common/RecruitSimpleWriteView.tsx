import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import axios from 'axios';
import { MAIN_API_BASE } from '../../../config/api';
import { citydata } from '../../../data/citydata';
import { ensureBoardLogin } from '../../board/boardShared';
import { PageHeader } from '../../retreat/RetreatComponents';
import { useRetreatSession } from '../../retreat/useRetreatSession';
import { FormKeyboardScreen } from '../../shared/FormKeyboardScreen';
import { RecruitChurchLogoSection } from './RecruitChurchLogoSection';
import {
  APPLYHOW_OPTIONS,
  RECRUIT_NUM_OPTIONS,
  RELIGIOUSBODY_OPTIONS,
  SIMPLE_APPLYDOC_PRESETS,
  SIMPLE_CAREER_PRESETS,
  SIMPLE_SCHOOL_PRESETS,
  SIMPLE_SORT_LABEL_OPTIONS,
  SIMPLE_SORT_OPTIONS,
} from './recruitPostData';
import type { RecruitChurchLogo } from './recruitPostImages';
import {
  addSortContentRow,
  buildSimpleArraysForSort,
  removeSortContentRow,
  todayYmd,
  updateSortContentRow,
  type ApplyTime,
  type SortContent,
} from './recruitWriteUtils';
import { jobColors as c } from './jobsTheme';
import {
  FormField,
  FormTextInput,
  MultiChipSelect,
  ReligiousBodyChip,
  SectionTitle,
  SingleChipSelect,
  SortRowControls,
  SubmitBar,
} from './recruitWriteUi';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');

type Props = {
  apiBase: string;
  pageTitle: string;
  orgLabel: string;
  orgLeaderLabel: string;
  onBack: () => void;
  onSuccess?: () => void;
};

function SortContentBlock({
  title,
  rows,
  presets,
  sortOptions,
  onChange,
}: {
  title: string;
  rows: SortContent[];
  presets: string[];
  sortOptions: string[];
  onChange: (rows: SortContent[]) => void;
}) {
  return (
    <FormField label={title}>
      {rows.map((row, index) => (
        <View key={`${title}-${index}`} style={{ marginBottom: 12 }}>
          <SortRowControls
            sort={row.sort}
            sortOptions={sortOptions}
            onSortChange={v => onChange(updateSortContentRow(rows, index, { sort: v }))}
            onAdd={() => onChange(addSortContentRow(rows, { sort: '지휘', content: '' }))}
            onRemove={() => onChange(removeSortContentRow(rows, index))}
            showRemove={index > 0}
          />
          <FormTextInput
            value={row.content}
            onChangeText={v => onChange(updateSortContentRow(rows, index, { content: v }))}
          />
          <MultiChipSelect
            options={presets}
            value={row.content}
            onChange={v => onChange(updateSortContentRow(rows, index, { content: v }))}
          />
        </View>
      ))}
    </FormField>
  );
}

export function RecruitSimpleWriteView({
  apiBase,
  pageTitle,
  orgLabel,
  orgLeaderLabel,
  onBack,
  onSuccess,
}: Props) {
  const session = useRetreatSession();
  const [submitting, setSubmitting] = useState(false);

  const [writer, setWriter] = useState('');
  const [title, setTitle] = useState('');
  const [church, setChurch] = useState('');
  const [religiousbody, setReligiousbody] = useState('');
  const [location, setLocation] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [address, setAddress] = useState('');
  const [mainpastor, setMainpastor] = useState('');
  const [homepage, setHomepage] = useState('');
  const [churchLogo, setChurchLogo] = useState<RecruitChurchLogo | null>(null);

  const [sort, setSort] = useState('');
  const [school, setSchool] = useState<SortContent[]>([{ sort: '지휘', content: '' }]);
  const [career, setCareer] = useState<SortContent[]>([{ sort: '지휘', content: '' }]);
  const [recruitNum, setRecruitNum] = useState('');
  const [applydoc, setApplydoc] = useState<SortContent[]>([{ sort: '지휘', content: '' }]);
  const [applyhow, setApplyhow] = useState('');
  const [applytime, setApplytime] = useState<ApplyTime>({ startDay: '', endDay: '', daySort: '' });
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [etcNotice, setEtcNotice] = useState('');
  const [customInput, setCustomInput] = useState('');

  const subareas = useMemo(
    () => citydata.find(item => item.city === location)?.subarea ?? [],
    [location],
  );

  const handleSortChange = (next: string) => {
    setSort(next);
    if (!next) {
      setSchool([{ sort: '지휘', content: '' }]);
      setCareer([{ sort: '지휘', content: '' }]);
      setApplydoc([{ sort: '지휘', content: '' }]);
      return;
    }
    const arrays = buildSimpleArraysForSort(next);
    setSchool(arrays.school);
    setCareer(arrays.career);
    setApplydoc(arrays.applydoc);
  };

  const registerPost = async () => {
    if (submitting) return;
    if (!title.trim() || !church.trim()) {
      Alert.alert('', `제목과 ${orgLabel}을 입력해주세요.`);
      return;
    }

    const user = await ensureBoardLogin(session.isLoggedIn, session.user);
    if (!user) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (churchLogo) {
        formData.append('img', {
          uri: churchLogo.uri,
          type: churchLogo.type,
          name: churchLogo.name,
        } as unknown as Blob);
      }

      const params = {
        userAccount: user.userAccount,
        title: title.trim(),
        source: '사역자모아',
        writer: writer.trim(),
        date: todayYmd(),
        church: church.trim(),
        religiousbody,
        location,
        locationDetail,
        address: address.trim(),
        mainpastor: mainpastor.trim(),
        homepage: homepage.trim(),
        school: JSON.stringify(school),
        career: JSON.stringify(career),
        sort,
        recruitNum,
        applydoc: JSON.stringify(applydoc),
        applyhow,
        applytime: JSON.stringify(applytime),
        etcNotice,
        inquiry: JSON.stringify({ inquiryName, email: inquiryEmail, phone: inquiryPhone }),
        churchLogo: churchLogo?.name ?? '',
        customInput,
      };

      const res = await axios.post(`${API_BASE}/${apiBase}/postsrecruit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params,
      });

      if (res.data) {
        Alert.alert('', '등록이 완료되었습니다.');
        onSuccess?.();
        onBack();
      } else {
        Alert.alert('', '등록에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch {
      Alert.alert('', '등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormKeyboardScreen backgroundColor={c.bg} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}>
      <PageHeader
        title={pageTitle}
        onBack={onBack}
        secondaryActionLabel="목록"
        onSecondaryAction={onBack}
        actionLabel={submitting ? '등록중' : '등록'}
        onAction={() => void registerPost()}
      />

      <SectionTitle>기본정보</SectionTitle>
      <FormField label="제목" required>
        <FormTextInput value={title} onChangeText={setTitle} />
      </FormField>
      <FormField label="글쓰는이">
        <FormTextInput value={writer} onChangeText={setWriter} />
      </FormField>
      <FormField label="날짜">
        <FormTextInput value={todayYmd()} onChangeText={() => {}} />
      </FormField>

      <SectionTitle>교회정보</SectionTitle>
      <FormField label={orgLabel} required>
        <FormTextInput value={church} onChangeText={setChurch} />
      </FormField>
      <FormField label="교단">
        <SingleChipSelect
          options={RELIGIOUSBODY_OPTIONS}
          value={religiousbody}
          onChange={setReligiousbody}
          renderOption={(item, selected) => <ReligiousBodyChip item={item} selected={selected} />}
        />
      </FormField>
      <FormField label="위치">
        <SingleChipSelect
          options={citydata.map(item => item.city)}
          value={location}
          onChange={v => {
            setLocation(v);
            setLocationDetail('');
          }}
        />
      </FormField>
      {location ? (
        <FormField label="상세위치">
          {subareas.length ? (
            <SingleChipSelect options={subareas} value={locationDetail} onChange={setLocationDetail} />
          ) : (
            <Text style={{ fontSize: 13, color: c.textMuted }}>선택 가능한 상세 지역이 없습니다.</Text>
          )}
        </FormField>
      ) : null}
      <FormField label="주소">
        <FormTextInput value={address} onChangeText={setAddress} placeholder="주소를 입력해주세요" />
      </FormField>
      <FormField label={orgLeaderLabel}>
        <FormTextInput value={mainpastor} onChangeText={setMainpastor} />
      </FormField>
      <FormField label="홈페이지">
        <FormTextInput value={homepage} onChangeText={setHomepage} placeholder="홈페이지 주소를 입력해주세요" />
      </FormField>
      <RecruitChurchLogoSection
        logo={churchLogo}
        onChange={setChurchLogo}
        userAccount={session.user?.userAccount ?? ''}
      />

      <SectionTitle>채용정보</SectionTitle>
      <FormField label="직무">
        <SingleChipSelect options={SIMPLE_SORT_OPTIONS} value={sort} onChange={handleSortChange} />
      </FormField>
      <SortContentBlock
        title="학력"
        rows={school}
        presets={SIMPLE_SCHOOL_PRESETS}
        sortOptions={SIMPLE_SORT_LABEL_OPTIONS}
        onChange={setSchool}
      />
      <SortContentBlock
        title="경력"
        rows={career}
        presets={SIMPLE_CAREER_PRESETS}
        sortOptions={SIMPLE_SORT_LABEL_OPTIONS}
        onChange={setCareer}
      />
      <FormField label="채용인원">
        <SingleChipSelect options={RECRUIT_NUM_OPTIONS} value={recruitNum} onChange={setRecruitNum} />
      </FormField>

      <SectionTitle>지원정보</SectionTitle>
      <FormField label="지원기간 (시작)">
        <FormTextInput
          value={applytime.startDay}
          onChangeText={v => setApplytime(prev => ({ ...prev, startDay: v }))}
          placeholder="YYYY-MM-DD"
        />
      </FormField>
      {applytime.daySort !== '채용시마감' ? (
        <FormField label="지원기간 (종료)">
          <FormTextInput
            value={applytime.endDay}
            onChangeText={v => setApplytime(prev => ({ ...prev, endDay: v }))}
            placeholder="YYYY-MM-DD"
          />
        </FormField>
      ) : null}
      <FormField label="마감">
        <SingleChipSelect
          options={['채용시마감']}
          value={applytime.daySort}
          onChange={v =>
            setApplytime(prev => ({
              ...prev,
              daySort: v,
              endDay: v === '채용시마감' ? '' : prev.endDay,
            }))
          }
        />
      </FormField>
      <SortContentBlock
        title="지원서류"
        rows={applydoc}
        presets={SIMPLE_APPLYDOC_PRESETS}
        sortOptions={SIMPLE_SORT_LABEL_OPTIONS}
        onChange={setApplydoc}
      />
      <FormField label="지원방법">
        <SingleChipSelect options={APPLYHOW_OPTIONS} value={applyhow} onChange={setApplyhow} />
      </FormField>
      <FormField label="담당자 이름">
        <FormTextInput value={inquiryName} onChangeText={setInquiryName} />
      </FormField>
      <FormField label="e-메일">
        <FormTextInput value={inquiryEmail} onChangeText={setInquiryEmail} />
      </FormField>
      <FormField label="연락처">
        <FormTextInput value={inquiryPhone} onChangeText={setInquiryPhone} />
      </FormField>
      <FormField label="기타사항">
        <FormTextInput value={etcNotice} onChangeText={setEtcNotice} multiline />
      </FormField>

      <SectionTitle>상세내용</SectionTitle>
      <Text style={{ fontSize: 12, color: c.textMuted, marginBottom: 8 }}>* 최대 2000자 이하로 작성해주세요.</Text>
      <FormTextInput
        value={customInput}
        onChangeText={setCustomInput}
        multiline
        maxLength={2000}
        multilineMinHeight={240}
      />

      <SubmitBar submitting={submitting} onSubmit={() => void registerPost()} />
    </FormKeyboardScreen>
  );
}
