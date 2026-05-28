import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { format } from 'date-fns';
import { CiCircleMinus } from 'react-icons/ci';
import MainURL from '../../MainURL';
import Loading from '../../components/Loading';
import type { CommunityBoardConfig, CommunityPost } from '../../screens/board/BoardTypes';

type Props = {
  config: CommunityBoardConfig;
  post: CommunityPost | null;
  onClose: () => void;
  onSaved: () => void;
};

const getEditPostRoute = (config: CommunityBoardConfig) =>
  config.editPostRoute ?? `${config.routePrefix}postedit`;

const parseImages = (images: string): string[] => {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function CommunityBoardEditModal({ config, post, onClose, onSaved }: Props) {
  const hasRegion = Boolean(config.regionOptions?.length);
  const editRoute = getEditPostRoute(config);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImageNames, setNewImageNames] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!post) return;
    setSelectedCategory(post.sort || '');
    setSelectedRegion(post.region || '');
    setTitle(post.title || '');
    setContent(post.content || '');
    setExistingImages(parseImages(post.images));
    setNewImageFiles([]);
    setNewImageNames([]);
  }, [post]);

  useEffect(() => {
    if (!post) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [post, submitting, onClose]);

  const onDropNewImages = useCallback(
    async (acceptedFiles: File[]) => {
      if (!post || acceptedFiles.length === 0) return;
      try {
        setImageLoading(true);
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1000 };
        const resizedFiles = await Promise.all(
          acceptedFiles.map(async (file) => imageCompression(file, options))
        );
        const regexCopy = /[^a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|;:'",.<>]/g;
        const userIdCopy = (post.userAccount || 'admin').slice(0, 5);
        const datePrefix = format(new Date(), 'yyyy-MM-dd');
        const fileCopies = resizedFiles.map((resizedFile, index) => {
          const regex = acceptedFiles[index].name.replace(regexCopy, '');
          const regexSlice = regex.slice(-15);
          return new File([resizedFile], `${datePrefix}${userIdCopy}_${regexSlice}`, {
            type: acceptedFiles[index].type,
          });
        });
        const names = fileCopies.map((f) => f.name);
        setNewImageFiles((prev) => [...prev, ...fileCopies]);
        setNewImageNames((prev) => [...prev, ...names]);
      } catch (error) {
        console.error('이미지 리사이징 중 오류:', error);
      } finally {
        setImageLoading(false);
      }
    },
    [post]
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop: onDropNewImages, multiple: true });

  const removeExistingImage = (name: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== name));
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImageNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!post) return;
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
    newImageFiles.forEach((file) => {
      formData.append('img', file);
    });

    const params: Record<string, string> = {
      postId: String(post.id),
      title: title.trim(),
      content: content.trim(),
      date: post.date,
      sort: selectedCategory,
      postImage: JSON.stringify([...existingImages, ...newImageNames]),
    };
    if (hasRegion) {
      params.region = selectedRegion;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${MainURL}/${config.apiBase}/${editRoute}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params,
      });
      if (res.data) {
        alert('수정되었습니다.');
        onSaved();
        onClose();
      } else {
        alert('수정에 실패했습니다.');
      }
    } catch {
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!post) return null;

  return (
    <div className="admin-board-manage__modal-backdrop" onClick={submitting ? undefined : onClose}>
      <div
        className="admin-board-manage__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-edit-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-board-manage__modal-head">
          <h3 id="board-edit-modal-title">게시글 수정 — {post.title}</h3>
          <button
            type="button"
            className="admin-board-manage__modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="admin-board-manage__modal-body admin-notice-post__form">
          <p className="admin-board-manage__modal-meta">
            작성자: {post.userNickName} ({post.userAccount})
          </p>

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
            <label htmlFor={`admin-edit-title-${post.id}`}>제목</label>
            <input
              id={`admin-edit-title-${post.id}`}
              className="admin-notice-post__input"
              type="text"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="admin-notice-post__field">
            <label htmlFor={`admin-edit-content-${post.id}`}>본문</label>
            <textarea
              id={`admin-edit-content-${post.id}`}
              className="admin-notice-post__textarea"
              maxLength={2000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="admin-notice-post__field">
            <p className="admin-notice-post__label">사진</p>
            {existingImages.length > 0 && (
              <div className="admin-board-manage__modal-images">
                {existingImages.map((img) => (
                  <div key={img} className="admin-board-manage__modal-image-item">
                    <img src={`${MainURL}/images/postimage/${config.imagePath}/${img}`} alt="" />
                    <button
                      type="button"
                      className="admin-board-manage__modal-image-remove"
                      onClick={() => removeExistingImage(img)}
                      aria-label="기존 사진 제거"
                    >
                      <CiCircleMinus color="#FF0000" size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {imageLoading ? (
              <Loading />
            ) : (
              <div {...getRootProps()} className="admin-notice-post__dropzone">
                <input {...getInputProps()} />
                <span>+ 사진 추가</span>
              </div>
            )}
            {newImageFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="admin-notice-post__preview">
                <img src={URL.createObjectURL(file)} alt="" />
                <p>{file.name}</p>
                <button type="button" onClick={() => removeNewImage(index)} aria-label="새 사진 취소">
                  <CiCircleMinus color="#FF0000" size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-board-manage__modal-foot">
          <button
            type="button"
            className="admin-notice-post__btn admin-notice-post__btn--ghost"
            onClick={onClose}
            disabled={submitting}
          >
            취소
          </button>
          <button
            type="button"
            className="admin-notice-post__btn admin-notice-post__btn--primary"
            disabled={submitting}
            onClick={() => void handleSave()}
          >
            {submitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
