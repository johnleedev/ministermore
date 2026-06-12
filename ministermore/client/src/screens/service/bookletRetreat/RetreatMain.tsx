import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { recoilLoginState } from '../../../RecoilStore';
import ScrollToTopButton from '../../../components/ScrollToTopButton';
import kakaoIcon from '../../../images/login/kakao.png';
import heroMockup from '../../../images/bookletretreat/mockup3.png';
import pointTitle from '../../../images/bookletretreat/pointtitle.png';
import sample1 from '../../../images/bookletretreat/sample1.png';
import sample2 from '../../../images/bookletretreat/sample2.png';
import sample3 from '../../../images/bookletretreat/sample3.png';
import sample4 from '../../../images/bookletretreat/sample4.png';
import bottomBox from '../../../images/bookletretreat/bottombox.png';
import PricingGroupIcon from './PricingGroupIcon';
import './RetreatMain.scss';

const SAMPLE_BOOKLET_ID = 4;

const HERO_POINTS = [
  { label: '카카오톡 공유 가능', icon: 'kakao' as const },
  { label: '모바일 최적화', icon: 'mobile' as const },
  { label: '참석 신청 가능', icon: 'check' as const },
];

const PAIN_CARDS = [
  {
    icon: 'document' as const,
    title: '포스터와 신청 링크가 따로 움직입니다',
    text: '예쁘게 만든 홍보물과 신청 페이지가 분리되면, 보는 사람은 내용을 확인해도 바로 신청으로 이어지지 않습니다.',
  },
  {
    icon: 'chat-dots' as const,
    title: '문의가 반복됩니다',
    text: '일정, 장소, 회비, 준비물, 마감일을 여러 번 설명하게 되면서 담당자는 모집보다 응대에 시간을 쓰게 됩니다.',
  },
  {
    icon: 'chat-bubbles' as const,
    title: '카톡 공지는 금방 묻힙니다',
    text: '중요한 안내도 대화 흐름 속에서 빠르게 사라져, 다시 올리고 다시 설명하는 일이 반복됩니다.',
  },
  {
    icon: 'clock' as const,
    title: '관심은 있지만 신청이 늦어집니다',
    text: '신청 절차가 번거로우면 관심이 있었던 사람도 중간에 이탈하고, 모집 전환율은 자연스럽게 낮아집니다.',
  },
];

const DEMO_SCREENS = [
  {
    step: '1',
    title: '메인 전단지',
    text: '첫 화면에서 한눈에 주제와 핵심 정보를 전달',
    image: sample1,
    alt: '수련회 메인 전단지 화면',
  },
  {
    step: '2',
    title: '상세 안내',
    text: '일정, 장소, 프로그램, 준비물 등 상세 내용 확인',
    image: sample2,
    alt: '수련회 상세 안내 화면',
  },
  {
    step: '3',
    title: '신청 폼',
    text: '간단한 정보 입력으로 신청 완료',
    image: sample3,
    alt: '수련회 참석 신청 폼 화면',
  },
  {
    step: '4',
    title: '신청 완료',
    text: '신청 완료 즉시 확인 메시지 제공',
    image: sample4,
    alt: '수련회 신청 완료 화면',
  },
];

const DEMO_FEATURES = [
  {
    icon: 'link' as const,
    title: '링크 하나로 간편 공유',
    text: '카톡, 문자, SNS 어디든 OK',
  },
  {
    icon: 'mobile' as const,
    title: '모바일 최적화',
    text: '누구나 쉽게 보고 신청',
  },
  {
    icon: 'time' as const,
    title: '문의·관리 시간 절약',
    text: '반복 문의 감소로 담당자 업무 경감',
  },
  {
    icon: 'chart' as const,
    title: '참석률과 참여도 향상',
    text: '안내 누락 없이 참여 독려',
  },
];

