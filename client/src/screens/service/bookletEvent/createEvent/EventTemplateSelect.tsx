import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import axios from 'axios';
import MainURL from '../../../../MainURL';
import { requestEventBookletPayment } from '../../../../payment/portonePayment';
import { recoilUserData } from '../../../../RecoilStore';
import { FaChevronRight, FaChevronDown, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import naverlogo from '../../../../images/login/naver.png';
import kakaologo from '../../../../images/login/kakao.png';
import './EventTemplateSelect.scss';
import type { EventTemplateId } from './eventTemplateTypes';
import {
  TEMPLATE_EVENT_ORDER,
  type EventBlockId,
  type EventBookletTypeId,
  type EventVisibleTabId,
  EVENT_BOOKLET_TYPE_DEFS,
  presetVisibleTabsForBookletType,
  EVENT_VISIBLE_TAB_LABELS,
  EVENT_TAB_PICKER_ORDER,
  EVENT_TAB_PICKER_DETAIL,
  orderVisibleTabIds,
  MAX_EVENT_VISIBLE_TAB_COUNT,
} from './eventTemplateTypes';

export type { EventTemplateId };

/** 템플릿 선택 UI 제거 — 제작·미리보기 기본값 */
const DEFAULT_EVENT_TEMPLATE: EventTemplateId = 'classic';

/** 행사 전단지 1건 공급가액(원) */
const EVENT_TEMPLATE_PRICE = 1000;
const EVENT_TEMPLATE_VAT_RATE = 0.1;
const EVENT_TEMPLATE_PRICE_WITH_VAT = Math.round(EVENT_TEMPLATE_PRICE * (1 + EVENT_TEMPLATE_VAT_RATE));

/** `portonePayment.requestEventBookletPayment` · 서버 검증과 동일한 주문명 */
const EVENT_ORDER_NAME = '행사 전단지 제작';

type CompleteBrowserSuccessResponse = {
  ok: true;
  paymentId: string;
  eventMainId: number;
};

type EventAlertState = {
  title: string;
  message: string;
};

/** 결제 성공 후 확인 시 제작 화면으로 넘길 정보 */
type EventPaymentSuccessState = {
  eventMainId: number;
  ordererName: string;
  ordererPhone: string;
};

type ServerErrorPayload = { message?: string; ok?: boolean };

function serverErrorToKorean(payload: ServerErrorPayload | undefined, axiosMessage?: string): string {
  const msg = typeof payload?.message === 'string' ? payload.message.trim() : '';
  if (msg && /^[\s가-힣0-9.,!?()[\]·\-'"%…]+$/.test(msg) && msg.length >= 2) {
    return msg;
  }
  if (axiosMessage && /network|econnrefused|timeout/i.test(axiosMessage)) {
    return '서버에 연결할 수 없습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.';
  }
  return '처리 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 고객센터로 문의해 주세요.';
}

export default function EventTemplateSelect() {
  const navigate = useNavigate();
  const userData = useRecoilValue(recoilUserData);
  const userAccount = userData?.userAccount || '';

  const [selectedBookletType, setSelectedBookletType] = useState<EventBookletTypeId>('ordination');
  const [selectedTabSet, setSelectedTabSet] = useState<Set<EventVisibleTabId>>(
    () => new Set(presetVisibleTabsForBookletType('ordination'))
  );
  const [tabHelpOpen, setTabHelpOpen] = useState<Partial<Record<EventVisibleTabId, boolean>>>({});
  const [orderTitle, setOrderTitle] = useState('');
  const [ordererName, setOrdererName] = useState('');
  const [ordererPhone, setOrdererPhone] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccessState, setPaymentSuccessState] = useState<EventPaymentSuccessState | null>(null);
  const [eventAlert, setEventAlert] = useState<EventAlertState | null>(null);
  const [alertCopyDone, setAlertCopyDone] = useState(false);

  const openErrorAlert = (message: string, title = '안내') => {
    setAlertCopyDone(false);
    const m = String(message ?? '').trim() || '알 수 없는 오류';
    setEventAlert({ title: (title || '안내').trim() || '안내', message: m });
  };

  const handleAlertCopy = async () => {
    if (!eventAlert) return;
    try {
      await navigator.clipboard.writeText(eventAlert.message);
      setAlertCopyDone(true);
      window.setTimeout(() => setAlertCopyDone(false), 2200);
    } catch {
      setAlertCopyDone(false);
    }
  };

  const handlePaymentSubmit = async () => {
    const titleTrim = orderTitle.trim();
    const nameTrim = ordererName.trim();
    const phoneDigits = ordererPhone.trim().replace(/\s/g, '');
    if (!titleTrim || !nameTrim || !phoneDigits) {
      openErrorAlert('타이틀, 이름, 전화번호를 모두 입력해 주세요.', '입력 정보 확인');
      return;
    }

    setPaymentLoading(true);
    try {
      const customer = {
        fullName: nameTrim || userAccount || '주문자',
        phoneNumber: phoneDigits || '01000000000',
        email: userAccount.includes('@') ? userAccount : 'noreply@ministermore.co.kr',
        
      };
      const visibleTabsJson = JSON.stringify(orderVisibleTabIds(selectedTabSet));

      const payResult = await requestEventBookletPayment({
        orderName: EVENT_ORDER_NAME,
        totalAmount: EVENT_TEMPLATE_PRICE_WITH_VAT,
        customer
      });

      if (!payResult.ok) {
        openErrorAlert(payResult.message, '결제');
        return;
      }

      const completeRes = await axios.post<CompleteBrowserSuccessResponse>(
        `${MainURL}/paymentrequestpay/event/complete-browser`,
        {
          paymentId: payResult.paymentId,
          txId: payResult.txId,
          /** 서버가 PortOne 승인 금액과 동일한지 검증 (클라이언트 `EVENT_TEMPLATE_PRICE_WITH_VAT` 와 맞출 것) */
          totalAmount: EVENT_TEMPLATE_PRICE_WITH_VAT,
          orderTitle: titleTrim,
          ordererName: nameTrim,
          ordererPhone: phoneDigits,
          userAccount,
          templateId: DEFAULT_EVENT_TEMPLATE,
          bookletType: selectedBookletType,
          visibleTabs: visibleTabsJson,
        },
      );

      const data = completeRes.data;
      if (!data?.ok || data.eventMainId == null || Number.isNaN(Number(data.eventMainId))) {
        openErrorAlert('행사 전단지 저장에 실패했습니다. 고객센터로 문의해 주세요.', '저장 오류');
        return;
      }

      setPaymentSuccessState({
        eventMainId: Number(data.eventMainId),
        ordererName: nameTrim,
        ordererPhone: phoneDigits,
      });
    } catch (err) {
      console.error('event payment error:', err);
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const d = err.response.data as { eventMainId?: number };
        if (d?.eventMainId != null && !Number.isNaN(Number(d.eventMainId))) {
          setPaymentSuccessState({
            eventMainId: Number(d.eventMainId),
            ordererName: ordererName.trim(),
            ordererPhone: ordererPhone.trim().replace(/\s/g, ''),
          });
          return;
        }
      }
      let friendly: string;
      if (axios.isAxiosError(err)) {
        if (err.response?.data && typeof err.response.data === 'object') {
          friendly = serverErrorToKorean(err.response.data as ServerErrorPayload, err.message);
        } else if (!err.response) {
          friendly = '서버에 연결할 수 없습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.';
        } else {
          friendly = serverErrorToKorean(undefined, err.message);
        }
      } else {
        friendly = '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      }
      openErrorAlert(friendly, '결제 실패');
    } finally {
      setPaymentLoading(false);
    }
  };

  const finalizeSuccessfulPayment = useCallback(() => {
    if (!paymentSuccessState) return;
    const q = new URLSearchParams({
      id: String(paymentSuccessState.eventMainId),
      template: DEFAULT_EVENT_TEMPLATE,
    });
    q.set('visibleTabs', JSON.stringify(orderVisibleTabIds(selectedTabSet)));
    if (paymentSuccessState.ordererName) q.set('ordererName', paymentSuccessState.ordererName);
    if (paymentSuccessState.ordererPhone) q.set('ordererPhone', paymentSuccessState.ordererPhone);
    setPaymentSuccessState(null);
    navigate(`/service/bookleteventcreate?${q.toString()}`);
    window.scrollTo(0, 0);
  }, [navigate, paymentSuccessState, selectedTabSet]);

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
      document.getElementById('event-payment-success-confirm')?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [paymentSuccessState]);

  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (eventAlert) {
        setEventAlert(null);
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
  }, [eventAlert, paymentSuccessState, finalizeSuccessfulPayment]);

  const eventOrder = TEMPLATE_EVENT_ORDER['classic'] as EventBlockId[];
  const sampleEvent = { eventName: '행사명', date: '2025-01-15', place: '본당', superViser: '주관', address: '서울시 강남구' };
  const previewTabIds = orderVisibleTabIds(selectedTabSet);
  const previewTabs = previewTabIds.map((id) => ({
    id,
    label: EVENT_VISIBLE_TAB_LABELS[id],
  }));
  const showProgramSampleInIntro = previewTabIds.includes('program');

  const setTabIncluded = (id: EventVisibleTabId, include: boolean) => {
    if (id === 'info') return;
    setSelectedTabSet((prev) => {
      const next = new Set(prev);
      if (include) {
        if (next.size >= MAX_EVENT_VISIBLE_TAB_COUNT && !next.has(id)) {
          openErrorAlert('탭은 소개를 포함해 최대 4개까지 선택할 수 있습니다.', '탭 선택');
          return prev;
        }
        next.add(id);
      } else {
        next.delete(id);
      }
      next.add('info');
      return next;
    });
  };

  return (
    <div className="event-template-select">
      <div className="event-template-select__body">
        <div className="event-template-select__inner">
          <aside className="event-create__preview-wrap">
            <div className="event-create__phone-frame">
              <div className="event-create__phone-notch" />
              <div className="event-create__phone-screen">
                <div className="event-create__preview">
                  <div className="event-create__preview-hero">
                    <div className="event-create__preview-hero-placeholder">메인 이미지</div>
                    <div className="event-create__preview-hero-overlay">
                      <p className="event-create__preview-hero-sub">행사</p>
                      <h1 className="event-create__preview-hero-title">행사 로고</h1>
                    </div>
                  </div>

                  <div className={`event-template-select__tabs-wrap event-template-select__tabs-wrap--${DEFAULT_EVENT_TEMPLATE}`}>
                    <div className={`event-create__preview-tabs event-create__preview-tabs--n${previewTabs.length}`}>
                      {previewTabs.map((tab) => (
                        <div
                          key={tab.id}
                          className={`event-create__preview-tab ${tab.id === 'info' ? 'on' : ''}`}
                        >
                          {tab.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`event-create__preview-body event-create__preview-body--${DEFAULT_EVENT_TEMPLATE}`}>
                    {eventOrder.map((blockId: EventBlockId) => {
                      if (blockId === 'eventInfo') {
                        return (
                          <div key="eventInfo" className="event-create__preview-welcome">
                            <p className="event-create__preview-welcome-sub">행사 정보</p>
                            <h2 className="event-create__preview-welcome-title">{sampleEvent.eventName}</h2>
                            <p className="event-create__preview-welcome-desc">
                              {sampleEvent.date} · {sampleEvent.place}
                              <br />
                              주관/주최: {sampleEvent.superViser}
                              <br />
                              주소: {sampleEvent.address}
                            </p>
                          </div>
                        );
                      }
                      if (blockId === 'map') {
                        return (
                          <div key="map">
                            <div className="event-create__preview-section-label">
                              <span className="event-create__preview-chip-icon">📍</span>
                              오시는길
                            </div>
                            <div className="event-create__preview-chips">
                              <div className="event-create__preview-chip">
                                <span className="event-create__preview-chip-icon">📍</span>
                                <div>
                                  <p className="event-create__preview-chip-label">위치</p>
                                  <p className="event-create__preview-chip-value">{sampleEvent.address}</p>
                                </div>
                              </div>
                            </div>
                            <div className="event-create__preview-actions">
                              <div className="event-create__preview-btn-row">
                                <a href="#" className="event-create__preview-btn event-create__preview-btn--naver">
                                  <img src={naverlogo} alt="네이버" className="event-create__preview-map-icon" />
                                  네이버 지도
                                </a>
                                <a href="#" className="event-create__preview-btn event-create__preview-btn--kakao">
                                  <img src={kakaologo} alt="카카오" className="event-create__preview-map-icon" />
                                  카카오 지도
                                </a>
                              </div>
                              <div className="event-create__preview-btn-row">
                                <div className="event-create__preview-btn event-create__preview-btn--secondary">
                                  📞 문의하기
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      if (blockId === 'program') {
                        if (!showProgramSampleInIntro) return null;
                        return (
                          <div key="program" className="event-create__preview-schedule">
                            <div className="event-create__preview-section-label">
                              <span className="event-create__preview-chip-icon">📋</span>
                              프로그램
                            </div>
                            <div className="event-create__preview-worship-list">
                              <div className="event-create__preview-worship-item">
                                <span className="event-create__preview-worship-name">1. 오프닝</span>
                                <span className="event-create__preview-worship-place">14:00</span>
                              </div>
                              <div className="event-create__preview-worship-item">
                                <span className="event-create__preview-worship-name">2. 본 프로그램</span>
                                <span className="event-create__preview-worship-place">14:30</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                    <div className="event-create__preview-footer">
                      <p className="event-create__preview-footer-info">
                        02-1234-5678 | 서울시 강남구
                        <br />
                        © {new Date().getFullYear()} 행사 All Rights Reserved.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="event-template-select__form-wrap">
            <h2 className="event-template-select__form-title">타이틀</h2>
            <div className="event-template-select__form-block event-template-select__form-block--title">
              <div className="event-template-select__form-row">
                <label className="event-template-select__form-label" htmlFor="event-order-title">
                  타이틀
                </label>
                <input
                  id="event-order-title"
                  type="text"
                  className="event-template-select__input"
                  placeholder="전단지 구분용 제목을 입력하세요"
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                />
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
                <input
                  type="tel"
                  className="event-template-select__input"
                  placeholder="전화번호를 입력하세요"
                  value={ordererPhone}
                  onChange={(e) => setOrdererPhone(e.target.value)}
                />
              </div>
            </div>

            <h2 className="event-template-select__form-title">유형 선택</h2>
            <p className="event-template-select__form-desc">
              행사 유형을 고르면 아래 탭 구성이 맞춰집니다. 포함할 탭은 직접 조정할 수 있으며, 제작 화면에서는 탭을 바꿀 수
              없습니다.
            </p>
            <div className="event-template-select__type-row" role="tablist" aria-label="행사 유형">
              {EVENT_BOOKLET_TYPE_DEFS.map((row) => (
                <article
                  key={row.id}
                  role="tab"
                  aria-selected={selectedBookletType === row.id}
                  tabIndex={selectedBookletType === row.id ? 0 : -1}
                  className={`event-template-select__type-card ${selectedBookletType === row.id ? 'on' : ''}`}
                  onClick={() => {
                    setSelectedBookletType(row.id);
                    setSelectedTabSet(new Set(presetVisibleTabsForBookletType(row.id)));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedBookletType(row.id);
                      setSelectedTabSet(new Set(presetVisibleTabsForBookletType(row.id)));
                    }
                  }}
                >
                  <h3 className="event-template-select__type-title">{row.title}</h3>
                </article>
              ))}
            </div>

            <div className="event-template-select__type-tabs-preview">
              <p className="event-template-select__type-tabs-preview-label">탭 포함 여부 (제작 화면과 동일)</p>
              <p className="event-template-select__tab-pick-hint">
                소개는 필수입니다. 포함할 탭은 소개를 포함해 최대 4개까지 선택할 수 있습니다.
              </p>
              <div className="event-template-select__tab-pick-list" role="group" aria-label="전단지에 포함할 탭">
                {EVENT_TAB_PICKER_ORDER.map((tabId) => {
                  const included = selectedTabSet.has(tabId);
                  const isInfo = tabId === 'info';
                  const helpExpanded = !!tabHelpOpen[tabId];
                  const helpId = `event-tab-pick-help-${tabId}`;
                  return (
                    <div key={tabId} className="event-template-select__tab-pick-item">
                      <div className="event-template-select__tab-pick-row">
                        <div className="event-template-select__tab-pick-title-wrap">
                          <span className="event-template-select__tab-pick-title">{EVENT_VISIBLE_TAB_LABELS[tabId]}</span>
                          <button
                            type="button"
                            className="event-template-select__tab-pick-help-toggle"
                            aria-expanded={helpExpanded}
                            aria-controls={helpId}
                            aria-label={`${EVENT_VISIBLE_TAB_LABELS[tabId]} 설명 ${helpExpanded ? '접기' : '펼치기'}`}
                            onClick={() =>
                              setTabHelpOpen((prev) => ({
                                ...prev,
                                [tabId]: !prev[tabId],
                              }))
                            }
                          >
                            <FaChevronDown
                              className={`event-template-select__tab-pick-help-chevron${helpExpanded ? ' is-open' : ''}`}
                              aria-hidden
                            />
                          </button>
                        </div>
                        <div
                          className="event-template-select__tab-pick-radios"
                          role="radiogroup"
                          aria-label={`${EVENT_VISIBLE_TAB_LABELS[tabId]} 포함 여부`}
                        >
                          <label className="event-template-select__tab-pick-radio-label">
                            <input
                              type="radio"
                              className="event-template-select__tab-pick-radio"
                              name={`event-tab-pick-${tabId}`}
                              checked={included}
                              disabled={isInfo}
                              onChange={() => setTabIncluded(tabId, true)}
                            />
                            <span>포함</span>
                          </label>
                          <label
                            className={`event-template-select__tab-pick-radio-label${isInfo ? ' event-template-select__tab-pick-radio-label--disabled' : ''}`}
                          >
                            <input
                              type="radio"
                              className="event-template-select__tab-pick-radio"
                              name={`event-tab-pick-${tabId}`}
                              checked={!included}
                              disabled={isInfo}
                              onChange={() => setTabIncluded(tabId, false)}
                            />
                            <span>제외</span>
                          </label>
                        </div>
                      </div>
                      {helpExpanded ? (
                        <div className="event-template-select__tab-pick-detail" id={helpId}>
                          {EVENT_TAB_PICKER_DETAIL[tabId]}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <h2 className="event-template-select__form-title">결제</h2>
            <div className="event-template-select__payment-block">
              <h3 className="event-template-select__plan-section-title">행사 전단지 이용권</h3>
              <div className="event-template-select__plan-cards event-template-select__plan-cards--single">
                <div className="event-template-select__plan-card event-template-select__plan-card--selected">
                  <p className="event-template-select__plan-card-name">1건 제작</p>
                  <p className="event-template-select__plan-card-price">
                    {EVENT_TEMPLATE_PRICE.toLocaleString('ko-KR')}원
                  </p>
                  <p className="event-template-select__plan-card-billing">선택한 유형으로 제작 · 3개월 이용</p>
                  <p className="event-template-select__plan-card-vat">(부가세 10% 별도)</p>
                  <span className="event-template-select__plan-select event-template-select__plan-select--outline event-template-select__plan-select--selected">
                    이 상품 선택
                  </span>
                </div>
              </div>

              <div className="event-template-select__plan-features">
                <div className="event-template-select__plan-feature-col">
                  <p className="event-template-select__plan-feature-heading">제작</p>
                  <ul className="event-template-select__plan-feature-list">
                    <li>
                      <FaCheck aria-hidden />
                      <span>행사 유형별 탭·프로그램 구성</span>
                    </li>
                    <li>
                      <FaCheck aria-hidden />
                      <span>모바일 미리보기와 동일한 편집</span>
                    </li>
                    <li>
                      <FaCheck aria-hidden />
                      <span>지도·문의 버튼 연결</span>
                    </li>
                  </ul>
                </div>
                <div className="event-template-select__plan-feature-col">
                  <p className="event-template-select__plan-feature-heading">결제</p>
                  <ul className="event-template-select__plan-feature-list">
                    <li>
                      <FaCheck aria-hidden />
                      <span>포트원 결제 창에서 안전하게 카드 결제</span>
                    </li>
                    <li>
                      <FaCheck aria-hidden />
                      <span>부가세 포함 금액으로 결제</span>
                    </li>
                    <li>
                      <FaCheck aria-hidden />
                      <span>결제 완료 후 바로 제작 화면 이동</span>
                    </li>
                  </ul>
                </div>
                <div className="event-template-select__plan-feature-col">
                  <p className="event-template-select__plan-feature-heading">안내</p>
                  <ul className="event-template-select__plan-feature-list">
                    <li>
                      <FaCheck aria-hidden />
                      <span>결제 후 3개월 동안 이용 가능</span>
                    </li>
                    <li>
                      <FaCheck aria-hidden />
                      <span>타이틀·주문자·유형은 결제 시 함께 저장</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="event-template-select__footer-wrap">
              <button
                type="button"
                className="event-template-select__next-btn"
                onClick={handlePaymentSubmit}
                disabled={paymentLoading}
              >
                {paymentLoading ? '결제 처리 중...' : '결제 후 제작하기'}
                <FaChevronRight />
              </button>
            </div>
          </section>
        </div>
      </div>

      {paymentSuccessState && (
        <div className="event-template-select__modal-backdrop" role="presentation">
          <div
            className="event-template-select__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-payment-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="event-template-select__modal-header event-template-select__modal-header--success">
              <div className="event-template-select__modal-header-main">
                <h2 className="event-template-select__modal-title" id="event-payment-modal-title">
                  결제 완료
                </h2>
              </div>
            </div>
            <div className="event-template-select__modal-body event-template-select__modal-body--success">
              <div className="event-template-select__modal-success">
                <div className="event-template-select__modal-success-icon" aria-hidden>
                  <FaCheck />
                </div>
                <p className="event-template-select__modal-success-head">결제가 되었습니다.</p>
                <p className="event-template-select__modal-success-line">
                  확인을 누르면 행사 전단지 제작 화면으로 이동합니다.
                </p>
              </div>
            </div>
            <div className="event-template-select__modal-footer event-template-select__modal-footer--success">
              <div className="event-template-select__modal-footer-actions event-template-select__modal-footer-actions--single">
                <button
                  id="event-payment-success-confirm"
                  type="button"
                  className="event-template-select__modal-btn event-template-select__modal-btn--primary"
                  onClick={finalizeSuccessfulPayment}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {eventAlert && (
        <div
          className="event-template-select__alert-backdrop"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="event-alert-title"
          aria-describedby="event-alert-message"
          onClick={() => setEventAlert(null)}
        >
          <div className="event-template-select__alert-panel" onClick={(e) => e.stopPropagation()}>
            <div className="event-template-select__alert-icon" aria-hidden>
              <FaExclamationCircle />
            </div>
            <h2 className="event-template-select__alert-title" id="event-alert-title">
              {eventAlert.title}
            </h2>
            <p className="event-template-select__alert-message" id="event-alert-message">
              {eventAlert.message}
            </p>
            <div className="event-template-select__alert-actions">
              <button
                type="button"
                className="event-template-select__alert-btn event-template-select__alert-btn--ghost"
                onClick={handleAlertCopy}
              >
                {alertCopyDone ? '복사됨' : '메시지 복사'}
              </button>
              <button
                type="button"
                className="event-template-select__alert-btn event-template-select__alert-btn--primary"
                onClick={() => setEventAlert(null)}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
