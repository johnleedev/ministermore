import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import {
  parseJsonArray,
  NICKNAME_OPTIONS_FEMALE,
  NICKNAME_OPTIONS_MALE,
  DISPOSITION_OPTIONS,
  DATE_STYLE_OPTIONS,
  PARTNER_ACTIVITY_OPTIONS,
  FAITH_PRIORITY_OPTIONS,
} from './holyssumData';
import './HolyssumInput.scss';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="holyssum-input-section">
      <h3 className="holyssum-input-section-heading">{title}</h3>
      <div className="holyssum-input-section-content">{children}</div>
    </section>
  );
}

function BigSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="holyssum-input-big-section">
      <h2 className="holyssum-input-big-heading">{title}</h2>
      <div className="holyssum-input-big-content">{children}</div>
    </section>
  );
}

function CheckboxGroup({
  options,
  selected,
  onChange,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };
  return (
    <div className="holyssum-input-check-group">
      {options.map((opt) => (
        <label key={opt} className="holyssum-input-check-label">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => toggle(opt)}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

const GENDER_OPTIONS = ['남자', '여자'] as const;

export default function HolyssumInput() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'남자' | '여자' | ''>('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [residence, setResidence] = useState('');
  const [mbti, setMbti] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [idealPriority, setIdealPriority] = useState('');
  const [idealPlace, setIdealPlace] = useState('');
  const [disposition, setDisposition] = useState<string[]>([]);
  const [dateStyle, setDateStyle] = useState<string[]>([]);
  const [partnerActivity, setPartnerActivity] = useState<string[]>([]);
  const [comfortSong, setComfortSong] = useState('');
  const [faithPriority, setFaithPriority] = useState<string[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEdit = !!id;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await axios.get(`${MainURL}/holyssum/detail/${id}`);
        if (res.data?.success) {
          const p = res.data.resultData;
          setNickname(p.nickname || '');
          setGender(p.gender === '남자' || p.gender === '여자' ? p.gender : '');
          setAge(p.age || '');
          setOccupation(p.occupation || '');
          setResidence(p.residence || '');
          setMbti(p.mbti || '');
          setHobbies(p.hobbies || '');
          setIdealPriority(p.idealPriority || '');
          setIdealPlace(p.idealPlace || '');
          setDisposition(parseJsonArray(p.disposition));
          setDateStyle(parseJsonArray(p.dateStyle));
          setPartnerActivity(parseJsonArray(p.partnerActivity));
          setComfortSong(p.comfortSong || '');
          setFaithPriority(parseJsonArray(p.faithPriority));
        }
      } catch (err) {
        console.error('프로필 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      alert('닉네임을 입력해 주세요.');
      return;
    }
    if (!isEdit) {
      const pwd = password.replace(/\D/g, '');
      if (pwd.length !== 4) {
        alert('비밀번호 4자리(숫자)를 입력해 주세요.');
        return;
      }
      if (!gender) {
        alert('성별을 선택해 주세요.');
        return;
      }
    }
    setSaving(true);
    try {
      const res = await axios.post(`${MainURL}/holyssum/save`, {
        id: id ? parseInt(id, 10) : undefined,
        nickname: nickname.trim(),
        password: !isEdit ? password.replace(/\D/g, '') : undefined,
        gender: gender || undefined,
        age: age.trim(),
        occupation: occupation.trim(),
        residence: residence.trim(),
        mbti: mbti.trim(),
        hobbies: hobbies.trim(),
        idealPriority: idealPriority.trim(),
        idealPlace: idealPlace.trim(),
        disposition,
        dateStyle,
        partnerActivity,
        comfortSong: comfortSong.trim(),
        faithPriority,
      });
      if (res.data?.success) {
        alert(id ? '수정되었습니다.' : '등록되었습니다.');
        window.scrollTo(0, 0);
        navigate('/holyssum');
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (err) {
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('정말 프로필을 삭제하시겠습니까? 삭제된 프로필은 복구할 수 없습니다.')) return;
    const pwd = window.prompt('비밀번호 4자리를 입력해 주세요.');
    if (!pwd || pwd.replace(/\D/g, '').length !== 4) {
      alert('비밀번호 4자리를 입력해 주세요.');
      return;
    }
    setDeleting(true);
    try {
      const res = await axios.delete(`${MainURL}/holyssum/delete`, {
        data: { id: parseInt(id, 10), password: pwd.replace(/\D/g, '').slice(0, 4) },
      });
      if (res.data?.success) {
        alert('프로필이 삭제되었습니다.');
        sessionStorage.removeItem('holyssum_profile_id');
        sessionStorage.removeItem('holyssum_gender');
        window.scrollTo(0, 0);
        navigate('/holyssum');
      } else {
        alert(res.data?.error || '삭제에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || '삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="holyssum-input-page">
        <button type="button" className="holyssum-input-back-btn" onClick={() => { window.scrollTo(0, 0); navigate(-1); }} aria-label="뒤로가기">
          ← 뒤로
        </button>
        <p className="holyssum-input-loading">불러오는 중...</p>
      </div>
    );
  }

  const goBack = () => {
    window.scrollTo(0, 0);
    navigate(-1);
  };

  return (
    <div className="holyssum-input-page">
      <div className="holyssum-input-card">
        <div className="holyssum-input-header">
          <h1>♥홀리썸 프로필 카드</h1>
        </div>
        <button type="button" className="holyssum-input-back-btn" onClick={goBack} aria-label="뒤로가기">
          ← 뒤로
        </button>

        <form className="holyssum-input-form" onSubmit={handleSubmit}>
          <BigSection title="기본정보">
            {isEdit ? (
              <>
                <div className="holyssum-input-field holyssum-input-field-readonly">
                  <span className="holyssum-input-field-label holyssum-input-field-label-fixed">성별</span>
                  <span className="holyssum-input-field-value">{gender || '-'}</span>
                </div>
                <div className="holyssum-input-field holyssum-input-field-readonly">
                  <span className="holyssum-input-field-label holyssum-input-field-label-fixed">닉네임</span>
                  <span className="holyssum-input-field-value">{nickname || '-'}</span>
                </div>
                <p style={{fontSize:'12px', color:'#666'}}>*기본정보는 수정할 수 없습니다.</p>
              </>
            ) : (
              <>
                <div className="holyssum-input-field">
                  <label className="holyssum-input-field-label holyssum-input-field-label-fixed">성별</label>
                  <div className="holyssum-input-gender-group">
                    {GENDER_OPTIONS.map((g) => (
                      <label key={g} className="holyssum-input-gender-label">
                        <input
                          type="radio"
                          name="gender"
                          checked={gender === g}
                          onChange={() => {
                            setGender(g);
                            setNickname('');
                          }}
                        />
                        <span>{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="holyssum-input-field">
                  <label className="holyssum-input-field-label holyssum-input-field-label-fixed">닉네임</label>
                  <div className="holyssum-input-nickname-list">
                    {gender === '여자' &&
                      NICKNAME_OPTIONS_FEMALE.map((name) => (
                        <button
                          key={name}
                          type="button"
                          className={`holyssum-input-nickname-item ${nickname === name ? 'selected' : ''}`}
                          onClick={() => setNickname(name)}
                          disabled={!gender}
                        >
                          {name}
                        </button>
                      ))}
                    {gender === '남자' &&
                      NICKNAME_OPTIONS_MALE.map((name) => (
                        <button
                          key={name}
                          type="button"
                          className={`holyssum-input-nickname-item ${nickname === name ? 'selected' : ''}`}
                          onClick={() => setNickname(name)}
                          disabled={!gender}
                        >
                          {name}
                        </button>
                      ))}
                  </div>
                </div>
                <div className="holyssum-input-field">
                  <label className="holyssum-input-field-label holyssum-input-field-label-fixed">수정비밀번호</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                    className="holyssum-input-el"
                  />
                </div>
                <p style={{fontSize:'12px', color:'#666'}}>*기본정보는 한번 등록하면 수정할 수 없습니다.</p>
              </>
            )}
          </BigSection>

          <BigSection title="개인정보">
              <div className="holyssum-input-field">
                <label className="holyssum-input-field-label holyssum-input-field-label-fixed">출생년도</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={age}
                  placeholder="4자리"
                  onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="holyssum-input-el"
                />
              </div>
              <div className="holyssum-input-field">
                <label className="holyssum-input-field-label holyssum-input-field-label-fixed">직업</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="holyssum-input-el"
                />
              </div>
              <div className="holyssum-input-field">
                <label className="holyssum-input-field-label holyssum-input-field-label-fixed">주거지역</label>
                <input
                  type="text"
                  value={residence}
                  onChange={(e) => setResidence(e.target.value)}
                  className="holyssum-input-el"
                />
              </div>
              <div className="holyssum-input-field">
                <label className="holyssum-input-field-label holyssum-input-field-label-fixed">MBTI</label>
                <input
                  type="text"
                  value={mbti}
                  onChange={(e) => setMbti(e.target.value)}
                  className="holyssum-input-el"
                />
              </div>
              <div className="holyssum-input-field">
                <label className="holyssum-input-field-label holyssum-input-field-label-fixed">취미</label>
                <input
                  type="text"
                  value={hobbies}
                  onChange={(e) => setHobbies(e.target.value)}
                  className="holyssum-input-el"
                />
              </div>
          </BigSection>

          <BigSection title="이상형">
            <div className="holyssum-input-field">
              <label className="holyssum-input-field-label holyssum-input-field-label-wide">이성을 볼 때 가장 중요하게 생각하는 것</label>
              <input
                type="text"
                value={idealPriority}
                onChange={(e) => setIdealPriority(e.target.value)}
                className="holyssum-input-el"
              />
            </div>
            <div className="holyssum-input-field">
              <label className="holyssum-input-field-label holyssum-input-field-label-wide">연인과 함께 가고 싶은 곳</label>
              <input
                type="text"
                value={idealPlace}
                onChange={(e) => setIdealPlace(e.target.value)}
                className="holyssum-input-el"
              />
            </div>
          </BigSection>

          <BigSection title="나는 이런 사람이에요">
            <Section title="나는 이런 성향이에요">
              <CheckboxGroup options={DISPOSITION_OPTIONS} selected={disposition} onChange={setDisposition} />
            </Section>
            <Section title="데이트 스타일은?">
              <CheckboxGroup options={DATE_STYLE_OPTIONS} selected={dateStyle} onChange={setDateStyle} />
            </Section>
          </BigSection>

          <BigSection title="신앙관련">
            <Section title="배우자와 꼭 함께 하고 싶은 것">
              <CheckboxGroup options={PARTNER_ACTIVITY_OPTIONS} selected={partnerActivity} onChange={setPartnerActivity} />
            </Section>
            <Section title="요즘 위로가 되는 찬양 한 곡">
              <div className="holyssum-input-field">
                <label className="holyssum-input-field-label">→</label>
                <input
                  type="text"
                  value={comfortSong}
                  onChange={(e) => setComfortSong(e.target.value)}
                  className="holyssum-input-el full"
                />
              </div>
            </Section>
            <Section title="신앙생활에서 가장 중요한 것은?">
              <CheckboxGroup options={FAITH_PRIORITY_OPTIONS} selected={faithPriority} onChange={setFaithPriority} />
            </Section>
          </BigSection>

          <div className="holyssum-input-form-actions">
            <div className="holyssum-input-form-actions-left">
              {isEdit && (
                <button
                  type="button"
                  className="holyssum-input-btn holyssum-input-btn-delete"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? '삭제 중...' : '프로필 삭제'}
                </button>
              )}
            </div>
            <div className="holyssum-input-form-actions-right">
              <button type="button" className="holyssum-input-btn secondary" onClick={() => { window.scrollTo(0, 0); navigate('/holyssum'); }}>
                취소
              </button>
              <button type="submit" className="holyssum-input-btn primary" disabled={saving}>
                {saving ? '저장 중...' : id ? '수정하기' : '등록하기'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
