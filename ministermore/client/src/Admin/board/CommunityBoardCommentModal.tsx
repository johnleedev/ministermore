import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import MainURL from '../../MainURL';
import Loading from '../../components/Loading';
import DateFormmating from '../../components/DateFormmating';
import type { CommunityBoardConfig, CommunityComment, CommunityPost } from '../../screens/board/BoardTypes';
import { generateRandomUserNickName } from './boardAdminUtils';

type Props = {
  config: CommunityBoardConfig;
  post: CommunityPost | null;
  onClose: () => void;
  onSaved: () => void;
};

const getAllCommentsRoute = (config: CommunityBoardConfig) =>
  config.getAllCommentsRoute ?? `${config.routePrefix}getallcomments`;

const getCommentsInputRoute = (config: CommunityBoardConfig) =>
  config.commentsInputRoute ?? `${config.routePrefix}commentsinput`;

const parseImages = (images: string): string[] => {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function CommunityBoardCommentModal({ config, post, onClose, onSaved }: Props) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [userNickName, setUserNickName] = useState('');
  const [commentDate, setCommentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const adminAccount = sessionStorage.getItem('user') || 'admin';

  const fetchComments = useCallback(async () => {
    if (!post) return;
    setLoadingComments(true);
    try {
      const res = await axios.get(
        `${MainURL}/${config.apiBase}/${getAllCommentsRoute(config)}/${post.id}`
      );
      const list: CommunityComment[] = Array.isArray(res.data) ? res.data : [];
      setComments([...list].reverse());
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [config, post]);

  useEffect(() => {
    if (!post) return;
    setUserNickName('');
    setCommentDate(format(new Date(), 'yyyy-MM-dd'));
    setCommentText('');
    void fetchComments();
  }, [post, fetchComments]);

  const handleSubmit = async () => {
    if (!post) return;
    const nick = userNickName.trim();
    const text = commentText.trim();
    const date = commentDate.trim();

    if (!nick) {
      alert('닉네임을 입력해 주세요.');
      return;
    }
    if (!date) {
      alert('날짜를 입력해 주세요.');
      return;
    }
    if (!text) {
      alert('댓글 내용을 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${MainURL}/${config.apiBase}/${getCommentsInputRoute(config)}`, {
        postId: post.id,
        commentText: text,
        date,
        userAccount: adminAccount,
        userNickName: nick,
      });
      if (res.data) {
        alert('댓글이 등록되었습니다.');
        setCommentText('');
        onSaved();
        void fetchComments();
      } else {
        alert('댓글 등록에 실패했습니다.');
      }
    } catch {
      alert('댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!post) return null;

  const postImages = parseImages(post.images);

  return (
    <div className="admin-board-manage__modal-backdrop" onClick={submitting ? undefined : onClose}>
      <div
        className="admin-board-manage__modal admin-board-manage__modal--comment"
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-comment-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-board-manage__modal-head">
          <h3 id="board-comment-modal-title">댓글 작성 — {post.title}</h3>
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
          <section className="admin-board-manage__post-preview" aria-label="게시글 본문">
            <p className="admin-notice-post__label">게시글 본문</p>
            <div className="admin-board-manage__post-preview-meta">
              <span>#{post.id}</span>
              <span>{post.sort}</span>
              {post.region ? <span>{post.region}</span> : null}
              <span>{post.userNickName}</span>
              <span>{DateFormmating(post.date)}</span>
              <span>댓글 {post.commentCount ?? comments.length}개</span>
            </div>
            <h4 className="admin-board-manage__post-preview-title">{post.title}</h4>
            <div className="admin-board-manage__post-preview-content">
              {post.content?.trim() ? post.content : '(본문 없음)'}
            </div>
            {postImages.length > 0 ? (
              <div className="admin-board-manage__post-preview-images">
                {postImages.map((img) => (
                  <img
                    key={img}
                    src={`${MainURL}/images/postimage/${config.imagePath}/${img}`}
                    alt=""
                  />
                ))}
              </div>
            ) : null}
          </section>

          <div className="admin-notice-post__field">
            <label htmlFor={`admin-comment-nick-${post.id}`}>닉네임 *</label>
            <div className="admin-board-manage__comment-nick-row">
              <input
                id={`admin-comment-nick-${post.id}`}
                className="admin-notice-post__input"
                type="text"
                maxLength={50}
                value={userNickName}
                onChange={(e) => setUserNickName(e.target.value)}
                placeholder="표시할 닉네임"
              />
              <button
                type="button"
                className="admin-notice-post__btn admin-notice-post__btn--ghost"
                onClick={() => setUserNickName(generateRandomUserNickName())}
              >
                랜덤
              </button>
            </div>
          </div>

          <div className="admin-notice-post__field">
            <label htmlFor={`admin-comment-date-${post.id}`}>날짜 *</label>
            <input
              id={`admin-comment-date-${post.id}`}
              className="admin-notice-post__input"
              type="date"
              value={commentDate}
              onChange={(e) => setCommentDate(e.target.value)}
            />
          </div>

          <div className="admin-notice-post__field">
            <label htmlFor={`admin-comment-text-${post.id}`}>댓글 내용 *</label>
            <textarea
              id={`admin-comment-text-${post.id}`}
              className="admin-notice-post__textarea"
              maxLength={1000}
              rows={5}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글 내용을 입력하세요"
            />
          </div>

          <div className="admin-board-manage__comment-list-wrap">
            <p className="admin-notice-post__label">등록된 댓글</p>
            {loadingComments ? (
              <Loading />
            ) : comments.length === 0 ? (
              <p className="admin-board-manage__comment-empty">등록된 댓글이 없습니다.</p>
            ) : (
              <ul className="admin-board-manage__comment-list">
                {comments.map((item) => (
                  <li key={item.id} className="admin-board-manage__comment-item">
                    <div className="admin-board-manage__comment-item-head">
                      <strong>{item.userNickName}</strong>
                      <span>{DateFormmating(item.date)}</span>
                    </div>
                    <p>{item.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="admin-board-manage__modal-foot">
          <button
            type="button"
            className="admin-notice-post__btn admin-notice-post__btn--ghost"
            onClick={onClose}
            disabled={submitting}
          >
            닫기
          </button>
          <button
            type="button"
            className="admin-notice-post__btn admin-notice-post__btn--primary"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? '등록 중...' : '댓글 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
