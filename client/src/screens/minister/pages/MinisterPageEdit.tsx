import React, { useState, useCallback, useEffect } from 'react';
import './MinisterPageEdit.scss';
import { useDropzone } from 'react-dropzone';
import imageCompression from "browser-image-compression";
import axios from 'axios';
import MainURL from "../../../MainURL";
import { useNavigate, useLocation } from 'react-router-dom';
import { religiousbodyList } from '../../../DefaultData';
import youtubePlay from '../../../images/Youtube_logo.png';

// Minister data type from detail page
type MinisterItem = {
  id: string;
  isView: string;
  userAccount: string;
  sort: string;
  name: string;
  subNameSort: string;
  mainImage: string;
  personInfo: {
    religiousbody: string;
    church: string;
    dutyTitle: string;
    sort: string;
    ministryFields: string[];
  }
  profile: string;
  images: string;
  youtube: {
    thumbnail: string;
    link: string;
  }[];
  contact: {
    email: string;
    phone: string;
  }
  date: string;
};

export default function MinisterPageEdit() {
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 단계 관리
  const [currentStep, setCurrentStep] = useState(1); // 1: 메인사진, 2: 기본정보, 3: 프로필, 4: 갤러리, 5: 유튜브, 6: 연락처

  // URL에서 ID 가져오기
  const url = new URL(window.location.href);
  const ID = url.searchParams.get("id");

  // 기본 정보 상태 관리
  const [sort, setSort] = useState('');
  const [name, setName] = useState('');
  const [subNameSort, setSubNameSort] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [personInfo, setPersonInfo] = useState<any>({
    religiousbody: '',
    church: '',
    dutyTitle: '',
    sort: '',
    subName: '',
    ministryFields: [],
  });
  const [profile, setProfile] = useState<any>([]);
  const [images, setImages] = useState<string[]>([]);
  const [youtube, setYoutube] = useState<any>([]);
  const [contact, setContact] = useState<any>({email: "", phone: ""});
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [galleryImageFile, setGalleryImageFile] = useState<File | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [galleryDropIndex, setGalleryDropIndex] = useState<number | null>(null);
  const [youtubeThumbFiles, setYoutubeThumbFiles] = useState<{[index: number]: File}>({});
 

  const navigationState = location.state as any;
  const isEditMode = navigationState?.editMode || !!ID;

  // 게시글 가져오기
  const fetchPosts = async () => {
    if (!ID) return;
    
    try {
      const resMinister = await axios.post(`${MainURL}/minister/getdataministerspart`, {
        id : ID
      })
      const data = resMinister?.data;
      if (Array.isArray(data) && data.length > 0) {
        const row = data[0];
        const mapped: MinisterItem = {
          id: String(row?.id ?? row?._id ?? ''),
          isView: String(row?.isView ?? row?.title ?? ''),
          userAccount: String(row?.userAccount ?? ''),
          sort: String(row?.sort ?? ''),
          name: String(row?.name ?? ''),
          subNameSort: String(row?.subNameSort ?? ''),
          mainImage: String(row?.mainImage ?? ''),
          personInfo: JSON.parse(row?.personInfo ?? '{}'),
          profile: String(row?.profile ?? row?.profileImage ?? ''),
          images: String(row?.images ?? row?.imageUrl ?? ''),
          youtube: JSON.parse(row?.youtube ?? '[]'),
          contact: JSON.parse(row?.contact ?? '{"email": "", "phone": ""}'),
          date: String(row?.date ?? row?.createdAt ?? ''),
        }
        
        try {
          const profile = JSON.parse(mapped.profile || '[]');
          const youtube = mapped.youtube || [];
          // new shape support: if mapped.youtube is an object, normalize to array
          const normalizedYoutube = Array.isArray(youtube) ? youtube : (youtube && typeof youtube === 'object' ? [youtube] : []);
          const contact = mapped.contact;
          const imageUrls = JSON.parse(mapped.images || '[]');
          
          // personInfo가 이미 JSON으로 파싱된 상태이므로 직접 사용
          const personInfoData = mapped.personInfo || {};
          setSort(mapped.sort);
          setName(mapped.name);
          setSubNameSort(mapped.subNameSort);
          setMainImage(mapped.mainImage);
          setImages(Array.isArray(imageUrls) ? imageUrls : []);
          setPersonInfo({
            name: mapped.name || '',
            dutyTitle: personInfoData.dutyTitle || '',
            sort: personInfoData.sort || '',
            religiousbody: personInfoData.religiousbody || '',
            church: personInfoData.church || '',
            ministryFields: Array.isArray(personInfoData.ministryFields) ? personInfoData.ministryFields : []
          });
          setProfile(Array.isArray(profile) ? profile : []);
          setYoutube(normalizedYoutube);
          setContact(typeof contact === 'object' && contact !== null ? contact : {email: "", phone: ""});

        } catch (error) {
          console.error('JSON parsing error:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching minister data:', error);
    }
  };

  useEffect(() => {
    document.title = isEditMode ? 'Minister Page Editor - Edit Mode' : 'Minister Page Editor';
    if (ID) {
      fetchPosts();
    }
  }, [isEditMode, ID]);


  // 이미지 업로드 함수
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1000
      };
      const resizedFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          setImageLoading(true);
          const resizingBlob = await imageCompression(file, options);
          setImageLoading(false);
          return resizingBlob;
        })
      );
      const copy = new File(resizedFiles, acceptedFiles[0].name, { type: acceptedFiles[0].type });
      setMainImageFile(copy);
    } catch (error) {
      console.error('이미지 리사이징 중 오류 발생:', error);
    }
  }, []);



  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  // 단계별 렌더링
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderMainImage();
      case 2:
        return renderBasicInfo();
      case 3:
        return renderProfile();
      case 4:
        return renderGallery();
      case 5:
        return renderYouTube();
      case 6:
        return renderContact();
      default:
        return renderMainImage();
    }
  };

  // 탭 클릭 핸들러
  const handleTabClick = (step: number) => {
    setCurrentStep(step);
  };

  // 메인사진 ---------------------------------------------------------------------------------------------------------
  // 메인사진 렌더링
  const renderMainImage = () => (
    <div className="edit-content">
      
      <div className="input-group">
        <label>메인 배경 이미지</label>
        <div className="image-upload-area">
          {/* 새로 업로드한 이미지가 있으면 우선 표시, 없으면 기존 이미지 표시 */}
          {mainImageFile ? (
            <>
              <div className="image-preview">
                <img 
                  src={URL.createObjectURL(mainImageFile)} 
                  alt="새로 업로드한 메인 이미지" 
                />
              </div>
              <div className="image-action-buttons">
                <button 
                  className="save-btn" 
                  onClick={() => {
                    // 메인 이미지 저장 로직
                    saveMainImage();
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#333',
                    border: '1px solid #ddd'
                  }}
                >
                  저장
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => {
                    if (window.confirm('메인 이미지를 삭제하시겠습니까? 삭제후에는 되돌릴수 없습니다.')) {
                      setMainImageFile(null);
                      deleteMainImage();
                    }
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#ff4757',
                    border: '1px solid #ff4757',
                    boxShadow: 'none'
                  }}
                >
                  ✕ 삭제
                </button>
              </div>
            </>
          ) : mainImage && mainImage.length > 0 ? (
            <>
              <div className="image-preview">
                <img 
                  src={`${MainURL}/images/minister/mainimage/${mainImage}`} 
                  alt="기존 메인 이미지" 
                />
              </div>
              <div className="image-action-buttons">
                <button 
                  className="save-btn" 
                  onClick={() => {
                    // 기존 이미지는 이미 저장되어 있으므로 알림만 표시
                    alert('이미지가 이미 저장되어 있습니다.');
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#333',
                    border: '1px solid #ddd'
                  }}
                >
                  저장됨
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => {
                    if (window.confirm('메인 이미지를 삭제하시겠습니까? 삭제후에는 되돌릴수 없습니다.')) {
                      deleteMainImage();
                    }
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#ff4757',
                    border: '1px solid #ff4757',
                    boxShadow: 'none'
                  }}
                >
                  ✕ 삭제
                </button>
              </div>
            </>
          ) : (
            <div {...getRootProps()} className="dropzone">
              <input {...getInputProps()} />
              <div className="upload-icon">+</div>
              <p>이미지가 없습니다. 이미지를 업로드해주세요.</p>
              <p className="upload-hint">메인 배경 이미지를 드래그하거나 클릭하여 업로드</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const saveMainImage = async () => {
    try {
      if (!mainImageFile) {
        alert('저장할 이미지가 없습니다.');
        return;
      }

      if (!ID) {
        alert('게시글 ID가 없습니다.');
        return;
      }

      const formData = new FormData();
      formData.append('img', mainImageFile);
      formData.append('postId', ID);

      const response = await axios.post(`${MainURL}/ministeredit/savemainimage`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.success) {
        alert('메인 이미지가 저장되었습니다.');
        // 저장 후 이미지 파일명을 mainImage 상태에 설정
        setMainImage(response.data.fileName);
        // 메인 이미지 파일 초기화 (저장 완료 후)
        setMainImageFile(null);
      } else {
        alert(response.data?.message || '이미지 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('메인 이미지 저장 실패:', error);
      alert('이미지 저장에 실패했습니다.');
    }
  };


  const deleteMainImage = async () => {
    try {
      const response = await axios.post(`${MainURL}/ministeredit/postsdeletemainimage`, {
        postId: ID,
        mainImage: mainImage // 단일 이미지 파일명
      });
      
      if (response.data) {
        alert('메인 이미지가 삭제되었습니다.');
        setMainImage(''); // 로컬 상태도 초기화
      }
    } catch (error) {
      console.error('메인 이미지 삭제 실패:', error);
      alert('이미지 삭제에 실패했습니다.');
    }
  };

  // 기본 정보  ---------------------------------------------------------------------------------------------------------

  const subNameOptions = [
    { value: '직분', label: '직분' },
    { value: '구분', label: '구분' },
  ];
  // 구분 선택
  const sortOptions = [
    { value: '설교자', label: '설교자' },
    { value: '찬양사역자', label: '찬양사역자' },
    { value: '작가', label: '작가' },
    { value: '상담사', label: '상담사' },
    { value: '유투버', label: '유투버' },
    { value: '기타', label: '기타' }
  ];

   // 직분 선택
   const dutyTitleOptions = [
    { value: '목사', label: '목사' },
    { value: '전도사', label: '전도사' },
    { value: '장로', label: '장로' },
    { value: '집사', label: '집사' },
    { value: '권사', label: '권사' },
    { value: '없음', label: '없음' }
  ];

   // 교단 선택
   const religiousbodyOptions = [
     { value: '', label: '교단을 선택해주세요' },
     ...religiousbodyList.map(item => ({ value: item, label: item }))
   ];

  // 기본 정보 렌더링
  const renderBasicInfo = () => (
    <div className="edit-content">
      <div className="input-group">
        <label>이름 *</label>
        <input 
          type="text" 
          value={personInfo.name} 
          onChange={(e) => {
            setName(e.target.value);
            setPersonInfo({...personInfo, name: e.target.value});
          }}
          placeholder="이름을 입력해주세요"
        />
      </div>

      <div className="input-group">
        <label>서브 이름 기준 선택 (직분/구분 중 택1)</label>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {subNameOptions.map((option) => (
            <label key={option.value} style={{width: '20%', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #eee', padding: '6px 10px', borderRadius: 6 }}>
              <input
                type="checkbox"
                checked={subNameSort === option.value}
                style={{
                  width: '16px',
                  height: '16px',
                }}
                onChange={(e) => {
                  if (e.target.checked) {
                    const nextMode = option.value;
                    setSubNameSort(nextMode);
                    
                  } else {
                    setSubNameSort('');
                    setPersonInfo({ ...personInfo, subName: '' });
                  }
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="input-group">
        <label>직분 *</label>
        <select value={personInfo.dutyTitle} onChange={(e) => {
          const value = e.target.value;
          const nextDuty = value === '없음' ? '' : value;
          // subNameMode가 '직분'일 때만 subName 갱신
          setPersonInfo({
            ...personInfo,
            dutyTitle: nextDuty
          });
        }}>
          <option value="">직분을 선택해주세요</option>
          {dutyTitleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label>구분 *</label>
        <select value={personInfo.sort} onChange={(e) => {
            const value = e.target.value;
            // subNameMode가 '구분'일 때만 subName 갱신
            setSort(value);
            setPersonInfo({
              ...personInfo,
              sort: value,
            });
          }}>
          <option value="">직함을 선택해주세요</option>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label>교단 *</label>
        <select value={personInfo.religiousbody} onChange={(e) => {
         setPersonInfo({...personInfo, religiousbody: e.target.value});
        }}>
          {religiousbodyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label>교회 *</label>
        <input 
          type="text" 
          value={personInfo.church} 
          onChange={(e) => setPersonInfo({...personInfo, church: e.target.value})}
          placeholder="교회명을 입력해주세요"
        />
      </div>

      <div className="input-group">
        <label>담당 사역</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Array.isArray(personInfo.ministryFields) ? personInfo.ministryFields.map((field: string, index: number) => (
            <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input 
          type="text" 
                value={field}
                onChange={(e) => {
                  const newFields = [...personInfo.ministryFields];
                  newFields[index] = e.target.value;
                  setPersonInfo({...personInfo, ministryFields: newFields});
                }}
          placeholder="담당 사역을 입력해주세요"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => {
                  const newFields = personInfo.ministryFields.filter((_: string, i: number) => i !== index);
                  setPersonInfo({...personInfo, ministryFields: newFields});
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  color: '#ff4757',
                  border: '1px solid #ff4757',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                삭제
              </button>
      </div>
          )) : null}
          <button
            type="button"
            onClick={() => {
              const currentFields = Array.isArray(personInfo.ministryFields) ? personInfo.ministryFields : [];
              setPersonInfo({...personInfo, ministryFields: [...currentFields, '']});
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              alignSelf: 'flex-start'
            }}
          >
            + 사역 추가
          </button>
        </div>
      </div>

      <div className="input-group">
        <button 
          onClick={saveBasicInfo}
          style={{
            width: 'auto',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          저장
        </button>
      </div>
    </div>
  );


  // 기본정보 저장 함수
  const saveBasicInfo = async () => {

    try {
      // 필수 필드 검증
      if (!personInfo.name || !personInfo.name.trim()) {
        alert('이름을 입력해주세요.');
        return;
      }
      if (!personInfo.sort) {
        alert('구분을 선택해주세요.');
        return;
      }
      if (!personInfo.religiousbody) {
        alert('교단을 선택해주세요.');
        return;
      }
      if (!personInfo.church.trim()) {
        alert('교회명을 입력해주세요.');
        return;
      }
      const basicInfoData = {
        postId: ID,
        sort: sort.trim(),
        name: name.trim(),
        subNameSort: subNameSort.trim(),
        personInfo: JSON.stringify(personInfo),
      };

      const response = await axios.post(`${MainURL}/ministeredit/savebasicinfo`, basicInfoData);

      if (response.data) {
        alert('기본정보가 저장되었습니다.');
      } else {
        alert('기본정보 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('기본정보 저장 실패:', error);
      alert('기본정보 저장에 실패했습니다.');
    }
  };

  // 프로필  ---------------------------------------------------------------------------------------------------------

  // 프로필 렌더링
  const renderProfile = () => (
    <div className="edit-content">
      
      <div className="input-group">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(Array.isArray(profile) ? profile : []).map((item: any, index: number) => (
            <div key={index} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={item.year || ''}
                  onChange={(e) => {
                    const copy = Array.isArray(profile) ? [...profile] : [];
                    const target = { ...(copy[index] || {}) };
                    target.year = e.target.value;
                    // 내용 배열 보존
                    target.content = Array.isArray(target.content) ? target.content : [];
                    copy[index] = target;
                    setProfile(copy);
                  }}
                  placeholder="연도 (예: 2006, 현재)"
                  style={{ width: '160px' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (index === 0) return;
                    const copy = Array.isArray(profile) ? [...profile] : [];
                    const temp = copy[index - 1];
                    copy[index - 1] = copy[index];
                    copy[index] = temp;
                    setProfile(copy);
                  }}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: 'transparent',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                    opacity: index === 0 ? 0.5 : 1
                  }}
                  disabled={index === 0}
                >
                  ▲ 위로
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const copy = Array.isArray(profile) ? [...profile] : [];
                    if (index >= copy.length - 1) return;
                    const temp = copy[index + 1];
                    copy[index + 1] = copy[index];
                    copy[index] = temp;
                    setProfile(copy);
                  }}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: 'transparent',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: (Array.isArray(profile) && index >= (profile.length - 1)) ? 'not-allowed' : 'pointer',
                    opacity: (Array.isArray(profile) && index >= (profile.length - 1)) ? 0.5 : 1
                  }}
                  disabled={Array.isArray(profile) ? index >= (profile.length - 1) : true}
                >
                  ▼ 아래로
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const copy = (Array.isArray(profile) ? profile : []).filter((_: any, i: number) => i !== index);
                    setProfile(copy);
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    color: '#ff4757',
                    border: '1px solid #ff4757',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  연도 삭제
                </button>
            </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(Array.isArray(item.content) ? item.content : []).map((text: string, subindex: number) => (
                  <div key={subindex} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => {
                        const copy = Array.isArray(profile) ? [...profile] : [];
                        const target = { ...(copy[index] || {}) } as any;
                        const contents = Array.isArray(target.content) ? [...target.content] : [];
                        contents[subindex] = e.target.value;
                        target.content = contents;
                        copy[index] = target;
                        setProfile(copy);
                      }}
                      placeholder="내용을 입력하세요"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (subindex === 0) return;
                        const copy = Array.isArray(profile) ? [...profile] : [];
                        const target = { ...(copy[index] || {}) } as any;
                        const contents = Array.isArray(target.content) ? [...target.content] : [];
                        const temp = contents[subindex - 1];
                        contents[subindex - 1] = contents[subindex];
                        contents[subindex] = temp;
                        target.content = contents;
                        copy[index] = target;
                        setProfile(copy);
                      }}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: 'transparent',
                        color: '#333',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: subindex === 0 ? 'not-allowed' : 'pointer',
                        opacity: subindex === 0 ? 0.5 : 1
                      }}
                      disabled={subindex === 0}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const copy = Array.isArray(profile) ? [...profile] : [];
                        const target = { ...(copy[index] || {}) } as any;
                        const contents = Array.isArray(target.content) ? [...target.content] : [];
                        if (subindex >= contents.length - 1) return;
                        const temp = contents[subindex + 1];
                        contents[subindex + 1] = contents[subindex];
                        contents[subindex] = temp;
                        target.content = contents;
                        copy[index] = target;
                        setProfile(copy);
                      }}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: 'transparent',
                        color: '#333',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: (Array.isArray(item.content) && subindex >= (item.content.length - 1)) ? 'not-allowed' : 'pointer',
                        opacity: (Array.isArray(item.content) && subindex >= (item.content.length - 1)) ? 0.5 : 1
                      }}
                      disabled={Array.isArray(item.content) ? subindex >= (item.content.length - 1) : true}
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const copy = Array.isArray(profile) ? [...profile] : [];
                        const target = { ...(copy[index] || {}) } as any;
                        const contents = Array.isArray(target.content) ? target.content.filter((_: any, i: number) => i !== subindex) : [];
                        target.content = contents;
                        copy[index] = target;
                        setProfile(copy);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'transparent',
                        color: '#ff4757',
                        border: '1px solid #ff4757',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
            </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const copy = Array.isArray(profile) ? [...profile] : [];
                    const target = { ...(copy[index] || {}) } as any;
                    const contents = Array.isArray(target.content) ? [...target.content] : [];
                    contents.push('');
                    target.content = contents;
                    target.year = target.year || '';
                    copy[index] = target;
                    setProfile(copy);
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    color: '#007bff',
                    border: '1px solid #007bff',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                    alignSelf: 'flex-start',
                    cursor: 'pointer'
                  }}
                >
                  + 내용 추가
                </button>
        </div>
      </div>
          ))}

          <button
            type="button"
            onClick={() => {
              const copy = Array.isArray(profile) ? [...profile] : [];
              copy.push({ year: '', content: [''] });
              setProfile(copy);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 500,
              alignSelf: 'flex-start',
              cursor: 'pointer'
            }}
          >
            + 연도 추가
          </button>
        </div>
      </div>
      
      <div className="input-group">
        <button 
          onClick={saveProfile}
          style={{
            width: 'auto',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          저장
        </button>
      </div>
    </div>
  );


  // 프로필 저장 함수
  const saveProfile = async () => {
    try {
      const response = await axios.post(`${MainURL}/ministeredit/saveprofile`, {
        postId: ID,
        profile: JSON.stringify(profile)
      });
      if (response.data) {
        alert('프로필이 저장되었습니다.');
      } else {
        alert('프로필 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      alert('프로필 저장에 실패했습니다.');
    }
  };
   
  // 갤러리  ---------------------------------------------------------------------------------------------------------

  // 갤러리 렌더링
  const renderGallery = () => (
    <div className="edit-content">
      <div className="input-group">
        <div className="image-upload-area">
          {/* 프리뷰 리스트 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.isArray(images) && images.length > 0 ? (
              images.map((src, idx) => (
                <div key={idx} className="image-preview" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 200, height: 200, border: '1px dashed #e0e0e0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {src ? (
                      <img 
                        src={/^https?:\/\//.test(src) || src.startsWith('blob:') || src.startsWith('data:') ? src : `${MainURL}/images/minister/gallery/${src}`} 
                        alt={`gallery-${idx}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e: any) => { e.currentTarget.style.opacity = 0.3; }}
                      />
                    ) : (
                      <div {...getRootPropsGallery({ onClick: () => setGalleryDropIndex(idx) })} className="dropzone" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                        <input {...getInputPropsGallery()} />
                        <div className="upload-icon">+</div>
                        <p>클릭하여 이미지 추가</p>
                      </div>
                    )}
                  </div>

                  {/* Right-side horizontal button group */}
                  <div className="image-action-buttons" style={{ flexWrap: 'nowrap' }}>
                    <button 
                      type="button"
                      onClick={() => {
                        if (idx === 0) return;
                        const copy = [...images];
                        const temp = copy[idx - 1];
                        copy[idx - 1] = copy[idx];
                        copy[idx] = temp;
                        setImages(copy);
                      }}
                      className="save-btn"
                      disabled={idx === 0}
                    >
                      ▲ 위로
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const copy = [...images];
                        if (idx >= copy.length - 1) return;
                        const temp = copy[idx + 1];
                        copy[idx + 1] = copy[idx];
                        copy[idx] = temp;
                        setImages(copy);
                      }}
                      className="save-btn"
                      disabled={idx >= images.length - 1}
                    >
                      ▼ 아래로
                    </button>
                    <button 
                      className="delete-btn" 
                      onClick={async () => {
                        if (window.confirm('갤러리 이미지를 삭제하시겠습니까? 삭제후에는 되돌릴수 없습니다.')) {
                          try {
                            if (!ID) {
                              alert('게시글 ID가 없습니다.');
                              return;
                            }
                            const res = await axios.post(`${MainURL}/ministeredit/deletegallery`, {
                              postId: ID,
                              index: idx
                            });
                            if (res.data && res.data.success) {
                              setImages(res.data.images);
                            } else {
                              // 로컬만 제거 (fallback)
                              const copy = [...images];
                              copy.splice(idx, 1);
                              setImages(copy);
                            }
                          } catch (e) {
                            console.error('이미지 삭제 실패:', e);
                            // 로컬만 제거 (fallback)
                            const copy = [...images];
                            copy.splice(idx, 1);
                            setImages(copy);
                          }
                        }
                      }}
                      style={{ background: 'transparent', color: '#ff4757', border: '1px solid #ff4757', boxShadow: 'none' }}
                      >
                      ✕ 삭제
                    </button>
                  </div>
                </div>
              ))
            ) : (
              // 비어있을 때도 메인사진 영역과 유사한 placeholder 유지
              <div {...getRootPropsGallery({ onClick: () => setGalleryDropIndex(0) })} className="dropzone" style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input {...getInputPropsGallery()} />
                <div className="upload-icon">+</div>
                <p>이미지를 추가하려면 클릭</p>
              </div>
            )}
          </div>

          {/* URL 추가 입력 제거됨 */}
        </div>
      </div>

      <div className="input-group">
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={saveGallery}
            style={{
              width: 'auto',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            저장
          </button>
          <button
            type="button"
            onClick={() => {
              const nextIndex = Array.isArray(images) ? images.length : 0;
              setImages((prev) => ([...(Array.isArray(prev) ? prev : []), '']));
              setGalleryDropIndex(nextIndex);
              try { openGalleryPicker(); } catch (_) {}
            }}
            style={{
              width: 'auto',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            + 추가
          </button>
        </div>
      </div>
    </div>
  );


  const onDropGallery = useCallback(async (acceptedFiles: File[]) => {
    try {
      if (!acceptedFiles || acceptedFiles.length === 0) return;
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1000
      };
      const resizedFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          setImageLoading(true);
          const resizingBlob = await imageCompression(file, options);
          setImageLoading(false);
          return resizingBlob;
        })
      );
      const copyFile = new File(resizedFiles, acceptedFiles[0].name, { type: acceptedFiles[0].type });

      // 갤러리 전용 파일로 보관 (즉시 저장 흐름)
      setGalleryImageFile(copyFile);

      // 즉시 미리보기를 위해 object URL 사용
      const objectUrl = URL.createObjectURL(copyFile);
      setImages((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        if (galleryDropIndex === null || galleryDropIndex === undefined) {
          next.push(objectUrl);
        } else {
          while (next.length <= galleryDropIndex) {
            next.push('');
          }
          next[galleryDropIndex] = objectUrl;
        }
        return next;
      });
      // NOTE: 유지하여 저장 시 서버에 같은 index로 반영되도록 함
    } catch (error) {
      console.error('갤러리 이미지 처리 중 오류 발생:', error);
    }
  }, [galleryDropIndex]);

  const { getRootProps: getRootPropsGallery, getInputProps: getInputPropsGallery } = useDropzone({ onDrop: onDropGallery });
  // NOTE: Recreate to expose open for programmatic file dialog (safe alongside existing refs)
  const { open: openGalleryPicker } = useDropzone({ onDrop: onDropGallery, noClick: true, noKeyboard: true });


  // 갤러리 저장 함수
  const saveGallery = async () => {
    try {
      if (!ID) {
        alert('게시글 ID가 없습니다.');
        return;
      }

      // 1) 새 파일이 있으면 업로드 플로우
      if (galleryImageFile) {
        const formData = new FormData();
        formData.append('img', galleryImageFile);
        formData.append('postId', ID);
        if (galleryDropIndex !== null && galleryDropIndex !== undefined) {
          formData.append('index', String(galleryDropIndex));
        }

        const response = await axios.post(`${MainURL}/ministeredit/savegallery`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data && response.data.success) {
          alert('갤러리 이미지가 저장되었습니다.');
          const { fileName, index } = response.data;
          setImages((prev) => {
            const next = Array.isArray(prev) ? [...prev] : [];
            const idx = (index !== undefined && index !== null) ? Number(index) : (galleryDropIndex ?? next.length);
            while (next.length <= idx) next.push('');
            next[idx] = fileName;
            return next;
          });
          setGalleryImageFile(null);
          setGalleryDropIndex(null);
        } else {
          alert(response.data?.message || '이미지 저장에 실패했습니다.');
        }
        return;
      }

      // 2) 새 파일이 없으면 순서 저장 플로우
      // object URL 등 임시값 제거하고 서버 파일명만 보냄
      const cleaned = (Array.isArray(images) ? images : [])
        .filter(Boolean)
        .map((src) => (src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('http')) ? '' : src)
        .filter(Boolean);

      const orderRes = await axios.post(`${MainURL}/ministeredit/savegalleryorder`, {
        postId: ID,
        images: JSON.stringify(cleaned)
      });

      if (orderRes.data && orderRes.data.success) {
        alert('갤러리 순서가 저장되었습니다.');
      } else {
        alert('갤러리 순서 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('갤러리 이미지 저장 실패:', error);
      alert('이미지 저장에 실패했습니다.');
    }
  };

  // 유튜브  ---------------------------------------------------------------------------------------------------------

 
  // 유튜브 렌더링
  const renderYouTube = () => (
    <div className="edit-content">
      
      <div className="input-group">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(Array.isArray(youtube) ? youtube : []).map((item: any, index: number) => (
            <div key={index} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '16px', minHeight: 160 }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: 160, height: 120, border: '1px dashed #e0e0e0', borderRadius: 6, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item?.thumbnail ? (
                    <img
                      src={/^https?:\/\//.test(item.thumbnail) || item.thumbnail.startsWith('blob:') || item.thumbnail.startsWith('data:') ? item.thumbnail : `${MainURL}/images/minister/thumbnail/${item.thumbnail}`}
                      alt="yt-thumb"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: 12, color: '#999' }}>No Thumbnail</span>
                  )}
                </div>

                {/* Right side: link input on top, buttons row below */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <input
                    type="text"
                    value={item?.link || ''}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      const copy = Array.isArray(youtube) ? [...youtube] : [];
                      const target = { ...(copy[index] || {}) } as any;
                      target.link = value;
                      copy[index] = target;
                      setYoutube(copy);
                    }}
                    placeholder="YouTube 링크"
                  />              
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!(item && item.thumbnail) && (
                      <button
                        className="save-btn"
                        type="button"
                        onClick={() => { selectAndSaveYoutubeThumbnail(index); }}
                        style={{
                          width: 'auto', padding: '8px 16px', backgroundColor: 'transparent', color: '#333',
                          border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', fontWeight: '500',
                          cursor: 'pointer', transition: 'all 0.3s ease'
                        }}
                      >
                        썸네일 첨부
                      </button>
                    )}
                    {(item && item.thumbnail) && (
                      <button
                        className="save-btn"
                        type="button"
                        onClick={() => deleteYoutubeThumbnail(index)}
                        style={{
                          width: 'auto', padding: '8px 16px', backgroundColor: 'transparent', color: '#333',
                          border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', fontWeight: '500',
                          cursor: 'pointer', transition: 'all 0.3s ease'
                        }}
                      >
                        썸네일 삭제
                      </button>
                    )}
                    <button
                      className="save-btn"
                      onClick={() => {
                        if (index === 0) return;
                        const copy = Array.isArray(youtube) ? [...youtube] : [];
                        const tmp = copy[index - 1];
                        copy[index - 1] = copy[index];
                        copy[index] = tmp;
                        setYoutube(copy);
                      }}
                      disabled={index === 0}
                      style={{
                        width: 'auto', padding: '8px 16px', backgroundColor: 'transparent', color: '#333',
                        border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', fontWeight: '500',
                        cursor: index === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', opacity: index === 0 ? 0.5 : 1
                      }}
                    >
                      ▲ 위로
                    </button>
                    <button
                      className="save-btn"
                      onClick={() => {
                        const copy = Array.isArray(youtube) ? [...youtube] : [];
                        if (index >= copy.length - 1) return;
                        const tmp = copy[index + 1];
                        copy[index + 1] = copy[index];
                        copy[index] = tmp;
                        setYoutube(copy);
                      }}
                      disabled={!(Array.isArray(youtube) && index < youtube.length - 1)}
                      style={{
                        width: 'auto', padding: '8px 16px', backgroundColor: 'transparent', color: '#333',
                        border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', fontWeight: '500',
                        cursor: (Array.isArray(youtube) && index < youtube.length - 1) ? 'pointer' : 'not-allowed', transition: 'all 0.3s ease',
                        opacity: (Array.isArray(youtube) && index < youtube.length - 1) ? 1 : 0.5
                      }}
                    >
                      ▼ 아래로
                    </button>
                    <button
                      className="save-btn"
                      onClick={async () => {
                        await deleteYoutubeThumbnail(index);
                      }}
                      style={{
                        width: 'auto', padding: '8px 16px', backgroundColor: 'transparent', color: '#333',
                        border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', fontWeight: '500',
                        cursor: 'pointer', transition: 'all 0.3s ease'
                      }}
                    >
                      ✕ 삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="image-action-buttons">
            <button
              className="save-btn"
              type="button"
              onClick={() => {
                setYoutube([...(Array.isArray(youtube) ? youtube : []), { link: '', thumbnail: '' }]);
              }}
              style={{
                width: 'auto',
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              + 추가
            </button>
          </div>
        </div>
      </div>

      <div className="input-group">
        <button 
          onClick={async () => {
            await saveYoutube();
          }}
          style={{
            width: 'auto',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          저장
        </button>
      </div>
    </div>
  );


  // 유튜브 썸네일 전용 업로드/저장 함수
  const selectAndSaveYoutubeThumbnail = async (index: number) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = (input.files && input.files[0]) as File | undefined;
        if (!file) return;

        // 갤러리와 동일한 리사이징 옵션 적용
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1000 } as const;
        let compressed: Blob = file;
        try {
          setImageLoading(true);
          compressed = await imageCompression(file, options);
        } catch (err) {
          console.error('썸네일 리사이징 실패, 원본 사용:', err);
        } finally {
          setImageLoading(false);
        }
        const copyFile = new File([compressed], file.name, { type: file.type });

        // 즉시 미리보기 반영
        const objectUrl = URL.createObjectURL(copyFile);
        setYoutube((prev: any[]) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          const t = { ...(next[index] || {}) };
          t.thumbnail = objectUrl;
          next[index] = t;
          return next;
        });
        // 저장시 업로드하도록 대기열에 보관
        setYoutubeThumbFiles((prev) => ({ ...prev, [index]: copyFile }));
      };
      input.click();
    } catch (err) {
      console.error('썸네일 선택 실패:', err);
      alert('썸네일 선택 실패');
    }
  };

  const deleteYoutubeThumbnail = async (index: number) => {
    if (window.confirm('유튜브 항목을 삭제하시겠습니까? 삭제후에는 되돌릴수 없습니다.')) {
      try {
        if (!ID) {
          alert('게시글 ID가 없습니다.');
          return;
        }
        
        const res = await axios.post(`${MainURL}/ministeredit/deleteyoutubethumb`, {
          postId: ID,
          index: index
        });
        
        if (res.data && res.data.success) {
          setYoutube(res.data.youtube);
          // 대기열에서도 제거
          setYoutubeThumbFiles((prev) => {
            const copy: any = { ...prev };
            delete copy[index];
            return copy;
          });
        } else {
          // 서버 삭제 실패 시 로컬만 제거 (fallback)
          const copy = (Array.isArray(youtube) ? youtube : []).filter((_: any, i: number) => i !== index);
          setYoutube(copy);
        }
      } catch (e) {
        console.error('유튜브 항목 삭제 실패:', e);
        // 서버 삭제 실패 시 로컬만 제거 (fallback)
        const copy = (Array.isArray(youtube) ? youtube : []).filter((_: any, i: number) => i !== index);
        setYoutube(copy);
      }
    }
  };

  const saveYoutube = async () => {
    try {
      // 1) 썸네일 파일들 업로드 (있는 index만)
      if (!ID) {
        alert('게시글 ID가 없습니다.');
        return;
      }
      const updated = Array.isArray(youtube) ? [...youtube] : [];
      for (const key of Object.keys(youtubeThumbFiles)) {
        const idx = Number(key);
        const file = youtubeThumbFiles[idx];
        if (!file) continue;
        const formData = new FormData();
        formData.append('img', file);
        formData.append('postId', ID);
        formData.append('index', String(idx));
        const res = await axios.post(`${MainURL}/ministeredit/saveyoutubethumb`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data && res.data.success) {
          const { fileName } = res.data;
          const t = { ...(updated[idx] || {}) } as any;
          t.thumbnail = fileName;
          updated[idx] = t;
        } else {
          alert('일부 썸네일 저장에 실패했습니다.');
        }
      }

      // 2) 유튜브 JSON 저장 (link/thumbnail 함께)
      const response = await axios.post(`${MainURL}/ministeredit/saveyoutube`, null, {
        params: {
          postId: ID,
          youtube: JSON.stringify(updated.map((it: any) => ({ link: it.link || '', thumbnail: it.thumbnail || '' })))
        }
      });
      if (response.data) {
        setYoutube(updated);
        // 대기열 비우기
        setYoutubeThumbFiles({});
        alert('유튜브 정보가 저장되었습니다.');
      } else {
        alert('유튜브 정보 저장에 실패했습니다.');
      }
    } catch (e) {
      console.error('유튜브 저장 실패:', e);
      alert('유튜브 정보 저장에 실패했습니다.');
    }
  }

  // 연락처  ---------------------------------------------------------------------------------------------------------

  // 연락처 렌더링
  const renderContact = () => (
    <div className="edit-content">
      <h4>연락처 정보</h4>
      
      <div className="input-group">
        <label>이메일</label>
        <input 
          type="email" 
          value={contact.email} 
          onChange={(e) => setContact({...contact, email: e.target.value})}
          placeholder="이메일 주소를 입력해주세요"
        />
      </div>

      <div className="input-group">
        <label>전화번호</label>
        <input 
          type="tel" 
          value={contact.phone} 
          onChange={(e) => setContact({...contact, phone: e.target.value})}
          placeholder="전화번호를 입력해주세요"
        />
      </div>

      <div className="input-group">
        <button 
          onClick={saveContact}
          style={{
            width: 'auto',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          저장
        </button>
      </div>
    </div>
  );

  // 연락처 저장 함수
  const saveContact = async () => {
    try {
      const contactData = {
        postId: ID,
        contact: JSON.stringify(contact)
      };

      const response = await axios.post(`${MainURL}/ministeredit/savecontact`, contactData);

      if (response.data && response.data.success) {
        alert('연락처가 저장되었습니다.');
      } else {
        alert(response.data?.message || '연락처 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('연락처 저장 실패:', error);
      alert('연락처 저장에 실패했습니다.');
    }
  };




  return (
    <div className="ministerEditBox">
      <div className="ministerEdit-container">
        {/* 왼쪽: 미리보기 */}
        <div className="preview-section">
          <div className="preview-header">
            <h3>미리보기</h3>
          </div>
          <div className="preview-content">
            <div className="ministerDetail">
              <div className="inner">
                <div className="subpage__main" style={{ width: '100%' }}>
                  {/* HEADER / HERO */}
                  <div className="homapage_main">
                    <div className="homapage_main_imagebox">
                      {mainImage && mainImage.length > 0 ? (
                        <img 
                          src={`${MainURL}/images/minister/mainimage/${mainImage}`} 
                          alt="hero" 
                        />
                      ) : (
                        <div className="no-image-placeholder">
                          <p>이미지가 없습니다</p>
                        </div>
                      )}
                      <div className="homapage_main_title">
                        <p className="homapage_main_title-name">{personInfo.name}</p>
                        <p className="homapage_main_title-sort">{subNameSort === '직분' ? personInfo.dutyTitle : personInfo.sort}</p>
                      </div>
                    </div>

                    <div className="after_hero">
                      <div className="personalpage_detail_bottomRow"></div>

                      {/* CORE INFO CARD */}
                      <div className="personalpage_detail_titlebox">
                        <p className="personalpage_detail_title">INFO</p>
                      </div>
                      <div className="profile_card">
                        <div className="profile_card_left">
                          {mainImage && mainImage.length > 0 ? (
                            <img 
                              className="profile_avatar" 
                              src={`${MainURL}/images/minister/mainimage/${mainImage}`} 
                              alt="profile" 
                            />
                          ) : (
                            <div className="profile_avatar no-image-placeholder">
                              <p>이미지가 없습니다</p>
                            </div>
                          )}
                        </div>
                        <div className="profile_card_right">
                          <div className="profile_row">
                            <span className="profile_key">이름</span>
                            <span className="profile_value">{personInfo.name} {personInfo.dutyTitle}</span>
                          </div>
                          <div className="profile_row">
                            <span className="profile_key">직분</span>
                            <span className="profile_value">{personInfo.dutyTitle}</span>
                          </div>
                          <div className="profile_row">
                            <span className="profile_key">구분</span>
                            <span className="profile_value">{personInfo.sort}</span>
                          </div>
                          <div className="profile_row">
                            <span className="profile_key">교단</span>
                            <span className="profile_value">{personInfo.religiousbody}</span>
                          </div>
                          <div className="profile_row">
                            <span className="profile_key">교회</span>
                            <span className="profile_value">{personInfo.church}</span>
                          </div>
                          <div className="profile_row">
                            <span className="profile_key">담당 사역</span>
                            <span className="profile_value">
                              {Array.isArray(personInfo.ministryFields) ? personInfo.ministryFields.join(', ') : '담당 사역을 입력하세요'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="personalpage_detail_bottomRow"></div>

                      {/* JOURNEY TIMELINE */}
                      <div className="personalpage_detail_titlebox">
                        <p className="personalpage_detail_title">PROFILE</p>
                      </div>
                      <div className="journey">
                        {Array.isArray(profile) && profile.length > 0 ? (
                          profile.map((item: any, index: any) => (
                            <div className="journey_item" key={index}>
                              <div className="journey_year">{item.year || ''}</div>
                              <div className="journey_content">
                                {Array.isArray(item.content) ? (
                                  item.content.map((content: any, subindex: any) => (
                                    <div className="journey_text_indented" key={subindex}>{content}</div>
                                  ))
                                ) : (
                                  <div className="journey_text_indented">{item.text || ''}</div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="journey_item">
                            <div className="journey_year">여정을 입력하세요</div>
                            <div className="journey_content">
                              <div className="journey_text_indented">연도|내용 형식으로 입력하세요</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="personalpage_detail_bottomRow"></div>

                      {/* IMAGE SECTION */}
                      <div className="personalpage_detail_titlebox">
                        <p className="personalpage_detail_title">GALLERY</p>
                      </div>
                      <div className="personalpage-imagebox" style={{ flexDirection: 'column', gap: 20 }}>
                        {Array.isArray(images) && images.length > 0 ? (
                          images.map((src, idx) => (
                            <img 
                              key={idx} 
                              src={/^https?:\/\//.test(src) || src.startsWith('blob:') || src.startsWith('data:') ? src : `${MainURL}/images/minister/gallery/${src}`} 
                              alt={`personal-${idx}`} 
                            />
                          ))
                        ) : (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                            이미지를 추가하세요
                          </div>
                        )}
                      </div>

                      <div className="personalpage_detail_bottomRow"></div>

                      {/* YOUTUBE VIDEOS SECTION */}
                      <div className="personalpage_detail_titlebox">
                        <p className="personalpage_detail_title">VIDEOS</p>
                      </div>
                      <div className="youtube_section">
                        {Array.isArray(youtube) && youtube.length > 0 ? (
                          youtube.map((item: any, index: any) => (
                            <div key={index} className="youtube_imagebox">
                              <img 
                                src={item.thumbnail ? (item.thumbnail.startsWith('http') ? item.thumbnail : `${MainURL}/images/minister/thumbnail/${item.thumbnail}`) : '/placeholder-video.jpg'} 
                                alt="youtube" 
                                className="youtube_image_thumbnail"
                              />
                              <div className="youtube_image_playbtn_cover">
                                <img src={youtubePlay} alt="play" className="youtube_image_playbtn_image" />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                            YouTube 비디오를 추가하세요
                          </div>
                        )}
                      </div>

                      <div className="personalpage_detail_bottomRow"></div>

                      {/* CONTACT SECTION */}
                      <div className="personalpage_detail_titlebox">
                        <p className="personalpage_detail_title">CONTACT</p>
                      </div>
                      <div className="personalpage-contactbox">
                        <div className="personalpage-contact-content">
                          <p className="personalpage-contact-part">{personInfo.dutyTitle || '직분을 입력하세요'}</p>
                          <p className="personalpage-contact-nameEn">{personInfo.name || '이름을 입력하세요'}</p>
                          <p className="personalpage-contact-phone">
                            Phone: <a href={`tel:${contact?.phone || ''}`}>{contact?.phone || '전화번호를 입력하세요'}</a>
                          </p>
                          <p className="personalpage-contact-email">
                            Email: {contact?.email || '이메일을 입력하세요'}
                          </p>
                        </div>
                      </div>

                      {/* POSTER-LIKE FOOTER */}
                      <div className="poster_footer">
                        <div className="poster_signature">{personInfo.name || '이름을 입력하세요'}</div>
                        <div className="poster_logo">{personInfo.church || 'OO교회'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 작성 부분 */}
        <div className="edit-section">
          <div className="edit-header">
            <h3>사역자 페이지 정보 입력</h3>
            <div className="step-indicator">
              <span 
                className={currentStep === 1 ? 'active' : ''} 
                onClick={() => handleTabClick(1)}
              >
                메인사진
              </span>
              <span 
                className={currentStep === 2 ? 'active' : ''} 
                onClick={() => handleTabClick(2)}
              >
                기본정보
              </span>
              <span 
                className={currentStep === 3 ? 'active' : ''} 
                onClick={() => handleTabClick(3)}
              >
                프로필
              </span>
              <span 
                className={currentStep === 4 ? 'active' : ''} 
                onClick={() => handleTabClick(4)}
              >
                갤러리
              </span>
              <span 
                className={currentStep === 5 ? 'active' : ''} 
                onClick={() => handleTabClick(5)}
              >
                유튜브
              </span>
              <span 
                className={currentStep === 6 ? 'active' : ''} 
                onClick={() => handleTabClick(6)}
              >
                연락처
              </span>
            </div>
          </div>
          
          {renderStepContent()}
        </div>
      </div>

      {/* 버튼 그룹 - 전체 화면 아래 배치 */}
      <div className="button-group">
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          뒤로가기
        </button>
      </div>
    </div>
  );
}