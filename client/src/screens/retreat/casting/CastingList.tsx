import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import MainURL from '../../../MainURL';
import Loading from '../../../components/Loading';
import ScrollToTopButton from '../../../components/ScrollToTopButton';
import { recoilLoginState, recoilUserData } from '../../../RecoilStore';
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

const isVisible = (value: CastingItem['isView']) => value === true || value === 1 || value === '1' || value === 'true';

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
  const isLogin = useRecoilValue(recoilLoginState);
  const userData = useRecoilValue(recoilUserData);
  const [list, setList] = useState<CastingItem[]>([]);
  const [selectSort, setSelectSort] = useState<string>('all');
  const [searchWord, setSearchWord] = useState('');
  const [isResdataFalse, setIsResdataFalse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${MainURL}/retreatcasting/getdatacasting`);

      if (res.data.data) {
        setList([...res.data.data].reverse());
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
  }, []);

  const visibleCastings = useMemo(
    () => list.filter((item) => isVisible(item.isView)),
    [list]
  );

  const displayCastings = useMemo(() => {
    const base =
      selectSort === 'all'
        ? visibleCastings
        : visibleCastings.filter((item) => item.sort === selectSort);
    return [...base].sort((a, b) => b.id - a.id);
  }, [visibleCastings, selectSort]);

  const listTitle = selectSort === 'all' ? '전체' : selectSort;
  const hasResults = displayCastings.length > 0;

  const handleWordSearching = async () => {
    if (searchWord.trim().length < 2) {
      alert('2글자이상 입력해주세요');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${MainURL}/retreatcasting/getdatacastingsearch`, {
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

  const openCastingDetail = (id: number) => {
    if (!isLogin) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (userData.grade === '일반회원') {
      alert('등업이 필요합니다. 등업신청 게시판에서 신청해주세요');
      return;
    }

    window.scrollTo(0, 0);
    navigate(`/retreat/casting/detail?id=${id}`);
  };

  const openCastingRequest = () => {
    navigate('/retreat/casting/request');
  };

  const renderCastingCard = (subItem: CastingItem) => {
    const firstImage = getImages(subItem.images)[0];

    return (
      <div
        key={subItem.id}
        className="place__item casting__item"
        onClick={() => openCastingDetail(subItem.id)}
      >
        <div className="place__img--cover">
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
                    <div className="place__link">총{displayCastings.length}명</div>
                  </div>
                  <div className="place__wrap--item">{displayCastings.map(renderCastingCard)}</div>
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
