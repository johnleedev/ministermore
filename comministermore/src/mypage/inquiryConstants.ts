export const INQUIRY_CATEGORIES = [
  '오류 신고',
  '기능 제안',
  '이용 문의',
  '광고·제휴',
  '기타',
] as const;

export type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number];
