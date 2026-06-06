import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { recoilLoginState } from "../../../RecoilStore";
import "./EventMain.scss";
import ScrollToTopButton from '../../../components/ScrollToTopButton';
import "../../../exceptbooklets/bookletEvent/styles/EventCreate.scss";
import mockupOrdination from "../../../images/bookletevent/mockups/4weLbRv9.jpeg";
import mockupNewcomer from "../../../images/bookletevent/mockups/LHik6kjh.jpeg";
import mockupConcert from "../../../images/bookletevent/mockups/EhUOrZGh.jpeg";
import mockupRetreat from "../../../images/bookletevent/mockups/mKljmC27.jpeg";
import kakaoSampleOrdination from "../../../images/bookletevent/kakaosample/1.jpg";
import kakaoSampleNewcomer from "../../../images/bookletevent/kakaosample/2.jpg";
import kakaoSampleConcert from "../../../images/bookletevent/kakaosample/3.jpg";
import kakaoSampleRetreat from "../../../images/bookletevent/kakaosample/4.jpg";

type EventMainTabId = "ordination" | "newcomer" | "concert" | "retreat";

const KAKAO_SAMPLE_BY_TAB: Record<EventMainTabId, string> = {
  ordination: kakaoSampleOrdination,
  newcomer: kakaoSampleNewcomer,
  concert: kakaoSampleConcert,
  retreat: kakaoSampleRetreat,
};

type ValueCard = { icon: string; title: string; text: string };
type ProcessStep = { step: string; title: string; desc: string };
type HeroStat = { strong: string; span: string };

type EventMainVariant = {
  id: EventMainTabId;
  /** `/event?id=…&preview=1` 샘플 링크에 사용 */
  sampleBookletId: number;
  label: string;
  image: string;
  imageAlt: string;
  hero: {
    badge: string;
    title: React.ReactNode;
    desc: string;
    stats: [HeroStat, HeroStat, HeroStat];
  };
  valueCards: [ValueCard, ValueCard, ValueCard];
  about: { badge: string; h2: string; p: string };
  sampleCta: { title: string; desc: string };
  process: { badge: string; h2: string; p: string; steps: [ProcessStep, ProcessStep, ProcessStep, ProcessStep] };
  pricing: {
    title: React.ReactNode;
    label: string;
    price: string;
    priceSub: string;
    pills: [string, string, string, string];
    items: [string, string, string, string, string];
  };
  cta: { h3: React.ReactNode; p: string };
};