const COMPARE_ROWS = [
  {
    beforeIcon: 'poster' as const,
    before: '포스터는 따로, 신청 링크은 따로',
    afterIcon: 'mobile' as const,
    afterPrefix: '한 화면에서 수련회 내용을 보고 ',
    afterHighlight: '바로 신청',
  },
  {
    beforeIcon: 'question' as const,
    before: '수련회 문의가 반복됨',
    afterIcon: 'checklist' as const,
    afterPrefix: '필요한 정보가 ',
    afterHighlight: '미리 정리됨',
  },
  {
    beforeIcon: 'chat-dots' as const,
    before: '카카오톡 공지가 묻힘',
    afterIcon: 'link' as const,
    afterPrefix: '링크 하나로 ',
    afterHighlight: '전달과 재확인 가능',
  },
  {
    beforeIcon: 'clock' as const,
    before: '관심은 있지만 신청이 늦어짐',
    afterIcon: 'lightning' as const,
    afterPrefix: '안내 직후 ',
    afterHighlight: '바로 신청 유도',
  },
];

const PROCESS_STEPS = [
  {
    num: '01',
    icon: 'consult' as const,
    title: '상담 및 정보 수집',
    desc: '행사명, 일정, 장소, 회비, 준비물, 신청 방식 등 기본 정보를 수집하고 필요한 흐름을 함께 정리합니다.',
  },
  {
    num: '02',
    icon: 'sitemap' as const,
    title: '구성 설계',
    desc: '전단지 구조, 상세 안내 순서, 강조 메시지, 신청 버튼 위치까지 전환 중심으로 설계합니다.',
  },
  {
    num: '03',
    icon: 'design' as const,
    title: '디자인 제작',
    desc: '수련회 분위기와 타깃 연령대에 맞는 비주얼 톤으로 모바일 최적화 화면을 제작합니다.',
  },
  {
    num: '04',
    icon: 'megaphone' as const,
    title: '오픈 및 공유 시작',
    desc: '완성된 랜딩을 전달하고 카톡, 문자, SNS에 공유할 수 있도록 운영용 가이드를 함께 제공합니다.',
  },
];

const PRICING_ITEMS = [
  {
    badge: '무료 시작',
    count: '50명 이하',
    price: '무료',
    desc: '작은 규모 수련회는 부담 없이 시작해보세요.',
    variant: 'free' as const,
    icon: 'group-heart' as const,
  },
  {
    count: '51~100명',
    price: '5,000원',
    desc: '기본 안내와 신청 흐름을 가볍게 운영할 수 있습니다.',
    variant: 'default' as const,
    icon: 'group' as const,
  },
  {
    count: '100명대',
    price: '10,000원',
    desc: '안내와 신청 동선이 더 중요해지는 규모에 적합합니다.',
    variant: 'default' as const,
    icon: 'group-cross' as const,
  },
  {
    count: '200명 이상',
    price: '20,000원 ~',
    desc: '인원 구간별로 2만원부터 최대 5만원까지 적용됩니다. 1,000명 이상은 운영진 문의.',
    variant: 'default' as const,
    icon: 'group-large' as const,
  },
];

const FAQ_ITEMS = [
  {
    q: '모바일 전단지는 이미지 파일과 무엇이 다른가요?',
    a: '이미지 파일은 보는 데서 끝나지만, 모바일 전단지는 링크 기반으로 안내와 신청이 이어집니다. 즉 공유 후 바로 읽고 신청할 수 있는 구조라는 점이 가장 큰 차이입니다.',
  },
  {
    q: '참석 신청 기능도 함께 넣을 수 있나요?',
    a: '가능합니다. 이름, 연락처, 교회명, 신청 구분 등 필요한 신청 항목을 행사 성격에 맞게 반영하는 구조로 설계할 수 있습니다.',
  },
  {
    q: '카카오톡으로 바로 공유할 수 있나요?',
    a: '네. 링크 형태로 전달되기 때문에 카카오톡, 문자, SNS 프로필 링크 등 다양한 채널에서 바로 공유할 수 있습니다.',
  },
  {
    q: '제작 기간은 얼마나 걸리나요?',
    a: '행사 정보 준비 상태와 수정 범위에 따라 달라질 수 있습니다. 실제 운영 시에는 상담 후 일정에 맞는 제작 가능 범위를 함께 조율하는 방식이 적합합니다.',
  },
  {
    q: '기존 포스터가 있어도 활용할 수 있나요?',
    a: '기존 포스터 비주얼이나 문구 자산이 있다면 일부를 활용해 모바일 전단지 구조에 맞게 재배치하는 방식으로도 진행할 수 있습니다.',
  },
];

