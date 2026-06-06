import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import goToMmservice from '../../../goToMmservice';
import MmserviceURL from '../../../MmserviceURL';
import './ChurchappComplete.scss';

type ChurchappCompleteState = {
  churchName?: string;
  managerName?: string;
  phone?: string;
  email?: string;
};

export default function ChurchappComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as ChurchappCompleteState;

  const adminPath = useMemo(() => `/service/churchapp`, []);
  const adminBase = MmserviceURL.replace(/\/$/, '');

  return (
    <div className="churchapp-complete">
      <div className="churchapp-complete__inner">
        <div className="churchapp-complete__icon">
          <FaCheckCircle />
        </div>
        <h1 className="churchapp-complete__title">교회앱 문의가 접수되었습니다</h1>
        <p className="churchapp-complete__desc">
          담당자가 확인 후 연락드리겠습니다. 문의 내역 확인은 서비스관리자 페이지에서 가능합니다.
        </p>
        <p className="churchapp-complete__highlight">서비스관리자 페이지에서 진행해 주세요.</p>

        <div className="churchapp-complete__info">
          <p>
            <strong>서비스관리자</strong>에서 교회앱 신청(문의) 내역을 확인할 수 있습니다.
          </p>
          {state.churchName ? (
            <p style={{ marginTop: 8, marginBottom: 0 }}>
              교회명: <span style={{ wordBreak: 'break-all' }}>{state.churchName}</span>
            </p>
          ) : null}
          {state.managerName ? (
            <p style={{ marginTop: 8, marginBottom: 0 }}>
              담당자: <span style={{ wordBreak: 'break-all' }}>{state.managerName}</span>
            </p>
          ) : null}
          {state.phone ? (
            <p style={{ marginTop: 8, marginBottom: 0 }}>
              연락처: <span style={{ wordBreak: 'break-all' }}>{state.phone}</span>
            </p>
          ) : null}
          {state.email ? (
            <p style={{ marginTop: 8, marginBottom: 0 }}>
              계정: <span style={{ wordBreak: 'break-all' }}>{state.email}</span>
            </p>
          ) : null}
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            관리자 주소: <span style={{ wordBreak: 'break-all' }}>{adminBase}</span>
          </p>
        </div>

        <div className="churchapp-complete__btns">
          <button
            type="button"
            className="churchapp-complete__btn churchapp-complete__btn--primary"
            onClick={() => goToMmservice(adminPath)}
          >
            서비스관리자에서 확인하기
          </button>
          <button
            type="button"
            className="churchapp-complete__btn churchapp-complete__btn--secondary"
            onClick={() => {
              navigate('/service/churchapp');
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

