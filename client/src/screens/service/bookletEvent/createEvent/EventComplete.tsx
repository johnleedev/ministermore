import { useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import './EventComplete.scss';

export default function EventComplete() {
  const navigate = useNavigate();

  return (
    <div className="event-complete">
      <div className="event-complete__inner">
        <div className="event-complete__icon">
          <FaCheckCircle />
        </div>
        <h1 className="event-complete__title">행사 전단지 작성이 완료되었습니다</h1>
        <p className="event-complete__desc">
          교회 행사 전단지가 성공적으로 저장되었습니다.
        </p>
        <div className="event-complete__btns">
          <button
            type="button"
            className="event-complete__btn event-complete__btn--primary"
            onClick={() => navigate('/service/bookleteventcreate')}
          >
            전단지 수정하기
          </button>
          <button
            type="button"
            className="event-complete__btn event-complete__btn--secondary"
            onClick={() => navigate('/service')}
          >
            서비스 목록으로
          </button>
        </div>
      </div>
    </div>
  );
}
