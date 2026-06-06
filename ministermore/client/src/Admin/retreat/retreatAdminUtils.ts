export type ViewFilter = 'all' | 'visible' | 'hidden';

export const isRetreatVisible = (value: unknown) =>
  value === true || value === 1 || value === '1' || value === 'true';

export const parseRetreatImages = (images: string | string[] | null | undefined): string[] => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [images];
  }
};

export const CASTING_SORT_OPTIONS = ['설교자', '찬양사역자', '특강강사', '기타'];

export const PLACE_SORT_OPTIONS = ['기도원', '교회', '펜션', '수련원/수양관/연수원', '리조트/호텔'];

export const PLACE_REGION_OPTIONS = [
  '서울/경기도',
  '강원도',
  '대전/충청도',
  '광주/전라도',
  '대구/부산/경상도',
  '제주도',
];

export const PLACE_SIZE_OPTIONS = ['50명이하', '50~100명', '100명이상'];
