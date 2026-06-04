import { useEffect, useState } from 'react';
import '../Admin.scss';
import axios from 'axios';
import MainURL from '../../MainURL';
import { useNavigate } from 'react-router-dom';
import DateFormmating from '../../components/DateFormmating';
import Pagination from '../../components/Pagination';
import Loading from '../../components/Loading';
import type { CommunityBoardConfig, CommunityPost } from '../../screens/board/BoardTypes';
import { BOARD_NOTICE_SORT } from '../../screens/board/boardConfigs';
import CommunityBoardEditModal from './CommunityBoardEditModal';
import CommunityBoardMoveModal from './CommunityBoardMoveModal';
import CommunityBoardCommentModal from './CommunityBoardCommentModal';

type Props = {
  config: CommunityBoardConfig;
  manageTitle: string;
};

const getListRoute = (config: CommunityBoardConfig) => config.listRoute ?? `${config.routePrefix}getposts`;
const getDeletePostRoute = (config: CommunityBoardConfig) =>
  config.deletePostRoute ?? `${config.routePrefix}deletepost`;
const getAdminSetNoticeRoute = (config: CommunityBoardConfig) =>
  config.adminSetNoticeRoute ?? `${config.routePrefix}adminsetnotice`;

const getDefaultSortAfterNotice = (config: CommunityBoardConfig) =>
  config.categoryOptions.find((c) => c !== BOARD_NOTICE_SORT) ?? config.categoryOptions[0] ?? '일반';

