import {
  COMMUNITY_REGION_OPTIONS,
  EVENTS_BOARD_CONFIG,
  FREE_BOARD_CONFIG,
  USED_BOARD_CONFIG,
} from '../../screens/board/boardConfigs';

export type PromptBoardKey = 'free' | 'events' | 'used' | 'notice';

export const PROMPT_BOARD_OPTIONS: {
  key: PromptBoardKey;
  label: string;
  categories: readonly string[];
  regions?: readonly string[];
}[] = [
  {
    key: 'free',
    label: '자유게시판',
    categories: FREE_BOARD_CONFIG.categoryOptions,
  },
  {
    key: 'events',
    label: '집회세미나',
    categories: EVENTS_BOARD_CONFIG.categoryOptions,
    regions: COMMUNITY_REGION_OPTIONS,
  },
  {
    key: 'used',
    label: '중고장터',
    categories: USED_BOARD_CONFIG.categoryOptions,
    regions: COMMUNITY_REGION_OPTIONS,
  },
  {
    key: 'notice',
    label: '공지사항',
    categories: ['공지', '안내', '이벤트', '점검'] as const,
  },
];

export const PROMPT_AGE_OPTIONS = ['20대', '30대', '40대', '50대', '60대 이상'] as const;

export const PROMPT_POSITION_OPTIONS = [
  '목사',
  '전도사',
  '사모',
  '장로',
  '평신도',
  '신학생',
  '간사',
] as const;

export const PROMPT_DIRECTION_OPTIONS = [
  { value: 'positive', label: '긍정' },
  { value: 'negative', label: '부정' },
  { value: 'neutral', label: '중립' },
] as const;

export const PROMPT_TONE_OPTIONS = ['진지하게', '친근하게', '간결하게', '상세하게'] as const;

export const PROMPT_LENGTH_OPTIONS = ['짧게 (200자 내외)', '보통 (500자 내외)', '길게 (1000자 내외)'] as const;

export type PromptFormState = {
  boardKey: PromptBoardKey;
  category: string;
  region: string;
  age: string;
  position: string;
  direction: string;
  tone: string;
  length: string;
  topic: string;
  extra: string;
};

export const DEFAULT_PROMPT_FORM: PromptFormState = {
  boardKey: 'free',
  category: '',
  region: '',
  age: '',
  position: '',
  direction: '',
  tone: '',
  length: '보통 (500자 내외)',
  topic: '',
  extra: '',
};

const directionGuide: Record<string, string> = {
  positive: '긍정적이고 희망적인 톤으로, 독려와 감사가 느껴지게',
  negative: '고민·어려움을 솔직히 드러내되, 비난·비방 없이 건설적으로',
  neutral: '객관적이고 차분한 톤으로 사실 중심으로',
};

export function buildClaudePrompt(form: PromptFormState): string {
  const board = PROMPT_BOARD_OPTIONS.find((b) => b.key === form.boardKey);
  const boardLabel = board?.label ?? '게시판';
  const directionLabel =
    PROMPT_DIRECTION_OPTIONS.find((d) => d.value === form.direction)?.label ?? '';

  const lines: string[] = [
    '당신은 한국 개신교 커뮤니티 게시판 글 작성 도우미입니다.',
    '아래 조건에 맞는 게시글 초안을 작성해주세요.',
    '',
    '## 게시판 정보',
    `- 게시판: ${boardLabel}`,
  ];

  if (form.category) lines.push(`- 구분: ${form.category}`);
  if (form.region) lines.push(`- 지역: ${form.region}`);

  lines.push('', '## 작성자 설정');
  if (form.age) lines.push(`- 연령: ${form.age}`);
  if (form.position) lines.push(`- 직분: ${form.position}`);
  if (form.direction) {
    lines.push(`- 글의 방향: ${directionLabel}`);
    lines.push(`  (${directionGuide[form.direction] ?? ''})`);
  }
  if (form.tone) lines.push(`- 문체: ${form.tone}`);
  if (form.length) lines.push(`- 분량: ${form.length}`);

  if (form.topic.trim()) {
    lines.push('', '## 주제', form.topic.trim());
  }

  if (form.extra.trim()) {
    lines.push('', '## 추가 요청', form.extra.trim());
  }

  lines.push(
    '',
    '## 출력 형식',
    '1. 제목: 한 줄 (최대 200자)',
    '2. 본문: 줄바꿈 포함 (최대 2000자)',
    '3. 실제 게시판에 바로 올릴 수 있도록 자연스러운 한국어로 작성',
    '4. 과장·허위 정보·비방·정치적 논쟁은 포함하지 말 것',
    '5. 종교적 신뢰감을 해치지 않는 표현 사용'
  );

  if (form.boardKey === 'used') {
    lines.push('6. 중고 거래 글이라면 물품 상태·거래 방식·연락 방법을 구체적으로');
  }
  if (form.boardKey === 'events') {
    lines.push('6. 집회·세미나 안내 글이라면 일시·장소·대상·신청 방법을 포함');
  }
  if (form.boardKey === 'notice') {
    lines.push('6. 공지사항이므로 간결하고 공식적인 안내 문체로');
  }

  return lines.join('\n');
}
