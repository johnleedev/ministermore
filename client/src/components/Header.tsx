import React, { useState, useEffect } from 'react';
import './Header.scss';
import { useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import { recoilLoginPath, recoilLoginState, recoilUserData } from '../RecoilStore';

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
    { title: "수련회", url:"/retreat", 
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
    { title: "서비스", url:"/service", 
      links: [
        {title:"모바일전단지(소개)", subUrl:"/service/notice"},
        {title:"모바일전단지(행사)", subUrl:"/service/event"},
        {title:"홈인앱", subUrl:"/service/homeinapp"},
        {title:"교회어플", subUrl:"/service/churchapp"},
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
      if (window.scrollY > 10 && window.scrollY < 100) {
        setMenuOpen(false);
      } 
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);


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
                            navigate(item.url);
                          }}
                        >{item.title}</div>
                        <div className="menu-body">
                          { 
                            item.links.map((subItem:any, subIndex:any) => (
                              <div className="menu-part" key={subIndex}>
                                <div onClick={()=>{
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
