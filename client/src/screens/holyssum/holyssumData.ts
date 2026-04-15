// 홀리썸 프로필 옵션 데이터

export const NICKNAME_OPTIONS_FEMALE = [
  '하와', '사라', '리브가', '라헬', '레아', '미리암', '드보라', '룻', '한나', '에스더',
  '요게벳', '마리아', '엘리사벳', '안나', '루디아', '다비다', '유니게', '로이스', '수산나', '요안나',
] as const;

export const NICKNAME_OPTIONS_MALE = [
  '아담', '노아', '이삭', '아브라함', '야곱', '요셉', '모세', '여호수아', '기드온', '삼손',
  '사무엘', '사울', '다윗', '솔로몬', '다니엘', '호세아', '요나', '베드로', '안드레', '야고보', '요한', '빌립', '바돌로매', '도마', '마태',
  '마가', '누가', '바울', '디모데', '스데반',
] as const;

export const DISPOSITION_OPTIONS = [
  '조용/차분',
  '밝고 활발',
  '리더형',
  '배려형',
  '현실적',
  '감성적',
] as const;

export const DATE_STYLE_OPTIONS = [
  '카페 대화',
  '산책',
  '맛집 탐방',
  '활동적인 데이트',
  '집에서 소소하게',
] as const;

export const PARTNER_ACTIVITY_OPTIONS = [
  '가정예배',
  '매일 기도',
  '봉사/사역',
  '선교/단기선교',
  '자유롭게',
] as const;

export const FAITH_PRIORITY_OPTIONS = [
  '말씀',
  '기도',
  '찬양',
  '공동체',
  '봉사/사역',
] as const;

export function parseJsonArray(val: string | string[] | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
