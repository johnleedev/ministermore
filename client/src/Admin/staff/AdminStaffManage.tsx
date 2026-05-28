import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import MainURL from '../../MainURL';
import { getAdminSession, isSuperAdmin, saveAdminSession } from '../adminSession';
import { adminStatusLabel, canonicalAdminStatus } from '../adminStatusUtils';
import './AdminStaffManage.scss';

type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

type WeekdaySlot = {
  clockIn: string;
  clockOut: string;
};

type ContractWeekdays = Record<WeekdayKey, WeekdaySlot>;

type AdminStaffRow = {
  id: number;
  email: string;
  name: string;
  department: string | null;
  position: string | null;
  role: string | null;
  status: string;
  statusDb?: string;
  contractClockIn?: string;
  contractClockOut?: string;
  contractWeekdays?: ContractWeekdays;
};

const ROLE_LABEL: Record<string, string> = {
  admin: '최종관리자',
  employee: '관리자',
};

const WEEKDAYS: { key: WeekdayKey; label: string }[] = [
  { key: 'mon', label: '월' },
  { key: 'tue', label: '화' },
  { key: 'wed', label: '수' },
  { key: 'thu', label: '목' },
  { key: 'fri', label: '금' },
];

const DEFAULT_CONTRACT_IN = '09:00';
const DEFAULT_CONTRACT_OUT = '18:00';

function defaultWeekdaySlot(): WeekdaySlot {
  return { clockIn: DEFAULT_CONTRACT_IN, clockOut: DEFAULT_CONTRACT_OUT };
}

function defaultContractWeekdays(): ContractWeekdays {
  return {
    mon: defaultWeekdaySlot(),
    tue: defaultWeekdaySlot(),
    wed: defaultWeekdaySlot(),
    thu: defaultWeekdaySlot(),
    fri: defaultWeekdaySlot(),
  };
}

function contractWeekdaysFromRow(row: AdminStaffRow): ContractWeekdays {
  if (row.contractWeekdays) {
    const base = defaultContractWeekdays();
    for (const { key } of WEEKDAYS) {
      const slot = row.contractWeekdays[key];
      if (slot) {
        base[key] = {
          clockIn: slot.clockIn || DEFAULT_CONTRACT_IN,
          clockOut: slot.clockOut || DEFAULT_CONTRACT_OUT,
        };
      }
    }
    return base;
  }
  const legacyIn = row.contractClockIn || DEFAULT_CONTRACT_IN;
  const legacyOut = row.contractClockOut || DEFAULT_CONTRACT_OUT;
  const legacy: WeekdaySlot = { clockIn: legacyIn, clockOut: legacyOut };
  return {
    mon: { ...legacy },
    tue: { ...legacy },
    wed: { ...legacy },
    thu: { ...legacy },
    fri: { ...legacy },
  };
}

function formatWeekdaysConfirmSummary(weekdays: ContractWeekdays): string {
  return WEEKDAYS.map(({ key, label }) => {
    const s = weekdays[key];
    return `${label}: ${s.clockIn} ~ ${s.clockOut}`;
  }).join('\n');
}

