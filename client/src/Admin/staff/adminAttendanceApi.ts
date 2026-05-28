import axios from 'axios';
import MainURL from '../../MainURL';

export type AttendanceRecord = {
  id: number;
  userId: number;
  workDate: string;
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  name?: string;
  department?: string | null;
  position?: string | null;
};

export type TodayStatusData = {
  workDate: string;
  hasClockIn: boolean;
  hasClockOut: boolean;
  canClockIn: boolean;
  canClockOut: boolean;
  record: AttendanceRecord | null;
};

export type AdminAttendanceListData = {
  workDate: string;
  items: AttendanceRecord[];
  total: number;
};

type ApiErrorBody = {
  ok?: boolean;
  error?: { code?: string; message?: string };
  message?: string;
};

export function getAttendanceErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorBody | undefined;
    if (data?.error?.message) return data.error.message;
    if (typeof data?.message === 'string') return data.message;
  }
  return fallback;
}

export async function fetchTodayStatus(requesterId: number) {
  const res = await axios.get<{ ok: boolean; data?: TodayStatusData }>(
    `${MainURL}/api/attendance/today-status`,
    { params: { requesterId } },
  );
  if (!res.data?.ok || !res.data.data) {
    throw new Error('출퇴근 상태를 불러오지 못했습니다.');
  }
  return res.data.data;
}

export async function postClockIn(requesterId: number) {
  const res = await axios.post<{ ok: boolean; data?: AttendanceRecord }>(
    `${MainURL}/api/attendance/clock-in`,
    { requesterId },
  );
  if (!res.data?.ok) {
    throw new Error('출근 처리에 실패했습니다.');
  }
  return res.data.data;
}

export async function postClockOut(requesterId: number) {
  const res = await axios.post<{ ok: boolean; data?: AttendanceRecord }>(
    `${MainURL}/api/attendance/clock-out`,
    { requesterId },
  );
  if (!res.data?.ok) {
    throw new Error('퇴근 처리에 실패했습니다.');
  }
  return res.data.data;
}

export async function fetchAdminAttendanceList(requesterId: number, date: string) {
  const res = await axios.get<{ ok: boolean; data?: AdminAttendanceListData }>(
    `${MainURL}/api/admin/attendance`,
    { params: { requesterId, date } },
  );
  if (!res.data?.ok || !res.data.data) {
    throw new Error('출퇴근 현황을 불러오지 못했습니다.');
  }
  return res.data.data;
}

export async function postRevertClockOut(requesterId: number, attendanceId: number) {
  const res = await axios.post<{ ok: boolean; data?: AttendanceRecord }>(
    `${MainURL}/api/admin/attendance/revert-clock-out`,
    { requesterId, attendanceId },
  );
  if (!res.data?.ok) {
    throw new Error('퇴근 되돌리기에 실패했습니다.');
  }
  return res.data.data;
}
