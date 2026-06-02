import { useCallback, useEffect, useState } from 'react';
import './Mypage.scss';
import '../ForListPage.scss';
import '../recruit/common/RecruitList.scss';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import Loading from '../../components/Loading';
import { useRecoilState } from 'recoil';
import { recoilUserData } from '../../RecoilStore';
import { useDropzone } from 'react-dropzone';
import imageCompression from "browser-image-compression";
import { DaumPostcodeEmbed } from 'react-daum-postcode';
import { CiCircleMinus } from 'react-icons/ci';
import { citydata } from '../../DefaultData';
import '../recruit/common/Recruit.scss';

interface EducationItem {
  schoolName: string;
  major: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
}

interface CareerItem {
  companyName: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export default function ResumeEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const resumeId = new URLSearchParams(location.search).get('id');
  const [userData] = useRecoilState(recoilUserData);
  const isEditMode = !!resumeId;

  // 기본 정보
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [ageText, setAgeText] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [phone3, setPhone3] = useState('');
  const [email1, setEmail1] = useState('');
  const [email2, setEmail2] = useState('');
  const [email2Custom, setEmail2Custom] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [isViewAddress, setIsViewAddress] = useState(false);

  // 배열 필드
  const [educationItems, setEducationItems] = useState<EducationItem[]>([]);
  const [careerItems, setCareerItems] = useState<CareerItem[]>([]);

  // 희망사항
  const [hopeInfo, setHopeInfo] = useState({
    hopeType: '',
    hopeLocation: [] as string[],
    hopeSalary: '',
    hopeSalaryPaySort: '월',
    hopeRoles: '',
    hopeDepartment: '',
    hopeInsurance: '',
    hopeWelfare: ''
  });
  const [selectedCity, setSelectedCity] = useState<string>('');

  // 기타
  const [saveDate, setSaveDate] = useState('');
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  // DaumPostcodeEmbed 주소 입력 함수
  const onCompletePost = (data: any) => {
    const copy = data.address;
    setAddress(copy);
    setIsViewAddress(false);
  };

