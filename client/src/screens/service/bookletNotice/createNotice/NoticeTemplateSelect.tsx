import type { ClipboardEvent, KeyboardEvent } from 'react';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import axios from 'axios';
import MainURL from '../../../../MainURL';
import { recoilUserData } from '../../../../RecoilStore';
import {
  FaChevronRight,
  FaCheck,
  FaExclamationCircle,
  FaInstagram,
  FaTimes,
  FaYoutube,
  FaFacebookF,
} from 'react-icons/fa';
import naverlogo from '../../../../images/login/naver.png';
import kakaologo from '../../../../images/login/kakao.png';
import naverbloglogo from '../../../../images/naverblog.png';
import './NoticeTemplateSelect.scss';
import type { NoticeTemplateId } from './noticeTemplateTypes';
import { TEMPLATE_INTRO_ORDER, type IntroBlockId } from './noticeTemplateTypes';
import * as PortOne from '@portone/browser-sdk/v2';



export type { NoticeTemplateId };

/** 디자인 선택 UI 제거 — 제작·미리보기 기본값 */
const DEFAULT_NOTICE_TEMPLATE: NoticeTemplateId = 'classic';

/** 월 이용료 공급가액(원) */
const PLAN_MONTHLY_PRICE = 1000;
/** 부가세율 (10%) */
const PLAN_MONTHLY_VAT_RATE = 0.1;
/** 부가세 포함 실결제 금액 (원, 정수) */
const PLAN_MONTHLY_PRICE_WITH_VAT = Math.round(PLAN_MONTHLY_PRICE * (1 + PLAN_MONTHLY_VAT_RATE));

/** `portonePayment.ts` 의 일반결제 storeId 와 동일 — 운영은 REACT_APP_PORTONE_STORE_ID 로 덮어쓰기 */
const PORTONE_STORE_ID_DEFAULT = 'store-ca1b10da-c69c-4054-90ca-9410bf6ecbed';

const NOTICE_PORTONE_CUSTOMER_KEY = 'portone_notice_customer_id';

/** `POST /paymentbilling/billingkey` 성공 시 서버와 동일한 형태 */
type NoticeBillingCustomData = {
  userAccount: string;
  templateId: string;
  serviceType: string;
  plan: string;
};

type NoticeBillingKeySuccessResponse = {
  ok: true;
  /** 첫 회차 빌링키 결제 건 ID */
  paymentId: string;
  /** 다음 자동결제 예약 건에 쓴 결제 ID */
  schedulePaymentId: string;
  billingKey: string;
  customerId: string;
  customData: NoticeBillingCustomData;
  /** PortOne 결제 완료 시각 (응답에 있을 때) */
  paidAt: string | null;
  payment: Record<string, unknown> | null;
  /** 다음 결제 시도 예정 시각 (ISO 8601 UTC) */
  timeToPay: string;
  /** PortOne `POST .../schedule` 성공 시 `schedule` 필드 등 */
  schedule: Record<string, unknown> | null;
  /** MySQL churchMain.id (서버에서 결제 성공 후 INSERT) */
  churchMainId: number;
};

type NoticeAlertState = {
  title: string;
  message: string;
};

type PaymentSuccessState = {
  churchMainId: number;
  /** 결제 완료 시점 기준 ‘매달 n일’ 안내용 (로컬 날짜의 일) */
  billingDayOfMonth: number;
};

function getOrCreateNoticeCustomerId(userAccount: string): string {
  const acc = userAccount.trim();
  if (acc) return acc;
  try {
    let id = sessionStorage.getItem(NOTICE_PORTONE_CUSTOMER_KEY);
    if (!id) {
      id = `notice_guest_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
      sessionStorage.setItem(NOTICE_PORTONE_CUSTOMER_KEY, id);
    }
    return id;
  } catch {
    return `notice_guest_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
  }
}

function formatTimeForDisplay(timeStr: string): string {
  if (!timeStr || !timeStr.includes(':')) return '오전 11:00';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h || '11', 10);
  const minute = m?.padStart(2, '0') || '00';
  if (hour < 12) return `오전 ${hour}:${minute}`;
  if (hour === 12) return `오후 12:${minute}`;
  return `오후 ${hour - 12}:${minute}`;
}

type CardPanParts = [string, string, string, string];

const EMPTY_CARD_PAN: CardPanParts = ['', '', '', ''];

