import { useEffect, useState } from 'react';
import axios from 'axios';
import PaymentAPIURL from '../service/payment/paymentApi';
import Loading from '../../components/Loading';

export type PaymentListItem = {
  id: number;
  paymentKind: 'billing' | 'oneTime';
  serviceType: string;
  userAccount: string | null;
  churchName: string | null;
  ordererName: string | null;
  ordererPhone: string | null;
  orderTitle: string | null;
  orderName: string | null;
  totalAmount: number | null;
  portonePaymentId: string | null;
  portoneTxId?: string | null;
  plan: string | null;
  paymentStatus: string | null;
  resourceType: string | null;
  resourceId: string | null;
  createdAt: string;
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  bookletNotice: '모바일교회전단지',
  bookletEvent: '모바일행사전단지',
  bookletRetreat: '수련회 전단지',
  homeinapp: '홈인앱',
  churchapp: '교회앱',
};

const PAYMENT_KIND_LABELS: Record<string, string> = {
  billing: '정기결제',
  oneTime: '단편결제',
};

function formatAmount(amount: number | null | undefined) {
  if (amount == null || Number.isNaN(Number(amount))) return '-';
  return `${Number(amount).toLocaleString('ko-KR')}원`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function serviceLabel(serviceType: string) {
  return SERVICE_TYPE_LABELS[serviceType] || serviceType || '서비스';
}

function paymentKindLabel(kind: string) {
  return PAYMENT_KIND_LABELS[kind] || kind || '-';
}

type Props = {
  userAccount: string | undefined;
};

export default function ServicePaymentList({ userAccount }: Props) {
  const [rows, setRows] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userAccount) {
      setRows([]);
      return;
    }

    let cancelled = false;
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${PaymentAPIURL}/payment/my/list`, {
          params: { userAccount },
        });
        if (cancelled) return;
        if (res.data?.ok && Array.isArray(res.data.rows)) {
          setRows(res.data.rows);
        } else {
          setRows([]);
          setError(res.data?.message || '결제 목록을 불러오지 못했습니다.');
        }
      } catch (e) {
        if (cancelled) return;
        setRows([]);
        setError('결제 목록을 불러오지 못했습니다.');
        console.error('결제 목록 조회 실패:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPayments();
    return () => {
      cancelled = true;
    };
  }, [userAccount]);

  if (!userAccount) {
    return (
      <div className="noPosts">
        <p>로그인 후 결제 내역을 확인할 수 있습니다.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="noPosts">
        <p>{error}</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="noPosts">
        <p>결제한 서비스가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="postingList">
      {rows.map((item) => {
        const displayTitle =
          item.orderTitle?.trim() ||
          item.churchName?.trim() ||
          item.orderName?.trim() ||
          serviceLabel(item.serviceType);

        return (
          <div key={`${item.paymentKind}-${item.id}`} className="postingItem">
            <div className="postingHeader">
              <div className="postingTitle">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '5px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span className="categoryTag">{serviceLabel(item.serviceType)}</span>
                  <span className="categoryTag">{paymentKindLabel(item.paymentKind)}</span>
                  <h3 style={{ margin: 0 }}>{displayTitle}</h3>
                </div>
                <span className="postingDate">{formatDate(item.createdAt)}</span>
              </div>
            </div>
            <div className="postingInfo">
              <div className="infoRow">
                <span className="infoLabel">결제금액:</span>
                <span className="infoValue">{formatAmount(item.totalAmount)}</span>
              </div>
              <div className="infoRow">
                <span className="infoLabel">결제상태:</span>
                <span className="infoValue">{item.paymentStatus || '-'}</span>
              </div>
              {item.paymentKind === 'billing' && item.plan ? (
                <div className="infoRow">
                  <span className="infoLabel">플랜:</span>
                  <span className="infoValue">{item.plan}</span>
                </div>
              ) : null}
              {item.churchName ? (
                <div className="infoRow">
                  <span className="infoLabel">교회명:</span>
                  <span className="infoValue">{item.churchName}</span>
                </div>
              ) : null}
              {item.ordererName ? (
                <div className="infoRow">
                  <span className="infoLabel">주문자:</span>
                  <span className="infoValue">{item.ordererName}</span>
                </div>
              ) : null}
              {item.portonePaymentId ? (
                <div className="infoRow" style={{ gridColumn: '1 / -1' }}>
                  <span className="infoLabel">결제ID:</span>
                  <span className="infoValue" style={{ wordBreak: 'break-all' }}>
                    {item.portonePaymentId}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
