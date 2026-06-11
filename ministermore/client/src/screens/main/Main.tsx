import { useEffect, useState } from 'react';
import Footer from '../../components/Footer';
import './Main.scss'
import axios from 'axios';
import MainURL from '../../MainURL';
import { useRecoilValue } from 'recoil';
import { recoilLoginState, recoilUserData } from '../../RecoilStore';
import { useNavigate } from 'react-router-dom';
import kakaologo from "../../images/login/kakao.png"
import instarlogo from "../../images/instarlogo.jpeg"
import mainBanner from '../../images/main.png';
import appAdvBanner from '../../images/appadv.png';
import { FaArrowRight } from "react-icons/fa";
import { BsFileEarmarkPerson } from "react-icons/bs";
import { RiAdvertisementLine } from "react-icons/ri";
import { FaItunesNote } from "react-icons/fa";
import Header from '../../components/Header';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { motion } from "framer-motion";

const APP_ADV_POPUP_KEY = 'appAdvPopupDismissedDate';

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function shouldShowAppAdvPopup() {
  return sessionStorage.getItem(APP_ADV_POPUP_KEY) !== getTodayDateString();
}

const APP_STORE_URL =
  'https://apps.apple.com/kr/app/%EC%82%AC%EC%97%AD%EC%9E%90%EB%AA%A8%EC%95%84/id6771267063';


interface RecruitProps {
  id: string;
  title: string;
  source: string;
  writer: string;
  date: string;
  church: string;
  religiousbody: string;
  location: string;
  locationDetail: string;
  address: string;
  mainpastor: string;
  homepage: string;
  school: string;
  career: string;
  sort: string;
  part: string;
  partDetail: string;
  recruitNum: string;
  workday: string;
  workTimeSunDay: string;
  workTimeWeek: string;
  dawnPray: string;
  pay: string;
  welfare: string;
  insurance: string;
  severance: string;
  applydoc: string;
  applyhow: string;
  applytime: string;
  etcNotice: string;
  inquiry: string;
  churchLogo: string;
  customInput: string;
}

interface NewsProps {
  id: number;
  title: string;
  source: string;
  writer: string;
  date: string;
  link: string;
  thumbnail: string;
}

interface NewsBySource {
  [key: string]: NewsProps[];
}

interface PlaceItem {
  id: number;
  isView: string | boolean | number | null;
  placeName: string;
  sort: string;
  region: string;
  location: string;
  size: string;
  images: string | string[] | null;
}

const MAIN_RECRUIT_DISPLAY_COUNT = 9;
const MAIN_PLACE_PAGE_SIZE = 6;

const getFirstPlaceImage = (images: PlaceItem['images']) => {
  if (!images) return '';
  if (Array.isArray(images)) return images[0] || '';
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed[0] || '' : '';
  } catch {
    return images;
  }
};



