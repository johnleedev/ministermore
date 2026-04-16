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
        <h1 className="bulletin-complete__title">결제가 완료되었습니다.</h1>
        <h1 className="bulletin-complete__title">마이페이지에서 관리하시면 됩니다.</h1>
        {/* <p className="bulletin-complete__desc">
          결제가 완료되었습니다. 마이페이지에서 관리하시면 됩니다.
        </p> */}
        <div className="bulletin-complete__btns">
          <button
            type="button"
            className="bulletin-complete__btn bulletin-complete__btn--primary"
            onClick={() => navigate('/mypage/servicemanage')}
          >
            마이페이지로 이동
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
