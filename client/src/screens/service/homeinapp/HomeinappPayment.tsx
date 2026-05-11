import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import axios from 'axios';
import * as PortOne from '@portone/browser-sdk/v2';
import { recoilUserData } from '../../../RecoilStore';
import MainURL from '../../../MainURL';
import './HomeinappPayment.scss';

const BASE_PRICE = 30000;
const VAT = Math.round(BASE_PRICE * 0.1);
const TOTAL = BASE_PRICE + VAT;
const HOMEINAPP_ORDER_NAME = '홈인앱 상세페이지 제작';

type HomeinappBillingResponse = {
  ok: boolean;
  homeinappMainId?: number;
  paymentId?: string;
  billingKey?: string;
  message?: string;
};

async function recordServiceApply(payload: {
  serviceType: string;
  orderName: string;
  userAccount: string;
  churchName: string;
  ordererName: string;
  ordererPhone: string;
  amount: number;
  vat: number;
  totalAmount: number;
  paymentStatus: string;
  paymentId?: string;
  billingKey?: string;
  memo?: string;
}) {
  try {
    await axios.post(`${MainURL}/serviceapply/record`, payload);
  } catch (err) {
    console.error('failed to record service apply (homeinapp):', err);
  }
}

function toWon(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

export default function HomeinappPayment() {
  const navigate = useNavigate();
  const userData = useRecoilValue(recoilUserData);
  const userAccount = userData?.userAccount || '';

  const [churchName, setChurchName] = useState(userData?.authChurch || '');
  const [managerName, setManagerName] = useState(userData?.userNickName || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(userAccount);
  const [memo, setMemo] = useState('');
  const [agree, setAgree] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const canPay = useMemo(() => {
    return !!churchName.trim() && !!managerName.trim() && !!phone.trim() && !!email.trim() && agree;
  }, [agree, churchName, email, managerName, phone]);

  const handlePay = async () => {
    if (!canPay) return;
    const nameTrim = managerName.trim();
    const phoneTrim = phone.trim().replace(/\s/g, '');
    const churchTrim = churchName.trim();
    const accountTrim = email.trim();
    const memoTrim = memo.trim();
    const customerId = `homeinapp_${Date.now()}`;

    setPaymentLoading(true);
    try {
      const issueResponse = await PortOne.requestIssueBillingKey({
        storeId: 'store-ca1b10da-c69c-4054-90ca-9410bf6ecbed',
        channelKey: 'channel-key-9115b093-e87f-41bc-a761-2f69d7fc6f2b',
        billingKeyMethod: 'CARD',
        customer: {
          fullName: nameTrim || userAccount || '주문자',
          phoneNumber: phoneTrim || '01000000000',
          email: accountTrim.includes('@') ? accountTrim : 'noreply@ministermore.co.kr',
        },
        currency: 'CURRENCY_KRW',
        displayAmount: TOTAL,
        issueName: HOMEINAPP_ORDER_NAME,
        issueId: customerId,
      });

      const billingKey = issueResponse?.billingKey;
      if (!billingKey) {
        alert('빌링키 발급에 실패했습니다. 다시 시도해 주세요.');
        return;
      }

      const billingRes = await axios.post<HomeinappBillingResponse>(
        `${MainURL}/paymentbilling/homeinapp/billingkey`,
        {
          billingKey,
          transactionType: 'issue',
          customerId,
          customer: {
            fullName: nameTrim || userAccount || '주문자',
            phoneNumber: phoneTrim || '01000000000',
            email: accountTrim.includes('@') ? accountTrim : 'noreply@ministermore.co.kr',
          },
          amount: TOTAL,
          churchName: churchTrim,
          ordererName: nameTrim,
          ordererPhone: phoneTrim,
          ordererEmail: accountTrim,
          memo: memoTrim,
          userAccount: accountTrim,
          orderTitle: HOMEINAPP_ORDER_NAME,
        }
      );

      if (!billingRes.data?.ok) {
        alert(billingRes.data?.message || '결제는 완료되었지만 주문 저장에 실패했습니다.');
        return;
      }

      await recordServiceApply({
        serviceType: 'homeinapp',
        orderName: HOMEINAPP_ORDER_NAME,
        userAccount: accountTrim,
        churchName: churchTrim,
        ordererName: nameTrim,
        ordererPhone: phoneTrim,
        amount: BASE_PRICE,
        vat: VAT,
        totalAmount: TOTAL,
        paymentStatus: 'paid',
        paymentId: billingRes.data?.paymentId,
        billingKey: billingRes.data?.billingKey,
        memo: memoTrim,
      });

      alert('결제가 완료되었습니다.');
      navigate('/service/homeinapp/complete');
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('homeinapp payment error:', error);
      if (axios.isAxiosError(error) && error.response?.data && typeof error.response.data === 'object') {
        const payload = error.response.data as { message?: string };
        alert(payload.message || '결제 처리 중 오류가 발생했습니다.');
      } else {
        alert('결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="homeinapp-payment">
      <div className="homeinapp-payment__body">
        <div className="homeinapp-payment__inner">
          <section className="homeinapp-payment__form-wrap">
            <div className="homeinapp-payment__form-tabs">
              <button type="button" className="homeinapp-payment__form-tab on">
                주문 정보
              </button>
              <button type="button" className="homeinapp-payment__form-tab" disabled>
                결제 정보
              </button>
            </div>

            <div className="homeinapp-payment__form-block">
              <h3 className="homeinapp-payment__form-block-title">홈인앱 제작 신청 정보</h3>
              <div className="homeinapp-payment__form-grid">
                <label className="homeinapp-payment__label">
                  <span>교회명</span>
                  <input
                    className="homeinapp-payment__input"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    placeholder="교회명을 입력해 주세요"
                  />
                </label>
                <label className="homeinapp-payment__label">
                  <span>담당자명</span>
                  <input
                    className="homeinapp-payment__input"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="담당자명을 입력해 주세요"
                  />
                </label>
                <label className="homeinapp-payment__label">
                  <span>연락처</span>
                  <input
                    className="homeinapp-payment__input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="예) 010-1234-5678"
                  />
                </label>
                <label className="homeinapp-payment__label">
                  <span>계정</span>
                  <input
                    type="text"
                    className="homeinapp-payment__input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="로그인 계정"
                    disabled
                  />
                </label>
                <label className="homeinapp-payment__label homeinapp-payment__label--full">
                  <span>요청사항</span>
                  <textarea
                    className="homeinapp-payment__textarea"
                    rows={5}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="원하시는 메뉴 구성이나 참고 사이트를 적어주세요."
                  />
                </label>
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
                    <p className="homeinapp-payment__plan-card-price">{toWon(BASE_PRICE)}</p>
                    <p className="homeinapp-payment__plan-card-billing">1인 / 월 1회 결제</p>
                    <p className="homeinapp-payment__plan-card-vat">(부가세 10% 별도)</p>
                  </div>
                </div>
                <dl className="homeinapp-payment__price-list">
                  <div>
                    <dt>상품 금액</dt>
                    <dd>{toWon(BASE_PRICE)}</dd>
                  </div>
                  <div>
                    <dt>부가세 (10%)</dt>
                    <dd>{toWon(VAT)}</dd>
                  </div>
                  <div className="is-total">
                    <dt>총 결제금액</dt>
                    <dd>{toWon(TOTAL)}</dd>
                  </div>
                </dl>
              </div>

              <div className="homeinapp-payment__footer-wrap">
                <label className="homeinapp-payment__agree">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                  결제 및 주문 진행에 동의합니다.
                </label>

                <button
                  type="button"
                  className="homeinapp-payment__pay-btn"
                  disabled={!canPay || paymentLoading}
                  onClick={handlePay}
                >
                  {paymentLoading ? '결제 처리 중...' : '결제하기'}
                </button>

                <button
                  type="button"
                  className="homeinapp-payment__back-btn"
                  onClick={() => navigate('/service/homeinapp')}
                >
                  이전으로
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
