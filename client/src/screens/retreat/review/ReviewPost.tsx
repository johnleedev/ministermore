import React, { useCallback, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { useRecoilState, useRecoilValue } from 'recoil';
import { CiCircleMinus } from 'react-icons/ci';
import { FaPen } from 'react-icons/fa6';
import MainURL from '../../../MainURL';
import { recoilLoginState, recoilUserData } from '../../../RecoilStore';
import './Review.scss';

const placeholder = `수련회명 :

날짜 :

수련회장소 :

내용 :
`;

export default function ReviewPost() {
  const navigate = useNavigate();
  const isLogin = useRecoilValue(recoilLoginState);
  const [userData, setUserData] = useRecoilState(recoilUserData);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(placeholder);
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
      const userIdCopy = userData.userAccount.slice(0, 5);
      const fileCopies = resizedFiles.map((resizedFile, index) => {
        const regex = acceptedFiles[index].name.replace(regexCopy, '');
        const regexSlice = regex.slice(-15);
        return new File([resizedFile], `${date}${userIdCopy}_${regexSlice}`, {
          type: acceptedFiles[index].type,
        });
      });
      const imageNames = acceptedFiles.map((file) => {
        const regex = file.name.replace(regexCopy, '');
        const regexSlice = regex.slice(-15);
        return `${date}${userIdCopy}_${regexSlice}`;
      });
      setImageFiles(fileCopies);
      setInputImages(imageNames);
    } catch (error) {
      console.error('이미지 리사이징 중 오류 발생:', error);
    } finally {
      setImageLoading(false);
    }
  }, [date, userData.userAccount]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const deleteInputImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, index) => index !== idx));
    setInputImages((prev) => prev.filter((_, index) => index !== idx));
  };

  const registerPost = async () => {
    if (!isLogin || !userData.userAccount) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!title.trim()) {
      alert('제목을 작성해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('본문을 작성해주세요.');
      return;
    }

    if (imageFiles.length < 3) {
      alert('3장 이상의 사진을 첨부해주세요.');
      return;
    }

    const formData = new FormData();
    imageFiles.forEach((file) => {
      formData.append('img', file);
    });

    const res = await axios.post(`${MainURL}/retreatreview/posts`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: {
        title: title.trim(),
        content,
        userAccount: userData.userAccount,
        userNickName: userData.userNickName,
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        postImage: JSON.stringify(inputImages),
      },
    });

    if (res.data) {
      setUserData({
        ...userData,
        grade: '정회원',
      });
      alert('등록되었습니다.');
      window.scrollTo(0, 0);
      navigate('/retreat/review');
    } else {
      alert('등록에 실패했습니다.');
    }
  };

  return (
    <div className="retreat">
      <div className="inner">
        <main className="subpage__main">
          <div className="subpage__main__title">
            <h3>후기작성</h3>
            <div className="review-actions">
              <button type="button" className="btn btn--secondary" onClick={() => navigate('/retreat/review')}>
                목록
              </button>
            </div>
          </div>

          <div className="subpage__main__content">
            <div className="review-post">
              <div className="warningBox">
                <p>장난스러운 글이나 불건전한 내용 작성 시 경고 없이 삭제될 수 있습니다.</p>
              </div>

              <div className="userBox">
                <FaPen color="#334968" />
                <p>{userData.userNickName || '로그인이 필요합니다.'}</p>
              </div>

              <div className="addPostBox">
                <div className="addPostBox__title">
                  <p>제목</p>
                  <h5>* 최대 200자</h5>
                </div>
                <input
                  value={title}
                  className="inputdefault"
                  type="text"
                  maxLength={200}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <div className="addPostBox__title">
                  <p>본문</p>
                  <h5>* 최대 2000자</h5>
                </div>
                <textarea
                  className="textarea textareapost"
                  value={content}
                  maxLength={2000}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <p className="review-post__guide">* 수련회 후기 사진은 3장 이상 첨부해주세요.</p>

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
                  작성 완료
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
