import { useCallback, useState } from 'react';
import { buildPortOneCustomer } from './paymentConstants';
import { runOneTimePaymentFlow } from './oneTimePaymentFlow';
import { recordServiceApply } from './recordServiceApply';
import type { ServicePaymentConfig } from './servicePaymentConfig';
import { usePaymentAlert } from './usePaymentAlert';

export type UseOneTimePaymentConfig<TSuccess> = {
  payment: ServicePaymentConfig;
  recordServiceType: string;
  /** mmservice user_subscriptions.service_type (프론트에서 지정, 서버는 그대로 전달) */
  subscriptionServiceType: string;
  userAccount: string;
  ordererName: string;
  phoneDigits: string;
  memo: string;
  churchName?: string;
  passwd?: string;
  ownerpw?: string;
  completePath: string;
  buildCompleteBody: () => Record<string, unknown>;
  validateBeforePay?: () => string | null;
  parseSuccess: (data: unknown) => TSuccess | null;
  parseConflict?: (data: unknown) => TSuccess | null;
  buildRecordMemo?: (success: TSuccess) => string;
  getPaymentId?: (success: TSuccess, fallbackPaymentId: string) => string;
};

export function useOneTimePayment<TSuccess extends { paymentId?: string }>(
  config: UseOneTimePaymentConfig<TSuccess>,
) {
  const { alert, alertCopyDone, openErrorAlert, closeAlert, handleAlertCopy } = usePaymentAlert();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<TSuccess | null>(null);

  const handlePaymentSubmit = useCallback(async () => {
    const precheck = config.validateBeforePay?.();
    if (precheck) {
      openErrorAlert(precheck, '입력 정보 확인');
      return;
    }

    setPaymentLoading(true);
    try {
      const customer = buildPortOneCustomer(
        config.userAccount,
        config.ordererName,
        config.phoneDigits,
      );

      const result = await runOneTimePaymentFlow({
        orderName: config.payment.orderName,
        totalAmount: config.payment.totalAmount,
        customer,
        completePath: config.completePath,
        completeBody: {
          ...config.buildCompleteBody(),
          serviceType: config.subscriptionServiceType,
        },
        parseSuccess: config.parseSuccess,
        parseConflict: config.parseConflict,
      });

      if (!result.ok) {
        openErrorAlert(result.message, '결제 실패');
        return;
      }

      const paymentId = config.getPaymentId?.(result.data, result.paymentId) || result.paymentId;
      const memoWithRef = config.buildRecordMemo
        ? config.buildRecordMemo(result.data)
        : config.memo.trim();

      await recordServiceApply({
        serviceType: config.recordServiceType,
        orderName: config.payment.orderName,
        userAccount: config.userAccount,
        churchName: config.churchName?.trim() || undefined,
        passwd: config.passwd?.trim() || undefined,
        ownerpw: config.ownerpw?.trim() || undefined,
        ordererName: config.ordererName,
        ordererPhone: config.phoneDigits,
        amount: config.payment.supplyPrice,
        vat: config.payment.vatAmount,
        totalAmount: config.payment.totalAmount,
        paymentStatus: 'paid',
        paymentId,
        memo: memoWithRef || undefined,
      });

      setPaymentSuccess(result.data);
    } catch (err) {
      console.error('one-time payment error:', err);
      openErrorAlert('알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', '결제 실패');
    } finally {
      setPaymentLoading(false);
    }
  }, [config, openErrorAlert]);

  return {
    paymentLoading,
    paymentSuccess,
    setPaymentSuccess,
    alert,
    alertCopyDone,
    openErrorAlert,
    closeAlert,
    handleAlertCopy,
    handlePaymentSubmit,
  };
}