const VARIANTS: EventMainVariant[] = [
  {
    id: "ordination",
    sampleBookletId: 1,
    label: "임직식",
    image: mockupOrdination,
    imageAlt: "임직식 모바일 행사 전단지 목업",
    hero: {
      badge: "임직식 · 장로·집사·권사",
      title: (
        <>
          임직 행사를
          <br />
          모바일 한 페이지로
        </>
      ),
      desc:
        "임직 대상자 안내, 일정·장소, 순서와 감사 예배 정보까지 참석자가 궁금해하는 내용을 모바일 한곳에 담아 전달할 수 있습니다.",
      stats: [
        { strong: "대상자·안내", span: "한 화면에 정리" },
        { strong: "모바일 최적화", span: "언제 어디서나 확인" },
        { strong: "공유·알림", span: "문자·카카오로 전달" },
      ],
    },
    valueCards: [
      {
        icon: "📅",
        title: "임직 정보를 한곳에",
        text: "일시·장소, 임직 대상 요약, 순서 안내까지 참석자가 놓치기 쉬운 정보를 한 페이지로 정리합니다.",
      },
      {
        icon: "📝",
        title: "접수·문의까지 연결",
        text: "필요한 경우 신청·문의 흐름을 디지털로 연결해 운영진의 안내 부담을 줄일 수 있습니다.",
      },
      {
        icon: "📣",
        title: "알림으로 일정을 챙깁니다",
        text: "행사 전 리마인더와 긴급 공지로 참석자가 일정을 놓치지 않도록 도와줍니다.",
      },
    ],
    about: {
      badge: "왜 모바일 행사 전단지인가요?",
      h2: "임직 예배 안내와 참석 관리를 함께 정리합니다",
      p:
        "종이 안내·별도 폼·수기 명단으로 나뉘기 쉬운 임직 행사 안내를 모바일 한곳으로 모으면, 참석자는 편하고 교역자·운영진은 덜 바쁩니다.",
    },
    sampleCta: {
      title: "실제 임직식 전단지 화면을 확인해 보세요",
      desc: "샘플이 새 창(탭)에서 열립니다.",
    },
    process: {
      badge: "이용 흐름",
      h2: "참석자와 안내팀이 함께 따라가기 쉬운 흐름",
      p:
        "링크 하나로 행사 정보 확인부터 필요 시 신청, 알림 수신, 현장 안내까지 자연스럽게 이어지도록 설계할 수 있습니다.",
      steps: [
        {
          step: "1",
          title: "행사 페이지 접속",
          desc: "문자, 카카오톡, QR, 홈페이지 링크로 모바일 행사 전단지에 접속합니다.",
        },
        {
          step: "2",
          title: "정보 확인·문의",
          desc: "일정과 장소를 확인하고 필요 시 모바일에서 문의·접수를 완료합니다.",
        },
        {
          step: "3",
          title: "알림 수신",
          desc: "안내 확인과 행사 전 알림으로 일정을 놓치지 않도록 안내받습니다.",
        },
        {
          step: "4",
          title: "현장 참석",
          desc: "현장에서는 QR 등으로 빠르게 안내받고, 이후에도 링크로 자료를 공유할 수 있습니다.",
        },
      ],
    },
    pricing: {
      title: (
        <>
          임직식 모바일 전단지를
          <br />
          합리적인 비용으로 시작하세요
        </>
      ),
      label: "임직식 모바일 전단지 제작비",
      price: "₩50,000 ",
      priceSub: "(VAT 10% 별도)",
      pills: ["임직식 맞춤 구성", "모바일 최적화", "공유 링크 지원", "운영 안내 포함"],
      items: [
        "임직 대상·순서·장소 등 핵심 정보 페이지 구성",
        "교회 일정에 맞춘 기본 문구/섹션 편집 포함",
        "카카오·문자·QR 공유 흐름 반영",
        "행사 직전 변경 내용 빠른 수정 지원",
        "신청/문의 추가 기능은 범위에 따라 비용 조정",
      ],
    },
    cta: {
      h3: (
        <>
          이번 임직식,
          <br />
          모바일 전단지로 준비하시겠어요?
        </>
      ),
      p:
        "임직 예배·감사 예배 등 교회 행사에 맞춘 모바일 안내 페이지로 제작해 보세요.",
    },
  },
  {
    id: "newcomer",
    sampleBookletId: 2,
    label: "새신자초청",
    image: mockupNewcomer,
    imageAlt: "새신자 초청 행사 모바일 전단지 목업",
    hero: {
      badge: "새신자 초청 · VIP · 부흥",
      title: (
        <>
          새신자 초청 행사를
          <br />
          모바일 한 페이지로
        </>
      ),
      desc:
        "시리즈 일정, 강사·찬양 소개, 장소·시간 안내를 한 번에 보여 주어 새가족이 부담 없이 정보를 확인할 수 있습니다.",
      stats: [
        { strong: "시리즈 일정", span: "한눈에 비교" },
        { strong: "모바일 최적화", span: "공유하기 쉬움" },
        { strong: "알림·리마인더", span: "참석 독려" },
      ],
    },
    valueCards: [
      {
        icon: "📅",
        title: "초청 일정을 한곳에",
        text: "주차별 일정, 시간, 강사·프로그램 요약을 모바일 한 페이지에 정리해 새가족에게 전달합니다.",
      },
      {
        icon: "📝",
        title: "문의·등록 흐름",
        text: "사전 문의, 참석 의사 확인 등 운영에 맞는 접수 흐름을 디지털로 연결할 수 있습니다.",
      },
      {
        icon: "📣",
        title: "알림으로 참여를 돕습니다",
        text: "행사 전 알림과 공지로 놓치기 쉬운 일정을 챙겨 줄 수 있습니다.",
      },
    ],
    about: {
      badge: "왜 모바일 행사 전단지인가요?",
      h2: "새가족 초청 홍보와 안내를 한 번에 정리합니다",
      p:
        "포스터·문자·별도 링크로 흩어지기 쉬운 초청 안내를 모바일 한곳으로 모으면, 새가족은 편하고 팀은 반복 안내를 줄일 수 있습니다.",
    },
    sampleCta: {
      title: "실제 새신자 초청 전단지 화면을 확인해 보세요",
      desc: "샘플이 새 창(탭)에서 열립니다.",
    },
    process: {
      badge: "이용 흐름",
      h2: "새가족과 사역팀이 함께 따라가기 쉬운 흐름",
      p:
        "링크 하나로 시리즈 정보 확인부터 문의, 알림 수신까지 자연스럽게 이어지도록 설계할 수 있습니다.",
      steps: [
        {
          step: "1",
          title: "행사 페이지 접속",
          desc: "문자, 카카오톡, QR, 홈페이지 링크로 모바일 행사 전단지에 접속합니다.",
        },
        {
          step: "2",
          title: "시리즈 정보 확인",
          desc: "일정과 장소를 확인하고 필요 시 모바일에서 문의·등록을 완료합니다.",
        },
        {
          step: "3",
          title: "알림 수신",
          desc: "접수 확인과 행사 전 알림으로 일정을 놓치지 않도록 안내받습니다.",
        },
        {
          step: "4",
          title: "현장 참여",
          desc: "현장에서는 QR 체크인 등으로 빠르게 입장하고, 이후에도 링크로 자료를 공유할 수 있습니다.",
        },
      ],
    },
    pricing: {
      title: (
        <>
          새신자 초청 페이지를
          <br />
          목적에 맞게 제작하세요
        </>
      ),
      label: "새신자초청 모바일 전단지 제작비",
      price: "₩50,000 ",
      priceSub: "(VAT 10% 별도)",
      pills: ["초청 행사 맞춤", "시리즈 일정 구성", "모바일 안내 최적화", "공유 동선 설계"],
      items: [
        "행사 일정·장소·프로그램 안내 섹션 구성",
        "새가족 안내 흐름에 맞춘 콘텐츠 구조 설계",
        "문자/카카오 공유에 최적화된 화면 제작",
        "기본 수정 및 안내 운영 지원",
        "등록 폼/추가 연동은 범위에 따라 비용 조정",
      ],
    },
    cta: {
      h3: (
        <>
          이번 새신자 초청,
          <br />
          모바일 전단지로 준비하시겠어요?
        </>
      ),
      p: "부흥·VIP·시리즈 집회 등 초청 행사에 맞춘 모바일 안내 페이지로 제작해 보세요.",
    },
  },
  {
    id: "concert",
    sampleBookletId: 3,
    label: "음악회",
    image: mockupConcert,
    imageAlt: "음악회 모바일 행사 전단지 목업",
    hero: {
      badge: "음악회 · 찬양 · 특별 예배",
      title: (
        <>
          음악회·찬양 예배를
          <br />
          모바일 한 페이지로
        </>
      ),
      desc:
        "공연 제목, 일시·장소, 프로그램·출연 안내를 감각적으로 보여 주어 참석자에게 기대감을 전달할 수 있습니다.",
      stats: [
        { strong: "프로그램 안내", span: "순서·출연 정리" },
        { strong: "모바일 최적화", span: "포스터 대체 공유" },
        { strong: "티켓·문의", span: "필요 시 연동" },
      ],
    },
    valueCards: [
      {
        icon: "📅",
        title: "공연 정보를 한곳에",
        text: "포스터·일시·장소·프로그램까지 참가자가 궁금해하는 내용을 모바일 한 페이지에 정리합니다.",
      },
      {
        icon: "📝",
        title: "신청부터 관리까지",
        text: "유료·무료, 좌석·인원 제한 등 음악회 운영에 맞는 접수 흐름을 디지털로 처리할 수 있습니다.",
      },
      {
        icon: "📣",
        title: "알림으로 참여를 돕습니다",
        text: "접수 확인, 행사 전 리마인더, 긴급 공지까지 알림으로 일정을 챙겨 줄 수 있습니다.",
      },
    ],
    about: {
      badge: "왜 모바일 행사 전단지인가요?",
      h2: "음악회 홍보와 참가 관리를 한 번에 정리합니다",
      p:
        "포스터 파일·별도 폼·수기 명단으로 나뉘기 쉬운 공연 안내를 모바일 한곳으로 모으면, 참가자는 편하고 운영진은 덜 바쁩니다.",
    },
    sampleCta: {
      title: "실제 음악회 전단지 화면을 확인해 보세요",
      desc: "샘플이 새 창(탭)에서 열립니다.",
    },
    process: {
      badge: "이용 흐름",
      h2: "관객과 운영진이 함께 따라가기 쉬운 흐름",
      p:
        "링크 하나로 공연 정보 확인부터 신청, 알림 수신, 현장 입장까지 자연스럽게 이어지도록 설계할 수 있습니다.",
      steps: [
        {
          step: "1",
          title: "행사 페이지 접속",
          desc: "문자, 카카오톡, QR, 홈페이지 링크로 모바일 행사 전단지에 접속합니다.",
        },
        {
          step: "2",
          title: "정보 확인·신청",
          desc: "일정과 장소를 확인하고 필요 시 모바일에서 바로 신청·결제를 완료합니다.",
        },
        {
          step: "3",
          title: "알림 수신",
          desc: "접수 확인과 행사 전 알림으로 일정을 놓치지 않도록 안내받습니다.",
        },
        {
          step: "4",
          title: "현장 참여",
          desc: "현장에서는 QR 체크인 등으로 빠르게 입장하고, 이후에도 링크로 자료를 공유할 수 있습니다.",
        },
      ],
    },
    pricing: {
      title: (
        <>
          음악회 홍보 페이지를
          <br />
          보기 좋게 제작하세요
        </>
      ),
      label: "음악회 모바일 전단지 제작비",
        price: "₩50,000 ",
      priceSub: "(VAT 10% 별도)",
      pills: ["공연 정보 중심", "모바일 포스터 대체", "참석 동선 지원", "브랜드 톤 반영"],
      items: [
        "공연 소개·출연·장소·시간 정보 시각화",
        "행사 성격에 맞춘 분위기형 디자인 구성",
        "모바일 공유와 접근성 최적화",
        "리마인더 안내용 콘텐츠 구조 제공",
        "신청/결제 연동 추가 시 범위에 따라 비용 조정",
      ],
    },
    cta: {
      h3: (
        <>
          이번 음악회,
          <br />
          모바일 전단지로 준비하시겠어요?
        </>
      ),
      p: "찬양제·특별 음악회·기념 예배 등에 맞춘 모바일 안내 페이지로 제작해 보세요.",
    },
  },
  {
    id: "retreat",
    sampleBookletId: 4,
    label: "수련회&집회",
    image: mockupRetreat,
    imageAlt: "수련회·집회 모바일 행사 전단지 목업",
    hero: {
      badge: "수련회 · 집회 · 세미나",
      title: (
        <>
          수련회·집회를
          <br />
          모바일 한 페이지로
        </>
      ),
      desc:
        "기간·장소, 준비물, 프로그램·조 안내까지 참가자가 현장 전에 필요한 정보를 한 번에 확인할 수 있습니다.",
      stats: [
        { strong: "기간·장소", span: "한 링크에 정리" },
        { strong: "모바일 최적화", span: "참가자 동선 안내" },
        { strong: "공지·알림", span: "변경 사항 전달" },
      ],
    },
    valueCards: [
      {
        icon: "📅",
        title: "행사 정보를 한곳에",
        text: "포스터·일시·장소·강사·준비물까지 참가자가 궁금해하는 내용을 모바일 한 페이지에 정리해 전달할 수 있습니다.",
      },
      {
        icon: "📝",
        title: "신청부터 관리까지",
        text: "맞춤 신청 양식, 인원 제한, 유료·무료 옵션 등 행사 운영에 필요한 접수 흐름을 디지털로 처리할 수 있습니다.",
      },
      {
        icon: "📣",
        title: "알림으로 참여를 돕습니다",
        text: "접수 확인, 행사 전 리마인더, 긴급 공지까지 알림으로 놓치기 쉬운 일정을 챙겨 줄 수 있습니다.",
      },
    ],
    about: {
      badge: "왜 모바일 행사 전단지인가요?",
      h2: "행사 홍보와 참가 관리를 한 번에 정리합니다",
      p:
        "종이 전단지·별도 폼·수기 명단으로 나뉘기 쉬운 행사 안내를 모바일 한곳으로 모으면, 참가자는 편하고 운영진은 덜 바쁩니다.",
    },
    sampleCta: {
      title: "실제 수련회·집회 전단지 화면을 확인해 보세요",
      desc: "샘플이 새 창(탭)에서 열립니다.",
    },
    process: {
      badge: "이용 흐름",
      h2: "참가자와 운영진이 함께 따라가기 쉬운 흐름",
      p:
        "링크 하나로 행사 정보 확인부터 신청, 알림 수신, 현장 체크인까지 자연스럽게 이어지도록 설계할 수 있습니다.",
      steps: [
        {
          step: "1",
          title: "행사 페이지 접속",
          desc: "문자, 카카오톡, QR, 홈페이지 링크로 모바일 행사 전단지에 접속합니다.",
        },
        {
          step: "2",
          title: "정보 확인·신청",
          desc: "일정과 장소를 확인하고 필요 시 모바일에서 바로 신청·결제를 완료합니다.",
        },
        {
          step: "3",
          title: "알림 수신",
          desc: "접수 확인과 행사 전 알림으로 일정을 놓치지 않도록 안내받습니다.",
        },
        {
          step: "4",
          title: "현장 참여",
          desc: "현장에서는 QR 체크인 등으로 빠르게 입장하고, 이후에도 링크로 자료를 공유할 수 있습니다.",
        },
      ],
    },
    pricing: {
      title: (
        <>
          수련회·집회 페이지를
          <br />
          운영 흐름에 맞게 제작하세요
        </>
      ),
      label: "수련회·집회 모바일 전단지 제작비",
      price: "₩50,000 ",
      priceSub: "(VAT 10% 별도)",
      pills: ["일정/준비물 안내", "참가자 동선 지원", "공지 업데이트 용이", "모바일 현장 활용"],
      items: [
        "기간·장소·프로그램·준비물 안내 구조 반영",
        "참가자 동선과 공지 전달에 맞춘 화면 구성",
        "문자/카카오/QR 공유 흐름 지원",
        "행사 전후 변경사항 반영을 위한 기본 수정 포함",
        "체크인/신청 연동은 범위에 따라 비용 조정",
      ],
    },
    cta: {
      h3: (
        <>
          이번 수련회·집회,
          <br />
          모바일 전단지로 준비하시겠어요?
        </>
      ),
      p:
        "수련회·부흥회·특별 집회·세미나 등 교회 행사에 맞춘 모바일 안내 페이지로 제작해 보세요.",
    },
  },
];