const parseImages = (images: string): string[] => {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const renderPreview = (value: string, maxLength = 40) => {
  if (!value) return '';
  if (value.length > maxLength) return `${value.substring(0, maxLength)}...`;
  return value;
};

export default function CommunityBoardManage({ config, manageTitle }: Props) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchWord, setSearchWord] = useState('');
  const [activeSearchWord, setActiveSearchWord] = useState('');
  const [editPost, setEditPost] = useState<CommunityPost | null>(null);
  const [movePost, setMovePost] = useState<CommunityPost | null>(null);
  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const listRoute = getListRoute(config);
  const deletePostRoute = getDeletePostRoute(config);
  const adminSetNoticeRoute = getAdminSetNoticeRoute(config);
  const searchRoute = config.searchRoute ?? `${config.routePrefix}getpostssearch`;
  const defaultSortAfterNotice = getDefaultSortAfterNotice(config);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = activeSearchWord
        ? await axios.post(`${MainURL}/${config.apiBase}/${searchRoute}`, {
            word: activeSearchWord,
            page: currentPage,
          })
        : await axios.get(`${MainURL}/${config.apiBase}/${listRoute}/${currentPage}`);

      if (res.data) {
        setPosts(res.data.resultData || []);
        setTotalCount(res.data.totalCount || 0);
      } else {
        setPosts([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPosts();
  }, [currentPage, activeSearchWord, config.apiBase, listRoute, searchRoute]);

  const deletePost = async (post: CommunityPost) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await axios.post(`${MainURL}/${config.apiBase}/${deletePostRoute}`, {
        postId: post.id,
        userAccount: post.userAccount,
        images: parseImages(post.images),
      });
      if (res.data) {
        alert('삭제되었습니다.');
        void fetchPosts();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSearch = () => {
    setActiveSearchWord(searchWord.trim());
    setCurrentPage(1);
  };

  const handleResetSearch = () => {
    setSearchWord('');
    setActiveSearchWord('');
    setCurrentPage(1);
  };

  const setNoticeSort = async (post: CommunityPost, register: boolean) => {
    const message = register
      ? `「${renderPreview(post.title, 30)}」 글의 종류를 '${BOARD_NOTICE_SORT}'(으)로 변경하시겠습니까?`
      : `「${renderPreview(post.title, 30)}」 글의 공지를 해제하고 종류를 '${defaultSortAfterNotice}'(으)로 변경하시겠습니까?`;

    if (!window.confirm(message)) return;

    try {
      const res = await axios.post(`${MainURL}/${config.apiBase}/${adminSetNoticeRoute}`, {
        postId: post.id,
        action: register ? 'register' : 'unregister',
        revertSort: register ? undefined : defaultSortAfterNotice,
      });

      if (res.data?.ok) {
        alert(register ? '공지로 등록되었습니다.' : '공지가 해제되었습니다.');
        void fetchPosts();
      } else {
        alert(res.data?.message || '처리에 실패했습니다.');
      }
    } catch {
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="admin-board-manage">
      <p className="admin-board-manage__desc">
        {manageTitle} 글 목록을 조회·수정·삭제·다른 게시판으로 이동할 수 있습니다.{' '}
        <a href={config.listPath} target="_blank" rel="noreferrer">
          사이트 게시판 보기
        </a>
      </p>

      <div className="admin-board-manage__search">
        <input
          type="text"
          className="admin-board-manage__search-input"
          placeholder="제목, 내용, 작성자 검색"
          value={searchWord}
          onChange={(e) => setSearchWord(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
        />
        <button type="button" className="admin-board-manage__search-btn" onClick={handleSearch}>
          검색
        </button>
        <button type="button" className="admin-board-manage__search-btn admin-board-manage__search-btn--ghost" onClick={handleResetSearch}>
          초기화
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="admin-board-manage__table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>번호</th>
                  <th>종류</th>
                  {config.regionOptions ? <th>지역</th> : null}
                  <th>제목</th>
                  <th>작성자</th>
                  <th>계정</th>
                  <th>작성일</th>
                  <th>조회</th>
                  <th>댓글</th>
                  <th className="admin-board-manage__col-actions">관리</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post, index) => (
                  <tr key={post.id}>
                    <td>{totalCount - ((currentPage - 1) * itemsPerPage + index)}</td>
                    <td>{post.sort}</td>
                    {config.regionOptions ? <td>{post.region || '-'}</td> : null}
                    <td style={{ textAlign: 'left', maxWidth: 280 }} title={post.title}>
                      {renderPreview(post.title)}
                    </td>
                    <td>{post.userNickName}</td>
                    <td className="admin-board-manage__account" title={post.userAccount}>
                      {renderPreview(post.userAccount, 28)}
                    </td>
                    <td>{DateFormmating(post.date)}</td>
                    <td>{post.views}</td>
                    <td>{post.commentCount ?? 0}</td>
                    <td className="admin-board-manage__col-actions">
                      <div className="admin-board-manage__actions">
                        <button
                          type="button"
                          className="admin-btn view-btn"
                          onClick={() => navigate(config.detailPath, { state: { data: post, sort: config.sort } })}
                        >
                          보기
                        </button>
                        <button
                          type="button"
                          className="admin-btn edit-btn"
                          onClick={() => setEditPost(post)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-board-manage__comment-btn"
                          onClick={() => setCommentPost(post)}
                        >
                          댓글
                        </button>
                        <button type="button" className="admin-btn delete-btn" onClick={() => void deletePost(post)}>
                          삭제
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-board-manage__move-btn"
                          title="다른 게시판으로 이동"
                          onClick={() => setMovePost(post)}
                        >
                          이동
                        </button>
                        <span className="admin-board-manage__actions-divider" aria-hidden />
                        {post.sort === BOARD_NOTICE_SORT ? (
                          <button
                            type="button"
                            className="admin-btn admin-board-manage__notice-btn admin-board-manage__notice-btn--off"
                            title="공지해제"
                            onClick={() => void setNoticeSort(post, false)}
                          >
                            해제
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-btn admin-board-manage__notice-btn admin-board-manage__notice-btn--on"
                            title="공지등록"
                            onClick={() => void setNoticeSort(post, true)}
                          >
                            공지
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {posts.length === 0 && (
              <p className="admin-board-manage__empty">게시글이 없습니다.</p>
            )}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      <CommunityBoardEditModal
        config={config}
        post={editPost}
        onClose={() => setEditPost(null)}
        onSaved={() => void fetchPosts()}
      />

      <CommunityBoardMoveModal
        sourceConfig={config}
        post={movePost}
        onClose={() => setMovePost(null)}
        onMoved={() => void fetchPosts()}
      />

      <CommunityBoardCommentModal
        config={config}
        post={commentPost}
        onClose={() => setCommentPost(null)}
        onSaved={() => void fetchPosts()}
      />
    </div>
  );
}
