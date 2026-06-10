import './Mypage.scss';
import MypageMenu from './MypageMenu';
import { useRecoilState } from 'recoil';
import { recoilUserData } from '../../RecoilStore';
import ServicePaymentList from './ServicePaymentList';

export default function ServiceManage() {
  const [userData] = useRecoilState(recoilUserData);

  return (
    <div className="mypage">
      <div className="inner">
        <MypageMenu />
        <div className="subpage__main">
          <div className="subpage__main__title" style={{ marginBottom: '20px' }}>
            결제 내역
          </div>
          <div className="subpage__main__content">
            <div className="main__content">
              <ServicePaymentList userAccount={userData?.userAccount} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
