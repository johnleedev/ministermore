import { useCallback, useState } from 'react';
import '../Admin.scss';
import MainURL from '../../MainURL';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import Loading from '../../components/Loading';
import { CiCircleMinus } from 'react-icons/ci';
import { format } from 'date-fns';

const NOTICE_SORT = 'notice';

export default function NoticePost() {
  const adminAccount = sessionStorage.getItem('user') || 'admin';
  const adminNickName = '관리자';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentDate = new Date();
  const date = format(currentDate, 'yyyy-MM-dd');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1000,
      };
      setImageLoading(true);
      const resizedFiles = await Promise.all(
        acceptedFiles.map(async (file) => imageCompression(file, options))
      );
      const regexCopy = /[^a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|;:'",.<>]/g;
      const userIdCopy = adminAccount.slice(0, 5);
      const fileCopies = resizedFiles.map((resizedFile, index) => {
        const regex = resizedFile.name.replace(regexCopy, '');
        const regexSlice = regex.slice(-15);
        return new File([resizedFile], `${date}${userIdCopy}_${regexSlice}`, {
          type: acceptedFiles[index].type,
        });
      });
      setImageFiles(fileCopies);
      const imageNames = acceptedFiles.map((file) => {
        const regex = file.name.replace(regexCopy, '');
        const regexSlice = regex.slice(-15);
        return `${date}${userIdCopy}_${regexSlice}`;
      });
      setInputImages(imageNames);
    } catch (error) {
      console.error('이미지 리사이징 중 오류 발생:', error);
    } finally {
      setImageLoading(false);
    }
  }, [adminAccount, date]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const deleteInputImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setInputImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setInputImages([]);
    setImageFiles([]);
  };

  const registerPost = async () => {
    const formData = new FormData();
    imageFiles.forEach((file) => {
      formData.append('img', file);
    });

    const datecopy = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss");
    const getParams = {
      title,
      content,
      date: datecopy,
      sort: NOTICE_SORT,
      userAccount: adminAccount,
      userNickName: adminNickName,
      postImage: JSON.stringify(inputImages),
    };

    setSubmitting(true);
    try {
      const res = await axios.post(`${MainURL}/noticeboard/noticepost`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: getParams,
      });
      if (res.data) {
        alert('공지사항이 등록되었습니다.');
        resetForm();
      } else {
        alert('등록에 실패했습니다.');
      }
    } catch {
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-register admin-notice-post">
      <div className="inner">
        <p className="admin-notice-post__desc">
          사이트 공지사항 게시판에 글을 등록합니다. 등록 후{' '}
          <a href="/company/notice" target="_blank" rel="noreferrer">
            공지사항 목록
          </a>
          에서 확인할 수 있습니다.
        </p>

        <div className="admin-notice-post__form">
          <div className="admin-notice-post__field">
            <label htmlFor="notice-title">제목</label>
            <input
              id="notice-title"
              className="admin-notice-post__input"
              type="text"
              maxLength={200}
              value={title}
              placeholder="제목을 입력하세요 (최대 200자)"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="admin-notice-post__field">
            <label htmlFor="notice-content">본문</label>
            <textarea
              id="notice-content"
              className="admin-notice-post__textarea"
              maxLength={2000}
              value={content}
              placeholder="내용을 입력하세요 (최대 2000자)"
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="admin-notice-post__field">
            <p className="admin-notice-post__label">사진 첨부</p>
            <div className="admin-notice-post__images">
              {imageLoading ? (
                <Loading />
              ) : (
                <div {...getRootProps()} className="admin-notice-post__dropzone">
                  <input {...getInputProps()} />
                  <span>{imageFiles.length > 0 ? '+ 다시 첨부하기' : '+ 사진 첨부하기'}</span>
                </div>
              )}
              {imageFiles.map((item, index) => (
                <div key={index} className="admin-notice-post__preview">
                  <img src={URL.createObjectURL(item)} alt="" />
                  <p>{item.name}</p>
                  <button type="button" onClick={() => deleteInputImage(index)} aria-label="삭제">
                    <CiCircleMinus color="#FF0000" size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-notice-post__actions">
            <button
              type="button"
              className="admin-notice-post__btn admin-notice-post__btn--ghost"
              onClick={resetForm}
              disabled={submitting}
            >
              초기화
            </button>
            <button
              type="button"
              className="admin-notice-post__btn admin-notice-post__btn--primary"
              disabled={submitting}
              onClick={() => {
                if (!title.trim()) {
                  alert('제목을 작성해주세요.');
                  return;
                }
                if (!content.trim()) {
                  alert('본문을 작성해주세요.');
                  return;
                }
                registerPost();
              }}
            >
              {submitting ? '등록 중...' : '공지 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
