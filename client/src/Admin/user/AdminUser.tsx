import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import MainURL from '../../MainURL';
import './AdminUser.scss';

type AdminUserRow = {
  userAccount: string;
  userNickName: string | null;
  userChurch: string | null;
  userSort: string | null;
  userDetail: string | null;
  userURL: string | null;
  grade: string | null;
  isPosting: string | null;
};

const GRADE_OPTIONS = ['일반회원', '정회원'] as const;

const GRADE_FILTER_TABS: { value: string; label: string }[] = [
  { value: '', label: '전체' },
  { value: '일반회원', label: '일반회원' },
  { value: '정회원', label: '정회원' },
];

function gradePillClass(grade: string | null | undefined): string {
  const base = 'admin-user-manage__grade-pill';
  if (grade === '정회원') return `${base} admin-user-manage__grade-pill--regular`;
  if (grade === '일반회원') return `${base} admin-user-manage__grade-pill--general`;
  return `${base} admin-user-manage__grade-pill--other`;
}

export default function AdminUser() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gradeFilter, setGradeFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftGrades, setDraftGrades] = useState<Record<string, string>>({});
  const [savingAccount, setSavingAccount] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<{ ok: boolean; rows?: AdminUserRow[]; total?: number }>(
        `${MainURL}/adminuser/list`,
        {
          params: {
            limit: 300,
            q: searchQuery || undefined,
            grade: gradeFilter || undefined,
          },
        }
      );
      const list = Array.isArray(res.data?.rows) ? res.data.rows : [];
      setRows(list);
      setTotal(typeof res.data?.total === 'number' ? res.data.total : list.length);
      const drafts: Record<string, string> = {};
      list.forEach((row) => {
        const g = (row.grade || '').trim();
        if (GRADE_OPTIONS.includes(g as (typeof GRADE_OPTIONS)[number])) {
          drafts[row.userAccount] = g;
        } else if (g) {
          drafts[row.userAccount] = g;
        } else {
          drafts[row.userAccount] = '일반회원';
        }
      });
      setDraftGrades(drafts);
    } catch (err) {
      console.error('failed to load users:', err);
      alert('사용자 목록을 불러오지 못했습니다.');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [gradeFilter, searchQuery]);

  const handleSaveGrade = async (row: AdminUserRow) => {
    const nextGrade = draftGrades[row.userAccount];
    if (!GRADE_OPTIONS.includes(nextGrade as (typeof GRADE_OPTIONS)[number])) {
      alert('일반회원 또는 정회원만 선택할 수 있습니다.');
      return;
    }
    if (!nextGrade || nextGrade === (row.grade || '').trim()) {
      alert('변경할 등급을 선택해 주세요.');
      return;
    }
    const label = row.userNickName || row.userAccount;
    if (!window.confirm(`「${label}」 회원 등급을 「${nextGrade}」(으)로 변경하시겠습니까?`)) {
      return;
    }

    setSavingAccount(row.userAccount);
    try {
      const res = await axios.post<{ ok: boolean; message?: string }>(`${MainURL}/adminuser/grade`, {
        userAccount: row.userAccount,
        grade: nextGrade,
      });
      if (!res.data?.ok) {
        alert(res.data?.message || '등급 변경에 실패했습니다.');
        return;
      }
      setRows((prev) =>
        prev.map((r) => (r.userAccount === row.userAccount ? { ...r, grade: nextGrade } : r))
      );
      alert('등급이 변경되었습니다.');
    } catch (err) {
      console.error('failed to update grade:', err);
      alert('등급 변경에 실패했습니다.');
    } finally {
      setSavingAccount(null);
    }
  };

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const emptyMessage = useMemo(() => '표시할 사용자가 없습니다.', []);

  return (
    <div className="admin-user-manage service-detail-overview service-detail-overview--apply-list">
      <p className="admin-user-manage__hint">
        common DB <strong>user</strong> 테이블의 가입 회원 목록입니다. 최신 가입순으로 표시됩니다. 등급(grade)을
        변경하면 수련회 메뉴 등업과 동일하게 반영됩니다. (최대 300건)
      </p>

      <div className="service-detail-overview__tabs" role="tablist" aria-label="등급 필터">
        {GRADE_FILTER_TABS.map(({ value, label }) => (
          <button
            key={value || 'all'}
            type="button"
            role="tab"
            aria-selected={gradeFilter === value}
            className={`service-detail-overview__tab${gradeFilter === value ? ' is-active' : ''}`}
            onClick={() => {
              setGradeFilter(value);
              window.scrollTo(0, 0);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="admin-user-manage__toolbar service-detail-overview__toolbar">
        <input
          className="admin-user-manage__search"
          type="search"
          placeholder="이메일·닉네임·교회명 검색"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setSearchQuery(searchInput.trim());
            }
          }}
        />
        <button
          type="button"
          className="admin-user-manage__toolbar-btn admin-user-manage__toolbar-btn--primary"
          onClick={() => setSearchQuery(searchInput.trim())}
          disabled={loading}
        >
          검색
        </button>
        <button
          type="button"
          className="admin-user-manage__toolbar-btn"
          onClick={() => void fetchRows()}
          disabled={loading}
        >
          {loading ? '불러오는 중...' : '새로고침'}
        </button>
        <span className="service-detail-overview__hint" style={{ margin: 0 }}>
          총 {total.toLocaleString('ko-KR')}명
          {rows.length < total ? ` (표시 ${rows.length}명)` : ''}
        </span>
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
                  <th scope="col">계정</th>
                  <th scope="col">닉네임</th>
                  <th scope="col">교회</th>
                  <th scope="col">직분</th>
                  <th scope="col">가입경로</th>
                  <th scope="col">현재 등급</th>
                  <th scope="col">등급 변경</th>
                  <th scope="col">게시 권한</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const currentGrade = (row.grade || '').trim();
                  const draft = draftGrades[row.userAccount] ?? '일반회원';
                  const isDirty =
                    draft !== currentGrade &&
                    GRADE_OPTIONS.includes(draft as (typeof GRADE_OPTIONS)[number]);
                  return (
                    <tr key={row.userAccount}>
                      <td>{row.userAccount}</td>
                      <td>{row.userNickName || '-'}</td>
                      <td>{row.userChurch || '-'}</td>
                      <td>{row.userSort || '-'}</td>
                      <td>{row.userURL || '-'}</td>
                      <td>
                        <span className={gradePillClass(row.grade)}>{row.grade || '(미설정)'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <select
                            className="admin-user-manage__grade-select"
                            value={draft}
                            disabled={savingAccount === row.userAccount}
                            onChange={(e) =>
                              setDraftGrades((prev) => ({
                                ...prev,
                                [row.userAccount]: e.target.value,
                              }))
                            }
                          >
                            {!GRADE_OPTIONS.includes(draft as (typeof GRADE_OPTIONS)[number]) ? (
                              <option value={draft}>{draft}</option>
                            ) : null}
                            {GRADE_OPTIONS.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="admin-user-manage__save-btn"
                            disabled={!isDirty || savingAccount === row.userAccount}
                            onClick={() => void handleSaveGrade(row)}
                          >
                            {savingAccount === row.userAccount ? '저장 중...' : '등업 저장'}
                          </button>
                        </div>
                      </td>
                      <td>{row.isPosting === 'true' ? '허용' : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
