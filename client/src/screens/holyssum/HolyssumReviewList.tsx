import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import './HolyssumReviewList.scss';

interface ReviewItem {
  id: number;
  nickname: string;
  name: string;
  contact: string;
  rank1: string;
  rank2: string;
  rank3: string;
  satisfaction_score: number | null;
  memorable_order: string;
  venue_feedback: string;
  conversation_feedback: string;
  join_next_meeting: string;
  receive_news: string;
  recommend: string;
  improvement_suggestions: string;
  createdAt: string;
}

export default function HolyssumReviewList() {
  const navigate = useNavigate();
  const [list, setList] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${MainURL}/holyssum/reviews/list`);
        if (res.data?.success && Array.isArray(res.data.resultData)) {
          setList(res.data.resultData);
        }
      } catch (err) {
        console.error('후기 목록 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const goBack = () => {
    window.scrollTo(0, 0);
    navigate(-1);
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="holyssum-review-list-page">
      <div className="holyssum-review-list-card">
        <div className="holyssum-review-list-header">
          <span className="holyssum-review-list-header-icon">📋</span>
          <h1>후기 리스트</h1>
        </div>
        <button type="button" className="holyssum-review-list-back-btn" onClick={goBack} aria-label="뒤로가기">
          ← 뒤로
        </button>

        <div className="holyssum-review-list-body">
          {loading ? (
            <p className="holyssum-review-list-loading">불러오는 중...</p>
          ) : list.length === 0 ? (
            <p className="holyssum-review-list-empty">등록된 후기가 없습니다.</p>
          ) : (
            <div className="holyssum-review-list">
              {list.map((item) => (
                <div key={item.id} className="holyssum-review-list-item">
                  <div
                    className="holyssum-review-list-item-summary"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <span className="holyssum-review-list-item-name">
                      {item.nickname || '(닉네임 없음)'} | {item.name || '-'}
                    </span>
                    <span className="holyssum-review-list-item-date">{formatDate(item.createdAt)}</span>
                    <span className="holyssum-review-list-item-toggle">{expandedId === item.id ? '▲' : '▼'}</span>
                  </div>
                  {expandedId === item.id && (
                    <div className="holyssum-review-list-item-detail">
                      <div className="holyssum-review-detail-row">
                        <span className="holyssum-review-detail-label">닉네임</span>
                        <span>{item.nickname || '-'}</span>
                      </div>
                      <div className="holyssum-review-detail-row">
                        <span className="holyssum-review-detail-label">이름</span>
                        <span>{item.name || '-'}</span>
                      </div>
                      <div className="holyssum-review-detail-row">
                        <span className="holyssum-review-detail-label">연락처</span>
                        <span>{item.contact || '-'}</span>
                      </div>
                      <div className="holyssum-review-detail-row">
                        <span className="holyssum-review-detail-label">호감도 1위</span>
                        <span>{item.rank1 || '-'}</span>
                      </div>
                      <div className="holyssum-review-detail-row">
                        <span className="holyssum-review-detail-label">호감도 2위</span>
                        <span>{item.rank2 || '-'}</span>
                      </div>
                      <div className="holyssum-review-detail-row">
                        <span className="holyssum-review-detail-label">호감도 3위</span>
                        <span>{item.rank3 || '-'}</span>
                      </div>
                      <div className="holyssum-review-detail-row">
                        <span className="holyssum-review-detail-label">만족도</span>
                        <span>{item.satisfaction_score != null ? `${item.satisfaction_score}점` : '-'}</span>
                      </div>
                      <div className="holyssum-review-detail-row holyssum-review-detail-row-full">
                        <span className="holyssum-review-detail-label">가장 기억에 남거나 즐거웠던 순서</span>
                        <span>{item.memorable_order || '-'}</span>
                      </div>
                      <div className="holyssum-review-detail-row holyssum-review-detail-row-full">
                        <span className="holyssum-review-detail-label">행사장소·다과</span>
                        <span>{item.venue_feedback || '-'}</span>
                      </div>
                      <div className="holyssum-review-detail-row holyssum-review-detail-row-full">
                        <span className="holyssum-review-detail-label">1:1 대화시간</span>
                        <span>{item.conversation_feedback || '-'}</span>
                      </div>
                      <div className="holyssum-review-detail-row">
                        <span className="holyssum-review-detail-label">다음 모임 참여</span>
                        <span>{item.join_next_meeting || '-'}</span>
                      </div>
                      <div className="holyssum-review-detail-row">
                        <span className="holyssum-review-detail-label">소식 수신</span>
                        <span>{item.receive_news || '-'}</span>
                      </div>
                      <div className="holyssum-review-detail-row">
                        <span className="holyssum-review-detail-label">추천 의향</span>
                        <span>{item.recommend || '-'}</span>
                      </div>
                      <div className="holyssum-review-detail-row holyssum-review-detail-row-full">
                        <span className="holyssum-review-detail-label">보완점</span>
                        <span>{item.improvement_suggestions || '-'}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