export default function Main(props:any) {

	let navigate = useNavigate();
  const isLogin = useRecoilValue(recoilLoginState);
	const userData = useRecoilValue(recoilUserData);
  const [recruitList, setRecruitList] = useState<RecruitProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [placeList, setPlaceList] = useState<PlaceItem[]>([]);
  const [isPlaceLoading, setIsPlaceLoading] = useState<boolean>(true);
  const [newsBySource, setNewsBySource] = useState<NewsBySource>({});
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'denomination' | 'school'>('denomination');
  const [listNotice, setListNotice] = useState<any[]>([]);
  const [myIp, setMyIp] = useState<string>('');
  const [showAppAdvPopup, setShowAppAdvPopup] = useState(false);
  const [dismissAppAdvToday, setDismissAppAdvToday] = useState(false);
  // REMOVE: const [totalVisits, setTotalVisits] = useState<number>(0);
  // REMOVE: const [uniqueVisitors, setUniqueVisitors] = useState<number>(0);

  // 메인 페이지에서 표시할 언론사 (9개)
  // const mainSources = ['크리스천투데이', '기독신문', '뉴스앤조이', '기독교헤럴드', 'GPNews', '더미션', 
  //   '기독일보', '선교신문', '기독교포털뉴스', '한국성결신문', '침례신문', '나사렛신문', '개혁신보', '한국기독공보'];
  const religiousbodyList = [
    {name: "구세군대한본영", home: "https://www.thesalvationarmy.or.kr/"},
    {name: "기독교대한감리회", home: "https://kmc.or.kr/"},
    {name: "기독교대한성결교회", home: "https://www.kehc.org/"},
    {name: "기독교대한하나님의성회", home: "http://agk.or.kr/"},
    {name: "기독교한국침례회", home: "http://www.koreabaptist.or.kr/"},
    {name: "대한기독교나사렛성결회", home: "https://na.or.kr/"},
    {name: "대한예수교장로회고신", home: "http://kosin.org/"},
    {name: "대한예수교장로회통합", home: "https://www.pck.or.kr/"},
    {name: "대한예수교장로회합동", home: "https://alpha.gapck.org/"},
    {name: "대한예수교장로회합신", home: "https://www.hapshin.org/"},
    {name: "예수교대한성결교회", home: "https://www.sungkyul.org/"},
    {name: "한국기독교장로회", home: "https://www.prok.org/gnu/index.php"},
    {name: "독립교단(KAICAM)", home: "https://home.kaicam.org/index.asp"}
  ];
  const schoolList = [
    {name: "고려신학대학원", home: "https://www.kts.ac.kr/home/"},
    {name: "광신대학교", home: "https://www.kwangshin.ac.kr/home/index.do"},
    {name: "구세군군사관대학원대학교", home: "https://gufot.ac.kr"},
    {name: "대전신학대학교", home: "https://www.daejeon.ac.kr"},
    {name: "대신대학교", home: "https://www.daeshin.ac.kr/html/00_main/"},
    {name: "부산장신대학교", home: "https://www.bpu.ac.kr/Default.aspx"},
    {name: "서울장신대학교", home: "https://www.sjs.ac.kr"},
    {name: "서울신학대학교신대원", home: "https://gs.stu.ac.kr/CmsHome/StuGs0207_0101.eznic"},
    {name: "성결교신대원", home: "http://www.skts.org/"},
    {name: "영남신학대학교", home: "https://www.ytus.ac.kr/html/index.php"},
    {name: "웨스트민스터신학대학원대학교", home: "http://www.wgst.ac.kr/wgst_renew"},
    {name: "장로회신학대학교", home: "https://www.puts.ac.kr"},
    {name: "총신대학교", home: "https://www.csu.ac.kr/"},
    {name: "한세대학교", home: "https://www.hansei.ac.kr/sites/kor/index.do"},
    {name: "한신대학교", home: "https://www.hs.ac.kr/gradseoulcampus/index.do"},
    {name: "한일장신대학교", home: "https://www.hanil.ac.kr"},
    {name: "한국침례신학대학교신대원", home: "https://gtheology.kbtus.ac.kr/gtheology/Main.do"},
    {name: "호남신학대학교", home: "https://www.htus.ac.kr/index.php#"}
  ];
  

  
  

  // 채용공고 최신 9개 가져오기
  const fetchRecruitList = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${MainURL}/recruitminister/getrecruitformain`);
      if (res.data.resultData) {
        setRecruitList((res.data.resultData as RecruitProps[]).slice(0, MAIN_RECRUIT_DISPLAY_COUNT));
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaceList = async () => {
    try {
      setIsPlaceLoading(true);
      const res = await axios.post(`${MainURL}/retreat/getdataplace`, {
        region: 'all',
        sort: 'all',
        page: 1,
        pageSize: MAIN_PLACE_PAGE_SIZE,
      });
      if (res.data.data) {
        setPlaceList(res.data.data as PlaceItem[]);
      } else {
        setPlaceList([]);
      }
    } catch (error) {
      console.log(error);
      setPlaceList([]);
    } finally {
      setIsPlaceLoading(false);
    }
  };

  const openPlaceDetail = (id: number) => {
    if (!isLogin) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (userData.grade === '일반회원') {
      alert('등업이 필요합니다. 등업신청 게시판에서 신청해주세요');
      return;
    }
    window.scrollTo(0, 0);
    navigate(`/retreat/place/detail?id=${id}`);
  };

  // 글자수 제한
  const renderPreview = (content: string, maxLength: number) => {
    if (content?.length > maxLength) {
      return content.substring(0, maxLength) + '...';
    }
    return content;
  };

  // 뉴스 데이터 가져오기
  const fetchNews = async () => {
    try {
      setIsNewsLoading(true);
      const res = await axios.get(`${MainURL}/news/getnewsdata`);
      if (res.data.resultData) {
        setNewsBySource(res.data.groupedBySource || {});
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsNewsLoading(false);
    }
  };

  // 제목에서 백슬래시 제거
  const cleanTitle = (title: string) => {
    if (!title) return '';
    return title.replaceAll("\\'", "'").replaceAll('\\"', '"').replaceAll('\\\\n', '\n');
  };

  // 제목 글자수 제한
  const truncateTitle = (title: string, maxLength: number = 40) => {
    const cleanedTitle = cleanTitle(title);
    if (cleanedTitle?.length > maxLength) {
      return cleanedTitle.substring(0, maxLength) + '...';
    }
    return cleanedTitle;
  };

  // 시간 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}일 전`;
    } else if (hours > 0) {
      return `${hours}시간 전`;
    } else {
      return '방금 전';
    }
  };

  // 접속시(메인화면) 방문자수/접속수 증가 (통합)
  const countUp = (type: string) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    axios
      .post(`${MainURL}/admin/countup`, {
        date,
        type
      })
      .then(() => {})
      .catch((error) => {
        console.log(error);
      });
  }
      
  useEffect(() => {
    if (myIp) {
      countUp('mainconnect');
    }
  }, [myIp]);

  useEffect(() => {
    // 외부 API로 내 IP 받아오기
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        setMyIp(data.ip);
        // 방문자 카운트 증가 (POST)
        const today = new Date().toISOString().slice(0, 10);
        axios.post(`${MainURL}/admin/homeusercount`, { date: today, ip: data.ip });
      })
      .catch(() => {
        setMyIp('');
      });
    // REMOVE: axios.get(`${MainURL}/admin/homeusercount/total`)...
  }, []);

  useEffect(()=>{
    fetchRecruitList();
    fetchPlaceList();
    fetchNews();
  }, []);

  useEffect(() => {
    if (shouldShowAppAdvPopup()) {
      setShowAppAdvPopup(true);
    }
  }, []);

  const closeAppAdvPopup = () => {
    if (dismissAppAdvToday) {
      sessionStorage.setItem(APP_ADV_POPUP_KEY, getTodayDateString());
    }
    setShowAppAdvPopup(false);
  };



	return (
		<div className='main'>

      <Header/>
      {showAppAdvPopup && (
        <div className="main__app__adv__overlay" onClick={closeAppAdvPopup}>
          <div className="main__app__adv__modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="main__app__adv__close"
              onClick={closeAppAdvPopup}
              aria-label="닫기"
            >
              <IoClose />
            </button>
            <img
              src={appAdvBanner}
              alt="사역자모아 공식 앱 출시"
              className="main__app__adv__img"
            />
            <div className="main__app__adv__footer">
              <label className="main__app__adv__dismiss">
                <input
                  type="checkbox"
                  checked={dismissAppAdvToday}
                  onChange={(e) => setDismissAppAdvToday(e.target.checked)}
                />
                <span>오늘 그만 보기</span>
              </label>
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="main__app__adv__go"
              >
                바로가기 <MdKeyboardDoubleArrowRight style={{marginLeft: '5px', fontSize: '25px'}}/>
              </a>
            </div>
          </div>
        </div>
      )}
      {/* 상단 배너 이미지 + 텍스트 */}
      <div className="main__top__banner">
        <img src={mainBanner} alt="메인 배너" className="main__top__banner__img" />
        <div className="main__top__banner__text">
          <span className="welcome">welcome</span>
          <span className="brand">사역자모아</span>
        </div>
      </div>
      {/* REMOVE: 방문자수/접속수 통계 표시 */}
      {/* <div style={{textAlign: 'center', margin: '16px 0', color: '#888', fontSize: 15}}>
        누적 방문자수: <b>{uniqueVisitors}</b>명 / 총 접속수: <b>{totalVisits}</b>회
      </div> */}

      <div className="main__box1">
				<div className="inner">
         
          <div className="main__recruit__header">
            <h2>최신 채용공고</h2>
            <button 
              className="main__recruit__more"
              onClick={() => {
                window.scrollTo(0, 0);
                navigate('/recruit');
              }}
            >
              더보기 <FaArrowRight />
            </button>
          </div>
          
          <div className="main__recruit__section">
            <div className="main__recruit__list main__card__grid">
              {isLoading ? (
                <div className="main__recruit__loading">
                  <p>채용공고를 불러오는 중...</p>
                </div>
              ) : recruitList.length === 0 ? (
                <div className="main__recruit__empty">
                  <p>현재 등록된 채용공고가 없습니다.</p>
                </div>
              ) : (
                recruitList.slice(0, MAIN_RECRUIT_DISPLAY_COUNT).map((item) => {
                  const part = item.part ? JSON.parse(item.part) : [{sort: '전임', content: ''}];
                  const pay = item.pay ? JSON.parse(item.pay) : [{sort: '전임', paySort: 'select', selectCost: '', inputCost: ''}];

                  return (
                    <article
                      key={item.id}
                      className="main__recruit__item main__card"
                      onClick={() => {
                        countUp('recruitview');
                        navigate(`/recruit/recruitministerdetail?id=${item.id}`);
                        window.scrollTo(0, 0);
                      }}
                    >
                      <div className="main__recruit__content">
                        <div className="main__recruit__top">
                          <div className="main__recruit__church">
                            <img src={`${MainURL}/siteimages/religiousbody/${item.religiousbody}.jpg`} alt={item.religiousbody} />
                            <span className="church-name">{item.church}</span>
                          </div>
                          <div className="main__recruit__date">
                            <span>{item.date}</span>
                          </div>
                        </div>
                        <div className="main__recruit__title">
                          <h3>{renderPreview(item.title, 40)}</h3>
                        </div>
                        <div className="main__recruit__details">
                          <div className="main__recruit__info">
                            <span className="location">{item.location} {item.locationDetail}</span>
                            <span className="divider">|</span>
                            <span className="sort">{item.sort}</span>
                            {part[0].content && (
                              <>
                                <span className="divider">|</span>
                                <span className="part">{renderPreview(part[0].content, 15)}</span>
                              </>
                            )}
                          </div>
                          <div className="main__recruit__pay">
                            {(pay[0].inputCost === '교회내규에따라' || pay[0].inputCost === '협의후결정') ? (
                              <span>{pay[0].inputCost}</span>
                            ) : (
                              <span>
                                {pay[0].selectCost === '' && pay[0].inputCost !== ''
                                  ? `${pay[0].sort}: ${pay[0].inputCost}`
                                  : `${pay[0].sort}: ${pay[0].paySort} ${pay[0].selectCost}`
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <div className="main__recruit__header main__place__header">
            <h2>수련회 장소</h2>
            <button
              className="main__recruit__more"
              onClick={() => {
                window.scrollTo(0, 0);
                navigate('/retreat/place');
              }}
            >
              더보기 <FaArrowRight />
            </button>
          </div>

          <div className="main__place__section">
            <div className="main__place__list main__card__grid">
              {isPlaceLoading ? (
                <div className="main__place__loading">
                  <p>수련회 장소를 불러오는 중...</p>
                </div>
              ) : placeList.length === 0 ? (
                <div className="main__place__empty">
                  <p>현재 등록된 수련회 장소가 없습니다.</p>
                </div>
              ) : (
                placeList.map((place) => {
                  const firstImage = getFirstPlaceImage(place.images);
                  return (
                    <article
                      key={place.id}
                      className="main__place__item main__card"
                      onClick={() => openPlaceDetail(place.id)}
                    >
                      <div className="main__place__img">
                        <span className="main__place__location">{place.location}</span>
                        {firstImage ? (
                          <img
                            src={`${MainURL}/images/retreat/placeimage/${firstImage}`}
                            alt={place.placeName}
                          />
                        ) : (
                          <div className="main__place__noimg">등록된 사진이 없습니다.</div>
                        )}
                      </div>
                      <div className="main__place__body">
                        <h3 className="main__place__name">{place.placeName}</h3>
                        <p className="main__place__meta">종류: {place.sort}</p>
                        <p className="main__place__meta">규모: {place.size}</p>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <a className="kakaoBtnBox"
            href='http://pf.kakao.com/_Xzwrn' target='_blank'
          >
            <img src={kakaologo}/>
            <p>카카오채널</p>
            <p>문의하기</p>
          </a>

				</div>	
  		</div>

     <div className="main_adv_banner" style={{borderBottom:'1px solid #BDBDBD'}}>
        <a className='instarAdv'
          href='https://www.instagram.com/ministermore_' target='_blank'
        >
          <img src={instarlogo}/>
          <p className='instarAdv_textmagin'>ministermore_</p>
          <p>## 사역자모아 공식 인스타계정</p>
        </a>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, amount: 0.2 }}
      >
      <div className="main__denomination__section">
        <div className="inner">
          <div className="main__denomination__header">
            <div className="main__denomination__tabs">
              <button 
                className={`main__denomination__tab ${activeTab === 'denomination' ? 'active' : ''}`}
                onClick={() => setActiveTab('denomination')}
              >
                총회 홈페이지
              </button>
              <button 
                className={`main__denomination__tab ${activeTab === 'school' ? 'active' : ''}`}
                onClick={() => setActiveTab('school')}
              >
                신학교 홈페이지
              </button>
            </div>
          </div>
          
          <div className="main__denomination__grid">
            {(activeTab === 'denomination' ? religiousbodyList : schoolList).map((item, index) => (
              <div key={index} className="main__denomination__item">
                <button 
                  className="main__denomination__button"
                  onClick={() => {
                    window.scrollTo(0, 0);
                    if (item.home) {
                      window.open(item.home, '_blank');
                    } else {
                      console.log(`${item.name} 홈페이지 URL이 없습니다`);
                    }
                  }}
                >
                  <div className="main__denomination__image">
                    {
                      activeTab === 'denomination' 
                      ? <img className='main__denomination__image__denomination'
                          src={`${MainURL}/siteimages/religiousbody/${item.name}.jpg`} 
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.src = `${MainURL}/images/altImage.jpeg`;
                          }}
                        />
                      : <img className='main__denomination__image__school'
                          src={`${MainURL}/siteimages/schoollogos/${item.name}.png`} 
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.src = `${MainURL}/images/altImage.jpeg`;
                          }}
                        />
                    }
                  </div>
                  <div className="main__denomination__name">
                    <p>{item.name}</p>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      </motion.div>
      

			<div className="main__box2">
				<div className="inner">
         

          <div className="main_bottom_cover">
            <div className="main_bottom_box"
              onClick={()=>{
                window.scrollTo(0, 0);
                navigate('/service');
              }}
            >
              <div className="main_left_icon">
                <BsFileEarmarkPerson />
              </div>
              <div className="main_middle_text">
                <h1>서비스</h1>
                <p>원하시는 모바일 서비스를</p>
                <p>찾아보세요</p>
              </div>
              <div className="main_right_link">
                <FaArrowRight />
              </div>
            </div>
            <div className="main_bottom_box"
              onClick={()=>{
                window.scrollTo(0, 0);
                navigate('/worship');
              }}
            >
              <div className="main_left_icon">
                <FaItunesNote />
              </div>
              <div className="main_middle_text">
                <h1>예배사역</h1>
                <p>예배에 과한 정보를</p>
                <p>찾아보세요</p>
              </div>
              <div className="main_right_link">
                <FaArrowRight />
              </div>
            </div>
            <div className="main_bottom_box"
              onClick={()=>{
                window.scrollTo(0, 0);
                navigate('/company/advertise');
              }}
            >
              <div className="main_left_icon">
                <RiAdvertisementLine />
              </div>
              <div className="main_middle_text">
                <h1>광고및제휴</h1>
                <p>광고나 제휴를 원하시면</p>
                <p>내용을 작성해서 신청해주세요</p>
              </div>
              <div className="main_right_link">
                <FaArrowRight />
              </div>
            </div>
          </div>
          
				</div>	
  		</div> 

    
      
           
			<ScrollToTopButton />
			<Footer />

		</div>
	);
}
