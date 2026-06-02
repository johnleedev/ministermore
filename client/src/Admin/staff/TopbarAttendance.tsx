import { useCallback, useEffect, useState } from 'react';
import { getAdminSession } from '../adminSession';
import {
  fetchTodayStatus,
  getAttendanceErrorMessage,
  postClockIn,
  postClockOut,
  type TodayStatusData,
} from './adminAttendanceApi';
import './TopbarAttendance.scss';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatLiveClock(date: Date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const h = pad2(date.getHours());
  const min = pad2(date.getMinutes());
  const s = pad2(date.getSeconds());
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

function formatShortTime(value: string | null | undefined) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function TopbarAttendance() {
  const session = getAdminSession();
  const [now, setNow] = useState(() => new Date());
  const [status, setStatus] = useState<TodayStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<'in' | 'out' | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadStatus = useCallback(async () => {
    if (!session?.id) {
      setLoading(false);
      setStatus(null);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchTodayStatus(session.id);
      setStatus(data);
    } catch (err) {
      setStatus(null);
      console.error('today-status', err);
    } finally {
      setLoading(false);
    }
  }, [session?.id]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleClockIn = async () => {
    if (!session?.id || !status?.canClockIn) return;
    const ok = window.confirm(
      '출근 처리하시겠습니까?\n\n현재 시각으로 출근이 기록됩니다.',
    );
    if (!ok) return;
    setActing('in');
    try {
      await postClockIn(session.id);
      await loadStatus();
    } catch (err) {
      alert(getAttendanceErrorMessage(err, '출근 처리에 실패했습니다.'));
    } finally {
      setActing(null);
    }
  };

  const handleClockOut = async () => {
    if (!session?.id || !status?.canClockOut) return;
    const ok = window.confirm(
      '퇴근 처리하시겠습니까?\n\n현재 시각으로 퇴근이 기록됩니다.',
    );
    if (!ok) return;
    setActing('out');
    try {
      await postClockOut(session.id);
      await loadStatus();
    } catch (err) {
      alert(getAttendanceErrorMessage(err, '퇴근 처리에 실패했습니다.'));
    } finally {
      setActing(null);
    }
  };

  if (!session?.id) return null;

  const record = status?.record;
  const canClockIn = Boolean(status?.canClockIn) && acting == null && !loading;
  const canClockOut = Boolean(status?.canClockOut) && acting == null && !loading;

  const clockInTitle = status?.hasClockIn && record?.clockIn
    ? `출근 완료 ${formatShortTime(record.clockIn)}`
    : '출근하기';
  const clockOutTitle = status?.hasClockOut && record?.clockOut
    ? `퇴근 완료 ${formatShortTime(record.clockOut)}`
    : '퇴근하기';

  return (
    <div className="topbar-attendance" aria-label="출퇴근">
      <time className="topbar-attendance__clock" dateTime={now.toISOString()} aria-live="polite">
        {formatLiveClock(now)}
      </time>
      <button
        type="button"
        className="topbar-attendance__btn topbar-attendance__btn--in"
        disabled={!canClockIn}
        title={clockInTitle}
        onClick={() => void handleClockIn()}
      >
        {acting === 'in' ? '…' : '출근하기'}
      </button>
      <button
        type="button"
        className="topbar-attendance__btn topbar-attendance__btn--out"
        disabled={!canClockOut}
        title={clockOutTitle}
        onClick={() => void handleClockOut()}
      >
        {acting === 'out' ? '…' : '퇴근하기'}
      </button>
    </div>
  );
}