export default function EventMain() {
  const navigate = useNavigate();
  const isLogin = useRecoilValue(recoilLoginState);
  const [activeTab, setActiveTab] = useState<EventMainTabId>("ordination");

  const variant = useMemo(
    () => VARIANTS.find((v) => v.id === activeTab) ?? VARIANTS[0],
    [activeTab]
  );

  const openSample = useCallback(() => {
    const url = `${window.location.origin}/event?id=${variant.sampleBookletId}&preview=1`;
    window.open(url, "_blank");
  }, [variant.sampleBookletId]);

  const onApply = useCallback(() => {
    if (isLogin) {
      window.scrollTo(0, 0);
      navigate("/service/bookleteventpay");
    } else {
      alert("로그인이 필요합니다.");
    }
  }, [isLogin, navigate]);

  return (
    <div className="event-main">
      <div
        className="event-main__scenario-tabs-wrap"
        role="tablist"
        aria-label="행사 유형별 안내"
      >
        <div className="event-main__container event-main__scenario-tabs-inner">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              id={`event-main-tab-${v.id}`}
              aria-selected={activeTab === v.id}
              tabIndex={activeTab === v.id ? 0 : -1}
              className={
                activeTab === v.id
                  ? "event-main__scenario-tab event-main__scenario-tab--active"
                  : "event-main__scenario-tab"
              }
              onClick={() => setActiveTab(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <section
        id="top"
        className="event-main__hero"
        role="tabpanel"
        aria-labelledby={`event-main-tab-${variant.id}`}
      >
        <div className="event-main__container event-main__hero-grid">
          <div className="event-main__hero-copy">
            <div className="event-main__badge">{variant.hero.badge}</div>
            <h1>{variant.hero.title}</h1>
            <p>{variant.hero.desc}</p>
            <div className="event-main__hero-actions">
              <button
                type="button"
                className="event-main__btn event-main__btn--primary"
                onClick={openSample}
              >
                샘플 보기
              </button>
              <button
                type="button"
                className="event-main__btn event-main__btn--secondary"
                onClick={onApply}
              >
                제작하기
              </button>
            </div>
            <div className="event-main__hero-stats">
              {variant.hero.stats.map((s, i) => (
                <div key={`${variant.id}-stat-${i}`} className="event-main__stat">
                  <strong>{s.strong}</strong>
                  <span>{s.span}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="event-main__hero-phone">
            <img
              src={variant.image}
              alt={variant.imageAlt}
              className="event-main__hero-mockup-image"
            />
          </div>
        </div>
      </section>

      <section id="about" className="event-main__section">
        <div className="event-main__container">
          <div className="event-main__section-head">
            <div className="event-main__badge">{variant.about.badge}</div>
            <h2>{variant.about.h2}</h2>
            <p>{variant.about.p}</p>
          </div>
          <div className="event-main__card-grid-3">
            {variant.valueCards.map((c) => (
              <div key={c.title} className="event-main__value-card">
                <div className="event-main__value-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="event-main__section event-main__section--sample-cta"
      >
        <div className="event-main__container">
          <div className="event-main__sample-cta">
            <div className="event-main__badge">샘플</div>
            <h2 className="event-main__sample-cta-title">
              {variant.sampleCta.title}
            </h2>
            <p className="event-main__sample-cta-desc">
              {variant.sampleCta.desc}
            </p>
            <button
              type="button"
              className="event-main__btn event-main__btn--primary event-main__btn--sample-large"
              onClick={openSample}
            >
              샘플 보기
            </button>
          </div>
        </div>
      </section>

      <section id="process" className="event-main__section">
        <div className="event-main__container">
          <div className="event-main__process-wrap">
            <div className="event-main__badge event-main__badge--on-dark">
              {variant.process.badge}
            </div>
            <div className="event-main__section-head event-main__section-head--on-dark">
              <h2>{variant.process.h2}</h2>
              <p>{variant.process.p}</p>
            </div>
            <div className="event-main__process-content">
              <div className="event-main__process-grid">
                {variant.process.steps.map((s) => (
                  <div key={s.step} className="event-main__process-step">
                    <div className="event-main__step-num">{s.step}</div>
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                ))}
              </div>
              <div className="event-main__process-preview">
                <img
                  src={KAKAO_SAMPLE_BY_TAB[variant.id]}
                  alt={`${variant.label} 카카오톡 공유 샘플 화면`}
                  className="event-main__process-preview-image"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="event-main__section">
        <div className="event-main__container">
          <div className="event-main__pricing-shell">
            <div className="event-main__pricing-copy">
              <div className="event-main__badge">Pricing</div>
              <h2 className="event-main__pricing-copy-title">{variant.pricing.title}</h2>
              <div className="event-main__pricing-support" aria-label="비용 섹션 포인트">
                {variant.pricing.pills.map((p) => (
                  <span key={p} className="event-main__support-pill">
                    <span className="event-main__support-dot" aria-hidden />
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <aside className="event-main__pricing-card" aria-label={`${variant.label} 서비스 비용 안내`}>
              <div>
                <span className="event-main__pricing-label">{variant.pricing.label}</span>
                <p className="event-main__pricing-price">
                  {variant.pricing.price}
                  <span>{variant.pricing.priceSub}</span>
                </p>
              </div>
              <ul className="event-main__pricing-list">
                {variant.pricing.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="event-main__pricing-actions">
                <button type="button" className="event-main__btn event-main__btn--primary"
                 onClick={onApply}>
                  제작하기
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="event-main__section">
        <div className="event-main__container event-main__benefit-grid">
          <div id="contact" className="event-main__cta-panel">
            <div
              className="event-main__badge"
              style={{ marginBottom: "20px" }}
            >
              문의
            </div>
            <h3>{variant.cta.h3}</h3>
            <p>{variant.cta.p}</p>
            <div className="event-main__cta-actions">
              <button
                type="button"
                className="event-main__btn event-main__btn--primary"
                onClick={onApply}
              >
                제작하기
              </button>
              <button
                type="button"
                className="event-main__btn event-main__btn--secondary"
                onClick={openSample}
              >
                샘플 보기
              </button>
            </div>
          </div>
        </div>
      </section>
      <ScrollToTopButton />
    </div>
  );
}
