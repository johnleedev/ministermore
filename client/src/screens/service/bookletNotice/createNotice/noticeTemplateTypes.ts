export type NoticeTemplateId = 'classic' | 'modern' | 'minimal' | 'warm' | 'forest' | 'rose' | 'navy' | 'violet';

/** 소개 탭 내부 블록 (순서·색상이 템플릿별로 다름) */
export type IntroBlockId = 'greeting' | 'worship' | 'sns' | 'location' | 'mapActions';

export const INTRO_BLOCK_LABELS: Record<IntroBlockId, string> = {
  greeting: '소개 인사말',
  worship: '예배 안내',
  sns: 'SNS',
  location: '위치',
  mapActions: '지도·문의',
};

/** 템플릿별 소개 탭 블록 순서 */
export const TEMPLATE_INTRO_ORDER: Record<NoticeTemplateId, IntroBlockId[]> = {
  classic: ['greeting', 'worship', 'sns', 'location', 'mapActions'],
  modern: ['worship', 'greeting', 'sns', 'location', 'mapActions'],
  minimal: ['greeting', 'sns', 'location', 'worship', 'mapActions'],
  warm: ['greeting', 'worship', 'mapActions', 'sns', 'location'],
  forest: ['greeting', 'worship', 'sns', 'location', 'mapActions'],
  rose: ['greeting', 'worship', 'sns', 'location', 'mapActions'],
  navy: ['greeting', 'worship', 'sns', 'location', 'mapActions'],
  violet: ['greeting', 'worship', 'sns', 'location', 'mapActions'],
};

/** 템플릿별 소개 탭 색상 테마 (CSS 변수 또는 클래스용) */
export const TEMPLATE_INTRO_COLORS: Record<NoticeTemplateId, { primary: string; accent: string }> = {
  classic: { primary: '#475569', accent: '#334155' },
  modern: { primary: '#3b82f6', accent: '#1d4ed8' },
  minimal: { primary: '#64748b', accent: '#475569' },
  warm: { primary: '#d97706', accent: '#b45309' },
  forest: { primary: '#15803d', accent: '#166534' },
  rose: { primary: '#e11d48', accent: '#be123c' },
  navy: { primary: '#1e3a8a', accent: '#1e40af' },
  violet: { primary: '#7c3aed', accent: '#6d28d9' },
};