function HeroPointIcon({ type }: { type: 'kakao' | 'mobile' | 'check' }) {
  if (type === 'kakao') {
    return (
      <span className="retreat-main__hero-point-icon retreat-main__hero-point-icon--kakao">
        <img src={kakaoIcon} alt="" aria-hidden />
      </span>
    );
  }

  if (type === 'mobile') {
    return (
      <span className="retreat-main__hero-point-icon retreat-main__hero-point-icon--teal">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="17.5" r="0.9" fill="currentColor" />
        </svg>
      </span>
    );
  }

  return (
    <span className="retreat-main__hero-point-icon retreat-main__hero-point-icon--teal">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M8.5 12.2l2.4 2.4 4.8-5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function PainCardIcon({ type }: { type: 'document' | 'chat-dots' | 'chat-bubbles' | 'clock' }) {
  if (type === 'document') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 9h6M9 12.5h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === 'chat-dots') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 7.5a3.5 3.5 0 0 1 3.5-3.5h7A3.5 3.5 0 0 1 19 7.5V13a3.5 3.5 0 0 1-3.5 3.5H11l-3.5 2.5V16.5H8.5A3.5 3.5 0 0 1 5 13V7.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="9.5" cy="10.5" r="0.9" fill="currentColor" />
        <circle cx="12" cy="10.5" r="0.9" fill="currentColor" />
        <circle cx="14.5" cy="10.5" r="0.9" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'chat-bubbles') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4.5 8.5a3 3 0 0 1 3-3h6.5a3 3 0 0 1 3 3v4.2a3 3 0 0 1-3 3H10l-2.2 1.8V15.7H7.5a3 3 0 0 1-3-3V8.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M10.5 11.5a2.5 2.5 0 0 1 2.5-2.5H17a2.5 2.5 0 0 1 2.5 2.5V14a2.5 2.5 0 0 1-2.5 2.5h-2.1l-1.4 1.2V16.5H13a2.5 2.5 0 0 1-2.5-2.5v-2.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.2l2.6 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

type CompareIconType = 'poster' | 'question' | 'chat-dots' | 'clock' | 'mobile' | 'checklist' | 'link' | 'lightning';

function CompareIcon({ type }: { type: CompareIconType }) {
  switch (type) {
    case 'poster':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 5h12v11l-2 2H8l-2-2V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M8 15l-1.5 3h9L14 15" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 9.5l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'question':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 7.5a3.5 3.5 0 0 1 3.5-3.5h7A3.5 3.5 0 0 1 19 7.5V13a3.5 3.5 0 0 1-3.5 3.5H11l-3.5 2.5V16.5H8.5A3.5 3.5 0 0 1 5 13V7.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M11.5 9.2a1.8 1.8 0 1 1 2.6 1.6c-.7.6-1.1 1-1.1 1.9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="12" cy="15.2" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'chat-dots':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 7.5a3.5 3.5 0 0 1 3.5-3.5h7A3.5 3.5 0 0 1 19 7.5V13a3.5 3.5 0 0 1-3.5 3.5H11l-3.5 2.5V16.5H8.5A3.5 3.5 0 0 1 5 13V7.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="9.5" cy="10.5" r="0.9" fill="currentColor" />
          <circle cx="12" cy="10.5" r="0.9" fill="currentColor" />
          <circle cx="14.5" cy="10.5" r="0.9" fill="currentColor" />
        </svg>
      );
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 8v4.2l2.6 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'mobile':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="17.5" r="0.9" fill="currentColor" />
        </svg>
      );
    case 'checklist':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 9.5l1.6 1.6L13 8.5M9 13.5l1.6 1.6L13 12.5M9 17.5h5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'link':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9.5 14.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M14.5 9.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M13 3L5 14h6l-1 7 9-13h-6l1-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
  }
}

