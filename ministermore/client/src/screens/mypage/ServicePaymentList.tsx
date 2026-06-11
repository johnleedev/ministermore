import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import MainURL from '../../MainURL';
import CopyTextButton from '../../components/CopyTextButton';
import Loading from '../../components/Loading';

export type PaymentListItem = {
  id: number;
  paymentKind: 'billing' | 'oneTime';
  serviceType: string;
  userAccount: string | null;
  churchName: string | null;
  passwd: string | null;
  ownerpw: string | null;
  ordererName: string | null;
  ordererPhone: string | null;
  orderTitle: string | null;
  orderName: string | null;
  supplyAmount?: number | null;
  vatAmount?: number | null;
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

function paymentStatusLabel(status: string | null | undefined) {
  const s = String(status || '').trim().toUpperCase();
  if (s === 'PAID') return '결제완료';
  if (s === 'PENDING') return '결제대기';
  if (s === 'FAILED') return '결제실패';
  return status || '-';
}

type Props = {
  userAccount: string;
};

export default function ServicePaymentList({ userAccount }: Props) {
  const [rows, setRows] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    const account = userAccount.trim();
    if (!account) {
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${MainURL}/payment/my/list`, {
        params: { userAccount: account, limit: 100 },
      });
      if (res.data?.ok && Array.isArray(res.data.rows)) {
        setRows(res.data.rows);
      } else {
        setRows([]);
        setError(res.data?.message || '결제 목록을 불러오지 못했습니다.');
      }
    } catch (e) {
      setRows([]);
      setError('결제 목록을 불러오지 못했습니다.');
      console.error('결제 목록 조회 실패:', e);
    } finally {
      setLoading(false);
    }
  }, [userAccount]);

  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments]);

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
        <button type="button" className="service-manage__retry-btn" onClick={() => void fetchPayments()}>
          다시 시도
        </button>
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
    <div className="postingList service-payment-list">
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
              {item.supplyAmount != null ? (
                <div className="infoRow">
                  <span className="infoLabel">공급가액:</span>
                  <span className="infoValue">{formatAmount(item.supplyAmount)}</span>
                </div>
              ) : null}
              {item.vatAmount != null ? (
                <div className="infoRow">
                  <span className="infoLabel">부가세:</span>
                  <span className="infoValue">{formatAmount(item.vatAmount)}</span>
                </div>
              ) : null}
              <div className="infoRow">
                <span className="infoLabel">결제상태:</span>
                <span className="infoValue">{paymentStatusLabel(item.paymentStatus)}</span>
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
              {item.passwd ? (
                <div className="infoRow service-payment-list__copy-row">
                  <span className="infoLabel">비밀번호:</span>
                  <span className="infoValue service-payment-list__copy-value">
                    <span className="service-payment-list__mono">{item.passwd}</span>
                    <CopyTextButton text={item.passwd} />
                  </span>
                </div>
              ) : null}
              {item.ownerpw ? (
                <div className="infoRow service-payment-list__copy-row">
                  <span className="infoLabel">관리자 비밀번호:</span>
                  <span className="infoValue service-payment-list__copy-value">
                    <span className="service-payment-list__mono">{item.ownerpw}</span>
                    <CopyTextButton text={item.ownerpw} />
                  </span>
                </div>
              ) : null}
              {item.ownerpw ? (
                <p className="service-payment-list__ownerpw-warn">관리자 비번은 공유하지 마세요.</p>
              ) : null}
              {item.ordererName ? (
                <div className="infoRow">
                  <span className="infoLabel">주문자:</span>
                  <span className="infoValue">{item.ordererName}</span>
                </div>
              ) : null}
              {item.ordererPhone ? (
                <div className="infoRow">
                  <span className="infoLabel">연락처:</span>
                  <span className="infoValue">{item.ordererPhone}</span>
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
