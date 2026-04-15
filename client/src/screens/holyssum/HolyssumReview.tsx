import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import './HolyssumReview.scss';

const YES_NO_OPTIONS = ['네', '아니오'] as const;

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="holyssum-review-section">
      <h2 className="holyssum-review-section-heading">{title}</h2>
      <div className="holyssum-review-section-content">{children}</div>
    </section>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
  name,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  name: string;
}) {
  return (
    <div className="holyssum-review-radio-group">
      {options.map((opt) => (
        <label key={opt} className="holyssum-review-radio-label">
          <input
            type="radio"
            name={name}
            checked={value === opt}
            onChange={() => onChange(opt)}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

export default function HolyssumReview({ isEdit = false }: { isEdit?: boolean }) {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [rank1, setRank1] = useState('');
  const [rank2, setRank2] = useState('');
  const [rank3, setRank3] = useState('');
  const [satisfactionScore, setSatisfactionScore] = useState('');
  const [memorableOrder, setMemorableOrder] = useState('');
  const [venueFeedback, setVenueFeedback] = useState('');
  const [conversationFeedback, setConversationFeedback] = useState('');
  const [joinNextMeeting, setJoinNextMeeting] = useState('');
  const [receiveNews, setReceiveNews] = useState('');
  const [recommend, setRecommend] = useState('');
  const [improvementSuggestions, setImprovementSuggestions] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [isNicknameFromLogin, setIsNicknameFromLogin] = useState(false);
  const [hasReview, setHasReview] = useState(false);
  const [noProfileId, setNoProfileId] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const savedNickname = sessionStorage.getItem('holyssum_nickname');
    if (savedNickname) {
      setNickname(savedNickname);
      setIsNicknameFromLogin(true);
    }
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const profileId = sessionStorage.getItem('holyssum_profile_id');
    if (!profileId) {
      setNoProfileId(true);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`${MainURL}/holyssum/reviews/my`, { params: { profileId } });
        if (res.data?.success && res.data.resultData) {
          const r = res.data.resultData;
          setNickname(r.nickname || '');
          setName(r.name || '');
          setContact(r.contact || '');
          setRank1(r.rank1 || '');
          setRank2(r.rank2 || '');
          setRank3(r.rank3 || '');
          setSatisfactionScore(r.satisfaction_score != null ? String(r.satisfaction_score) : '');
          setMemorableOrder(r.memorable_order || '');
          setVenueFeedback(r.venue_feedback || '');
          setConversationFeedback(r.conversation_feedback || '');
          setJoinNextMeeting(r.join_next_meeting || '');
          setReceiveNews(r.receive_news || '');
          setRecommend(r.recommend || '');
          setImprovementSuggestions(r.improvement_suggestions || '');
          setIsNicknameFromLogin(true);
          setHasReview(true);
        }
      } catch (err) {
        console.error('후기 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit]);

  const goBack = () => {
    window.scrollTo(0, 0);
    navigate(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        const profileId = sessionStorage.getItem('holyssum_profile_id');
        if (!profileId) {
          alert('로그인이 필요합니다.');
          return;
        }
        const res = await axios.post(`${MainURL}/holyssum/reviews/update`, {
          profileId,
          nickname: nickname.trim(),
          name: name.trim(),
          contact: contact.trim(),
          rank1: rank1.trim(),
          rank2: rank2.trim(),
          rank3: rank3.trim(),
          satisfactionScore: satisfactionScore ? parseInt(satisfactionScore, 10) : null,
          memorableOrder: memorableOrder.trim(),
          venueFeedback: venueFeedback.trim(),
          conversationFeedback: conversationFeedback.trim(),
          joinNextMeeting: joinNextMeeting.trim(),
          receiveNews: receiveNews.trim(),
          recommend: recommend.trim(),
          improvementSuggestions: improvementSuggestions.trim(),
        });
        if (res.data?.success) {
          alert('후기가 수정되었습니다.');
          window.scrollTo(0, 0);
          navigate('/holyssum');
        } else {
          alert(res.data?.error || '수정에 실패했습니다.');
        }
      } else {
        const res = await axios.post(`${MainURL}/holyssum/reviews/save`, {
          nickname: nickname.trim(),
          name: name.trim(),
          contact: contact.trim(),
          rank1: rank1.trim(),
          rank2: rank2.trim(),
          rank3: rank3.trim(),
          satisfactionScore: satisfactionScore ? parseInt(satisfactionScore, 10) : null,
          memorableOrder: memorableOrder.trim(),
          venueFeedback: venueFeedback.trim(),
          conversationFeedback: conversationFeedback.trim(),
          joinNextMeeting: joinNextMeeting.trim(),
          receiveNews: receiveNews.trim(),
          recommend: recommend.trim(),
          improvementSuggestions: improvementSuggestions.trim(),
        });
        if (res.data?.success) {
          alert('후기가 등록되었습니다.');
          window.scrollTo(0, 0);
          navigate('/holyssum');
        } else {
          alert('저장에 실패했습니다.');
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.error || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="holyssum-review-page">
      <div className="holyssum-review-card">
        <div className="holyssum-review-header">
          <span className="holyssum-review-header-icon">📋</span>
          <h1>{isEdit ? '홀리썸 후기 수정' : '홀리썸 후기 작성지'}</h1>
        </div>
        <button type="button" className="holyssum-review-back-btn" onClick={goBack} aria-label="뒤로가기">
          ← 뒤로
        </button>

        {loading ? (
          <div className="holyssum-review-form">
            <p className="holyssum-review-loading">불러오는 중...</p>
          </div>
        ) : isEdit && noProfileId ? (
          <div className="holyssum-review-form">
            <p className="holyssum-review-empty">로그인이 필요합니다. 메인에서 로그인해 주세요.</p>
            <button type="button" className="holyssum-review-btn primary" onClick={() => navigate('/holyssum')}>
              메인으로
            </button>
          </div>
        ) : isEdit && !hasReview ? (
          <div className="holyssum-review-form">
            <p className="holyssum-review-empty">등록된 후기가 없습니다. 먼저 후기를 작성해 주세요.</p>
            <button type="button" className="holyssum-review-btn primary" onClick={() => navigate('/holyssum/review')}>
              후기 작성하기
            </button>
          </div>
        ) : (
        <form className="holyssum-review-form" onSubmit={handleSubmit}>
          <ReviewSection title="개인 신상">
            <div className="holyssum-review-field">
              <label className="holyssum-review-field-label">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                readOnly={isNicknameFromLogin}
                className="holyssum-review-input"
              />
            </div>
            <div className="holyssum-review-field">
              <label className="holyssum-review-field-label">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="holyssum-review-input"
              />
            </div>
            <div className="holyssum-review-field">
              <label className="holyssum-review-field-label">연락처</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="holyssum-review-input"
              />
            </div>
          </ReviewSection>

          <ReviewSection title="호감도 순위 (닉네임)">
            <div className="holyssum-review-field">
              <label className="holyssum-review-field-label">1</label>
              <input
                type="text"
                value={rank1}
                onChange={(e) => setRank1(e.target.value)}
                className="holyssum-review-input"
              />
            </div>
            <div className="holyssum-review-field">
              <label className="holyssum-review-field-label">2</label>
              <input
                type="text"
                value={rank2}
                onChange={(e) => setRank2(e.target.value)}
                className="holyssum-review-input"
              />
            </div>
            <div className="holyssum-review-field">
              <label className="holyssum-review-field-label">3</label>
              <input
                type="text"
                value={rank3}
                onChange={(e) => setRank3(e.target.value)}
                className="holyssum-review-input"
              />
            </div>
          </ReviewSection>

          <ReviewSection title="후기">
            <div className="holyssum-review-field">
              <label className="holyssum-review-field-label">전반적인 만족도 (점수, 100점 만점)</label>
              <input
                type="text"
                inputMode="numeric"
                value={satisfactionScore}
                onChange={(e) => setSatisfactionScore(e.target.value.replace(/\D/g, '').slice(0, 3))}
                className="holyssum-review-input holyssum-review-input-score"
              />
              <span className="holyssum-review-unit">점</span>
            </div>
            <div className="holyssum-review-field holyssum-review-field-textarea">
              <label className="holyssum-review-field-label">가장 기억에 남거나 즐거웠던 순서는?</label>
              <textarea
                value={memorableOrder}
                onChange={(e) => setMemorableOrder(e.target.value)}
                className="holyssum-review-textarea"
                rows={4}
              />
            </div>
            <div className="holyssum-review-field holyssum-review-field-textarea">
              <label className="holyssum-review-field-label">행사장소나 다과는 어떠셨나요?</label>
              <textarea
                value={venueFeedback}
                onChange={(e) => setVenueFeedback(e.target.value)}
                className="holyssum-review-textarea"
                rows={4}
              />
            </div>
            <div className="holyssum-review-field holyssum-review-field-textarea">
              <label className="holyssum-review-field-label">1:1 대화시간은 어떠셨나요?</label>
              <textarea
                value={conversationFeedback}
                onChange={(e) => setConversationFeedback(e.target.value)}
                className="holyssum-review-textarea"
                rows={4}
              />
            </div>
            <div className="holyssum-review-field">
              <label className="holyssum-review-field-label">매칭이 안될 경우, 다음에 열릴 모임에도 참여하고 싶으신가요?</label>
              <RadioGroup options={YES_NO_OPTIONS} value={joinNextMeeting} onChange={setJoinNextMeeting} name="joinNext" />
            </div>
            <div className="holyssum-review-field">
              <label className="holyssum-review-field-label">다음에 열릴 모임에 관한 소식을 받기 원하시나요?</label>
              <RadioGroup options={YES_NO_OPTIONS} value={receiveNews} onChange={setReceiveNews} name="receiveNews" />
            </div>
            <div className="holyssum-review-field">
              <label className="holyssum-review-field-label">이 모임을 주변 싱글 크리스천 지인에게 추천할 의향이 있으신가요?</label>
              <RadioGroup options={YES_NO_OPTIONS} value={recommend} onChange={setRecommend} name="recommend" />
            </div>
            <div className="holyssum-review-field holyssum-review-field-textarea">
              <label className="holyssum-review-field-label">다음 모임에서 보완되었으면 하는 점이 있다면?</label>
              <textarea
                value={improvementSuggestions}
                onChange={(e) => setImprovementSuggestions(e.target.value)}
                className="holyssum-review-textarea"
                rows={4}
              />
            </div>
          </ReviewSection>

          <div className="holyssum-review-actions">
            <button type="submit" className="holyssum-review-btn primary" disabled={saving}>
              {saving ? (isEdit ? '수정 중...' : '제출 중...') : (isEdit ? '수정 완료' : '제출')}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
