import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import './HolyssumMemo.scss';

interface ProfileItem {
  id: number;
  nickname: string;
  gender?: string;
}

interface MemoItem {
  targetId: number;
  targetNickname: string;
  memo: string;
}

export default function HolyssumMemo() {
  const navigate = useNavigate();
  const [list, setList] = useState<ProfileItem[]>([]);
  const [memos, setMemos] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [myProfileId, setMyProfileId] = useState<number | null>(null);
  const [myGender, setMyGender] = useState<string | null>(null);

  const oppositeList = useCallback(() => {
    if (!myGender) return [];
    const oppositeGender = myGender === '남자' ? '여자' : '남자';
    return list.filter((p) => p.gender === oppositeGender);
  }, [list, myGender]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const savedId = sessionStorage.getItem('holyssum_profile_id');
    const savedGender = sessionStorage.getItem('holyssum_gender');
    if (!savedId || !savedGender || (savedGender !== '남자' && savedGender !== '여자')) {
      navigate('/holyssum');
      return;
    }
    setMyProfileId(parseInt(savedId, 10));
    setMyGender(savedGender);
  }, [navigate]);

  useEffect(() => {
    if (!myProfileId) return;
    (async () => {
      setLoading(true);
      try {
        const [listRes, memosRes] = await Promise.all([
          axios.get(`${MainURL}/holyssum/list`),
          axios.get(`${MainURL}/holyssum/memos/list`, { params: { writerId: myProfileId } }),
        ]);
        if (listRes.data?.success && Array.isArray(listRes.data.resultData)) {
          setList(listRes.data.resultData);
        }
        if (memosRes.data?.success && Array.isArray(memosRes.data.resultData)) {
          const map: Record<number, string> = {};
          (memosRes.data.resultData as MemoItem[]).forEach((m) => {
            map[m.targetId] = m.memo || '';
          });
          setMemos(map);
        }
      } catch (err) {
        console.error('메모 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [myProfileId]);

  const handleSaveAll = async () => {
    if (!myProfileId) return;
    setSaving(true);
    try {
      const targets = oppositeList();
      await Promise.all(
        targets.map((item) =>
          axios.post(`${MainURL}/holyssum/memos/save`, {
            writerId: myProfileId,
            targetId: item.id,
            memo: memos[item.id] ?? '',
          })
        )
      );
      alert('메모가 저장되었습니다.');
    } catch (err) {
      console.error('메모 저장 실패:', err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    window.scrollTo(0, 0);
    navigate(-1);
  };

  if (!myProfileId) {
    return null;
  }

  const targets = oppositeList();

  return (
    <div className="holyssum-memo-page">
      <div className="holyssum-memo-card">
        <div className="holyssum-memo-header">
          <span className="holyssum-memo-header-icon">📝</span>
          <h1>메모하기</h1>
        </div>
        <button type="button" className="holyssum-memo-back-btn" onClick={goBack} aria-label="뒤로가기">
          ← 뒤로
        </button>

        <div className="holyssum-memo-body">
          {loading ? (
            <p className="holyssum-memo-loading">불러오는 중...</p>
          ) : targets.length === 0 ? (
            <p className="holyssum-memo-empty">메모할 상대방 프로필이 없습니다.</p>
          ) : (
            <>
              <div className="holyssum-memo-list">
                {targets.map((item) => (
                  <div key={item.id} className="holyssum-memo-item">
                    <div className="holyssum-memo-item-header">{item.nickname || '(닉네임 없음)'}</div>
                    <textarea
                      className="holyssum-memo-textarea"
                      value={memos[item.id] ?? ''}
                      onChange={(e) => setMemos((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder="메모를 입력하세요..."
                      rows={4}
                    />
                  </div>
                ))}
              </div>
              <div className="holyssum-memo-save-all">
                <button
                  type="button"
                  className="holyssum-memo-save-btn"
                  onClick={handleSaveAll}
                  disabled={saving}
                >
                  {saving ? '저장 중...' : '전체 저장'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
