/** 모바일 주보 공개 페이지 · 에디터와 맞춘 데이터 형태 */

export type BulletinWorshipRow = {
  num: string;
  title: string;
  sub: string;
  /** 예: 09:00 */
  right: string;
};

export interface BulletinPostProps {
  id: number;
  churchName: string;
  bulletinTitle: string;
  /** YYYY-MM-DD */
  bulletinDate: string;
  /** Notice와 동일: JSON 배열 문자열 또는 단일 파일명 */
  imageMainName?: string;
  introText: string;
  newsText: string;
  worshipRows: BulletinWorshipRow[];
  /** 문의 (전화 등) */
  quiry?: string;
}

export function formatBulletinDateKo(isoDate: string): string {
  const t = (isoDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return t || '—';
  const [y, m, d] = t.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}
