import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import goToMmservice from '../../../../goToMmservice';
import MmserviceURL from '../../../../MmserviceURL';
import './NoticePayComplete.scss';

type NoticePayCompleteState = {
  churchMainId?: number;
};

export default function NoticePayComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as NoticePayCompleteState;

  const adminCreatePath = useMemo(() => {
    const id = state.churchMainId;
    if (id == null || Number.isNaN(Number(id))) return '/service/notice';
    const q = new URLSearchParams({ id: String(id) });
    return `/service/bookletnoticecreate?${q.toString()}`;
  }, [state.churchMainId]);

  const adminBase = MmserviceURL.replace(/\/$/, '');

  const handleGoAdmin = () => {
    goToMmservice(adminCreatePath);
  };

  return (
    <div className="notice-pay-complete">
      <div className="notice-pay-complete__inner">
        <div className="notice-pay-complete__icon">
          <FaCheckCircle />
        </div>
        <h1 className="notice-pay-complete__title">모바일 교회 전단지 결제가 완료되었습니다</h1>
        <p className="notice-pay-complete__desc">
          결제가 정상 승인되었습니다. 전단지 제작은 아래 버튼을 눌러
        </p>
        <p className="notice-pay-complete__highlight">서비스관리자 페이지에서 진행해 주세요.</p>

        <div className="notice-pay-complete__info">
          <p>
            <strong>서비스관리자</strong>는 결제하신 교회 전단지를 편집·배포하는 전용 관리 화면입니다.
          </p>
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            관리자 주소: <span style={{ wordBreak: 'break-all' }}>{adminBase}</span>
          </p>
        </div>

        <div className="notice-pay-complete__btns">
          <button
            type="button"
            className="notice-pay-complete__btn notice-pay-complete__btn--primary"
            onClick={handleGoAdmin}
          >
            서비스관리자에서 제작하기
          </button>
          <button
            type="button"
            className="notice-pay-complete__btn notice-pay-complete__btn--secondary"
            onClick={() => {
              navigate('/service/notice');
              window.scrollTo(0, 0);
            }}
          >
            서비스 소개로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
