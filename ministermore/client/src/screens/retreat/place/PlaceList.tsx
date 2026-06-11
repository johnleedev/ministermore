import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { MdOutlineKeyboardDoubleArrowDown } from 'react-icons/md';
import MainURL from '../../../MainURL';
import Loading from '../../../components/Loading';
import ScrollToTopButton from '../../../components/ScrollToTopButton';
import { recoilLoginState, recoilUserData } from '../../../RecoilStore';
import { fetchScrapStatusMap, scrapKeyOf, toggleScrap } from '../../mypage/scrapApi';
import PlaceListMap from './PlaceListMap';
import { getFirstImage } from './placeImage';
import type { PlaceListLocationState, PlaceListViewMode, PlaceReturnState } from './placeNavigation';
import {
  PLACE_LIST_PATH,
  clearPlaceListRestore,
  loadPlaceListRestore,
  savePlaceListRestore,
  shouldRestorePlaceList,
} from './placeNavigation';
import './Place.scss';

type ViewMode = PlaceListViewMode;

interface PlaceItem {
  id: number;
  isView: string | boolean | number | null;
  placeName: string;
  sort: string;
  region: string;
  location: string;
  address?: string;
  size: string;
  images: string | string[] | null;
}

const regionRoutes: Record<string, string> = {
  '서울/경기도': '/retreat/place?region=서울/경기도',
  강원도: '/retreat/place?region=강원도',
  '대전/충청도': '/retreat/place?region=대전/충청도',
  '광주/전라도': '/retreat/place?region=광주/전라도',
  '대구/부산/경상도': '/retreat/place?region=대구/부산/경상도',
  제주도: '/retreat/place?region=제주도',
};

const PAGE_SIZE = 9;
const RESTORE_TTL_MS = 10 * 60 * 1000;

const restoreScroll = (scrollY: number) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  });
};

const resolveInitialPlaceReturn = (locationState: PlaceListLocationState | null): PlaceReturnState | null => {
  const fromRouter = locationState?.placeReturn;
  if (fromRouter) return fromRouter;
  if (shouldRestorePlaceList()) return loadPlaceListRestore(RESTORE_TTL_MS);
  return null;
};

