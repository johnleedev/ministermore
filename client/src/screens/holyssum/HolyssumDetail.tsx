import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import {
  parseJsonArray,
  DISPOSITION_OPTIONS,
  DATE_STYLE_OPTIONS,
  PARTNER_ACTIVITY_OPTIONS,
  FAITH_PRIORITY_OPTIONS,
} from './holyssumData';
import './HolyssumDetail.scss';

interface Profile {
  id: number;
  nickname: string;
  gender?: string;
  age?: string;
  occupation?: string;
  residence?: string;
  mbti?: string;
  hobbies?: string;
  idealPriority?: string;
  idealPlace?: string;
  disposition: string | string[];
  dateStyle: string | string[];
  partnerActivity: string | string[];
  comfortSong: string;
  faithPriority: string | string[];
}

function Section({
  title,
  children,
  fixedLabels,
}: {
  title: string;
  children: React.ReactNode;
  fixedLabels?: boolean;
}) {
  return (
    <section className={`holyssum-detail-section ${fixedLabels ? 'holyssum-detail-section--fixed-labels' : ''}`}>
      <h3 className="holyssum-detail-section-heading">{title}</h3>
      <div className="holyssum-detail-section-content">{children}</div>
    </section>
  );
}

function BigSection({
  title,
  children,
  fixedLabels,
}: {
  title: string;
  children: React.ReactNode;
  fixedLabels?: boolean;
}) {
  return (
    <section className={`holyssum-detail-big-section ${fixedLabels ? 'holyssum-detail-section--fixed-labels' : ''}`}>
      <h2 className="holyssum-detail-big-heading">{title}</h2>
      <div className="holyssum-detail-big-content">{children}</div>
    </section>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="holyssum-detail-field">
      <span className="holyssum-detail-field-label">{label}</span>
      <span className="holyssum-detail-field-value">{value || '-'}</span>
    </div>
  );
}

function CheckboxList({
  options,
  selected,
}: {
  options: readonly string[];
  selected: string[];
}) {
  return (
    <div className="holyssum-detail-check-list">
      {options.map((opt) => (
        <span
          key={opt}
          className={`holyssum-detail-check-item ${selected.includes(opt) ? 'checked' : ''}`}
        >
          ☐ {opt}
          {selected.includes(opt) ? ' ✓' : ''}
        </span>
      ))}
    </div>
  );
}

export default function HolyssumDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await axios.get(`${MainURL}/holyssum/detail/${id}`);
        if (res.data?.success) {
          setProfile(res.data.resultData);
        } else {
          setError('프로필을 찾을 수 없습니다.');
        }
      } catch (err) {
        setError('프로필을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const disp = parseJsonArray(profile?.disposition);
  const dateStyle = parseJsonArray(profile?.dateStyle);
  const partnerAct = parseJsonArray(profile?.partnerActivity);
  const faithP = parseJsonArray(profile?.faithPriority);

  if (loading) {
    return (
      <div className="holyssum-detail">
        <button type="button" className="holyssum-detail-back-btn" onClick={() => { window.scrollTo(0, 0); navigate(-1); }} aria-label="뒤로가기">
          ← 뒤로
        </button>
        <p className="holyssum-detail-loading">불러오는 중...</p>
      </div>
    );
  }
  if (error || !profile) {
    return (
      <div className="holyssum-detail">
        <button type="button" className="holyssum-detail-back-btn" onClick={() => { window.scrollTo(0, 0); navigate(-1); }} aria-label="뒤로가기">
          ← 뒤로
        </button>
        <p className="holyssum-detail-error">{error || '프로필을 찾을 수 없습니다.'}</p>
        <button className="holyssum-detail-btn" onClick={() => { window.scrollTo(0, 0); navigate('/holyssum'); }}>
          목록으로
        </button>
      </div>
    );
  }

  const goBack = () => {
    window.scrollTo(0, 0);
    navigate(-1);
  };

  return (
    <div className="holyssum-detail">
      <div className="holyssum-detail-card">
        <div className="holyssum-detail-header">
          <h1>♥홀리썸 프로필 카드</h1>
        </div>
        <button type="button" className="holyssum-detail-back-btn" onClick={goBack} aria-label="뒤로가기">
          ← 뒤로
        </button>

        <div className="holyssum-detail-card-body">
          <BigSection title="기본정보" fixedLabels>
            <FieldRow label="성별" value={profile.gender || ''} />
            <FieldRow label="닉네임" value={profile.nickname || ''} />
          </BigSection>
          <BigSection title="개인정보" fixedLabels>
            <FieldRow label="생년월일" value={profile.age || ''} />
            <FieldRow label="직업" value={profile.occupation || ''} />
            <FieldRow label="주거지역" value={profile.residence || ''} />
            <FieldRow label="MBTI" value={profile.mbti || ''} />
            <FieldRow label="취미" value={profile.hobbies || ''} />
          </BigSection>

          <BigSection title="이상형">
            <FieldRow label="이성을 볼 때 가장 중요하게 생각하는 것" value={profile.idealPriority || ''} />
            <FieldRow label="연인과 함께 가고 싶은 곳" value={profile.idealPlace || ''} />
          </BigSection>

          <BigSection title="나는 이런 사람이에요">
            <Section title="나는 이런 성향이에요">
              <CheckboxList options={DISPOSITION_OPTIONS} selected={disp} />
            </Section>
            <Section title="데이트 스타일은?">
              <CheckboxList options={DATE_STYLE_OPTIONS} selected={dateStyle} />
            </Section>
          </BigSection>

          <BigSection title="신앙관련">
            <Section title="배우자와 꼭 함께 하고 싶은 것">
              <CheckboxList options={PARTNER_ACTIVITY_OPTIONS} selected={partnerAct} />
            </Section>
            <Section title="요즘 위로가 되는 찬양 한 곡">
              <div className="holyssum-detail-field">
                <span className="holyssum-detail-field-label">→</span>
                <span className="holyssum-detail-field-value">{profile.comfortSong || '-'}</span>
              </div>
            </Section>
            <Section title="신앙생활에서 가장 중요한 것은?">
              <CheckboxList options={FAITH_PRIORITY_OPTIONS} selected={faithP} />
            </Section>
          </BigSection>
        </div>

        <div className="holyssum-detail-actions">
          <button className="holyssum-detail-btn" onClick={() => { window.scrollTo(0, 0); navigate('/holyssum'); }}>
            목록으로
          </button>
        </div>
      </div>
    </div>
  );
}
