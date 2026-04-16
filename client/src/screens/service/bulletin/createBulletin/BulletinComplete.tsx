import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import axios from 'axios';
import { FaCheckCircle } from 'react-icons/fa';
import MainURL from '../../../../MainURL';
import { recoilUserData } from '../../../../RecoilStore';
import './BulletinComplete.scss';

export default function BulletinComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = useRecoilValue(recoilUserData);
  const userAccount = userData?.userAccount || '';
  const [generating, setGenerating] = useState(false);

  const bulletinMainId = useMemo(() => {
    const idRaw = new URLSearchParams(location.search).get('id');
    const n = Number(idRaw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [location.search]);

  useEffect(() => {
    const run = async () => {
      if (!bulletinMainId && !userAccount) return;
      try {
        setGenerating(true);
        await axios.post(`${MainURL}/bulletincreate/generateBulletinHtml`, {
          ...(bulletinMainId ? { bulletinMainId } : {}),
          ...(userAccount ? { userAccount } : {}),
        });
      } catch (e) {
        console.error('주보 완료 HTML 생성 실패:', e);
      } finally {
        setGenerating(false);
      }
    };
    void run();
  }, [bulletinMainId, userAccount]);

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
            disabled={generating}
            onClick={() => navigate('/mypage/servicemanage')}
          >
            마이페이지로 이동
          </button>
          <button
            type="button"
            className="bulletin-complete__btn bulletin-complete__btn--secondary"
            disabled={generating}
            onClick={() => navigate('/service')}
          >
            서비스 목록으로
          </button>
        </div>
      </div>
    </div>
  );
}
