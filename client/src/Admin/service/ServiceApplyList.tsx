import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import MainURL from '../../MainURL';
import './ServiceApplyList.scss';

type ServiceApplyRow = {
  id: number;
  serviceType: string;
  orderName: string | null;
  userAccount: string | null;
  churchName: string | null;
  ordererName: string | null;
  ordererPhone: string | null;
  amount: number | null;
  vat: number | null;
  totalAmount: number | null;
  paymentStatus: string | null;
  paymentId: string | null;
  billingKey: string | null;
  memo: string | null;
  /** 등록 / 수정됨 / 삭제됨 등 처리 상태 */
  status: string | null;
  createdAt: string;
};

function statusClass(status: string | null | undefined) {
  if (!status) return '';
  if (status === '등록') return 'service-apply-admin__status service-apply-admin__status--registered';
  if (status === '수정됨') return 'service-apply-admin__status service-apply-admin__status--modified';
  if (status === '삭제됨') return 'service-apply-admin__status service-apply-admin__status--deleted';
  return 'service-apply-admin__status';
}

function toWon(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return '-';
  return `${Number(value).toLocaleString('ko-KR')}원`;
}

/** `createdAt` 을 날짜·시간 두 줄로 분리해 표시용 텍스트 반환 (예: { date: '2026. 5. 12.', time: '오후 3:48' }) */
function splitCreatedAt(createdAt: string): { date: string; time: string } {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return { date: createdAt || '-', time: '' };
  return {
    date: d.toLocaleDateString('ko-KR'),
    time: d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function ServiceApplyList() {
  const [rows, setRows] = useState<ServiceApplyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceType, setServiceType] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await axios.get<{ ok: boolean; rows?: ServiceApplyRow[] }>(`${MainURL}/serviceapply/list`, {
        params: {
          limit: 300,
          serviceType: serviceType || undefined,
        },
      });
      setRows(Array.isArray(res.data?.rows) ? res.data.rows : []);
    } catch (err) {
      console.error('failed to load service apply list:', err);
      alert('결제 내역을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: ServiceApplyRow) => {
    const label = row.orderName || row.churchName || `#${row.id}`;
    if (!window.confirm(`이 행을 영구 삭제하시겠습니까?\n(${label})`)) return;
    setDeletingId(row.id);
    try {
      const res = await axios.post<{ ok: boolean; message?: string }>(`${MainURL}/serviceapply/delete`, {
        id: row.id,
      });
      if (!res.data?.ok) {
        alert(res.data?.message || '삭제에 실패했습니다.');
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      console.error('failed to delete service apply row:', err);
      alert('삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceType]);

  const title = useMemo(() => {
    if (!serviceType) return '전체 결제/신청 내역';
    return `${serviceType} 내역`;
  }, [serviceType]);

  return (
    <div className="service-apply-admin">
      <div className="service-apply-admin__head">
        <h2>{title}</h2>
        <div className="service-apply-admin__controls">
          <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
            <option value="">전체</option>
            <option value="bookletNotice">bookletNotice</option>
            <option value="bookletEvent">bookletEvent</option>
            <option value="homeinapp">homeinapp</option>
            <option value="churchapp">churchapp</option>
          </select>
          <button type="button" onClick={fetchRows} disabled={loading}>
            {loading ? '불러오는 중...' : '새로고침'}
          </button>
        </div>
      </div>

      <div className="service-apply-admin__table-wrap">
        <table className="service-apply-admin__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>신청일</th>
              <th>서비스</th>
              <th>주문명</th>
              <th>계정</th>
              <th>교회명</th>
              <th>이름</th>
              <th>연락처</th>
              <th>상품금액 / 부가세</th>
              <th>총결제금액</th>
              <th>결제상태</th>
              <th>처리상태</th>
              <th>결제ID</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>
                  {(() => {
                    const { date, time } = splitCreatedAt(row.createdAt);
                    return (
                      <span className="service-apply-admin__created-at">
                        <span className="service-apply-admin__created-at-date">{date}</span>
                        {time && (
                          <span className="service-apply-admin__created-at-time">{time}</span>
                        )}
                      </span>
                    );
                  })()}
                </td>
                <td>{row.serviceType || '-'}</td>
                <td>{row.orderName || '-'}</td>
                <td>{row.userAccount || '-'}</td>
                <td>{row.churchName || '-'}</td>
                <td>{row.ordererName || '-'}</td>
                <td>{row.ordererPhone || '-'}</td>
                <td>
                  <span className="service-apply-admin__amount-pair">
                    <span className="service-apply-admin__amount-pair-amount">{toWon(row.amount)}</span>
                    <span className="service-apply-admin__amount-pair-vat">
                      부가세 {toWon(row.vat)}
                    </span>
                  </span>
                </td>
                <td className="service-apply-admin__total-amount">{toWon(row.totalAmount)}</td>
                <td>{row.paymentStatus || '-'}</td>
                <td>
                  {row.status ? (
                    <span className={statusClass(row.status)}>{row.status}</span>
                  ) : (
                    '-'
                  )}
                </td>
                <td>{row.paymentId || '-'}</td>
                <td>
                  <button
                    type="button"
                    className="service-apply-admin__row-delete"
                    onClick={() => handleDelete(row)}
                    disabled={deletingId === row.id}
                  >
                    {deletingId === row.id ? '삭제 중...' : '삭제'}
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={14} className="service-apply-admin__empty">
                  내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
