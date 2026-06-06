import type { BulletinPostProps } from './bulletinTypes';

const ROWS_DEFAULT = [
  { num: '1', title: '예배로 부름', sub: 'Call to Worship', right: '09:00' },
  { num: '2', title: '찬양과 기도', sub: 'Praise & Prayer', right: '09:10' },
  { num: '3', title: '말씀 선포', sub: 'Sermon Message', right: '09:30' },
];

export const BULLETIN_DEMO_DEFAULT: BulletinPostProps = {
  id: 1,
  churchName: '샘플 교회',
  bulletinTitle: '제 1주 주일예배',
  bulletinDate: '2026-04-15',
  imageMainName: '',
  introText:
    '주님 안에서 함께 예배하는 모든 분들을 환영합니다. 이번 주에도 말씀과 기도로 한 마음이 되기를 소망합니다.',
  newsText:
    '교회 소식: 새가족 환영 모임은 예배 후 본당에서 진행됩니다.\n헌금: 계좌 안내는 행정실로 문의해 주세요.',
  worshipRows: ROWS_DEFAULT,
  quiry: '02-1234-5678',
};

/** `?id=` 별 데모 (API 미연결 시) */
export const BULLETIN_DEMOS: Record<string, BulletinPostProps> = {
  '1': BULLETIN_DEMO_DEFAULT,
  '2': {
    ...BULLETIN_DEMO_DEFAULT,
    id: 2,
    churchName: '○○교회',
    bulletinTitle: '부활절 주일예배 주보',
    bulletinDate: '2026-04-20',
    introText: '부활의 기쁨을 함께 나누는 주일입니다.',
    newsText: '부활절 연합예배 안내: 오후 3시 본당.',
    worshipRows: [
      { num: '1', title: '찬양', sub: 'Praise', right: '10:00' },
      { num: '2', title: '말씀', sub: 'Message', right: '10:25' },
    ],
  },
};
