import React, { useCallback, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { CiCircleMinus } from 'react-icons/ci';
import MainURL from '../../../MainURL';
import { DropdownBox } from '../../../components/DropdownBox';
import '../place/Place.scss';
import './Casting.scss';

const sortOptions = [
  { value: '선택', label: '선택' },
  { value: '설교자', label: '설교자' },
  { value: '찬양사역자', label: '찬양사역자' },
  { value: '특강강사', label: '특강강사' },
  { value: '기타', label: '기타' },
];

const CastingRequest = () => {
  const navigate = useNavigate();
  const [sort, setSort] = useState('선택');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profile, setProfile] = useState('');
  const [userContact, setUserContact] = useState('');
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageLoading, setImageLoading] = useState(false);

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

  const registerPost = async () => {
    if (sort === '선택' || !name.trim() || !profile.trim() || !userContact.trim()) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    const formData = new FormData();
    imageFiles.forEach((file) => {
      formData.append('img', file);
    });

    const res = await axios.post(`${MainURL}/retreatcasting/postscasting`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: {
        sort,
        name: name.trim(),
        phone,
        profile,
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        userContact,
        images: JSON.stringify(inputImages),
      },
    });

    if (res.data) {
      alert('요청되었습니다. 운영진이 검토후에 업로드 됩니다.');
      window.scrollTo(0, 0);
      navigate('/retreat/casting');
    } else {
      alert('요청에 실패했습니다.');
    }
  };

  return (
    <div className="retreat casting">
      <div className="inner">
        <main className="subpage__main casting-request">
          <div className="subpage__main__title">
            <h3>강사등록요청</h3>
            <div className="place__detail-actions">
              <button className="btn btn--secondary" type="button" onClick={() => navigate('/retreat/casting')}>
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
              <label>구분</label>
              <DropdownBox widthmain="100%" height="46px" selectedValue={sort} options={sortOptions} handleChange={(e: any) => setSort(e.target.value)} />
            </div>
            <div className="inputbox">
              <label>강사명</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="inputbox">
              <label>연락처</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="inputbox inputbox--textarea">
              <label>프로필</label>
              <textarea value={profile} onChange={(e) => setProfile(e.target.value)} />
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
              {imageFiles.map((item, index) => (
                <div key={item.name} className="imagebox">
                  <img src={URL.createObjectURL(item)} alt={item.name} />
                  <p>{item.name}</p>
                  <button type="button" onClick={() => deleteInputImage(index)}>
                    <CiCircleMinus color="#ff0000" size={20} />
                  </button>
                </div>
              ))}
            </div>

            <div className="buttonbox">
              <button type="button" className="button" onClick={registerPost}>
                등록 요청 하기
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CastingRequest;