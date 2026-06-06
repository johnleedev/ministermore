import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MainURL from '../../../MainURL';
import '../place/Place.scss';
import './Casting.scss';

interface CastingDetailItem {
  id: number;
  sort: string;
  name: string;
  date: string;
  phone: string;
  profile: string;
  images: string | string[] | null;
}

const getImages = (images: CastingDetailItem['images']) => {
  if (!images) return [];
  if (Array.isArray(images)) return images;

  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [images];
  }
};

export default function CastingDetail() {
  const navigate = useNavigate();
  const url = new URL(window.location.href);
  const id = url.searchParams.get('id');
  const [detailData, setDetailData] = useState<CastingDetailItem>();

  const images = getImages(detailData?.images || null);

  const fetchPosts = useCallback(async () => {
    if (!id) return;

    try {
      const res = await axios.post(`${MainURL}/retreatcasting/getdatacastingpart`, {
        id,
      });

      if (res.data) {
        setDetailData(res.data[0]);
      }
    } catch (error) {
      console.error(error);
    }
  }, [id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url.href).then(() => {
      alert('현재 링크 주소가 복사되었습니다.');
    }).catch((err) => {
      console.error('복사에 실패했습니다.', err);
    });
  };

  if (!detailData) {
    return (
      <div className="retreat casting">
        <div className="inner">
          <main className="subpage__main">
            <div className="subpage__main__title">
              <h3>수련회강사</h3>
            </div>
            <div className="subpage__main__content">강사 정보를 불러오는 중입니다.</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="retreat casting">
      <div className="inner">
        <main className="subpage__main">
          <div className="subpage__main__title">
            <h3>{detailData.name}</h3>
            <div className="place__detail-actions">
              <button className="btn btn--secondary" type="button" onClick={() => navigate('/retreat/casting')}>
                목록으로
              </button>
              <button className="btn btn--primary" type="button" onClick={handleCopy}>
                공유하기
              </button>
            </div>
          </div>

          <div className="subpage__main__content">
            <div className="main__content casting-detail">
              <div className="textrow">
                <h3>구분</h3>
                <p>{detailData.sort}</p>
              </div>
              <div className="textrow">
                <h3>연락처</h3>
                {detailData.phone ? (
                  <a href={`tel:${detailData.phone}`} className="textrow__link">
                    {detailData.phone}
                  </a>
                ) : (
                  <p>-</p>
                )}
              </div>
              <div className="textrow">
                <h3>프로필</h3>
                <p style={{ whiteSpace: 'pre-line' }}>{detailData.profile}</p>
              </div>
              <div className="divider" />

              <div className="casting-detail__images">
                {images.length > 0 ? (
                  images.map((item) => (
                    <img src={`${MainURL}/images/retreat/castingimage/${item}`} alt={detailData.name} key={item} />
                  ))
                ) : (
                  <p>등록된 사진이 없습니다.</p>
                )}
              </div>

              <div className="casting-detail__notice">
                <h3>본 프로필과 사진은, 본인의 허락을 구한 후에, 올린 것입니다.</h3>
                <h3>업데이트 날짜: {detailData.date}</h3>
              </div>

              <div className="place__detail-actions place__detail-actions--bottom">
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Top
                </button>
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'auto' });
                    navigate('/retreat/casting');
                  }}
                >
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
