import { useCallback, useEffect, useState } from 'react';
import './Mypage.scss';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import Loading from '../../components/Loading';
import { useRecoilState } from 'recoil';
import { recoilUserData } from '../../RecoilStore';
import { DropdownBox } from '../../components/DropdownBox';
import { DateBoxSingle } from '../../components/DateBoxSingle';
import { EditorTinymce } from '../../components/EditorTinymce';
import { CiCircleMinus } from 'react-icons/ci';
import { DaumPostcodeEmbed } from 'react-daum-postcode';
import { useDropzone } from 'react-dropzone';
import imageCompression from "browser-image-compression";
// 각 타입별 PostData import
import {
  applydocSubSort as ministerApplydocSubSort,
  applyhowSubSort as ministerApplyhowSubSort,
  careerSubSort as ministerCareerSubSort,
  dawnPraySubMenu as ministerDawnPraySubMenu,
  hourSortOption,
  insuranceSubSort as ministerInsuranceSubSort,
  locationSubSort,
  minuteSortOption,
  partDetailSubSort as ministerPartDetailSubSort,
  partSubSort as ministerPartSubSort,
  paySubSort as ministerPaySubSort,
  recruitNumSubSort as ministerRecruitNumSubSort,
  religiousbodySubSort,
  schoolSubSort as ministerSchoolSubSort,
  severanceSubSort as ministerSeveranceSubSort,
  sortSortOption as ministerSortSortOption,
  sortSubSort as ministerSortSubSort,
  SubTitleControl,
  weekdaySubSort,
  welfareSubSort as ministerWelfareSubSort,
  workdaySubMenu as ministerWorkdaySubMenu,
  workDayWeekSortOption
} from '../recruit/recruit_minister/RecruitMinisterPostData';

import {
  applydocSubSort as choirApplydocSubSort,
  applyhowSubSort as choirApplyhowSubSort,
  careerSubSort as choirCareerSubSort,
  recruitNumSubSort as choirRecruitNumSubSort,
  schoolSubSort as choirSchoolSubSort,
  sortSortOption as choirSortSortOption,
  sortSubSort as choirSortSubSort
} from '../recruit/recruit_church/RecruitChurchPostData';

import {
  applydocSubSort as instituteApplydocSubSort,
  applyhowSubSort as instituteApplyhowSubSort,
  careerSubSort as instituteCareerSubSort,
  recruitNumSubSort as instituteRecruitNumSubSort,
  schoolSubSort as instituteSchoolSubSort,
  sortSortOption as instituteSortSortOption,
  sortSubSort as instituteSortSubSort
} from '../recruit/recruit_institute/RecruitInstitutePostData';

