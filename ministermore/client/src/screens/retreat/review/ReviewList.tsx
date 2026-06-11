import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { MdOutlineAccessTime, MdOutlineRemoveRedEye } from 'react-icons/md';
import { FaPen } from 'react-icons/fa6';
import MainURL from '../../../MainURL';
import DateFormmating from '../../../components/DateFormmating';
import Loading from '../../../components/Loading';
import ScrollToTopButton from '../../../components/ScrollToTopButton';
import { recoilLoginState } from '../../../RecoilStore';
import type { ReviewListLocationState, ReviewReturnState } from './reviewNavigation';
import {
  REVIEW_LIST_PATH,
  clearReviewListRestore,
  loadReviewListRestore,
  saveReviewListRestore,
  shouldRestoreReviewList,
} from './reviewNavigation';
import './Review.scss';
import '../../ForListPage.scss';

interface ReviewPost {
  id: number;
  title: string;
  content: string;
  userAccount: string;
  userNickName: string;
  date: string;
  views: number;
  commentCount?: number;
  images: string | null;
}

const RESTORE_TTL_MS = 10 * 60 * 1000;

const restoreScroll = (scrollY: number) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  });
};

const resolveInitialReviewReturn = (locationState: ReviewListLocationState | null): ReviewReturnState | null => {
  const fromRouter = locationState?.reviewReturn;
  if (fromRouter) return fromRouter;
  if (shouldRestoreReviewList()) return loadReviewListRestore(RESTORE_TTL_MS);
  return null;
};

const parseImages = (images: ReviewPost['images']) => {
  if (!images) return [];

  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [images];
  }
};

export default function ReviewList() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialRestoreRef = useRef<ReviewReturnState | null | undefined>(undefined);
  if (initialRestoreRef.current === undefined) {
    initialRestoreRef.current = resolveInitialReviewReturn(location.state as ReviewListLocationState | null);
  }
  const initialRestore = initialRestoreRef.current;

  const isLogin = useRecoilValue(recoilLoginState);
  const [currentPage, setCurrentPage] = useState(initialRestore?.currentPage ?? 1);
  const [list, setList] = useState<ReviewPost[]>([]);
  const [listAllLength, setListAllLength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pendingScrollYRef = useRef<number | null>(
    initialRestore && ((initialRestore.scrollY ?? 0) > 0 || (initialRestore.currentPage ?? 1) > 1)
      ? (initialRestore.scrollY ?? 0)
      : null,
  );
  const hasInitializedRef = useRef(false);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(listAllLength / itemsPerPage);

  const fetchDatas = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${MainURL}/retreatreview/getposts/${currentPage}`);
      if (res.data) {
        setList(res.data.resultData || []);
        setListAllLength(res.data.totalCount || 0);
      }
    } catch (error) {
      console.error(error);
      setList([]);
      setListAllLength(0);
    } finally {
      setIsLoading(false);
      if (pendingScrollYRef.current !== null) {
        restoreScroll(pendingScrollYRef.current);
        pendingScrollYRef.current = null;
        clearReviewListRestore();
        navigate(REVIEW_LIST_PATH, { replace: true, state: {} });
      }
    }
  };

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      if (initialRestore && pendingScrollYRef.current === null) {
        clearReviewListRestore();
        navigate(REVIEW_LIST_PATH, { replace: true, state: {} });
      }
    }

    void fetchDatas();
  }, [currentPage]);

  const renderPreview = (content: string) => {
    if (content?.length > 40) return `${content.substring(0, 40)}...`;
    return content;
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 4;
    const half = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);

    if (currentPage - half < 1) {
      end = Math.min(totalPages, end + (half - currentPage + 1));
    }

    if (currentPage + half > totalPages) {
      start = Math.max(1, start - (currentPage + half - totalPages));
    }

    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    clearReviewListRestore();
    setCurrentPage(newPage);
  };

  const openPostDetails = async (post: ReviewPost) => {
    await axios.post(`${MainURL}/retreatreview/postsviews`, {
      postId: post.id,
    });
    const returnState: ReviewReturnState = {
      currentPage,
      scrollY: window.scrollY,
    };
    saveReviewListRestore(returnState);
    window.scrollTo(0, 0);
    navigate(`/retreat/review/detail?id=${post.id}`, {
      state: { reviewReturn: returnState },
    });
  };

  const openReviewPost = () => {
    if (!isLogin) {
      alert('권한이 없습니다. 로그인이 필요합니다.');
      return;
    }

    navigate('/retreat/review/post');
  };

  return (
    <div className="retreat">
      <div className="inner">
        <main className="subpage__main">
          <div className="subpage__main__title">
            <h3>장소후기</h3>
            <div className="review-actions">
              <button type="button" className="btn btn--primary" onClick={openReviewPost}>
                후기작성
              </button>
            </div>
          </div>

          <div className="subpage__main__content">

            {isLoading ? (
              <div className="list-loading">
                <Loading />
              </div>
            ) : (
            <div className="review-list">
              {list.length > 0 ? (
                list.map((item) => {
                  const images = parseImages(item.images);
                  const firstImage = images[0];

                  return (
                    <div className="review-card" key={item.id} onClick={() => openPostDetails(item)}>
                      <div className="review-card__image">
                        {firstImage ? (
                          <img src={`${MainURL}/images/retreat/postimage/${firstImage}`} alt={item.title} />
                        ) : (
                          <p>등록된 사진이 없습니다.</p>
                        )}
                      </div>
                      <div className="review-card__body">
                        <h4>
                          {renderPreview(item.title)}
                          {item.commentCount ? <span className="comment-count">[{item.commentCount}]</span> : null}
                        </h4>
                        <p>{renderPreview(item.content)}</p>
                        <div className="review-card__meta">
                          <span>
                            <FaPen color="#334968" size={13} />
                            {item.userNickName}
                          </span>
                          <span>
                            <MdOutlineAccessTime color="#325382" />
                            {DateFormmating(item.date)}
                          </span>
                          <span>
                            <MdOutlineRemoveRedEye color="#325382" />
                            {item.views}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="review-empty">작성된 글이 없습니다.</div>
              )}
            </div>
            )}

            {totalPages > 0 && (
              <div className="btn-row">
                <button type="button" className="btn" onClick={() => changePage(1)} disabled={currentPage === 1}>
                  {'<<'}
                </button>
                <button type="button" className="btn" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>
                  {'<'}
                </button>
                {getPageNumbers().map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={currentPage === page ? 'btn btn--on' : 'btn'}
                    onClick={() => changePage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button type="button" className="btn" onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}>
                  {'>'}
                </button>
                <button type="button" className="btn" onClick={() => changePage(totalPages)} disabled={currentPage === totalPages}>
                  {'>>'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      <ScrollToTopButton />
    </div>
  );
}