  // 이미지 업로드
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
      const userIdCopy = userData?.userAccount.slice(0, 5);
      const regex = resizingBlob.name.replace(regexCopy, '');
      const regexSlice = regex.slice(-15);
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const newFile = new File([resizingBlob], `${dateStr}${userIdCopy}_${regexSlice}`, {
        type: file.type,
      });
      setProfileImage(newFile);
      setProfileImageUrl(URL.createObjectURL(newFile));
      setImageLoading(false);
    } catch (error) {
      setImageLoading(false);
      console.error('이미지 리사이징 중 오류 발생:', error);
    }
  }, [userData]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  // 기존 데이터 불러오기
  useEffect(() => {
    if (!resumeId) {
      const today = new Date();
      setSaveDate(today.toISOString().split('T')[0]);
      return;
    }
    setLoading(true);
    axios.get(`${MainURL}/resume/getresume/${resumeId}`, {
      params: { userAccount: userData.userAccount }
    })
      .then(res => {
        if (res.data.success && res.data.resume) {
          const data = res.data.resume;
          setTitle(data.title || '');
          setName(data.name || '');
          setGender(data.gender || '');
          setBirthYear(data.birthYear || '');
          setBirthMonth(data.birthMonth || '');
          setBirthDay(data.birthDay || '');
          setAgeText(data.ageText || '');
          // phone 파싱 (010-1234-5678 형식 또는 01012345678 형식)
          const phoneValue = data.phone || '';
          if (phoneValue) {
            const phoneParts = phoneValue.replace(/-/g, '').match(/(\d{3})(\d{4})(\d{4})/);
            if (phoneParts) {
              setPhone1(phoneParts[1]);
              setPhone2(phoneParts[2]);
              setPhone3(phoneParts[3]);
            } else {
              const parts = phoneValue.split('-');
              if (parts.length === 3) {
                setPhone1(parts[0]);
                setPhone2(parts[1]);
                setPhone3(parts[2]);
              }
            }
          }
          // email 파싱
          const emailValue = data.email || '';
          if (emailValue) {
            const emailParts = emailValue.split('@');
            if (emailParts.length === 2) {
              setEmail1(emailParts[0]);
              const domain = emailParts[1];
              const commonDomains = ['naver.com', 'gmail.com', 'daum.net', 'hanmail.net', 'kakao.com', 'outlook.com', 'yahoo.com'];
              if (commonDomains.includes(domain)) {
                setEmail2(domain);
                setEmail2Custom('');
              } else {
                setEmail2('직접입력');
                setEmail2Custom(domain);
              }
            }
          }
          setAddress(data.address || '');
          setAddressDetail(data.addressDetail || '');
          setEducationItems(data.educationItems || []);
          setCareerItems(data.careerItems || []);
          // hopeLocation 파싱 (문자열 또는 배열)
          const locationValue = data.hopeLocation || '';
          let parsedLocation: string[] = [];
          if (Array.isArray(locationValue)) {
            parsedLocation = locationValue;
          } else if (typeof locationValue === 'string' && locationValue) {
            // 쉼표로 구분된 문자열을 배열로 변환
            parsedLocation = locationValue.split(',').map(loc => loc.trim()).filter(loc => loc);
          }
          setHopeInfo({
            hopeType: data.hopeType || '',
            hopeLocation: parsedLocation,
            hopeSalary: data.hopeSalary || '',
            hopeSalaryPaySort: data.hopeSalaryPaySort || '월',
            hopeRoles: data.hopeRoles || '',
            hopeDepartment: data.hopeDepartment || '',
            hopeInsurance: data.hopeInsurance || '',
            hopeWelfare: data.hopeWelfare || ''
          });
          setSaveDate(data.saveDate || new Date().toISOString().split('T')[0]);
          
          if (data.profileImage) {
            setProfileImageUrl(`${MainURL}/images/resume/profile/${data.profileImage}`);
          }
        }
      })
      .catch(err => {
        console.error('이력서 조회 실패:', err);
        alert('이력서를 불러오는데 실패했습니다.');
      })
      .finally(() => setLoading(false));
  }, [resumeId, userData.userAccount]);

  // 저장/수정 함수
  const handleSave = async () => {
    const phoneValue = phone1 && phone2 && phone3 ? `${phone1}-${phone2}-${phone3}` : '';
    const emailValue = email1 && (email2 === '직접입력' ? email2Custom : email2) ? `${email1}@${email2 === '직접입력' ? email2Custom : email2}` : '';
    
    if (!name || !phoneValue || !emailValue) {
      alert('필수 입력 항목을 입력해주세요. (이름, 휴대폰, 이메일)');
      return;
    }

    if (imageLoading) return;

    const formData = new FormData();
    if (profileImage) {
      formData.append('profileImage', profileImage);
    }

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const requestData = {
      ...(isEditMode && { resumeId }),
      userAccount: userData.userAccount,
      title: title,
      name,
      gender,
      birthYear,
      birthMonth,
      birthDay,
      ageText,
      phone: phoneValue,
      email: emailValue,
      address,
      addressDetail,
      educationItems: JSON.stringify(educationItems),
      careerItems: JSON.stringify(careerItems),
      hopeInfo: JSON.stringify({
        ...hopeInfo,
        hopeLocation: Array.isArray(hopeInfo.hopeLocation) ? hopeInfo.hopeLocation.join(', ') : hopeInfo.hopeLocation
      }),
      signWriter: userData?.userNickName || userData?.userAccount || '',
      saveDate: saveDate || dateStr
    };

    // FormData에 모든 필드 추가
    Object.keys(requestData).forEach(key => {
      formData.append(key, requestData[key as keyof typeof requestData] as string);
    });

    try {
      const url = isEditMode ? `${MainURL}/resume/updateresume` : `${MainURL}/resume/saveresume`;
      const res = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        alert(isEditMode ? '이력서가 수정되었습니다.' : '이력서가 저장되었습니다.');
        navigate('/mypage/resumemanage');
      } else {
        alert(res.data.error || '저장에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('저장 실패:', error);
      alert(error.response?.data?.error || '저장에 실패했습니다.');
    }
  };

  // 배열 항목 추가/삭제 함수들
  const addEducationItem = () => {
    setEducationItems([...educationItems, {
      schoolName: '',
      major: '',
      startDate: '',
      endDate: '',
      status: '',
      description: ''
    }]);
  };

  const removeEducationItem = (index: number) => {
    setEducationItems(educationItems.filter((_, i) => i !== index));
  };

  const addCareerItem = () => {
    setCareerItems([...careerItems, {
      companyName: '',
      position: '',
      startDate: '',
      endDate: '',
      description: ''
    }]);
  };

  const removeCareerItem = (index: number) => {
    setCareerItems(careerItems.filter((_, i) => i !== index));
  };


  if (loading) return <Loading />;

  return (
    <div className="mypage" style={{ paddingTop: '50px', paddingBottom: '100px' }}>
      <div className="inner">
        <div className="subpage__main" style={{ width: '100%' }}>
          <section style={{ marginBottom: '50px' }}>
            <div className="main_title_row">
              <h3 className='main_title'>
                {isEditMode ? '이력서 수정' : '이력서 작성'}
              </h3>
              <div className='postBtnbox'>
                <div className='postBtn' style={{ marginRight: '10px' }} onClick={() => navigate(-1)}>
                  <p>뒤로가기</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h1 className='section_title'>기본 정보</h1>
            <div className='inputCover'>
              <div className="inputBox">
                <h3 className='title'><p>이력서 제목</p></h3>
                <div className="inputRow">
                  <input value={title} className="inputdefault" type="text"
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 신입 목사 이력서" />
                </div>
              </div>
            </div>
          </section>

          {/* 기본 정보 */}
          <section>
            <h1 className='section_title'>인적사항</h1>
            <div className='inputCover'>
              <div className="inputBox" style={{ gridColumn: '1 / -1' }}>
                <h3 className='title'><p>프로필 사진</p></h3>
                <div className="inputRow">
                  {profileImageUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={profileImageUrl} alt="프로필" style={{ width: '150px', height: '200px', objectFit: 'cover', borderRadius: '5px' }} />
                      <button type="button" onClick={() => { setProfileImage(null); setProfileImageUrl(''); }}
                        style={{ padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        삭제
                      </button>
                    </div>
                  ) : (
                    <div {...getRootProps()} style={{ width: '130px', height: '200px',
                      padding: '20px', border: '2px dashed #ccc', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input {...getInputProps()} />
                      {imageLoading ? <p>이미지 처리 중...</p> : <p>이미지 첨부</p>}
                    </div>
                  )}
                </div>
              </div>
              <div className="inputCoverTwoColumns">
                <div className="inputBox">
                  <h3 className='title'><p>이름 *</p></h3>
                  <div className="inputRow">
                    <input value={name} className="inputdefault" type="text"
                      onChange={(e) => setName(e.target.value)} required />
                  </div>
                </div>
                <div className="inputBox">
                  <h3 className='title'><p>성별</p></h3>
                  <div className="inputRow">
                    <div className='checkTextRow'>
                      <div className='checkTextBox' onClick={() => setGender('남')}>
                        <input className="checkbox" type="radio" name="gender" value="남"
                          checked={gender === '남'} onChange={() => setGender('남')} />
                        <span className="checkmark" />
                        <div className='imgtextBox'>
                          <p className={gender === '남' ? 'selected' : ''}>남</p>
                        </div>
                      </div>
                      <div className='checkTextBox' onClick={() => setGender('여')}>
                        <input className="checkbox" type="radio" name="gender" value="여"
                          checked={gender === '여'} onChange={() => setGender('여')} />
                        <span className="checkmark" />
                        <div className='imgtextBox'>
                          <p className={gender === '여' ? 'selected' : ''}>여</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="inputCoverTwoColumns">
                <div className="inputBox">
                  <h3 className='title'><p>생년월일</p></h3>
                  <div className="inputRow" style={{ display: 'flex', gap: '10px' }}>
                    <select value={birthYear} className="inputdefault" style={{ width: '40%' }}
                      onChange={(e) => setBirthYear(e.target.value)}>
                      <option value="">년</option>
                      {Array.from({ length: 51 }, (_, i) => 1960 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <select value={birthMonth} className="inputdefault" style={{ width: '30%' }}
                      onChange={(e) => setBirthMonth(e.target.value)}>
                      <option value="">월</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    <select value={birthDay} className="inputdefault" style={{ width: '30%' }}
                      onChange={(e) => setBirthDay(e.target.value)}>
                      <option value="">일</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="inputBox">
                  <h3 className='title'><p>나이 (만 나이)</p></h3>
                  <div className="inputRow">
                    <select value={ageText} className="inputdefault"
                      onChange={(e) => setAgeText(e.target.value)}>
                      <option value="">선택</option>
                      {Array.from({ length: 43 }, (_, i) => 18 + i).map(age => (
                        <option key={age} value={age}>{age}세</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="inputCoverTwoColumns">
                <div className="inputBox">
                  <h3 className='title'><p>휴대폰 *</p></h3>
                  <div className="inputRow" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      value={phone1} 
                      className="inputdefault" 
                      type="text"
                      maxLength={3}
                      style={{ width: '80px' }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                        setPhone1(value);
                      }} 
                      required 
                    />
                    <span style={{ fontSize: '14px' }}>-</span>
                    <input 
                      value={phone2} 
                      className="inputdefault" 
                      type="text"
                      maxLength={4}
                      style={{ width: '100px' }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                        setPhone2(value);
                      }} 
                      required 
                    />
                    <span style={{ fontSize: '14px' }}>-</span>
                    <input 
                      value={phone3} 
                      className="inputdefault" 
                      type="text"
                      maxLength={4}
                      style={{ width: '100px' }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                        setPhone3(value);
                      }} 
                      required 
                    />
                  </div>
                </div>
                <div className="inputBox">
                  <h3 className='title'><p>이메일 *</p></h3>
                  <div className="inputRow" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input 
                      value={email1} 
                      className="inputdefault" 
                      type="text"
                      style={{ flex: 1, minWidth: '120px' }}
                      onChange={(e) => {
                        setEmail1(e.target.value);
                      }} 
                      required 
                    />
                    <span style={{ fontSize: '14px' }}>@</span>
                    {email2 === '직접입력' ? (
                      <input 
                        value={email2Custom} 
                        className="inputdefault" 
                        type="text"
                        style={{ flex: 1, minWidth: '150px' }}
                        placeholder="메일 주소 입력"
                        onChange={(e) => {
                          setEmail2Custom(e.target.value);
                        }} 
                        required
                      />
                    ) : (
                      <select 
                        value={email2} 
                        className="inputdefault" 
                        style={{ flex: 1, minWidth: '150px' }}
                        onChange={(e) => {
                          setEmail2(e.target.value);
                          setEmail2Custom('');
                        }}
                        required
                      >
                        <option value="">선택</option>
                        <option value="naver.com">naver.com</option>
                        <option value="gmail.com">gmail.com</option>
                        <option value="daum.net">daum.net</option>
                        <option value="hanmail.net">hanmail.net</option>
                        <option value="kakao.com">kakao.com</option>
                        <option value="outlook.com">outlook.com</option>
                        <option value="yahoo.com">yahoo.com</option>
                        <option value="직접입력">직접입력</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
              <div className="inputCoverTwoColumns">
                <div className="inputBox">
                  <h3 className='title'><p>주소</p></h3>
                  <div className="inputRow">
                    <input value={address} className="inputdefault" type="text"
                      readOnly onClick={() => setIsViewAddress(true)} />
                    <button type="button" onClick={() => setIsViewAddress(true)}
                      style={{ marginTop:'5px', padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                      주소 검색
                    </button>
                  </div>
                </div>
                {isViewAddress && (
                  <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', width: '500px' }}>
                      <DaumPostcodeEmbed onComplete={onCompletePost} />
                      <button onClick={() => setIsViewAddress(false)} style={{ marginTop: '10px', padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>닫기</button>
                    </div>
                  </div>
                )}
                <div className="inputBox">
                  <h3 className='title'><p>상세주소</p></h3>
                  <div className="inputRow">
                    <input value={addressDetail} className="inputdefault" type="text"
                      onChange={(e) => setAddressDetail(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </section>


          {/* 학력 상세 */}
          <section>
            <h1 className='section_title'>학력</h1>
            <div className='inputCover'>
              {educationItems.map((item, index) => (
                <div key={index} style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '20px', borderRadius: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4>학력 {index + 1}</h4>
                    <button type="button" onClick={() => removeEducationItem(index)}
                      style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '3px', padding: '5px 10px', cursor: 'pointer' }}>
                      <CiCircleMinus size={20} />
                    </button>
                  </div>
                  <div className="inputCoverTwoColumns">
                    <div className="inputBox">
                      <h3 className='title'><p>학교명</p></h3>
                      <div className="inputRow">
                        <input value={item.schoolName} className="inputdefault" type="text"
                          onChange={(e) => {
                            const newItems = [...educationItems];
                            newItems[index].schoolName = e.target.value;
                            setEducationItems(newItems);
                          }} />
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>기간</p></h3>
                      <div className="inputRow" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <input 
                            value={item.startDate ? item.startDate.split('-')[0] || '' : ''} 
                            className="inputdefault" 
                            type="text"
                            placeholder="년"
                            maxLength={4}
                            style={{ width: '80px' }}
                            onChange={(e) => {
                              const year = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                              const newItems = [...educationItems];
                              const month = item.startDate ? item.startDate.split('-')[1] || '' : '';
                              newItems[index].startDate = year && month ? `${year}-${month}` : year || '';
                              setEducationItems(newItems);
                            }} />
                          <input 
                            value={item.startDate ? item.startDate.split('-')[1] || '' : ''} 
                            className="inputdefault" 
                            type="text"
                            placeholder="월"
                            maxLength={2}
                            style={{ width: '60px' }}
                            onChange={(e) => {
                              const month = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                              const newItems = [...educationItems];
                              const year = item.startDate ? item.startDate.split('-')[0] || '' : '';
                              newItems[index].startDate = year && month ? `${year}-${month}` : month || '';
                              setEducationItems(newItems);
                            }} />
                        </div>
                        <span style={{ fontSize: '14px' }}>~</span>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <input 
                            value={item.endDate ? item.endDate.split('-')[0] || '' : ''} 
                            className="inputdefault" 
                            type="text"
                            placeholder="년"
                            maxLength={4}
                            style={{ width: '80px' }}
                            onChange={(e) => {
                              const year = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                              const newItems = [...educationItems];
                              const month = item.endDate ? item.endDate.split('-')[1] || '' : '';
                              newItems[index].endDate = year && month ? `${year}-${month}` : year || '';
                              setEducationItems(newItems);
                            }} />
                          <input 
                            value={item.endDate ? item.endDate.split('-')[1] || '' : ''} 
                            className="inputdefault" 
                            type="text"
                            placeholder="월"
                            maxLength={2}
                            style={{ width: '60px' }}
                            onChange={(e) => {
                              const month = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                              const newItems = [...educationItems];
                              const year = item.endDate ? item.endDate.split('-')[0] || '' : '';
                              newItems[index].endDate = year && month ? `${year}-${month}` : month || '';
                              setEducationItems(newItems);
                            }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="inputCoverTwoColumns">
                    <div className="inputBox">
                      <h3 className='title'><p>전공학과</p></h3>
                      <div className="inputRow">
                        <input value={item.major} className="inputdefault" type="text"
                          onChange={(e) => {
                            const newItems = [...educationItems];
                            newItems[index].major = e.target.value;
                            setEducationItems(newItems);
                          }} />
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>현재 상태</p></h3>
                      <div className="inputRow">
                        <div className='checkTextRow'>
                          {['졸업', '재학', '휴학', '중퇴', '수료'].map((statusItem) => (
                            <div key={statusItem} className='checkTextBox' 
                              onClick={() => {
                                const newItems = [...educationItems];
                                newItems[index].status = statusItem;
                                setEducationItems(newItems);
                              }}>
                              <input className="checkbox" type="radio" name={`education-status-${index}`}
                                value={statusItem}
                                checked={item.status === statusItem}
                                onChange={() => {
                                  const newItems = [...educationItems];
                                  newItems[index].status = statusItem;
                                  setEducationItems(newItems);
                                }} />
                              <span className="checkmark" />
                              <div className='imgtextBox'>
                                <p className={item.status === statusItem ? 'selected' : ''}>{statusItem}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addEducationItem}
                style={{ padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                학력 추가
              </button>
            </div>
          </section>

          {/* 경력 상세 */}
          <section>
            <h1 className='section_title'>경력</h1>
            <div className='inputCover'>
              {careerItems.map((item, index) => (
                <div key={index} style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '20px', borderRadius: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4>경력 {index + 1}</h4>
                    <button type="button" onClick={() => removeCareerItem(index)}
                      style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '3px', padding: '5px 10px', cursor: 'pointer' }}>
                      <CiCircleMinus size={20} />
                    </button>
                  </div>
                  <div className="inputCoverTwoColumns">
                    <div className="inputBox">
                      <h3 className='title'><p>교회명</p></h3>
                      <div className="inputRow">
                        <input value={item.companyName} className="inputdefault" type="text"
                          onChange={(e) => {
                            const newItems = [...careerItems];
                            newItems[index].companyName = e.target.value;
                            setCareerItems(newItems);
                          }} />
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>기간</p></h3>
                      <div className="inputRow" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <input 
                            value={item.startDate ? item.startDate.split('-')[0] || '' : ''} 
                            className="inputdefault" 
                            type="text"
                            placeholder="년"
                            maxLength={4}
                            style={{ width: '80px' }}
                            onChange={(e) => {
                              const year = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                              const newItems = [...careerItems];
                              const month = item.startDate ? item.startDate.split('-')[1] || '' : '';
                              newItems[index].startDate = year && month ? `${year}-${month}` : year || '';
                              setCareerItems(newItems);
                            }} />
                          <input 
                            value={item.startDate ? item.startDate.split('-')[1] || '' : ''} 
                            className="inputdefault" 
                            type="text"
                            placeholder="월"
                            maxLength={2}
                            style={{ width: '60px' }}
                            onChange={(e) => {
                              const month = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                              const newItems = [...careerItems];
                              const year = item.startDate ? item.startDate.split('-')[0] || '' : '';
                              newItems[index].startDate = year && month ? `${year}-${month}` : month || '';
                              setCareerItems(newItems);
                            }} />
                        </div>
                        <span style={{ fontSize: '14px' }}>~</span>
                        <div style={{ width: '48%', display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <input 
                            value={item.endDate ? item.endDate.split('-')[0] || '' : ''} 
                            className="inputdefault" 
                            type="text"
                            placeholder="년"
                            maxLength={4}
                            style={{ width: '80px' }}
                            onChange={(e) => {
                              const year = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                              const newItems = [...careerItems];
                              const month = item.endDate ? item.endDate.split('-')[1] || '' : '';
                              newItems[index].endDate = year && month ? `${year}-${month}` : year || '';
                              setCareerItems(newItems);
                            }} />
                          <input 
                            value={item.endDate ? item.endDate.split('-')[1] || '' : ''} 
                            className="inputdefault" 
                            type="text"
                            placeholder="월"
                            maxLength={2}
                            style={{ width: '60px' }}
                            onChange={(e) => {
                              const month = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                              const newItems = [...careerItems];
                              const year = item.endDate ? item.endDate.split('-')[0] || '' : '';
                              newItems[index].endDate = year && month ? `${year}-${month}` : month || '';
                              setCareerItems(newItems);
                            }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="inputCoverTwoColumns">
                    <div className="inputBox">
                      <h3 className='title'><p>구분</p></h3>
                      <div className="inputRow">
                        <div className='checkTextRow'>
                          {['전임', '준전임', '파트'].map((typeItem) => (
                            <div key={typeItem} className='checkTextBox' 
                              onClick={() => {
                                const newItems = [...careerItems];
                                newItems[index].position = typeItem;
                                setCareerItems(newItems);
                              }}>
                              <input className="checkbox" type="radio" name={`career-type-${index}`}
                                value={typeItem}
                                checked={item.position === typeItem}
                                onChange={() => {
                                  const newItems = [...careerItems];
                                  newItems[index].position = typeItem;
                                  setCareerItems(newItems);
                                }} />
                              <span className="checkmark" />
                              <div className='imgtextBox'>
                                <p className={item.position === typeItem ? 'selected' : ''}>{typeItem}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>사역내용</p></h3>
                      <div className="inputRow">
                        <input value={item.position} className="inputdefault" type="text"
                          onChange={(e) => {
                            const newItems = [...careerItems];
                            newItems[index].position = e.target.value;
                            setCareerItems(newItems);
                          }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addCareerItem}
                style={{ padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                경력 추가
              </button>
            </div>
          </section>


          {/* 희망사항 */}
          <section>
            <h1 className='section_title'>희망사항</h1>
            <div className='inputCover'>
              <div className="inputBox">
                <h3 className='title'><p>희망 유형</p></h3>
                <div className="inputRow">
                  <div className='checkTextRow'>
                    {['전임', '준전임', '파트'].map((typeItem) => (
                      <div key={typeItem} className='checkTextBox' 
                        onClick={() => setHopeInfo({ ...hopeInfo, hopeType: typeItem })}>
                        <input className="checkbox" type="radio" name="hopeType"
                          value={typeItem}
                          checked={hopeInfo.hopeType === typeItem}
                          onChange={() => setHopeInfo({ ...hopeInfo, hopeType: typeItem })} />
                        <span className="checkmark" />
                        <div className='imgtextBox'>
                          <p className={hopeInfo.hopeType === typeItem ? 'selected' : ''}>{typeItem}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>희망 지역</p></h3>
                <div className="inputRow">
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 500 }}>시/도 선택</p>
                    <div className='checkInputCover Recruit'>
                      {citydata.map((city, cityIdx) => (
                        <div
                          key={`city-${cityIdx}`}
                          className={`checkInputbox ${selectedCity === city.city ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedCity(city.city);
                          }}>
                          <p>{city.city}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedCity && (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 500 }}>
                        {citydata.find(c => c.city === selectedCity)?.city} 하위 지역 선택
                      </p>
                      <div className='checkInputCover Recruit'>
                        {citydata.find(c => c.city === selectedCity)?.subarea.length === 0 ? (
                          // 세종특별자치시처럼 하위지역이 없는 경우
                          <div
                            className={`checkInputbox ${hopeInfo.hopeLocation.includes(selectedCity) ? 'selected' : ''}`}
                            onClick={() => {
                              if (hopeInfo.hopeLocation.includes(selectedCity)) {
                                setHopeInfo({ ...hopeInfo, hopeLocation: hopeInfo.hopeLocation.filter(loc => loc !== selectedCity) });
                              } else {
                                setHopeInfo({ ...hopeInfo, hopeLocation: [...hopeInfo.hopeLocation, selectedCity] });
                              }
                            }}>
                            <p>{selectedCity}</p>
                          </div>
                        ) : (
                          citydata.find(c => c.city === selectedCity)?.subarea.map((subarea, subIdx) => {
                            const locationValue = `${selectedCity} ${subarea}`;
                            const isSelected = hopeInfo.hopeLocation.includes(locationValue);
                            return (
                              <div
                                key={`subarea-${subIdx}`}
                                className={`checkInputbox ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  if (isSelected) {
                                    setHopeInfo({ ...hopeInfo, hopeLocation: hopeInfo.hopeLocation.filter(loc => loc !== locationValue) });
                                  } else {
                                    setHopeInfo({ ...hopeInfo, hopeLocation: [...hopeInfo.hopeLocation, locationValue] });
                                  }
                                }}>
                                <p>{subarea}</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                  {hopeInfo.hopeLocation.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <b style={{ display: 'block', marginBottom: '10px', fontSize: '14px' }}>선택된 지역:</b>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {hopeInfo.hopeLocation.map((item, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              backgroundColor: '#f5f7ff',
                              border: '1.5px solid #3f51b5',
                              borderRadius: '5px',
                              fontSize: '14px'
                            }}
                          >
                            {item}
                            <button
                              onClick={() => {
                                setHopeInfo({ ...hopeInfo, hopeLocation: hopeInfo.hopeLocation.filter(loc => loc !== item) });
                              }}
                              aria-label="삭제"
                              type="button"
                              style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '18px',
                                cursor: 'pointer',
                                color: '#3f51b5',
                                padding: 0,
                                lineHeight: 1,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>희망 급여</p></h3>
                <div className="inputRow" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select value={hopeInfo.hopeSalaryPaySort} className="inputdefault" style={{ width: '80px' }}
                    onChange={(e) => setHopeInfo({ ...hopeInfo, hopeSalaryPaySort: e.target.value })}>
                    <option value="월">월</option>
                    <option value="연">연</option>
                  </select>
                  <input value={hopeInfo.hopeSalary} className="inputdefault" type="text" style={{ width: '150px' }}
                    onChange={(e) => setHopeInfo({ ...hopeInfo, hopeSalary: e.target.value })} placeholder="금액 입력" />
                  <span style={{ fontSize: '14px' }}>만원</span>
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>희망 역할</p></h3>
                <div className="inputRow">
                  <input value={hopeInfo.hopeRoles} className="inputdefault" type="text"
                    onChange={(e) => setHopeInfo({ ...hopeInfo, hopeRoles: e.target.value })} placeholder="예: 목사, 전도사" />
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>희망 부서</p></h3>
                <div className="inputRow">
                  <input value={hopeInfo.hopeDepartment} className="inputdefault" type="text"
                    onChange={(e) => setHopeInfo({ ...hopeInfo, hopeDepartment: e.target.value })} placeholder="예: 청년부, 찬양팀" />
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>희망 보험</p></h3>
                <div className="inputRow">
                  <input
                    value={hopeInfo.hopeInsurance}
                    className="inputdefault"
                    type="text"
                    onChange={(e) => setHopeInfo({ ...hopeInfo, hopeInsurance: e.target.value })}
                    placeholder="보험 정보 입력"
                  />
                  <div className='subTextBox'>
                    {['건강보험', '고용보험', '국민연금', '산재보험'].map((subItem: string, subIndex: number) => {
                      const isSelected = hopeInfo.hopeInsurance.split(', ').includes(subItem);
                      return (
                        <p
                          key={subIndex}
                          className={`subText ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            const currentList = hopeInfo.hopeInsurance ? hopeInfo.hopeInsurance.split(', ') : [];
                            if (isSelected) {
                              setHopeInfo({ ...hopeInfo, hopeInsurance: currentList.filter((i: any) => i !== subItem).join(', ') });
                            } else {
                              setHopeInfo({ ...hopeInfo, hopeInsurance: [...currentList, subItem].join(', ') });
                            }
                          }}
                        >
                          {subItem}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="inputBox">
                <h3 className='title'><p>희망 복리후생</p></h3>
                <div className="inputRow">
                  <input
                    value={hopeInfo.hopeWelfare}
                    className="inputdefault"
                    type="text"
                    onChange={(e) => setHopeInfo({ ...hopeInfo, hopeWelfare: e.target.value })}
                    placeholder="복리후생 정보 입력"
                  />
                  <div className='subTextBox'>
                    {['사택제공', '공과금', '통신비', '월차제도', '유연근무제', '칼퇴권장', '건강검진', '상여금', '휴가비', '출산휴가'].map((subItem: string, subIndex: number) => {
                      const isSelected = hopeInfo.hopeWelfare.split(', ').includes(subItem);
                      return (
                        <p
                          key={subIndex}
                          className={`subText ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            const currentList = hopeInfo.hopeWelfare ? hopeInfo.hopeWelfare.split(', ') : [];
                            if (isSelected) {
                              setHopeInfo({ ...hopeInfo, hopeWelfare: currentList.filter((i: any) => i !== subItem).join(', ') });
                            } else {
                              setHopeInfo({ ...hopeInfo, hopeWelfare: [...currentList, subItem].join(', ') });
                            }
                          }}
                        >
                          {subItem}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 기타 */}
          <section>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '16px', color: '#666' }}>작성자: </span>
                <span style={{ fontSize: '16px', fontWeight: 500 }}>{userData?.userNickName || userData?.userAccount || '-'}</span>
              </div>
              <div>
                <span style={{ fontSize: '16px', color: '#666' }}>저장일: </span>
                <span style={{ fontSize: '16px', fontWeight: 500 }}>{saveDate || new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>
          </section>

          <div style={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            background: '#fff', 
            padding: '20px', 
            textAlign: 'center',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}>
            <button onClick={handleSave}
              style={{ padding: '15px 40px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '18px', fontWeight: 600, cursor: 'pointer' }}>
              {isEditMode ? '수정하기' : '저장하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

