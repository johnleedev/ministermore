import axios from 'axios';
import PaymentAPIURL from './paymentApi';
import type { PortOneCustomer } from './paymentConstants';
import { resolveAxiosFriendlyError } from './paymentErrors';

export type BillingCardFields = {
  cardnum: string;
  expM: string;
  expY: string;
  birthBiz: string;
  pwd2: string;
};

export type BillingKeyRequestBody = {
  customerId: string;
  customer: PortOneCustomer;
  customData: Record<string, unknown>;
  amount: number;
  orderTitle?: string;
} & BillingCardFields;

export type BillingKeySuccessResponse = {
  ok: true;
  paymentId: string;
  schedulePaymentId: string;
  billingKey: string;
  customerId: string;
  customData: Record<string, unknown>;
  paidAt: string | null;
  payment: Record<string, unknown> | null;
  timeToPay: string;
  schedule: Record<string, unknown> | null;
  churchMainId?: number;
  homeinappMainId?: string;
};

export function validateBillingCardFields(card: BillingCardFields): string | null {
  if (!card.cardnum || !card.expM || !card.expY || !card.birthBiz || card.pwd2.length !== 2) {
    return '카드번호(16자리), 유효기간(월·년), 생년월일(또는 사업자번호), 카드 비밀번호 앞 2자리를 모두 입력해 주세요.';
  }
  return null;
}

export async function requestBillingKeyPayment(
  body: BillingKeyRequestBody,
): Promise<BillingKeySuccessResponse> {
  const billingRes = await axios.post<BillingKeySuccessResponse>(
    `${PaymentAPIURL}/paymentbilling/billingkey`,
    body,
  );
  return billingRes.data;
}

export function extractBillingConflictId(
  err: unknown,
  idField: 'churchMainId' | 'homeinappMainId',
): number | string | null {
  if (!axios.isAxiosError(err) || err.response?.status !== 409) return null;
  const d = err.response.data as Record<string, unknown> | undefined;
  if (!d || d[idField] == null) return null;
  if (idField === 'churchMainId') {
    const n = Number(d.churchMainId);
    return Number.isNaN(n) ? null : n;
  }
  const s = String(d.homeinappMainId).trim();
  return s || null;
}

export function logBillingPaymentError(err: unknown): void {
  if (axios.isAxiosError(err) && err.response?.data) {
    console.error('POST /paymentbilling/billingkey failed:', err.response.status, err.response.data);
  } else {
    console.error('POST /paymentbilling/billingkey failed:', err);
  }
}

export function resolveBillingPaymentError(
  err: unknown,
  extraRewrites: { test: (s: string) => boolean; ko: string }[] = [],
): string {
  return resolveAxiosFriendlyError(err, { billing: true, extraBillingRewrites: extraRewrites });
}
