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
  createdAt: string;
};

function toWon(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return '-';
  return `${Number(value).toLocaleString('ko-KR')}원`;
}

export default function ServiceApplyList() {
  const [rows, setRows] = useState<ServiceApplyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceType, setServiceType] = useState('');

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
              <th>상품금액</th>
              <th>부가세</th>
              <th>총결제금액</th>
              <th>상태</th>
              <th>결제ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{new Date(row.createdAt).toLocaleString('ko-KR')}</td>
                <td>{row.serviceType || '-'}</td>
                <td>{row.orderName || '-'}</td>
                <td>{row.userAccount || '-'}</td>
                <td>{row.churchName || '-'}</td>
                <td>{row.ordererName || '-'}</td>
                <td>{row.ordererPhone || '-'}</td>
                <td>{toWon(row.amount)}</td>
                <td>{toWon(row.vat)}</td>
                <td>{toWon(row.totalAmount)}</td>
                <td>{row.paymentStatus || '-'}</td>
                <td>{row.paymentId || '-'}</td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={13} className="service-apply-admin__empty">
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
