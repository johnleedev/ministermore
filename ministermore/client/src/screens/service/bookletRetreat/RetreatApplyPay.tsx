import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { recoilUserData } from '../../../RecoilStore';
import {
  PHONE_PREFIX_OPTIONS,
  PaymentErrorAlert,
  PaymentSuccessModal,
  digitsFromPhoneParts,
  defineServicePaymentConfig,
  recordServiceApply,
  useOneTimePayment,
} from '../payment';
import PaymentAPIURL from '../payment/paymentApi';
import {
  orderVisibleTabIds,
  presetVisibleTabsForBookletType,
} from '../bookletEvent/createEvent/eventTemplateTypes';
import { generateRetreatPasswd } from './retreatPasswd';
import PricingGroupIcon from './PricingGroupIcon';
import {
  RETREAT_INQUIRY_TIER,
  RETREAT_LARGE_TIERS,
  RETREAT_PRICING_CARDS,
  type RetreatPricingCard,
  type RetreatPricingTierId,
  formatRetreatSupplyPrice,
  getCardIdFromTierId,
  getRetreatPricingTier,
  isInquiryTierId,
  isLargeTierId,
} from './retreatPricing';
import './RetreatApplyPay.scss';

const BOOKLET_TYPE = 'retreat' as const;
const ORDER_NAME = '수련회 전단지 제작';

type RetreatPaymentSuccessState = {
  eventMainId: number;
  ordererName: string;
  ordererPhone: string;
  churchName: string;
  passwd: string;
  ownerpw: string;
};

