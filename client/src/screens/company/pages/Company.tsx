import { useState } from 'react';
import '../Company.scss';
import { useNavigate } from 'react-router-dom';

export default function Company() {
  
  let navigate = useNavigate();
  const [currentMenu, setCurrentMenu] = useState(1);

  return (
    <div className='company'>

      <div className="inner">

        <div className="subpage__main">
          <div className="subpage__main__title">소개</div>
          <div className="subpage__main__content">
           
            <div className="notice-cover">

              <div className="cover">
                <div className="notice right">
                  <h2>우리의 비전</h2>
                  <h4>Changing Culture, Changing World</h4>
                  <p>우리는 문화를 바꾸고, 세상을 바꿉니다.</p>
                </div>
              </div>

              <div className="cover">
                <div className="notice right">
                  <h2>우리의 목적</h2>
                  <p>'사역자모아'는 복음의 확장과 사역자들의 사역을 돕는 플랫폼으로서</p>
                  <p>이 세대를 하나님께 이끄는데 기여하고자 합니다.</p>
                </div>
              </div>

              {/* <div className="cover mobile">
                <div className="notice row">
                  <div className="notice-text-row">
                    <p className='notice-text-title'>사역자들</p>
                    <p className="notice-text-right">사역자들을 위한 공간입니다.</p>
                  </div>
                  <div className="notice-text-row">
                    <p className='notice-text-title'>예배사역</p>
                    <p className="notice-text-right">예배 사역을 돕기 위한 공간입니다.</p>
                  </div>
                </div>
              </div> */}

              {/* <div className="cover">
                <div className="notice row">
                  <div className="notice-text-row">
                    <p className='notice-text-title'>온라인전단지</p>
                    <p className="notice-text-right">인쇄비를 지불해야 하는 종이 전단지를 대신함으로, 비용을 절감하며, 환경 보호에 기여할 수 있습니다.</p>
                  </div>
                  <div className="notice-text-row">
                    <p className='notice-text-title'>온라인출석부</p>
                    <p className="notice-text-right">종이 출석부를 대신하여, 편의성을 높이며, 비용도 절감할 수 있습니다.</p>
                  </div>
                </div>
              </div> */}

              <div className="cover">
                <div className="notice right">
                  <h2>사역자모아는 이를 목적으로 만들어진 플랫폼입니다.</h2>
                  <h2>사역자모아에서 보다 나은 문화를 경험해보세요!</h2>
                </div>
              </div>

              {/* <div className="cover">
                <div className="notice right">
                  <h2>관련링크</h2>
                  <a className='notice-row'
                    href='https://www.instagram.com/artsbook.co.kr' target='_blank'
                  >
                   <img src={instarlogo}/>
                   <div className="notice-row-textbox">
                    <p>##</p>
                    <p>사역자모아 공식 인스타그램</p>
                   </div>
                  </a>
                  <a className='notice-row'
                    href='http://pf.kakao.com/_xmwxoIn' target='_blank'
                  >
                   <img src={kakaologo}/>
                   <div className="notice-row-textbox">
                    <p>##</p>
                    <p>사역자모아 공식 카카오채널</p>
                   </div>
                  </a>
                </div>
              </div> */}

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

