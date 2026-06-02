import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import MainURL from '../../MainURL';
import { getAdminSession, isSuperAdmin, saveAdminSession } from '../adminSession';
import { adminStatusLabel, canonicalAdminStatus } from '../adminStatusUtils';
import './AdminStaffManage.scss';

type AdminStaffRow = {
  id: number;
  email: string;
  name: string;
  department: string | null;
  position: string | null;
  role: string | null;
  status: string;
  statusDb?: string;
};

const ROLE_LABEL: Record<string, string> = {
  admin: '최종관리자',
  employee: '관리자',
};


export default function AdminStaffManage() {
  const session = getAdminSession();
  const superAdmin = isSuperAdmin(session);
  const [rows, setRows] = useState<AdminStaffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

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
    } catch {
      alert('직원 목록을 불러오지 못했습니다.');
      setRows([]);
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
        직원 가입 승인 및 최종관리자 지정을 관리합니다.
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
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const statusCanon = canonicalAdminStatus(row.status, row.statusDb);

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
                    <div className="admin-staff-manage__actions">
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