type ProcessIconType = 'consult' | 'sitemap' | 'design' | 'megaphone';

function ProcessIcon({ type }: { type: ProcessIconType }) {
  switch (type) {
    case 'consult':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="8" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5.5 16.5c.8-2 2.2-3 4.5-3s3.7 1 4.5 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path
            d="M12 11.5a2.8 2.8 0 0 1 2.8 2.8v1.2l1.4 1"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'sitemap':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="9" y="4" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="4" y="16" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="14" y="16" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 8v4M7 14.5V12h10v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'design':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="5" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 19h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M15.5 8.5l-4.5 4.5-1.5-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 7l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 10.5v3.5a2 2 0 0 0 2 2h1.5l2.8 2.8V8.7L8.5 11.5H7a2 2 0 0 0-2 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M14 9.5c1.8 1 3 2.8 3 5s-1.2 4-3 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
  }
}

function DemoFeatureIcon({ type }: { type: 'link' | 'mobile' | 'time' | 'chart' }) {
  switch (type) {
    case 'link':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9.5 14.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M14.5 9.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'mobile':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="17.5" r="0.9" fill="currentColor" />
        </svg>
      );
    case 'time':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 5a7 7 0 1 1-4.95 11.95"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M12 8v4l2.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M5 5l1.5 1.5M5 19l1.5-1.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="5" y="12" width="3" height="7" rx="1" fill="currentColor" />
          <rect x="10.5" y="8" width="3" height="11" rx="1" fill="currentColor" />
          <rect x="16" y="5" width="3" height="14" rx="1" fill="currentColor" />
        </svg>
      );
  }
}

function SectionEyebrow() {
  return <div className="retreat-main__eyebrow" aria-hidden />;
}

