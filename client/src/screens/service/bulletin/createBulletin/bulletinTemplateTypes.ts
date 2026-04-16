/** 모바일 주보 에디터·미리보기에서 쓰는 식별자 */

export type BulletinTemplateId = 'classic' | 'modern' | 'minimal';

export const DEFAULT_BULLETIN_TEMPLATE: BulletinTemplateId = 'classic';

export type BulletinEditorTabId = 'main' | 'order' | 'news' | 'offering';

export const BULLETIN_EDITOR_TABS: { id: BulletinEditorTabId; label: string }[] = [
  { id: 'main', label: '메인' },
  { id: 'order', label: '예배순서' },
  { id: 'news', label: '교회소식' },
  { id: 'offering', label: '헌금자명단' },
];
