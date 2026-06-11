import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import CopyTextButton from '../../../components/CopyTextButton';
import goToMmservice from '../../../goToMmservice';
import MmserviceURL from '../../../MmserviceURL';
import './RetreatPayComplete.scss';

type PayCompleteState = {
  churchName?: string;
  passwd?: string;
  ownerpw?: string;
};

export default function RetreatPayComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as PayCompleteState | null) ?? {};
  const adminBase = MmserviceURL.replace(/\/$/, '');

  const churchName = state.churchName?.trim() || '';
  const passwd = state.passwd?.trim() || '';
  const ownerpw = state.ownerpw?.trim() || '';

  return (
    <div className="retreat-pay-complete">
      <div className="retreat-pay-complete__inner">
        <div className="retreat-pay-complete__icon">
          <FaCheckCircle />
        </div>
        <h1 className="retreat-pay-complete__title">수련회 전단지 결제가 완료되었습니다</h1>
        <p className="retreat-pay-complete__desc">
          결제가 정상 승인되었습니다. 전단지 제작은 아래 버튼을 눌러
        </p>
        <p className="retreat-pay-complete__highlight">서비스관리자 사이트에서 진행해 주세요.</p>

        {churchName && passwd ? (
          <div className="retreat-pay-complete__credentials">
            <h2 className="retreat-pay-complete__credentials-title">서비스관리자 접속 정보</h2>
            <dl className="retreat-pay-complete__credentials-list">
              <div className="retreat-pay-complete__credentials-row">
                <dt>교회 이름</dt>
                <dd>{churchName}</dd>
              </div>
              <div className="retreat-pay-complete__credentials-row">
                <dt>비밀번호</dt>
                <dd className="retreat-pay-complete__credential-value">
                  <span className="retreat-pay-complete__mono">{passwd}</span>
                  <CopyTextButton text={passwd} />
                </dd>
              </div>
              {ownerpw ? (
                <div className="retreat-pay-complete__credentials-row">
                  <dt>관리자 비밀번호</dt>
                  <dd className="retreat-pay-complete__credential-value">
                    <span className="retreat-pay-complete__mono">{ownerpw}</span>
                    <CopyTextButton text={ownerpw} />
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="retreat-pay-complete__credentials-warn">
              관리자 비번은 공유하지 마세요.
            </p>
            <p className="retreat-pay-complete__credentials-note">
              위 정보는 서비스관리자 로그인에 사용됩니다. 반드시 안전한 곳에 보관해 주세요.
            </p>
          </div>
        ) : null}

        <div className="retreat-pay-complete__info">
          <p>
            <strong>서비스관리자</strong>는 결제하신 수련회 전단지를 편집·배포하는 전용 관리 화면입니다.
          </p>
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            관리자 주소: <span style={{ wordBreak: 'break-all' }}>{adminBase}</span>
          </p>
        </div>

        <div className="retreat-pay-complete__btns">
          <button
            type="button"
            className="retreat-pay-complete__btn retreat-pay-complete__btn--primary"
            onClick={() => goToMmservice('/')}
          >
            서비스관리자에서 제작하기
          </button>
          <button
            type="button"
            className="retreat-pay-complete__btn retreat-pay-complete__btn--secondary"
            onClick={() => {
              navigate('/service/bookletretreat');
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