export default function AdminStaffManage() {
  const session = getAdminSession();
  const superAdmin = isSuperAdmin(session);
  const [rows, setRows] = useState<AdminStaffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [contractDrafts, setContractDrafts] = useState<Record<number, ContractWeekdays>>({});

  const fetchRows = useCallback(async () => {
    if (!session?.id || !superAdmin) return;
    setLoading(true);
    try {
      const res = await axios.get<{ ok: boolean; data?: AdminStaffRow[] }>(
        `${MainURL}/adminuser/admins`,
        { params: { requesterId: session.id } },
      );
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setRows(list);
      const drafts: Record<number, ContractWeekdays> = {};
      list.forEach((row) => {
        drafts[row.id] = contractWeekdaysFromRow(row);
      });
      setContractDrafts(drafts);
    } catch {
      alert('직원 목록을 불러오지 못했습니다.');
      setRows([]);
      setContractDrafts({});
    } finally {
      setLoading(false);
    }
  }, [session?.id, superAdmin]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const syncSessionRole = (targetId: number, newRole: string) => {
    if (!session) return;
    if (targetId === session.id) {
      saveAdminSession({ ...session, role: newRole });
      return;
    }
    if (session.role === 'admin' && newRole === 'admin') {
      saveAdminSession({ ...session, role: 'employee' });
    }
  };

  const updateWeekdayDraft = (
    id: number,
    weekday: WeekdayKey,
    field: keyof WeekdaySlot,
    value: string,
  ) => {
    setContractDrafts((prev) => {
      const row = rows.find((r) => r.id === id);
      const current = prev[id] || contractWeekdaysFromRow(row || ({ id } as AdminStaffRow));
      return {
        ...prev,
        [id]: {
          ...current,
          [weekday]: {
            ...current[weekday],
            [field]: value,
          },
        },
      };
    });
  };

  const handleSaveContractHours = async (row: AdminStaffRow) => {
    if (!session?.id) return;
    const weekdays = contractDrafts[row.id] || contractWeekdaysFromRow(row);
    if (
      !window.confirm(
        `「${row.name}」 직원의 월~금 출퇴근 시간을 저장하시겠습니까?\n\n${formatWeekdaysConfirmSummary(weekdays)}\n\n해당 요일 출근 시각 기준으로 지각 여부가 판정됩니다.`,
      )
    ) {
      return;
    }
    setActingId(row.id);
    try {
      const res = await axios.post<{ ok: boolean; message?: string; data?: AdminStaffRow }>(
        `${MainURL}/adminuser/contract-hours`,
        {
          requesterId: session.id,
          targetId: row.id,
          contractWeekdays: weekdays,
        },
      );
      if (!res.data?.ok) {
        alert(res.data?.message || '저장에 실패했습니다.');
        return;
      }
      alert(res.data.message || '저장되었습니다.');
      void fetchRows();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : null;
      alert(msg || '시간 저장에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  const handleApprove = async (row: AdminStaffRow) => {
    if (!session?.id) return;
    if (!window.confirm(`「${row.name}」 관리자 가입을 승인하시겠습니까?`)) return;
    setActingId(row.id);
    try {
      const res = await axios.post<{ ok: boolean; message?: string }>(`${MainURL}/adminuser/approve`, {
        requesterId: session.id,
        targetId: row.id,
      });
      if (!res.data?.ok) {
        alert(res.data?.message || '승인에 실패했습니다.');
        return;
      }
      alert('승인되었습니다.');
      void fetchRows();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : null;
      alert(msg || '승인에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (row: AdminStaffRow) => {
    if (!session?.id) return;
    if (!window.confirm(`「${row.name}」 가입을 거절하시겠습니까?`)) return;
    setActingId(row.id);
    try {
      const res = await axios.post<{ ok: boolean; message?: string }>(`${MainURL}/adminuser/reject`, {
        requesterId: session.id,
        targetId: row.id,
      });
      if (!res.data?.ok) {
        alert(res.data?.message || '거절에 실패했습니다.');
        return;
      }
      alert('거절 처리되었습니다.');
      void fetchRows();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : null;
      alert(msg || '거절에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  const handleSetSuper = async (row: AdminStaffRow) => {
    if (!session?.id) return;
    if (
      !window.confirm(
        `「${row.name}」을(를) 최종관리자로 지정하시겠습니까?\n기존 최종관리자는 일반 관리자로 변경됩니다.`,
      )
    ) {
      return;
    }
    setActingId(row.id);
    try {
      const res = await axios.post<{ ok: boolean; message?: string; data?: AdminStaffRow }>(
        `${MainURL}/adminuser/set-super`,
        { requesterId: session.id, targetId: row.id },
      );
      if (!res.data?.ok) {
        alert(res.data?.message || '지정에 실패했습니다.');
        return;
      }
      syncSessionRole(row.id, 'admin');
      alert(res.data.message || '최종관리자가 변경되었습니다.');
      void fetchRows();
      window.location.reload();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : null;
      alert(msg || '지정에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  if (!superAdmin) {
    return (
      <p className="admin-staff-manage__denied">최종관리자만 직원 관리 메뉴를 사용할 수 있습니다.</p>
    );
  }

  const pendingCount = rows.filter(
    (r) => canonicalAdminStatus(r.status, r.statusDb) === 'pending',
  ).length;

  return (
    <div className="admin-staff-manage">
      <p className="admin-staff-manage__hint">
        직원 가입 승인·최종관리자 지정과 함께, <strong>월~금 요일별</strong> 출근·퇴근 시간을
        설정합니다. 출근하기 시 <strong>그날 요일</strong>의 출근 시각보다 늦으면 지각, 이르면
        정상으로 기록됩니다.
        {pendingCount > 0 ? ` (승인 대기 ${pendingCount}명)` : ''}
      </p>

      <div className="admin-staff-manage__toolbar">
        <button type="button" onClick={() => void fetchRows()} disabled={loading}>
          {loading ? '불러오는 중...' : '새로고침'}
        </button>
      </div>

      <div className="admin-staff-manage__table-wrap">
        <table className="admin-table admin-staff-manage__table">
          <thead>
            <tr>
              <th>이름</th>
              <th>아이디</th>
              <th>부서</th>
              <th>직급</th>
              <th>역할</th>
              <th>상태</th>
              <th>월~금 출퇴근</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const statusCanon = canonicalAdminStatus(row.status, row.statusDb);
              const weekdays = contractDrafts[row.id] || contractWeekdaysFromRow(row);
              const isActive = statusCanon === 'active';

              return (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.department || '-'}</td>
                  <td>{row.position || '-'}</td>
                  <td>{ROLE_LABEL[row.role || ''] || row.role || '-'}</td>
                  <td>
                    <span
                      className={`admin-staff-manage__status admin-staff-manage__status--${statusCanon}`}
                      title={row.statusDb ? `DB: ${row.statusDb}` : undefined}
                    >
                      {adminStatusLabel(row.status, row.statusDb)}
                    </span>
                  </td>
                  <td>
                    {isActive ? (
                      <div className="admin-staff-manage__weekdays">
                        <div className="admin-staff-manage__weekdays-head" aria-hidden>
                          <span>요일</span>
                          <span>출근</span>
                          <span>퇴근</span>
                        </div>
                        {WEEKDAYS.map(({ key, label }) => {
                          const slot = weekdays[key];
                          return (
                            <div key={key} className="admin-staff-manage__weekday-row">
                              <span className="admin-staff-manage__weekday-label">{label}</span>
                              <input
                                type="time"
                                className="admin-staff-manage__time-input"
                                value={slot.clockIn}
                                disabled={actingId === row.id}
                                aria-label={`${label}요일 출근`}
                                onChange={(e) =>
                                  updateWeekdayDraft(row.id, key, 'clockIn', e.target.value)
                                }
                              />
                              <input
                                type="time"
                                className="admin-staff-manage__time-input"
                                value={slot.clockOut}
                                disabled={actingId === row.id}
                                aria-label={`${label}요일 퇴근`}
                                onChange={(e) =>
                                  updateWeekdayDraft(row.id, key, 'clockOut', e.target.value)
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="admin-staff-manage__muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-staff-manage__actions">
                      {isActive && (
                        <button
                          type="button"
                          className="admin-btn view-btn"
                          disabled={actingId === row.id}
                          onClick={() => void handleSaveContractHours(row)}
                        >
                          시간 저장
                        </button>
                      )}
                      {statusCanon === 'pending' && (
                        <>
                          <button
                            type="button"
                            className="admin-btn edit-btn"
                            disabled={actingId === row.id}
                            onClick={() => void handleApprove(row)}
                          >
                            승인
                          </button>
                          <button
                            type="button"
                            className="admin-btn delete-btn"
                            disabled={actingId === row.id}
                            onClick={() => void handleReject(row)}
                          >
                            거절
                          </button>
                        </>
                      )}
                      {statusCanon === 'active' && row.role !== 'admin' && (
                        <button
                          type="button"
                          className="admin-btn view-btn"
                          disabled={actingId === row.id}
                          onClick={() => void handleSetSuper(row)}
                        >
                          최종관리자 지정
                        </button>
                      )}
                      {row.role === 'admin' && (
                        <span className="admin-staff-manage__badge">현재 최종관리자</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <p className="admin-staff-manage__empty">등록된 직원이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
