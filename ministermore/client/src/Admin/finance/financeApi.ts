import axios from 'axios';
import MainURL from '../../MainURL';

export type FinanceType = 'REVENUE' | 'EXPENSE';

export type FinanceRecord = {
  id: number;
  type: FinanceType;
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string | null;
  cash_flow_date: string | null;
  created_at?: string;
  updated_at?: string;
};

export type FinanceSummaryItem = {
  month: string; // YYYY-MM
  revenue: number;
  expense: number;
  net: number;
};

export type FinanceSummaryResponse = {
  rangeMonths: number;
  data: FinanceSummaryItem[];
};

export type CreateFinancePayload = {
  type: FinanceType;
  category: string;
  amount: number;
  description?: string;
  transaction_date?: string | null;
  cash_flow_date?: string | null;
};

export type RecurringExpense = {
  id: number;
  category: string;
  amount: number;
  description: string | null;
  repeat_day: number;
  is_active: 0 | 1;
  created_at?: string;
  updated_at?: string;
};

export type CreateRecurringExpensePayload = {
  category: string;
  amount: number;
  repeat_day: number;
  description?: string;
};

export type PatchRecurringExpensePayload = Partial<{
  category: string;
  amount: number;
  repeat_day: number;
  description: string | null;
  is_active: 0 | 1;
}>;

type ApiErrorBody = {
  ok?: boolean;
  error?: { code?: string; message?: string };
  message?: string;
};

const API_BASE = `${MainURL}/api/finance`;

function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
    if (typeof body?.message === 'string') return body.message;
  }
  return fallback;
}

export async function fetchFinanceList(type?: FinanceType) {
  try {
    const res = await axios.get<{ ok: boolean; data?: FinanceRecord[] }>(`${API_BASE}/list`, {
      params: type ? { type } : undefined,
    });
    if (!res.data?.ok || !Array.isArray(res.data.data)) {
      throw new Error('재무 목록 응답 형식이 올바르지 않습니다.');
    }
    return res.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, '재무 목록을 불러오지 못했습니다.'));
  }
}

export async function fetchFinanceSummary(months = 12) {
  try {
    const res = await axios.get<{ ok: boolean; data?: FinanceSummaryItem[]; rangeMonths?: number }>(
      `${API_BASE}/summary`,
      { params: { months } }
    );
    if (!res.data?.ok || !Array.isArray(res.data.data)) {
      throw new Error('통계 응답 형식이 올바르지 않습니다.');
    }
    return {
      rangeMonths: Number(res.data.rangeMonths || months),
      data: res.data.data,
    } as FinanceSummaryResponse;
  } catch (err) {
    throw new Error(getErrorMessage(err, '월별 통계를 불러오지 못했습니다.'));
  }
}

export async function createFinanceRecord(payload: CreateFinancePayload) {
  try {
    const res = await axios.post<{ ok: boolean; data?: FinanceRecord }>(API_BASE, payload);
    if (!res.data?.ok || !res.data.data) {
      throw new Error('등록 응답 형식이 올바르지 않습니다.');
    }
    return res.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, '재무 내역 등록에 실패했습니다.'));
  }
}

export async function fetchRecurringExpenses() {
  try {
    const res = await axios.get<{ ok: boolean; data?: RecurringExpense[] }>(`${API_BASE}/recurring`);
    if (!res.data?.ok || !Array.isArray(res.data.data)) {
      throw new Error('고정비 목록 응답 형식이 올바르지 않습니다.');
    }
    return res.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, '고정비 목록을 불러오지 못했습니다.'));
  }
}

export async function createRecurringExpense(payload: CreateRecurringExpensePayload) {
  try {
    const res = await axios.post<{ ok: boolean; data?: RecurringExpense }>(`${API_BASE}/recurring`, payload);
    if (!res.data?.ok || !res.data.data) {
      throw new Error('고정비 등록 응답 형식이 올바르지 않습니다.');
    }
    return res.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, '고정비 등록에 실패했습니다.'));
  }
}

export async function patchRecurringExpense(id: number, payload: PatchRecurringExpensePayload) {
  try {
    const res = await axios.patch<{ ok: boolean; data?: RecurringExpense }>(`${API_BASE}/recurring/${id}`, payload);
    if (!res.data?.ok || !res.data.data) {
      throw new Error('고정비 수정 응답 형식이 올바르지 않습니다.');
    }
    return res.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, '고정비 수정에 실패했습니다.'));
  }
}
