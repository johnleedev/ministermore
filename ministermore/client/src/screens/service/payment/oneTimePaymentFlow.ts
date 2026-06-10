import axios from 'axios';
import PaymentAPIURL from './paymentApi';
import { requestEventBookletPayment, type EventBookletPaymentCustomer } from './portonePayment';
import { resolveAxiosFriendlyError, serverErrorToKorean, type ServerErrorPayload } from './paymentErrors';

export type OneTimePaymentFlowResult<T> =
  | { ok: true; data: T; paymentId: string }
  | { ok: false; message: string; conflictData?: T };

export async function runOneTimePaymentFlow<T>(options: {
  orderName: string;
  totalAmount: number;
  customer: EventBookletPaymentCustomer;
  completePath: string;
  completeBody: Record<string, unknown>;
  parseSuccess: (data: unknown) => T | null;
  parseConflict?: (data: unknown) => T | null;
}): Promise<OneTimePaymentFlowResult<T>> {
  const payResult = await requestEventBookletPayment({
    orderName: options.orderName,
    totalAmount: options.totalAmount,
    customer: options.customer,
  });

  if (!payResult.ok) {
    return { ok: false, message: payResult.message };
  }

  try {
    const completeRes = await axios.post(`${PaymentAPIURL}${options.completePath}`, {
      paymentId: payResult.paymentId,
      txId: payResult.txId,
      totalAmount: options.totalAmount,
      ...options.completeBody,
    });

    const parsed = options.parseSuccess(completeRes.data);
    if (!parsed) {
      return { ok: false, message: '저장에 실패했습니다. 고객센터로 문의해 주세요.' };
    }

    return { ok: true, data: parsed, paymentId: payResult.paymentId };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 409 && options.parseConflict) {
      const conflict = options.parseConflict(err.response.data);
      if (conflict != null) {
        return { ok: true, data: conflict, paymentId: payResult.paymentId };
      }
    }

    if (axios.isAxiosError(err)) {
      if (err.response?.data && typeof err.response.data === 'object') {
        return {
          ok: false,
          message: serverErrorToKorean(err.response.data as ServerErrorPayload, err.message),
        };
      }
      if (!err.response) {
        return { ok: false, message: '서버에 연결할 수 없습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.' };
      }
    }

    return { ok: false, message: resolveAxiosFriendlyError(err) };
  }
}
