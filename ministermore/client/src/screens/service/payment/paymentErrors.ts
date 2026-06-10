import axios from 'axios';

export type BillingErrorPayload = {
  message?: string;
  code?: string;
  ok?: boolean;
};

export type ServerErrorPayload = { message?: string; ok?: boolean };

export function billingErrorToKorean(payload: BillingErrorPayload | undefined): string {
  const code = payload?.code;
  if (code === 'CHECK_CARD_NOT_ALLOWED') {
    return '체크카드는 정기결제에 사용할 수 없습니다. 신용카드를 등록해 주세요.';
  }
  const msg = typeof payload?.message === 'string' ? payload.message.trim() : '';
  if (msg && /^[\s가-힣0-9.,!?()[\]·\-'"%…]+$/.test(msg) && msg.length >= 2) {
    return msg;
  }
  return '결제에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

export function serverErrorToKorean(
  payload: ServerErrorPayload | undefined,
  axiosMessage?: string,
): string {
  const msg = typeof payload?.message === 'string' ? payload.message.trim() : '';
  if (msg && /^[\s가-힣0-9.,!?()[\]·\-'"%…]+$/.test(msg) && msg.length >= 2) {
    return msg;
  }
  if (axiosMessage && /network|econnrefused|timeout/i.test(axiosMessage)) {
    return '서버에 연결할 수 없습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.';
  }
  return '처리 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 고객센터로 문의해 주세요.';
}

export function resolveAxiosFriendlyError(
  err: unknown,
  options: {
    billing?: boolean;
    extraBillingRewrites?: { test: (s: string) => boolean; ko: string }[];
  } = {},
): string {
  if (!axios.isAxiosError(err)) {
    return '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (!err.response) {
    return '서버에 연결할 수 없습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.';
  }
  const data = err.response.data as BillingErrorPayload | ServerErrorPayload | undefined;
  let message = options.billing
    ? billingErrorToKorean(data as BillingErrorPayload)
    : serverErrorToKorean(data, err.message);
  for (const rewrite of options.extraBillingRewrites || []) {
    if (rewrite.test(message)) return rewrite.ko;
  }
  return message;
}
