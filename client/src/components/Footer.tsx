import './footer.scss'
import { useNavigate } from 'react-router-dom';

export default function Footer (props:any) {
  
  let navigate = useNavigate();

  return (
    <footer className='footer'>

      <div className="response-cover">

        <div className="inner">
          
          <ul className='mobile-none'>
            <a href='http://www.ministermore.co.kr/usingpolicy.html' target='_blank'>
              <li className='link'>이용약관</li>
            </a>
            <div className='divider'></div>
            <a href='http://www.ministermore.co.kr/personalinfo.html' target='_blank'>
              <li className='link'>개인정보처리방침</li>
            </a>
            <div className='divider'></div>
            <div onClick={()=>{
               navigate(`/admin`);
               window.scrollTo(0, 0);
            }}>
              <li className='link'>관리자</li>
            </div>
          </ul>

          <ul>
            <li className='text black'>스카이뷰티컴퍼니</li>
            <li className='text black'>대표자: 강신애</li>
            <li className='text'>사업자등록번호: 422-20-02318</li>
            <li className='text'>연락처: 010-9584-5948</li>
          </ul>

          <ul>
            <li className='text black'>주소 : 대구광역시 달성군 다사읍 달구벌대로 174길 50</li>
          </ul>

          <ul>
            <li className='text'>E-mail: skybeauty02318@naver.com</li>
          </ul>

          <ul className='copyright'>
            <li className='text'>COPYRIGHT</li>
            <li className='text black'>© 2026. SkybeautyCompany.</li>
            <li className='text'>All rights reserved.</li>
          </ul>

          {/* <a className="kakaoBtnBox"
            href='http://pf.kakao.com/_xmwxoIn' target='_blank'
          >
            <img src={kakaologo}/>
            <p>카카오채널</p>
            <p>문의하기</p>
          </a> */}

        </div>
      </div>
    </footer>
      
  );
}

 

