import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRecoilState } from 'recoil';
import { recoilUserData } from '../../../RecoilStore';
import ServiceAPIURL from '../../../ServiceAPIURL';
import MainSiteURL from '../../../MainSiteURL';
import Loading from '../../../components/Loading';
import '../ServiceList.scss';

export type HomeinappChurchListRow = {
  id: string;
  churchName?: string;
  representatives?: string;
  phoneNumber?: string;
  userAccount?: string;
  created_at?: string;
  status?: string | null;
};

function normalizeChurchStatus(raw: string | null | undefined): string {
  return String(raw ?? '').trim().toLowerCase();
}

function homeinappStatusLabel(status: string | null | undefined): string {
  const s = normalizeChurchStatus(status);
  if (s === 'applied') return '접수됨';
  if (s === 'progress') return '진행중';
  if (s === 'completed') return '완료';
  return s || '-';
}

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
  borderRadius: '6px',
  background: '#f5f5f5',
  boxSizing: 'border-box',
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

export default function HomeinappList() {
  const navigate = useNavigate();
  const [userData] = useRecoilState(recoilUserData);
  const [rows, setRows] = useState<HomeinappChurchListRow[]>([]);
  const [loading, setLoading] = useState(false);

  const createUrl = `${MainSiteURL.replace(/\/$/, '')}/service/homeinapp`;

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
    navigate(`/service/homeinapp/${encodeURIComponent(id)}`);
    window.scrollTo(0, 0);
  };

  const openCreate = () => {
    window.open(createUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="service-admin__list-page">
      <div className="service-admin__list-header">
        <h1 className="service-admin__list-title">홈인앱(웹앱) 관리</h1>
        <button type="button" className="service-admin__list-create-btn" onClick={openCreate}>
          홈인앱 신청하기
        </button>
      </div>

      {loading ? (
        <div className="service-admin__loading">
          <Loading />
        </div>
      ) : rows.length > 0 ? (
        <div className="service-admin__posting-list">
          {rows.map((item) => (
            <div key={item.id} className="service-admin__posting-item">
              <div className="service-admin__posting-header">
                <div className="service-admin__posting-title">
                  <span className="service-admin__category-tag">홈인앱</span>
                  <h3 className="service-admin__posting-name">{item.churchName || '교회명 없음'}</h3>
                  <span className="service-admin__posting-sub">교회 ID: {item.id}</span>
                </div>
                <div className="service-admin__posting-actions">
                  {normalizeChurchStatus(item.status) === 'completed' ? (
                    <button
                      type="button"
                      className="service-admin__action-btn"
                      onClick={() => handleEdit(item.id)}
                    >
                      알림관리
                    </button>
                  ) : (
                    <span style={STATUS_PILL_STYLE} aria-label="처리 상태">
                      {homeinappStatusLabel(item.status)}
                    </span>
                  )}
                </div>
              </div>
              <div className="service-admin__posting-info">
                <div className="service-admin__info-row">
                  <span className="service-admin__info-label">교회명:</span>
                  <span className="service-admin__info-value">{item.churchName || '-'}</span>
                </div>
                <div className="service-admin__info-row">
                  <span className="service-admin__info-label">담당자:</span>
                  <span className="service-admin__info-value">{item.representatives || '-'}</span>
                </div>
                <div className="service-admin__info-row">
                  <span className="service-admin__info-label">연락처:</span>
                  <span className="service-admin__info-value">{item.phoneNumber || '-'}</span>
                </div>
                <div className="service-admin__info-row">
                  <span className="service-admin__info-label">등록일:</span>
                  <span className="service-admin__info-value">{formatCreatedAt(item.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="service-admin__empty">
          <p>등록된 홈인앱 교회가 없습니다.</p>
          <button type="button" className="service-admin__list-create-btn" onClick={openCreate}>
            홈인앱 신청하기
          </button>
        </div>
      )}
    </div>
  );
}
