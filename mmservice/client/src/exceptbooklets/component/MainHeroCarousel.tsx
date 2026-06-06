import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import './MainHeroCarousel.scss';

export type MainHeroCarouselProps = {
  imageSrcs: string[];
  /** 단일 이미지에도 붙는 img 클래스 (예: notice-create__preview-hero-img) */
  imgClassName?: string;
  /** 이미지 없을 때 */
  placeholder: React.ReactNode;
  /** 부모 히어로 영역을 꽉 채움 (absolute inset 0) */
  fill?: boolean;
  /** 폼 안 작은 미리보기 */
  compact?: boolean;
  /** 현재 슬라이드 URL을 새 탭에서만 보기 (전단지 상세 등) */
  showViewFullButton?: boolean;
  viewFullButtonLabel?: string;
};

export default function MainHeroCarousel({
  imageSrcs,
  imgClassName = '',
  placeholder,
  fill = false,
  compact = false,
  showViewFullButton = false,
  viewFullButtonLabel = '자세히보기',
}: MainHeroCarouselProps) {
  const slides = imageSrcs.filter(Boolean);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setIndex((i) => {
      if (slides.length === 0) return 0;
      return i >= slides.length ? 0 : i;
    });
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (slides.length <= 1 ? 0 : (i - 1 + slides.length) % slides.length));
  }, [slides.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (slides.length <= 1 ? 0 : (i + 1) % slides.length));
  }, [slides.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -48) goNext();
    else if (dx > 48) goPrev();
  };

  const rootClass = [
    'main-hero-carousel',
    fill && 'main-hero-carousel--fill',
    compact && 'main-hero-carousel--compact',
  ]
    .filter(Boolean)
    .join(' ');

  if (slides.length === 0) {
    return (
      <div className={rootClass}>
        <div className="main-hero-carousel__placeholder">{placeholder}</div>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <div
        className="main-hero-carousel__viewport"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="main-hero-carousel__track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((src, i) => (
            <div key={`${src}-${i}`} className="main-hero-carousel__slide">
              <img src={src} alt="" className={`main-hero-carousel__img ${imgClassName}`.trim()} />
            </div>
          ))}
        </div>
      </div>
      {showViewFullButton && slides[index] ? (
        <button
          type="button"
          className="main-hero-carousel__view-full"
          onClick={() => window.open(slides[index], '_blank', 'noopener,noreferrer')}
          aria-label={`${viewFullButtonLabel} — 새 창에서 이미지 보기`}
        >
          {viewFullButtonLabel}
        </button>
      ) : null}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="main-hero-carousel__arrow main-hero-carousel__arrow--prev"
            onClick={goPrev}
            aria-label="이전 이미지"
          >
            <IoIosArrowBack size={22} />
          </button>
          <button
            type="button"
            className="main-hero-carousel__arrow main-hero-carousel__arrow--next"
            onClick={goNext}
            aria-label="다음 이미지"
          >
            <IoIosArrowForward size={22} />
          </button>
          <div className="main-hero-carousel__dots">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`main-hero-carousel__dot${i === index ? ' main-hero-carousel__dot--active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`이미지 ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
