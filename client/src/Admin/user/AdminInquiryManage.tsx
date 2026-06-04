import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import MainURL from '../../MainURL';
import './AdminInquiry.scss';

type InquiryRow = {
  id: number;
  userAccount: string | null;
  userNickName: string | null;
  contact?: string | null;
  phone?: string | null;
  category: string;
  content: string;
  platform: string;
  status: 'pending' | 'answered' | 'closed' | string;
  createdAt: string;
};

function getInquiryContact(row: Pick<InquiryRow, 'contact' | 'phone'>) {
  const value = String(row.contact ?? row.phone ?? '').trim();
  return value || null;
}

function formatInquiryContact(row: Pick<InquiryRow, 'contact' | 'phone'>) {
  const contact = getInquiryContact(row);
  return contact ? `연락처 ${contact}` : '연락처 없음';
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'pending', label: '접수' },
  { value: 'answered', label: '답변완료' },
  { value: 'closed', label: '종료' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: '접수' },
  { value: 'answered', label: '답변완료' },
  { value: 'closed', label: '종료' },
] as const;

const CATEGORY_TABS: { value: string; label: string }[] = [
  { value: '', label: '전체 종류' },
  { value: '오류 신고', label: '오류 신고' },
  { value: '기능 제안', label: '기능 제안' },
  { value: '이용 문의', label: '이용 문의' },
  { value: '광고·제휴', label: '광고·제휴' },
  { value: '기타', label: '기타' },
];

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ko-KR');
}

function statusPillClass(status: string) {
  const base = 'admin-inquiry-manage__status-pill';
  if (status === 'answered') return `${base} admin-inquiry-manage__status-pill--answered`;
  if (status === 'closed') return `${base} admin-inquiry-manage__status-pill--closed`;
  return `${base} admin-inquiry-manage__status-pill--pending`;
}

function statusLabel(status: string) {
  return STATUS_OPTIONS.find(item => item.value === status)?.label || status || '-';
}

function platformLabel(platform: string) {
  if (platform === 'app') return '앱';
  if (platform === 'web') return '웹';
  return platform || '-';
}

