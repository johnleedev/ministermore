import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { FaCheck } from 'react-icons/fa';
import { recoilUserData } from '../../../RecoilStore';
import './HomeinappPayment.scss';
import {
  BillingCardModal,
  PaymentErrorAlert,
  PaymentSuccessModal,
  PHONE_PREFIX_OPTIONS,
  defineServicePaymentConfig,
  useBillingPayment,
} from '../payment';

/** 결제 방식·가격 — supplyPrice(공급가)만 수정 */
const PAYMENT = defineServicePaymentConfig({
  kind: 'billing',
  supplyPrice: 30_000,
  orderName: '홈인앱 상세페이지 제작',
});
const HOMEINAPP_PORTONE_CUSTOMER_KEY = 'portone_homeinapp_customer_id';

const HOMEINAPP_BILLING_ERROR_REWRITES = [
  {
    test: (s: string) => s.includes('홈인앱') && (s.includes('저장') || s.includes('실패')),
    ko: '결제는 완료되었으나 홈인앱 주문 저장에 실패했습니다. 고객센터로 문의해 주세요.',
  },
  {
    test: (s: string) => s.includes('이미') && s.includes('홈인앱'),
    ko: '이미 이 결제로 홈인앱 주문이 있을 수 있습니다. 고객센터로 문의해 주세요.',
  },
];

