import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRecoilState } from 'recoil';
import { recoilUserData } from '../../../RecoilStore';
import ServiceAPIURL from '../../../ServiceAPIURL';
import MainSiteURL from '../../../MainSiteURL';
import Loading from '../../../components/Loading';
import type { ServiceApplyRow } from '../serviceManageTypes';
import '../ServiceList.scss';

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

function paymentStatusLabel(status: string | undefined): string {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'paid') return '결제완료';
  if (s === 'pending') return '결제대기';
  if (s === 'failed') return '결제실패';
  return status || '-';
}

export default function ChurchappList() {
  const [userData] = useRecoilState(recoilUserData);
  const [rows, setRows] = useState<ServiceApplyRow[]>([]);
  const [loading, setLoading] = useState(false);

  const createUrl = `${MainSiteURL.replace(/\/$/, '')}/service/churchapp`;

  useEffect(() => {
    const account = String(userData?.userAccount || '').trim();
    if (!account) {
      setRows([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    axios
      .get<{ ok?: boolean; rows?: ServiceApplyRow[] }>(
        `${ServiceAPIURL}/serviceapply/list`,
        { params: { serviceType: 'churchapp', limit: 200 } }
      )
      .then((res) => {
        if (cancelled) return;
        const all = res.data?.ok && Array.isArray(res.data.rows) ? res.data.rows : [];
        setRows(all.filter((row) => String(row.userAccount || '').trim() === account));
      })
      .catch((err) => {
        console.error('churchapp serviceapply list fetch fail:', err);
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userData?.userAccount]);

  const openCreate = () => {
    window.open(createUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="service-admin__list-page">
      <div className="service-admin__list-header">
        <h1 className="service-admin__list-title">교회 앱 관리</h1>
        <button type="button" className="service-admin__list-create-btn" onClick={openCreate}>
          교회 앱 신청하기
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
                  <span className="service-admin__category-tag">교회 앱</span>
                  <h3 className="service-admin__posting-name">
                    {item.churchName || item.orderName || '교회명 없음'}
                  </h3>
                  <span className="service-admin__posting-sub">
                    신청일: {formatCreatedAt(item.createdAt)}
                  </span>
                </div>
                <div className="service-admin__posting-actions">
                  <span className="service-admin__status-pill">
                    {paymentStatusLabel(item.paymentStatus)}
                  </span>
                </div>
              </div>
              <div className="service-admin__posting-info">
                <div className="service-admin__info-row">
                  <span className="service-admin__info-label">교회명:</span>
                  <span className="service-admin__info-value">{item.churchName || '-'}</span>
                </div>
                <div className="service-admin__info-row">
                  <span className="service-admin__info-label">신청자:</span>
                  <span className="service-admin__info-value">{item.ordererName || '-'}</span>
                </div>
                <div className="service-admin__info-row">
                  <span className="service-admin__info-label">연락처:</span>
                  <span className="service-admin__info-value">{item.ordererPhone || '-'}</span>
                </div>
                <div className="service-admin__info-row">
                  <span className="service-admin__info-label">상태:</span>
                  <span className="service-admin__info-value">{item.status || '-'}</span>
                </div>
                <div className="service-admin__info-row">
                  <span className="service-admin__info-label">결제금액:</span>
                  <span className="service-admin__info-value">
                    {item.totalAmount != null ? `${Number(item.totalAmount).toLocaleString()}원` : '-'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="service-admin__empty">
          <p>신청한 교회 앱이 없습니다.</p>
          <button type="button" className="service-admin__list-create-btn" onClick={openCreate}>
            교회 앱 신청하기
          </button>
        </div>
      )}
    </div>
  );
}
