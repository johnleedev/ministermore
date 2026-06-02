import { useCallback, useEffect, useState } from 'react';
import './Board.scss';
import '../recruit/common/RecruitList.scss';
import MainURL from '../../MainURL';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import DateFormmating from '../../components/DateFormmating';
import Pagination from '../../components/Pagination';
import Loading from '../../components/Loading';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import { useRecoilValue } from 'recoil';
import { recoilLoginState } from '../../RecoilStore';
import '../ForListPage.scss';
import type { CommunityBoardConfig, CommunityPost } from './BoardTypes';
import { isBoardNoticePost, parseBoardListPayload } from './boardListUtils';
import {
  MdOutlineCalendarToday,
  MdOutlineCategory,
  MdOutlineNumbers,
  MdOutlinePerson,
  MdOutlineVisibility,
} from 'react-icons/md';

type Props = {
  config: CommunityBoardConfig;
};

const getListRoute = (config: CommunityBoardConfig) => config.listRoute ?? `${config.routePrefix}getposts`;
const getSearchRoute = (config: CommunityBoardConfig) =>
  config.searchRoute ?? `${config.routePrefix}getpostssearch`;
const getViewsRoute = (config: CommunityBoardConfig) => config.viewsRoute ?? `${config.routePrefix}postsviews`;

