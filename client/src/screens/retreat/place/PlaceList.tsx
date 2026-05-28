import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
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

interface PlaceGroup {
  region: string;
  placeList: PlaceItem[];
}

const regionRoutes: Record<string, string> = {
  '서울/경기도': '/retreat/place?region=서울/경기도',
  강원도: '/retreat/place?region=강원도',
  '대전/충청도': '/retreat/place?region=대전/충청도',
  '광주/전라도': '/retreat/place?region=광주/전라도',
  '대구/부산/경상도': '/retreat/place?region=대구/부산/경상도',
  제주도: '/retreat/place?region=제주도',
};

const isVisible = (value: PlaceItem['isView']) => value === true || value === 1 || value === '1' || value === 'true';

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

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${MainURL}/retreat/getdataplace`, {
        region: selectRegion,
        sort: 'all',
      });

      if (res.data.data) {
        const copy = [...res.data.data].reverse();
        setList(copy);
        setIsResdataFalse(false);
      } else {
        setList([]);
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
    fetchPosts();
  }, [selectRegion]);

  const visiblePlaces = useMemo(
    () => list.filter((item) => isVisible(item.isView)),
    [list]
  );

  /** 전체 탭: 지역 구분 없이 최신순(id 내림차순) */
  const allPlacesNewest = useMemo(
    () => [...visiblePlaces].sort((a, b) => b.id - a.id),
    [visiblePlaces]
  );

  /** 지역 탭: 지역별 그룹 */
  const placeDataByRegion = useMemo(() => {
    return visiblePlaces
      .reduce((acc: PlaceGroup[], curr) => {
        const existingGroup = acc.find((group) => group.region === curr.region);
        if (existingGroup) {
          existingGroup.placeList.push(curr);
        } else {
          acc.push({
            region: curr.region,
            placeList: [curr],
          });
        }
        return acc;
      }, [])
      .sort((a, b) => a.region.localeCompare(b.region));
  }, [visiblePlaces]);

  const hasResults =
    selectRegion === 'all' ? allPlacesNewest.length > 0 : placeDataByRegion.length > 0;

  const handleWordSearching = async () => {
    if (searchWord.trim().length < 2) {
      alert('2글자이상 입력해주세요');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${MainURL}/retreat/getdataplacesearch`, {
        region: selectRegion,
        word: searchWord.trim(),
      });

      if (res.data.data) {
        setList(res.data.data);
        setIsResdataFalse(false);
      } else {
        setList([]);
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
    fetchPosts();
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
                selectRegion === 'all' ? (
                  <div className="place__wrap--category" data-aos="fade-up">
                    <div className="place__title__row">
                      <div className="place__title">전체</div>
                      <div className="place__link">총{allPlacesNewest.length}개</div>
                    </div>
                    <div className="place__wrap--item">{allPlacesNewest.map(renderPlaceCard)}</div>
                  </div>
                ) : (
                  placeDataByRegion.map((item) => (
                  <div key={item.region} className="place__wrap--category" data-aos="fade-up">
                    <div className="place__title__row">
                      <div className="place__title">{item.region}</div>
                      <div className="place__link">
                        총{item.placeList.length}개
                      </div>
                    </div>
                    <div className="place__wrap--item">{item.placeList.map(renderPlaceCard)}</div>
                  </div>
                  ))
                )
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