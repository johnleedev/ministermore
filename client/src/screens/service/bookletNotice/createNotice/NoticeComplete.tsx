import { useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import './NoticeComplete.scss';

export default function NoticeComplete() {
  const navigate = useNavigate();

  return (
    <div className="notice-complete">
      <div className="notice-complete__inner">
        <div className="notice-complete__icon">
          <FaCheckCircle />
        </div>
        <h1 className="notice-complete__title">전단지 작성이 완료되었습니다</h1>
        <p className="notice-complete__desc">
          교회 소개 전단지가 성공적으로 저장되었습니다.
        </p>
        <div className="notice-complete__btns">
          <button
            type="button"
            className="notice-complete__btn notice-complete__btn--primary"
            onClick={() => navigate('/service/bookletnoticecreate')}
          >
            전단지 수정하기
          </button>
          <button
            type="button"
            className="notice-complete__btn notice-complete__btn--secondary"
            onClick={() => navigate('/service')}
          >
            서비스 목록으로
          </button>
        </div>
      </div>
    </div>
  );
}
