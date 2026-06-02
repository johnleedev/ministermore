import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { MdOutlineKeyboardDoubleArrowDown } from 'react-icons/md';
import MainURL from '../../../MainURL';
import Loading from '../../../components/Loading';
import ScrollToTopButton from '../../../components/ScrollToTopButton';
import { recoilLoginState, recoilUserData } from '../../../RecoilStore';
import './Place.scss';

interface PlaceItem {
  id: number;
  isView: string | boolean | number | null;
  placeName: string;
  sort: string;
  region: string;
  location: string;
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

const getFirstImage = (images: PlaceItem['images']) => {
  if (!images) return '';
  if (Array.isArray(images)) return images[0] || '';

  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed[0] || '' : '';
  } catch {
    return images;
  }
};

export default function PlaceList() {
  const navigate = useNavigate();
  const isLogin = useRecoilValue(recoilLoginState);
  const userData = useRecoilValue(recoilUserData);
  const [list, setList] = useState<PlaceItem[]>([]);
  const [selectRegion, setSelectRegion] = useState('all');
  const [searchWord, setSearchWord] = useState('');
  const [isResdataFalse, setIsResdataFalse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

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
    setList([]);
    setCurrentPage(1);
    setHasMore(true);
    setIsSearching(false);
    setIsResdataFalse(false);
    setTotalCount(0);
  };

  useEffect(() => {
    resetListState();
    fetchPosts(1);
  }, [selectRegion]);

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

    setIsSearching(true);
    setIsLoading(true);
    setHasMore(false);
    setCurrentPage(1);

    try {
      const res = await axios.post(`${MainURL}/retreat/getdataplacesearch`, {
        region: selectRegion,
        word: searchWord.trim(),
      });

      if (res.data.data) {
        const visible = (res.data.data as PlaceItem[]).filter(
          (item) => item.isView === true || item.isView === 1 || item.isView === '1' || item.isView === 'true'
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

  const resetSearch = () => {
    setSearchWord('');
    resetListState();
    fetchPosts(1);
  };

  const openPlaceDetail = (id: number) => {
    if (!isLogin) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (userData.grade === '일반회원') {
      alert('등업이 필요합니다. 등업신청 게시판에서 신청해주세요');
      return;
    }

    window.scrollTo(0, 0);
    navigate(`/retreat/place/detail?id=${id}`);
  };

  const openPlaceRequest = () => {
    if (!isLogin) {
      alert('권한이 없습니다. 로그인이 필요합니다.');
      return;
    }

    navigate('/retreat/place/request');
  };

  const renderPlaceCard = (subItem: PlaceItem) => {
    const firstImage = getFirstImage(subItem.images);

    return (
      <div key={subItem.id} className="place__item" onClick={() => openPlaceDetail(subItem.id)}>
        <div className="place__img--cover">
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
        </main>
      </div>
      <ScrollToTopButton />
    </div>
  );
}
