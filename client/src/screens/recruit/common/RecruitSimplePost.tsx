import { useCallback, useState } from 'react';
import './Recruit.scss'
import './RecruitList.scss'
import MainURL from '../../../MainURL';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone'
import imageCompression from "browser-image-compression";
import { DaumPostcodeEmbed } from 'react-daum-postcode';
import { format } from "date-fns";
import { useRecoilState } from 'recoil';
import { recoilUserData } from '../../../RecoilStore';
import { DropdownBox } from '../../../components/DropdownBox';
import * as churchPostData from '../recruit_church/RecruitChurchPostData';
import * as institutePostData from '../recruit_institute/RecruitInstitutePostData';
import { citydata } from '../../../DefaultData';
import { DateBoxSingle } from '../../../components/DateBoxSingle';
import { EditorTinymce } from '../../../components/EditorTinymce';
import Loading from '../../../components/Loading';
import { CiCircleMinus } from 'react-icons/ci';
import type { RecruitBoardConfig } from './RecruitTypes';

type Props = {
  config: RecruitBoardConfig;
};

export default function RecruitSimplePost({ config }: Props) {
  const postData = config.simplePostType === 'institute' ? institutePostData : churchPostData;
  const {
    applydocSubSort,
    applyhowSubSort,
    careerSubSort,
    hourSortOption,
    minuteSortOption,
    recruitNumSubSort,
    religiousbodySubSort,
    schoolSubSort,
    sortSortOption,
    sortSubSort,
    SubTitleControl,
    weekdaySubSort,
  } = postData;

  const navigate = useNavigate();
  
  const [userData, setUserData] = useRecoilState(recoilUserData);

  const [title, setTitle] = useState('');
  const [writer, setWriter] = useState('');
  const originDate = new Date();
  const todayDate = format(originDate, 'yyyy-MM-dd');

  const [church, setChurch] = useState('');
  const [religiousbody, setReligiousbody] = useState('');
  const [location, setLocation] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [address, setAddress] = useState('');
  const [mainpastor, setMainpastor] = useState('');
  const [homepage, setHomepage] = useState('');
  const [churchLogo, setChurchLogo] = useState<File | null>(null);
  
  const [sort, setSort] = useState('');
  const [school, setSchool] = useState([{sort:"전임", content:""}]);
  const [career, setCareer] = useState([{sort:"전임", content:""}]);
  const [recruitNum, setRecruitNum] = useState('');

  const [applytime, setApplytime] = useState({startDay:"", endDay:"", daySort:""});
  const [applydoc, setApplydoc] = useState([{sort:"전임", content:""}]);
  const [applyhow, setApplyhow] = useState('');
  const [inquiry, setInquiry] = useState({inquiryName:"", email:"", phone:""});
  const [etcNotice, setEtcNotice] = useState('');
  
  const [isViewAddress, setIsViewAddress] = useState(false);

  const [customInput, setCustomInput] = useState('');

  /** 페이지 하단까지 스크롤되면 저장 버튼을 우측 → 중앙으로 옮김 */
  const [isAtBottom, setIsAtBottom] = useState(false);
  const handleRecruitScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const reached = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setIsAtBottom(reached);
  };



  // 주소 입력 함수
  const onCompletePost = (data:any) => {
    const copy = data.address;
    const sido = `${data.sido} ${data.sigungu}`
    setLocation(sido);
    setAddress(copy);
    setIsViewAddress(false);
  };

  // 첨부 이미지 삭제 
  const deleteInputImage = async () => {
    setChurchLogo(null);
  };

  // 이미지 첨부 함수 ----------------------------------------------
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const date = format(originDate, 'yyyy-MM-dd');
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
  }, [setChurchLogo]);
  const { getRootProps, getInputProps } = useDropzone({ onDrop }); 


  // 글쓰기 등록 함수 ----------------------------------------------
  const registerPost = async () => {
    if (imageLoading) return;
    const formData = new FormData();
    if (churchLogo) {
      formData.append('img', churchLogo);
    }

    const getParams = {
      userAccount: userData?.userAccount,
      title,
      source: '사역자모아',
      writer,
      date: todayDate,
      church,
      religiousbody,
      location,
      locationDetail,
      address,
      mainpastor,
      homepage,
      school: JSON.stringify(school),
      career: JSON.stringify(career),
      sort,
      recruitNum,
      applydoc: JSON.stringify(applydoc),
      applyhow,
      applytime: JSON.stringify(applytime),
      etcNotice,
      inquiry: JSON.stringify(inquiry),
      churchLogo: churchLogo ? churchLogo.name : '',
      customInput : customInput,
    };
    try {
      const res = await axios.post(`${MainURL}/${config.apiBase}/postsrecruit`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: getParams,
      });
      if (res.data) {
        alert('등록이 완료되었습니다.');
        // 폼 리셋
        setTitle('');
        setWriter('');
        setChurch('');
        setReligiousbody('');
        setLocation('');
        setLocationDetail('');
        setAddress('');
        setMainpastor('');
        setHomepage('');
        setSort('');
        setSchool([{sort:"전임", content:""}]);
        setCareer([{sort:"전임", content:""}]);
        setRecruitNum('');
        setApplytime({startDay:"", endDay:"", daySort:""});
        setApplydoc([{sort:"전임", content:""}]);
        setApplyhow('');
        setInquiry({inquiryName:"", email:"", phone:""});
        setEtcNotice('');
        setCustomInput('');
        setChurchLogo(null);
        navigate(-1);
      }
    } catch (error) {
      setImageLoading(false);
      alert('등록에 실패했습니다. 다시 시도해 주세요.');
      console.log('실패함', error);
    }
  };

  return (
    <>
    <div
      className="recruit"
      style={{ height: '700px', overflowY: 'auto', paddingBottom: 88 }}
      onScroll={handleRecruitScroll}
    >

      <div className="inner">

        <div className="subpage__main">
          
          <section style={{marginBottom:'50px'}}>
            <div className="main_title_row">
              <h3 className='main_title'>
                어떤 지원자를 모집하시나요?
              </h3>
              <div className='postBtnbox'>
                <div className='postBtn'
                  style={{marginRight:'10px'}}
                  onClick={()=>{navigate(-1);}}
                >
                  <p>목록</p>
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
                              <img src={`${MainURL}/siteimages/religiousbody/${item}.jpg`}/>
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
                      citydata.map((c:any) => c.city).map((item:any, index:any)=>{
                        return (
                          <div key={index} className='checkTextBox'
                            onClick={()=>{
                              if (location === item) {
                                setLocation('');
                                setLocationDetail('');
                              } else {
                                setLocation(item);
                                setLocationDetail('');
                              }
                            }}
                          >
                            <input className="checkbox" type="checkbox"
                              checked={location  === item}
                              onChange={()=>{setLocation(item); setLocationDetail('');}}
                            />
                            <span className="checkmark" />
                              <div className='imgtextBox'>
                              <p className={location === item ? 'selectedLocation' : ''}>{item}</p>
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
                  {
                    !location ? (
                      <p style={{fontSize:'14px', color:'#999'}}>위치를 선택해주세요</p>
                    ) : (
                      <div className='checkTextRow'>
                        {
                          (citydata.find((c:any) => c.city === location)?.subarea || []).map((sub:string, idx:number) => (
                            <div key={idx} className='checkTextBox'
                              onClick={() => {
                                if (locationDetail === sub) {
                                  setLocationDetail('');
                                } else {
                                  setLocationDetail(sub);
                                }
                              }}
                            >
                              <input className="checkbox" type="checkbox"
                                checked={locationDetail === sub}
                                onChange={() => { setLocationDetail(sub); }}
                              />
                              <span className="checkmark" />
                              <div className='imgtextBox'>
                                <p className={locationDetail === sub ? 'selectedSubarea' : ''}>{sub}</p>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )
                  }
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
                                setSchool([{sort:"전임", content:""}]);
                                setCareer([{sort:"전임", content:""}]);
                                setApplydoc([{sort:"전임", content:""}]);
                              } else {
                                setSort(item);
                               // 선택된 직무에 따라 배열 생성
                                if (item === '전임' || item === '준전임' || item === '파트' || item === '전임or준전임' || item === '전임or파트' || item === '준전임or파트' || item === '담임') {
                                  setSchool([{sort:item, content:""}]);
                                  setCareer([{sort:item, content:""}]);
                                  setApplydoc([{sort:item, content:""}]);
                                } else if (item === '전임&준전임') {
                                  setSchool([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                  setCareer([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                  setApplydoc([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                } else if (item === '전임&파트') {
                                  setSchool([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                  setCareer([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                  setApplydoc([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                } else if (item === '준전임&파트') {
                                  setSchool([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                  setCareer([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
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

          {/* 본문 끝 인라인 저장 버튼 — 스크롤이 끝에 도달했을 때 노출됨 (플로팅은 숨김) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              margin: '20px 0 40px',
            }}
          >
            <div
              className="submitBtn"
              onClick={registerPost}
              style={{
                padding: '14px 36px',
                minWidth: 160,
                fontSize: 15,
                fontWeight: 'bold',
                color: '#fff',
                backgroundColor: '#000',
                textAlign: 'center',
                borderRadius: 5,
                cursor: 'pointer',
              }}
            >
              저장하기
            </div>
          </div>

        </div>
      </div>
    </div>

      {/* 플로팅 저장 버튼 — 우측 하단 고정, 페이지 끝에서는 숨김(본문 끝의 인라인 버튼이 그 자리를 대체) */}
      {!isAtBottom && (
        <div
          className="floating-save-btn"
          onClick={registerPost}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            padding: '14px 28px',
            minWidth: 120,
            fontSize: 15,
            fontWeight: 'bold',
            color: '#fff',
            backgroundColor: '#000',
            textAlign: 'center',
            borderRadius: 999,
            boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            zIndex: 1100,
          }}
        >
          저장하기
        </div>
      )}
    </>
  )
}