export default function PlaceList() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialRestoreRef = useRef<PlaceReturnState | null | undefined>(undefined);
  if (initialRestoreRef.current === undefined) {
    initialRestoreRef.current = resolveInitialPlaceReturn(location.state as PlaceListLocationState | null);
  }
  const initialRestore = initialRestoreRef.current;

  const isLogin = useRecoilValue(recoilLoginState);
  const userData = useRecoilValue(recoilUserData);
  const [viewMode, setViewMode] = useState<ViewMode>(initialRestore?.viewMode ?? 'list');
  const [list, setList] = useState<PlaceItem[]>([]);
  const [selectRegion, setSelectRegion] = useState(initialRestore?.region ?? 'all');
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
      const res = await axios.post(`${MainURL}/retreat/getdataplace`, {
        region: selectRegion,
        sort: 'all',
        page,
        pageSize: PAGE_SIZE,
      });

      if (res.data.data) {
        const newItems = [...res.data.data] as PlaceItem[];
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
    clearPlaceListRestore();
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
      let allItems: PlaceItem[] = [];
      let count = 0;
      let lastPageHasMore = true;

      for (let page = 1; page <= targetPage; page++) {
        const res = await axios.post(`${MainURL}/retreat/getdataplace`, {
          region: selectRegion,
          sort: 'all',
          page,
          pageSize: PAGE_SIZE,
        });

        if (res.data.data) {
          const newItems = [...res.data.data] as PlaceItem[];
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
      const res = await axios.post(`${MainURL}/retreat/getdataplacesearch`, {
        region: selectRegion,
        word: trimmed,
      });

      if (res.data.data) {
        const visible = (res.data.data as PlaceItem[]).filter(
          (item) => item.isView === true || item.isView === 1 || item.isView === '1' || item.isView === 'true',
        );
        setList(visible);
        setTotalCount(visible.length);
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
        clearPlaceListRestore();
        navigate(PLACE_LIST_PATH, { replace: true, state: {} });
        return;
      }

      if (restored?.viewMode === 'map') {
        clearPlaceListRestore();
        navigate(PLACE_LIST_PATH, { replace: true, state: {} });
        resetListState();
        fetchPosts(1);
        return;
      }

      const shouldRestoreList =
        restored && ((restored.scrollY ?? 0) > 0 || (restored.currentPage ?? 1) > 1);

      if (shouldRestoreList) {
        const targetPage = restored.currentPage ?? 1;
        const scrollY = restored.scrollY ?? 0;
        setCurrentPage(targetPage);
        void restoreListPages(targetPage, scrollY);
        clearPlaceListRestore();
        navigate(PLACE_LIST_PATH, { replace: true, state: {} });
        return;
      }

      if (restored) {
        navigate(PLACE_LIST_PATH, { replace: true, state: {} });
      }
    }

    resetListState();
    fetchPosts(1);
  }, [selectRegion]);

  useEffect(() => {
    if (!userData.userAccount || list.length === 0) {
      setScrapMap({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const targets = list.map(item => ({
          targetType: 'retreat_place' as const,
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

  const togglePlaceScrap = async (item: PlaceItem, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!isLogin || !userData.userAccount) {
      alert('로그인이 필요합니다.');
      return;
    }
    const payload = {
      targetType: 'retreat_place' as const,
      targetId: String(item.id),
      tableType: '',
      title: item.placeName,
      subtitle: item.sort,
      meta: item.location,
      linkPath: `/retreat/place/detail?id=${item.id}`,
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

  const listTitle = selectRegion === 'all' ? '전체' : selectRegion;
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

  const openPlaceDetail = useCallback((id: number) => {
    if (!isLogin) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (userData.grade === '일반회원') {
      alert('등업이 필요합니다. 등업신청 게시판에서 신청해주세요');
      return;
    }

    const returnState: PlaceReturnState = {
      viewMode,
      region: selectRegion,
      searchWord,
      isSearching,
      scrollY: window.scrollY,
      currentPage,
    };
    savePlaceListRestore(returnState);
    window.scrollTo(0, 0);
    navigate(`/retreat/place/detail?id=${id}`, {
      state: { placeReturn: returnState },
    });
  }, [isLogin, userData.grade, navigate, viewMode, selectRegion, searchWord, isSearching, currentPage]);

  const handleMapMarkerClick = useCallback(
    (id: number) => {
      openPlaceDetail(id);
    },
    [openPlaceDetail],
  );

  const openPlaceRequest = () => {
    if (!isLogin) {
      alert('권한이 없습니다. 로그인이 필요합니다.');
      return;
    }

    navigate('/retreat/place/request');
  };

  const renderPlaceCard = (subItem: PlaceItem) => {
    const firstImage = getFirstImage(subItem.images);

    const scrapActive = scrapMap[scrapKeyOf({ targetType: 'retreat_place', targetId: String(subItem.id), tableType: '' })];

    return (
      <div key={subItem.id} className="place__item" onClick={() => openPlaceDetail(subItem.id)}>
        <div className="place__img--cover">
          <button
            type="button"
            onClick={(e) => void togglePlaceScrap(subItem, e)}
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
          <div className="namecard">
            <p>{subItem.location}</p>
          </div>
          <div className="imageBox">
            {firstImage ? (
              <img src={`${MainURL}/images/retreat/placeimage/${firstImage}`} alt={subItem.placeName} />
            ) : (
              <p style={{ fontSize: '14px' }}>등록된 사진이 없습니다.</p>
            )}
          </div>
        </div>
        <div className="place__coname">
          <p>{subItem.placeName}</p>
        </div>
        <div className="place__name">
          <p>종류: {subItem.sort}</p>
          <p>규모: {subItem.size}</p>
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
    <div className="retreat">
      <div className="inner">
        <main className="subpage__main">
          <div className="subpage__main__title">
            <h3>수련회장소</h3>
            <div className="place__detail-actions">
              <button className="btn btn--primary" type="button" onClick={openPlaceRequest}>
                장소등록요청
              </button>
            </div>
          </div>

          <div className="place__view-tabs">
            <button
              type="button"
              className={viewMode === 'list' ? 'place__view-tab place__view-tab--on' : 'place__view-tab'}
              onClick={() => setViewMode('list')}
            >
              목록으로 보기
            </button>
            <button
              type="button"
              className={viewMode === 'map' ? 'place__view-tab place__view-tab--on' : 'place__view-tab'}
              onClick={() => setViewMode('map')}
            >
              지도에서 보기
            </button>
          </div>

          {viewMode === 'list' && (
            <>
              <div className="place__region-tabs">
                <button
                  type="button"
                  className={selectRegion === 'all' ? 'place__region-tab place__region-tab--on' : 'place__region-tab'}
                  onClick={() => setSelectRegion('all')}
                >
                  전체
                </button>
                {Object.keys(regionRoutes).map((region) => (
                  <button
                    type="button"
                    key={region}
                    className={selectRegion === region ? 'place__region-tab place__region-tab--on' : 'place__region-tab'}
                    onClick={() => setSelectRegion(region)}
                  >
                    {region}
                  </button>
                ))}
              </div>

              <div className="subpage__main__search">
                <div className="subpage__main__search__box">
                  <div className="search__label">
                    <span>장소 검색</span>
                    <p>장소명 또는 주소를 입력해주세요.</p>
                  </div>
                  <div className="search__control">
                    <input
                      className="inputdefault width"
                      type="text"
                      placeholder="예: 가평, 수련원, 교회명"
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
            </>
          )}

          {viewMode === 'map' ? (
            isLoading ? (
              <div className="place__map-section">
                <div className="place__map-loading">
                  <Loading />
                  <p className="place__map-loading__text">수련회 목록과 지도를 불러오는 중입니다</p>
                </div>
              </div>
            ) : (
              <PlaceListMap
                region="all"
                places={list}
                isSearching={false}
                onMarkerClick={handleMapMarkerClick}
              />
            )
          ) : (
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
                      <div className="place__link">총{totalCount}개</div>
                    </div>
                    <div className="place__wrap--item">{list.map(renderPlaceCard)}</div>
                    {renderLoadMoreButton()}
                  </div>
                ) : (
                  <div className="place__wrap--category" data-aos="fade-up">
                    <div className="place__title">검색 결과가 없습니다.</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      <ScrollToTopButton />
    </div>
  );
}
