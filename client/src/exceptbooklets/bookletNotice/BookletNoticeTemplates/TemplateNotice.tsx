import { useState, useEffect } from 'react';
import MainURL from '../../../MainURL';
import { SermonFeaturedCard, type SermonItem } from './TemplateSermon';
import { galleryItemPreviewSrc, type NoticeGalleryItem } from './TemplateGallery';
import kakaologo from '../../../images/login/kakao.png';
import naverlogo from '../../../images/login/naver.png';
import naverbloglogo from '../../../images/naverblog.png';
import youtubelogo from '../../../images/Youtube_logo.png';
import instarlogo from '../../../images/instarlogo.jpeg';
import facebooklogo from '../../../images/facebook.png';

export interface WorshipTimesRow {
  worshipName: string;
  dayOfWeek?: string;
  time: string;
  place: string;
  notice: string;
}

export interface NoticeGreeting {
  sub: string;
  title: string;
  desc: string;
}

export interface NoticeIntroPostData {
  churchName?: string;
  address?: string;
  quiry?: string;
  youtube?: string;
  blog?: string;
  instar?: string;
  facebook?: string;
  placeNaver?: string;
  placeKakao?: string;
  mainPastor?: string;
  mainPastorImage?: string;
}

export interface TemplateNoticeProps {
  greeting: NoticeGreeting;
  worshipsTimes: WorshipTimesRow[];
  postData?: NoticeIntroPostData;
  sermonVideos?: SermonItem[];
  galleryPreviewItems?: { item: NoticeGalleryItem; index: number }[];
  onOpenGalleryTab?: () => void;
  onOpenSermonTab?: () => void;
  onOpenServersTab?: () => void;
}

function formatTimeForDisplay(timeStr: string): string {
  if (!timeStr || !timeStr.includes(':')) return '오전 11:00';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h || '11', 10);
  const minute = m?.padStart(2, '0') || '00';
  if (hour < 12) return `오전 ${hour}:${minute}`;
  if (hour === 12) return `오후 12:${minute}`;
  return `오후 ${hour - 12}:${minute}`;
}

/** 공백·하이픈 제거 후 `tel:` — 모바일에서 탭 시 전화 앱으로 연결 */
function telHrefFromQuiry(quiry: string): string | null {
  const digits = quiry.trim().replace(/[^\d+]/g, '');
  if (!digits) return null;
  return `tel:${digits}`;
}

function GalleryIntroSlider(props: {
  items: { item: NoticeGalleryItem; index: number }[];
  onOpenGalleryTab?: () => void;
}) {
  const { items, onOpenGalleryTab } = props;
  const slides = items.slice(0, 3);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="notice-create__preview-intro-gallery">
      <div className="notice-create__preview-intro-gallery-viewport" aria-roledescription="carousel">
        <div
          className="notice-create__preview-intro-gallery-track"
          style={{ transform: `translateX(-${slideIdx * 100}%)` }}
        >
          {slides.map(({ item, index }, i) => (
            <div key={item.id ?? `g-${index}-${i}`} className="notice-create__preview-intro-gallery-slide">
              <img src={galleryItemPreviewSrc(item)} alt={item.title || '갤러리'} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
      {slides.length > 1 ? (
        <div className="notice-create__preview-intro-gallery-dots" role="tablist" aria-label="갤러리 슬라이드">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === slideIdx}
              aria-label={`${i + 1}번째 사진`}
              className={i === slideIdx ? 'is-active' : undefined}
              onClick={() => setSlideIdx(i)}
            />
          ))}
        </div>
      ) : null}
      {onOpenGalleryTab ? (
        <button
          type="button"
          className="notice-create__preview-intro-nav-btn"
          onClick={onOpenGalleryTab}
        >
          더보기
        </button>
      ) : null}
    </div>
  );
}

