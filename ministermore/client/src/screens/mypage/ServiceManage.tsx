import './Mypage.scss';
import MypageMenu from './MypageMenu';
import { Link } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { recoilLoginState, recoilUserData } from '../../RecoilStore';
import ServicePaymentList from './ServicePaymentList';

export default function ServiceManage() {
  const isLogin = useRecoilValue(recoilLoginState);
  const userAccount = useRecoilValue(recoilUserData)?.userAccount?.trim() || '';

  return (
    <div className="mypage">
      <div className="inner">
        <MypageMenu />
        <div className="subpage__main">
          <div className="subpage__main__title" style={{ marginBottom: '8px' }}>
            서비스 관리
          </div>
          <p className="service-manage__lead">
            결제하신 서비스 내역을 확인할 수 있습니다.
          </p>
          <div className="subpage__main__content">
            <div className="main__content">
              {!isLogin || !userAccount ? (
                <div className="noPosts">
                  <p>로그인 후 결제 내역을 확인할 수 있습니다.</p>
                  <p style={{ marginTop: 12 }}>
                    <Link to="/login" className="service-manage__login-link">
                      로그인하기
                    </Link>
                  </p>
                </div>
              ) : (
                <ServicePaymentList userAccount={userAccount} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
