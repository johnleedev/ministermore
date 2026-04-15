import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import './HolyssumMain.scss';

interface ProfileItem {
  id: number;
  nickname: string;
  gender?: string;
}

type ViewMode = 'entry' | 'verify' | 'list';

export default function HolyssumMain() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('entry');
  const [list, setList] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(false);

  // verify form
  const [verifyNickname, setVerifyNickname] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // 로그인한 사용자 성별 (반대 성별 리스트를 보여줌)
  const [myGender, setMyGender] = useState<string | null>(null);
  const [myProfileId, setMyProfileId] = useState<number | null>(null);
  const [myNickname, setMyNickname] = useState<string | null>(null);
  const [hasReview, setHasReview] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${MainURL}/holyssum/list`);
      if (res.data?.success && Array.isArray(res.data.resultData)) {
        setList(res.data.resultData);
      }
    } catch (err) {
      console.error('프로필 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedGender = sessionStorage.getItem('holyssum_gender');
    const savedId = sessionStorage.getItem('holyssum_profile_id');
    const savedNickname = sessionStorage.getItem('holyssum_nickname');
    if (savedGender && (savedGender === '남자' || savedGender === '여자')) {
      setMyGender(savedGender);
      setMyProfileId(savedId ? parseInt(savedId, 10) : null);
      setMyNickname(savedNickname || null);
      setViewMode('list');
      fetchList();
    }
  }, [fetchList]);

  useEffect(() => {
    if (list.length > 0 && myProfileId && !myNickname) {
      const me = list.find((p) => p.id === myProfileId);
      if (me?.nickname) {
        setMyNickname(me.nickname);
        sessionStorage.setItem('holyssum_nickname', me.nickname);
      }
    }
  }, [list, myProfileId, myNickname]);

  useEffect(() => {
    if (!myProfileId) {
      setHasReview(false);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`${MainURL}/holyssum/reviews/my`, { params: { profileId: myProfileId } });
        setHasReview(res.data?.success && res.data.resultData != null);
      } catch {
        setHasReview(false);
      }
    })();
  }, [myProfileId]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');
    if (!verifyNickname.trim()) {
      setVerifyError('닉네임을 입력해 주세요.');
      return;
    }
    const pwd = verifyPassword.replace(/\D/g, '');
    if (pwd.length !== 4) {
      setVerifyError('비밀번호 4자리(숫자)를 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${MainURL}/holyssum/verify`, {
        nickname: verifyNickname.trim(),
        password: pwd,
      });
      if (res.data?.success && res.data.resultData) {
        const profile = res.data.resultData;
        const gender = profile.gender;
        if (!gender || (gender !== '남자' && gender !== '여자')) {
          setVerifyError('등록된 성별 정보가 없습니다. 프로필을 수정해 주세요.');
          return;
        }
        setMyGender(gender);
        setMyProfileId(profile.id);
        setMyNickname(profile.nickname || null);
        sessionStorage.setItem('holyssum_profile_id', String(profile.id));
        sessionStorage.setItem('holyssum_gender', gender);
        sessionStorage.setItem('holyssum_nickname', profile.nickname || '');
        setViewMode('list');
        await fetchList();
      }
    } catch (err: any) {
      setVerifyError(err.response?.data?.error || '닉네임 또는 비밀번호가 일치하지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setViewMode('entry');
    setVerifyNickname('');
    setVerifyPassword('');
    setVerifyError('');
    setMyGender(null);
    setMyProfileId(null);
    setMyNickname(null);
    setHasReview(false);
    setList([]);
    sessionStorage.removeItem('holyssum_profile_id');
    sessionStorage.removeItem('holyssum_gender');
    sessionStorage.removeItem('holyssum_nickname');
  };

  const sortedList = React.useMemo(() => {
    if (!myGender) return list;
    const oppositeGender = myGender === '남자' ? '여자' : '남자';
    return [...list].sort((a, b) => {
      const aOpp = a.gender === oppositeGender ? 1 : 0;
      const bOpp = b.gender === oppositeGender ? 1 : 0;
      return bOpp - aOpp;
    });
  }, [list, myGender]);

  const handleProfileClick = (item: ProfileItem) => {
    if (!myGender) return;
    const oppositeGender = myGender === '남자' ? '여자' : '남자';
    if (item.gender === oppositeGender) {
      window.scrollTo(0, 0);
      navigate(`/holyssum/detail/${item.id}`);
    } else {
      alert('반대 성별의 프로필만 상세정보를 볼 수 있습니다.');
    }
  };

  const handleEditMyProfile = () => {
    const id = myProfileId ?? sessionStorage.getItem('holyssum_profile_id');
    if (id) {
      window.scrollTo(0, 0);
      navigate(`/holyssum/input/${id}`);
    } else {
      setViewMode('verify');
    }
  };

  return (
    <div className="holyssum-main">
      <section className="holyssum-main-event">
        <div className="holyssum-main-header">
          <h1>♥ 홀리썸 프로필 카드</h1>
        </div>
        <div className="holyssum-main-event-info">
          <h2>크리스천 단체 (로테이션) 소개팅 행사</h2>
          <p style={{marginBottom:'20px'}}>홀리썸은 크리스천 청년들이 함께 모여 로테이션 방식으로 소개팅을 진행하는 행사입니다.</p>
          <p style={{fontSize:'18px', fontWeight:'bold'}}><strong>홀리썸 1기</strong></p>
          <p style={{fontSize:'16px', fontWeight:'bold'}}><strong>일시 :</strong> 2026년 2월 15일 (일) 오후 5시 30분</p>
          <p style={{fontSize:'16px', fontWeight:'bold'}}><strong>장소 :</strong> 카페이레 (달서구 호산동)</p>
        </div>

        {viewMode === 'entry' && (
          <div className="holyssum-main-entry-actions">
            <button className="holyssum-main-btn primary" onClick={() => { window.scrollTo(0, 0); navigate('/holyssum/input'); }}>
              등록하기
            </button>
            <button className="holyssum-main-btn secondary" onClick={() => setViewMode('verify')}>
              로그인
            </button>
          </div>
        )}

        {viewMode === 'verify' && (
          <form className="holyssum-main-verify-form" onSubmit={handleVerify}>
            <div className="holyssum-main-verify-fields">
              <input
                type="text"
                placeholder="닉네임"
                value={verifyNickname}
                onChange={(e) => setVerifyNickname(e.target.value)}
                className="holyssum-main-verify-input"
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="비밀번호 4자리"
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value.replace(/\D/g, ''))}
                className="holyssum-main-verify-input"
              />
            </div>
            {verifyError && <p className="holyssum-main-verify-error">{verifyError}</p>}
            <div className="holyssum-main-verify-buttons">
              <button type="button" className="holyssum-main-btn" onClick={() => { window.scrollTo(0, 0); setViewMode('entry'); }}>
                뒤로
              </button>
              <button type="submit" className="holyssum-main-btn primary" disabled={loading}>
                {loading ? '확인 중...' : '확인'}
              </button>
            </div>
          </form>
        )}

        {viewMode === 'list' && (
          <div className="holyssum-main-list-actions">
            <button className="holyssum-main-btn primary" onClick={handleEditMyProfile}>
              내 정보 수정
            </button>
            <button className="holyssum-main-btn" onClick={handleLogout}>
              로그아웃
            </button>
            <button
              className="holyssum-main-btn primary"
              onClick={() => { window.scrollTo(0, 0); navigate('/holyssum/memo'); }}
            >
              메모하기
            </button>
          </div>
        )}
      </section>

      {viewMode === 'list' && (
        <section className="holyssum-main-list-section">
          <h3 className="holyssum-main-section-title">등록된 프로필</h3>
          {loading ? (
            <p className="holyssum-main-loading">불러오는 중...</p>
          ) : list.length === 0 ? (
            <p className="holyssum-main-empty">등록된 프로필이 없습니다.</p>
          ) : (
            <div className="holyssum-main-grid">
              {sortedList.map((item) => {

                const genderShort = item.gender === '여자' ? '여' : item.gender === '남자' ? '남' : '';
                return item.nickname !== '관리자' && (
                  <div
                    key={item.id}
                    className="holyssum-main-grid-item"
                    onClick={() => handleProfileClick(item)}
                  >
                    {genderShort && <span className="holyssum-main-grid-gender">{genderShort}</span>}
                    {item.nickname || '(닉네임 없음)'}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="holyssum-main-review-section">
        {(!myProfileId || !hasReview) && (
          <button
            type="button"
            className="holyssum-main-btn holyssum-main-review-btn"
            onClick={() => { window.scrollTo(0, 0); navigate('/holyssum/review'); }}
          >
            후기작성
          </button>
        )}
        {myProfileId && (
          <button
            type="button"
            className="holyssum-main-btn holyssum-main-review-btn"
            onClick={() => { window.scrollTo(0, 0); navigate('/holyssum/review/edit'); }}
          >
            후기수정
          </button>
        )}
        {myNickname === '관리자' && (
          <button
            type="button"
            className="holyssum-main-btn holyssum-main-review-btn"
            onClick={() => { window.scrollTo(0, 0); navigate('/holyssum/review/list'); }}
          >
            후기리스트
          </button>
        )}
      </section>
    </div>
  );
}