/** BookletNoticeDetail 소개 탭 — NoticeCreate 미리보기(.notice-create__preview-*) 블록 */
export default function TemplateNotice({
  greeting,
  worshipsTimes,
  postData,
  sermonVideos = [],
  galleryPreviewItems = [],
  onOpenGalleryTab,
  onOpenSermonTab,
  onOpenServersTab,
}: TemplateNoticeProps) {
  const inquiryTelHref = postData?.quiry ? telHrefFromQuiry(postData.quiry) : null;

  return (
    <>
      <div className="notice-create__preview-welcome">
        <p className="notice-create__preview-welcome-sub">{greeting.sub}</p>
        <h2 className="notice-create__preview-welcome-title">{greeting.title}</h2>
        <p className="notice-create__preview-welcome-desc">
          {greeting.desc || (
            <span className="notice-create__preview-welcome-placeholder">
              하나님을 사랑하고 이웃을 내 몸과 같이 사랑하는 것을 삶으로 실천합니다. 따뜻한 환대와 깊이 있는 말씀이 있는 곳,{' '}
              {postData?.churchName || '교회'}에 오신 여러분을 환영합니다.
            </span>
          )}
        </p>
      </div>

      <div className="notice-create__preview-section-panel">
        <div className="notice-create__preview-section-label">
          <span className="notice-create__preview-chip-icon">🕐</span>
          예배 안내
        </div>
        {worshipsTimes.some((w) => w.worshipName || w.time || w.place) ? (
          <div className="notice-create__preview-worship-list">
            {worshipsTimes
              .filter((w) => w.worshipName || w.time || w.place)
              .map((w, i) => {
                const timeStr = formatTimeForDisplay(w.time || '');
                return (
                  <div key={i} className="notice-create__preview-worship-item">
                    <div className="notice-create__preview-worship-line notice-create__preview-worship-line--primary">
                      <span className="notice-create__preview-worship-name">{w.worshipName || '예배'}</span>
                      {timeStr ? (
                        <span className="notice-create__preview-worship-time">{timeStr}</span>
                      ) : null}
                    </div>
                    {(w.dayOfWeek || w.place) ? (
                      <div className="notice-create__preview-worship-line notice-create__preview-worship-line--meta">
                        {w.place ? <span className="notice-create__preview-worship-place">{w.place}</span> : null}
                        {w.dayOfWeek ? (
                          <span className="notice-create__preview-worship-day">{w.dayOfWeek}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="notice-create__preview-worship-empty">예배 정보를 입력해 주세요</p>
        )}
      </div>

      {(postData?.mainPastor || postData?.mainPastorImage) && (
        <div className="notice-create__preview-section-panel">
          <div className="notice-create__preview-section-label">
            <span className="notice-create__preview-chip-icon">👤</span>
            담임목사
          </div>
          <div className="notice-create__preview-pastor-snippet">
            {postData?.mainPastorImage ? (
              <div className="notice-create__preview-pastor-snippet-photo">
                <img
                  src={`${MainURL}/images/bookletnotice/pastors/${postData.mainPastorImage}`}
                  alt=""
                />
              </div>
            ) : null}
            {postData?.mainPastor ? (
              <p className="notice-create__preview-pastor-snippet-name">{postData.mainPastor}</p>
            ) : null}
          </div>
          {onOpenServersTab ? (
            <button type="button" className="notice-create__preview-intro-nav-btn" onClick={onOpenServersTab}>
              섬김이들 보기
            </button>
          ) : null}
        </div>
      )}

      {sermonVideos.length > 0 && (
        <div className="notice-create__preview-section-panel">
          <div className="notice-create__preview-section-label">
            <span className="notice-create__preview-chip-icon">🎬</span>
            설교영상
          </div>
          <SermonFeaturedCard featured={sermonVideos[0]} mainPastor={postData?.mainPastor} />
          {onOpenSermonTab ? (
            <button type="button" className="notice-create__preview-intro-nav-btn" onClick={onOpenSermonTab}>
              더보기
            </button>
          ) : null}
        </div>
      )}

      {galleryPreviewItems.length > 0 && (
        <div className="notice-create__preview-section-panel">
          <div className="notice-create__preview-section-label">
            <span className="notice-create__preview-chip-icon">📷</span>
            갤러리
          </div>
          <GalleryIntroSlider items={galleryPreviewItems} onOpenGalleryTab={onOpenGalleryTab} />
        </div>
      )}

      <div className="notice-create__preview-section-panel">
        <div className="notice-create__preview-section-label">
          <span className="notice-create__preview-chip-icon">📍</span>
          오시는길
        </div>
        <div className="notice-create__preview-chips notice-create__preview-chips--location-full">
          <div className="notice-create__preview-chip">
            <div>
              <p className="notice-create__preview-chip-label">주소</p>
              <p className="notice-create__preview-chip-value">{postData?.address || '서울시 강남구'}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="notice-create__preview-actions">
            <div className="notice-create__preview-btn-row">
              <a
                href={postData?.placeNaver || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="notice-create__preview-btn notice-create__preview-btn--naver"
              >
                <img src={naverlogo} alt="네이버" className="notice-create__preview-map-icon" />
                네이버 지도
              </a>
              <a
                href={postData?.placeKakao || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="notice-create__preview-btn notice-create__preview-btn--kakao"
              >
                <img src={kakaologo} alt="카카오" className="notice-create__preview-map-icon" />
                카카오 지도
              </a>
            </div>
            <div className="notice-create__preview-btn-row">
              {postData?.quiry && inquiryTelHref ? (
                <a
                  href={inquiryTelHref}
                  className="notice-create__preview-btn notice-create__preview-btn--secondary notice-create__preview-btn--inquiry"
                  aria-label="전화 연결"
                >
                  <span className="notice-create__preview-inquiry-phone">{postData.quiry}</span>
                  <span className="notice-create__preview-inquiry-label">📞 문의하기</span>
                </a>
              ) : (
                <div
                  className={`notice-create__preview-btn notice-create__preview-btn--secondary${
                    postData?.quiry ? ' notice-create__preview-btn--inquiry' : ''
                  }`}
                >
                  {postData?.quiry ? (
                    <>
                      <span className="notice-create__preview-inquiry-phone">{postData.quiry}</span>
                      <span className="notice-create__preview-inquiry-label">📞 문의하기</span>
                    </>
                  ) : (
                    '📞 문의하기'
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {(postData?.instar || postData?.youtube || postData?.facebook || postData?.blog) && (
        <div className="notice-create__preview-footer-sns notice-create__preview-footer-sns--above-location notice-create__preview-footer-sns--sns-centered">
          {postData?.instar && (
            <a href={postData.instar} target="_blank" rel="noopener noreferrer" aria-label="인스타그램">
              <img src={instarlogo} alt="" className="notice-create__preview-footer-blog-img" />
            </a>
          )}
          {postData?.youtube && (
            <a href={postData.youtube} target="_blank" rel="noopener noreferrer" aria-label="유튜브">
              <img src={youtubelogo} alt="" className="notice-create__preview-footer-blog-img" />
            </a>
          )}
          {postData?.facebook && (
            <a href={postData.facebook} target="_blank" rel="noopener noreferrer" aria-label="페이스북">
              <img src={facebooklogo} alt="" className="notice-create__preview-footer-blog-img" />
            </a>
          )}
          {postData?.blog && (
            <a href={postData.blog} target="_blank" rel="noopener noreferrer" aria-label="블로그">
              <img src={naverbloglogo} alt="" className="notice-create__preview-footer-blog-img" />
            </a>
          )}
        </div>
      )}

      <div className="notice-create__preview-footer">
        <p className="notice-create__preview-footer-info">
          {postData?.quiry && `${postData.quiry}`}
          {postData?.quiry && postData?.address && ' | '}
          {postData?.address}
          <br />© {new Date().getFullYear()} {postData?.churchName || '교회'} All Rights Reserved.
        </p>
      </div>
    </>
  );
}
