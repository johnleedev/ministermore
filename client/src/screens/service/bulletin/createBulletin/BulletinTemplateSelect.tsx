import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import axios from 'axios';
import * as PortOne from '@portone/browser-sdk/v2';
import { FaCheck } from 'react-icons/fa';
import MainURL from '../../../../MainURL';
import { recoilLoginState, recoilUserData } from '../../../../RecoilStore';
import './BulletinTemplateSelect.scss';
import {
  BULLETIN_EDITOR_TABS,
  DEFAULT_BULLETIN_TEMPLATE,
  type BulletinEditorTabId,
} from './bulletinTemplateTypes';

type WorshipService = {
  id: string;
  title: string;
};

const MIN_SERVICE_COUNT = 2;
const BASE_PRICE = 5000;
const EXTRA_PRICE_PER_SERVICE = 1000;
const VAT_RATE = 0.1;

const DEFAULT_SERVICES: WorshipService[] = [
  { id: 'service-1', title: '주일 1부 예배' },
  { id: 'service-2', title: '주일 2-4부 예배' },
];

export default function BulletinTemplateSelect() {
  const navigate = useNavigate();
  const isLogin = useRecoilValue(recoilLoginState);
  const userData = useRecoilValue(recoilUserData);
  const userAccount = userData?.userAccount || '';
  const [orderTitle, setOrderTitle] = useState('');
  const [ordererName, setOrdererName] = useState('');
  const [ordererPhone, setOrdererPhone] = useState('');
  const [services, setServices] = useState<WorshipService[]>(DEFAULT_SERVICES);
  const [selectedServiceId, setSelectedServiceId] = useState(DEFAULT_SERVICES[0].id);
  const [previewTab, setPreviewTab] = useState<BulletinEditorTabId>('main');
  const [serviceInput, setServiceInput] = useState('');
  const [paying, setPaying] = useState(false);

  const templateId = DEFAULT_BULLETIN_TEMPLATE;
  const tabsWrapClass = `bulletin-create__tabs-wrap--${templateId}`;
  const selectedService = services.find((s) => s.id === selectedServiceId) ?? services[0] ?? null;
  const activeTab = previewTab;

  const supplyPrice = useMemo(() => {
    if (services.length <= MIN_SERVICE_COUNT) return BASE_PRICE;
    return BASE_PRICE + (services.length - MIN_SERVICE_COUNT) * EXTRA_PRICE_PER_SERVICE;
  }, [services.length]);
  const paymentPrice = useMemo(() => Math.round(supplyPrice * (1 + VAT_RATE)), [supplyPrice]);

  const addService = useCallback(() => {
    const name = serviceInput.trim();
    if (!name) {
      alert('예배 이름을 입력해 주세요.');
      return;
    }
    const nextIndex = services.length + 1;
    const next: WorshipService = {
      id: `service-${Date.now()}-${nextIndex}`,
      title: name,
    };
    setServices((prev) => [...prev, next]);
    setSelectedServiceId(next.id);
    setServiceInput('');
  }, [serviceInput, services.length]);

  const removeService = useCallback(
    (id: string) => {
      if (services.length <= MIN_SERVICE_COUNT) {
        alert('예배 리스트는 최소 2개가 필요합니다.');
        return;
      }
      setServices((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (!next.some((s) => s.id === selectedServiceId)) {
          setSelectedServiceId(next[0]?.id ?? '');
          setPreviewTab('main');
        }
        return next;
      });
    },
    [selectedServiceId, services.length]
  );

  const handlePayment = useCallback(async () => {
    if (!isLogin) {
      alert('로그인이 필요합니다.');
      return;
    }
    const titleTrim = orderTitle.trim();
    const nameTrim = ordererName.trim();
    const phoneDigits = ordererPhone.trim().replace(/\s/g, '');
    if (!titleTrim || !nameTrim || !phoneDigits) {
      alert('주보 제목, 이름, 연락처를 모두 입력해 주세요.');
      return;
    }
    if (services.length < MIN_SERVICE_COUNT) {
      alert('예배 리스트는 최소 2개 이상 등록해 주세요.');
      return;
    }

    setPaying(true);
    try {
      const customerId = userAccount.trim() || `bulletin_guest_${Date.now()}`;
      const issueResponse = await PortOne.requestIssueBillingKey({
        storeId: 'store-ca1b10da-c69c-4054-90ca-9410bf6ecbed',
        channelKey: 'channel-key-9115b093-e87f-41bc-a761-2f69d7fc6f2b',
        billingKeyMethod: 'CARD',
        customer: {
          fullName: nameTrim,
          phoneNumber: phoneDigits,
          email: userAccount.includes('@') ? userAccount : 'noreply@ministermore.co.kr',
        },
        currency: 'CURRENCY_KRW',
        displayAmount: paymentPrice,
        issueName: titleTrim,
        issueId: customerId,
      });

      await axios.post(`${MainURL}/paymentbilling/billingkey`, {
        billingKey: issueResponse?.billingKey,
        transactionType: 'issue',
        customerId,
        customer: {
          fullName: nameTrim,
          phoneNumber: phoneDigits,
          email: userAccount.includes('@') ? userAccount : 'noreply@ministermore.co.kr',
        },
        amount: paymentPrice,
        customData: {
          userAccount,
          templateId: DEFAULT_BULLETIN_TEMPLATE,
          serviceType: 'bulletin',
          plan: 'monthly',
          worshipServiceCount: services.length,
        },
        orderTitle: titleTrim,
      });

      navigate('/service/bookletbulletincomplete');
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.data) {
        console.error('bulletin payment failed:', e.response.status, e.response.data);
      } else {
        console.error('bulletin payment failed:', e);
      }
      alert('결제에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setPaying(false);
    }
  }, [isLogin, navigate, orderTitle, ordererName, ordererPhone, paymentPrice, services.length, userAccount]);

  return (
    <div className="bulletin-template-select">
      <div className="bulletin-template-select__body">
        <div className="bulletin-template-select__inner">
          <aside className="bulletin-create__preview-wrap" aria-label="샘플 미리보기">
            <div className="bulletin-create__phone-frame">
              <div className="bulletin-create__phone-notch" />
              <div className="bulletin-create__phone-screen">
                <div className="bulletin-create__preview">
                  <div className="bulletin-create__preview-hero">
                    <div className="bulletin-create__preview-hero-image">
                      <div className="bulletin-create__preview-hero-overlay">
                        <p className="bulletin-create__preview-hero-kicker">Sunday Worship Bulletin</p>
                        <h2 className="bulletin-create__preview-hero-title">샘플 교회</h2>
                        <p className="bulletin-create__preview-hero-date">
                          하나님의 말씀으로 이 땅을 섬기게 하소서
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`bulletin-create__preview-tabs ${tabsWrapClass}`}>
                    {BULLETIN_EDITOR_TABS.map((t) => (
                      <div
                        key={t.id}
                        className={`bulletin-create__preview-tab ${activeTab === t.id ? 'on' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setPreviewTab(t.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setPreviewTab(t.id);
                          }
                        }}
                      >
                        {t.label}
                      </div>
                    ))}
                  </div>

                  <div className="bulletin-create__preview-body">
                    {activeTab === 'main' && (
                      <>
                        <p className="bulletin-template-select__preview-title">예배 리스트</p>
                        <div className="bulletin-template-select__service-list">
                          {services.map((service) => (
                            <button
                              key={service.id}
                              type="button"
                              className={`bulletin-template-select__service-btn ${
                                selectedServiceId === service.id ? 'on' : ''
                              }`}
                              onClick={() => {
                                setSelectedServiceId(service.id);
                                setPreviewTab('order');
                              }}
                            >
                              {service.title}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {activeTab === 'order' && selectedService && (
                      <div className="bulletin-template-select__preview-order-box">
                        <p className="bulletin-template-select__preview-order-title">{selectedService.title}</p>
                        <p className="bulletin-template-select__preview-order-desc">
                          선택된 예배의 예배순서가 표시됩니다. (예: 찬양, 기도, 말씀, 축도)
                        </p>
                      </div>
                    )}
                    {activeTab === 'news' && (
                      <div className="bulletin-template-select__preview-order-box">
                        <p className="bulletin-template-select__preview-order-title">교회소식</p>
                        <p className="bulletin-template-select__preview-order-desc">
                          주간 공지, 행사 안내, 새가족 소식을 보여줍니다.
                        </p>
                      </div>
                    )}
                    {activeTab === 'offering' && (
                      <div className="bulletin-template-select__preview-order-box">
                        <p className="bulletin-template-select__preview-order-title">헌금자명단</p>
                        <p className="bulletin-template-select__preview-order-desc">
                          예배별 헌금자 명단이 노출됩니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="bulletin-template-select__form-wrap" aria-label="주문 정보">
            <div className="bulletin-template-select__form-scroll">
              <h2 className="bulletin-template-select__form-title">타이틀</h2>
              <div className="bulletin-template-select__form-block bulletin-template-select__form-block--title">
                <div className="bulletin-template-select__form-row">
                  <label className="bulletin-template-select__form-label" htmlFor="bulletin-order-title">
                    타이틀
                  </label>
                  <input
                    id="bulletin-order-title"
                    type="text"
                    className="bulletin-template-select__input"
                    value={orderTitle}
                    onChange={(e) => setOrderTitle(e.target.value)}
                    placeholder="예: 제○○주 주일예배 주보"
                    autoComplete="off"
                  />
                </div>
              </div>

              <h2 className="bulletin-template-select__form-title">주문자정보</h2>
              <div className="bulletin-template-select__form-block">
                <div className="bulletin-template-select__form-row">
                  <span className="bulletin-template-select__form-label">계정</span>
                  <span className="bulletin-template-select__form-value">
                    {userAccount || '(로그인 필요)'}
                  </span>
                </div>
                <div className="bulletin-template-select__form-row">
                  <label className="bulletin-template-select__form-label" htmlFor="bulletin-order-name">
                    이름
                  </label>
                  <input
                    id="bulletin-order-name"
                    type="text"
                    className="bulletin-template-select__input"
                    value={ordererName}
                    onChange={(e) => setOrdererName(e.target.value)}
                    placeholder="담당자 이름"
                    autoComplete="name"
                  />
                </div>
                <div className="bulletin-template-select__form-row">
                  <label className="bulletin-template-select__form-label" htmlFor="bulletin-order-phone">
                    전화번호
                  </label>
                  <input
                    id="bulletin-order-phone"
                    type="text"
                    inputMode="tel"
                    className="bulletin-template-select__input"
                    value={ordererPhone}
                    onChange={(e) => setOrdererPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <h2 className="bulletin-template-select__form-title">예배 리스트</h2>
              <div className="bulletin-template-select__form-block">
                <div className="bulletin-template-select__service-config">
                  <p className="bulletin-template-select__service-config-title">예배 추가</p>
                  <div className="bulletin-template-select__service-config-add">
                    <input
                      type="text"
                      value={serviceInput}
                      onChange={(e) => setServiceInput(e.target.value)}
                      placeholder="예: 수요예배"
                    />
                    <button type="button" onClick={addService}>
                      추가
                    </button>
                  </div>
                  <ul className="bulletin-template-select__service-config-list">
                    {services.map((service) => (
                      <li key={service.id}>
                        <span>{service.title}</span>
                        <button type="button" onClick={() => removeService(service.id)}>
                          삭제
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bulletin-template-select__payment-block">
                <h3 className="bulletin-template-select__plan-section-title">구독 플랜 안내</h3>
                <div className="bulletin-template-select__plan-cards bulletin-template-select__plan-cards--single">
                  <div className="bulletin-template-select__plan-card bulletin-template-select__plan-card--selected">
                    <p className="bulletin-template-select__plan-card-name">월간 플랜</p>
                    <p className="bulletin-template-select__plan-card-price">
                      {supplyPrice.toLocaleString('ko-KR')}원
                    </p>
                    <p className="bulletin-template-select__plan-card-billing">
                      예배 리스트 {services.length}개 / 월 1회 결제
                    </p>
                    <p className="bulletin-template-select__plan-card-vat">(부가세 10% 별도)</p>
                    <span className="bulletin-template-select__plan-select bulletin-template-select__plan-select--outline bulletin-template-select__plan-select--selected">
                      이 플랜 선택
                    </span>
                  </div>
                </div>

                <div className="bulletin-template-select__plan-features">
                  <div className="bulletin-template-select__plan-feature-col">
                    <p className="bulletin-template-select__plan-feature-heading">주보 구성</p>
                    <ul className="bulletin-template-select__plan-feature-list">
                      <li>
                        <FaCheck aria-hidden />
                        <span>메인/예배순서/교회소식/헌금자명단 4탭</span>
                      </li>
                      <li>
                        <FaCheck aria-hidden />
                        <span>예배 리스트 항목 선택 시 순서 탭 전환</span>
                      </li>
                      <li>
                        <FaCheck aria-hidden />
                        <span>모바일 미리보기 실시간 확인</span>
                      </li>
                      <li>
                        <FaCheck aria-hidden />
                        <span>예배 리스트 직접 추가/삭제 가능</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bulletin-template-select__plan-feature-col">
                    <p className="bulletin-template-select__plan-feature-heading">요금 정책</p>
                    <ul className="bulletin-template-select__plan-feature-list">
                      <li>
                        <FaCheck aria-hidden />
                        <span>최소 2개까지 월 5,000원</span>
                      </li>
                      <li>
                        <FaCheck aria-hidden />
                        <span>3개 월 6,000원 / 4개 월 7,000원</span>
                      </li>
                      <li>
                        <FaCheck aria-hidden />
                        <span>예배 1개 추가 시 1,000원 증가</span>
                      </li>
                      <li>
                        <FaCheck aria-hidden />
                        <span>결제 금액: {paymentPrice.toLocaleString('ko-KR')}원(VAT 포함)</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bulletin-template-select__plan-feature-col">
                    <p className="bulletin-template-select__plan-feature-heading">결제/운영</p>
                    <ul className="bulletin-template-select__plan-feature-list">
                      <li>
                        <FaCheck aria-hidden />
                        <span>포트원 빌링키 기반 월 정기결제</span>
                      </li>
                      <li>
                        <FaCheck aria-hidden />
                        <span>결제 완료 시 작성 단계를 건너뜀</span>
                      </li>
                      <li>
                        <FaCheck aria-hidden />
                        <span>완료 페이지에서 마이페이지 관리 안내</span>
                      </li>
                      <li>
                        <FaCheck aria-hidden />
                        <span>서비스 관리에서 이후 수정/운영</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bulletin-template-select__form-footer">
              <button
                type="button"
                className="bulletin-template-select__submit"
                // onClick={handlePayment}
                onClick={() => {
                  navigate('/service/bookletbulletincomplete');
                }}
                disabled={paying}
              >
                {paying ? '결제 처리 중...' : '결제 후 완료하기'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
