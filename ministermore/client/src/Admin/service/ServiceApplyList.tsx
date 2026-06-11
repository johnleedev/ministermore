import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import MainURL from '../../MainURL';
import { serviceFieldLabelKo } from './serviceAdminFieldLabels';
import './ServiceApplyList.scss';

type ServiceApplyRow = {
  id: number;
  paymentKind?: 'billing' | 'oneTime';
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

const FILTER_TABS: { value: string; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'bookletNotice', label: '모바일소개전단지' },
  { value: 'bookletEvent', label: '모바일행사전단지' },
  { value: 'bookletRetreat', label: '수련회전단지' },
  { value: 'homeinapp', label: '홈인앱' },
  { value: 'churchapp', label: '교회앱' },
];

/** 모달 본문 그리드에 넣을 필드 (memo는 별도 블록) */
const DETAIL_GRID_KEYS: (keyof ServiceApplyRow)[] = [
  'id',
  'serviceType',
  'orderName',
  'userAccount',
  'churchName',
  'ordererName',
  'ordererPhone',
  'amount',
  'vat',
  'totalAmount',
  'paymentStatus',
  'status',
  'paymentId',
  'billingKey',
  'createdAt',
];

function applyStatusPillClass(status: string | null | undefined): string {
  if (!status) return 'service-detail-overview__apply-pill';
  if (status === '등록') {
    return 'service-detail-overview__apply-pill service-detail-overview__apply-pill--registered';
  }
  if (status === '수정됨') {
    return 'service-detail-overview__apply-pill service-detail-overview__apply-pill--modified';
  }
  if (status === '삭제됨') {
    return 'service-detail-overview__apply-pill service-detail-overview__apply-pill--deleted';
  }
  return 'service-detail-overview__apply-pill';
}

function toWon(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '-';
  return `${Number(value).toLocaleString('ko-KR')}원`;
}

function splitCreatedAt(createdAt: string): { date: string; time: string } {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return { date: createdAt || '-', time: '' };
  return {
    date: d.toLocaleDateString('ko-KR'),
    time: d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  };
}

function formatDetailValue(key: keyof ServiceApplyRow, row: ServiceApplyRow): string {
  const v = row[key];
  if (key === 'amount' || key === 'vat' || key === 'totalAmount') {
    return toWon(v as number | null);
  }
  if (v == null || v === '') return '-';
  return String(v);
}

