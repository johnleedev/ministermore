import { useCallback, useState } from 'react';
import '../Admin.scss';
import MainURL from '../../MainURL';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import Loading from '../../components/Loading';
import { CiCircleMinus } from 'react-icons/ci';
import { format } from 'date-fns';
import type { CommunityBoardConfig } from '../../screens/board/BoardTypes';
import { generateRandomUserNickName } from './boardAdminUtils';

type Props = {
  config: CommunityBoardConfig;
  /** true이면 등록 시 userNickName을 랜덤 생성 (자유게시판 등) */
  randomUserNickName?: boolean;
};

const getPostRoute = (config: CommunityBoardConfig) => config.postRoute ?? `${config.routePrefix}post`;

export default function AdminCommunityPost({ config, randomUserNickName = false }: Props) {
  const adminAccount = sessionStorage.getItem('user') || 'admin';
  const adminNickName = '관리자';

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [randomNickName, setRandomNickName] = useState(() =>
    randomUserNickName ? generateRandomUserNickName() : ''
  );

  const currentDate = new Date();
  const date = format(currentDate, 'yyyy-MM-dd');
  const hasRegion = Boolean(config.regionOptions?.length);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        setImageLoading(true);
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1000 };
        const resizedFiles = await Promise.all(
          acceptedFiles.map(async (file) => imageCompression(file, options))
        );
        const regexCopy = /[^a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|;:'",.<>]/g;
        const userIdCopy = adminAccount.slice(0, 5);
        const fileCopies = resizedFiles.map((resizedFile, index) => {
          const regex = acceptedFiles[index].name.replace(regexCopy, '');
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
    },
    [adminAccount, date]
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const deleteInputImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setInputImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setSelectedCategory('');
    setSelectedRegion('');
    setTitle('');
    setContent('');
    setInputImages([]);
    setImageFiles([]);
    if (randomUserNickName) {
      setRandomNickName(generateRandomUserNickName());
    }
  };

  const registerPost = async () => {
    if (!selectedCategory) {
      alert('종류를 선택해주세요.');
      return;
    }
    if (hasRegion && !selectedRegion) {
      alert('지역을 선택해주세요.');
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

    const formData = new FormData();
    imageFiles.forEach((file) => {
      formData.append('img', file);
    });

    const datecopy = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss");
    const getParams: Record<string, string> = {
      title,
      content,
      date: datecopy,
      sort: selectedCategory,
      userAccount: adminAccount,
      userNickName: randomUserNickName ? randomNickName : adminNickName,
      postImage: JSON.stringify(inputImages),
    };

    if (hasRegion) {
      getParams.region = selectedRegion;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${MainURL}/${config.apiBase}/${getPostRoute(config)}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: getParams,
      });
      if (res.data) {
        alert(`${config.boardTitle}에 글이 등록되었습니다.`);
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
      <p className="admin-notice-post__desc">
        {config.boardTitle}에 관리자 글을 등록합니다. 등록 후{' '}
        <a href={config.listPath} target="_blank" rel="noreferrer">
          {config.boardTitle} 목록
        </a>
        에서 확인할 수 있습니다.
      </p>

      <div className="admin-notice-post__form">
        <div className="admin-notice-post__field">
          <p className="admin-notice-post__label">종류 *</p>
          <div className="admin-notice-post__chips">
            {config.categoryOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={`admin-notice-post__chip${selectedCategory === item ? ' admin-notice-post__chip--on' : ''}`}
                onClick={() => setSelectedCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {randomUserNickName && (
          <div className="admin-notice-post__field">
            <p className="admin-notice-post__label">작성자 닉네임</p>
            <div className="admin-notice-post__nickname">
              <span className="admin-notice-post__nickname-value">{randomNickName}</span>
              <button
                type="button"
                className="admin-notice-post__btn admin-notice-post__btn--ghost admin-notice-post__nickname-regen"
                disabled={submitting}
                onClick={() => setRandomNickName(generateRandomUserNickName())}
              >
                다시 생성
              </button>
            </div>
            <p className="admin-notice-post__nickname-hint">등록 시 위 닉네임으로 저장됩니다.</p>
          </div>
        )}

        {hasRegion && config.regionOptions && (
          <div className="admin-notice-post__field">
            <p className="admin-notice-post__label">지역 *</p>
            <div className="admin-notice-post__chips">
              {config.regionOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`admin-notice-post__chip${selectedRegion === item ? ' admin-notice-post__chip--on' : ''}`}
                  onClick={() => setSelectedRegion(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="admin-notice-post__field">
          <label htmlFor={`admin-post-title-${config.sort}`}>제목</label>
          <input
            id={`admin-post-title-${config.sort}`}
            className="admin-notice-post__input"
            type="text"
            maxLength={200}
            value={title}
            placeholder="제목을 입력하세요 (최대 200자)"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="admin-notice-post__field">
          <label htmlFor={`admin-post-content-${config.sort}`}>본문</label>
          <textarea
            id={`admin-post-content-${config.sort}`}
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
            onClick={() => void registerPost()}
          >
            {submitting ? '등록 중...' : '글 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
