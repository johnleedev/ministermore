import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { MdOutlineAccessTime, MdOutlineRemoveRedEye } from 'react-icons/md';
import { FaPen, FaRegThumbsUp } from 'react-icons/fa';
import { CiCircleMinus } from 'react-icons/ci';
import MainURL from '../../../MainURL';
import DateFormmating from '../../../components/DateFormmating';
import { recoilLoginState, recoilUserData } from '../../../RecoilStore';
import type { ReviewDetailLocationState } from './reviewNavigation';
import { REVIEW_LIST_PATH } from './reviewNavigation';
import './Review.scss';

interface ReviewPost {
  id: number;
  title: string;
  content: string;
  userAccount: string;
  userNickName: string;
  date: string;
  views: number;
  images: string | null;
}

interface ReviewComment {
  id: number;
  post_id: number;
  content: string;
  userAccount: string;
  userNickName: string;
  date: string;
}

const parseImages = (images: ReviewPost['images']) => {
  if (!images) return [];

  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [images];
  }
};

export default function ReviewDetail() {
  const url = new URL(window.location.href);
  const id = url.searchParams.get('id');
  const navigate = useNavigate();
  const location = useLocation();
  const reviewReturn = (location.state as ReviewDetailLocationState | null)?.reviewReturn;
  const isLogin = useRecoilValue(recoilLoginState);
  const userData = useRecoilValue(recoilUserData);

  const goBackToList = () => {
    if (reviewReturn) {
      navigate(REVIEW_LIST_PATH, { state: { reviewReturn } });
      return;
    }

    navigate(REVIEW_LIST_PATH);
  };

  const [post, setPost] = useState<ReviewPost>();
  const [commentsList, setCommentsList] = useState<ReviewComment[]>([]);
  const [inputComments, setInputComments] = useState('');
  const [isLikedLength, setIsLikedLength] = useState(0);
  const [checkIsLiked, setCheckIsLiked] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const images = parseImages(post?.images || null);

  const fetchPost = async () => {
    if (!id) return;
    try {
      const res = await axios.get(`${MainURL}/retreatreview/getpost/${id}`);
      if (res.data) {
        setPost(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDatas = async () => {
    if (!id) return;

    try {
      const resComment = await axios.get(`${MainURL}/retreatreview/getallcomments/${id}`);
      setCommentsList(resComment.data ? resComment.data : []);

      const resIsliked = await axios.get(`${MainURL}/retreatreview/getisliked/${id}`);
      if (resIsliked.data) {
        const copy = resIsliked.data;
        setIsLikedLength(copy.length);
        const isCheckLiked = copy.filter((item: any) => item.userAccount === userData.userAccount);
        setCheckIsLiked(isCheckLiked.length > 0 && isCheckLiked[0].isliked === 'true');
      } else {
        setIsLikedLength(0);
        setCheckIsLiked(false);
      }
    } catch (error) {
      console.error(error);
      setCommentsList([]);
      setIsLikedLength(0);
      setCheckIsLiked(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  useEffect(() => {
    fetchDatas();
  }, [id, refresh, userData.userAccount]);

  const handleislikedtoggle = async () => {
    if (!isLogin) {
      alert('로그인이 필요합니다.');
      return;
    }

    const res = await axios.post(`${MainURL}/retreatreview/islikedtoggle`, {
      postId: id,
      isLiked: checkIsLiked,
      userAccount: userData.userAccount,
    });

    if (res.data) {
      setCheckIsLiked(!checkIsLiked);
      setRefresh(!refresh);
    }
  };

  const registerComment = async () => {
    if (!isLogin) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!inputComments.trim()) {
      alert('댓글을 입력해주세요.');
      return;
    }

    const date = format(new Date(), 'yyyy-MM-dd');
    const res = await axios.post(`${MainURL}/retreatreview/commentsinput`, {
      postId: id,
      commentText: inputComments,
      date,
      userAccount: userData.userAccount,
      userNickName: userData.userNickName,
    });

    if (res.data) {
      setInputComments('');
      setRefresh(!refresh);
    }
  };

  const deleteComment = async (item: ReviewComment) => {
    const res = await axios.post(`${MainURL}/retreatreview/commentdelete`, {
      commentId: item.id,
      postId: item.post_id,
      userAccount: userData.userAccount,
    });

    if (res.data) {
      setRefresh(!refresh);
    }
  };

  const deletePost = async () => {
    if (!window.confirm('후기를 삭제하시겠습니까?')) return;

    const res = await axios.post(`${MainURL}/retreatreview/postdelete`, {
      postId: post?.id,
      userAccount: userData.userAccount,
      images: post?.images,
    });

    if (res.data) {
      alert('삭제되었습니다.');
      navigate('/retreat/review');
    } else {
      alert('삭제 권한이 없거나 삭제에 실패했습니다.');
    }
  };

  if (!post) {
    return (
      <div className="retreat">
        <div className="inner">
          <main className="subpage__main">
            <div className="subpage__main__title">
              <h3>장소후기</h3>
            </div>
            <div className="subpage__main__content">후기를 불러오는 중입니다.</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="retreat">
      <div className="inner">
        <main className="subpage__main">
          <div className="subpage__main__title">
            <h3>장소후기</h3>
            <div className="place__detail-actions">
              <button className="btn btn--secondary" type="button" onClick={goBackToList}>
                목록
              </button>
              {post.userAccount === userData.userAccount && (
                <button className="btn btn--danger" type="button" onClick={deletePost}>
                  삭제
                </button>
              )}
            </div>
          </div>

          <div className="subpage__main__content">
            <div className="review-detail">
              <div className="review-detail__top">
                <div>
                  <h1>{post.title}</h1>
                  <p>글쓴이: {post.userNickName}님</p>
                </div>
                <div className="review-detail__meta">
                  <span>
                    <MdOutlineAccessTime color="#325382" />
                    {DateFormmating(post.date)}
                  </span>
                  <span>
                    <MdOutlineRemoveRedEye color="#325382" />
                    {post.views}
                  </span>
                  <span>
                    <FaRegThumbsUp color="#325382" />
                    {isLikedLength}
                  </span>
                </div>
              </div>

              <div className="review-detail__content">
                {images.length > 0 && (
                  <div className="review-detail__images">
                    {images.map((item) => (
                      <img src={`${MainURL}/images/retreat/postimage/${item}`} alt={post.title} key={item} />
                    ))}
                  </div>
                )}
                <p>{post.content}</p>
                <button
                  className={checkIsLiked ? 'review-like review-like--on' : 'review-like'}
                  type="button"
                  onClick={handleislikedtoggle}
                >
                  <FaRegThumbsUp color="#325382" />
                  좋아요
                </button>
              </div>

              <div className="review-comments">
                <div className="userBox">
                  <FaPen color="#334968" />
                  <p>{isLogin ? userData.userNickName : '로그인 후 댓글을 입력할 수 있습니다.'}</p>
                </div>
                <div className="addPostBox">
                  <div className="addPostBox__title">
                    <p>댓글 입력하기</p>
                    <h5>* 최대 500자</h5>
                  </div>
                  <textarea
                    className="textarea textareacomment"
                    value={inputComments}
                    maxLength={500}
                    onChange={(e) => setInputComments(e.target.value)}
                  />
                </div>
                <div className="buttonbox">
                  <button type="button" className="button" onClick={registerComment}>
                    댓글 입력
                  </button>
                </div>

                {commentsList.length > 0 ? (
                  commentsList.map((item) => (
                    <div className="comments_box" key={item.id}>
                      <div className="topBox">
                        <div className="namebox">
                          <h3>{item.userNickName}님</h3>
                          <p>{DateFormmating(item.date)}</p>
                        </div>
                        {userData.userAccount === item.userAccount && (
                          <button type="button" onClick={() => deleteComment(item)}>
                            <CiCircleMinus color="#ff0000" size={20} />
                          </button>
                        )}
                      </div>
                      <div className="textbox">
                        <p>{item.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="comments_box">
                    <p>입력된 댓글이 없습니다.</p>
                  </div>
                )}
              </div>

              <div className="place__detail-actions place__detail-actions--bottom">
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Top
                </button>
                <button className="btn btn--primary" type="button" onClick={goBackToList}>
                  목록으로
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
