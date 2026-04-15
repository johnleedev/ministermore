import { useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import './BulletinComplete.scss';

export default function BulletinComplete() {
  const navigate = useNavigate();

  return (
    <div className="bulletin-complete">
      <div className="bulletin-complete__inner">
        <div className="bulletin-complete__icon">
          <FaCheckCircle />
        </div>
        <h1 className="bulletin-complete__title">모바일 주보 작성이 완료되었습니다</h1>
        <p className="bulletin-complete__desc">
          이번 주 주보가 저장되었습니다. 필요하면 언제든 다시 수정할 수 있습니다.
        </p>
        <div className="bulletin-complete__btns">
          <button
            type="button"
            className="bulletin-complete__btn bulletin-complete__btn--primary"
            onClick={() => navigate('/service/bookletbulletincreate')}
          >
            주보 수정하기
          </button>
          <button
            type="button"
            className="bulletin-complete__btn bulletin-complete__btn--secondary"
            onClick={() => navigate('/service')}
          >
            서비스 목록으로
          </button>
        </div>
      </div>
    </div>
  );
}
