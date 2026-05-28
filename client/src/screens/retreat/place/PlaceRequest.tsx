import React, { useCallback, useRef, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { DaumPostcodeEmbed } from 'react-daum-postcode';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { CiCircleMinus } from 'react-icons/ci';
import MainURL from '../../../MainURL';
import { DropdownBox } from '../../../components/DropdownBox';
import { moveListItem } from '../retreatRequestImageUtils';
import './Place.scss';

const sortOptions = [
  { value: '선택', label: '선택' },
  { value: '기도원', label: '기도원' },
  { value: '교회', label: '교회' },
  { value: '펜션', label: '펜션' },
  { value: '수련원/수양관/연수원', label: '수련원/수양관/연수원' },
  { value: '리조트/호텔', label: '리조트/호텔' },
];

const regionOptions = [
  { value: '선택', label: '선택' },
  { value: '서울/경기도', label: '서울/경기도' },
  { value: '강원도', label: '강원도' },
  { value: '대전/충청도', label: '대전/충청도' },
  { value: '광주/전라도', label: '광주/전라도' },
  { value: '대구/부산/경상도', label: '대구/부산/경상도' },
  { value: '제주도', label: '제주도' },
];

const sizeOptions = [
  { value: '선택', label: '선택' },
  { value: '50명이하', label: '50명이하' },
  { value: '50~100명', label: '50~100명' },
  { value: '100명이상', label: '100명이상' },
];

const PlaceRequest = () => {
  const navigate = useNavigate();
  const [placeName, setPlaceName] = useState('');
  const [sort, setSort] = useState('선택');
  const [region, setRegion] = useState('선택');
  const [size, setSize] = useState('선택');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [homepage, setHomepage] = useState('');
  const [userContact, setUserContact] = useState('');
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const onCompletePost = (data: any) => {
    setLocation(`${data.sido} ${data.sigungu}`);
    setAddress(data.address);
  };

  const date = format(new Date(), 'yyMMddHHmmss');
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      setImageLoading(true);
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1000,
      };
      const resizedFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          const resizingBlob = await imageCompression(file, options);
          return resizingBlob;
        })
      );
      const regexCopy = /[^\w!@#$%^&*()=+{}|;:'",.<>-]/g;
      const fileCopies = resizedFiles.map((resizedFile, index) => {
        const regex = acceptedFiles[index].name.replace(regexCopy, '');
        const regexSlice = regex.slice(-15);
        return new File([resizedFile], `${date}_${regexSlice}`, {
          type: acceptedFiles[index].type,
        });
      });
      const imageNames = acceptedFiles.map((file) => {
        const regex = file.name.replace(regexCopy, '');
        const regexSlice = regex.slice(-15);
        return `${date}_${regexSlice}`;
      });
      setImageFiles(fileCopies);
      setInputImages(imageNames);
    } catch (error) {
      console.error('이미지 리사이징 중 오류 발생:', error);
    } finally {
      setImageLoading(false);
    }
  }, [date]);
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const deleteInputImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, index) => index !== idx));
    setInputImages((prev) => prev.filter((_, index) => index !== idx));
  };

  const moveInputImage = (idx: number, direction: 'up' | 'down') => {
    setImageFiles((prev) => moveListItem(prev, idx, direction));
    setInputImages((prev) => moveListItem(prev, idx, direction));
  };

  const registerPost = async () => {
    if (submittingRef.current) return;

    if (!placeName || sort === '선택' || region === '선택' || size === '선택' || !address || !userContact) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);

    const formData = new FormData();
    imageFiles.forEach((file) => {
      formData.append('img', file);
    });
    formData.append('placeName', placeName);
    formData.append('sort', sort);
    formData.append('region', region);
    formData.append('location', location);
    formData.append('size', size);
    formData.append('address', address);
    formData.append('phone', phone);
    formData.append('date', format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"));
    formData.append('homepage', homepage);
    formData.append('userContact', userContact);
    formData.append('postImage', JSON.stringify(inputImages));

    try {
      const res = await axios.post(`${MainURL}/retreat/postsplace`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data) {
        alert('요청되었습니다. 운영진이 검토후에 업로드 됩니다.');
        window.scrollTo(0, 0);
        navigate('/retreat/place');
      } else {
        alert('요청에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('요청 중 오류가 발생했습니다. 사진 용량·개수를 확인해 주세요.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="retreat">
      <div className="inner">
        <main className="subpage__main place-request">
          <div className="subpage__main__title">
            <h3>장소등록요청</h3>
            <div className="place__detail-actions">
              <button className="btn btn--secondary" type="button" onClick={() => navigate('/retreat/place')}>
                목록으로
              </button>
            </div>
          </div>

          <div className="place-request__notice">
            <p>등록 요청된 자료는 운영진 검토 후 업로드됩니다.</p>
            <p>자료에 이상이 있을 경우 작성자 연락처로 연락드릴 수 있습니다.</p>
          </div>

          <div className="place-request__form">
            <div className="inputbox">
              <label>형식</label>
              <DropdownBox widthmain="100%" height="46px" selectedValue={sort} options={sortOptions} handleChange={(e: any) => setSort(e.target.value)} />
            </div>
            <div className="inputbox">
              <label>지역</label>
              <DropdownBox widthmain="100%" height="46px" selectedValue={region} options={regionOptions} handleChange={(e: any) => setRegion(e.target.value)} />
            </div>
            <div className="inputbox">
              <label>장소명</label>
              <input type="text" value={placeName} onChange={(e) => setPlaceName(e.target.value)} />
            </div>
            <div className="inputbox">
              <label>크기</label>
              <DropdownBox widthmain="100%" height="46px" selectedValue={size} options={sizeOptions} handleChange={(e: any) => setSize(e.target.value)} />
            </div>

            <div className="inputbox inputbox--postcode">
              <label>주소찾기</label>
              <DaumPostcodeEmbed style={{ width: '100%', height: '320px' }} onComplete={onCompletePost} />
            </div>

            <div className="inputbox">
              <label>위치</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="inputbox">
              <label>주소</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="inputbox">
              <label>장소연락처</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="inputbox">
              <label>홈페이지</label>
              <input type="text" value={homepage} onChange={(e) => setHomepage(e.target.value)} />
            </div>
            <div className="inputbox">
              <label>작성자 연락처</label>
              <input type="text" value={userContact} onChange={(e) => setUserContact(e.target.value)} />
            </div>

            <div className="imageInputBox">
              <div {...getRootProps()} className="imageDropzoneStyle">
                <input {...getInputProps()} />
                <p>{imageLoading ? '이미지 처리 중...' : imageFiles.length > 0 ? '+ 다시첨부하기' : '+ 사진첨부하기'}</p>
              </div>
              {imageFiles.length > 1 && (
                <p className="imageInputBox__hint">▲▼ 버튼으로 사진 순서를 변경할 수 있습니다. 첫 번째 사진이 대표 이미지입니다.</p>
              )}
              {imageFiles.map((item, index) => (
                <div key={`${item.name}-${index}`} className="imagebox">
                  {imageFiles.length > 1 ? (
                    <div className="imagebox__order">
                      <button
                        type="button"
                        className="imagebox__order-btn"
                        aria-label="위로 이동"
                        disabled={index === 0}
                        onClick={() => moveInputImage(index, 'up')}
                      >
                        ▲
                      </button>
                      <span className="imagebox__order-num">{index + 1}</span>
                      <button
                        type="button"
                        className="imagebox__order-btn"
                        aria-label="아래로 이동"
                        disabled={index === imageFiles.length - 1}
                        onClick={() => moveInputImage(index, 'down')}
                      >
                        ▼
                      </button>
                    </div>
                  ) : (
                    <span className="imagebox__order-placeholder" />
                  )}
                  <img src={URL.createObjectURL(item)} alt={item.name} />
                  <p>{item.name}</p>
                  <button type="button" onClick={() => deleteInputImage(index)}>
                    <CiCircleMinus color="#ff0000" size={20} />
                  </button>
                </div>
              ))}
            </div>

            <div className="buttonbox">
              <button type="button" className="button" disabled={submitting} onClick={registerPost}>
                {submitting ? '등록 중...' : '등록 요청 하기'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PlaceRequest;