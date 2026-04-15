/** 모바일 주보 에디터·미리보기에서 쓰는 식별자 */

export type BulletinTemplateId = 'classic' | 'modern' | 'minimal';

export const DEFAULT_BULLETIN_TEMPLATE: BulletinTemplateId = 'classic';

export type BulletinEditorTabId = 'info' | 'order' | 'news';

export const BULLETIN_EDITOR_TABS: { id: BulletinEditorTabId; label: string }[] = [
  { id: 'info', label: '기본' },
  { id: 'order', label: '예배 순서' },
  { id: 'news', label: '안내' },
];
