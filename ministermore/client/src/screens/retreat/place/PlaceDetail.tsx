import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Swiper as SwiperType } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y } from 'swiper/modules';
import 'swiper/css';
import MainURL from '../../../MainURL';
import type { PlaceDetailLocationState } from './placeNavigation';
import { PLACE_LIST_PATH } from './placeNavigation';
import './Place.scss';

interface PlaceDetailData {
  id: number;
  placeName: string;
  sort: string;
  region: string;
  location: string;
  size: string;
  address: string;
  homepage: string;
  phone: string;
  images: string | string[] | null;
}

const parseImages = (images: PlaceDetailData['images']) => {
  if (!images) return [];
  if (Array.isArray(images)) return images;

  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [images];
  }
};

export default function PlaceDetail() {
  const url = new URL(window.location.href);
  const id = url.searchParams.get('id');
  const navigate = useNavigate();
  const location = useLocation();
  const placeReturn = (location.state as PlaceDetailLocationState | null)?.placeReturn;
  const mapElement = useRef<HTMLDivElement | null>(null);
  const thumbnailSwiperRef = useRef<SwiperType | null>(null);
  const { naver } = window;

  const [detailData, setDetailData] = useState<PlaceDetailData>();
  const [images, setImages] = useState<string[]>([]);
  const [selectImage, setSelectImage] = useState('');
  const [mapLoaded, setMapLoaded] = useState(true);

  const addressAPI = async (addressQuery: string) => {
    if (!addressQuery) return;

    try {
      const response = await axios.post(`${MainURL}/retreat/geocode`, {
        address: addressQuery,
      });

      if (response.data.success && response.data.coordinates) {
        const { latitude, longitude } = response.data.coordinates;

        if (!mapElement.current || !naver) {
          setMapLoaded(false);
          return;
        }

        const location = new naver.maps.LatLng(latitude, longitude);
        const mapOptions = {
          center: location,
          zoom: 12,
          zoomControl: true,
        };
        const map = new naver.maps.Map(mapElement.current, mapOptions);
        new naver.maps.Marker({
          position: location,
          map,
        });
        setMapLoaded(true);
      } else {
        setMapLoaded(false);
      }
    } catch (error) {
      console.error('지오코딩 API 오류:', error);
      setMapLoaded(false);
    }
  };

  const fetchPosts = async () => {
    if (!id) return;

    try {
      const res = await axios.post(`${MainURL}/retreat/getdataplacepart`, { id });

      if (res.data && res.data[0]) {
        const copy = { ...res.data[0] };
        const imageList = parseImages(copy.images);
        setDetailData(copy);
        setImages(imageList);
        setSelectImage(imageList[0] || '');
        addressAPI(copy.address || '');
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const currentImageIndex = images.length > 0 ? Math.max(0, images.indexOf(selectImage)) : 0;

  const changeMainImage = (direction: 'prev' | 'next') => {
    if (images.length === 0) return;
    const nextIndex =
      direction === 'prev'
        ? (currentImageIndex - 1 + images.length) % images.length
        : (currentImageIndex + 1) % images.length;
    setSelectImage(images[nextIndex]);
    thumbnailSwiperRef.current?.slideTo(nextIndex);
  };

  const selectThumbnail = (fileName: string) => {
    setSelectImage(fileName);
    const index = images.indexOf(fileName);
    if (index >= 0) {
      thumbnailSwiperRef.current?.slideTo(index);
    }
  };

  const goBackToList = () => {
    if (placeReturn) {
      navigate(PLACE_LIST_PATH, { state: { placeReturn } });
      return;
    }

    navigate(PLACE_LIST_PATH);
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(url.href)
      .then(() => {
        alert('현재 링크 주소가 복사되었습니다.');
      })
      .catch((err) => {
        console.error('복사에 실패했습니다.', err);
      });
  };

  return (
    <div className="retreat">
      <div className="inner">
        <main className="subpage__main">
          <div className="subpage__main__title">
            <h3>{detailData?.placeName || '수련회장소'}</h3>
            <div className="place__detail-actions">
              <button className="btn btn--secondary" type="button" onClick={goBackToList}>
                목록으로
              </button>
              {/* <button className="btn btn--primary" type="button" onClick={handleCopy}>
                공유하기
              </button> */}
            </div>
          </div>

          <div className="subpage__main__content">
            <div className="main__content">
              <div className="imagearea desktop">
                <div className="imagearea__hero">
                  {images.length > 1 && (
                    <button
                      type="button"
                      className="imagearea__nav imagearea__nav--prev"
                      aria-label="이전 사진"
                      onClick={() => changeMainImage('prev')}
                    />
                  )}
                  <div className="mainimage">
                  {selectImage ? (
                    <img src={`${MainURL}/images/retreat/placeimage/${selectImage}`} alt={detailData?.placeName || '수련회장소'} />
                  ) : (
                    <p>등록된 사진이 없습니다.</p>
                  )}
                  </div>
                  {images.length > 1 && (
                    <button
                      type="button"
                      className="imagearea__nav imagearea__nav--next"
                      aria-label="다음 사진"
                      onClick={() => changeMainImage('next')}
                    />
                  )}
                </div>

                {images.length > 0 && (
                  <Swiper
                    modules={[A11y]}
                    spaceBetween={8}
                    slidesPerView={8}
                    className="swiperimagerow"
                    onSwiper={(swiper: SwiperType) => {
                      thumbnailSwiperRef.current = swiper;
                    }}
                  >
                    {images.map((item) => (
                      <SwiperSlide
                        className={`slide${selectImage === item ? ' is-active' : ''}`}
                        key={item}
                        onClick={() => selectThumbnail(item)}
                      >
                        <img src={`${MainURL}/images/retreat/placeimage/${item}`} alt={detailData?.placeName || '수련회장소'} />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                )}
              </div>

              <div className="divider" />

              <div className="textrow">
                <h3>장소명</h3>
                <p>{detailData?.placeName || '-'}</p>
              </div>
              <div className="textrow">
                <h3>형태</h3>
                <p>{detailData?.sort || '-'}</p>
              </div>
              <div className="textrow">
                <h3>지역</h3>
                <p>{detailData?.region || '-'}</p>
              </div>
              <div className="textrow">
                <h3>위치</h3>
                <p>{detailData?.location || '-'}</p>
              </div>
              <div className="textrow">
                <h3>연락처</h3>
                {detailData?.phone ? (
                  <a href={`tel:${detailData.phone}`} className="textrow__link">
                    {detailData.phone}
                  </a>
                ) : (
                  <p>-</p>
                )}
              </div>
              <div className="textrow">
                <h3>크기</h3>
                <p>{detailData?.size || '-'}</p>
              </div>
              <div className="textrow">
                <h3>홈페이지</h3>
                {detailData?.homepage ? (
                  <a href={detailData.homepage} target="_blank" rel="noreferrer" className="textrow__link">
                    {detailData.homepage}
                  </a>
                ) : (
                  <p>-</p>
                )}
              </div>
              <div className="textrow">
                <h3>주소</h3>
                <p>{detailData?.address || '-'}</p>
              </div>

              <div className="maparea">
                {mapLoaded ? (
                  <div id="map" ref={mapElement} style={{ minHeight: '600px' }} />
                ) : (
                  <div style={{ minHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#aaa', background: '#f5f5f5' }}>
                    주소가 정확하지 않아 지도를 표시할 수 없습니다.
                  </div>
                )}
              </div>

              <div className="imagearea mobile">
                {images.map((item) => (
                  <div className="mobileimage" key={item}>
                    <img src={`${MainURL}/images/retreat/placeimage/${item}`} alt={detailData?.placeName || '수련회장소'} />
                  </div>
                ))}
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