import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { MdOutlineKeyboardDoubleArrowDown } from 'react-icons/md';
import MainURL from '../../../MainURL';
import Loading from '../../../components/Loading';
import ScrollToTopButton from '../../../components/ScrollToTopButton';
import { recoilLoginState, recoilUserData } from '../../../RecoilStore';
import { fetchScrapStatusMap, scrapKeyOf, toggleScrap } from '../../mypage/scrapApi';
import type { CastingListLocationState, CastingReturnState } from './castingNavigation';
import {
  CASTING_LIST_PATH,
  clearCastingListRestore,
  loadCastingListRestore,
  saveCastingListRestore,
  shouldRestoreCastingList,
} from './castingNavigation';
import '../place/Place.scss';
import './Casting.scss';

interface CastingItem {
  id: number;
  isView: string | boolean | number | null;
  sort: string;
  name: string;
  images: string | string[] | null;
}

const CASTING_SORT_TABS = ['설교자', '찬양사역자', '특강강사', '기타'] as const;

const PAGE_SIZE = 9;
const RESTORE_TTL_MS = 10 * 60 * 1000;

const restoreScroll = (scrollY: number) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  });
};

const resolveInitialCastingReturn = (locationState: CastingListLocationState | null): CastingReturnState | null => {
  const fromRouter = locationState?.castingReturn;
  if (fromRouter) return fromRouter;
  if (shouldRestoreCastingList()) return loadCastingListRestore(RESTORE_TTL_MS);
  return null;
};

const getImages = (images: CastingItem['images']) => {
  if (!images) return [];
  if (Array.isArray(images)) return images;

  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [images];
  }
};

