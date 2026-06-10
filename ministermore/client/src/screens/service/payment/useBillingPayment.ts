import { useCallback, useEffect, useState } from 'react';
import {
  buildPortOneCustomer,
  digitsFromPhoneParts,
  getOrCreateCustomerId,
} from './paymentConstants';
import {
  extractBillingConflictId,
  logBillingPaymentError,
  requestBillingKeyPayment,
  resolveBillingPaymentError,
  validateBillingCardFields,
} from './billingPayment';
import { recordServiceApply } from './recordServiceApply';
import type { ServicePaymentConfig } from './servicePaymentConfig';
import { useCardForm } from './useCardForm';
import { usePaymentAlert } from './usePaymentAlert';

export type BillingResourceIdField = 'churchMainId' | 'homeinappMainId';

export type BillingPaymentSuccess = {
  resourceId: number | string;
  paymentId: string;
  billingKey: string;
};

export type UseBillingPaymentConfig = {
  payment: ServicePaymentConfig;
  serviceType: 'bookletNotice' | 'homeinapp';
  /** mmservice user_subscriptions.service_type (프론트에서 지정) */
  subscriptionServiceType: string;
  recordServiceType: string;
  portoneCustomerKey: string;
  portoneGuestPrefix: string;
  resourceIdField: BillingResourceIdField;
  userAccount: string;
  ordererName: string;
  phonePrefix: string;
  phoneMid: string;
  phoneLast: string;
  orderTitle: string;
  memo: string;
  churchName?: string;
  recordOrderName?: string;
  buildCustomData?: () => Record<string, unknown>;
  validateBeforePay?: () => string | null;
  buildMemoWithRef?: (resourceId: string) => string;
  errorRewrites?: { test: (s: string) => boolean; ko: string }[];
};

export function useBillingPayment(config: UseBillingPaymentConfig) {
  const cardForm = useCardForm();
  const { alert, alertCopyDone, openErrorAlert, closeAlert, handleAlertCopy } = usePaymentAlert();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<BillingPaymentSuccess | null>(null);

  const closePaymentModal = useCallback(() => {
    setPaymentModalOpen(false);
    setPaymentSuccess(null);
  }, []);

  const handlePaymentSubmit = useCallback(async () => {
    setPaymentLoading(true);
    try {
      const precheck = config.validateBeforePay?.();
      if (precheck) {
        openErrorAlert(precheck, '입력 정보 확인');
        return;
      }

      const phoneDigits = digitsFromPhoneParts(config.phonePrefix, config.phoneMid, config.phoneLast) || '01000000000';
      const customerId = getOrCreateCustomerId(
        config.userAccount,
        config.portoneCustomerKey,
        config.portoneGuestPrefix,
      );
      const customer = buildPortOneCustomer(config.userAccount, config.ordererName, phoneDigits);
      const customData = {
        userAccount: config.userAccount,
        serviceType: config.serviceType,
        subscriptionServiceType: config.subscriptionServiceType,
        plan: 'monthly',
        ...(config.buildCustomData?.() || {}),
      };

      const cardError = validateBillingCardFields(cardForm.cardFields);
      if (cardError) {
        openErrorAlert(cardError, '입력 정보 확인');
        return;
      }

      const payload = await requestBillingKeyPayment({
        customerId,
        customer,
        customData,
        amount: config.payment.totalAmount,
        orderTitle: config.orderTitle.trim(),
        ...cardForm.cardFields,
      });

      if (!payload?.ok || !payload.paymentId || !payload.schedulePaymentId || !payload.billingKey) {
        openErrorAlert('결제 응답이 올바르지 않습니다. 고객센터로 문의해 주세요.', '결제 응답');
        return;
      }

      const rawResourceId = payload[config.resourceIdField];
      if (rawResourceId == null || String(rawResourceId).trim() === '') {
        openErrorAlert('주문 저장에 실패했습니다. 고객센터로 문의해 주세요.', '저장 오류');
        return;
      }
      if (config.resourceIdField === 'churchMainId' && Number.isNaN(Number(rawResourceId))) {
        openErrorAlert('주문 저장에 실패했습니다. 고객센터로 문의해 주세요.', '저장 오류');
        return;
      }

      const resourceIdStr = String(rawResourceId);
      const memoWithRef = config.buildMemoWithRef
        ? config.buildMemoWithRef(resourceIdStr)
        : [config.memo.trim(), `${config.resourceIdField}=${resourceIdStr}`].filter(Boolean).join('\n\n');

      await recordServiceApply({
        serviceType: config.recordServiceType,
        orderName: config.recordOrderName || config.orderTitle.trim() || config.payment.orderName,
        userAccount: config.userAccount.trim(),
        churchName: config.churchName?.trim() || undefined,
        ordererName: config.ordererName.trim(),
        ordererPhone: phoneDigits,
        amount: config.payment.supplyPrice,
        vat: config.payment.vatAmount,
        totalAmount: config.payment.totalAmount,
        paymentStatus: 'paid',
        paymentId: payload.paymentId,
        billingKey: payload.billingKey,
        memo: memoWithRef || undefined,
      });

      setPaymentModalOpen(false);
      setPaymentSuccess({
        resourceId: config.resourceIdField === 'churchMainId' ? Number(rawResourceId) : resourceIdStr,
        paymentId: payload.paymentId,
        billingKey: payload.billingKey,
      });
    } catch (err) {
      logBillingPaymentError(err);
      const conflictId = extractBillingConflictId(err, config.resourceIdField);
      if (conflictId != null && String(conflictId).trim() !== '') {
        setPaymentModalOpen(false);
        setPaymentSuccess({
          resourceId: config.resourceIdField === 'churchMainId' ? Number(conflictId) : String(conflictId).trim(),
          paymentId: '',
          billingKey: '',
        });
        return;
      }
      openErrorAlert(resolveBillingPaymentError(err, config.errorRewrites), '결제 실패');
    } finally {
      setPaymentLoading(false);
    }
  }, [cardForm.cardFields, config, openErrorAlert]);

  useEffect(() => {
    if (!paymentModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => cardForm.panInputRefs.current[0]?.focus());
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [paymentModalOpen, cardForm.panInputRefs]);

  return {
    cardForm,
    paymentLoading,
    paymentModalOpen,
    setPaymentModalOpen,
    closePaymentModal,
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