export default function PostingEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const postId = new URLSearchParams(location.search).get('id');
  const tableType = new URLSearchParams(location.search).get('tableType') || 'minister'; // 기본값은 'minister'
  const [userData] = useRecoilState(recoilUserData);

  // tableType에 따라 사용할 PostData 선택
  const applydocSubSort = tableType === 'choir' ? choirApplydocSubSort : tableType === 'institute' ? instituteApplydocSubSort : ministerApplydocSubSort;
  const applyhowSubSort = tableType === 'choir' ? choirApplyhowSubSort : tableType === 'institute' ? instituteApplyhowSubSort : ministerApplyhowSubSort;
  const careerSubSort = tableType === 'choir' ? choirCareerSubSort : tableType === 'institute' ? instituteCareerSubSort : ministerCareerSubSort;
  const dawnPraySubMenu = ministerDawnPraySubMenu;
  const insuranceSubSort = ministerInsuranceSubSort;
  const partDetailSubSort = ministerPartDetailSubSort;
  const partSubSort = ministerPartSubSort;
  const paySubSort = ministerPaySubSort;
  const recruitNumSubSort = tableType === 'choir' ? choirRecruitNumSubSort : tableType === 'institute' ? instituteRecruitNumSubSort : ministerRecruitNumSubSort;
  const schoolSubSort = tableType === 'choir' ? choirSchoolSubSort : tableType === 'institute' ? instituteSchoolSubSort : ministerSchoolSubSort;
  const severanceSubSort = ministerSeveranceSubSort;
  const sortSortOption = tableType === 'choir' ? choirSortSortOption : tableType === 'institute' ? instituteSortSortOption : ministerSortSortOption;
  const sortSubSort = tableType === 'choir' ? choirSortSubSort : tableType === 'institute' ? instituteSortSubSort : ministerSortSubSort;
  const welfareSubSort = ministerWelfareSubSort;
  const workdaySubMenu = ministerWorkdaySubMenu;

  // RecruitPost.tsx와 동일한 state 선언
  const [title, setTitle] = useState('');
  const [writer, setWriter] = useState('');
  const [date, setDate] = useState('');
  const [church, setChurch] = useState('');
  const [religiousbody, setReligiousbody] = useState('');
  const [locationVal, setLocationVal] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [address, setAddress] = useState('');
  const [mainpastor, setMainpastor] = useState('');
  const [homepage, setHomepage] = useState('');
  const [churchLogo, setChurchLogo] = useState<File | null>(null);
  const [sort, setSort] = useState('');
  const [part, setPart] = useState([{sort:"전임", content:""}]);
  const [partDetail, setPartDetail] = useState([{sort:"전임", content:""}]);
  const [school, setSchool] = useState([{sort:"전임", content:""}]);
  const [career, setCareer] = useState([{sort:"전임", content:""}]);
  const [recruitNum, setRecruitNum] = useState('');
  const [workday, setWorkday] = useState([{sort:"전임", content:""}]);
  const [workTimeSunDay, setWorkTimeSunDay] = useState([{sort:"전임", startHour:"09", startMinute:"00", endHour:"16", endMinute:"00"}]);
  const [workTimeWeek, setWorkTimeWeek] = useState([{sort:"전임", startHour:"09", startMinute:"00", endHour:"17", endMinute:"00", day:"평일"}]);
  const [dawnPray, setDawnPray] = useState([{sort:"전임", content:""}]);
  const [pay, setPay] = useState([{sort:"전임", paySort:"월", selectCost:"", inputCost:""}]);
  const [insurance, setInsurance] = useState([{sort:"전임", content:""}]);
  const [severance, setSeverance] = useState([{sort:"전임", content:""}]);
  const [welfare, setWelfare] = useState([{sort:"전임", content:""}]);
  const [applytime, setApplytime] = useState({startDay:"", endDay:"", daySort:""});
  const [applydoc, setApplydoc] = useState([{sort:"전임", content:""}]);
  const [applyhow, setApplyhow] = useState('');
  const [inquiry, setInquiry] = useState({inquiryName:"", email:"", phone:""});
  const [etcNotice, setEtcNotice] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [isViewAddress, setIsViewAddress] = useState(false);
  const [workdayMenu, setWorkdayMenu] = useState(['','']);
  const [dawnPrayMenu, setDawnPrayMenu] = useState(['','']);
  const [payInputType, setPayInputType] = useState('select');
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // DaumPostcodeEmbed 주소 입력 함수
  const onCompletePost = (data:any) => {
    const copy = data.address;
    const sido = `${data.sido} ${data.sigungu}`;
    setLocationVal(sido);
    setAddress(copy);
    setIsViewAddress(false);
  };

  // 이미지 첨부/삭제 함수
  const deleteInputImage = async () => {
    setChurchLogo(null);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    try {
      setImageLoading(true);
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1000
      };
      const resizingBlob = await imageCompression(file, options);
      const regexCopy = /[^a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|;:'",.<>]/g;
      const userIdCopy = userData?.userAccount.slice(0,5);
      const regex = resizingBlob.name.replace(regexCopy, '');
      const regexSlice = regex.slice(-15);
      const newFile = new File([resizingBlob], `${date}${userIdCopy}_${regexSlice}`, {
        type: file.type,
      });
      setChurchLogo(newFile);
      setImageLoading(false);
    } catch (error) {
      setImageLoading(false);
      console.error('이미지 리사이징 중 오류 발생:', error);
    }
  }, [setChurchLogo, date, userData]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  // 기존 데이터 불러오기
  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    axios.get(`${MainURL}/mypage/getuserpostrevise/${postId}?tableType=${tableType}`)
      .then(res => {
        const data = res.data[0];
        setTitle(data.title || '');
        setWriter(data.writer || '');
        setDate(data.date || '');
        setChurch(data.church || '');
        setReligiousbody(data.religiousbody || '');
        setLocationVal(data.location || '');
        setLocationDetail(data.locationDetail || '');
        setAddress(data.address || '');
        setMainpastor(data.mainpastor || '');
        setHomepage(data.homepage || '');
        setSort(data.sort || '');
        setPart(data.part ? JSON.parse(data.part) : [{sort:"전임", content:""}]);
        setPartDetail(data.partDetail ? JSON.parse(data.partDetail) : [{sort:"전임", content:""}]);
        setSchool(data.school ? JSON.parse(data.school) : [{sort:"전임", content:""}]);
        setCareer(data.career ? JSON.parse(data.career) : [{sort:"전임", content:""}]);
        setRecruitNum(data.recruitNum || '');
        if (tableType !== 'choir') {
          setWorkday(data.workday ? JSON.parse(data.workday) : [{sort:"전임", content:""}]);
          setWorkTimeSunDay(data.workTimeSunDay ? JSON.parse(data.workTimeSunDay) : [{sort:"전임", startHour:"09", startMinute:"00", endHour:"16", endMinute:"00"}]);
          setWorkTimeWeek(data.workTimeWeek ? JSON.parse(data.workTimeWeek) : [{sort:"전임", startHour:"09", startMinute:"00", endHour:"17", endMinute:"00", day:"평일"}]);
          setDawnPray(data.dawnPray ? JSON.parse(data.dawnPray) : [{sort:"전임", content:""}]);
          setInsurance(data.insurance ? JSON.parse(data.insurance) : [{sort:"전임", content:""}]);
          setSeverance(data.severance ? JSON.parse(data.severance) : [{sort:"전임", content:""}]);
          setWelfare(data.welfare ? JSON.parse(data.welfare) : [{sort:"전임", content:""}]);
        }
        setPay(data.pay ? JSON.parse(data.pay) : [{sort:"전임", paySort:"월", selectCost:"", inputCost:""}]);
        setApplytime(data.applytime ? JSON.parse(data.applytime) : {startDay:"", endDay:"", daySort:""});
        setApplydoc(data.applydoc ? JSON.parse(data.applydoc) : [{sort:"전임", content:""}]);
        setApplyhow(data.applyhow || '');
        setInquiry(data.inquiry ? JSON.parse(data.inquiry) : {inquiryName:"", email:"", phone:""});
        setEtcNotice(data.etcNotice || '');
        setCustomInput(data.customInput || '');
      })
      .finally(() => setLoading(false));
  }, [postId, tableType]);

  // 수정 함수
  const handleEdit = async () => {
    // tableType에 따라 다른 엔드포인트 사용
    let endpoint = '';
    if (tableType === 'choir') {
      endpoint = `${MainURL}/recruitchurch/reviserecruit`;
    } else if (tableType === 'institute') {
      endpoint = `${MainURL}/recruitinstitute/reviserecruit`;
    } else {
      endpoint = `${MainURL}/recruitminister/reviserecruit`;
    }
    
    await axios.post(endpoint, {
      postID: postId,
      userAccount: userData.userAccount,
      title,
      writer,
      date,
      church,
      religiousbody,
      location: locationVal,
      locationDetail,
      address,
      mainpastor,
      homepage,
      sort,
      part: JSON.stringify(part),
      partDetail: JSON.stringify(partDetail),
      school: JSON.stringify(school),
      career: JSON.stringify(career),
      recruitNum,
      ...(tableType !== 'choir' ? {
        workday: JSON.stringify(workday),
        workTimeSunDay: JSON.stringify(workTimeSunDay),
        workTimeWeek: JSON.stringify(workTimeWeek),
        dawnPray: JSON.stringify(dawnPray),
        welfare: JSON.stringify(welfare),
        insurance: JSON.stringify(insurance),
        severance: JSON.stringify(severance),
      } : {}),
      pay: JSON.stringify(pay),
      applydoc: JSON.stringify(applydoc),
      applyhow,
      applytime: JSON.stringify(applytime),
      etcNotice,
      inquiry: JSON.stringify(inquiry),
      customInput,
    }).then(res => {
      if (res.data) {
        alert('수정되었습니다.');
        navigate('/mypage/postingmanage');
      } else {
        alert('수정 실패');
      }
    });
  };

  if (loading) return <Loading />;

  return (
    <div className="recruit" style={{ height: '700px', overflowY: 'auto' }}>
      <div className="inner">
        <div className="subpage__main">
          <section style={{marginBottom:'50px'}}>
            <div className="main_title_row">
              <h3 className='main_title'>
                공고문 수정
              </h3>
              <div className='postBtnbox'>
                <div className='postBtn'
                  style={{marginRight:'10px'}}
                  onClick={()=>{navigate(-1);}}>
                  <p>뒤로가기</p>
                </div>
              </div>
            </div>
          </section>

          {/* 기본정보 -------------------------------------------------------------------------- */}
          <section>
            <h1 className='section_title'>기본정보</h1>
            <div className='inputCover'>
              <div className="inputBox">
                <h3 className='title'><p>제목</p></h3>
                <div className="inputRow">
                  <input value={title} className="inputdefault" type="text" 
                    onChange={(e) => {setTitle(e.target.value)}}/>
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>글쓰는이</p></h3>
                <div className="inputRow">
                  <input value={writer} className="inputdefault" type="text" 
                    onChange={(e) => {setWriter(e.target.value)}}/>
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>날짜</p></h3>
                <div className="inputRow">
                  <input value={date} className="inputdefault" type="text" 
                    onChange={(e) => {

                    }}/>
                </div>
              </div>
            </div>
          </section>

          {/* 교회정보 -------------------------------------------------------------------------- */}
          <section>
            <h1 className='section_title'>교회정보</h1>
            <div className='inputCover'>
              <div className="inputBox">
                <h3 className='title'><p>교회명</p></h3>
                <div className="inputRow">
                  <input value={church} className="inputdefault" type="text" 
                    onChange={(e) => {setChurch(e.target.value)}}/>
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>교단</p></h3>
                <div className="inputRow">
                  <div className='checkTextRow'>
                    {
                      religiousbodySubSort.map((item:any, index:any)=>{
                        return (
                          <div key={index} className='checkTextBox'
                            onClick={()=>{
                              if (religiousbody === item) {
                                setReligiousbody('');
                              } else {
                                setReligiousbody(item);
                              }
                            }}
                          >
                            <input className="checkbox" type="checkbox"
                              checked={religiousbody === item}
                              onChange={()=>{setReligiousbody(item);}}
                            />
                            <span className="checkmark" />
                            <div className='imgtextBox'>
                              <img src={`${MainURL}/images/recruit/religiousbody/${item}.jpg`}/>
                              <p className={religiousbody === item ? 'selected' : ''}>{item}</p>
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>위치</p></h3>
                <div className="inputRow">
                  <div className='checkTextRow'>
                    {
                      locationSubSort.map((item:any, index:any)=>{
                        return (
                          <div key={index} className='checkTextBox'
                            onClick={()=>{
                              if (locationVal === item) {
                                setLocationVal('');
                              } else {
                                setLocationVal(item);
                              }
                            }}
                          >
                            <input className="checkbox" type="checkbox"
                              checked={locationVal  === item}
                              onChange={()=>{setLocationVal(item);}}
                            />
                            <span className="checkmark" />
                            <div className='imgtextBox'>
                              <p className={locationVal === item ? 'selected' : ''}>{item}</p>
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>상세위치</p></h3>
                <div className="inputRow">
                  <input value={locationDetail} className="inputdefault" type="text" 
                    onChange={(e) => {setLocationDetail(e.target.value)}}
                    placeholder='상세 위치를 입력해주세요 (시,군,구)'
                  />
                  <p style={{fontSize:'14px', color:'#999', marginTop:'10px'}}>
                    - 주소상 두번째 단어를 입력해주세요. 예: '경기도 부천시'이면 '부천시' / '대전 서구'이면 '서구'
                  </p>
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>주소</p></h3>
                <div className="inputRow">
                  {
                    (isViewAddress && address === '')
                    ?
                    <div style={{width:'85%'}}>
                      <DaumPostcodeEmbed
                          key="daum-postcode"
                          style={{
                            width:'100%',
                            height:'400px',
                            padding:'10px',
                            boxSizing:'border-box',
                            border:'1px solid #E9E9E9'
                          }}
                          onComplete={onCompletePost} 
                        />
                    </div>
                    :
                    <input value={address} className="inputdefault" type="text" 
                      key="input-address"
                      onChange={(e) => {setAddress(e.target.value)}}
                      onClick={()=>{
                        setIsViewAddress(true);
                      }}
                    />
                  }
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>담임목사</p></h3>
                <div className="inputRow">
                  <input value={mainpastor} className="inputdefault" type="text" 
                    onChange={(e) => {setMainpastor(e.target.value)}}/>
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>홈페이지</p></h3>
                <div className="inputRow">
                  <input value={homepage} className="inputdefault" type="text" 
                    placeholder='홈페이지 주소를 입력해주세요'
                    onChange={(e) => {setHomepage(e.target.value)}}/>
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>교회로고</p></h3>
                <div className="inputRow">
                {
                  <div className="imageInputBox">
                  {
                    churchLogo &&
                    <div className='imagebox'>
                      <div className='imagebox'>
                        <img 
                          src={URL.createObjectURL(churchLogo)}
                        />
                        <p>{churchLogo.name}</p>
                        <div onClick={()=>{deleteInputImage();}}>
                          <CiCircleMinus color='#FF0000' size={20}/>
                        </div>
                      </div>
                    </div>
                  }
                  {
                    imageLoading ?
                    <div style={{width:'100%', height:'100%', position:'absolute'}}>
                      <Loading/>
                    </div>
                    :
                    <div className='imageDropzoneCover'  
                      style={{display: churchLogo ? 'none' : 'block'}}>
                      <div {...getRootProps()} className="imageDropzoneStyle">
                        <input {...getInputProps()} />
                        {
                          !churchLogo
                
                          &&
                          <div className='imageplus'>+ 사진첨부하기</div>
                        }
                      </div>
                    </div>
                  }
                  </div>
                }
                <p style={{fontSize:'14px', color:'#999', marginTop:'10px'}}>
                  - 첨부 파일 형식은, 'JPG, PNG, JEPG' 파일만 가능합니다.
                </p>
                </div>
              </div>
              
            </div>
          </section>

          {/* 채용정보 -------------------------------------------------------------------------- */}
          <section>
            <h1 className='section_title'>채용정보</h1>
            <div className='inputCover'>
              <div className="inputBox">
                <h3 className='title'><p>직무</p></h3>
                <div className="inputRow">
                  <div className='checkTextRow'>
                    {
                      sortSubSort.map((item:any, index:any)=>{
                        return (
                          <div key={index} className='checkTextBox'
                            onClick={()=>{
                              if (sort === item) {
                                setSort('');
                                // 직무가 해제되면 모든 관련 배열을 초기화
                                setPart([{sort:"전임", content:""}]);
                                setPartDetail([{sort:"전임", content:""}]);
                                setSchool([{sort:"전임", content:""}]);
                                setCareer([{sort:"전임", content:""}]);
                                if (tableType !== 'choir') {
                                  setWorkday([{sort:"전임", content:""}]);
                                  setWorkTimeSunDay([{sort:"전임", startHour:"09", startMinute:"00", endHour:"16", endMinute:"00"}]);
                                  setWorkTimeWeek([{sort:"전임", startHour:"09", startMinute:"00", endHour:"17", endMinute:"00", day:"평일"}]);
                                  setDawnPray([{sort:"전임", content:""}]);
                                  setInsurance([{sort:"전임", content:""}]);
                                  setSeverance([{sort:"전임", content:""}]);
                                  setWelfare([{sort:"전임", content:""}]);
                                }
                                setPay([{sort:"전임", paySort:"월", selectCost:"", inputCost:""}]);
                                setApplydoc([{sort:"전임", content:""}]);
                              } else {
                                setSort(item);
                               // 선택된 직무에 따라 배열 생성
                                if (item === '전임' || item === '준전임' || item === '파트' || item === '전임or준전임' || item === '전임or파트' || item === '준전임or파트' || item === '담임') {
                                  setPart([{sort:item, content:""}]);
                                  setPartDetail([{sort:item, content:""}]);
                                  setSchool([{sort:item, content:""}]);
                                  setCareer([{sort:item, content:""}]);
                                  if (tableType !== 'choir') {
                                    setWorkday([{sort:item, content:""}]);
                                    setWorkTimeSunDay([{sort:item, startHour:"09", startMinute:"00", endHour:"16", endMinute:"00"}]);
                                    setWorkTimeWeek([{sort:item, startHour:"09", startMinute:"00", endHour:"17", endMinute:"00", day:"평일"}]);
                                    setDawnPray([{sort:item, content:""}]);
                                    setInsurance([{sort:item, content:""}]);
                                    setSeverance([{sort:item, content:""}]);
                                    setWelfare([{sort:item, content:""}]);
                                  }
                                  setPay([{sort:item, paySort:"월", selectCost:"", inputCost:""}]);
                                  setApplydoc([{sort:item, content:""}]);
                                } else if (item === '전임&준전임') {
                                  setPart([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                  setPartDetail([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                  setSchool([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                  setCareer([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                  if (tableType !== 'choir') {
                                    setWorkday([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                    setWorkTimeSunDay([{sort:"전임", startHour:"09", startMinute:"00", endHour:"16", endMinute:"00"}, {sort:"준전임", startHour:"09", startMinute:"00", endHour:"16", endMinute:"00"}]);
                                    setWorkTimeWeek([{sort:"전임", startHour:"09", startMinute:"00", endHour:"17", endMinute:"00", day:"평일"}, {sort:"준전임", startHour:"09", startMinute:"00", endHour:"17", endMinute:"00", day:"평일"}]);
                                    setDawnPray([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                    setInsurance([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                    setSeverance([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                    setWelfare([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                  }
                                  setPay([{sort:"전임", paySort:"월", selectCost:"", inputCost:""}, {sort:"준전임", paySort:"월", selectCost:"", inputCost:""}]);
                                  setApplydoc([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                } else if (item === '전임&파트') {
                                  setPart([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                  setPartDetail([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                  setSchool([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                  setCareer([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                  if (tableType !== 'choir') {
                                    setWorkday([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                    setWorkTimeSunDay([{sort:"전임", startHour:"09", startMinute:"00", endHour:"16", endMinute:"00"}, {sort:"파트", startHour:"09", startMinute:"00", endHour:"16", endMinute:"00"}]);
                                    setWorkTimeWeek([{sort:"전임", startHour:"09", startMinute:"00", endHour:"17", endMinute:"00", day:"평일"}, {sort:"파트", startHour:"09", startMinute:"00", endHour:"17", endMinute:"00", day:"평일"}]);
                                    setDawnPray([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                    setInsurance([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                    setSeverance([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                    setWelfare([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                  }
                                  setPay([{sort:"전임", paySort:"월", selectCost:"", inputCost:""}, {sort:"파트", paySort:"월", selectCost:"", inputCost:""}]);
                                  setApplydoc([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                } else if (item === '준전임&파트') {
                                  setPart([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                  setPartDetail([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                  setSchool([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                  setCareer([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                  if (tableType !== 'choir') {
                                    setWorkday([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                    setWorkTimeSunDay([{sort:"준전임", startHour:"09", startMinute:"00", endHour:"16", endMinute:"00"}, {sort:"파트", startHour:"09", startMinute:"00", endHour:"16", endMinute:"00"}]);
                                    setWorkTimeWeek([{sort:"준전임", startHour:"09", startMinute:"00", endHour:"17", endMinute:"00", day:"평일"}, {sort:"파트", startHour:"09", startMinute:"00", endHour:"17", endMinute:"00", day:"평일"}]);
                                    setDawnPray([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                    setInsurance([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                    setSeverance([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                    setWelfare([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                  }
                                  setPay([{sort:"준전임", paySort:"월", selectCost:"", inputCost:""}, {sort:"파트", paySort:"월", selectCost:"", inputCost:""}]);
                                  setApplydoc([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                }
                              }
                            }}
                          >
                            <input className="checkbox" type="checkbox"
                              checked={sort === item}
                              onChange={()=>{setSort(item);}}
                            />
                            <span className="checkmark" />
                            <div className='imgtextBox'>
                              <p className={sort === item ? 'selected' : ''}>{item}</p>
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>담당파트</p></h3>
                <div className="inputRow">
                {
                  part.map((item: any, index: number) => {
                    return (
                      <div key={index}>
                        <SubTitleControl
                          index={index}
                          data={part}
                          setData={setPart}
                          sortOptions={sortSortOption}
                          defaultValues={{ sort: "전임", content: "" }}
                        />
                        <input
                          value={item.content}
                          className="inputdefault"
                          type="text"
                          onChange={(e) => {
                            const copy = [...part];
                            copy[index].content = e.target.value;
                            setPart(copy);
                          }}
                        />
                        <div className='subTextBox'>
                          {
                            (tableType === 'minister' ? partSubSort : []).map((subItem: string, subIndex: number) => {
                              const isSelected = item.content.split(', ').includes(subItem);
                              return (
                                <p key={subIndex}
                                  className={`subText ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    const updated = [...part];
                                    const currentList = item.content ? item.content.split(', ') : [];

                                    if (isSelected) {
                                      updated[index].content = currentList
                                        .filter((i:any) => i !== subItem)
                                        .join(', ');
                                    } else {
                                      updated[index].content = [...currentList, subItem].join(', ');
                                    }

                                    setPart(updated);
                                  }}
                                >
                                  {subItem}
                                </p>
                              );
                            })
                          }
                        </div>
                      </div>
                    );
                  })
                }
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>파트상세</p></h3>
                <div className="inputRow">
                {
                  partDetail.map((item: any, index: number) => {
                    return (
                      <div key={index}>
                        <SubTitleControl
                          index={index}
                          data={partDetail}
                          setData={setPartDetail}
                          sortOptions={sortSortOption}
                          defaultValues={{ sort: "전임", content: "" }}
                        />
                        <input
                          value={item.content}
                          className="inputdefault"
                          type="text"
                          onChange={(e) => {
                            const copy = [...partDetail];
                            copy[index].content = e.target.value;
                            setPartDetail(copy);
                          }}
                        />
                        <div className='subTextBox'>
                          {
                            (tableType === 'minister' ? partDetailSubSort : []).map((subItem: string, subIndex: number) => {
                              const isSelected = item.content.split(', ').includes(subItem);
                              return (
                                <p key={subIndex}
                                  className={`subText ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    const updated = [...partDetail];
                                    const currentList = item.content ? item.content.split(', ') : [];

                                    if (isSelected) {
                                      updated[index].content = currentList
                                        .filter((i:any) => i !== subItem)
                                        .join(', ');
                                    } else {
                                      updated[index].content = [...currentList, subItem].join(', ');
                                    }

                                    setPartDetail(updated);
                                  }}
                                >
                                  {subItem}
                                </p>
                              );
                            })
                          }
                        </div>
                      </div>
                    );
                  })
                }
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>학력</p></h3>
                <div className="inputRow">
                {
                  school.map((item: any, index: number) => {
                    return (
                      <div key={index}>
                        <SubTitleControl
                          index={index}
                          data={school}
                          setData={setSchool}
                          sortOptions={sortSortOption}
                          defaultValues={{ sort: "전임", content: "" }}
                        />
                        <input
                          value={item.content}
                          className="inputdefault"
                          type="text"
                          onChange={(e) => {
                            const copy = [...school];
                            copy[index].content = e.target.value;
                            setSchool(copy);
                          }}
                        />
                        <div className='subTextBox'>
                          {
                            schoolSubSort.map((subItem: string, subIndex: number) => {
                              const isSelected = item.content.split(', ').includes(subItem);
                              return (
                                <p key={subIndex}
                                  className={`subText ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    const updated = [...school];
                                    const currentList = item.content ? item.content.split(', ') : [];

                                    if (isSelected) {
                                      updated[index].content = currentList
                                        .filter((i:any) => i !== subItem)
                                        .join(', ');
                                    } else {
                                      updated[index].content = [...currentList, subItem].join(', ');
                                    }

                                    setSchool(updated);
                                  }}
                                >
                                  {subItem}
                                </p>
                              );
                            })
                          }
                        </div>
                      </div>
                    );
                  })
                }
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>경력</p></h3>
                <div className="inputRow">
                {
                  career.map((item: any, index: number) => {
                    return (
                      <div key={index}>
                        <SubTitleControl
                          index={index}
                          data={career}
                          setData={setCareer}
                          sortOptions={sortSortOption}
                          defaultValues={{ sort: "전임", content: "" }}
                        />
                        <input
                          value={item.content}
                          className="inputdefault"
                          type="text"
                          onChange={(e) => {
                            const copy = [...career];
                            copy[index].content = e.target.value;
                            setCareer(copy);
                          }}
                        />
                        <div className='subTextBox'>
                          {
                            careerSubSort.map((subItem: string, subIndex: number) => {
                              const isSelected = item.content.split(', ').includes(subItem);
                              return (
                                <p key={subIndex}
                                  className={`subText ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    const updated = [...career];
                                    const currentList = item.content ? item.content.split(', ') : [];

                                    if (isSelected) {
                                      updated[index].content = currentList
                                        .filter((i:any) => i !== subItem)
                                        .join(', ');
                                    } else {
                                      updated[index].content = [...currentList, subItem].join(', ');
                                    }

                                    setCareer(updated);
                                  }}
                                >
                                  {subItem}
                                </p>
                              );
                            })
                          }
                        </div>
                      </div>
                    );
                  })
                }
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>채용인원</p></h3>
                <div className="inputRow">
                  <div className='checkTextRow'>
                    {
                      recruitNumSubSort.map((item:any, index:any)=>{
                        return (
                          <div key={index} className='checkTextBox'
                            onClick={()=>{
                              if (recruitNum === item) {
                                setRecruitNum('');
                              } else {
                                setRecruitNum(item);
                              }
                            }}
                          >
                            <input className="checkbox" type="checkbox"
                              checked={recruitNum === item}
                              onChange={()=>{setRecruitNum(item);}}
                            />
                            <span className="checkmark" />
                            <div className='imgtextBox'>
                              <p className={recruitNum === item ? 'selected' : ''}>{item}</p>
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 사역정보 -------------------------------------------------------------------------- */}
          {tableType !== 'choir' && (
          <section>
            <h1 className='section_title'>사역정보</h1>
            <div className='inputCover'>
              <div className="inputBox">
                <h3 className='title'><p>사역요일</p></h3>
                <div className="inputRow">
                {
                  workday.map((item: any, index: number) => {
                    return (
                      <div key={index}>
                        <SubTitleControl
                          index={index}
                          data={workday}
                          setData={setWorkday}
                          sortOptions={sortSortOption}
                          defaultValues={{ sort: "전임", content: "" }}
                        />
                        <input
                          value={item.content}
                          className="inputdefault"
                          type="text"
                          onChange={(e) => {
                            const copy = [...workday];
                            copy[index].content = e.target.value;
                            setWorkday(copy);
                          }}
                        />
                        <div className='checkTextRow' style={{ display: 'flex' }}>
                          {
                            weekdaySubSort.map((day: string, dayIndex: number) => {
                              const selectedDays = item.content ? item.content.split(', ') : [];
                              const isChecked = selectedDays.includes(day);

                              return (
                                <div
                                  key={dayIndex}
                                  className='checkTextBox'
                                  onClick={() => {
                                    const updated = [...workday];
                                    const list = item.content ? item.content.split(', ') : [];
                                    if (isChecked) {
                                      updated[index].content = list.filter((d:any) => d !== day).join(', ');
                                    } else {
                                      updated[index].content = [...list, day].join(', ');
                                    }
                                    setWorkday(updated);
                                  }}
                                >
                                  <input
                                    className="checkbox"
                                    type="checkbox"
                                    checked={isChecked}
                                    readOnly // 직접 상태를 관리하므로 readOnly로 설정
                                  />
                                  <span className="checkmark" />
                                  <div className='imgtextBox'>
                                    <p className={`${isChecked ? 'selected' : ''}`}>{day}</p>
                                  </div>
                                </div>
                              );
                            })
                          }
                        </div>
                        <div className='checkTextRow' style={{display:'flex'}}>
                        {
                          (tableType === 'minister' ? workdaySubMenu : []).map((subItem:any, subIndex:any)=>{
                            return (
                              <div key={subIndex} className='checkTextBox'
                                onClick={() => {
                                  const copy = [...workday];
                                  if (workdayMenu === subItem) {
                                    const copyMenu = [...workdayMenu];
                                    copyMenu[index] = '';
                                    setWorkdayMenu(copyMenu);
                                  } else {
                                    const copyMenu = [...workdayMenu];
                                    copyMenu[index] = subItem;
                                    setWorkdayMenu(copyMenu);
                                    if (subItem === '주6일(화~일)') copy[index].content = '화,수,목,금,토,일';
                                    if (subItem === '주4일(수금토일)') copy[index].content = '수,금,토,일';
                                    if (subItem === '주3일(수토일)') copy[index].content = '수,토,일';
                                    if (subItem === '주3일(금토일)') copy[index].content = '금,토,일';
                                    if (subItem === '주말(토일)') copy[index].content = '토,일';
                                  }
                                  setWorkday(copy);
                                }}
                              >
                                <input className="checkbox"
                                  type="checkbox"
                                  checked={workdayMenu[index] === subItem}
                                  readOnly
                                />
                                <span className="checkmark" />
                                <div className='imgtextBox'>
                                  <p className={`${workdayMenu[index] === subItem ? 'selected': ''}`}>{subItem}</p>
                                </div>
                              </div>
                            )
                          })
                        }
                      </div>
                      </div>
                    );
                  })
                }
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>사역시간(주일)</p></h3>
                <div className="inputRow">
                  {
                    workTimeSunDay.map((item:any, index:any)=>{
                      return (
                        <div key={index}>
                          <SubTitleControl
                            index={index}
                            data={workTimeSunDay}
                            setData={setWorkTimeSunDay}
                            sortOptions={sortSortOption}
                            defaultValues={{ sort: "전임", startHour: "09", startMinute: "00", endHour: "16", endMinute: "00" }}
                          />
                          <div className="selectBoxRow">
                            <DropdownBox
                              widthmain='15%'
                              height='50px'
                              selectedValue={item.startHour}
                              options={hourSortOption}
                              handleChange={(e)=>{
                                const copy = [...workTimeSunDay];
                                copy[index].startHour = e.target.value; 
                                setWorkTimeSunDay(copy);
                              }}
                            />
                            <DropdownBox
                              widthmain='15%'
                              height='50px'
                              selectedValue={item.startMinute}
                              options={minuteSortOption}
                              handleChange={(e)=>{
                                const copy = [...workTimeSunDay];
                                copy[index].startMinute = e.target.value; 
                                setWorkTimeSunDay(copy);
                              }}
                            />
                            <p style={{margin:'0 10px'}}>~</p>
                            <DropdownBox
                              widthmain='15%'
                              height='50px'
                              selectedValue={item.endHour}
                              options={hourSortOption}
                              handleChange={(e)=>{
                                const copy = [...workTimeSunDay];
                                copy[index].endHour = e.target.value; 
                                setWorkTimeSunDay(copy);
                              }}
                            />
                            <DropdownBox
                              widthmain='15%'
                              height='50px'
                              selectedValue={item.endMinute}
                              options={minuteSortOption}
                              handleChange={(e)=>{
                                const copy = [...workTimeSunDay];
                                copy[index].endMinute = e.target.value; 
                                setWorkTimeSunDay(copy);
                              }}
                            />
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>사역시간(평일)</p></h3>
                <div className="inputRow">
                  { 
                    workTimeWeek.map((item:any, index:any)=>{
                      return (
                        <div key={index}>
                          <SubTitleControl
                            index={index}
                            data={workTimeWeek}
                            setData={setWorkTimeWeek}
                            sortOptions={sortSortOption}
                            defaultValues={{ sort: "전임", startHour: "09", startMinute: "00", endHour: "17", endMinute: "00", day: "평일" }}
                          />
                          <div className="selectBoxRow">
                            <DropdownBox
                              widthmain='15%'
                              height='50px'
                              selectedValue={item.startHour}
                              options={hourSortOption}
                              handleChange={(e)=>{
                                const copy = [...workTimeWeek];
                                copy[index].startHour = e.target.value; 
                                setWorkTimeWeek(copy);
                              }}
                            />
                            <DropdownBox
                              widthmain='15%'
                              height='50px'
                              selectedValue={item.startMinute}
                              options={minuteSortOption}
                              handleChange={(e)=>{
                                const copy = [...workTimeWeek];
                                copy[index].startMinute = e.target.value; 
                                setWorkTimeWeek(copy);
                              }}
                            />
                            <p style={{margin:'0 10px'}}>~</p>
                            <DropdownBox
                              widthmain='15%'
                              height='50px'
                              selectedValue={item.endHour}
                              options={hourSortOption}
                              handleChange={(e)=>{
                                const copy = [...workTimeWeek];
                                copy[index].endHour = e.target.value; 
                                setWorkTimeWeek(copy);
                              }}
                            />
                            <DropdownBox
                              widthmain='15%'
                              height='50px'
                              selectedValue={item.endMinute}
                              options={minuteSortOption}
                              handleChange={(e)=>{
                                const copy = [...workTimeWeek];
                                copy[index].endMinute = e.target.value; 
                                setWorkTimeWeek(copy);
                              }}
                            />
                            <DropdownBox
                              widthmain='15%'
                              height='50px'
                              selectedValue={item.day}
                              options={workDayWeekSortOption}
                              handleChange={(e)=>{
                                const copy = [...workTimeWeek];
                                copy[index].day = e.target.value; 
                                setWorkTimeWeek(copy);
                              }}
                            />
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>새벽기도참석</p></h3>
                <div className="inputRow">
                {
                  dawnPray.map((item: any, index: number) => {
                    return (
                      <div key={index}>
                        <SubTitleControl
                          index={index}
                          data={dawnPray}
                          setData={setDawnPray}
                          sortOptions={sortSortOption}
                          defaultValues={{ sort: "전임", content: "" }}
                        />
                        <input
                          value={item.content}
                          className="inputdefault"
                          type="text"
                          onChange={(e) => {
                            const copy = [...dawnPray];
                            copy[index].content = e.target.value;
                            setDawnPray(copy);
                          }}
                        />
                        <div className='checkTextRow' style={{ display: 'flex' }}>
                          {
                            weekdaySubSort.map((day: string, dayIndex: number) => {
                              const selectedDays = item.content ? item.content.split(', ') : [];
                              const isChecked = selectedDays.includes(day);

                              return (
                                <div
                                  key={dayIndex}
                                  className='checkTextBox'
                                  onClick={() => {
                                    const updated = [...dawnPray];
                                    const list = item.content ? item.content.split(', ') : [];
                                    if (isChecked) {
                                      updated[index].content = list.filter((d:any) => d !== day).join(', ');
                                    } else {
                                      updated[index].content = [...list, day].join(', ');
                                    }
                                    setDawnPray(updated);
                                  }}
                                >
                                  <input
                                    className="checkbox"
                                    type="checkbox"
                                    checked={isChecked}
                                    readOnly // 직접 상태를 관리하므로 readOnly로 설정
                                  />
                                  <span className="checkmark" />
                                  <div className='imgtextBox'>
                                    <p className={`${isChecked ? 'selected' : ''}`}>{day}</p>
                                  </div>
                                </div>
                              );
                            })
                          }
                        </div>
                        <div className='checkTextRow' style={{display:'flex'}}>
                        {
                          (tableType === 'minister' ? dawnPraySubMenu : []).map((subItem:any, subIndex:any)=>{
                            return (
                              <div key={subIndex} className='checkTextBox'
                                onClick={() => {
                                  const copy = [...dawnPray];
                                  if (dawnPrayMenu === subItem) {
                                    const copyMenu = [...dawnPrayMenu];
                                    copyMenu[index] = '';
                                    setDawnPrayMenu(copyMenu);
                                  } else {
                                    const copyMenu = [...dawnPrayMenu];
                                    copyMenu[index] = subItem;
                                    setDawnPrayMenu(copyMenu);
                                    copy[index].content = subItem;
                                  }
                                  setDawnPray(copy);
                                }}
                              >
                                <input className="checkbox"
                                  type="checkbox"
                                  checked={dawnPrayMenu[index] === subItem}
                                  readOnly
                                />
                                <span className="checkmark" />
                                <div className='imgtextBox'>
                                  <p className={`${dawnPrayMenu[index] === subItem ? 'selected': ''}`}>{subItem}</p>
                                </div>
                              </div>
                            )
                          })
                        }
                        </div>
                      </div>
                    );
                  })
                }
                </div>
              </div>
            </div>
          </section>
          )}

          {/* 복지정보 -------------------------------------------------------------------------- */}
          <section>
            <h1 className='section_title'>복지정보</h1>
            <div className='inputCover'>
              <div className="inputBox">
                <h3 className='title'><p>사례</p></h3>
                <div className="inputRow">
                {
                  pay.map((item: any, index: number) => {
                    return (
                      <div key={index}>
                        <SubTitleControl
                          index={index}
                          data={pay}
                          setData={setPay}
                          sortOptions={sortSortOption}
                          defaultValues={{ sort: "전임", paySort: "select", selectCost: "", inputCost: "" }}
                        />
                        <div className='checkTextRow' style={{display:'flex'}}>
                          <div className='checkTextBox'>
                            <input className="checkbox"
                              type="checkbox"
                              checked={payInputType === 'select'}
                              readOnly
                            />
                            <span className="checkmark" 
                             onClick={() => {
                              setPayInputType('select');
                              const copy = [...pay];
                              copy[index].inputCost = '';
                              setPay(copy);
                            }}
                            />
                            <DropdownBox
                              widthmain='20%'
                              height='50px'
                              selectedValue={item.paySort}
                              options={[
                                {value:'월', label:'월'},
                                {value:'연', label:'연'},
                              ]}
                              handleChange={(e)=>{
                                const copy = [...pay];
                                copy[index].paySort = e.target.value; 
                                setPay(copy);
                              }}
                            />
                            <input
                              value={item.selectCost}
                              className="inputdefault"
                              style={{width:'20%'}}
                              type="text"
                              onClick={()=>{
                                setPayInputType('select');
                              }}
                              onChange={(e) => {
                                const copy = [...pay];
                                copy[index].selectCost = e.target.value; 
                                setPay(copy);
                              }}
                            />
                            <p style={{margin:'0 10px'}}>만원</p>
                          </div>
                        </div>
                        <div className='checkTextRow' style={{display:'flex'}}>
                          <div className='checkTextBox'>
                            <input className="checkbox"
                              type="checkbox"
                              checked={payInputType === 'input'}
                              readOnly
                            />
                            <span className="checkmark" 
                              onClick={() => {
                                setPayInputType('input');
                                const copy = [...pay];
                                copy[index].selectCost = '';
                                setPay(copy);
                              }}
                            />
                            <p style={{margin:'0 10px'}}>직접입력 :</p>
                            <input
                              value={item.inputCost}
                              className="inputdefault"
                              style={{width:'35%'}}
                              type="text"
                              onChange={(e) => {
                                const copy = [...pay];
                                copy[index].inputCost = e.target.value;
                                setPay(copy);
                              }}
                            />
                          </div>
                        </div>
                        <div className='subTextBox'>
                          {
                            (tableType === 'minister' ? paySubSort : []).map((subItem: string, subIndex: number) => {
                              const isSelected = item.inputCost.split(', ').includes(subItem);
                              return (
                                <p key={subIndex}
                                  className={`subText ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    setPayInputType('input');
                                    const updated = [...pay];
                                    const currentList = item.inputCost ? item.inputCost.split(', ') : [];
                                    updated[index].selectCost = '';
                                    if (isSelected) {
                                      updated[index].inputCost = currentList
                                        .filter((i:any) => i !== subItem)
                                        .join(', ');
                                    } else {
                                      updated[index].inputCost = [...currentList, subItem].join(', ');
                                    }
                                    setPay(updated);
                                  }}
                                >
                                  {subItem}
                                </p>
                              );
                            })
                          }
                        </div>
                      </div>
                    );
                  })
                }
                </div>
              </div>
              {tableType !== 'choir' && (
                <>
              <div className="inputBox">
                <h3 className='title'><p>보험</p></h3>
                <div className="inputRow">
                {
                  insurance.map((item: any, index: number) => {
                    return (
                      <div key={index}>
                        <SubTitleControl
                          index={index}
                          data={insurance}
                          setData={setInsurance}
                          sortOptions={sortSortOption}
                          defaultValues={{ sort: "전임", content: "" }}
                        />
                        <input
                          value={item.content}
                          className="inputdefault"
                          type="text"
                          onChange={(e) => {
                            const copy = [...insurance];
                            copy[index].content = e.target.value;
                            setInsurance(copy);
                          }}
                        />
                        <div className='subTextBox'>
                          {
                            (tableType === 'minister' ? insuranceSubSort : []).map((subItem: string, subIndex: number) => {
                              const isSelected = item.content.split(', ').includes(subItem);
                              return (
                                <p key={subIndex}
                                  className={`subText ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    const updated = [...insurance];
                                    const currentList = item.content ? item.content.split(', ') : [];

                                    if (isSelected) {
                                      updated[index].content = currentList
                                        .filter((i:any) => i !== subItem)
                                        .join(', ');
                                    } else {
                                      updated[index].content = [...currentList, subItem].join(', ');
                                    }

                                    setInsurance(updated);
                                  }}
                                >
                                  {subItem}
                                </p>
                              );
                            })
                          }
                        </div>
                      </div>
                    );
                  })
                }
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>퇴직금</p></h3>
                <div className="inputRow">
                {
                  severance.map((item: any, index: number) => {
                    return (
                      <div key={index}>
                        <SubTitleControl
                          index={index}
                          data={severance}
                          setData={setSeverance}
                          sortOptions={sortSortOption}
                          defaultValues={{ sort: "전임", content: "" }}
                        />
                        <input
                          value={item.content}
                          className="inputdefault"
                          type="text"
                          onChange={(e) => {
                            const copy = [...severance];
                            copy[index].content = e.target.value;
                            setSeverance(copy);
                          }}
                        />
                        <div className='subTextBox'>
                          {
                            (tableType === 'minister' ? severanceSubSort : []).map((subItem: string, subIndex: number) => {
                              const isSelected = item.content.split(', ').includes(subItem);
                              return (
                                <p key={subIndex}
                                  className={`subText ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    const updated = [...severance];
                                    const currentList = item.content ? item.content.split(', ') : [];

                                    if (isSelected) {
                                      updated[index].content = currentList
                                        .filter((i:any) => i !== subItem)
                                        .join(', ');
                                    } else {
                                      updated[index].content = [...currentList, subItem].join(', ');
                                    }

                                    setSeverance(updated);
                                  }}
                                >
                                  {subItem}
                                </p>
                              );
                            })
                          }
                        </div>
                      </div>
                    );
                  })
                }
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>복리후생</p></h3>
                <div className="inputRow">
                {
                  welfare.map((item: any, index: number) => {
                    return (
                      <div key={index}>
                        <SubTitleControl
                          index={index}
                          data={welfare}
                          setData={setWelfare}
                          sortOptions={sortSortOption}
                          defaultValues={{ sort: "전임", content: "" }}
                        />
                        <input
                          value={item.content}
                          className="inputdefault"
                          type="text"
                          onChange={(e) => {
                            const copy = [...welfare];
                            copy[index].content = e.target.value;
                            setWelfare(copy);
                          }}
                        />
                        <div className='subTextBox'>
                          {
                            (tableType === 'minister' ? welfareSubSort : []).map((subItem: string, subIndex: number) => {
                              const isSelected = item.content.split(', ').includes(subItem);
                              return (
                                <p key={subIndex}
                                  className={`subText ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    const updated = [...welfare];
                                    const currentList = item.content ? item.content.split(', ') : [];

                                    if (isSelected) {
                                      updated[index].content = currentList
                                        .filter((i:any) => i !== subItem)
                                        .join(', ');
                                    } else {
                                      updated[index].content = [...currentList, subItem].join(', ');
                                    }

                                    setWelfare(updated);
                                  }}
                                >
                                  {subItem}
                                </p>
                              );
                            })
                          }
                        </div>
                      </div>
                    );
                  })
                }
                </div>
              </div>
              </>
              )}
            </div>
          </section>

          {/* 지원정보 -------------------------------------------------------------------------- */}
          <section>
            <h1 className='section_title'>지원정보</h1>
            <div className='inputCover'>
              <div className="inputBox">
                <h3 className='title'><p>지원기간</p></h3>
                <div className="inputRow" style={{display:'flex', alignItems:'center'}}>
                  <DateBoxSingle
                    date={applytime.startDay} 
                    setSelectDate={(e:any)=>{ 
                      const copy = {...applytime};
                      copy.startDay = e;
                      setApplytime(copy);
                    }} 
                  />
                  <p style={{margin:'0 10px'}}>부터</p>
                  {
                    applytime.daySort === "" 
                    &&
                    <>
                    <DateBoxSingle
                      date={applytime.endDay} 
                      setSelectDate={(e:any)=>{ 
                        const copy = {...applytime};
                        copy.endDay = e;
                        setApplytime(copy);
                      }} 
                    />
                    <p style={{margin:'0 10px'}}>까지</p>
                    </>
                  }
                  <div className='checkTextRow' style={{display:'flex', width:'20%', marginLeft:'20px'}}>
                    <div className='checkTextBox'>
                      <input className="checkbox"
                        type="checkbox"
                        checked={applytime.daySort === "채용시마감"}
                        readOnly
                      />
                      <span className="checkmark" 
                        onClick={() => {
                          const copy = {...applytime};
                          if (copy.daySort === '채용시마감') {
                            copy.daySort = ''  
                          } else {
                            copy.endDay = '';
                            copy.daySort = '채용시마감'
                          }
                          setApplytime(copy);
                        }}
                      />
                      <p style={{margin:'0 5px'}}>채용시마감</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>지원서류</p></h3>
                <div className="inputRow">
                {
                  applydoc.map((item: any, index: number) => {
                    return (
                      <div key={index}>
                        <SubTitleControl
                          index={index}
                          data={applydoc}
                          setData={setApplydoc}
                          sortOptions={sortSortOption}
                          defaultValues={{ sort: "전임", content: "" }}
                        />
                        <input
                          value={item.content}
                          className="inputdefault"
                          type="text"
                          onChange={(e) => {
                            const copy = [...applydoc];
                            copy[index].content = e.target.value;
                            setApplydoc(copy);
                          }}
                        />
                        <div className='checkTextRow' style={{ display: 'flex' }}>
                          {
                            applydocSubSort.map((day: string, dayIndex: number) => {
                              const selectedDays = item.content ? item.content.split(', ') : [];
                              const isChecked = selectedDays.includes(day);

                              return (
                                <div
                                  key={dayIndex}
                                  className='checkTextBox'
                                  onClick={() => {
                                    const updated = [...applydoc];
                                    const list = item.content ? item.content.split(', ') : [];
                                    if (isChecked) {
                                      updated[index].content = list.filter((d:any) => d !== day).join(', ');
                                    } else {
                                      updated[index].content = [...list, day].join(', ');
                                    }
                                    setApplydoc(updated);
                                  }}
                                >
                                  <input
                                    className="checkbox"
                                    type="checkbox"
                                    checked={isChecked}
                                    readOnly // 직접 상태를 관리하므로 readOnly로 설정
                                  />
                                  <span className="checkmark" />
                                  <div className='imgtextBox'>
                                    <p className={`${isChecked ? 'selected' : ''}`}>{day}</p>
                                  </div>
                                </div>
                              );
                            })
                          }
                        </div>
                      </div>
                    );
                  })
                }
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>지원방법</p></h3>
                <div className="inputRow">
                  <div className='checkTextRow'>
                    {
                      applyhowSubSort.map((item:any, index:any)=>{
                        return (
                          <div key={index} className='checkTextBox'
                            onClick={()=>{
                              if (applyhow === item) {
                                setApplyhow('');
                              } else {
                                setApplyhow(item);
                              }
                            }}
                          >
                            <input className="checkbox" type="checkbox"
                              checked={applyhow === item}
                              onChange={()=>{setApplyhow(item);}}
                            />
                            <span className="checkmark" />
                            <div className='imgtextBox'>
                              <p className={applyhow === item ? 'selected' : ''}>{item}</p>
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>담당자</p></h3>
                <div className="inputRow">
                  <div className="subTitle second">
                    <p></p>
                    <div style={{width:'70px', marginRight:'10px'}}><p>이름</p></div>
                    <input value={inquiry.inquiryName} className="inputdefault" type="text" 
                      placeholder='' style={{width:'50%'}}
                      onChange={(e) => {setInquiry({...inquiry, inquiryName:e.target.value})}}/>
                  </div>
                  <div className="subTitle second">
                    <p></p>
                    <div style={{width:'70px', marginRight:'10px'}}><p>e-메일</p></div>
                    <input value={inquiry.email} className="inputdefault" type="text" 
                      placeholder='' style={{width:'50%'}}
                      onChange={(e) => {setInquiry({...inquiry, email:e.target.value})}}/>
                  </div>
                  <div className="subTitle second">
                    <p></p>
                    <div style={{width:'70px', marginRight:'10px'}}><p>연락처</p></div>
                    <input value={inquiry.phone} className="inputdefault" type="text" 
                      placeholder='' style={{width:'50%'}}
                      onChange={(e) => {setInquiry({...inquiry, phone:e.target.value})}}/>
                  </div>
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>기타사항</p></h3>
                <div className="inputRow">
                  <textarea
                    value={etcNotice}
                    className="inputdefault"
                    placeholder=''
                    onChange={(e) => {setEtcNotice(e.target.value)}}
                    style={{ height: '100px', resize: 'none', width: '100%', outline: 'none', padding: '10px' }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 직접 입력하기 -------------------------------------------------------------------------- */}
          <section>
            <h1 className='section_title'>상세내용</h1>
            <div className='inputCover'>
              <div className="inputBox">
                <div className="inputRow" style={{width:'100%'}}>
                  <p style={{color:'#8B8B8B', fontSize:'12px', marginBottom:'10px'}}>* 최대 2000자 이하로 작성해주세요.</p>
                  <EditorTinymce
                    value={customInput}
                    onChange={setCustomInput}
                    widthProps="100%"
                    heightProps="1000px"
                  />
                </div>
              </div>
            </div>
          </section>


          {/* 수정완료/취소 버튼 - 하단 고정 */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            padding: '15px 20px',
            backgroundColor: '#fff',
            borderTop: '1px solid #eee',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}>
            <div 
              className="submitBtn"
              onClick={()=>navigate(-1)}
              style={{
                padding: '10px 30px',
                fontSize: '15px',
                minWidth: '120px',
                backgroundColor: '#fff',
                color: '#000',
                textAlign: 'center',
                fontWeight: 'bold',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                border: '1px solid #ddd'
              }}
            >
              취소
            </div>
            <div 
              className="submitBtn"
              onClick={handleEdit}
              style={{
                padding: '10px 30px',
                fontSize: '15px',
                minWidth: '120px',
                backgroundColor: '#000',
                color: '#fff',
                textAlign: 'center',
                fontWeight: 'bold',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
            >
              수정완료
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