/** 클립보드·일괄 입력용: 숫자만 최대 16자리 → 4×4 조각 */
function digitsToPanParts(raw: string): CardPanParts {
  const d = raw.replace(/\D/g, '').slice(0, 16);
  return [d.slice(0, 4), d.slice(4, 8), d.slice(8, 12), d.slice(12, 16)] as CardPanParts;
}

type BillingErrorPayload = {
  message?: string;
  firstPaymentSucceeded?: boolean;
  scheduleSucceeded?: boolean;
  details?: Record<string, unknown> | null;
};

const BILLING_ERROR_FALLBACK =
  '결제를 완료할 수 없습니다. 카드 정보와 입력 내용을 확인한 뒤 잠시 후 다시 시도해 주세요.';

/** 서버·PG·네트워크 원문을 사용자용 한글 안내로 바꿈 (영문·코드는 그대로 노출하지 않음) */
function billingErrorToKorean(payload: BillingErrorPayload | undefined, axiosMessage?: string): string {
  const msg = typeof payload?.message === 'string' ? payload.message.trim() : '';
  let pg = '';
  const det = payload?.details;
  if (det && typeof det === 'object') {
    const d = det as { pgMessage?: string; message?: string };
    if (typeof d.pgMessage === 'string' && d.pgMessage.trim()) pg = d.pgMessage.trim();
    else if (typeof d.message === 'string' && d.message.trim()) pg = d.message.trim();
  }

  const firstPaid = Boolean(payload?.firstPaymentSucceeded);
  const withScheduleNote = (body: string) =>
    firstPaid ? `${body} 첫 결제는 이미 승인되었을 수 있습니다. 문제가 계속되면 고객센터로 문의해 주세요.` : body;

  const serverRewrites: { test: (s: string) => boolean; ko: string }[] = [
    {
      test: (s) => s.includes('빌링키 발급'),
      ko: '카드 정보를 확인해 주세요. 문제가 반복되면 카드사 또는 고객센터로 문의해 주세요.',
    },
    {
      test: (s) => s.includes('빌링키 응답') || /billingkey/i.test(s),
      ko: '결제 연동 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도하거나 고객센터로 문의해 주세요.',
    },
    {
      test: (s) => s.includes('빌링키 결제') && s.includes('실패'),
      ko: '결제가 승인되지 않았습니다. 카드 정보와 한도를 확인해 주세요.',
    },
    {
      test: (s) => s.includes('다음 결제 예약') || s.includes('예약에 실패'),
      ko: '다음 자동결제 예약에 실패했습니다. 고객센터로 문의해 주세요.',
    },
    {
      test: (s) => s.includes('전단지') && (s.includes('저장') || s.includes('실패')),
      ko: '결제는 완료되었으나 전단지 저장에 실패했습니다. 고객센터로 문의해 주세요.',
    },
    {
      test: (s) => s.includes('이미') && s.includes('전단지'),
      ko: '이미 이 결제로 전단지가 만들어졌을 수 있습니다. 고객센터로 문의해 주세요.',
    },
  ];

  const combined = `${msg} ${pg}`.trim();
  for (const { test, ko } of serverRewrites) {
    if (combined && test(combined)) return withScheduleNote(ko);
  }

  const primary = `${msg} ${pg} ${axiosMessage ?? ''}`.toLowerCase().replace(/\s+/g, ' ');
  const detailSnippet =
    det && typeof det === 'object'
      ? JSON.stringify(det)
          .slice(0, 900)
          .toLowerCase()
          .replace(/\s+/g, ' ')
      : '';

  const match = (hay: string, p: RegExp) => p.test(hay);

  if (match(primary, /invalid|incorrect|wrong|bad|mismatch|not\s*valid/) && match(primary, /card|number|pan|account/)) {
    return withScheduleNote('카드번호가 올바르지 않습니다. 다시 확인해 주세요.');
  }
  if (match(primary, /expir|만료|expired/) || match(primary, /유효/) && match(primary, /기간|날짜|month|year/)) {
    return withScheduleNote('카드 유효기간(월·년)을 확인해 주세요.');
  }
  if (match(primary, /password|비밀번호|pwd|two\s*digit|2\s*자리/)) {
    return withScheduleNote('카드 비밀번호 앞 두 자리를 확인해 주세요.');
  }
  if (match(primary, /birth|생년|주민|사업자|registration|business/)) {
    return withScheduleNote('생년월일 또는 사업자등록번호를 확인해 주세요.');
  }
  if (match(primary, /cvc|cvv|보안코드|security\s*code/)) {
    return withScheduleNote('카드 보안 정보를 확인해 주세요.');
  }
  if (
    match(primary, /insufficient|한도|limit\s*exceed|exceed.*limit|잔액|over\s*limit/) ||
    match(detailSnippet, /insufficient|한도/)
  ) {
    return withScheduleNote('카드 한도 또는 잔액을 확인해 주세요.');
  }
  if (match(primary, /declin|거절|reject|not\s*approved|승인.*거부|승인.*불가/)) {
    return withScheduleNote('카드사에서 결제를 승인하지 않았습니다. 카드사로 문의해 주세요.');
  }
  if (match(primary, /billing|빌링|미사용|not\s*enabled|not\s*support/) || match(detailSnippet, /빌링|billing/)) {
    return withScheduleNote('이 카드로 정기결제를 이용할 수 없습니다. 고객센터로 문의해 주세요.');
  }
  if (match(primary, /timeout|timed?\s*out|시간\s*초과/) || match(detailSnippet, /timeout/)) {
    return withScheduleNote('응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (
    match(primary, /network|econnrefused|enotfound|연결|통신|socket/) ||
    match(axiosMessage ?? '', /network|econnrefused|timeout/i)
  ) {
    return withScheduleNote('네트워크 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해 주세요.');
  }
  if (match(primary, /duplicate|already|exist|중복/) || match(detailSnippet, /duplicate/)) {
    return withScheduleNote('이미 처리된 결제일 수 있습니다. 고객센터로 문의해 주세요.');
  }
  if (match(primary, /unauthorized|인증|forbidden|401|403/) || match(detailSnippet, /unauthorized/)) {
    return withScheduleNote('결제 인증에 실패했습니다. 잠시 후 다시 시도해 주세요.');
  }

  if (combined && /^[\s가-힣0-9.,!?()[\]·\-'"%…]+$/.test(combined) && combined.length >= 4) {
    return withScheduleNote(combined);
  }

  return withScheduleNote(BILLING_ERROR_FALLBACK);
}

export default function NoticeTemplateSelect() {
  const navigate = useNavigate();
  const userData = useRecoilValue(recoilUserData);
  const userAccount = userData?.userAccount || '';

  const [orderTitle, setOrderTitle] = useState('');
  const [ordererName, setOrdererName] = useState('');
  const [ordererPhone, setOrdererPhone] = useState('');
  const [cardNumberParts, setCardNumberParts] = useState<CardPanParts>(EMPTY_CARD_PAN);
  const panInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [cardExpiryMonth, setCardExpiryMonth] = useState('');
  const [cardExpiryYear, setCardExpiryYear] = useState('');
  const [cardBirthOrBiz, setCardBirthOrBiz] = useState('');
  const [cardPasswordTwoDigits, setCardPasswordTwoDigits] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentSuccessState, setPaymentSuccessState] = useState<PaymentSuccessState | null>(null);
  const [noticeAlert, setNoticeAlert] = useState<NoticeAlertState | null>(null);
  const [alertCopyDone, setAlertCopyDone] = useState(false);

  const openErrorAlert = (message: string, title = '안내') => {
    setAlertCopyDone(false);
    const m = String(message ?? '').trim() || '알 수 없는 오류';
    setNoticeAlert({ title: (title || '안내').trim() || '안내', message: m });
  };

  const handleAlertCopy = async () => {
    if (!noticeAlert) return;
    try {
      await navigator.clipboard.writeText(noticeAlert.message);
      setAlertCopyDone(true);
      window.setTimeout(() => setAlertCopyDone(false), 2200);
    } catch {
      setAlertCopyDone(false);
    }
  };

  const handlePaymentSubmit = async () => {
    // setPaymentLoading(true);
    try {
      const customerId = getOrCreateNoticeCustomerId(userAccount);
      const customer = {
        fullName: ordererName.trim() || userAccount || '주문자',
        phoneNumber: ordererPhone.trim().replace(/\s/g, '') || '01000000000',
        email: userAccount.includes('@') ? userAccount : 'noreply@ministermore.co.kr',
      };
      const customData = {
        userAccount,
        templateId: DEFAULT_NOTICE_TEMPLATE,
        serviceType: 'notice',
        plan: 'monthly',
      };

      // const cardnum = cardNumberParts.join('');
      // const expM = cardExpiryMonth.trim();
      // const expY = cardExpiryYear.trim();
      // const birthBiz = cardBirthOrBiz.trim();
      // const pwd2 = cardPasswordTwoDigits.trim();
      // if (!cardnum || !expM || !expY || !birthBiz || pwd2.length !== 2) {
      //   openErrorAlert(
      //     '카드번호(16자리), 유효기간(월·년), 생년월일(또는 사업자번호), 카드 비밀번호 앞 2자리를 모두 입력해 주세요.',
      //     '입력 정보 확인',
      //   );
      //   return;
      // }

      // 포트원 sdk 결제 --------------------------------------------------------------

      const issueResponse = await PortOne.requestIssueBillingKey({
        storeId: "store-ca1b10da-c69c-4054-90ca-9410bf6ecbed",
        channelKey: "channel-key-9115b093-e87f-41bc-a761-2f69d7fc6f2b",
        billingKeyMethod: "CARD",
        customer: {
          fullName: ordererName.trim() || userAccount || '주문자',
          phoneNumber: ordererPhone.trim().replace(/\s/g, '') || '01000000000',
          email: userAccount.includes('@') ? userAccount : 'noreply@ministermore.co.kr',
        },
        currency: "CURRENCY_KRW",
        displayAmount: PLAN_MONTHLY_PRICE_WITH_VAT,
        issueName: orderTitle.trim(),
        issueId: customerId,
        
      });
      
      console.log('issueResponse', issueResponse);

      const billingRes = await axios.post(
        `${MainURL}/paymentbilling/billingkey`,
        {
          billingKey: issueResponse?.billingKey, 
          transactionType: "issue",
          customerId,
          customer,
          amount: PLAN_MONTHLY_PRICE_WITH_VAT,
          customData,
          orderTitle: orderTitle.trim(),
        },
      );
     

      // const billingRes = await axios.post<NoticeBillingKeySuccessResponse>(
      //   `${MainURL}/paymentbilling/billingkey`,
      //   {
      //     customerId,
      //     customer,
      //     customData,
      //     amount: PLAN_MONTHLY_PRICE_WITH_VAT,
      //     cardnum,
      //     expM,
      //     expY,
      //     birthBiz,
      //     pwd2,
      //     orderTitle: orderTitle.trim(),
      //   },
      // );

      // console.log('billingRes', billingRes);

      const payload = billingRes.data;
      if (!payload?.ok || !payload.paymentId || !payload.schedulePaymentId || !payload.billingKey) {
        openErrorAlert('결제 응답이 올바르지 않습니다. 고객센터로 문의해 주세요.', '결제 응답');
        return;
      }
      if (payload.churchMainId == null || Number.isNaN(Number(payload.churchMainId))) {
        openErrorAlert('전단지 저장에 실패했습니다. 고객센터로 문의해 주세요.', '저장 오류');
        return;
      }

      const id = payload.churchMainId;
      navigate(`/service/bookletnoticecreate?id=${id}`);
      // setPaymentSuccessState({
      //   churchMainId: Number(payload.churchMainId),
      //   billingDayOfMonth: new Date().getDate(),
      // });
    } catch (err) {
      /** 400은 대부분 PortOne 빌링키/첫결제/예약 실패(churchMain INSERT는 500·409). 원인은 `response.data` 참고. */
      if (axios.isAxiosError(err) && err.response?.data) {
        console.error('POST /paymentbilling/billingkey failed:', err.response.status, err.response.data);
      } else {
        console.error('POST /paymentbilling/billingkey failed:', err);
      }
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const d = err.response.data as { churchMainId?: number };
        if (d.churchMainId != null) {
          setPaymentSuccessState({
            churchMainId: Number(d.churchMainId),
            billingDayOfMonth: new Date().getDate(),
          });
          return;
        }
      }
      let friendly: string;
      if (axios.isAxiosError(err)) {
        if (err.response?.data && typeof err.response.data === 'object') {
          friendly = billingErrorToKorean(err.response.data as BillingErrorPayload, err.message);
        } else if (!err.response) {
          friendly = '서버에 연결할 수 없습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.';
        } else {
          friendly = billingErrorToKorean(undefined, err.message);
        }
      } else {
        friendly = '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      }
      openErrorAlert(friendly, '결제 실패');
    } finally {
      setPaymentLoading(false);
    }
  };

  const focusPanInput = (i: number) => {
    panInputRefs.current[i]?.focus();
  };

  const handlePanChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    setCardNumberParts((prev) => {
      const next = [...prev] as CardPanParts;
      next[index] = digits;
      return next;
    });
    if (digits.length === 4 && index < 3) {
      requestAnimationFrame(() => focusPanInput(index + 1));
    }
  };

  const handlePanKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !cardNumberParts[index] && index > 0) {
      e.preventDefault();
      focusPanInput(index - 1);
    }
  };

  const handlePanPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const parts = digitsToPanParts(e.clipboardData.getData('text') || '');
    setCardNumberParts(parts);
    const nextFocus = parts.findIndex((p) => p.length < 4);
    requestAnimationFrame(() => focusPanInput(nextFocus >= 0 ? nextFocus : 3));
  };

  const setPanInputRef = (index: number) => (el: HTMLInputElement | null) => {
    panInputRefs.current[index] = el;
  };

  useEffect(() => {
    if (!paymentModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!paymentSuccessState) {
      requestAnimationFrame(() => panInputRefs.current[0]?.focus());
    }
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [paymentModalOpen, paymentSuccessState]);

  useEffect(() => {
    if (!paymentSuccessState || !paymentModalOpen) return;
    const id = requestAnimationFrame(() => {
      document.getElementById('notice-payment-success-confirm')?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [paymentSuccessState, paymentModalOpen]);

  const finalizeSuccessfulPayment = useCallback(() => {
    if (!paymentSuccessState) return;
    const id = paymentSuccessState.churchMainId;
    setPaymentSuccessState(null);
    setPaymentModalOpen(false);
    navigate(`/service/bookletnoticecreate?id=${id}`);
  }, [navigate, paymentSuccessState]);

  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (noticeAlert) {
        setNoticeAlert(null);
        e.preventDefault();
        return;
      }
      if (paymentModalOpen && paymentSuccessState) {
        finalizeSuccessfulPayment();
        e.preventDefault();
        return;
      }
      if (paymentModalOpen && !paymentLoading) {
        setPaymentModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [noticeAlert, paymentModalOpen, paymentLoading, paymentSuccessState, finalizeSuccessfulPayment]);

  const cardFieldsIncomplete =
    cardNumberParts.join('').length !== 16 ||
    !cardExpiryMonth.trim() ||
    !cardExpiryYear.trim() ||
    !cardBirthOrBiz.trim() ||
    cardPasswordTwoDigits.trim().length !== 2;

  const showPaymentSuccess = paymentSuccessState !== null;

  const introOrder = TEMPLATE_INTRO_ORDER['classic'] as IntroBlockId[];
  const sampleWorship = { worshipName: '주일예배', dayOfWeek: '일요일', time: '11:00', place: '본당', notice: '' };
  const TAB_LIST = [
    { id: 'info' as const, label: '소개' },
    { id: 'servers' as const, label: '섬김이들' },
    { id: 'sermon' as const, label: '설교영상' },
    { id: 'gallery' as const, label: '갤러리' },
  ] as const;

  return (
    <div className="notice-template-select">
      <div className="notice-template-select__body">
        <div className="notice-template-select__inner">
          {/* 왼쪽: 모바일 미리보기 (NoticeCreate와 동일 구조·스타일) */}
          <aside className="notice-create__preview-wrap">
            <div className="notice-create__phone-frame">
              <div className="notice-create__phone-notch" />
              <div className="notice-create__phone-screen">
                <div className="notice-create__preview">
                  <div className="notice-create__preview-hero">
                    <div className="notice-create__preview-hero-placeholder">메인 이미지</div>
                    <div className="notice-create__preview-hero-overlay">
                      <p className="notice-create__preview-hero-sub">교단</p>
                      <h1 className="notice-create__preview-hero-title">교회 로고</h1>
                    </div>
                  </div>

                  {/* 탭: 소개 | 섬김이들 | 설교영상 | 갤러리 (선택 색상 적용) */}
                  <div className={`notice-template-select__tabs-wrap notice-template-select__tabs-wrap--${DEFAULT_NOTICE_TEMPLATE}`}>
                    <div className="notice-create__preview-tabs">
                      {TAB_LIST.map((tab) => (
                        <div
                          key={tab.id}
                          className={`notice-create__preview-tab ${tab.id === 'info' ? 'on' : ''}`}
                        >
                          {tab.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`notice-create__preview-body notice-create__preview-body--${DEFAULT_NOTICE_TEMPLATE}`}>
                    {introOrder.map((blockId: IntroBlockId) => {
                      if (blockId === 'greeting') {
                        return (
                          <div key="greeting" className="notice-create__preview-welcome">
                            <p className="notice-create__preview-welcome-sub">Welcome Home</p>
                            <h2 className="notice-create__preview-welcome-title">
                              함께 예배하고 이웃을 사랑하는 공동체
                            </h2>
                            <p className="notice-create__preview-welcome-desc">
                              하나님을 사랑하고 이웃을 내 몸과 같이 사랑하는 것을 삶으로 실천합니다. 따뜻한 환대와 깊이 있는 말씀이 있는 곳, 교회에 오신 여러분을 환영합니다.
                            </p>
                          </div>
                        );
                      }
                      if (blockId === 'worship') {
                        return (
                          <div key="worship">
                            <div className="notice-create__preview-section-label">
                              <span className="notice-create__preview-chip-icon">🕐</span>
                              예배 안내
                            </div>
                            <div className="notice-create__preview-worship-list">
                              <div className="notice-create__preview-worship-item">
                                <div className="notice-create__preview-worship-line notice-create__preview-worship-line--primary">
                                  <span className="notice-create__preview-worship-name">{sampleWorship.worshipName}</span>
                                  <span className="notice-create__preview-worship-time">
                                    {formatTimeForDisplay(sampleWorship.time)}
                                  </span>
                                </div>
                                <div className="notice-create__preview-worship-line notice-create__preview-worship-line--meta">
                                  <span className="notice-create__preview-worship-place">{sampleWorship.place}</span>
                                  <span className="notice-create__preview-worship-day">{sampleWorship.dayOfWeek}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      if (blockId === 'sns') {
                        return (
                          <div
                            key="sns"
                            className="notice-create__preview-footer-sns notice-create__preview-footer-sns--above-location"
                          >
                            <a href="#" aria-label="인스타그램">
                              <FaInstagram />
                            </a>
                            <a href="#" aria-label="유튜브">
                              <FaYoutube />
                            </a>
                            <a href="#" aria-label="페이스북">
                              <FaFacebookF />
                            </a>
                            <a href="#" aria-label="블로그">
                              <img src={naverbloglogo} alt="블로그" className="notice-create__preview-footer-blog-img" />
                            </a>
                          </div>
                        );
                      }
                      if (blockId === 'location') {
                        return (
                          <div key="location" className="notice-create__preview-chips">
                            <div className="notice-create__preview-chip">
                              <span className="notice-create__preview-chip-icon">📍</span>
                              <div>
                                <p className="notice-create__preview-chip-label">위치</p>
                                <p className="notice-create__preview-chip-value">서울시 강남구</p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      if (blockId === 'mapActions') {
                        return (
                          <div key="mapActions">
                            <div className="notice-create__preview-actions">
                              <div className="notice-create__preview-btn-row">
                                <a href="#" className="notice-create__preview-btn notice-create__preview-btn--naver">
                                  <img src={naverlogo} alt="네이버" className="notice-create__preview-map-icon" />
                                  네이버 지도
                                </a>
                                <a href="#" className="notice-create__preview-btn notice-create__preview-btn--kakao">
                                  <img src={kakaologo} alt="카카오" className="notice-create__preview-map-icon" />
                                  카카오 지도
                                </a>
                              </div>
                              <div className="notice-create__preview-btn-row">
                                <div className="notice-create__preview-btn notice-create__preview-btn--secondary">
                                  📞 문의하기
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                    <div className="notice-create__preview-footer">
                      <p className="notice-create__preview-footer-info">
                        02-1234-5678 | 서울시 강남구
                        <br />
                        © {new Date().getFullYear()} 교회 All Rights Reserved.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* 오른쪽: 타이틀 + 주문자정보 + 결제 */}
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
                <input
                  type="tel"
                  className="notice-template-select__input"
                  placeholder="전화번호를 입력하세요"
                  value={ordererPhone}
                  onChange={(e) => setOrdererPhone(e.target.value)}
                />
              </div>
            </div>

            <h2 className="notice-template-select__form-title">결제</h2>
            <div className="notice-template-select__payment-block">
              <h3 className="notice-template-select__plan-section-title">구독 플랜 안내</h3>
              <div className="notice-template-select__plan-cards notice-template-select__plan-cards--single">
                <div className="notice-template-select__plan-card notice-template-select__plan-card--selected">
                  <p className="notice-template-select__plan-card-name">월간 플랜</p>
                  <p className="notice-template-select__plan-card-price">
                    {PLAN_MONTHLY_PRICE.toLocaleString('ko-KR')}원
                  </p>
                  <p className="notice-template-select__plan-card-billing">1인 / 월 1회 결제</p>
                  <p className="notice-template-select__plan-card-vat">(부가세 10% 별도)</p>
                  <span className="notice-template-select__plan-select notice-template-select__plan-select--outline notice-template-select__plan-select--selected">
                    이 플랜 선택
                  </span>
                </div>
              </div>

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
                      <span>제작 외부 페이지와 동일 구조</span>
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

            </div>

            <div className="notice-template-select__footer-wrap">
              <button
                type="button"
                className="notice-template-select__next-btn"
                onClick={() => {
                  // setPaymentSuccessState(null);
                  // setPaymentModalOpen(true);
                  handlePaymentSubmit();
                }}
                disabled={paymentLoading}
              >
                결제 후 제작하기
                <FaChevronRight />
              </button>
            </div>

            {paymentModalOpen && (
              <div
                className="notice-template-select__modal-backdrop"
                role="presentation"
                onClick={() => !paymentLoading && !showPaymentSuccess && setPaymentModalOpen(false)}
              >
                <div
                  className="notice-template-select__modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="notice-payment-modal-title"
                  onClick={(e) => e.stopPropagation()}
                >
                  {showPaymentSuccess && paymentSuccessState ? (
                    <>
                      <div className="notice-template-select__modal-header notice-template-select__modal-header--success">
                        <div className="notice-template-select__modal-header-main">
                          <h2 className="notice-template-select__modal-title" id="notice-payment-modal-title">
                            결제 완료
                          </h2>
                        </div>
                      </div>
                      <div className="notice-template-select__modal-body notice-template-select__modal-body--success">
                        <div className="notice-template-select__modal-success">
                          <div className="notice-template-select__modal-success-icon" aria-hidden>
                            <FaCheck />
                          </div>
                          <p className="notice-template-select__modal-success-head">결제가 되었습니다.</p>
                          <p className="notice-template-select__modal-success-line">
                            매달 {paymentSuccessState.billingDayOfMonth}일에 결제됩니다.
                          </p>
                          <p className="notice-template-select__modal-success-line notice-template-select__modal-success-line--muted">
                            구독을 취소하시려면 취소신청을 해주세요.
                          </p>
                        </div>
                      </div>
                      <div className="notice-template-select__modal-footer notice-template-select__modal-footer--success">
                        <div className="notice-template-select__modal-footer-actions notice-template-select__modal-footer-actions--single">
                          <button
                            id="notice-payment-success-confirm"
                            type="button"
                            className="notice-template-select__modal-btn notice-template-select__modal-btn--primary"
                            onClick={finalizeSuccessfulPayment}
                          >
                            확인
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="notice-template-select__modal-header">
                        <div className="notice-template-select__modal-header-main">
                          <h2 className="notice-template-select__modal-title" id="notice-payment-modal-title">
                            카드 정보 (정기결제)
                          </h2>
                          <p className="notice-template-select__modal-pay-amount" aria-live="polite">
                            결제 금액{' '}
                            <strong style={{ marginLeft: '5px' }}>
                              {PLAN_MONTHLY_PRICE_WITH_VAT.toLocaleString('ko-KR')}원
                            </strong>
                            <span className="notice-template-select__modal-pay-amount-note">
                              {' '}
                              (공급가 {PLAN_MONTHLY_PRICE.toLocaleString('ko-KR')}원 + 부가세 10%)
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          className="notice-template-select__modal-close"
                          aria-label="닫기"
                          disabled={paymentLoading}
                          onClick={() => {
                            setPaymentModalOpen(false);
                            setPaymentSuccessState(null);
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="notice-template-select__modal-body">
                        <div className="notice-template-select__card-form notice-template-select__card-form--modal">
                          <div className="notice-template-select__card-field">
                            <span className="notice-template-select__card-label" id="notice-modal-card-pan-label">
                              카드번호 (4자리 × 4)
                            </span>
                            <div
                              className="notice-template-select__card-pan-row"
                              role="group"
                              aria-labelledby="notice-modal-card-pan-label"
                            >
                              {cardNumberParts.map((part, index) => (
                                <Fragment key={index}>
                                  {index > 0 && (
                                    <span className="notice-template-select__card-pan-sep" aria-hidden>
                                      ·
                                    </span>
                                  )}
                                  <input
                                    ref={setPanInputRef(index)}
                                    id={`notice-modal-card-pan-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete={index === 0 ? 'cc-number' : 'off'}
                                    spellCheck={false}
                                    maxLength={4}
                                    aria-label={`카드번호 ${index + 1}번째 네 자리`}
                                    className="notice-template-select__card-input notice-template-select__card-input--pan-chunk"
                                    placeholder="0000"
                                    value={part}
                                    onChange={(e) => handlePanChange(index, e.target.value)}
                                    onKeyDown={(e) => handlePanKeyDown(index, e)}
                                    onPaste={handlePanPaste}
                                  />
                                </Fragment>
                              ))}
                            </div>
                          </div>
                          <div className="notice-template-select__card-field-row notice-template-select__card-field-row--expiry">
                            <div className="notice-template-select__card-field">
                              <label className="notice-template-select__card-label" htmlFor="notice-modal-card-exp-m">
                                유효기간 (월)
                              </label>
                              <input
                                id="notice-modal-card-exp-m"
                                type="text"
                                inputMode="numeric"
                                autoComplete="cc-exp-month"
                                className="notice-template-select__card-input notice-template-select__card-input--digits-2"
                                placeholder="MM"
                                maxLength={2}
                                value={cardExpiryMonth}
                                onChange={(e) => setCardExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                              />
                            </div>
                            <div className="notice-template-select__card-field">
                              <label className="notice-template-select__card-label" htmlFor="notice-modal-card-exp-y">
                                유효기간 (년)
                              </label>
                              <input
                                id="notice-modal-card-exp-y"
                                type="text"
                                inputMode="numeric"
                                autoComplete="cc-exp-year"
                                className="notice-template-select__card-input notice-template-select__card-input--digits-4"
                                placeholder="YY"
                                maxLength={4}
                                value={cardExpiryYear}
                                onChange={(e) => setCardExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              />
                            </div>
                          </div>
                          <div className="notice-template-select__card-field notice-template-select__card-field--birth">
                            <label className="notice-template-select__card-label" htmlFor="notice-modal-card-birth">
                              생년월일 (개인) 또는 사업자등록번호 (법인)
                            </label>
                            <input
                              id="notice-modal-card-birth"
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              className="notice-template-select__card-input notice-template-select__card-input--digits-10"
                              placeholder="YYMMDD 또는 10자리 사업자번호"
                              maxLength={10}
                              value={cardBirthOrBiz}
                              onChange={(e) => setCardBirthOrBiz(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            />
                          </div>
                          <div className="notice-template-select__card-field notice-template-select__card-field--pwd">
                            <label className="notice-template-select__card-label" htmlFor="notice-modal-card-pwd">
                              카드 비밀번호 앞 2자리
                            </label>
                            <input
                              id="notice-modal-card-pwd"
                              type="password"
                              inputMode="numeric"
                              autoComplete="new-password"
                              className="notice-template-select__card-input notice-template-select__card-input--pwd"
                              placeholder="••"
                              maxLength={2}
                              value={cardPasswordTwoDigits}
                              onChange={(e) => setCardPasswordTwoDigits(e.target.value.replace(/\D/g, '').slice(0, 2))}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="notice-template-select__modal-footer">
                        <p className="notice-template-select__modal-lead">
                          카드 정보는 서버에 저장되지 않습니다.
                        </p>
                        <div className="notice-template-select__modal-footer-actions">
                          <button
                            type="button"
                            className="notice-template-select__modal-btn notice-template-select__modal-btn--secondary"
                            disabled={paymentLoading}
                            onClick={() => {
                              setPaymentModalOpen(false);
                              setPaymentSuccessState(null);
                            }}
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            className="notice-template-select__modal-btn notice-template-select__modal-btn--primary"
                            onClick={handlePaymentSubmit}
                            disabled={paymentLoading || cardFieldsIncomplete}
                          >
                            {paymentLoading ? '결제 처리 중...' : '구독 결제'}
                            <FaChevronRight />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

          </section>
        </div>
      </div>

      {noticeAlert && (
        <div
          className="notice-template-select__alert-backdrop"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="notice-alert-title"
          aria-describedby="notice-alert-message"
          onClick={() => setNoticeAlert(null)}
        >
          <div className="notice-template-select__alert-panel" onClick={(e) => e.stopPropagation()}>
            <div className="notice-template-select__alert-icon" aria-hidden>
              <FaExclamationCircle />
            </div>
            <h2 className="notice-template-select__alert-title" id="notice-alert-title">
              {noticeAlert.title}
            </h2>
            <p className="notice-template-select__alert-message" id="notice-alert-message">
              {noticeAlert.message}
            </p>
            <div className="notice-template-select__alert-actions">
              <button
                type="button"
                className="notice-template-select__alert-btn notice-template-select__alert-btn--ghost"
                onClick={handleAlertCopy}
              >
                {alertCopyDone ? '복사됨' : '메시지 복사'}
              </button>
              <button
                type="button"
                className="notice-template-select__alert-btn notice-template-select__alert-btn--primary"
                onClick={() => setNoticeAlert(null)}
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
