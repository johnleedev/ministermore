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
  DAWN_PRAY_PRESETS,
  HOUR_OPTIONS,
  INSURANCE_PRESETS,
  MINISTER_APPLYDOC_PRESETS,
  MINISTER_CAREER_PRESETS,
  MINISTER_SCHOOL_PRESETS,
  MINISTER_SORT_OPTIONS,
  MINUTE_OPTIONS,
  PART_DETAIL_PRESETS,
  PART_PRESETS,
  PAY_PRESETS,
  RECRUIT_NUM_OPTIONS,
  RELIGIOUSBODY_OPTIONS,
  SEVERANCE_PRESETS,
  SORT_LABEL_OPTIONS,
  WEEKDAY_OPTIONS,
  WELFARE_PRESETS,
  WORKDAY_PRESETS,
  WORKDAY_WEEK_OPTIONS,
} from './recruitPostData';
import type { RecruitChurchLogo } from './recruitPostImages';
import {
  addSortContentRow,
  applyWorkdayPreset,
  buildMinisterArraysForSort,
  removeRowAt,
  removeSortContentRow,
  todayYmd,
  updateSortContentRow,
  type ApplyTime,
  type PayItem,
  type SortContent,
  type WorkTimeSunDay,
  type WorkTimeWeek,
} from './recruitWriteUtils';
import { jobColors as c } from './jobsTheme';
import {
  FormField,
  FormTextInput,
  MultiChipSelect,
  OptionPickerRow,
  ReligiousBodyChip,
  SectionTitle,
  SingleChipSelect,
  SortRowControls,
  SubmitBar,
} from './recruitWriteUi';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');

type Props = {
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
            onAdd={() => onChange(addSortContentRow(rows, { sort: '전임', content: '' }))}
            onRemove={() => onChange(removeRowAt(rows, index))}
            showRemove={index > 0}
          />
          <FormTextInput
            value={row.content}
            onChangeText={v => onChange(updateSortContentRow(rows, index, { content: v }))}
          />
          {presets.length ? (
            <MultiChipSelect
              options={presets}
              value={row.content}
              onChange={v => onChange(updateSortContentRow(rows, index, { content: v }))}
            />
          ) : null}
        </View>
      ))}
    </FormField>
  );
}

function WorkTimeSunBlock({
  rows,
  onChange,
}: {
  rows: WorkTimeSunDay[];
  onChange: (rows: WorkTimeSunDay[]) => void;
}) {
  const patch = (index: number, patch: Partial<WorkTimeSunDay>) => {
    const copy = [...rows];
    copy[index] = { ...copy[index], ...patch };
    onChange(copy);
  };

  return (
    <FormField label="사역시간(주일)">
      {rows.map((row, index) => (
        <View key={`sun-${index}`} style={{ marginBottom: 12 }}>
          <SortRowControls
            sort={row.sort}
            sortOptions={SORT_LABEL_OPTIONS}
            onSortChange={v => patch(index, { sort: v })}
            onAdd={() =>
              onChange([
                ...rows,
                { sort: '전임', startHour: '09', startMinute: '00', endHour: '16', endMinute: '00' },
              ])
            }
            onRemove={() => onChange(removeRowAt(rows, index))}
            showRemove={index > 0}
          />
          <OptionPickerRow label="시작 시" options={HOUR_OPTIONS} value={row.startHour} onChange={v => patch(index, { startHour: v })} />
          <OptionPickerRow label="시작 분" options={MINUTE_OPTIONS} value={row.startMinute} onChange={v => patch(index, { startMinute: v })} />
          <OptionPickerRow label="종료 시" options={HOUR_OPTIONS} value={row.endHour} onChange={v => patch(index, { endHour: v })} />
          <OptionPickerRow label="종료 분" options={MINUTE_OPTIONS} value={row.endMinute} onChange={v => patch(index, { endMinute: v })} />
        </View>
      ))}
    </FormField>
  );
}

