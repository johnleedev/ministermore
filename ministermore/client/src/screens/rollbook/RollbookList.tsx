import React, { useEffect, useState } from 'react';
import './scss/RollbookList.scss';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import { useRecoilValue } from 'recoil';
import { recoilUserData } from '../../RecoilStore';
import {
  PiChurchBold,
  PiCross,
  PiMagnifyingGlass,
  PiFunnel,
  PiPlus,
  PiMapPin,
  PiUser,
} from 'react-icons/pi';



interface ListProps {
  id: number;
  churchName: string;
  location: string | null;
  religiousbody?: string;
  image?: string;
}

const ADMIN_ACCESS_PASSWORD = 'gksksla'; // 관리자 비밀번호 (변경 가능)

const CARD_COLORS = [
  { bg: 'bg-blue', icon: 'icon-blue', Icon: PiCross },
  { bg: 'bg-indigo', icon: 'icon-indigo', Icon: PiChurchBold },
  { bg: 'bg-green', icon: 'icon-green', Icon: PiChurchBold },
  { bg: 'bg-purple', icon: 'icon-purple', Icon: PiChurchBold },
  { bg: 'bg-yellow', icon: 'icon-yellow', Icon: PiChurchBold },
  { bg: 'bg-red', icon: 'icon-red', Icon: PiChurchBold },
  { bg: 'bg-teal', icon: 'icon-teal', Icon: PiChurchBold },
];

