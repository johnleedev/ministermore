import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import MainURL from '../../MainURL';
import { serviceFieldLabelKo } from './serviceAdminFieldLabels';
import './ServiceDetailOverview.scss';

/** 목록 표에서만 숨김 (상세 모달에는 유지) */
function isListOnlyHiddenKey(key: string): boolean {
  const k = key.toLowerCase();
  if (k === 'created_at' || k === 'updated_at') return true;
  if (k === 'createdat' || k === 'updatedat') return true;
  return false;
}

/** 목록에서 숨기고 상세 모달에서만 표시 (Portone·정기결제 식별자 등) */
function isPortoneRelatedKey(key: string): boolean {
  const k = key.toLowerCase();
  if (k.includes('portone')) return true;
  if (k === 'billingkey' || k === 'billing_key') return true;
  if (k === 'schedulepaymentid' || k === 'schedule_payment_id') return true;
  return false;
}

export type ServiceDetailKind = 'homeinapp' | 'churchapp' | 'bookletNotice' | 'bookletEvent';

/** 모바일행사전단지(bookletEvent): DB에서 제거된 컬럼 등 UI에서 숨김 */
function isBookletEventHiddenKey(kind: ServiceDetailKind, key: string): boolean {
  if (kind !== 'bookletEvent') return false;
  const k = key.toLowerCase();
  return k === 'booklettype' || k === 'booklet_type';
}

const TABS: { kind: ServiceDetailKind; label: string }[] = [
  { kind: 'homeinapp', label: '홈인앱' },
  { kind: 'churchapp', label: '교회앱' },
  { kind: 'bookletNotice', label: '모바일소개전단지' },
  { kind: 'bookletEvent', label: '모바일행사전단지' },
];

function formatCell(value: unknown): string {
  if (value == null || value === '') return '-';
  if (typeof value === 'object') {
    if (value instanceof Date) return value.toISOString();
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function sortColumnKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    if (a === 'id') return -1;
    if (b === 'id') return 1;
    return a.localeCompare(b);
  });
}

function unionKeys(rows: Record<string, unknown>[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    Object.keys(r).forEach((k) => set.add(k));
  }
  return sortColumnKeys(Array.from(set));
}

/** 홈인앱 상세 모달 status 선택값 (DB는 progress, UI는 process 표기) */
type HomeinappStatusUISelection = 'applied' | 'process' | 'completed';

function homeinappStatusDraftFromRow(status: unknown): HomeinappStatusUISelection {
  const s = String(status ?? '').trim().toLowerCase();
  if (s === 'progress' || s === 'process') return 'process';
  if (s === 'completed') return 'completed';
  return 'applied';
}

/** 홈인앱 리스트: status 셀 pill 색상 구분 */
function homeinappListStatusPillKind(status: unknown): 'applied' | 'progress' | 'completed' | 'other' {
  const s = String(status ?? '').trim().toLowerCase();
  if (s === 'applied') return 'applied';
  if (s === 'progress' || s === 'process') return 'progress';
  if (s === 'completed') return 'completed';
  return 'other';
}

/** 홈인앱 리스트: status 셀에 표시할 한글 라벨 */
function homeinappListStatusDisplayLabel(status: unknown): string {
  const kind = homeinappListStatusPillKind(status);
  if (kind === 'applied') return '접수';
  if (kind === 'progress') return '진행';
  if (kind === 'completed') return '완료';
  const raw = String(status ?? '').trim();
  return raw || '-';
}

function normalizeColumnName(col: string): string {
  return col.toLowerCase().replace(/_/g, '');
}

function isFirebaseKeyPathColumn(col: string): boolean {
  return normalizeColumnName(col) === 'firebasekeypath';
}

function isHomeinappFirebaseKeyStorageColumn(col: string): boolean {
  const n = normalizeColumnName(col);
  return n === 'firebasekeypath' || n === 'firebasekey';
}

function isLinkUrlColumn(col: string): boolean {
  return normalizeColumnName(col) === 'linkurl';
}

function detailRowLinkUrlKey(row: Record<string, unknown> | null): string | null {
  if (!row) return null;
  for (const key of Object.keys(row)) {
    if (isLinkUrlColumn(key)) return key;
  }
  return null;
}

function homeinappFirebaseKeyDraftFromRow(row: Record<string, unknown>): string {
  for (const key of Object.keys(row)) {
    if (!isHomeinappFirebaseKeyStorageColumn(key)) continue;
    const v = String(row[key] ?? '').trim();
    if (!v) continue;
    const parts = v.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1] || v;
  }
  return '';
}

