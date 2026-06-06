import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import '../Mypage.scss';
import MypageMenu from '../MypageMenu';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRecoilState } from 'recoil';
import { recoilUserData } from '../../../RecoilStore';
import MainURL from '../../../MainURL';
import ServiceAPIURL from '../../../ServiceAPIURL';
import Loading from '../../../components/Loading';

export type HomeinappChurchListRow = {
  id: string;
  churchName?: string;
  representatives?: string;
  phoneNumber?: string;
  userAccount?: string;
  created_at?: string;
  /** churches.status — applied | progress | completed 등 */
  status?: string | null;
};

function normalizeChurchStatus(raw: string | null | undefined): string {
  return String(raw ?? '').trim().toLowerCase();
}

/** 목록·라벨용 한글 상태 */
function homeinappStatusLabel(status: string | null | undefined): string {
  const s = normalizeChurchStatus(status);
  if (s === 'applied') return '접수됨';
  if (s === 'progress') return '진행중';
  if (s === 'completed') return '완료';
  return s || '-';
}

/** `관리` 버튼과 비슷한 박스 높이로 상태만 표시 */
const STATUS_PILL_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '40px',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#555',
  border: '1px solid #d4d4d4',
  borderRadius: '4px',
  background: '#f5f5f5',
  boxSizing: 'border-box',
};

const STATUS_PILL_MUTED_STYLE: React.CSSProperties = {
  ...STATUS_PILL_STYLE,
  color: '#888',
  border: '1px solid #e5e5e5',
  background: '#fafafa',
};

function formatCreatedAt(raw: string | undefined): string {
  if (!raw) return '-';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HomeinappNotificationList() {
  const navigate = useNavigate();
  const [userData] = useRecoilState(recoilUserData);
  const [rows, setRows] = useState<HomeinappChurchListRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const account = String(userData?.userAccount || '').trim();
    if (!account) {
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    axios
      .get<{ success?: boolean; data?: HomeinappChurchListRow[] }>(
        `${ServiceAPIURL}/homeinappmain/getChurchesByUser/${encodeURIComponent(account)}`
      )
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.success && Array.isArray(res.data.data) ? res.data.data : [];
        setRows(list);
      })
      .catch((err) => {
        console.error('homeinapp churches list fetch fail:', err);
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userData?.userAccount]);

  const handleEdit = (churchId: string) => {
    const id = String(churchId || '').trim();
    if (!id) return;
    navigate(`/mypage/homeinapp-notification/${encodeURIComponent(id)}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="mypage">
      <div className="inner">
        <MypageMenu />
        <div className="subpage__main">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <div className="subpage__main__title">홈인앱알림</div>
            {/* <button
              type="button"
              onClick={handleGoService}
              style={{
                padding: '12px 24px',
                background: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              서비스관리
            </button> */}
          </div>
          <div className="subpage__main__content">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                <Loading />
              </div>
            ) : (
              <div className="main__content">
                {rows.length > 0 ? (
                  <div className="postingList">
                    {rows.map((item) => (
                      <div key={item.id} className="postingItem">
                        <div className="postingHeader">
                          <div className="postingTitle">
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '5px',
                              }}
                            >
                              <span className="categoryTag">홈인앱</span>
                              <h3 style={{ margin: 0 }}>{item.churchName || '교회명 없음'}</h3>
                            </div>
                            <span className="postingDate">교회 ID: {item.id}</span>
                          </div>
                          <div className="postingActions">
                            {normalizeChurchStatus(item.status) === 'completed' ? (
                              <button
                                type="button"
                                className="actionBtn editBtn"
                                onClick={() => handleEdit(item.id)}
                              >
                                일림관리
                              </button>
                            ) : normalizeChurchStatus(item.status) === 'applied' ? (
                              <span style={STATUS_PILL_STYLE} aria-label="처리 상태">
                                접수됨
                              </span>
                            ) : normalizeChurchStatus(item.status) === 'progress' ? (
                              <span style={STATUS_PILL_STYLE} aria-label="처리 상태">
                                진행중
                              </span>
                            ) : (
                              <span style={STATUS_PILL_MUTED_STYLE} aria-label="처리 상태">
                                {homeinappStatusLabel(item.status)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="postingInfo">
                          <div className="infoRow">
                            <span className="infoLabel">교회명:</span>
                            <span className="infoValue">{item.churchName || '-'}</span>
                          </div>
                          <div className="infoRow">
                            <span className="infoLabel">담당자:</span>
                            <span className="infoValue">{item.representatives || '-'}</span>
                          </div>
                          <div className="infoRow">
                            <span className="infoLabel">연락처:</span>
                            <span className="infoValue">{item.phoneNumber || '-'}</span>
                          </div>
                          <div className="infoRow">
                            <span className="infoLabel">등록일:</span>
                            <span className="infoValue">{formatCreatedAt(item.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="noPosts">
                    <p>등록된 홈인앱 교회가 없습니다.</p>
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/service/homeinapp');
                        window.scrollTo(0, 0);
                      }}
                      style={{
                        marginTop: '16px',
                        padding: '12px 24px',
                        background: '#333',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '16px',
                        cursor: 'pointer',
                      }}
                    >
                      홈인앱 신청하기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
