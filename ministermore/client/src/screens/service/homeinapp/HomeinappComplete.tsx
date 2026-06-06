import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import goToMmservice from '../../../goToMmservice';
import MmserviceURL from '../../../MmserviceURL';
import './HomeinappComplete.scss';

type HomeinappCompleteState = {
  homeinappMainId?: string;
};

export default function HomeinappComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as HomeinappCompleteState;

  const adminPath = useMemo(() => {
    const id = String(state.homeinappMainId || '').trim();
    if (!id) return '/service/homeinapp';
    // 홈인앱은 처리 상태에 따라 알림관리 가능 여부가 달라 목록으로 안내
    return `/service/homeinapp`;
  }, [state.homeinappMainId]);

  const adminBase = MmserviceURL.replace(/\/$/, '');

  return (
    <div className="homeinapp-complete">
      <div className="homeinapp-complete__inner">
        <div className="homeinapp-complete__icon">
          <FaCheckCircle />
        </div>
        <h1 className="homeinapp-complete__title">홈인앱 결제가 완료되었습니다</h1>
        <p className="homeinapp-complete__desc">
          결제가 정상 승인되었습니다. 홈인앱 관리(알림·상태 확인)는 서비스관리자 페이지에서 진행해 주세요.
        </p>

        <div className="homeinapp-complete__info">
          <p>
            <strong>서비스관리자</strong>에서 홈인앱 처리 상태(접수/진행/완료)를 확인할 수 있습니다.
          </p>
          {state.homeinappMainId ? (
            <p style={{ marginTop: 8, marginBottom: 0 }}>
              홈인앱 ID: <span style={{ wordBreak: 'break-all' }}>{state.homeinappMainId}</span>
            </p>
          ) : null}
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            관리자 주소: <span style={{ wordBreak: 'break-all' }}>{adminBase}</span>
          </p>
        </div>

        <div className="homeinapp-complete__btns">
          <button
            type="button"
            className="homeinapp-complete__btn homeinapp-complete__btn--primary"
            onClick={() => goToMmservice(adminPath)}
          >
            서비스관리자에서 관리하기
          </button>
          <button
            type="button"
            className="homeinapp-complete__btn homeinapp-complete__btn--secondary"
            onClick={() => navigate('/service/homeinapp')}
          >
            서비스 소개로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
