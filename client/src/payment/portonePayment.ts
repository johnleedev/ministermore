import * as PortOne from '@portone/browser-sdk/v2';

/** 일반결제(단건)용 스토어·채널 */
const STORE_ID =
  process.env.REACT_APP_PORTONE_STORE_ID || 'store-ca1b10da-c69c-4054-90ca-9410bf6ecbed';

const CHANNEL_KEY_MODERN =
  process.env.REACT_APP_PORTONE_CHANNEL_KEY || 'channel-key-eeb61222-ee67-4a67-877e-b7a97c6c5493';

export type EventBookletPaymentCustomer = {
  fullName: string;
  phoneNumber: string;
  email: string;
};

export type EventBookletPaymentParams = {
  orderName: string;
  totalAmount: number;
  customer: EventBookletPaymentCustomer;
  customData?: Record<string, unknown>;
  /** 미지정 시 `evt_${timestamp}_${random}` 자동 생성 */
  paymentId?: string;
};

export type EventBookletPaymentResult =
  | { ok: true; paymentId: string; txId: string }
  | { ok: false; message: string };

/** SDK/버전에 따라 성공 필드 형태가 달라질 수 있어 정규화 */
function normalizeSuccessResponse(raw: unknown): { paymentId: string; txId: string } | null {
  if (raw == null || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  if (r.ok === true && typeof r.paymentId === 'string') {
    const txId = typeof r.txId === 'string' ? r.txId : '';
    return { paymentId: r.paymentId, txId };
  }

  if (typeof r.paymentId === 'string' && !r.code) {
    const txId = typeof r.txId === 'string' ? r.txId : '';
    return { paymentId: r.paymentId, txId };
  }

  return null;
}

/**
 * 일반결제 — 카드 일시불 (`PortOne.requestPayment`)
 */
export async function requestEventBookletPayment(params: EventBookletPaymentParams): Promise<EventBookletPaymentResult> {
  const paymentId =
    params.paymentId?.trim() ||
    `evt_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
  try {
    const response = await PortOne.requestPayment({
      storeId: STORE_ID,
      channelKey: CHANNEL_KEY_MODERN,
      paymentId,
      orderName: params.orderName,
      totalAmount: params.totalAmount,
      currency: 'CURRENCY_KRW',
      payMethod: 'CARD',
      customer: {
        fullName: params.customer.fullName,
        phoneNumber: params.customer.phoneNumber,
        email: params.customer.email,
      }
    });

    if (!response) {
      console.error('[PortOne] payment cancelled or popup closed', { paymentId });
      return { ok: false, message: '결제가 취소되었거나 창이 닫혔습니다.' };
    }

    const success = normalizeSuccessResponse(response);
    if (success) {
      return { ok: true, paymentId: success.paymentId, txId: success.txId };
    }

    const r = response as Record<string, unknown>;
    if (r.code) {
      console.error('[PortOne] payment failed response', response);
      return {
        ok: false,
        message: String(r.message || r.code || '결제에 실패했습니다.'),
      };
    }

    return { ok: false, message: '결제 응답을 해석할 수 없습니다. 고객센터로 문의해 주세요.' };
  } catch (error) {
    console.error('[PortOne] requestPayment threw error', error);
    return { ok: false, message: '결제 요청 중 오류가 발생했습니다.' };
  }
}