export default function BoardList({ config }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = useRecoilValue(recoilLoginState);
  const hasRegion = Boolean(config.regionOptions?.length);

  const [currentPage, setCurrentPage] = useState(1);
  const [noticeList, setNoticeList] = useState<CommunityPost[]>([]);
  const [list, setList] = useState<CommunityPost[]>([]);
  const [listAllLength, setListAllLength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  /** null = 해당 행에서 「전체」 선택 */
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(listAllLength / itemsPerPage);
  const listRoute = getListRoute(config);
  const searchRoute = getSearchRoute(config);
  const viewsRoute = getViewsRoute(config);
  const isFiltering = activeCategory != null || activeRegion != null;

  const fetchDatas = useCallback(
    async (
      page: number,
      categories: string[],
      regions: string[],
    ) => {
      setIsLoading(true);
      const hasFilter = categories.length > 0 || regions.length > 0;
      try {
        const res = hasFilter
          ? await axios.post(`${MainURL}/${config.apiBase}/${searchRoute}`, {
              word: '',
              categories,
              regions,
              page,
            })
          : await axios.get(`${MainURL}/${config.apiBase}/${listRoute}/${page}`);

        if (res.data) {
          const { notices, regular } = parseBoardListPayload(
            res.data.resultData as CommunityPost[],
            res.data.noticePosts as CommunityPost[],
          );
          setNoticeList(notices);
          setList(regular);
          setListAllLength(res.data.totalCount || 0);
        } else {
          setNoticeList([]);
          setList([]);
          setListAllLength(0);
        }
      } catch (error) {
        console.error(error);
        setNoticeList([]);
        setList([]);
        setListAllLength(0);
      } finally {
        setIsLoading(false);
      }
    },
    [config.apiBase, listRoute, searchRoute],
  );

  useEffect(() => {
    const categories = activeCategory ? [activeCategory] : [];
    const regions = activeRegion ? [activeRegion] : [];
    void fetchDatas(currentPage, categories, regions);
  }, [currentPage, activeCategory, activeRegion, fetchDatas]);

  const renderPreview = (value: string) => {
    if (value?.length > 45) {
      return `${value.substring(0, 45)}...`;
    }
    return value;
  };

  const renderContentPreview = (value: string) => {
    if (!value) return '';
    const plain = value
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return plain;
  };

  const openPostDetails = (post: CommunityPost) => {
    axios
      .post(`${MainURL}/${config.apiBase}/${viewsRoute}`, {
        postId: post.id,
        sort: config.sort,
      })
      .then(() => {
        window.scrollTo(0, 0);
        navigate(config.detailPath, { state: { data: post, sort: config.sort, menuNum: 1 } });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const openPostPage = () => {
    if (!isLogin) {
      alert('권한이 없습니다. 로그인이 필요합니다.');
    } else {
      navigate(config.postPath);
    }
  };

  const handleCategorySelect = (item: string) => {
    if (item === '전체') {
      setActiveCategory(null);
    } else {
      setActiveCategory((prev) => (prev === item ? null : item));
    }
    setCurrentPage(1);
  };

  const displayList = [...noticeList, ...list];

  const handleRegionSelect = (item: string) => {
    if (item === '전체') {
      setActiveRegion(null);
    } else {
      setActiveRegion((prev) => (prev === item ? null : item));
    }
    setCurrentPage(1);
  };

  const renderFilterChip = (
    key: string,
    label: string,
    selected: boolean,
    onActivate: () => void,
    isAll = false,
  ) => (
    <button
      key={key}
      type="button"
      className={[
        'board-list__filter-chip',
        isAll ? 'board-list__filter-chip--all' : '',
        selected ? 'is-selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onActivate}
      aria-pressed={selected}
    >
      {label}
    </button>
  );

  return (
    <div className="Board recruit">
      <div className="inner">
        <div className="subpage__main">
          <div className="subpage__main__title">
            <h3>{config.boardTitle}</h3>
            <div className="postBtn" onClick={openPostPage}>
              <p>글쓰기</p>
            </div>
          </div>

          <div className="board-list__filters">
            <div className="board-list__filter-row">
              <span className="board-list__filter-label">구분:</span>
              <div className="board-list__filter-chips">
                {renderFilterChip(
                  'category-all',
                  '전체',
                  activeCategory === null,
                  () => handleCategorySelect('전체'),
                  true,
                )}
                {config.categoryOptions.map((item) =>
                  renderFilterChip(
                    `category-${item}`,
                    item,
                    activeCategory === item,
                    () => handleCategorySelect(item),
                  ),
                )}
              </div>
            </div>
            {hasRegion && (
              <div className="board-list__filter-row">
                <span className="board-list__filter-label">지역:</span>
                <div className="board-list__filter-chips">
                  {renderFilterChip(
                    'region-all',
                    '전체',
                    activeRegion === null,
                    () => handleRegionSelect('전체'),
                    true,
                  )}
                  {(config.regionOptions ?? []).map((item) =>
                    renderFilterChip(
                      `region-${item}`,
                      item,
                      activeRegion === item,
                      () => handleRegionSelect(item),
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="subpage__main__content">
            {isLoading ? (
              <div className="list-loading">
                <Loading />
              </div>
            ) : (
              <div className="main__content">
                <div className="community-board__wrap">
                  <div className="community-board__menu">
                    <div className="community-board__col community-board__col--num">
                      <p>번호</p>
                    </div>
                    <div className="community-board__col community-board__col--sort">
                      <p>구분</p>
                    </div>
                    <div className="community-board__col community-board__col--title">
                      <p>제목</p>
                    </div>
                    <div className="community-board__col community-board__col--name">
                      <p>글쓴이</p>
                    </div>
                    <div className="community-board__col community-board__col--date">
                      <p>등록일</p>
                    </div>
                    <div className="community-board__col community-board__col--views">
                      <p>조회수</p>
                    </div>
                  </div>
                  <div className="community-board__list">
                    {displayList.length > 0 ? (
                      displayList.map((item) => {
                        const contentPreview = renderContentPreview(item.content);
                        const isNotice = isBoardNoticePost(item);
                        return (
                          <div
                            className={
                              isNotice
                                ? 'community-board__item community-board__item--notice'
                                : 'community-board__item'
                            }
                            key={item.id}
                            onClick={() => openPostDetails(item)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') openPostDetails(item);
                            }}
                            role="button"
                            tabIndex={0}
                          >
                          <div className="community-board__tags-row">
                            <div className="community-board__col community-board__col--num">
                              <span className="community-board__icon" aria-hidden>
                                <MdOutlineNumbers />
                              </span>
                              <p>{item.id}</p>
                            </div>
                            <div className="community-board__col community-board__col--sort">
                              <span className="community-board__icon" aria-hidden>
                                <MdOutlineCategory />
                              </span>
                              <p>{item.sort}</p>
                            </div>
                          </div>
                          <div className="community-board__col community-board__col--title">
                            <p>
                              {renderPreview(item.title)}
                              {item.commentCount ? (
                                <span className="community-board__comment"> [{item.commentCount}]</span>
                              ) : null}
                            </p>
                          </div>
                          {contentPreview ? (
                            <p className="community-board__content">{contentPreview}</p>
                          ) : null}
                          <div className="community-board__meta">
                            <div className="community-board__col community-board__col--name">
                              <span className="community-board__icon" aria-hidden>
                                <MdOutlinePerson />
                              </span>
                              <p>{item.userNickName}</p>
                            </div>
                            <div className="community-board__col community-board__col--date">
                              <span className="community-board__icon" aria-hidden>
                                <MdOutlineCalendarToday />
                              </span>
                              <p>{DateFormmating(item.date)}</p>
                            </div>
                            <div className="community-board__col community-board__col--views">
                              <span className="community-board__icon" aria-hidden>
                                <MdOutlineVisibility />
                              </span>
                              <p>{item.views}</p>
                            </div>
                          </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="community-board__empty">
                        {isFiltering ? '검색 결과가 없습니다.' : '등록된 글이 없습니다.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
}
