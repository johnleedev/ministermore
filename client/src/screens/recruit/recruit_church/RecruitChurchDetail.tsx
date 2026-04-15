import '../Recruit.scss'
import '../RecruitList.scss'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { IoIosHeartEmpty } from 'react-icons/io'
import { MdArrowForwardIos, MdArrowBack } from 'react-icons/md'
import { IoIosStarOutline } from 'react-icons/io'
import { PiCalendarMinusThin } from 'react-icons/pi'
import { BsCalendar2Minus } from 'react-icons/bs'
import { FaCheck } from 'react-icons/fa6'
import { PiWarningCircle } from 'react-icons/pi'
import { MdOutlineLocationOn } from 'react-icons/md'
import MainURL from '../../../MainURL'
import { recoilLoginState } from '../../../RecoilStore'
import { useRecoilValue } from 'recoil'
import axios from 'axios'


export default function RecruitChurchDetail() {

  const url = new URL(window.location.href);
  const ID = url.searchParams.get("id");
  const navigate = useNavigate();
  const locationHook = useLocation();
  const recruitState = (locationHook && (locationHook as any).state)?.recruitState;

  const [school, setSchool] = useState<any>([{sort: '전임', content: ''}]);
  const [career, setCareer] = useState<any>([{sort: '전임', content: ''}]);
  const [applytime, setApplytime] = useState<any>({startDay: '', endDay: '', daySort: ''});
  const [applydoc, setApplydoc] = useState<any>([{sort: '전임', content: ''}]);
  const [inquiry, setInquiry] = useState<any>({inquiryName:"", email:"", phone:""});
  const [customInput, setCustomInput] = useState('');

  // Single value states for propsData fields
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [source, setSource] = useState('');
  const [sort, setSort] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [applyhow, setApplyhow] = useState('');
  const [etcNotice, setEtcNotice] = useState('');
  const [church, setChurch] = useState('');
  const [churchLogo, setChurchLogo] = useState('');
  const [religiousbody, setReligiousbody] = useState('');
  const [address, setAddress] = useState('');
  const [mainPastor, setMainPastor] = useState('');
  const [homepage, setHomepage] = useState('');

  // 맵 로딩 성공 여부 상태 추가
  const [mapLoaded, setMapLoaded] = useState(true);

  // 네이버 지도 구현하기
  const mapElement = useRef<HTMLDivElement | null>(null);
  const { naver } = window;
  
  // 서버를 통한 지오코딩 API 호출
  const addressAPI = async (addressQuery: any) => {
    try {
      const response = await axios.post(`${MainURL}/recruitchurch/geocode`, {
        address: addressQuery
      });
      
      if (response.data.success && response.data.coordinates) {
        const { latitude, longitude } = response.data.coordinates;
        
        if (!mapElement.current || !naver) {
          setMapLoaded(false);
          return;
        }
        
        const location = new naver.maps.LatLng(latitude, longitude);
        const mapOptions = {
          center: location,
          zoom: 12,
          zoomControl: true,
        };
        const map = new naver.maps.Map(mapElement.current, mapOptions);
        new naver.maps.Marker({
          position: location,
          map,
        });
        setMapLoaded(true);
      } else {
        setMapLoaded(false);
      }
    } catch (error) {
      console.error('지오코딩 API 오류:', error);
      setMapLoaded(false);
    }
  };


  // 게시글 가져오기
  const fetchPosts = async () => {
    const res = await axios.post(`${MainURL}/recruitchurch/getrecruitdatapart`, {
      id : ID
    })
    if (res.data) {
      const copy = {...res.data[0]}
      setSchool(copy.school ? JSON.parse(copy.school) : [{sort: '전임', content: ''}]);
      setCareer(copy.career ? JSON.parse(copy.career) : [{sort: '전임', content: ''}]);
      setApplytime(copy.applytime ? JSON.parse(copy.applytime) : {startDay: '', endDay: '', daySort: ''});
      setApplydoc(copy.applydoc ? JSON.parse(copy.applydoc) : [{sort: '전임', content: ''}]);
      setInquiry(copy.inquiry ? JSON.parse(copy.inquiry) : {inquiryName:"", email:"", phone:""});
      setCustomInput(copy.customInput || '');
      // Set single value fields
      setTitle(copy.title || '');
      setLink(copy.link || '');
      setSource(copy.source || '');
      setSort(copy.sort || '');
      setDate(copy.date || '');
      setLocation(copy.location || '');
      setLocationDetail(copy.locationDetail || '');
      setApplyhow(copy.applyhow || '');
      setEtcNotice(copy.etcNotice || '');
      setChurch(copy.church || '');
      setChurchLogo(copy.churchLogo || '');
      setReligiousbody(copy.religiousbody || '');
      setAddress(copy.address || '');
      setMainPastor(copy.mainPastor || '');
      setHomepage(copy.homepage || '');
      addressAPI(copy.address);
    } 
  };

  useEffect(() => {
    fetchPosts();
  }, []);  
  
  


  return (
    <div className="recruit">

      <div className="inner">

        <div className="subpage__main">
          
          
          
          <section style={{marginBottom:'50px'}}>
            <div className="main_title_row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 className='main_title'>
                {title}
              </h3>
              <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 20px', 
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  width: 'fit-content'
                }} 
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigate('/recruit/recruitchurchlist', { state: { recruitState } });
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#555';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#333';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  <MdArrowBack style={{ fontSize: '16px' }} />
                  <span>목록</span>
                </div>
            </div>
            {
              source !== '사역자모아' &&
              <div className='copBtn'>
                <a href={link} target='_blank'  className='girBtn btn'>
                  <p>원본보기</p>
                  <MdArrowForwardIos/>
                  <div className='recruit__religiousbody_box'>
                    <img src={`${MainURL}/siteimages/schoolround/${source}.jpg`} />
                    <p className='recruit__religiousbody'>{source}</p> 
                  </div>
                </a>
              </div>
            }
            <div style={{
              fontSize: '12px',
              color: '#999',
              padding: '5px 10px',
            }}>
              게시글ID: {ID}
            </div>
          </section>

          
              
          <section>
            <h1 className='section_title'>채용정보</h1>
            <div className='summaryBx' >
              <div className='tbCol'>
                <h4>사역요약</h4>
                <div className='tbList'>
                  {/* <div className='tbLabel'>구분</div>
                  <div className='tbValue'>{sort}</div> */}
                  <div className='tbLabel'>지역</div>
                  <div className='tbValue'>{location} {locationDetail}</div>
                </div>
              </div>
              <div className='tbCol'>
                <h4 >지원자격</h4>
                <div className='tbList'>
                  <div className='tbLabel'>학력</div>
                  <div className='tbValue'>
                    {
                      school.length > 1 
                      ?
                      <p>{school[0].sort} : {school[0].content}</p>
                      :
                      <p>{school[0].content}</p>
                    }
                    {
                      school.length > 1 &&
                      <p>{school[1].sort} : {school[1].content}</p>
                    }
                  </div>
                  <div className='tbLabel'>경력</div>
                  <div className='tbValue'>
                    {
                      career.length > 1 
                      ?
                      <p>{career[0].sort} : {career[0].content}</p>
                      :
                      <p>{career[0].content}</p>
                    }
                    {
                      career.length > 1 &&
                      <p>{career[1].sort} : {career[1].content}</p>
                    }
                  </div>
                  
                </div>
              </div>
            </div>
          </section>

          <section>
            <h1 className='section_title'>지원방법</h1>
            <div className='copInfoBx'>
              <div className="copInfoBx-cover">
                <div className='copInfo'>
                  <div className='label'>등록일</div>
                  <div className='value'>
                    <p>{date}</p>
                  </div>
                  <div className='label'>기간</div>
                  <div className='value'>
                    {
                      applytime.startDay !== '' && applytime.endDay !== ''
                      ?
                      <p>{applytime.startDay} ~ {applytime.endDay} ({applytime.daySort})</p>
                      :
                      <p>{applytime.daySort}</p>
                    }
                  </div>
                  <div className='label'>서류</div>
                  <div className='value'>
                    {
                      applydoc.length > 1 
                      ?
                      <p>{applydoc[0].sort} : {applydoc[0].content}</p>
                      :
                      <p>{applydoc[0].content}</p>
                    }
                    {
                      applydoc.length > 1 &&
                      <p>{applydoc[1].sort} : {applydoc[1].content}</p>
                    }
                  </div>
                  <div className='label'>지원방법</div>
                  <div className='value'>
                    {applyhow}
                  </div>
                  <div className='label'>담당자</div>
                  <div className='value'>
                    <p>이름 : {inquiry.inquiryName}</p>
                    <p>이메일 : {inquiry.email}</p>
                    <p>전화번호 : {inquiry.phone}</p>
                  </div>
                  <div className='label'>기타사항</div>
                  <div className='value' style={{whiteSpace:'pre-line', lineHeight:'1.5'}}>{etcNotice}</div>
                </div>
              </div>
            </div>
          </section>

          <section id='tab03' style={{marginBottom:'100px'}}>
            <h1 className='section_title'>상세내용</h1>
            <div className='copInfoBx'>
              <div
                className="custom-html-content"
                dangerouslySetInnerHTML={{ __html: customInput }}
              />
            </div>
          </section>

          <section id='tab03'>
            <h1 className='section_title'>교회 정보</h1>
            <div className='copInfoBx'>
              <div className='header'>
                <h4 className='church'>{church}</h4>
              </div>
              <div className="copInfoBx-cover">
                <div className='copLogo'>
                  {
                    (!churchLogo)
                    ?
                    <div className='emptyLogo'>
                      <p>사역자모아</p>
                    </div>
                    :
                    <img
                      className='churchLogo'
                      src={`${MainURL}/siteimages/churchlogos/${churchLogo}`}
                      alt='로고'
                      onError={(e) => { setChurchLogo(''); }}
                    />
                  }
                </div>
                <div className='copInfo'>
                  <div className='label'>교단</div>
                  <div className='value'>
                    <div className='recruit__religiousbody_box'>
                      <img src={`${MainURL}/images/recruit/religiousbody/${religiousbody}.jpg`} />
                      <p className='recruit__religiousbody'>{religiousbody}</p> 
                    </div>
                  </div>
                  <div className='label'>지역</div>
                  <div className='value'>{location} {locationDetail}</div>
                  <div className='label'>주소</div>
                  <div className='value'>{address}</div>
                  <div className='label'>담임목사</div>
                  <div className='value'>{mainPastor}</div>
                  <div className='label'>홈페이지</div>
                  {homepage && homepage !== '' && (
                    <div className='value' style={{display:'flex', alignItems:'center', gap:'5px'}}>
                      <p>{homepage}</p>
                      <a href={homepage.includes('http') ? homepage : `http://${homepage}`} 
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{display:'flex', alignItems:'center', border:'1px solid #000', borderRadius:'5px', marginLeft:'10px', padding:'2px 7px'}}>
                        <p style={{fontSize:'14px'}}>바로가기</p>
                        <MdArrowForwardIos style={{fontSize:'14px', marginLeft:'5px'}}/>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="maparea">
            {mapLoaded ? (
              <div id="map" ref={mapElement} style={{ minHeight: '600px'}} />
            ) : (
              <div style={{ minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#aaa', background: '#f5f5f5' }}>
                주소가 정확하지 않아 지도를 표시할 수 없습니다.
              </div>
            )}
          </div>

          {/* 하단 뒤로가기 버튼 */}
          <div style={{width: '100%', display: 'flex', justifyContent: 'end'}}>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px'}}>
              <div style={{
                
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                marginTop: '40px',
                width: 'fit-content'
              }} 
              onClick={() => {
                window.scrollTo(0, 0);
                navigate('/recruit', { state: { recruitState } });
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#555';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#333';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <MdArrowBack style={{ fontSize: '16px' }} />
                <span>목록</span>
              </div>
             
            </div>
          </div>
     
         
        </div>
      </div>
    </div>
    
  )
}