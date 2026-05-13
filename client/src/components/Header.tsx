import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Header.scss';
import { useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import { recoilLoginPath, recoilLoginState, recoilUserData } from '../RecoilStore';
import MainURL from '../MainURL';

const Header: React.FC = () => {
  
  let navigate = useNavigate();
  const [isLogin, setIsLogin] = useRecoilState(recoilLoginState);
  const [userData, setUserData] = useRecoilState(recoilUserData);
  const loginPath = useRecoilValue(recoilLoginPath);

  const menus = [
    { title: "구인구직", url:"/recruit", 
      links: [
        {title:"사역자", subUrl:"/recruit"}, 
        {title:"찬양대/방송/직원", subUrl:"/recruit/recruitchurchlist"}, 
        {title:"학교/기관/단체", subUrl:"/recruit/recruitinstitutelist"}, 
      ]
    },
    // { title: "사역자", url:"/minister", 
    //   links: [
    //     {title:"프로필페이지", subUrl:"/minister"}, 
    //     // {title:"사역지", subUrl:"/worship"}, 
    //   ]
    // },
    { title: "수련회", url:"/retreat", countType: "retreatmenu",
      links: [
        {title:"수련회장소", subUrl:"/retreat/place"}, 
        {title:"장소후기", subUrl:"/retreat/review"}, 
        {title:"수련회강사", subUrl:"/retreat/casting"}, 
        {title:"등업신청", subUrl:"/retreat/grade"}, 
      ]
    },
    { title: "예배사역", url:"/worship", 
      links: [
        {title:"적용찬양찾기", subUrl:"/worship"}, 
        {title:"콘티만들기", subUrl:"/worship/conti"}, 
      ]
    },
    { title: "서비스", url:"/service", countType: "servicemenu",
      links: [
        {title:"홈인앱", subUrl:"/service/homeinapp"},
        {title:"교회어플", subUrl:"/service/churchapp"},
        {title:"모바일전단지(소개)", subUrl:"/service/notice"},
        {title:"모바일전단지(행사)", subUrl:"/service/event"},
        // {title:"홈페이지", subUrl:"/service/homepage"},
        // {title:"모바일주보", subUrl:"/service/bulletin"},     
      ]
    },
    { title: "커뮤니티", url:"/community", 
      links: [
        {title:"공지사항", subUrl:"/community"},   
        // {title:"중고장터", subUrl:"/community/usedmarket"},
        // {title:"익명게시판", subUrl:"/community"},
        
      ]
    },
    { title: "사역자모아", url:"/company", 
      links: [
        {title:"소개", subUrl:"/company"}, 
        {title:"자주 묻는 질문", subUrl:"/company/faq"},
        {title:"광고및제휴", subUrl:"/company/advertise"},
      ]
    },
  ];

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<{ [key: number]: boolean }>({});

  const toggleMenu = () => {
      setMenuOpen(!menuOpen);
  };

  // 메뉴(수련회/서비스 등) 클릭수 카운트
  const countMenuClick = (type?: string) => {
    if (!type) return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    axios.post(`${MainURL}/admin/countup`, { date, type }).catch(() => {});
  };

  const toggleMobileMenu = (index: number) => {
      setMobileMenuOpen((prevState) => ({
          ...prevState,
          [index]: !prevState[index],
      }));
  };
  const handleLogout = async () => {
    localStorage.clear();
    setIsLogin(false);
    setUserData({
      userAccount : '',
      userNickName : '',
      userSort: '',
      userDetail : '',
      grade: ''
    })
    alert('로그아웃 되었습니다.')
    window.location.replace(loginPath);
  };
    
  
  useEffect(() => {
    const handleScroll = () => {
      /** 모바일 메뉴가 열려있을 때는 페이지 스크롤로 닫히지 않도록 가드 */
      if (menuOpen) return;
      if (window.scrollY > 10 && window.scrollY < 100) {
        setMenuOpen(false);
      } 
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [menuOpen]);

  /**
   * 모바일 햄버거 메뉴 오픈 동안 배경(페이지) 스크롤 차단.
   * `overflow: hidden`만으로는 iOS Safari 등에서 체인 스크롤이 남는 경우가 있어
   * 스크롤 위치를 유지한 채 `body`를 fixed로 고정한다.
   */
  useEffect(() => {
    if (!menuOpen) return;

    const scrollY = window.scrollY;
    const prev = {
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyRight: document.body.style.right,
      bodyWidth: document.body.style.width,
      bodyOverscroll: document.body.style.overscrollBehavior,
      htmlOverflow: document.documentElement.style.overflow,
      htmlHeight: document.documentElement.style.height,
      htmlOverscroll: document.documentElement.style.overscrollBehavior,
    };

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = prev.bodyOverflow;
      document.body.style.position = prev.bodyPosition;
      document.body.style.top = prev.bodyTop;
      document.body.style.left = prev.bodyLeft;
      document.body.style.right = prev.bodyRight;
      document.body.style.width = prev.bodyWidth;
      document.body.style.overscrollBehavior = prev.bodyOverscroll;
      document.documentElement.style.overflow = prev.htmlOverflow;
      document.documentElement.style.height = prev.htmlHeight;
      document.documentElement.style.overscrollBehavior = prev.htmlOverscroll;
      window.scrollTo(0, scrollY);
    };
  }, [menuOpen]);


  return (
    <div className="header">
      <div className="header-top">
        <div className="inner">
          <div className="container header-top-container">
            {
              isLogin 
              ? <p style={{color:'#fff', marginRight:'20px'}}>{userData.userNickName}님 환영합니다</p>
              : <p style={{color:'#fff', marginRight:'20px'}}>로그인해주세요</p>
            }
            {
              isLogin 
              ?
              <div className="header-button_wrap">
                <div className="header-button"
                  onClick={handleLogout}
                >로그아웃</div>
                <div className="header-button"
                  onClick={()=>{navigate('/mypage');}}
                >마이페이지</div>
              </div>
              :
              <div className="header-button_wrap">
                <div className="header-button"
                  onClick={()=>{navigate('/login');}}
                >로그인</div>
                <div className="header-button" 
                  onClick={()=>{navigate('/login/logister');}}
                >회원가입</div>
              </div>
            }
          </div>
        </div>
      </div>
      <div className="header-content">
        <div className="inner">
          <div className="container header-content-container">
              <div className="header-logo" 
                onClick={()=>{navigate('/')}}
              >
                <h1>사역자모아</h1>
              </div>
              <div className="header-menu">
                {
                  menus.map((item:any, index:any) => (
                    <div className="menu-item" key={index}>
                        <div className="menu-face" 
                          onClick={()=>{
                            countMenuClick(item.countType);
                            navigate(item.url);
                          }}
                        >{item.title}</div>
                        <div className="menu-body">
                          { 
                            item.links.map((subItem:any, subIndex:any) => (
                              <div className="menu-part" key={subIndex}>
                                <div onClick={()=>{
                                    countMenuClick(item.countType);
                                    navigate(subItem.subUrl)
                                  }}>{subItem.title}</div>
                              </div>
                            ))
                          }
                        </div>
                    </div>
                  ))
                }
              </div>
              <div className={`header-hamburger_menu ${menuOpen ? 'header-hamburger_menu--open' : ''}`}>
                  <div className="header-hamburger_icon" onClick={toggleMenu}></div>
                  <div className="header-mobile_menu">
                      <div className="mobile_menu-inner">
                          {
                            isLogin 
                            ?
                            <div className="mobile_menu-top">
                              <span className="mobile_menu-announce">{userData.userNickName}님 환영합니다.</span>
                              <div className="mobile_menu-button_wrap">
                                  <div className="header-button" onClick={handleLogout}>로그아웃</div>
                                  <div className="header-button" onClick={()=>{navigate("/mypage"); toggleMenu();}}>마이페이지</div>
                              </div>
                            </div>
                            :
                            <div className="mobile_menu-top">
                              <span className="mobile_menu-announce">로그인해 주세요</span>
                              <div className="mobile_menu-button_wrap">
                                  <div className="header-button" onClick={()=>{
                                    navigate("/login"); toggleMenu();
                                  }}>로그인</div>
                                  <div className="header-button" onClick={()=>{
                                    navigate("/login/logister"); toggleMenu();}}
                                  >회원가입</div>
                              </div>
                            </div>
                          }
                          
                          <div className="mobile_menu-list">
                              {
                                menus.map((item:any, index:any) => (
                                  <div className={`mobile_menu-item ${mobileMenuOpen[index] ? 'mobile_menu-item--open' : ''}`} 
                                    key={index} onClick={() => 
                                      toggleMobileMenu(index)
                                    }>
                                      <div className="mobile_menu-item_inner">
                                          <div className={`mobile_menu-face ${mobileMenuOpen[index] ? 'mobile_menu-face--open' : ''}`}>
                                              <div className="mobile_menu-face_text" 
                                                onClick={()=>{
                                                  countMenuClick(item.countType);
                                                  navigate(item.url);
                                                  toggleMenu();
                                                }}>{item.title}</div>
                                              <div className="mobile_menu-face_icon"></div>
                                          </div>
                                          <div className="mobile_menu-body">
                                              {
                                                item.links.map((subItem:any, subIndex:any) => (
                                                  <div className="mobile_menu-part"
                                                    onClick={()=>{
                                                      countMenuClick(item.countType);
                                                      navigate(subItem.subUrl);
                                                      toggleMenu();
                                                    }} key={subIndex}
                                                  >
                                                    {subItem.title}
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