export default function ServiceApplyList() {
  const [rows, setRows] = useState<ServiceApplyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceType, setServiceType] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [detailRow, setDetailRow] = useState<ServiceApplyRow | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setRows([]);
    try {
      const res = await axios.get<{ ok: boolean; rows?: ServiceApplyRow[] }>(`${MainURL}/serviceapply/list`, {
        params: {
          limit: 200,
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
  }, [serviceType]);

  const handleDelete = async (row: ServiceApplyRow) => {
    const label = row.orderName || row.churchName || `#${row.id}`;
    if (!window.confirm(`이 행을 영구 삭제하시겠습니까?\n(${label})`)) return;
    setDeletingId(row.id);
    try {
      const res = await axios.post<{ ok: boolean; message?: string }>(`${MainURL}/serviceapply/delete`, {
        id: row.id,
        paymentKind: row.paymentKind || 'oneTime',
      });
      if (!res.data?.ok) {
        alert(res.data?.message || '삭제에 실패했습니다.');
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setDetailRow((cur) => (cur?.id === row.id ? null : cur));
    } catch (err) {
      console.error('failed to delete service apply row:', err);
      alert('삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (!detailRow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailRow(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailRow]);

  const emptyMessage = useMemo(() => '표시할 내역이 없습니다.', []);

  return (
    <div className="service-detail-overview service-detail-overview--apply-list">
      <p className="service-detail-overview__hint">
        서비스 결제·신청(oneTimePayment / billingPayment) 내역입니다. 행을 클릭하면 금액·결제 정보·메모·삭제 등 상세를 모달에서 확인할 수
        있습니다. (최대 200건)
      </p>

      <div className="service-detail-overview__tabs" role="tablist" aria-label="서비스 구분">
        {FILTER_TABS.map(({ value, label }) => (
          <button
            key={value || 'all'}
            type="button"
            role="tab"
            aria-selected={serviceType === value}
            className={`service-detail-overview__tab${serviceType === value ? ' is-active' : ''}`}
            onClick={() => {
              setServiceType(value);
              setDetailRow(null);
              window.scrollTo(0, 0);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="service-detail-overview__toolbar service-detail-overview__toolbar--apply">
        <button type="button" onClick={() => void fetchRows()} disabled={loading}>
          {loading ? '불러오는 중...' : '새로고침'}
        </button>
      </div>

      {!loading && rows.length === 0 ? (
        <div className="service-detail-overview__empty">{emptyMessage}</div>
      ) : loading && rows.length === 0 ? (
        <div className="service-detail-overview__empty">불러오는 중...</div>
      ) : (
        <div className="service-detail-overview__scroll">
          <div className="service-detail-overview__table-x">
            <table className="service-detail-overview__table">
              <thead>
                <tr>
                  <th scope="col">{serviceFieldLabelKo('id')}</th>
                  <th scope="col">신청일</th>
                  <th scope="col">{serviceFieldLabelKo('serviceType')}</th>
                  <th scope="col">{serviceFieldLabelKo('orderName')}</th>
                  <th scope="col">{serviceFieldLabelKo('userAccount')}</th>
                  <th scope="col">{serviceFieldLabelKo('churchName')}</th>
                  <th scope="col">{serviceFieldLabelKo('ordererName')}</th>
                  <th scope="col">{serviceFieldLabelKo('ordererPhone')}</th>
                  <th scope="col">{serviceFieldLabelKo('status')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="service-detail-overview__table-row"
                    role="button"
                    tabIndex={0}
                    aria-label="항목 상세 보기"
                    onClick={() => setDetailRow(row)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDetailRow(row);
                      }
                    }}
                  >
                    <td>{row.id}</td>
                    <td>
                      {(() => {
                        const { date, time } = splitCreatedAt(row.createdAt);
                        return (
                          <span className="service-detail-overview__created-stack">
                            <span className="service-detail-overview__created-stack-date">{date}</span>
                            {time ? (
                              <span className="service-detail-overview__created-stack-time">{time}</span>
                            ) : null}
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
                      {row.status ? (
                        <span className={applyStatusPillClass(row.status)}>{row.status}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detailRow ? (
        <div
          className="service-detail-overview__modal-backdrop"
          role="presentation"
          onClick={() => setDetailRow(null)}
        >
          <div
            className="service-detail-overview__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-apply-list-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="service-detail-overview__modal-head">
              <h2 id="service-apply-list-modal-title" className="service-detail-overview__modal-title">
                신청 상세
              </h2>
              <button
                type="button"
                className="service-detail-overview__modal-close"
                onClick={() => setDetailRow(null)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <div className="service-detail-overview__modal-actions">
              <button
                type="button"
                className="service-detail-overview__delete-in-table"
                disabled={deletingId === detailRow.id}
                onClick={() => void handleDelete(detailRow)}
              >
                {deletingId === detailRow.id ? '삭제 중...' : '이 신청 삭제'}
              </button>
            </div>
            <div className="service-detail-overview__modal-body">
              <div className="service-detail-overview__card-grid service-detail-overview__card-grid--modal">
                {DETAIL_GRID_KEYS.map((key) => (
                  <div className="service-detail-overview__field" key={key}>
                    <span className="service-detail-overview__field-label">{serviceFieldLabelKo(key)}</span>
                    <span className="service-detail-overview__field-value">
                      {formatDetailValue(key, detailRow)}
                    </span>
                  </div>
                ))}
                <div className="service-detail-overview__field service-detail-overview__field--memo-block">
                  <span className="service-detail-overview__field-label">{serviceFieldLabelKo('memo')}</span>
                  <span className="service-detail-overview__field-value service-detail-overview__field-value--multiline">
                    {detailRow.memo != null && String(detailRow.memo).trim() !== ''
                      ? String(detailRow.memo)
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