function listTableHeadClass(tab: ServiceDetailKind, col: string): string | undefined {
  const parts: string[] = [];
  if (tab === 'homeinapp' && normalizeColumnName(col) === 'status') {
    parts.push('service-detail-overview__th--status');
  }
  if (isFirebaseKeyPathColumn(col)) {
    parts.push('service-detail-overview__th--firebase-key-path');
  }
  return parts.length ? parts.join(' ') : undefined;
}

function listTableCellClass(tab: ServiceDetailKind, col: string): string | undefined {
  const parts: string[] = [];
  if (tab === 'homeinapp' && normalizeColumnName(col) === 'status') {
    parts.push('service-detail-overview__td--status');
  }
  if (isFirebaseKeyPathColumn(col)) {
    parts.push('service-detail-overview__td--firebase-key-path');
  }
  return parts.length ? parts.join(' ') : undefined;
}

export default function ServiceDetailOverview() {
  const [tab, setTab] = useState<ServiceDetailKind>('homeinapp');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailRow, setDetailRow] = useState<Record<string, unknown> | null>(null);
  const [homeinappStatusDraft, setHomeinappStatusDraft] = useState<HomeinappStatusUISelection>('applied');
  const [homeinappStatusSaving, setHomeinappStatusSaving] = useState(false);
  const [homeinappFirebaseKeyDraft, setHomeinappFirebaseKeyDraft] = useState('');
  const [homeinappFirebaseKeySaving, setHomeinappFirebaseKeySaving] = useState(false);

  const fetchRows = useCallback(async (kind: ServiceDetailKind) => {
    setDetailRow(null);
    setRows([]);
    setLoading(true);
    try {
      const res = await axios.get<{ ok?: boolean; rows?: Record<string, unknown>[] }>(
        `${MainURL}/serviceapply/admin/service-detail`,
        { params: { kind, limit: 400 } },
      );
      setRows(Array.isArray(res.data?.rows) ? res.data.rows! : []);
    } catch (err) {
      console.error('service detail fetch failed:', err);
      alert('데이터를 불러오지 못했습니다.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows(tab);
  }, [tab, fetchRows]);

  useEffect(() => {
    setDetailRow(null);
  }, [tab]);

  const listColumns = useMemo(() => {
    if (!rows.length) return [] as string[];
    return unionKeys(rows).filter(
      (k) =>
        !isPortoneRelatedKey(k) &&
        !isListOnlyHiddenKey(k) &&
        !isBookletEventHiddenKey(tab, k),
    );
  }, [rows, tab]);

  /** 홈인앱: status 열을 맨 왼쪽으로 */
  const listColumnsForTable = useMemo(() => {
    if (tab !== 'homeinapp') return listColumns;
    const statusKey = listColumns.find((c) => c.toLowerCase() === 'status');
    if (!statusKey) return listColumns;
    const rest = listColumns.filter((c) => c !== statusKey);
    return [statusKey, ...rest];
  }, [listColumns, tab]);

  const detailModalKeys = useMemo(() => {
    if (!detailRow) return [] as string[];
    return sortColumnKeys(Object.keys(detailRow)).filter((k) => !isBookletEventHiddenKey(tab, k));
  }, [detailRow, tab]);

  /** 홈인앱: 상단에 id·status를 두고 그리드에서는 중복 표시하지 않음 */
  const detailModalKeysForGrid = useMemo(() => {
    const withoutLink = detailModalKeys.filter((k) => !isLinkUrlColumn(k));
    if (tab !== 'homeinapp') return withoutLink;
    return withoutLink.filter((k) => {
      const n = normalizeColumnName(k);
      return n !== 'status' && n !== 'id' && !isHomeinappFirebaseKeyStorageColumn(k);
    });
  }, [detailModalKeys, tab]);

  const detailLinkUrlKey = useMemo(
    () => (detailRow ? detailRowLinkUrlKey(detailRow) : null),
    [detailRow],
  );

  const copyDetailRowId = useCallback(async () => {
    if (!detailRow) return;
    const idVal = detailRow.id;
    if (idVal == null || idVal === '') {
      alert('복사할 ID가 없습니다.');
      return;
    }
    const text = String(idVal);
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      alert('ID가 클립보드에 복사되었습니다.');
    } catch {
      alert('클립보드 복사에 실패했습니다.');
    }
  }, [detailRow]);

  const copyDetailRowLinkUrl = useCallback(async () => {
    if (!detailRow) return;
    const linkKey = detailRowLinkUrlKey(detailRow);
    const text = linkKey ? String(detailRow[linkKey] ?? '').trim() : '';
    if (!text) {
      alert('복사할 링크가 없습니다.');
      return;
    }
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      alert('링크가 클립보드에 복사되었습니다.');
    } catch {
      alert('클립보드 복사에 실패했습니다.');
    }
  }, [detailRow]);

  useEffect(() => {
    if (!detailRow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailRow(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailRow]);

  useEffect(() => {
    if (!detailRow || tab !== 'homeinapp') return;
    setHomeinappStatusDraft(homeinappStatusDraftFromRow(detailRow.status));
    setHomeinappFirebaseKeyDraft(homeinappFirebaseKeyDraftFromRow(detailRow));
  }, [detailRow, tab]);

  const saveHomeinappStatus = useCallback(async () => {
    if (!detailRow || tab !== 'homeinapp') return;
    const id = detailRow.id;
    if (id == null || id === '') {
      alert('레코드 ID가 없어 저장할 수 없습니다.');
      return;
    }
    setHomeinappStatusSaving(true);
    try {
      const res = await axios.post<{
        success?: boolean;
        message?: string;
        data?: Record<string, unknown>;
      }>(`${MainURL}/homeinappmain/admin/church-status`, {
        id,
        status: homeinappStatusDraft,
      });
      if (!res.data?.success) {
        alert(res.data?.message || '상태 저장에 실패했습니다.');
        return;
      }
      const data = res.data.data;
      if (data) {
        setDetailRow(data);
        setRows((prev) =>
          prev.map((r) => (String(r.id) === String(id) ? { ...r, ...data } : r)),
        );
      }
      alert('저장되었습니다');
    } catch (err) {
      console.error('homeinapp status save failed:', err);
      alert('상태 저장 요청 중 오류가 발생했습니다.');
    } finally {
      setHomeinappStatusSaving(false);
    }
  }, [detailRow, tab, homeinappStatusDraft]);

  const saveHomeinappFirebaseKey = useCallback(async () => {
    if (!detailRow || tab !== 'homeinapp') return;
    const id = detailRow.id;
    if (id == null || id === '') {
      alert('레코드 ID가 없어 저장할 수 없습니다.');
      return;
    }
    setHomeinappFirebaseKeySaving(true);
    try {
      const res = await axios.post<{
        success?: boolean;
        message?: string;
        data?: Record<string, unknown>;
      }>(`${MainURL}/homeinappmain/admin/church-firebase-key`, {
        id,
        firebaseKeyPath: homeinappFirebaseKeyDraft.trim(),
      });
      if (!res.data?.success) {
        alert(res.data?.message || 'firebase 키 저장에 실패했습니다.');
        return;
      }
      const data = res.data.data;
      if (data) {
        setDetailRow(data);
        setRows((prev) =>
          prev.map((r) => (String(r.id) === String(id) ? { ...r, ...data } : r)),
        );
        setHomeinappFirebaseKeyDraft(homeinappFirebaseKeyDraftFromRow(data));
      }
    } catch (err) {
      console.error('homeinapp firebase key save failed:', err);
      alert('firebase 키 저장 요청 중 오류가 발생했습니다.');
    } finally {
      setHomeinappFirebaseKeySaving(false);
    }
  }, [detailRow, tab, homeinappFirebaseKeyDraft]);

  const emptyMessage = useMemo(() => {
    if (tab === 'churchapp') return '교회앱 데이터 연동은 준비 중입니다.';
    return '표시할 데이터가 없습니다.';
  }, [tab]);

  return (
    <div className="service-detail-overview">
      <p className="service-detail-overview__hint">
        탭별로 연결된 DB 테이블의 최신 데이터를 조회합니다. (최대 400건)
      </p>

      <div className="service-detail-overview__tabs" role="tablist" aria-label="서비스 구분">
        {TABS.map(({ kind, label }) => (
          <button
            key={kind}
            type="button"
            role="tab"
            aria-selected={tab === kind}
            className={`service-detail-overview__tab${tab === kind ? ' is-active' : ''}`}
            onClick={() => {
              setTab(kind);
              window.scrollTo(0, 0);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="service-detail-overview__toolbar">
        <button type="button" onClick={() => fetchRows(tab)} disabled={loading}>
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
            {listColumns.length === 0 ? (
              <table className="service-detail-overview__table">
                <thead>
                  <tr>
                    <th scope="col">상세</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={`${tab}-${idx}-${String(row.id ?? '')}`}
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
                      <td className="service-detail-overview__table-detail-only">
                        목록에서 숨긴 필드만 있습니다. 클릭하여 전체 보기
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table
                className={`service-detail-overview__table${
                  tab === 'homeinapp' ? ' service-detail-overview__table--homeinapp' : ''
                }`}
              >
                <thead>
                  <tr>
                    {listColumnsForTable.map((col) => (
                      <th key={col} scope="col" className={listTableHeadClass(tab, col)}>
                        {serviceFieldLabelKo(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={`${tab}-${idx}-${String(row.id ?? '')}`}
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
                      {listColumnsForTable.map((col) => (
                        <td key={col} className={listTableCellClass(tab, col)}>
                          {tab === 'homeinapp' && normalizeColumnName(col) === 'status' ? (
                            <span
                              className={`service-detail-overview__status-pill service-detail-overview__status-pill--${homeinappListStatusPillKind(
                                row[col],
                              )}`}
                            >
                              {homeinappListStatusDisplayLabel(row[col])}
                            </span>
                          ) : (
                            formatCell(row[col])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
            aria-labelledby="service-detail-overview-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="service-detail-overview__modal-head">
              <h2 id="service-detail-overview-modal-title" className="service-detail-overview__modal-title">
                상세 내역
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
            {detailLinkUrlKey ? (
              <div className="service-detail-overview__modal-link-row">
                <span className="service-detail-overview__field-label">
                  {serviceFieldLabelKo(detailLinkUrlKey)}
                </span>
                <code className="service-detail-overview__link-url-value">
                  {formatCell(detailRow[detailLinkUrlKey])}
                </code>
                <button
                  type="button"
                  className="service-detail-overview__link-url-copy-btn"
                  onClick={() => void copyDetailRowLinkUrl()}
                  disabled={!String(detailRow[detailLinkUrlKey] ?? '').trim()}
                  aria-label="링크 URL 클립보드에 복사"
                >
                  복사
                </button>
              </div>
            ) : null}
            {tab === 'homeinapp' && detailRow ? (
              <div className="service-detail-overview__modal-homeinapp-top">
                <div className="service-detail-overview__modal-homeinapp-line">
                  <span className="service-detail-overview__field-label">{serviceFieldLabelKo('id')}</span>
                  <code className="service-detail-overview__id-value">{formatCell(detailRow.id)}</code>
                  <button
                    type="button"
                    className="service-detail-overview__id-copy-btn"
                    onClick={() => void copyDetailRowId()}
                    disabled={detailRow.id == null || detailRow.id === ''}
                    aria-label="ID 클립보드에 복사"
                  >
                    복사
                  </button>
                  <span className="service-detail-overview__field-label">{serviceFieldLabelKo('status')}</span>
                  <select
                    id="service-detail-homeinapp-status"
                    className="service-detail-overview__status-select"
                    value={homeinappStatusDraft}
                    onChange={(e) =>
                      setHomeinappStatusDraft(e.target.value as HomeinappStatusUISelection)
                    }
                    disabled={homeinappStatusSaving}
                    aria-label="홈인앱 처리 상태"
                  >
                    <option value="applied">applied (접수)</option>
                    <option value="process">process (진행, DB: progress)</option>
                    <option value="completed">completed (완료)</option>
                  </select>
                  <button
                    type="button"
                    className="service-detail-overview__status-save"
                    disabled={
                      homeinappStatusSaving ||
                      homeinappStatusDraft === homeinappStatusDraftFromRow(detailRow.status)
                    }
                    onClick={() => void saveHomeinappStatus()}
                  >
                    {homeinappStatusSaving ? '저장 중…' : '상태 저장'}
                  </button>
                </div>
                <div className="service-detail-overview__modal-homeinapp-line service-detail-overview__modal-homeinapp-line--firebase">
                  <span className="service-detail-overview__field-label">
                    {serviceFieldLabelKo('firebaseKeyPath')}
                  </span>
                  <input
                    type="text"
                    className="service-detail-overview__firebase-key-input"
                    value={homeinappFirebaseKeyDraft}
                    onChange={(e) => setHomeinappFirebaseKeyDraft(e.target.value)}
                    disabled={homeinappFirebaseKeySaving}
                    placeholder="homeinappkeys 폴더의 JSON 파일명"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Firebase 서비스 계정 JSON 파일명"
                  />
                  <button
                    type="button"
                    className="service-detail-overview__firebase-key-save"
                    disabled={
                      homeinappFirebaseKeySaving ||
                      homeinappFirebaseKeyDraft.trim() === homeinappFirebaseKeyDraftFromRow(detailRow)
                    }
                    onClick={() => void saveHomeinappFirebaseKey()}
                  >
                    {homeinappFirebaseKeySaving ? '저장 중…' : '키 저장'}
                  </button>
                </div>
              </div>
            ) : null}
            <div className="service-detail-overview__modal-body">
              <div className="service-detail-overview__card-grid service-detail-overview__card-grid--modal">
                {detailModalKeysForGrid.map((col) => (
                  <div className="service-detail-overview__field" key={col}>
                    <span className="service-detail-overview__field-label">{serviceFieldLabelKo(col)}</span>
                    <span className="service-detail-overview__field-value">
                      {formatCell(detailRow[col])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