export default function HomeinappPayment() {
  const navigate = useNavigate();
  const userData = useRecoilValue(recoilUserData);
  const userAccount = userData?.userAccount || '';

  const [churchName, setChurchName] = useState(userData?.authChurch || '');
  const [ordererName, setOrdererName] = useState(userData?.userNickName || '');
  const [phonePrefix, setPhonePrefix] = useState<string>(PHONE_PREFIX_OPTIONS[0]);
  const [phoneMid, setPhoneMid] = useState('');
  const [phoneLast, setPhoneLast] = useState('');
  const phoneMidRef = useRef<HTMLInputElement | null>(null);
  const phoneLastRef = useRef<HTMLInputElement | null>(null);
  const [lilnkUrl, setLilnkUrl] = useState('');
  const [memo, setMemo] = useState('');
  const {
    cardForm,
    paymentLoading,
    paymentModalOpen,
    setPaymentModalOpen,
    closePaymentModal,
    paymentSuccess,
    alert: homeinappAlert,
    alertCopyDone,
    closeAlert,
    handleAlertCopy,
    handlePaymentSubmit,
  } = useBillingPayment({
    payment: PAYMENT,
    serviceType: 'homeinapp',
    subscriptionServiceType: 'PUSH',
    recordServiceType: 'homeinapp',
    portoneCustomerKey: HOMEINAPP_PORTONE_CUSTOMER_KEY,
    portoneGuestPrefix: 'homeinapp_guest',
    resourceIdField: 'homeinappMainId',
    userAccount,
    ordererName,
    phonePrefix,
    phoneMid,
    phoneLast,
    orderTitle: memo,
    memo,
    churchName,
    recordOrderName: PAYMENT.orderName,
    validateBeforePay: () => {
      if (!churchName.trim() || !ordererName.trim()) {
        return '교회명과 담당자명을 입력해 주세요.';
      }
      return null;
    },
    buildCustomData: () => {
      const churchTrim = churchName.trim();
      const lilnkUrlTrim = lilnkUrl.trim().slice(0, 2048);
      return {
        churchName: churchTrim,
        ...(lilnkUrlTrim ? { lilnkUrl: lilnkUrlTrim } : {}),
      };
    },
    buildMemoWithRef: (id) => [memo.trim(), `homeinappMainId=${id}`].filter(Boolean).join('\n\n'),
    errorRewrites: HOMEINAPP_BILLING_ERROR_REWRITES,
  });

  useEffect(() => {
    if (!paymentSuccess) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [paymentSuccess]);

  useEffect(() => {
    if (!paymentSuccess) return;
    const id = requestAnimationFrame(() => {
      document.getElementById('homeinapp-payment-success-confirm')?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [paymentSuccess]);

  const finalizeSuccessfulPayment = useCallback(() => {
    if (!paymentSuccess) return;
    const nextState = { homeinappMainId: String(paymentSuccess.resourceId) };
    closePaymentModal();
    navigate('/service/homeinapp/complete', { state: nextState, replace: true });
    window.scrollTo(0, 0);
  }, [closePaymentModal, navigate, paymentSuccess]);

  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (homeinappAlert) {
        closeAlert();
        e.preventDefault();
        return;
      }
      if (paymentSuccess) {
        finalizeSuccessfulPayment();
        e.preventDefault();
        return;
      }
      if (paymentModalOpen && !paymentLoading) {
        closePaymentModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeAlert, closePaymentModal, homeinappAlert, paymentModalOpen, paymentLoading, paymentSuccess, finalizeSuccessfulPayment]);

  return (
    <div className="homeinapp-payment">
      <div className="homeinapp-payment__body">
        <div className="homeinapp-payment__inner">
          <section className="homeinapp-payment__form-wrap">
            <h2 className="homeinapp-payment__form-title">주문 정보</h2>
            <div className="homeinapp-payment__form-block homeinapp-payment__form-block--title">
              <div className="homeinapp-payment__form-row">
                <label className="homeinapp-payment__form-label" htmlFor="homeinapp-church-name">
                  교회명
                </label>
                <input
                  id="homeinapp-church-name"
                  type="text"
                  className="homeinapp-payment__input"
                  placeholder="교회명을 입력하세요"
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                />
              </div>
            </div>

            <h2 className="homeinapp-payment__form-title">주문자정보</h2>
            <div className="homeinapp-payment__form-block">
              <div className="homeinapp-payment__form-row">
                <span className="homeinapp-payment__form-label">계정</span>
                <span className="homeinapp-payment__form-value">
                  {userAccount || '(로그인 필요)'}
                </span>
              </div>
              <div className="homeinapp-payment__form-row">
                <label className="homeinapp-payment__form-label" htmlFor="homeinapp-orderer-name">
                  담당자명
                </label>
                <input
                  id="homeinapp-orderer-name"
                  type="text"
                  className="homeinapp-payment__input"
                  placeholder="담당자명을 입력하세요"
                  value={ordererName}
                  onChange={(e) => setOrdererName(e.target.value)}
                />
              </div>
              <div className="homeinapp-payment__form-row">
                <label className="homeinapp-payment__form-label">전화번호</label>
                <div className="homeinapp-payment__field-with-hint">
                  <div className="homeinapp-payment__phone-row" role="group" aria-label="전화번호">
                    <select
                      className="homeinapp-payment__phone-prefix"
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
                    <span className="homeinapp-payment__phone-sep" aria-hidden>
                      -
                    </span>
                    <input
                      ref={phoneMidRef}
                      type="tel"
                      inputMode="numeric"
                      className="homeinapp-payment__phone-part"
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
                    <span className="homeinapp-payment__phone-sep" aria-hidden>
                      -
                    </span>
                    <input
                      ref={phoneLastRef}
                      type="tel"
                      inputMode="numeric"
                      className="homeinapp-payment__phone-part"
                      maxLength={4}
                      value={phoneLast}
                      onChange={(e) => {
                        const next = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPhoneLast(next);
                      }}
                      aria-label="전화번호 끝자리"
                    />
                  </div>
                  <p className="homeinapp-payment__form-hint">
                    전화번호를 올바르게 입력하셔야 결제가 됩니다
                  </p>
                </div>
              </div>
            </div>

            <h2 className="homeinapp-payment__form-title">참조url</h2>
            <div className="homeinapp-payment__form-block homeinapp-payment__form-block--reference-url">
              <div className="homeinapp-payment__form-row">
                <label className="homeinapp-payment__form-label" htmlFor="homeinapp-lilnk-url">
                  URL
                </label>
                <input
                  id="homeinapp-lilnk-url"
                  type="url"
                  inputMode="url"
                  className="homeinapp-payment__input"
                  placeholder="참고할 페이지 주소 (https://…)"
                  value={lilnkUrl}
                  onChange={(e) => setLilnkUrl(e.target.value)}
                  autoComplete="url"
                />
              </div>
            </div>

            <h2 className="homeinapp-payment__form-title">요청사항</h2>
            <div className="homeinapp-payment__form-block">
              <div className="homeinapp-payment__form-row homeinapp-payment__form-row--memo">
                <label className="homeinapp-payment__form-label" htmlFor="homeinapp-memo">
                  메모
                </label>
                <textarea
                  id="homeinapp-memo"
                  className="homeinapp-payment__textarea"
                  rows={5}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="원하시는 메뉴 구성이나 참고 사이트를 적어주세요."
                />
              </div>
            </div>

            <h2 className="homeinapp-payment__form-title">서비스 안내</h2>
            <div className="homeinapp-payment__plan-features">
              <div className="homeinapp-payment__plan-feature-col">
                <p className="homeinapp-payment__plan-feature-heading">제작</p>
                <ul className="homeinapp-payment__plan-feature-list">
                  <li>
                    <FaCheck aria-hidden />
                    <span>교회 맞춤 상세페이지 구성</span>
                  </li>
                  <li>
                    <FaCheck aria-hidden />
                    <span>모바일·PC 반응형</span>
                  </li>
                  <li>
                    <FaCheck aria-hidden />
                    <span>메뉴·콘텐츠 블록 구성</span>
                  </li>
                  <li>
                    <FaCheck aria-hidden />
                    <span>실시간 저장 및 이어하기</span>
                  </li>
                </ul>
              </div>
              <div className="homeinapp-payment__plan-feature-col">
                <p className="homeinapp-payment__plan-feature-heading">연동</p>
                <ul className="homeinapp-payment__plan-feature-list">
                  <li>
                    <FaCheck aria-hidden />
                    <span>앱·웹 연계 구조</span>
                  </li>
                  <li>
                    <FaCheck aria-hidden />
                    <span>SNS·지도 버튼 연결</span>
                  </li>
                  <li>
                    <FaCheck aria-hidden />
                    <span>문의처·교회 정보 표시</span>
                  </li>
                  <li>
                    <FaCheck aria-hidden />
                    <span>성도에게 익숙한 UI</span>
                  </li>
                </ul>
              </div>
              <div className="homeinapp-payment__plan-feature-col">
                <p className="homeinapp-payment__plan-feature-heading">결제·운영</p>
                <ul className="homeinapp-payment__plan-feature-list">
                  <li>
                    <FaCheck aria-hidden />
                    <span>주문·결제 내역 연동</span>
                  </li>
                  <li>
                    <FaCheck aria-hidden />
                    <span>월 정기결제(빌링키)</span>
                  </li>
                  <li>
                    <FaCheck aria-hidden />
                    <span>담당자·교회 정보 관리</span>
                  </li>
                  <li>
                    <FaCheck aria-hidden />
                    <span>포트원 서버 빌링 연동</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <aside className="homeinapp-payment__summary-wrap">
            <div className="homeinapp-payment__summary-card">
              <h2 className="homeinapp-payment__form-title">결제</h2>
              <div className="homeinapp-payment__payment-block">
                <h3 className="homeinapp-payment__plan-section-title">구독 플랜 안내</h3>
                <div className="homeinapp-payment__plan-cards homeinapp-payment__plan-cards--single">
                  <div className="homeinapp-payment__plan-card homeinapp-payment__plan-card--selected">
                    <p className="homeinapp-payment__plan-card-name">월간 플랜</p>
                    <p className="homeinapp-payment__plan-card-price">
                      {PAYMENT.supplyPrice.toLocaleString('ko-KR')}원
                    </p>
                    <p className="homeinapp-payment__plan-card-billing">1인 / 월 1회 결제</p>
                    <p className="homeinapp-payment__plan-card-vat">(부가세 10% 별도)</p>
                  </div>
                </div>
                <dl className="homeinapp-payment__price-list">
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

              <div className="homeinapp-payment__footer-wrap">
                <button
                  type="button"
                  className="homeinapp-payment__pay-btn"
                  onClick={() => {
                    setPaymentModalOpen(true);
                  }}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? '결제 처리 중...' : '결제하기'}
                </button>
                <button
                  type="button"
                  className="homeinapp-payment__back-btn"
                  onClick={() => {
                    navigate('/service/homeinapp');
                    window.scrollTo(0, 0);
                  }}
                >
                  이전으로
                </button>
              </div>
            </div>
          </aside>

          {paymentModalOpen && !paymentSuccess && (
            <BillingCardModal
              classPrefix="homeinapp-payment"
              idPrefix="homeinapp"
              open
              loading={paymentLoading}
              supplyPrice={PAYMENT.supplyPrice}
              totalAmount={PAYMENT.totalAmount}
              cardForm={cardForm}
              onClose={closePaymentModal}
              onSubmit={handlePaymentSubmit}
            />
          )}
        </div>
      </div>

      {paymentSuccess && (
        <PaymentSuccessModal
          classPrefix="homeinapp-payment"
          titleId="homeinapp-payment-success-title"
          confirmButtonId="homeinapp-payment-success-confirm"
          successLine="확인을 누르면 완료 안내 화면으로 이동합니다."
          onConfirm={finalizeSuccessfulPayment}
        />
      )}

      <PaymentErrorAlert
        classPrefix="homeinapp-payment"
        alert={homeinappAlert}
        alertCopyDone={alertCopyDone}
        onClose={closeAlert}
        onCopy={handleAlertCopy}
      />
    </div>
  );
}
