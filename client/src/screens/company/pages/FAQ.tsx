import { useState } from 'react';
import '../Company.scss';

type FaqEntry = { question: string; answer: string };

const FAQ_ITEMS: FaqEntry[] = [
  {
    question: '사역자모아는 어떤 서비스인가요?',
    answer:
      '교회·기관·사역자를 연결하는 사역 관련 플랫폼입니다. 예배·사역 보조 기능 등 사역 현장에서 필요한 도구를 한곳에서 이용할 수 있도록 구성되어 있습니다.',
  },
  {
    question: '회원가입 후 어떤 기능을 쓸 수 있나요?',
    answer:
      '로그인 후 마이페이지에서 프로필·이력서 관리, 게시·지원 내역 확인 등 회원 전용 기능을 이용할 수 있습니다. 일부 메뉴는 비회원도 열람할 수 있습니다.',
  },
  {
    question: '별도의 인쇄물도 있나요?',
    answer:
      '서비스 내 모든 결제 상품은 별도의 인쇄물을 제공하지 않고 모바일 페이지만 제작합니다.',
  },
  {
    question: '채용 공고는 어떻게 등록하나요?',
    answer:
      '채용 메뉴에서 교회·기관·사역자 채용 각각의 등록 화면으로 이동한 뒤, 안내에 따라 내용을 입력해 주시면 됩니다. 등록 절차나 심사 정책은 서비스 운영 방침에 따릅니다.',
  },
  {
    question: '교회 채용, 기관 채용, 사역자 채용의 차이는 무엇인가요?',
    answer:
      '교회 채용은 교회에서 사역자를 모집할 때, 기관 채용은 기독교 관련 기관·단체 채용, 사역자 채용은 사역자가 사역 기회를 찾을 때 사용하는 구분입니다. 각각 맞는 양식과 목록으로 안내됩니다.',
  },
  {
    question: '게시한 공고를 수정·삭제하고 싶어요.',
    answer:
      '마이페이지의 게시 관리 등에서 본인이 등록한 글을 확인할 수 있는 경우, 해당 화면에서 수정·삭제를 진행해 주세요. 화면에 없거나 오류가 나면 고객 문의로 연락해 주시기 바랍니다.',
  },
  {
    question: '제작완료 및 결제가 완료되면 환불이 가능한가요?',
    answer:
      '맞춤 제작이 완료되고 결제까지 이루어진 건은 원칙적으로 환불이 어렵습니다. 오류 결제·중복 결제 등 특이한 사정이 있을 때는 «광고및제휴» 페이지에 안내된 문의처로 연락 주시면 개별 안내를 드립니다.',
  },
  {
    question: '광고·제휴·기타 문의는 어디로 하면 되나요?',
    answer:
      '광고 및 제휴 문의는 상단 메뉴 «사역자모아» → «광고및제휴» 페이지에 안내된 메일로 보내 주시면 됩니다.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="company">
      <div className="inner">
        <div className="subpage__main">
          <div className="subpage__main__title">자주 묻는 질문</div>
          <div className="subpage__main__content company-faq">
            <p className="company-faq__lead">
              서비스 이용 시 자주 받는 질문을 모았습니다. 원하는 항목을 눌러 답변을
              확인해 주세요.
            </p>
            <ul className="company-faq__list" role="list">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                  <li key={item.question} className="company-faq__item">
                    <button
                      type="button"
                      className={`company-faq__question${isOpen ? ' is-open' : ''}`}
                      onClick={() => toggle(index)}
                      aria-expanded={isOpen}
                    >
                      <span className="company-faq__qtext">{item.question}</span>
                      <span className="company-faq__icon" aria-hidden>
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="company-faq__answer">
                        <p>{item.answer}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
