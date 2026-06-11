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
  useOneTimePayment,
} from '../payment';
import {
  orderVisibleTabIds,
  presetVisibleTabsForBookletType,
} from '../bookletEvent/createEvent/eventTemplateTypes';
import { generateRetreatPasswd } from './retreatPasswd';
import './RetreatApplyPay.scss';

const BOOKLET_TYPE = 'retreat' as const;

/** 결제 방식·가격 — supplyPrice(공급가)만 수정 */
const PAYMENT = defineServicePaymentConfig({
  kind: 'oneTime',
  supplyPrice: 10_000,
  orderName: '수련회 전단지 제작',
});

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
  const phoneMidRef = useRef<HTMLInputElement | null>(null);
  const phoneLastRef = useRef<HTMLInputElement | null>(null);
  const {
    paymentLoading,
    paymentSuccess: paymentSuccessState,
    alert: retreatAlert,
    alertCopyDone,
    openErrorAlert,
    closeAlert,
    handleAlertCopy,
    handlePaymentSubmit,
  } = useOneTimePayment<RetreatPaymentSuccessState & { paymentId?: string }>({
    payment: PAYMENT,
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
    validateBeforePay: () => {
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
      return null;
    },
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
      [memo.trim(), `eventMainId=${success.eventMainId}`].filter(Boolean).join('\n\n'),
    getPaymentId: (success, fallback) => success.paymentId || fallback,
  });

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
                <div className="event-template-select__plan-cards event-template-select__plan-cards--single">
                  <div className="event-template-select__plan-card event-template-select__plan-card--selected">
                    <p className="event-template-select__plan-card-name">1건 제작</p>
                    <p className="event-template-select__plan-card-price">
                      {PAYMENT.supplyPrice.toLocaleString('ko-KR')}원
                    </p>
                    <p className="event-template-select__plan-card-billing">수련회 전단지 제작 · 3개월 이용</p>
                    <p className="event-template-select__plan-card-vat">(부가세 10% 별도)</p>
                  </div>
                </div>
                <dl className="event-template-select__price-list">
                  <div>
                    <dt>상품 금액</dt>
                    <dd>{PAYMENT.supplyPrice.toLocaleString('ko-KR')}원</dd>
                  </div>
                  <div>
                    <dt>부가세 (10%)</dt>
                    <dd>{PAYMENT.vatAmount.toLocaleString('ko-KR')}원</dd>
                  </div>
                  <div className="is-total">
                    <dt>총 결제금액</dt>
                    <dd>{PAYMENT.totalAmount.toLocaleString('ko-KR')}원</dd>
                  </div>
                </dl>
              </div>

              <div className="event-template-select__footer-wrap">
                <button
                  type="button"
                  className="event-template-select__pay-btn"
                  onClick={handlePaymentSubmit}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? '결제 처리 중...' : '결제하기'}
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
