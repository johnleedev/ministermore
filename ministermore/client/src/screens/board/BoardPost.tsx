import { useCallback, useState } from 'react';
import './Board.scss';
import MainURL from '../../MainURL';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaPen } from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import Loading from '../../components/Loading';
import { CiCircleMinus } from 'react-icons/ci';
import { format } from 'date-fns';
import { useRecoilState } from 'recoil';
import { recoilUserData } from '../../RecoilStore';
import type { CommunityBoardConfig } from './BoardTypes';

type Props = {
  config: CommunityBoardConfig;
};

const getPostRoute = (config: CommunityBoardConfig) => config.postRoute ?? `${config.routePrefix}post`;

export default function BoardPost({ config }: Props) {
  const navigate = useNavigate();
  const [userData] = useRecoilState(recoilUserData);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageLoading, setImageLoading] = useState(false);

  const currentDate = new Date();
  const date = format(currentDate, 'yyyy-MM-dd');
  const hasRegion = Boolean(config.regionOptions?.length);

  const processImages = useCallback(
    async (acceptedFiles: File[], append: boolean) => {
      if (acceptedFiles.length === 0) return;
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
        const regexCopy = /[^a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|;:'",.<>]/g;
        const userIdCopy = userData?.userAccount?.slice(0, 5) ?? 'user';
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
        if (append) {
          setImageFiles((prev) => [...prev, ...fileCopies]);
          setInputImages((prev) => [...prev, ...imageNames]);
        } else {
          setImageFiles(fileCopies);
          setInputImages(imageNames);
        }
      } catch (error) {
        console.error('이미지 리사이징 중 오류 발생:', error);
      } finally {
        setImageLoading(false);
      }
    },
    [date, userData?.userAccount]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      void processImages(acceptedFiles, false);
    },
    [processImages]
  );

  const onDropAdd = useCallback(
    (acceptedFiles: File[]) => {
      void processImages(acceptedFiles, true);
    },
    [processImages]
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop, multiple: true });
  const { getRootProps: getAddRootProps, getInputProps: getAddInputProps } = useDropzone({
    onDrop: onDropAdd,
    multiple: true,
  });

  const deleteInputImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setInputImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const datecopy = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss");

  const registerPost = async () => {
    if (!selectedCategory) {
      alert('구분을 선택해주세요.');
      return;
    }
    if (hasRegion && !selectedRegion) {
      alert('지역을 선택해주세요.');
      return;
    }

    const formData = new FormData();
    imageFiles.forEach((file) => {
      formData.append('img', file);
    });

    const getParams: Record<string, string> = {
      title,
      content,
      date: datecopy,
      sort: selectedCategory,
      userAccount: userData.userAccount,
      userNickName: userData.userNickName,
      postImage: JSON.stringify(inputImages),
    };

    if (hasRegion) {
      getParams.region = selectedRegion;
    }

    axios
      .post(`${MainURL}/${config.apiBase}/${getPostRoute(config)}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: getParams,
      })
      .then((res) => {
        if (res.data) {
          alert('등록되었습니다.');
          navigate(config.listPath, { state: { listRefresh: Date.now() } });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleSubmit = () => {
    if (title === '') {
      alert('제목을 작성해주세요.');
      return;
    }
    void registerPost();
  };

  return (
    <div className="Board">
      <div className="inner">
        <div className="subpage__main">
          <div className="subpage__main__title">
            <h3>{config.boardTitle}</h3>
            <button type="button" className="postBtnbox" onClick={() => navigate(config.listPath)}>
              목록
            </button>
          </div>

          <div className="subpage__main__content">
            <div className="warningBox">
              <p>
                장난스러운 글이나, 불건전하거나, 불법적인 내용 작성시, 경고 없이 곧바로 글은 삭제됩니다. 또한 사용자
                계정은 서비스 사용에 제한이 있을 수 있습니다.
              </p>
              <p className="warningBox__notice">
                수련회 관련 글이나 등업관련 글은 수련회 게시판(상단 수련회 메뉴)을 사용해주세요. 관리자가 따로 등업해드리지 않습니다.
              </p>
            </div>

            <div className="userBox">
              <FaPen color="#334968" />
              <p>{userData.userNickName}</p>
            </div>

            <div className="addPostBox community-post-form">
              <div className="community-post-form__section">
                <p className="community-post-form__label">구분 *</p>
                <div className="community-post-form__chips">
                  {config.categoryOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`community-post-form__chip${selectedCategory === item ? ' community-post-form__chip--on' : ''}`}
                      onClick={() => setSelectedCategory(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {hasRegion && config.regionOptions && (
                <div className="community-post-form__section">
                  <p className="community-post-form__label">지역 *</p>
                  <div className="community-post-form__chips">
                    {config.regionOptions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`community-post-form__chip${selectedRegion === item ? ' community-post-form__chip--on' : ''}`}
                        onClick={() => setSelectedRegion(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: '20px' }}>
                <p>제목</p>
                <h5 style={{ fontSize: '12px' }}>* 최대 200자</h5>
              </div>
              <input
                value={title}
                className="inputdefault"
                type="text"
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: '10px' }}>
                <p>본문</p>
                <h5 style={{ fontSize: '12px' }}>* 최대 2000자</h5>
              </div>
              <textarea
                className="textarea textareapost"
                value={content}
                maxLength={2000}
                onChange={(e) => setContent(e.target.value)}
              />
              <p style={{ marginTop: '20px' }}>사진 첨부</p>
            </div>

            <div className="imageInputBox">
              {imageLoading ? (
                <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
                  <Loading />
                </div>
              ) : imageFiles.length === 0 ? (
                <div className="imageDropzoneCover">
                  <div {...getRootProps()} className="imageDropzoneStyle">
                    <input {...getInputProps()} />
                    <div className="imageplus">+ 사진첨부하기</div>
                  </div>
                </div>
              ) : (
                <div className="imageDropzoneRow">
                  <div className="imageDropzoneCover">
                    <div {...getRootProps()} className="imageDropzoneStyle">
                      <input {...getInputProps()} />
                      <div className="imageplus">+ 다시첨부하기</div>
                    </div>
                  </div>
                  <div className="imageDropzoneCover">
                    <div {...getAddRootProps()} className="imageDropzoneStyle">
                      <input {...getAddInputProps()} />
                      <div className="imageplus">+ 사진추가하기</div>
                    </div>
                  </div>
                </div>
              )}
              {imageFiles.length > 0 &&
                imageFiles.map((item, index) => (
                  <div key={index} className="imagebox">
                    <img src={URL.createObjectURL(item)} alt="" />
                    <p>{item.name}</p>
                    <div onClick={() => deleteInputImage(index)}>
                      <CiCircleMinus color="#FF0000" size={20} />
                    </div>
                  </div>
                ))}
            </div>

            <div style={{ width: '100%', height: '2px', backgroundColor: '#EAEAEA', margin: '10px 0' }}></div>

            <div className="buttonbox">
              <div className="button" onClick={handleSubmit}>
                <p>작성 완료</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