export default function CastingList() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialRestoreRef = useRef<CastingReturnState | null | undefined>(undefined);
  if (initialRestoreRef.current === undefined) {
    initialRestoreRef.current = resolveInitialCastingReturn(location.state as CastingListLocationState | null);
  }
  const initialRestore = initialRestoreRef.current;

  const isLogin = useRecoilValue(recoilLoginState);
  const userData = useRecoilValue(recoilUserData);
  const [list, setList] = useState<CastingItem[]>([]);
  const [selectSort, setSelectSort] = useState(initialRestore?.sort ?? 'all');
  const [searchWord, setSearchWord] = useState(initialRestore?.searchWord ?? '');
  const [isResdataFalse, setIsResdataFalse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialRestore?.currentPage ?? 1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(initialRestore?.isSearching ?? false);
  const [scrapMap, setScrapMap] = useState<Record<string, boolean>>({});
  const hasInitializedRef = useRef(false);

  const fetchPosts = async (page: number, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await axios.post(`${MainURL}/retreatcasting/getdatacasting`, {
        sort: selectSort,
        page,
        pageSize: PAGE_SIZE,
      });

      if (res.data.data) {
        const newItems = [...res.data.data] as CastingItem[];
        setList((prev) => (append ? [...prev, ...newItems] : newItems));
        setTotalCount(res.data.count ?? 0);
        setIsResdataFalse(false);
        setHasMore(newItems.length >= PAGE_SIZE);
      } else {
        if (!append) {
          setList([]);
          setTotalCount(res.data.count ?? 0);
          setIsResdataFalse(true);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error(error);
      if (!append) {
        setList([]);
        setIsResdataFalse(true);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const resetListState = () => {
    clearCastingListRestore();
    setList([]);
    setCurrentPage(1);
    setHasMore(true);
    setIsSearching(false);
    setIsResdataFalse(false);
    setTotalCount(0);
  };

  const restoreListPages = async (targetPage: number, scrollY: number) => {
    setIsLoading(true);
    try {
      let allItems: CastingItem[] = [];
      let count = 0;
      let lastPageHasMore = true;

      for (let page = 1; page <= targetPage; page++) {
        const res = await axios.post(`${MainURL}/retreatcasting/getdatacasting`, {
          sort: selectSort,
          page,
          pageSize: PAGE_SIZE,
        });

        if (res.data.data) {
          const newItems = [...res.data.data] as CastingItem[];
          allItems = [...allItems, ...newItems];
          count = res.data.count ?? 0;
          lastPageHasMore = newItems.length >= PAGE_SIZE;
        } else {
          lastPageHasMore = false;
          if (page === 1) {
            count = res.data.count ?? 0;
          }
          break;
        }
      }

      setList(allItems);
      setTotalCount(count);
      setHasMore(lastPageHasMore);
      setIsResdataFalse(allItems.length === 0);
      setCurrentPage(targetPage);
      restoreScroll(scrollY);
    } catch (error) {
      console.error(error);
      setList([]);
      setIsResdataFalse(true);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  const runSearch = async (word: string) => {
    const trimmed = word.trim();
    if (trimmed.length < 2) return;

    setIsSearching(true);
    setIsLoading(true);
    setHasMore(false);
    setCurrentPage(1);

    try {
      const res = await axios.post(`${MainURL}/retreatcasting/getdatacastingsearch`, {
        word: trimmed,
      });

      if (res.data.data) {
        const visible = (res.data.data as CastingItem[]).filter(
          (item) => item.isView === true || item.isView === 1 || item.isView === '1' || item.isView === 'true',
        );
        const filtered =
          selectSort === 'all' ? visible : visible.filter((item) => item.sort === selectSort);
        setList(filtered);
        setTotalCount(filtered.length);
        setIsResdataFalse(false);
      } else {
        setList([]);
        setTotalCount(0);
        setIsResdataFalse(true);
      }
    } catch (error) {
      console.error(error);
      setList([]);
      setIsResdataFalse(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const restored = initialRestore;

      const restoredSearchWord = restored?.searchWord?.trim() ?? '';
      if (restored?.isSearching && restoredSearchWord.length >= 2) {
        void runSearch(restoredSearchWord).then(() => {
          if (restored.scrollY) {
            restoreScroll(restored.scrollY);
          }
        });
        clearCastingListRestore();
        navigate(CASTING_LIST_PATH, { replace: true, state: {} });
        return;
      }

      const shouldRestoreList =
        restored && ((restored.scrollY ?? 0) > 0 || (restored.currentPage ?? 1) > 1);

      if (shouldRestoreList) {
        const targetPage = restored.currentPage ?? 1;
        const scrollY = restored.scrollY ?? 0;
        setCurrentPage(targetPage);
        void restoreListPages(targetPage, scrollY);
        clearCastingListRestore();
        navigate(CASTING_LIST_PATH, { replace: true, state: {} });
        return;
      }

      if (restored) {
        navigate(CASTING_LIST_PATH, { replace: true, state: {} });
      }
    }

    resetListState();
    fetchPosts(1);
  }, [selectSort]);

  useEffect(() => {
    if (!userData.userAccount || list.length === 0) {
      setScrapMap({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const targets = list.map(item => ({
          targetType: 'retreat_casting' as const,
          targetId: String(item.id),
          tableType: '',
        }));
        const map = await fetchScrapStatusMap(userData.userAccount, targets);
        if (!cancelled) setScrapMap(map);
      } catch {
        if (!cancelled) setScrapMap({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userData.userAccount, list]);

  const toggleCastingScrap = async (item: CastingItem, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!isLogin || !userData.userAccount) {
      alert('로그인이 필요합니다.');
      return;
    }
    const payload = {
      targetType: 'retreat_casting' as const,
      targetId: String(item.id),
      tableType: '',
      title: item.name,
      subtitle: item.sort,
      meta: '',
      linkPath: `/retreat/casting/detail?id=${item.id}`,
    };
    const key = scrapKeyOf(payload);
    const before = Boolean(scrapMap[key]);
    setScrapMap(prev => ({ ...prev, [key]: !before }));
    try {
      const res = await toggleScrap(userData.userAccount, payload);
      setScrapMap(prev => ({ ...prev, [key]: res.scrapped }));
    } catch {
      setScrapMap(prev => ({ ...prev, [key]: before }));
      alert('스크랩 처리에 실패했습니다.');
    }
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchPosts(nextPage, true);
  };

  const listTitle = selectSort === 'all' ? '전체' : selectSort;
  const hasResults = list.length > 0;

  const handleWordSearching = async () => {
    if (searchWord.trim().length < 2) {
      alert('2글자이상 입력해주세요');
      return;
    }

    await runSearch(searchWord);
  };

  const resetSearch = () => {
    setSearchWord('');
    resetListState();
    fetchPosts(1);
  };

  const openCastingDetail = (id: number) => {
    if (!isLogin) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (userData.grade === '일반회원') {
      alert('등업이 필요합니다. 등업신청 게시판에서 신청해주세요');
      return;
    }

    const returnState: CastingReturnState = {
      sort: selectSort,
      searchWord,
      isSearching,
      scrollY: window.scrollY,
      currentPage,
    };
    saveCastingListRestore(returnState);
    window.scrollTo(0, 0);
    navigate(`/retreat/casting/detail?id=${id}`, {
      state: { castingReturn: returnState },
    });
  };

  const openCastingRequest = () => {
    navigate('/retreat/casting/request');
  };

  const renderCastingCard = (subItem: CastingItem) => {
    const firstImage = getImages(subItem.images)[0];

    const scrapActive = scrapMap[scrapKeyOf({ targetType: 'retreat_casting', targetId: String(subItem.id), tableType: '' })];

    return (
      <div
        key={subItem.id}
        className="place__item casting__item"
        onClick={() => openCastingDetail(subItem.id)}
      >
        <div className="place__img--cover">
          <button
            type="button"
            onClick={(e) => void toggleCastingScrap(subItem, e)}
            style={{
              position: 'absolute',
              right: 10,
              top: 10,
              zIndex: 3,
              border: 'none',
              background: 'rgba(255,255,255,0.55)',
              borderRadius: '50%',
              width: 24,
              height: 24,
              padding: 0,
              margin: 0,
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
              color: scrapActive ? '#ef4444' : '#9ca3af',
            }}
            aria-label="스크랩">
            {scrapActive ? '♥' : '♡'}
          </button>
          <div className="imageBox">
            {firstImage ? (
              <img src={`${MainURL}/images/retreat/castingimage/${firstImage}`} alt={subItem.name} />
            ) : (
              <p style={{ fontSize: '14px' }}>등록된 사진이 없습니다.</p>
            )}
          </div>
        </div>
        <div className="place__coname">
          <p>{subItem.name}</p>
        </div>
        <div className="place__name">
          <p>구분: {subItem.sort}</p>
        </div>
      </div>
    );
  };

  const renderLoadMoreButton = () =>
    !isSearching && hasMore && list.length > 0 ? (
      <div
        className="addFetchBtn"
        onClick={isLoadingMore ? undefined : handleLoadMore}
        style={isLoadingMore ? { opacity: 0.6, cursor: 'wait' } : undefined}
      >
        <p>{isLoadingMore ? '불러오는 중...' : '더보기'}</p>
        {!isLoadingMore && <MdOutlineKeyboardDoubleArrowDown color="#9c9c9c" />}
      </div>
    ) : null;

  return (
    <div className="retreat casting">
      <div className="inner">
        <main className="subpage__main">
          <div className="subpage__main__title">
            <h3>수련회강사</h3>
            <div className="place__detail-actions">
              <button className="btn btn--primary" type="button" onClick={openCastingRequest}>
                강사등록요청
              </button>
            </div>
          </div>

          <div className="place__region-tabs">
            <button
              type="button"
              className={selectSort === 'all' ? 'place__region-tab place__region-tab--on' : 'place__region-tab'}
              onClick={() => setSelectSort('all')}
            >
              전체
            </button>
            {CASTING_SORT_TABS.map((sort) => (
              <button
                type="button"
                key={sort}
                className={selectSort === sort ? 'place__region-tab place__region-tab--on' : 'place__region-tab'}
                onClick={() => setSelectSort(sort)}
              >
                {sort}
              </button>
            ))}
          </div>

          <div className="subpage__main__search">
            <div className="subpage__main__search__box">
              <div className="search__label">
                <span>강사 검색</span>
                <p>강사명을 입력해주세요.</p>
              </div>
              <div className="search__control">
                <input
                  className="inputdefault width"
                  type="text"
                  placeholder="예: 홍길동, 찬양사역자"
                  value={searchWord}
                  onChange={(e) => setSearchWord(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleWordSearching();
                  }}
                />
                <button className="btn btn--primary" type="button" onClick={handleWordSearching}>
                  검색
                </button>
                <button className="btn btn--secondary" type="button" onClick={resetSearch}>
                  초기화
                </button>
              </div>
            </div>
          </div>

          <div className="subpage__main__content">
            <div className="main__content">
              {isLoading ? (
                <div className="list-loading">
                  <Loading />
                </div>
              ) : hasResults && !isResdataFalse ? (
                <div className="place__wrap--category" data-aos="fade-up">
                  <div className="place__title__row">
                    <div className="place__title">{listTitle}</div>
                    <div className="place__link">총{totalCount}명</div>
                  </div>
                  <div className="place__wrap--item">{list.map(renderCastingCard)}</div>
                  {renderLoadMoreButton()}
                </div>
              ) : (
                <div className="place__wrap--category" data-aos="fade-up">
                  <div className="place__title">검색 결과가 없습니다.</div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <ScrollToTopButton />
    </div>
  );
}
