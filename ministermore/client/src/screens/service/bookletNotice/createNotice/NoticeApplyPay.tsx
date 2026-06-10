import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { FaCheck } from 'react-icons/fa';
import { recoilUserData } from '../../../../RecoilStore';
import './NoticeApplyPay.scss';
import {
  BillingCardModal,
  PaymentErrorAlert,
  PaymentSuccessModal,
  PHONE_PREFIX_OPTIONS,
  defineServicePaymentConfig,
  useBillingPayment,
} from '../../payment';

/** 결제 방식·가격 — supplyPrice(공급가)만 수정 */
const PAYMENT = defineServicePaymentConfig({
  kind: 'billing',
  supplyPrice: 10_000,
  orderName: '모바일 교회 전단지',
});

const NOTICE_PORTONE_CUSTOMER_KEY = 'portone_notice_customer_id';

export default function NoticeApplyPay() {
  const navigate = useNavigate();
  const userData = useRecoilValue(recoilUserData);
  const userAccount = userData?.userAccount || '';

  const [orderTitle, setOrderTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [ordererName, setOrdererName] = useState('');
  /** 전화번호: 셀렉트·가운데·끝을 각각 state로 둠(입력 중 재파싱으로 자리수가 깨지지 않도록) */
  const [phonePrefix, setPhonePrefix] = useState<string>(PHONE_PREFIX_OPTIONS[0]);
  const [phoneMid, setPhoneMid] = useState('');
  const [phoneLast, setPhoneLast] = useState('');
  const phoneMidRef = useRef<HTMLInputElement | null>(null);
  const phoneLastRef = useRef<HTMLInputElement | null>(null);
  const {
    cardForm,
    paymentLoading,
    paymentModalOpen,
    setPaymentModalOpen,
    closePaymentModal,
    paymentSuccess,
    alert: noticeAlert,
    alertCopyDone,
    closeAlert,
    handleAlertCopy,
    handlePaymentSubmit,
  } = useBillingPayment({
    payment: PAYMENT,
    serviceType: 'bookletNotice',
    subscriptionServiceType: 'FLYER',
    recordServiceType: 'bookletNotice',
    portoneCustomerKey: NOTICE_PORTONE_CUSTOMER_KEY,
    portoneGuestPrefix: 'notice_guest',
    resourceIdField: 'churchMainId',
    userAccount,
    ordererName,
    phonePrefix,
    phoneMid,
    phoneLast,
    orderTitle,
    memo,
    recordOrderName: orderTitle.trim() || PAYMENT.orderName,
    buildMemoWithRef: (id) => [memo.trim(), `churchMainId=${id}`].filter(Boolean).join('\n\n'),
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
      document.getElementById('notice-payment-success-confirm')?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [paymentSuccess]);

  const finalizeSuccessfulPayment = useCallback(() => {
    if (!paymentSuccess) return;
    const nextState = { churchMainId: Number(paymentSuccess.resourceId) };
    closePaymentModal();
    navigate('/service/bookletnoticepay/complete', { state: nextState, replace: true });
    window.scrollTo(0, 0);
  }, [closePaymentModal, navigate, paymentSuccess]);

  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (noticeAlert) {
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
  }, [closeAlert, closePaymentModal, noticeAlert, paymentModalOpen, paymentLoading, paymentSuccess, finalizeSuccessfulPayment]);

  return (
    <div className="notice-template-select">
      <div className="notice-template-select__body">
        <div className="notice-template-select__inner">
          {/* 왼쪽: 타이틀 + 주문자정보 */}
          <section className="notice-template-select__form-wrap">
            <h2 className="notice-template-select__form-title">타이틀</h2>
            <div className="notice-template-select__form-block notice-template-select__form-block--title">
              <div className="notice-template-select__form-row">
                <label className="notice-template-select__form-label" htmlFor="notice-order-title">
                  타이틀
                </label>
                <input
                  id="notice-order-title"
                  type="text"
                  className="notice-template-select__input"
                  placeholder="전단지 구분용 제목을 입력하세요"
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                />
              </div>
            </div>

            <h2 className="notice-template-select__form-title">주문자정보</h2>
            <div className="notice-template-select__form-block">
              <div className="notice-template-select__form-row">
                <span className="notice-template-select__form-label">계정</span>
                <span className="notice-template-select__form-value">
                  {userAccount || '(로그인 필요)'}
                </span>
              </div>
              <div className="notice-template-select__form-row">
                <label className="notice-template-select__form-label">이름</label>
                <input
                  type="text"
                  className="notice-template-select__input"
                  placeholder="이름을 입력하세요"
                  value={ordererName}
                  onChange={(e) => setOrdererName(e.target.value)}
                />
              </div>
              <div className="notice-template-select__form-row">
                <label className="notice-template-select__form-label">전화번호</label>
                <div className="notice-template-select__field-with-hint">
                  <div className="notice-template-select__phone-row" role="group" aria-label="전화번호">
                    <select
                      className="notice-template-select__phone-prefix"
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
                    <span className="notice-template-select__phone-sep" aria-hidden>
                      -
                    </span>
                    <input
                      ref={phoneMidRef}
                      type="tel"
                      inputMode="numeric"
                      className="notice-template-select__phone-part"
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
                    <span className="notice-template-select__phone-sep" aria-hidden>
                      -
                    </span>
                    <input
                      ref={phoneLastRef}
                      type="tel"
                      inputMode="numeric"
                      className="notice-template-select__phone-part"
                      maxLength={4}
                      value={phoneLast}
                      onChange={(e) => {
                        const next = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPhoneLast(next);
                      }}
                      aria-label="전화번호 끝자리"
                    />
                  </div>
                  <p className="notice-template-select__form-hint">
                    전화번호를 올바르게 입력하셔야 결제가 됩니다
                  </p>
                </div>
              </div>
            </div>

            <h2 className="notice-template-select__form-title">요청사항</h2>
            <div className="notice-template-select__form-block">
              <div className="notice-template-select__form-row notice-template-select__form-row--memo">
                <label className="notice-template-select__form-label" htmlFor="notice-apply-memo">
                  메모
                </label>
                <textarea
                  id="notice-apply-memo"
                  className="notice-template-select__textarea"
                  rows={5}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="원하시는 메뉴 구성이나 참고 사이트를 적어주세요."
                />
              </div>
            </div>

            <h2 className="notice-template-select__form-title">서비스 안내</h2>
            <div className="notice-template-select__plan-features">
              <div className="notice-template-select__plan-feature-col">
                <p className="notice-template-select__plan-feature-heading">전단지 제작</p>
                <ul className="notice-template-select__plan-feature-list">
                  <li>
                    <FaCheck aria-hidden />
                    <span>모바일·PC 반응형 미리보기</span>
                  </li>
                  <li>
                    <FaCheck aria-hidden />
                    <span>교회 맞춤 템플릿 적용</span>
                  </li>
                  <li>
                    <FaCheck aria-hidden />
                    <span>예배·안내 블록 자유 구성</span>
                  </li>
                  <li>
                    <FaCheck aria-hidden />
                    <span>실시간 저장 및 이어하기</span>
                  </li>
                </ul>
              </div>
              <div className="notice-template-select__plan-feature-col">
                <p className="notice-template-select__plan-feature-heading">공유·연락</p>
                <ul className="notice-template-select__plan-feature-list">
                  <li>
                    <FaCheck aria-hidden />
                    <span>링크·QR로 손쉬운 공유</span>
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
                    <span>성도에게 익숙한 카드형 UI</span>
                  </li>
                </ul>
              </div>
              <div className="notice-template-select__plan-feature-col">
                <p className="notice-template-select__plan-feature-heading">운영 지원</p>
                <ul className="notice-template-select__plan-feature-list">
                  <li>
                    <FaCheck aria-hidden />
                    <span>주문·결제 내역 연동</span>
                  </li>
                  <li>
                    <FaCheck aria-hidden />
                    <span>결제 완료 후 서비스관리자에서 제작</span>
                  </li>
                  <li>
                    <FaCheck aria-hidden />
                    <span>타이틀·주문자 정보 관리</span>
                  </li>
                  <li>
                    <FaCheck aria-hidden />
                    <span>포트원 월 정기결제(빌링키)</span>
                  </li>
                </ul>
              </div>
            </div>

          </section>

          <aside className="notice-template-select__summary-wrap">
            <div className="notice-template-select__summary-card">
              <h2 className="notice-template-select__form-title">결제</h2>
              <div className="notice-template-select__payment-block">
                <h3 className="notice-template-select__plan-section-title">구독 플랜 안내</h3>
                <div className="notice-template-select__plan-cards notice-template-select__plan-cards--single">
                  <div className="notice-template-select__plan-card notice-template-select__plan-card--selected">
                    <p className="notice-template-select__plan-card-name">월간 플랜</p>
                    <p className="notice-template-select__plan-card-price">
                      {PAYMENT.supplyPrice.toLocaleString('ko-KR')}원
                    </p>
                    <p className="notice-template-select__plan-card-billing">1인 / 월 1회 결제</p>
                    <p className="notice-template-select__plan-card-vat">(부가세 10% 별도)</p>
                  </div>
                </div>
                <dl className="notice-template-select__price-list">
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

              <div className="notice-template-select__footer-wrap">
                <button
                  type="button"
                  className="notice-template-select__pay-btn"
                  onClick={() => {
                    setPaymentModalOpen(true);
                  }}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? '결제 처리 중...' : '결제하기'}
                </button>
                <button
                  type="button"
                  className="notice-template-select__back-btn"
                  onClick={() => {
                    navigate('/service/notice');
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
              classPrefix="notice-template-select"
              idPrefix="notice"
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
          classPrefix="notice-template-select"
          titleId="notice-payment-success-title"
          confirmButtonId="notice-payment-success-confirm"
          successLine="확인을 누르면 서비스관리자에서 제작 안내 페이지로 이동합니다."
          onConfirm={finalizeSuccessfulPayment}
        />
      )}

      <PaymentErrorAlert
        classPrefix="notice-template-select"
        alert={noticeAlert}
        alertCopyDone={alertCopyDone}
        onClose={closeAlert}
        onCopy={handleAlertCopy}
      />
    </div>
  );
}