function WorkTimeWeekBlock({
  rows,
  onChange,
}: {
  rows: WorkTimeWeek[];
  onChange: (rows: WorkTimeWeek[]) => void;
}) {
  const patch = (index: number, patch: Partial<WorkTimeWeek>) => {
    const copy = [...rows];
    copy[index] = { ...copy[index], ...patch };
    onChange(copy);
  };

  return (
    <FormField label="사역시간(평일)">
      {rows.map((row, index) => (
        <View key={`week-${index}`} style={{ marginBottom: 12 }}>
          <SortRowControls
            sort={row.sort}
            sortOptions={SORT_LABEL_OPTIONS}
            onSortChange={v => patch(index, { sort: v })}
            onAdd={() =>
              onChange([
                ...rows,
                {
                  sort: '전임',
                  startHour: '09',
                  startMinute: '00',
                  endHour: '17',
                  endMinute: '00',
                  day: '평일',
                },
              ])
            }
            onRemove={() => onChange(removeRowAt(rows, index))}
            showRemove={index > 0}
          />
          <OptionPickerRow label="시작 시" options={HOUR_OPTIONS} value={row.startHour} onChange={v => patch(index, { startHour: v })} />
          <OptionPickerRow label="시작 분" options={MINUTE_OPTIONS} value={row.startMinute} onChange={v => patch(index, { startMinute: v })} />
          <OptionPickerRow label="종료 시" options={HOUR_OPTIONS} value={row.endHour} onChange={v => patch(index, { endHour: v })} />
          <OptionPickerRow label="종료 분" options={MINUTE_OPTIONS} value={row.endMinute} onChange={v => patch(index, { endMinute: v })} />
          <OptionPickerRow label="요일" options={WORKDAY_WEEK_OPTIONS} value={row.day} onChange={v => patch(index, { day: v })} />
        </View>
      ))}
    </FormField>
  );
}

function PayBlock({ rows, onChange }: { rows: PayItem[]; onChange: (rows: PayItem[]) => void }) {
  const [payInputType, setPayInputType] = useState<'select' | 'input'>('select');

  const patch = (index: number, patch: Partial<PayItem>) => {
    const copy = [...rows];
    copy[index] = { ...copy[index], ...patch };
    onChange(copy);
  };

  return (
    <FormField label="사례">
      {rows.map((row, index) => (
        <View key={`pay-${index}`} style={{ marginBottom: 12 }}>
          <SortRowControls
            sort={row.sort}
            sortOptions={SORT_LABEL_OPTIONS}
            onSortChange={v => patch(index, { sort: v })}
            onAdd={() => onChange([...rows, { sort: '전임', paySort: '월', selectCost: '', inputCost: '' }])}
            onRemove={() => onChange(removeRowAt(rows, index))}
            showRemove={index > 0}
          />
          <SingleChipSelect options={['월', '연']} value={row.paySort} onChange={v => patch(index, { paySort: v })} />
          <FormField label="금액 (만원)">
            <FormTextInput
              value={row.selectCost}
              onChangeText={v => {
                setPayInputType('select');
                patch(index, { selectCost: v, inputCost: '' });
              }}
            />
          </FormField>
          <FormField label="직접입력">
            <FormTextInput
              value={row.inputCost}
              onChangeText={v => {
                setPayInputType('input');
                patch(index, { inputCost: v, selectCost: '' });
              }}
            />
          </FormField>
          <MultiChipSelect
            options={PAY_PRESETS}
            value={payInputType === 'input' ? row.inputCost : ''}
            onChange={v => {
              setPayInputType('input');
              patch(index, { inputCost: v, selectCost: '' });
            }}
          />
        </View>
      ))}
    </FormField>
  );
}