export default function RetreatApplyPay() {
  const navigate = useNavigate();
  const userData = useRecoilValue(recoilUserData);
  const userAccount = userData?.userAccount || '';

  const visibleTabsJson = useMemo(
    () => JSON.stringify(orderVisibleTabIds(new Set(presetVisibleTabsForBookletType(BOOKLET_TYPE)))),
    [],
  );
  const [orderTitle, setOrderTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [churchName, setChurchName] = useState('');
  const [passwd, setPasswd] = useState(() => generateRetreatPasswd());
  const [ownerpw, setOwnerpw] = useState('');
  const [ordererName, setOrdererName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState<string>(PHONE_PREFIX_OPTIONS[0]);
  const [phoneMid, setPhoneMid] = useState('');
  const [phoneLast, setPhoneLast] = useState('');
  const [participantTierId, setParticipantTierId] = useState<RetreatPricingTierId>('up50');
  const [freeApplying, setFreeApplying] = useState(false);
  const phoneMidRef = useRef<HTMLInputElement | null>(null);
  const phoneLastRef = useRef<HTMLInputElement | null>(null);

  const selectedTier = useMemo(
    () => getRetreatPricingTier(participantTierId),
    [participantTierId],
  );
  const selectedCardId = useMemo(
    () => getCardIdFromTierId(participantTierId),
    [participantTierId],
  );
  const isLargeTierSelected = isLargeTierId(participantTierId);
  const isInquiryTierSelected = isInquiryTierId(participantTierId);

  const handlePricingCardSelect = useCallback((card: RetreatPricingCard) => {
    if (card.cardId === '201-plus') {
      setParticipantTierId((prev) => (isLargeTierId(prev) ? prev : '201-300'));
      return;
    }
    if (card.tierId) {
      setParticipantTierId(card.tierId);
    }
  }, []);
  const payment = useMemo(
    () =>
      defineServicePaymentConfig({
        kind: 'oneTime',
        supplyPrice: isInquiryTierSelected ? 0 : selectedTier.supplyPrice,
        orderName: ORDER_NAME,
      }),
    [isInquiryTierSelected, selectedTier.supplyPrice],
  );
  const isFreeOrder = !isInquiryTierSelected && payment.totalAmount === 0;

  const buildParticipantMemoLine = useCallback(
    () =>
      isInquiryTierSelected
        ? `참석 인원: ${selectedTier.label} (운영진 문의)`
        : `참석 인원: ${selectedTier.label} (${selectedTier.priceLabel})`,
    [isInquiryTierSelected, selectedTier.label, selectedTier.priceLabel],
  );

  const validateBeforeApply = useCallback(() => {
    if (isInquiryTierId(participantTierId)) {
      return '1,000명 이상은 운영진에게 문의해 주세요. 결제 신청이 불가합니다.';
    }
    const titleTrim = orderTitle.trim();
    const nameTrim = ordererName.trim();
    const phoneDigits = digitsFromPhoneParts(phonePrefix, phoneMid, phoneLast);
    const churchTrim = churchName.trim();
    const ownerTrim = ownerpw.trim();
    if (!titleTrim || !nameTrim || !phoneDigits) {
      return '타이틀, 이름, 전화번호를 모두 입력해 주세요.';
    }
    if (!churchTrim) return '교회 이름을 입력해 주세요.';
    if (!passwd.trim()) return '비밀번호가 생성되지 않았습니다. 다시 시도해 주세요.';
    if (!ownerTrim) return '관리자 비밀번호를 입력해 주세요.';
    if (!participantTierId) return '예상 참석 인원을 선택해 주세요.';
    return null;
  }, [churchName, orderTitle, ordererName, ownerpw, participantTierId, passwd, phoneLast, phoneMid, phonePrefix]);

  const {
    paymentLoading,
    paymentSuccess: paymentSuccessState,
    alert: retreatAlert,
    alertCopyDone,
    openErrorAlert,
    closeAlert,
    handleAlertCopy,
    handlePaymentSubmit,
    setPaymentSuccess,
  } = useOneTimePayment<RetreatPaymentSuccessState & { paymentId?: string }>({
    payment,
    recordServiceType: 'bookletRetreat',
    subscriptionServiceType: 'FLYER_RETREAT',
    userAccount,
    ordererName,
    phoneDigits: digitsFromPhoneParts(phonePrefix, phoneMid, phoneLast),
    churchName,
    passwd,
    ownerpw,
    memo,
    completePath: '/paymentrequestpay/event/complete-browser',
    validateBeforePay: validateBeforeApply,
    buildCompleteBody: () => ({
      orderTitle: orderTitle.trim(),
      ordererName: ordererName.trim(),
      ordererPhone: digitsFromPhoneParts(phonePrefix, phoneMid, phoneLast),
      userAccount,
      bookletType: BOOKLET_TYPE,
      visibleTabs: visibleTabsJson,
      churchName: churchName.trim(),
      passwd: passwd.trim(),
      ownerpw: ownerpw.trim(),
      participantTier: participantTierId,
      totalAmount: payment.totalAmount,
    }),
    parseSuccess: (data) => {
      const d = data as { ok?: boolean; eventMainId?: number; paymentId?: string };
      if (!d?.ok || d.eventMainId == null || Number.isNaN(Number(d.eventMainId))) return null;
      return {
        eventMainId: Number(d.eventMainId),
        ordererName: ordererName.trim(),
        ordererPhone: digitsFromPhoneParts(phonePrefix, phoneMid, phoneLast),
        churchName: churchName.trim(),
        passwd: passwd.trim(),
        ownerpw: ownerpw.trim(),
        paymentId: d.paymentId,
      };
    },
    parseConflict: (data) => {
      const d = data as { eventMainId?: number };
      if (d?.eventMainId == null || Number.isNaN(Number(d.eventMainId))) return null;
      return {
        eventMainId: Number(d.eventMainId),
        ordererName: ordererName.trim(),
        ordererPhone: digitsFromPhoneParts(phonePrefix, phoneMid, phoneLast),
        churchName: churchName.trim(),
        passwd: passwd.trim(),
        ownerpw: ownerpw.trim(),
        paymentId: '',
      };
    },
    buildRecordMemo: (success) =>
      [memo.trim(), buildParticipantMemoLine(), `eventMainId=${success.eventMainId}`]
        .filter(Boolean)
        .join('\n\n'),
    getPaymentId: (success, fallback) => success.paymentId || fallback,
  });

  const handleFreeApplySubmit = useCallback(async () => {
    const precheck = validateBeforeApply();
    if (precheck) {
      openErrorAlert(precheck, '입력 정보 확인');
      return;
    }

    setFreeApplying(true);
    try {
      const completeRes = await axios.post(`${PaymentAPIURL}/paymentrequestpay/event/complete-free`, {
        orderTitle: orderTitle.trim(),
        ordererName: ordererName.trim(),
        ordererPhone: digitsFromPhoneParts(phonePrefix, phoneMid, phoneLast),
        userAccount,
        bookletType: BOOKLET_TYPE,
        visibleTabs: visibleTabsJson,
        churchName: churchName.trim(),
        passwd: passwd.trim(),
        ownerpw: ownerpw.trim(),
        participantTier: participantTierId,
        serviceType: 'FLYER_RETREAT',
      });

      const d = completeRes.data as { ok?: boolean; eventMainId?: number; paymentId?: string };
      if (!d?.ok || d.eventMainId == null || Number.isNaN(Number(d.eventMainId))) {
        openErrorAlert('신청 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.', '신청 실패');
        return;
      }

      const paymentId = d.paymentId || `free_${Date.now()}`;
      await recordServiceApply({
        serviceType: 'bookletRetreat',
        orderName: ORDER_NAME,
        userAccount,
        churchName: churchName.trim(),
        passwd: passwd.trim(),
        ownerpw: ownerpw.trim(),
        ordererName: ordererName.trim(),
        ordererPhone: digitsFromPhoneParts(phonePrefix, phoneMid, phoneLast),
        amount: 0,
        vat: 0,
        totalAmount: 0,
        paymentStatus: 'free',
        paymentId,
        memo: [memo.trim(), buildParticipantMemoLine(), `eventMainId=${d.eventMainId}`]
          .filter(Boolean)
          .join('\n\n'),
      });

      setPaymentSuccess({
        eventMainId: Number(d.eventMainId),
        ordererName: ordererName.trim(),
        ordererPhone: digitsFromPhoneParts(phonePrefix, phoneMid, phoneLast),
        churchName: churchName.trim(),
        passwd: passwd.trim(),
        ownerpw: ownerpw.trim(),
        paymentId,
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const conflict = err.response.data as { eventMainId?: number; paymentId?: string };
        if (conflict?.eventMainId != null) {
          setPaymentSuccess({
            eventMainId: Number(conflict.eventMainId),
            ordererName: ordererName.trim(),
            ordererPhone: digitsFromPhoneParts(phonePrefix, phoneMid, phoneLast),
            churchName: churchName.trim(),
            passwd: passwd.trim(),
            ownerpw: ownerpw.trim(),
            paymentId: conflict.paymentId || '',
          });
          return;
        }
      }
      console.error('free retreat apply error:', err);
      openErrorAlert('알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', '신청 실패');
    } finally {
      setFreeApplying(false);
    }
  }, [
    buildParticipantMemoLine,
    churchName,
    memo,
    openErrorAlert,
    orderTitle,
    ordererName,
    ownerpw,
    participantTierId,
    passwd,
    phoneLast,
    phoneMid,
    phonePrefix,
    setPaymentSuccess,
    userAccount,
    validateBeforeApply,
    visibleTabsJson,
  ]);

  const handleApplySubmit = useCallback(() => {
    if (isInquiryTierSelected) {
      openErrorAlert('1,000명 이상은 운영진에게 문의해 주세요. 결제 신청이 불가합니다.', '운영진 문의');
      return;
    }
    if (isFreeOrder) {
      void handleFreeApplySubmit();
      return;
    }
    void handlePaymentSubmit();
  }, [
    handleFreeApplySubmit,
    handlePaymentSubmit,
    isFreeOrder,
    isInquiryTierSelected,
    openErrorAlert,
  ]);

  const isSubmitting = paymentLoading || freeApplying;

  const finalizeSuccessfulPayment = useCallback(() => {
    if (!paymentSuccessState) return;
    const nextState = {
      eventMainId: paymentSuccessState.eventMainId,
      ordererName: paymentSuccessState.ordererName,
      ordererPhone: paymentSuccessState.ordererPhone,
      churchName: paymentSuccessState.churchName,
      passwd: paymentSuccessState.passwd,
      ownerpw: paymentSuccessState.ownerpw,
      visibleTabs: JSON.parse(visibleTabsJson),
    };
    navigate('/service/bookletretreatpay/complete', { state: nextState, replace: true });
    window.scrollTo(0, 0);
  }, [navigate, paymentSuccessState, visibleTabsJson]);

  useEffect(() => {
    if (!paymentSuccessState) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [paymentSuccessState]);

  useEffect(() => {
    if (!paymentSuccessState) return;
    const id = requestAnimationFrame(() => {
      document.getElementById('retreat-payment-success-confirm')?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [paymentSuccessState]);

  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (retreatAlert) {
        closeAlert();
        e.preventDefault();
        return;
      }
      if (paymentSuccessState) {
        finalizeSuccessfulPayment();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeAlert, retreatAlert, paymentSuccessState, finalizeSuccessfulPayment]);

  return (
    <div className="event-template-select">
      <div className="event-template-select__body">
        <div className="event-template-select__inner">
          <section className="event-template-select__form-wrap">
            <h2 className="event-template-select__form-title">타이틀</h2>
            <div className="event-template-select__form-block event-template-select__form-block--title">
              <div className="event-template-select__form-row">
                <label className="event-template-select__form-label" htmlFor="retreat-order-title">
                  타이틀
                </label>
                <input
                  id="retreat-order-title"
                  type="text"
                  className="event-template-select__input"
                  placeholder="수련회 전단지 구분용 제목을 입력하세요"
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                />
              </div>
            </div>

            <h2 className="event-template-select__form-title">교회 접속 정보</h2>
            <div className="event-template-select__form-block retreat-apply-pay__church-block">
              <div className="event-template-select__form-row">
                <label className="event-template-select__form-label" htmlFor="retreat-church-name">
                  교회 이름
                </label>
                <div className="event-template-select__field-with-hint">
                  <input
                    id="retreat-church-name"
                    type="text"
                    className="event-template-select__input"
                    placeholder="예) ○○교회"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                  />
                  <p className="event-template-select__form-hint">
                    서비스관리자 로그인에 사용됩니다.
                  </p>
                </div>
              </div>
              <div className="event-template-select__form-row">
                <label className="event-template-select__form-label" htmlFor="retreat-passwd">
                  비밀번호
                </label>
                <div className="event-template-select__field-with-hint">
                  <div className="retreat-apply-pay__passwd-row">
                    <input
                      id="retreat-passwd"
                      type="text"
                      className="event-template-select__input retreat-apply-pay__passwd-input"
                      value={passwd}
                      readOnly
                      aria-readonly
                    />
                    <button
                      type="button"
                      className="retreat-apply-pay__passwd-regen"
                      onClick={() => setPasswd(generateRetreatPasswd())}
                    >
                      다시 생성
                    </button>
                  </div>
                  <p className="event-template-select__form-hint">
                    서비스관리자 로그인에 사용됩니다. 결제 완료 후 안내 화면에서 다시 확인할 수 있습니다.
                  </p>
                </div>
              </div>
              <div className="event-template-select__form-row">
                <label className="event-template-select__form-label" htmlFor="retreat-ownerpw">
                  관리자비번
                </label>
                <div className="event-template-select__field-with-hint">
                  <input
                    id="retreat-ownerpw"
                    type="password"
                    className="event-template-select__input"
                    placeholder="관리자 전용 비밀번호를 입력하세요 (최대8자리)"
                    value={ownerpw}
                    onChange={(e) => {
                      const next = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
                      setOwnerpw(next);
                    }}
                    autoComplete="new-password"
                    inputMode="text"
                    maxLength={8}
                    pattern="[A-Za-z0-9]*"
                  />
                  <p className="event-template-select__form-hint">
                    관리자 로그인 시 추가로 필요합니다. 타인과 공유하지 마세요.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="event-template-select__form-title">참석 인원</h2>
            <div className="retreat-apply-pay__participant-section">
              <div className="retreat-apply-pay__pricing-grid" role="radiogroup" aria-label="예상 참석 인원">
                {RETREAT_PRICING_CARDS.map((card) => {
                  const isSelected = selectedCardId === card.cardId;
                  return (
                    <button
                      key={card.cardId}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`retreat-apply-pay__pricing-card${
                        card.variant === 'free' ? ' retreat-apply-pay__pricing-card--free' : ''
                      }${isSelected ? ' retreat-apply-pay__pricing-card--selected' : ''}`}
                      onClick={() => handlePricingCardSelect(card)}
                    >
                      {isSelected ? (
                        <span className="retreat-apply-pay__pricing-check" aria-hidden>
                          <svg viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="9" fill="currentColor" />
                            <path
                              d="M6.2 10.2l2.2 2.2 5.4-5.6"
                              stroke="#fff"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      ) : null}
                      {card.badge ? (
                        <div className="retreat-apply-pay__pricing-badge">{card.badge}</div>
                      ) : null}
                      <div className="retreat-apply-pay__pricing-icon">
                        <PricingGroupIcon type={card.icon} />
                      </div>
                      <div className="retreat-apply-pay__pricing-count">{card.count}</div>
                      <div className="retreat-apply-pay__pricing-divider" aria-hidden />
                      <div
                        className={`retreat-apply-pay__pricing-price${
                          card.variant === 'free' ? ' retreat-apply-pay__pricing-price--free' : ''
                        }`}
                      >
                        {card.price}
                      </div>
                    </button>
                  );
                })}
              </div>

              {isLargeTierSelected ? (
                <div className="retreat-apply-pay__large-tier-panel">
                  <div className="retreat-apply-pay__large-tier-head">
                    <span className="retreat-apply-pay__large-tier-head-icon" aria-hidden>
                      <svg viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                        <path
                          d="M5.5 19.5c.8-3.2 3.2-5 6.5-5s5.7 1.8 6.5 5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                        <circle cx="17.5" cy="9" r="2" stroke="currentColor" strokeWidth="1.4" />
                        <path
                          d="M15.5 14.5c1.2-.6 2.4-.8 3.6-.4"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <div>
                      <p className="retreat-apply-pay__large-tier-head-title">상세 인원 구간</p>
                      <p className="retreat-apply-pay__large-tier-head-desc">
                        200명 이상 규모에 맞는 요금 구간을 선택해 주세요.
                      </p>
                    </div>
                  </div>
                  <div
                    className="retreat-apply-pay__large-tier-list"
                    role="radiogroup"
                    aria-label="상세 인원 구간"
                  >
                    {RETREAT_LARGE_TIERS.map((tier) => {
                      const isTierSelected = participantTierId === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          role="radio"
                          aria-checked={isTierSelected}
                          className={`retreat-apply-pay__large-tier-option${
                            isTierSelected ? ' retreat-apply-pay__large-tier-option--selected' : ''
                          }`}
                          onClick={() => setParticipantTierId(tier.id)}
                        >
                          <span className="retreat-apply-pay__large-tier-option-radio" aria-hidden>
                            <span className="retreat-apply-pay__large-tier-option-radio-dot" />
                          </span>
                          <span className="retreat-apply-pay__large-tier-option-label">{tier.label}</span>
                          <span className="retreat-apply-pay__large-tier-option-price">{tier.priceLabel}</span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isInquiryTierSelected}
                      className={`retreat-apply-pay__large-tier-option retreat-apply-pay__large-tier-option--inquiry${
                        isInquiryTierSelected ? ' retreat-apply-pay__large-tier-option--selected' : ''
                      }`}
                      onClick={() => setParticipantTierId(RETREAT_INQUIRY_TIER.id)}
                    >
                      <span className="retreat-apply-pay__large-tier-option-radio" aria-hidden>
                        <span className="retreat-apply-pay__large-tier-option-radio-dot" />
                      </span>
                      <span className="retreat-apply-pay__large-tier-option-label">
                        1,000명 이상은 운영진에게 문의해 주세요
                      </span>
                      <span className="retreat-apply-pay__large-tier-option-price retreat-apply-pay__large-tier-option-price--inquiry">
                        문의 필요
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}

              <p className="event-template-select__form-hint retreat-apply-pay__participant-hint">
                참석 인원 기준으로 요금이 적용됩니다. 1회 수련회 기준입니다. 전단지는 제작 후 6개월간 이용 가능합니다.
              </p>
            </div>

            <h2 className="event-template-select__form-title">주문자정보</h2>
            <div className="event-template-select__form-block">
              <div className="event-template-select__form-row">
                <span className="event-template-select__form-label">계정</span>
                <span className="event-template-select__form-value">
                  {userAccount || '(로그인 필요)'}
                </span>
              </div>
              <div className="event-template-select__form-row">
                <label className="event-template-select__form-label">이름</label>
                <input
                  type="text"
                  className="event-template-select__input"
                  placeholder="이름을 입력하세요"
                  value={ordererName}
                  onChange={(e) => setOrdererName(e.target.value)}
                />
              </div>
              <div className="event-template-select__form-row">
                <label className="event-template-select__form-label">전화번호</label>
                <div className="event-template-select__field-with-hint">
                  <div className="event-template-select__phone-row" role="group" aria-label="전화번호">
                    <select
                      className="event-template-select__phone-prefix"
                      value={phonePrefix}
                      onChange={(e) => setPhonePrefix(e.target.value)}
                      aria-label="전화번호 앞자리"
                    >
                      {PHONE_PREFIX_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <span className="event-template-select__phone-sep" aria-hidden>
                      -
                    </span>
                    <input
                      ref={phoneMidRef}
                      type="tel"
                      inputMode="numeric"
                      className="event-template-select__phone-part"
                      maxLength={4}
                      value={phoneMid}
                      onChange={(e) => {
                        const next = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPhoneMid(next);
                        if (next.length === 4) {
                          requestAnimationFrame(() => phoneLastRef.current?.focus());
                        }
                      }}
                      aria-label="전화번호 가운데 자리"
                    />
                    <span className="event-template-select__phone-sep" aria-hidden>
                      -
                    </span>
                    <input
                      ref={phoneLastRef}
                      type="tel"
                      inputMode="numeric"
                      className="event-template-select__phone-part"
                      maxLength={4}
                      value={phoneLast}
                      onChange={(e) => {
                        const next = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPhoneLast(next);
                      }}
                      aria-label="전화번호 끝자리"
                    />
                  </div>
                  <p className="event-template-select__form-hint">
                    전화번호를 올바르게 입력하셔야 결제가 됩니다
                  </p>
                </div>
              </div>
            </div>

            <h2 className="event-template-select__form-title">요청사항</h2>
            <div className="event-template-select__form-block">
              <div className="event-template-select__form-row event-template-select__form-row--memo">
                <label className="event-template-select__form-label" htmlFor="retreat-apply-memo">
                  메모
                </label>
                <textarea
                  id="retreat-apply-memo"
                  className="event-template-select__textarea"
                  rows={5}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="수련회 일정, 장소, 준비물 등 참고할 내용을 적어주세요."
                />
              </div>
            </div>
          </section>

          <aside className="event-template-select__summary-wrap">
            <div className="event-template-select__summary-card">
              <h2 className="event-template-select__form-title">결제</h2>
              <div className="event-template-select__payment-block">
                <h3 className="event-template-select__plan-section-title">수련회 전단지 이용권</h3>
                {isInquiryTierSelected ? (
                  <div className="retreat-apply-pay__inquiry-summary">
                    <p className="retreat-apply-pay__inquiry-summary-title">운영진 문의 필요</p>
                    <p className="retreat-apply-pay__inquiry-summary-text">
                      1,000명 이상 규모는 별도 상담 후 진행됩니다.
                      <br />
                      운영진에게 문의해 주세요.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="event-template-select__plan-cards event-template-select__plan-cards--single">
                      <div className="event-template-select__plan-card event-template-select__plan-card--selected">
                        <p className="event-template-select__plan-card-name">{selectedTier.label}</p>
                        <p className="event-template-select__plan-card-price">
                          {formatRetreatSupplyPrice(payment.supplyPrice)}
                        </p>
                        <p className="event-template-select__plan-card-billing">수련회 전단지 제작 · 3개월 이용</p>
                        <p className="event-template-select__plan-card-vat">
                          {isFreeOrder ? '무료 신청 (결제 없음)' : '(부가세 10% 별도)'}
                        </p>
                      </div>
                    </div>
                    <dl className="event-template-select__price-list">
                      <div>
                        <dt>상품 금액</dt>
                        <dd>{formatRetreatSupplyPrice(payment.supplyPrice)}</dd>
                      </div>
                      <div>
                        <dt>부가세 (10%)</dt>
                        <dd>{payment.vatAmount.toLocaleString('ko-KR')}원</dd>
                      </div>
                      <div className="is-total">
                        <dt>{isFreeOrder ? '총 신청 금액' : '총 결제금액'}</dt>
                        <dd>{formatRetreatSupplyPrice(payment.totalAmount)}</dd>
                      </div>
                    </dl>
                  </>
                )}
              </div>

              <div className="event-template-select__footer-wrap">
                <button
                  type="button"
                  className="event-template-select__pay-btn"
                  onClick={handleApplySubmit}
                  disabled={isSubmitting || isInquiryTierSelected}
                >
                  {isInquiryTierSelected
                    ? '운영진 문의 필요'
                    : isSubmitting
                      ? isFreeOrder
                        ? '신청 처리 중...'
                        : '결제 처리 중...'
                      : isFreeOrder
                        ? '신청하기'
                        : '결제하기'}
                </button>
                <button
                  type="button"
                  className="event-template-select__back-btn"
                  onClick={() => {
                    navigate('/service/retreat');
                    window.scrollTo(0, 0);
                  }}
                >
                  이전으로
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {paymentSuccessState && (
        <PaymentSuccessModal
          classPrefix="event-template-select"
          titleId="retreat-payment-modal-title"
          confirmButtonId="retreat-payment-success-confirm"
          successLine="확인을 누르면 서비스관리자에서 제작 안내 페이지로 이동합니다."
          onConfirm={finalizeSuccessfulPayment}
        />
      )}

      <PaymentErrorAlert
        classPrefix="event-template-select"
        alert={retreatAlert}
        alertCopyDone={alertCopyDone}
        onClose={closeAlert}
        onCopy={handleAlertCopy}
      />
    </div>
  );
}
