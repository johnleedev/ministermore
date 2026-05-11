import { useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import './HomeinappComplete.scss';

export default function HomeinappComplete() {
  const navigate = useNavigate();

  return (
    <div className="homeinapp-complete">
      <div className="homeinapp-complete__inner">
        <div className="homeinapp-complete__icon">
          <FaCheckCircle />
        </div>
        <h1 className="homeinapp-complete__title">홈인앱 결제가 완료되었습니다</h1>
        <p className="homeinapp-complete__desc">
          결제가 정상 승인되었으며 홈인앱 서비스 준비가 완료되었습니다.
        </p>
        <div className="homeinapp-complete__btns">
          <button
            type="button"
            className="homeinapp-complete__btn homeinapp-complete__btn--primary"
            onClick={() => navigate('/mypage/homeinapp-notification')}
          >
            홈인앱 관리로 이동
          </button>
          <button
            type="button"
            className="homeinapp-complete__btn homeinapp-complete__btn--secondary"
            onClick={() => navigate('/service')}
          >
            서비스 목록으로
          </button>
        </div>
      </div>
    </div>
  );
}