export default function RollbookList() {
  const navigate = useNavigate();
  const userData = useRecoilValue(recoilUserData);
  const [list, setList] = useState<ListProps[]>([]);
  const [deptCounts, setDeptCounts] = useState<Record<number, number>>({});
  const [searchWord, setSearchWord] = useState('');
  const [isChurchModalOpen, setIsChurchModalOpen] = useState(false);
  const [korName, setKorName] = useState('');
  const [engName, setEngName] = useState('');
  const [churchDesc, setChurchDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminPasswordModalOpen, setAdminPasswordModalOpen] = useState(false);
  const [selectedChurchForAccess, setSelectedChurchForAccess] = useState<{ id: number; churchName: string } | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  const displayList = list.map((item: any) => ({
    id: item.id,
    churchName: item.name || item.churchName || item.kor_name || '',
    location: item.address || item.location || item.description || '',
    religiousbody: item.religiousbody || '',
    image: item.image || '',
  }));

  const handleChurchClick = (item: { id: number; churchName: string }) => {
    setSelectedChurchForAccess(item);
    setAdminPasswordInput('');
    setAdminPasswordModalOpen(true);
  };

  const handleAdminPasswordConfirm = () => {
    if (!selectedChurchForAccess) return;
    if (adminPasswordInput !== ADMIN_ACCESS_PASSWORD) {
      alert('관리자 비밀번호가 올바르지 않습니다.');
      return;
    }
    setAdminPasswordModalOpen(false);
    setSelectedChurchForAccess(null);
    setAdminPasswordInput('');
    window.scrollTo(0, 0);
    navigate(`/rollbook/churhmain?id=${selectedChurchForAccess.id}&churchName=${encodeURIComponent(selectedChurchForAccess.churchName)}`);
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${MainURL}/rollbookchurch/getchurchlist`, { withCredentials: false });
      console.log(res);
      const raw = res?.data;
      const data = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setList(data);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setList([]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (list.length === 0) return;
    const fetchDeptCounts = async () => {
      const counts: Record<number, number> = {};
      await Promise.all(
        list.map(async (item: { id: number }) => {
          try {
            const res = await axios.post(`${MainURL}/rollbookdepart/getdepartments`, { church_id: item.id }, { withCredentials: false });
            counts[item.id] = res.data?.success && res.data?.data ? res.data.data.length : 0;
          } catch {
            counts[item.id] = 0;
          }
        })
      );
      setDeptCounts(counts);
    };
    fetchDeptCounts();
  }, [list]);

  const handleWordSearching = async () => {
    if (searchWord.length < 2) {
      alert('2글자 이상 입력해주세요');
      return;
    }
    try {
      const res = await axios.post(`${MainURL}/rollbookchurch/getdatabookletsearch`, { word: searchWord }, { withCredentials: false });
      if (res.data && res.data.data) {
        setList(res.data.data);
      } else {
        setList([]);
      }
    } catch (error) {
      console.error('검색 실패:', error);
      setList([]);
    }
  };

  const handleAddChurch = async () => {
    if (!userData?.userAccount) {
      alert('교회 등록은 로그인이 필요합니다.');
      return;
    }
    if (isSubmitting) return;
    if (!korName.trim()) {
      alert('교회 한글명을 입력해주세요.');
      return;
    }
    if (!engName.trim()) {
      alert('교회 영문명을 입력해주세요. (테이블 생성용)');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${MainURL}/rollbookchurch/addchurch`, {
        kor_name: korName.trim(),
        eng_name: engName.trim().replace(/\s+/g, ''),
        description: churchDesc.trim() || null,
      });
      if (res.data?.success) {
        alert(res.data.message);
        setKorName('');
        setEngName('');
        setChurchDesc('');
        setIsChurchModalOpen(false);
        fetchPosts();
      } else {
        alert(res.data?.error || '교회 등록에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('교회 등록 실패:', error);
      alert(error.response?.data?.error || '교회 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="RollbookListPage">
      <div className="slide-container">
        <header className="rb-header">
          <div className="rb-header-left">
            <div className="rb-logo"><PiChurchBold size={18} /></div>
            <p className="rb-header-title">주일학교 출석부</p>
            <div className="rb-header-divider" />
            <p className="rb-header-sub">관리자 대시보드</p>
          </div>
        </header>

        <main className="rb-main">
          <div className="action-bar">
            <div className="title-section">
              <h1>등록된 교회 목록</h1>
              <p>총 {displayList.length}개의 교회가 등록되어 있으며, 현재 활성 상태입니다.</p>
            </div>
            <div className="action-btns">
              <div className="search-box">
                <PiMagnifyingGlass size={18} style={{ color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="교회명 또는 지역 검색..."
                  value={searchWord}
                  onChange={(e) => setSearchWord(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleWordSearching(); }}
                />
              </div>
              <button type="button" className="filter-btn">
                <PiFunnel size={16} /> 필터
              </button>
              <button type="button" className="add-btn" onClick={() => setIsChurchModalOpen(true)}>
                <PiPlus size={16} /> 교회 추가
              </button>
            </div>
          </div>

          <div className="filter-tags">
            <span className="filter-tag active">지역: 전체 ×</span>
            <span className="filter-tag">교단: 대한예수교장로회</span>
            <span className="filter-tag">상태: 활성</span>
          </div>

          <div className="church-grid">
            {displayList.map((item: any, index: number) => {
              const colorSet = CARD_COLORS[index % CARD_COLORS.length];
              const CardIcon = colorSet.Icon;
              const deptCount = deptCounts[item.id] ?? 0;

              return (
                <div
                  key={item.id || index}
                  className="church-card"
                  onClick={() => handleChurchClick(item)}
                >
                  <div className={`card-header ${colorSet.bg}`} />
                  {/* <div className={`card-icon ${colorSet.icon}`}>
                    <CardIcon size={24} />
                  </div> */}
                  <div className="card-body">
                    <div className="card-title-row">
                      <h3>{item.churchName}</h3>
                      <span className="status-badge active">운영중</span>
                    </div>
                    <div className="card-location">
                      <PiMapPin size={14} style={{ flexShrink: 0 }} />
                      {item.location || '주소 없음'}
                    </div>
                    <div className="card-stats">
                      <div className="stat-item">
                        <p className="stat-label">등록 부서</p>
                        <p className="stat-value">{deptCount}개</p>
                      </div>
                      <div className="stat-item">
                        <p className="stat-label">전체 학생</p>
                        <p className="stat-value">-명</p>
                      </div>
                    </div>
                    <div className="card-contact">
                      <div className="contact-avatar">
                        <PiUser size={12} />
                      </div>
                      <span>담당: 확인 필요</span>
                    </div>
                    <button
                      type="button"
                      className="card-btn btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChurchClick(item);
                      }}
                    >
                      관리 페이지 이동
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="add-church-card" onClick={() => setIsChurchModalOpen(true)}>
              <div className="add-icon">
                <PiPlus size={28} />
              </div>
              <h3 className="add-title">새로운 교회 등록</h3>
              <p className="add-desc">새로운 교회를 추가하고<br />출석 관리를 시작하세요</p>
            </div>
          </div>
        </main>
      </div>

      {adminPasswordModalOpen && selectedChurchForAccess && (
        <div className="rb-modal-overlay" onClick={() => setAdminPasswordModalOpen(false)}>
          <div className="rb-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '2px solid #e5e7eb', paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>관리자 비밀번호</h2>
              <button type="button" onClick={() => setAdminPasswordModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280' }}>{selectedChurchForAccess.churchName} 관리 페이지로 이동합니다.</p>
            <div className="rb-form-group">
              <label>비밀번호</label>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="관리자 비밀번호 입력"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdminPasswordConfirm(); }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setAdminPasswordModalOpen(false)} style={{ padding: '10px 20px', background: '#9ca3af', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>취소</button>
              <button type="button" onClick={handleAdminPasswordConfirm} style={{ padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>확인</button>
            </div>
          </div>
        </div>
      )}

      {isChurchModalOpen && (
        <div className="rb-modal-overlay" onClick={() => !isSubmitting && setIsChurchModalOpen(false)}>
          <div className="rb-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '2px solid #e5e7eb', paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>교회 등록</h2>
              <button type="button" onClick={() => !isSubmitting && setIsChurchModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            <div className="rb-form-group">
              <label>교회 한글명 *</label>
              <input type="text" value={korName} onChange={(e) => setKorName(e.target.value)} placeholder="예: 그린교회" />
            </div>
            <div className="rb-form-group">
              <label>교회 영문명 * (테이블용, 공백 없이)</label>
              <input type="text" value={engName} onChange={(e) => setEngName(e.target.value.replace(/\s+/g, ''))} placeholder="예: green" />
            </div>
            <div className="rb-form-group">
              <label>교회 소개 (선택)</label>
              <textarea value={churchDesc} onChange={(e) => setChurchDesc(e.target.value)} placeholder="교회 소개글" rows={4} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => !isSubmitting && setIsChurchModalOpen(false)} style={{ padding: '10px 20px', background: '#9ca3af', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>취소</button>
              <button type="button" onClick={handleAddChurch} disabled={isSubmitting} style={{ padding: '10px 24px', background: isSubmitting ? '#9ca3af' : '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
                {isSubmitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