function previewText(text: string, max = 80) {
  const trimmed = String(text || '').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}...`;
}

export default function AdminInquiryManage() {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draftStatuses, setDraftStatuses] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<InquiryRow[]>(`${MainURL}/inquiry/list`, {
        params: {
          limit: 300,
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          q: searchQuery || undefined,
        },
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setRows(list);
      const drafts: Record<number, string> = {};
      list.forEach(row => {
        drafts[row.id] = row.status || 'pending';
      });
      setDraftStatuses(drafts);
      setSelectedId(prev => (prev && list.some(row => row.id === prev) ? prev : list[0]?.id ?? null));
    } catch (err) {
      console.error('failed to load inquiries:', err);
      alert('고객문의 목록을 불러오지 못했습니다.');
      setRows([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchQuery, statusFilter]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const selectedRow = useMemo(
    () => rows.find(row => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  const pendingCount = useMemo(
    () => rows.filter(row => row.status === 'pending').length,
    [rows],
  );

  const handleSaveStatus = async (row: InquiryRow) => {
    const nextStatus = draftStatuses[row.id];
    if (!nextStatus || nextStatus === row.status) {
      alert('변경할 처리 상태를 선택해 주세요.');
      return;
    }
    if (!window.confirm(`문의 #${row.id} 상태를 「${statusLabel(nextStatus)}」(으)로 변경하시겠습니까?`)) {
      return;
    }

    setSavingId(row.id);
    try {
      const res = await axios.post<{ success: boolean; message?: string }>(
        `${MainURL}/inquiry/updatestatus`,
        { id: row.id, status: nextStatus },
      );
      if (!res.data?.success) {
        alert(res.data?.message || '상태 변경에 실패했습니다.');
        return;
      }
      setRows(prev => prev.map(item => (item.id === row.id ? { ...item, status: nextStatus } : item)));
      alert('처리 상태가 변경되었습니다.');
    } catch (err) {
      console.error('failed to update inquiry status:', err);
      alert('상태 변경에 실패했습니다.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (row: InquiryRow) => {
    if (!window.confirm(`문의 #${row.id}을(를) 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) {
      return;
    }

    setDeletingId(row.id);
    try {
      const res = await axios.post<{ success: boolean; message?: string }>(
        `${MainURL}/inquiry/delete`,
        { id: row.id },
      );
      if (!res.data?.success) {
        alert(res.data?.message || '문의 삭제에 실패했습니다.');
        return;
      }
      setRows(prev => {
        const next = prev.filter(item => item.id !== row.id);
        setSelectedId(current => (current === row.id ? next[0]?.id ?? null : current));
        return next;
      });
      setDraftStatuses(prev => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      alert('문의가 삭제되었습니다.');
    } catch (err) {
      console.error('failed to delete inquiry:', err);
      alert('문의 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-inquiry-manage service-detail-overview service-detail-overview--apply-list">
      <p className="admin-inquiry-manage__hint">
        common DB <strong>userInquiry</strong> 테이블의 고객 문의 목록입니다. 최신 접수순으로 표시됩니다.
        {pendingCount > 0 ? ` (현재 목록 기준 미처리 ${pendingCount}건)` : ''}
      </p>

      <div className="service-detail-overview__tabs" role="tablist" aria-label="처리 상태 필터">
        {STATUS_TABS.map(({ value, label }) => (
          <button
            key={value || 'all-status'}
            type="button"
            role="tab"
            aria-selected={statusFilter === value}
            className={`service-detail-overview__tab${statusFilter === value ? ' is-active' : ''}`}
            onClick={() => {
              setStatusFilter(value);
              window.scrollTo(0, 0);
            }}>
            {label}
          </button>
        ))}
      </div>

      <div className="service-detail-overview__tabs admin-inquiry-manage__category-tabs" role="tablist" aria-label="문의 종류 필터">
        {CATEGORY_TABS.map(({ value, label }) => (
          <button
            key={value || 'all-category'}
            type="button"
            role="tab"
            aria-selected={categoryFilter === value}
            className={`service-detail-overview__tab${categoryFilter === value ? ' is-active' : ''}`}
            onClick={() => {
              setCategoryFilter(value);
              window.scrollTo(0, 0);
            }}>
            {label}
          </button>
        ))}
      </div>

      <div className="admin-inquiry-manage__toolbar service-detail-overview__toolbar">
        <input
          className="admin-inquiry-manage__search"
          type="search"
          placeholder="계정·닉네임·연락처·내용·종류 검색"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') setSearchQuery(searchInput.trim());
          }}
        />
        <button
          type="button"
          className="admin-inquiry-manage__toolbar-btn admin-inquiry-manage__toolbar-btn--primary"
          onClick={() => setSearchQuery(searchInput.trim())}
          disabled={loading}>
          검색
        </button>
        <button
          type="button"
          className="admin-inquiry-manage__toolbar-btn"
          onClick={() => void fetchRows()}
          disabled={loading}>
          {loading ? '불러오는 중...' : '새로고침'}
        </button>
        <span className="service-detail-overview__hint" style={{ margin: 0 }}>
          총 {rows.length.toLocaleString('ko-KR')}건
        </span>
      </div>

      {!loading && rows.length === 0 ? (
        <div className="service-detail-overview__empty">표시할 고객문의가 없습니다.</div>
      ) : loading && rows.length === 0 ? (
        <div className="service-detail-overview__empty">불러오는 중...</div>
      ) : (
        <>
          <div className="service-detail-overview__scroll">
            <div className="service-detail-overview__table-x">
              <table className="service-detail-overview__table">
                <thead>
                  <tr>
                    <th scope="col">번호</th>
                    <th scope="col">접수일</th>
                    <th scope="col">종류</th>
                    <th scope="col">계정</th>
                    <th scope="col">닉네임</th>
                    <th scope="col">연락처</th>
                    <th scope="col">경로</th>
                    <th scope="col">상태</th>
                    <th scope="col">내용</th>
                    <th scope="col">처리</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => {
                    const draft = draftStatuses[row.id] ?? row.status;
                    const isDirty = draft !== row.status;
                    const isSelected = selectedId === row.id;
                    return (
                      <tr
                        key={row.id}
                        className={isSelected ? 'admin-inquiry-manage__row--selected' : undefined}
                        onClick={() => setSelectedId(row.id)}>
                        <td>{row.id}</td>
                        <td>{formatDate(row.createdAt)}</td>
                        <td>{row.category}</td>
                        <td>{row.userAccount || '(비회원)'}</td>
                        <td>{row.userNickName || '-'}</td>
                        <td>{getInquiryContact(row) || '-'}</td>
                        <td>{platformLabel(row.platform)}</td>
                        <td>
                          <span className={statusPillClass(row.status)}>{statusLabel(row.status)}</span>
                        </td>
                        <td className="admin-inquiry-manage__content-cell">{previewText(row.content)}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="admin-inquiry-manage__action-cell">
                            <select
                              className="admin-inquiry-manage__status-select"
                              value={draft}
                              disabled={savingId === row.id || deletingId === row.id}
                              onChange={e =>
                                setDraftStatuses(prev => ({
                                  ...prev,
                                  [row.id]: e.target.value,
                                }))
                              }>
                              {STATUS_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="admin-inquiry-manage__save-btn"
                              disabled={!isDirty || savingId === row.id || deletingId === row.id}
                              onClick={() => void handleSaveStatus(row)}>
                              {savingId === row.id ? '저장 중...' : '저장'}
                            </button>
                            <button
                              type="button"
                              className="admin-inquiry-manage__delete-btn"
                              disabled={savingId === row.id || deletingId === row.id}
                              onClick={() => void handleDelete(row)}>
                              {deletingId === row.id ? '삭제 중...' : '삭제'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selectedRow ? (
            <div className="admin-inquiry-manage__detail">
              <div className="admin-inquiry-manage__detail-head">
                <strong>문의 #{selectedRow.id}</strong>
                <span className={statusPillClass(selectedRow.status)}>{statusLabel(selectedRow.status)}</span>
                <button
                  type="button"
                  className="admin-inquiry-manage__delete-btn admin-inquiry-manage__delete-btn--detail"
                  disabled={savingId === selectedRow.id || deletingId === selectedRow.id}
                  onClick={() => void handleDelete(selectedRow)}>
                  {deletingId === selectedRow.id ? '삭제 중...' : '삭제'}
                </button>
              </div>
              <div className="admin-inquiry-manage__detail-meta">
                <span>{formatDate(selectedRow.createdAt)}</span>
                <span>{selectedRow.category}</span>
                <span>{platformLabel(selectedRow.platform)}</span>
                <span>{selectedRow.userAccount || '(비회원)'}</span>
                <span>{selectedRow.userNickName || '-'}</span>
                <span>{formatInquiryContact(selectedRow)}</span>
              </div>
              <pre className="admin-inquiry-manage__detail-content">{selectedRow.content}</pre>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