export function RecruitMinisterWriteView({ onBack, onSuccess }: Props) {
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
  const [part, setPart] = useState<SortContent[]>([{ sort: '전임', content: '' }]);
  const [partDetail, setPartDetail] = useState<SortContent[]>([{ sort: '전임', content: '' }]);
  const [school, setSchool] = useState<SortContent[]>([{ sort: '전임', content: '' }]);
  const [career, setCareer] = useState<SortContent[]>([{ sort: '전임', content: '' }]);
  const [recruitNum, setRecruitNum] = useState('');

  const [workday, setWorkday] = useState<SortContent[]>([{ sort: '전임', content: '' }]);
  const [workdayMenu, setWorkdayMenu] = useState<string[]>(['']);
  const [workTimeSunDay, setWorkTimeSunDay] = useState<WorkTimeSunDay[]>([
    { sort: '전임', startHour: '09', startMinute: '00', endHour: '16', endMinute: '00' },
  ]);
  const [workTimeWeek, setWorkTimeWeek] = useState<WorkTimeWeek[]>([
    { sort: '전임', startHour: '09', startMinute: '00', endHour: '17', endMinute: '00', day: '평일' },
  ]);
  const [dawnPray, setDawnPray] = useState<SortContent[]>([{ sort: '전임', content: '' }]);
  const [dawnPrayMenu, setDawnPrayMenu] = useState<string[]>(['']);

  const [pay, setPay] = useState<PayItem[]>([
    { sort: '전임', paySort: '월', selectCost: '', inputCost: '' },
  ]);
  const [insurance, setInsurance] = useState<SortContent[]>([{ sort: '전임', content: '' }]);
  const [severance, setSeverance] = useState<SortContent[]>([{ sort: '전임', content: '' }]);
  const [welfare, setWelfare] = useState<SortContent[]>([{ sort: '전임', content: '' }]);

  const [applytime, setApplytime] = useState<ApplyTime>({ startDay: '', endDay: '', daySort: '' });
  const [applydoc, setApplydoc] = useState<SortContent[]>([{ sort: '전임', content: '' }]);
  const [applyhow, setApplyhow] = useState('');
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [etcNotice, setEtcNotice] = useState('');
  const [customInput, setCustomInput] = useState('');

  const subareas = useMemo(
    () => citydata.find(item => item.city === location)?.subarea ?? [],
    [location],
  );

  const applySortChange = (next: string) => {
    setSort(next);
    if (!next) {
      const empty = buildMinisterArraysForSort('전임');
      setPart(empty.part);
      setPartDetail(empty.partDetail);
      setSchool(empty.school);
      setCareer(empty.career);
      setWorkday(empty.workday);
      setWorkTimeSunDay(empty.workTimeSunDay);
      setWorkTimeWeek(empty.workTimeWeek);
      setDawnPray(empty.dawnPray);
      setPay(empty.pay);
      setInsurance(empty.insurance);
      setSeverance(empty.severance);
      setWelfare(empty.welfare);
      setApplydoc(empty.applydoc);
      setWorkdayMenu(['']);
      setDawnPrayMenu(['']);
      return;
    }
    const arrays = buildMinisterArraysForSort(next);
    setPart(arrays.part);
    setPartDetail(arrays.partDetail);
    setSchool(arrays.school);
    setCareer(arrays.career);
    setWorkday(arrays.workday);
    setWorkTimeSunDay(arrays.workTimeSunDay);
    setWorkTimeWeek(arrays.workTimeWeek);
    setDawnPray(arrays.dawnPray);
    setPay(arrays.pay);
    setInsurance(arrays.insurance);
    setSeverance(arrays.severance);
    setWelfare(arrays.welfare);
    setApplydoc(arrays.applydoc);
    setWorkdayMenu(arrays.workday.map(() => ''));
    setDawnPrayMenu(arrays.dawnPray.map(() => ''));
  };

  const registerPost = async () => {
    if (submitting) return;
    if (!title.trim() || !church.trim()) {
      Alert.alert('', '제목과 교회명을 입력해주세요.');
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
        part: JSON.stringify(part),
        partDetail: JSON.stringify(partDetail),
        recruitNum,
        workday: JSON.stringify(workday),
        workTimeSunDay: JSON.stringify(workTimeSunDay),
        workTimeWeek: JSON.stringify(workTimeWeek),
        dawnPray: JSON.stringify(dawnPray),
        pay: JSON.stringify(pay),
        welfare: JSON.stringify(welfare),
        insurance: JSON.stringify(insurance),
        severance: JSON.stringify(severance),
        applydoc: JSON.stringify(applydoc),
        applyhow,
        applytime: JSON.stringify(applytime),
        etcNotice,
        inquiry: JSON.stringify({ inquiryName, email: inquiryEmail, phone: inquiryPhone }),
        churchLogo: churchLogo?.name ?? '',
        customInput,
      };

      const res = await axios.post(`${API_BASE}/recruitminister/postsrecruit`, formData, {
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
        title="사역자구인"
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
      <FormField label="교회명" required>
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
      <FormField label="담임목사">
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
        <SingleChipSelect options={MINISTER_SORT_OPTIONS} value={sort} onChange={applySortChange} />
      </FormField>
      <SortContentBlock
        title="담당파트"
        rows={part}
        presets={PART_PRESETS}
        sortOptions={SORT_LABEL_OPTIONS}
        onChange={setPart}
      />
      <SortContentBlock
        title="파트상세"
        rows={partDetail}
        presets={PART_DETAIL_PRESETS}
        sortOptions={SORT_LABEL_OPTIONS}
        onChange={setPartDetail}
      />
      <SortContentBlock
        title="학력"
        rows={school}
        presets={MINISTER_SCHOOL_PRESETS}
        sortOptions={SORT_LABEL_OPTIONS}
        onChange={setSchool}
      />
      <SortContentBlock
        title="경력"
        rows={career}
        presets={MINISTER_CAREER_PRESETS}
        sortOptions={SORT_LABEL_OPTIONS}
        onChange={setCareer}
      />
      <FormField label="채용인원">
        <SingleChipSelect options={RECRUIT_NUM_OPTIONS} value={recruitNum} onChange={setRecruitNum} />
      </FormField>

      <SectionTitle>사역정보</SectionTitle>
      <FormField label="사역요일">
        {workday.map((row, index) => (
          <View key={`workday-${index}`} style={{ marginBottom: 12 }}>
            <SortRowControls
              sort={row.sort}
              sortOptions={SORT_LABEL_OPTIONS}
              onSortChange={v => setWorkday(updateSortContentRow(workday, index, { sort: v }))}
              onAdd={() => setWorkday([...workday, { sort: '전임', content: '' }])}
              onRemove={() => setWorkday(removeSortContentRow(workday, index))}
              showRemove={index > 0}
            />
            <FormTextInput
              value={row.content}
              onChangeText={v => setWorkday(updateSortContentRow(workday, index, { content: v }))}
            />
            <MultiChipSelect
              options={WEEKDAY_OPTIONS}
              value={row.content}
              onChange={v => setWorkday(updateSortContentRow(workday, index, { content: v }))}
            />
            <SingleChipSelect
              options={WORKDAY_PRESETS}
              value={workdayMenu[index] ?? ''}
              onChange={preset => {
                const menus = [...workdayMenu];
                menus[index] = preset;
                setWorkdayMenu(menus);
                if (preset) {
                  setWorkday(
                    updateSortContentRow(workday, index, { content: applyWorkdayPreset(preset) }),
                  );
                }
              }}
            />
          </View>
        ))}
      </FormField>
      <WorkTimeSunBlock rows={workTimeSunDay} onChange={setWorkTimeSunDay} />
      <WorkTimeWeekBlock rows={workTimeWeek} onChange={setWorkTimeWeek} />
      <FormField label="새벽기도참석">
        {dawnPray.map((row, index) => (
          <View key={`dawn-${index}`} style={{ marginBottom: 12 }}>
            <SortRowControls
              sort={row.sort}
              sortOptions={SORT_LABEL_OPTIONS}
              onSortChange={v => setDawnPray(updateSortContentRow(dawnPray, index, { sort: v }))}
              onAdd={() => setDawnPray([...dawnPray, { sort: '전임', content: '' }])}
              onRemove={() => setDawnPray(removeSortContentRow(dawnPray, index))}
              showRemove={index > 0}
            />
            <FormTextInput
              value={row.content}
              onChangeText={v => setDawnPray(updateSortContentRow(dawnPray, index, { content: v }))}
            />
            <MultiChipSelect
              options={WEEKDAY_OPTIONS}
              value={row.content}
              onChange={v => setDawnPray(updateSortContentRow(dawnPray, index, { content: v }))}
            />
            <SingleChipSelect
              options={DAWN_PRAY_PRESETS}
              value={dawnPrayMenu[index] ?? ''}
              onChange={preset => {
                const menus = [...dawnPrayMenu];
                menus[index] = preset;
                setDawnPrayMenu(menus);
                if (preset) {
                  setDawnPray(updateSortContentRow(dawnPray, index, { content: preset }));
                }
              }}
            />
          </View>
        ))}
      </FormField>

      <SectionTitle>복지정보</SectionTitle>
      <PayBlock rows={pay} onChange={setPay} />
      <SortContentBlock
        title="보험"
        rows={insurance}
        presets={INSURANCE_PRESETS}
        sortOptions={SORT_LABEL_OPTIONS}
        onChange={setInsurance}
      />
      <SortContentBlock
        title="퇴직금"
        rows={severance}
        presets={SEVERANCE_PRESETS}
        sortOptions={SORT_LABEL_OPTIONS}
        onChange={setSeverance}
      />
      <SortContentBlock
        title="복리후생"
        rows={welfare}
        presets={WELFARE_PRESETS}
        sortOptions={SORT_LABEL_OPTIONS}
        onChange={setWelfare}
      />

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
        presets={MINISTER_APPLYDOC_PRESETS}
        sortOptions={SORT_LABEL_OPTIONS}
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
        multilineMinHeight={340}
      />

      <SubmitBar submitting={submitting} onSubmit={() => void registerPost()} />
    </FormKeyboardScreen>
  );
}