export default function RetreatMain() {
  const navigate = useNavigate();
  const isLogin = useRecoilValue(recoilLoginState);
  const [openFaq, setOpenFaq] = useState(0);

  const openSample = useCallback(() => {
    const url = `${window.location.origin}/event?id=${SAMPLE_BOOKLET_ID}&preview=1`;
    window.open(url, '_blank');
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const onApply = useCallback(() => {
    if (isLogin) {
      window.scrollTo(0, 0);
      navigate('/service/bookletretreatpay');
    } else {
      alert('로그인이 필요합니다.');
    }
  }, [isLogin, navigate]);

  return (
    <div className="retreat-main">
      <section id="top" className="retreat-main__hero">
        <div className="retreat-main__wrap retreat-main__hero-inner">
          <div className="retreat-main__hero-copy">
            <img
              src={pointTitle}
              alt="교회 사역에 딱 맞게!"
              className="retreat-main__point-title"
            />
            <h1>
              카톡으로 공유하고,
              <br />
              바로 신청받는 모바일 수련회 전단지
            </h1>
            <p className="retreat-main__lead">
              수련회 일정, 장소, 회비, 준비물, 신청 안내까지 한 화면에 담고, 공유받은 사람이 바로 참석
              신청할 수 있도록 제작해드립니다.
            </p>
            <div className="retreat-main__button-row">
              <button type="button" className="retreat-main__btn retreat-main__btn--primary" onClick={onApply}>
                수련회 전단지 신청하기
              </button>
              <button
                type="button"
                className="retreat-main__btn retreat-main__btn--secondary"
                onClick={() => scrollTo('demo')}
              >
                예시 화면 보기
              </button>
            </div>
            <div className="retreat-main__hero-points">
              {HERO_POINTS.map((point) => (
                <div key={point.label} className="retreat-main__hero-point">
                  <HeroPointIcon type={point.icon} />
                  <span className="retreat-main__hero-point-label">{point.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="retreat-main__hero-visual" aria-label="모바일 수련회 전단지 미리보기">
            <img
              src={heroMockup}
              alt="수련회 메인 전단지, 상세 안내, 참석 신청 화면 미리보기"
              className="retreat-main__hero-mockup-image"
            />
          </div>
        </div>
      </section>

      <section id="pain" className="retreat-main__section">
        <div className="retreat-main__wrap">
          <div className="retreat-main__section-head">
            <SectionEyebrow />
            <h2>
              수련회 모집이 어려운 이유는
              <br />
              안내와 신청이 <span className="retreat-main__highlight">따로</span> 움직이기 때문입니다
            </h2>
            <p className="retreat-main__subcopy">
              포스터는 따로 보내고 신청 링크는 다시 올리고, 일정과 회비는 또 설명하고 있다면 홍보물이
              부족한 것이 아니라 전달 구조가 분산된 상태입니다.
            </p>
          </div>
          <div className="retreat-main__grid-4">
            {PAIN_CARDS.map((card) => (
              <article key={card.title} className="retreat-main__pain-card">
                <div className="retreat-main__icon-box">
                  <PainCardIcon type={card.icon} />
                </div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="retreat-main__section">
        <div className="retreat-main__wrap">
          <div className="retreat-main__section-head retreat-main__section-head--center">
            <SectionEyebrow />
            <h2>실제로는 이렇게 보입니다</h2>
          </div>

          <div className="retreat-main__demo-shell">
            <div className="retreat-main__demo-grid">
              {DEMO_SCREENS.map((screen) => (
                <article key={`${screen.step}-${screen.title}`} className="retreat-main__demo-card">
                  <div className="retreat-main__demo-heading">
                    <span className="retreat-main__demo-step">{screen.step}</span>
                    <h3>{screen.title}</h3>
                  </div>
                  <p className="retreat-main__demo-desc">{screen.text}</p>
                  <div className="retreat-main__demo-mockup-wrap">
                    <img
                      src={screen.image}
                      alt={screen.alt}
                      className="retreat-main__demo-mockup-image"
                    />
                  </div>
                </article>
              ))}
            </div>

            <div className="retreat-main__demo-features">
              {DEMO_FEATURES.map((feature) => (
                <div key={feature.title} className="retreat-main__demo-feature">
                  <span className="retreat-main__demo-feature-icon">
                    <DemoFeatureIcon type={feature.icon} />
                  </span>
                  <div>
                    <h4>{feature.title}</h4>
                    <p>{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="retreat-main__section">
        <div className="retreat-main__wrap">
          <div className="retreat-main__section-head retreat-main__section-head--center">
            <SectionEyebrow />
            <h2>수련회 모집 방식이 이렇게 달라집니다</h2>
          </div>

          <div className="retreat-main__compare-wrap">
            <article className="retreat-main__compare-card retreat-main__compare-card--before">
              <div className="retreat-main__compare-col-head retreat-main__compare-col-head--before">Before</div>
              <div className="retreat-main__compare-list">
                {COMPARE_ROWS.map((row) => (
                  <div key={row.before} className="retreat-main__compare-item">
                    <span className="retreat-main__compare-icon retreat-main__compare-icon--before">
                      <CompareIcon type={row.beforeIcon} />
                    </span>
                    <p>{row.before}</p>
                  </div>
                ))}
              </div>
            </article>

            <div className="retreat-main__compare-arrow" aria-hidden>
              →
            </div>

            <article className="retreat-main__compare-card retreat-main__compare-card--after">
              <div className="retreat-main__compare-col-head retreat-main__compare-col-head--after">After</div>
              <div className="retreat-main__compare-list">
                {COMPARE_ROWS.map((row) => (
                  <div key={`${row.afterPrefix}${row.afterHighlight}`} className="retreat-main__compare-item">
                    <span className="retreat-main__compare-icon retreat-main__compare-icon--after">
                      <CompareIcon type={row.afterIcon} />
                    </span>
                    <p>
                      {row.afterPrefix}
                      <strong className="retreat-main__compare-highlight">{row.afterHighlight}</strong>
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="process" className="retreat-main__section">
        <div className="retreat-main__wrap">
          <div className="retreat-main__section-head retreat-main__section-head--center">
            <SectionEyebrow />
            <h2>수련회에 맞게, 이런 순서로 제작됩니다</h2>
          </div>
          <div className="retreat-main__process-grid">
            {PROCESS_STEPS.map((step) => (
              <article key={step.num} className="retreat-main__process-card">
                <div className="retreat-main__process-index">{step.num}</div>
                <div className="retreat-main__process-icon">
                  <ProcessIcon type={step.icon} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="retreat-main__section retreat-main__section--pricing">
        <div className="retreat-main__wrap">
          <div className="retreat-main__section-head retreat-main__section-head--center retreat-main__section-head--pricing">
            <SectionEyebrow />
            <h2>참석 인원 기준 요금 안내</h2>
            <p className="retreat-main__subcopy">
              수련회 규모에 따라 부담 없이 시작할 수 있도록 참석 인원 기준으로 요금을 안내합니다.
            </p>
          </div>

          <div className="retreat-main__pricing-grid">
            {PRICING_ITEMS.map((item) => (
              <article
                key={item.count}
                className={`retreat-main__pricing-card${
                  item.variant === 'free' ? ' retreat-main__pricing-card--free' : ''
                }`}
              >
                {item.badge ? <div className="retreat-main__pricing-badge">{item.badge}</div> : null}
                <div className="retreat-main__pricing-icon">
                  <PricingGroupIcon type={item.icon} />
                </div>
                <div className="retreat-main__pricing-count">{item.count}</div>
                <div className="retreat-main__pricing-divider" aria-hidden />
                <div
                  className={`retreat-main__pricing-price${
                    item.variant === 'free' ? ' retreat-main__pricing-price--free' : ''
                  }`}
                >
                  {item.price}
                </div>
                <p className="retreat-main__pricing-desc">{item.desc}</p>
              </article>
            ))}
          </div>

          <p className="retreat-main__pricing-note">
            <span className="retreat-main__pricing-note-icon" aria-hidden>
              <svg viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
                <path d="M10 9v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="10" cy="6.5" r="0.9" fill="currentColor" />
              </svg>
            </span>
            요금은 참석 인원 기준이며, 1회 수련회 기준으로 적용됩니다. 상세 구성은 상담 후 최종 안내됩니다.
          </p>

          <div className="retreat-main__pricing-cta">
            <button
              type="button"
              className="retreat-main__btn retreat-main__btn--primary"
              onClick={onApply}
            >
              <span className="retreat-main__pricing-cta-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 8.5a4.5 4.5 0 0 1 4.5-4.5h3A4.5 4.5 0 0 1 18 8.5V14a4.5 4.5 0 0 1-4.5 4.5h-1.2L9 20.5V18.5H10.5A4.5 4.5 0 0 1 6 14V8.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <circle cx="9.5" cy="11.5" r="0.8" fill="currentColor" />
                  <circle cx="12" cy="11.5" r="0.8" fill="currentColor" />
                  <circle cx="14.5" cy="11.5" r="0.8" fill="currentColor" />
                </svg>
              </span>
              신청하기
            </button>
          </div>
        </div>
      </section>

      <section id="faq" className="retreat-main__section">
        <div className="retreat-main__wrap">
          <div className="retreat-main__section-head retreat-main__section-head--center">
            <SectionEyebrow />
            <h2>자주 묻는 질문</h2>
          </div>
          <div className="retreat-main__faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <article
                key={item.q}
                className={`retreat-main__faq-item${openFaq === i ? ' retreat-main__faq-item--active' : ''}`}
              >
                <button
                  type="button"
                  className="retreat-main__faq-question"
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>Q. {item.q}</span>
                  <span className="retreat-main__faq-toggle" aria-hidden>
                    +
                  </span>
                </button>
                <div className="retreat-main__faq-answer">{item.a}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="retreat-main__section">
        <div className="retreat-main__wrap">
          <button type="button" className="retreat-main__bottombox" onClick={onApply}>
            <img
              src={bottomBox}
              alt="우리 수련회에도 맞을지 궁금하신가요? 무료 상담 신청하기"
              className="retreat-main__bottombox-image"
            />
          </button>
        </div>
      </section>

      <ScrollToTopButton />
    </div>
  );
}
