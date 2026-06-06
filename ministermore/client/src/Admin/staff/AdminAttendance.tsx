import { useCallback, useEffect, useState } from 'react';
import { getAdminSession, isSuperAdmin } from '../adminSession';
import {
  fetchAdminAttendanceList,
  getAttendanceErrorMessage,
  postRevertClockOut,
  type AttendanceRecord,
} from './adminAttendanceApi';
import './AdminAttendance.scss';

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTableTime(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function AdminAttendance() {
  const session = getAdminSession();
  const superAdmin = isSuperAdmin(session);
  const [selectedDate, setSelectedDate] = useState(todayInputValue);
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [workDate, setWorkDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revertingId, setRevertingId] = useState<number | null>(null);

  const loadList = useCallback(async () => {
    if (!session?.id || !superAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminAttendanceList(session.id, selectedDate);
      setRows(data.items);
      setWorkDate(data.workDate);
    } catch (err) {
      setError(getAttendanceErrorMessage(err, '출퇴근 현황을 불러오지 못했습니다.'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [session?.id, superAdmin, selectedDate]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const handleRevertClockOut = async (row: AttendanceRecord) => {
    if (!session?.id || !row.clockOut) return;
    const name = row.name ?? '직원';
    const ok = window.confirm(
      `「${name}」 직원의 퇴근 기록을 되돌리시겠습니까?\n\n퇴근 시각이 삭제되며, 해당 직원이 다시 퇴근할 수 있습니다.`,
    );
    if (!ok) return;

    setRevertingId(row.id);
    setError(null);
    try {
      await postRevertClockOut(session.id, row.id);
      await loadList();
    } catch (err) {
      setError(getAttendanceErrorMessage(err, '퇴근 되돌리기에 실패했습니다.'));
    } finally {
      setRevertingId(null);
    }
  };

  if (!superAdmin) {
    return (
      <p className="admin-attendance__denied">출퇴근 현황 조회는 최종관리자만 이용할 수 있습니다.</p>
    );
  }

  return (
    <div className="admin-attendance">
      <div className="admin-attendance__toolbar">
        <label className="admin-attendance__date-label" htmlFor="admin-attendance-date">
          조회 날짜
        </label>
        <input
          id="admin-attendance-date"
          type="date"
          className="admin-attendance__date-input"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <button type="button" className="admin-attendance__refresh-btn" onClick={() => void loadList()} disabled={loading}>
          {loading ? '불러오는 중…' : '새로고침'}
        </button>
        {workDate ? (
          <span className="admin-attendance__summary">
            {workDate} · 출근 {rows.length}명
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="admin-attendance__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="admin-attendance__table-wrap">
        <table className="admin-attendance__table">
          <caption className="admin-attendance__caption">전 직원 출퇴근 현황</caption>
          <thead>
            <tr>
              <th scope="col">이름</th>
              <th scope="col">부서</th>
              <th scope="col">직급</th>
              <th scope="col">출근 시각</th>
              <th scope="col">퇴근 시각</th>
              <th scope="col">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-attendance__empty">
                  불러오는 중…
                </td>
              </tr>
            ) : null}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-attendance__empty">
                  해당 날짜에 출근 기록이 없습니다.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name ?? '—'}</td>
                <td>{row.department ?? '—'}</td>
                <td>{row.position ?? '—'}</td>
                <td className="admin-attendance__mono">{formatTableTime(row.clockIn)}</td>
                <td className="admin-attendance__mono">{formatTableTime(row.clockOut)}</td>
                <td>
                  {row.clockOut ? (
                    <button
                      type="button"
                      className="admin-attendance__revert-btn"
                      disabled={revertingId === row.id || loading}
                      onClick={() => void handleRevertClockOut(row)}
                    >
                      {revertingId === row.id ? '처리 중…' : '퇴근 되돌리기'}
                    </button>
                  ) : (
                    <span className="admin-attendance__no-action">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
